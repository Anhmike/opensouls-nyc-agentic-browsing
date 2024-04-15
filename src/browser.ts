import { indentNicely } from "@opensouls/engine";
import puppeteer, { Browser, ElementHandle, Page, PuppeteerLaunchOptions } from "puppeteer";

export interface WebBrowserArgs {
  browser: Browser;
  url: string;
  waitFor?: string;
}

export const createBrowser = (opts: PuppeteerLaunchOptions = { headless: true }): Promise<Browser> => {
  return puppeteer.launch(opts)
}

export interface WebScrape {
  metadata: Record<string, any>;
  pageContent: string;
}

interface CleanElementStandin {
  tagName?: string;
  textContent?: string;
  role?: string | null;
  href?: string | null;
  src?: string | null;
  children: CleanElementStandin[];
}

export function htmlFromCleanElement(element: CleanElementStandin): string {
  if (!element.tagName) {
    return (element.textContent || '').trim();
  }

  const tagStuff = ` ${element.role ? `role="${element.role}"` : ''} ${element.href ? `href="${element.href}"` : ''} ${element.src ? `src="${element.src}"` : ''}`.trimEnd()

  return indentNicely`
    <${element.tagName?.toLowerCase() || 'div'}${tagStuff}>
      ${element.textContent || ''}${element.children.map(htmlFromCleanElement).join('\n')}
    </${element.tagName?.toLowerCase() || 'div'}>
  `
}

async function extractVisibleHtmlTree(page: Page) {
  page.on('console', (msg: any) => {
    console.log(msg.text())
  });
  
  return await page.evaluate(() => {
    const body = window.document.querySelector('body');
    if (!body) {
      throw new Error("No body element found");
    }

    const currentNode: CleanElementStandin = {
      tagName: body.tagName,
      children: [],
    }

    const isVisible = (el: Element) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const partiallyVisible = (rect.top < window.innerHeight && rect.bottom > 0) && (rect.left < window.innerWidth && rect.right > 0);
      const hasDimensions = rect.width > 0 || rect.height > 0;
      const displayVisible = style.display !== 'none';
      const visibilityVisible = style.visibility === 'visible';
    
      const visible = displayVisible && visibilityVisible && hasDimensions && partiallyVisible;
      if (!visible) {
        console.log(`Element hidden: ${el.tagName}, Display: ${style.display}, Visibility: ${style.visibility}, Rect: ${JSON.stringify(rect)}`);
      }
      return visible;
    }

    const isElement = (node: Node): node is Element => {
      return node.nodeType === Node.ELEMENT_NODE;
    }

    const walkDom = (node: Node, parent: CleanElementStandin): CleanElementStandin => {
      // console.log("walking", node.className, "with parent", parent.tagName, node.nodeName, node.nodeType, node.textContent?.trim())
      if (node.nodeType === Node.TEXT_NODE) {
        if (!node.textContent?.trim()) {
          return parent
        }
        console.log("pushing text content", node.textContent.trim())
        parent.children.push({
          textContent: node.textContent.trim(),
          children: [],
        });
        return parent
      }

      if (!isElement(node)) {
        return parent
      }

      if (!isVisible(node)) {
        return parent
      }

      if (node.childNodes.length > 1) {
        console.log("processing", node.className, "with more than one child element")
        const child: CleanElementStandin = {
          tagName: node.tagName,
          role: node.getAttribute('role'),
          children: [],
        };
        parent.children.push(child);
        Array.from(node.childNodes).forEach(childNode => walkDom(childNode, child));
        return parent
      }

      if (
        node.nodeName === 'IMG' || 
        node.nodeName === 'A' ||
        (Array.from(node.childNodes).every((child) => child.nodeType === Node.TEXT_NODE))
      ) {
        if (node.nodeName === 'A' && node.getAttribute('href')?.startsWith('#')) {
          return parent
        }

        const child: CleanElementStandin = {
          tagName: node.tagName,
          textContent: node.textContent?.trim() || "",
          href: node.getAttribute('href'),
          src: node.getAttribute('src'),
          role: node.getAttribute('role') || (node.tagName.toLowerCase() === 'a' && node.getAttribute('href') ? 'link' : undefined),
          children: [],
        };
        parent.children.push(child);
        return parent
      }

      if (node.childNodes.length === 0) {
        console.log(node.className, "no children, ignoring")
        return parent
      }

      console.log(node.className, "has one child element, removing it from the tree, but will walk down.")

      return walkDom(node.children[0], parent);
    }

    return walkDom(body, currentNode);
  });
}


export class WebLoader {
  browser: Browser;
  waitFor?: string;
  url: string;

  constructor({
    waitFor,
    browser,
    url,
  }: WebBrowserArgs) {
    this.browser = browser;
    this.waitFor = waitFor;
    this.url = url;
  }

  async visit() {
    const browser = this.browser;
    const page = await browser.newPage();
    try {
      // don't use a headless user agent since many sites will block that.
      await page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36")
      await page.setViewport({
        width: 1440,
        height: 900
      });
      await page.goto(this.url, { waitUntil: "domcontentloaded" });
      await new Promise((resolve) => setTimeout(resolve, 150));

      if (this.waitFor) {
        await page.waitForSelector(this.waitFor);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }


      const body = await page.$('body');
      if (!body) {
        throw new Error("No body element found");
      }
      const visible = await extractVisibleHtmlTree(page);

      // console.log("visible: ", visible);
      const screenshotPath = 'images/screenshot.png';
      await page.screenshot({ path: screenshotPath });
      console.log(`Screenshot saved to ${screenshotPath}`);
      return visible
    } catch (err) {
      console.error("error visiting: ", this.url, err);
      throw err
    } finally {
      await page.close();
    }
  }

}
