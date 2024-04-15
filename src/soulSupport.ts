import { ActionEvent, Soul } from "@opensouls/engine"
import { WebLoader, createBrowser } from "./browser.js"
import { htmlToMarkdown } from "./turndown.js"

export class SoulBrowser {
  soul
  loader?: WebLoader

  constructor() {
    this.soul = new Soul({
      organization: "tobowers",
      blueprint: "readerman",
      soulId: "browser2",
      local: true,
      debug: true,
      token: process.env.SOUL_ENGINE_TOKEN,
    })
    this.soul.on("visit", this.onVisit.bind(this))
    this.soul.on("scrollDown", this.onScrollDown.bind(this))
    this.soul.on("scrollUp", this.onScrollUp.bind(this))
  }

  async start() {
    this.loader = new WebLoader({ browser: await createBrowser() })
    await this.soul.connect()
  }

  async stop() {
    await this.soul.disconnect()
    this.loader?.close()
  }

  async onVisit(evt: ActionEvent) {
    console.log("on visit event", await evt.content())
    await this.mustLoader().visit(await evt.content())
    const html = await this.mustLoader().captureVisibleHtmlTree()
    const markdown = htmlToMarkdown(html)

    const screenshot = await this.mustLoader().screenshot()

    this.soul.dispatch({
      action: "visited",
      content: `Readerman visited ${this.mustLoader().url}`,
      _metadata: {
        content: markdown,
        screenshot: `data:image/png;base64,${screenshot}`
      }
    })
  }

  async onScrollDown(_evt: ActionEvent) {
    await this.mustLoader().pageDown()
    const html = await this.mustLoader().captureVisibleHtmlTree()
    const markdown = htmlToMarkdown(html)
    const screenshot = await this.mustLoader().screenshot()

    this.soul.dispatch({
      action: "scrolledDown",
      content: `Readerman scrolled down`,
      _metadata: {
        screenshot: `data:image/png;base64,${screenshot}`,
        content: markdown,
      }
    })
  }

  async onScrollUp(_evt: ActionEvent) {
    await this.mustLoader().pageUp()
    const html = await this.mustLoader().captureVisibleHtmlTree()
    const markdown = htmlToMarkdown(html)
    const screenshot = await this.mustLoader().screenshot()

    this.soul.dispatch({
      action: "scrolledUp",
      content: `Readerman scrolled up`,
      _metadata: {
        screenshot: `data:image/png;base64,${screenshot}`,
        content: markdown,
      }
    })
  }

  private mustLoader() {
    if (!this.loader) {
      throw new Error("Loader not initialized")
    }
    return this.loader
  }

}