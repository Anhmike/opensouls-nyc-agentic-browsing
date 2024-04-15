import { describe, it, beforeAll } from 'bun:test'
import { WebLoader, createBrowser, htmlFromCleanElement } from '../src/browser.js'
import { Browser } from 'puppeteer'
import { htmlToMarkdown } from '../src/turndown.js'

describe('browser', () => {
  let browser: Browser
  
  beforeAll(async () => {
    browser = await createBrowser()
  })

  it('should run in browser', async () => {
    const loader = new WebLoader({ url: "https://en.wikipedia.org/wiki/Puthandu", browser })

    const resp = await loader.visit()

    console.log(htmlToMarkdown(htmlFromCleanElement(resp)))
  }, {
    timeout: 30_000
  })
})