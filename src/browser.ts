import { indentNicely } from "@opensouls/engine";
import puppeteer, { Browser, ElementHandle, Page, PuppeteerLaunchOptions } from "puppeteer";

export interface WebBrowserArgs {
  browser: Browser;
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
      const partiallyVisible = (rect.top < window.innerHeight && rect.bottom >= 0) && (rect.left < window.innerWidth && rect.right >= -window.innerWidth);
      const hasDimensions = rect.width > 0 || rect.height > 0;
      const displayVisible = style.display !== 'none';
      const visibilityVisible = style.visibility === 'visible';
        
      const visible = displayVisible && visibilityVisible && hasDimensions && partiallyVisible;
      if (!visible) {
        console.log(`Element hidden: ${el.tagName}, Display: ${style.display}, Visibility: ${style.visibility}, Rect: ${JSON.stringify(rect)}, Window Height: ${window.innerHeight}, Window Width: ${window.innerWidth}`);
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
        // console.log("pushing text content", node.textContent.trim())
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
        // console.log("processing", node.className, "with more than one child element")
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
        // console.log(node.className, "no children, ignoring")
        return parent
      }

      // console.log(node.className, "has one child element, removing it from the tree, but will walk down.")

      return walkDom(node.children[0], parent);
    }

    return walkDom(body, currentNode);
  });
}


export class WebLoader {
  browser: Browser;
  waitFor?: string;
  url?: string;

  private page?: Page

  constructor({
    waitFor,
    browser,
  }: WebBrowserArgs) {
    this.browser = browser;
    this.waitFor = waitFor;
  }

  async visit(url: string) {
    const browser = this.browser;
    if (!this.page) {
      this.page = await browser.newPage();
    }
    const page = this.page
    this.url = url

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
    } catch (err) {
      console.error("error visiting: ", this.url, err);
      page.close()
      throw err
    }
  }

  async captureVisibleHtmlTree(): Promise<string> {
    return htmlFromCleanElement(await extractVisibleHtmlTree(this.mustPage()))
  }

  close() {
    if (this.page) {
      this.page.close();
      this.page = undefined;
    }
  }

  async screenshot(path?: string) {
    const resp = await this.mustPage().screenshot({ path: path, encoding: path ? 'binary' : 'base64'});
    console.log(`Screenshot saved to ${path}`);
    return resp
  }

  async pageDown() {
    this.mustPage().evaluate(() => {
      window.scrollBy(0, Math.floor(window.innerHeight * 0.90));
    })
  }

  async pageUp() {
    this.mustPage().evaluate(() => {
      window.scrollBy(0, -1 * window.innerHeight);
    })
  }

  private mustPage() {
    if (!this.page) {
      throw new Error("No page loaded");
    }
    return this.page;
  }

}
