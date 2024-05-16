import { WebLoader, createBrowser, htmlFromCleanElement } from '../src/browser.js'
import { Browser } from 'puppeteer'
import { htmlToMarkdown } from '../src/turndown.js'

describe('browser', () => {
  let browser: Browser
  
  before(async () => {
    browser = await createBrowser({ headless: false })
  })

  after(async () => {
    await browser.close()
  })

  it('should run in browser', async () => {
    const loader = new WebLoader({ browser })

    try {
      await loader.visit("https://en.wikipedia.org/wiki/Puthandu")

      await loader.screenshot("images/first.png")

      const visibleTree = await loader.captureVisibleHtmlTree()

      console.log(visibleTree)
      console.log(" PAGE DOWN --------------")
      await loader.pageDown()
      await loader.screenshot("images/second.png")

      console.log(htmlToMarkdown(await loader.captureVisibleHtmlTree()))

      await loader.pageUp()
      console.log(htmlToMarkdown(await loader.captureVisibleHtmlTree()))

    } catch(err) {
      console.error('error happened: ', err)
      await new Promise<void>((resolve) => setTimeout(resolve, 60_000))

    } finally {


      loader.close()
    }

  }).timeout(120_000)
})