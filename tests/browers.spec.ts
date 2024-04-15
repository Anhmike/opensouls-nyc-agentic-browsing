import { describe, it, beforeAll, afterAll } from 'bun:test'
import { WebLoader, createBrowser, htmlFromCleanElement } from '../src/browser.js'
import { Browser } from 'puppeteer'
import { htmlToMarkdown } from '../src/turndown.js'

describe('browser', () => {
  let browser: Browser
  
  beforeAll(async () => {
    browser = await createBrowser()
  })

  afterAll(async () => {
    await browser.close()
  })

  it('should run in browser', async () => {
    const loader = new WebLoader({ url: "https://en.wikipedia.org/wiki/Puthandu", browser })

    try {
      await loader.visit()

      await loader.screenshot("images/first.png")

      console.log(htmlToMarkdown(htmlFromCleanElement(await loader.captureVisibleHtmlTree())))
      console.log(" PAGE DOWN --------------")
      await loader.pageDown()
      await loader.screenshot("images/second.png")

      console.log(htmlToMarkdown(htmlFromCleanElement(await loader.captureVisibleHtmlTree())))
    } finally {
      loader.close()
    }

  }, {
    timeout: 30_000
  })
})