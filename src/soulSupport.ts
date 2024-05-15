import { Soul } from "@opensouls/soul"
import { WebLoader, createBrowser } from "./browser.js"
import { htmlToMarkdown } from "./turndown.js"

export class SoulBrowser {
  soul
  loader?: WebLoader

  constructor() {
    if (!process.env.SOUL_ENGINE_API_KEY || !process.env.SOUL_ENGINE_ORGANIZATION) {
      throw new Error("Missing SOUL_ENGINE_API_KEY or SOUL_ENGINE_ORGANIZATION, check the readme on how to set these up.")
    }

    this.soul = new Soul({
      organization: process.env.SOUL_ENGINE_ORGANIZATION,
      blueprint: "readerman",
      soulId: "browser3",
      debug: true,
      token: process.env.SOUL_ENGINE_API_KEY,
    })

    this.soul.registerTool("visit", async ({ url }: { url: string}) => {
      console.log("visiting", url)
      await this.mustLoader().visit(url)
      return this.toolUseReturn()
    })

    this.soul.registerTool("scrollDown", async () => {
      console.log("scrollDown")
      await this.mustLoader().pageDown()
      return this.toolUseReturn()
    })

    this.soul.registerTool("scrollUp", async () => {
      console.log("scrollUp")
      await this.mustLoader().pageUp()
      return this.toolUseReturn()
    })

    // this.soul.on("visit", this.onVisit.bind(this))
    // this.soul.on("scrollDown", this.onScrollDown.bind(this))
    // this.soul.on("scrollUp", this.onScrollUp.bind(this))
  }

  private async toolUseReturn() {
    const html = await this.mustLoader().captureVisibleHtmlTree()
    const markdown = htmlToMarkdown(html)
    const screenshot = await this.mustLoader().screenshot()
    const [isAtTop, isAtBottom] = await Promise.all([
      this.mustLoader().isAtTop(),
      this.mustLoader().isAtBottom(),
    ])
    return {
      markdown,
      screenshot: `data:image/png;base64,${screenshot}`,
      isAtTop,
      isAtBottom,
    }
  }

  async start() {
    this.loader = new WebLoader({ browser: await createBrowser() })
    await this.soul.connect()
  }

  async stop() {
    await this.soul.disconnect()
    this.loader?.close()
  }

  // async onVisit(evt: ActionEvent) {
  //   console.log("on visit event", await evt.content())
  //   await this.mustLoader().visit(await evt.content())
  //   const html = await this.mustLoader().captureVisibleHtmlTree()
  //   const markdown = htmlToMarkdown(html)

  //   const screenshot = await this.mustLoader().screenshot()

  //   this.soul.dispatch({
  //     action: "visited",
  //     content: `Readerman visited ${this.mustLoader().url}`,
  //     _metadata: {
  //       content: markdown,
  //       screenshot: `data:image/png;base64,${screenshot}`
  //     }
  //   })
  // }

  // async onScrollDown(_evt: ActionEvent) {
  //   await this.mustLoader().pageDown()
  //   const html = await this.mustLoader().captureVisibleHtmlTree()
  //   const markdown = htmlToMarkdown(html)
  //   const screenshot = await this.mustLoader().screenshot()

  //   this.soul.dispatch({
  //     action: "scrolledDown",
  //     content: `Readerman scrolled down`,
  //     _metadata: {
  //       screenshot: `data:image/png;base64,${screenshot}`,
  //       content: markdown,
  //     }
  //   })
  // }

  // async onScrollUp(_evt: ActionEvent) {
  //   await this.mustLoader().pageUp()
  //   const html = await this.mustLoader().captureVisibleHtmlTree()
  //   const markdown = htmlToMarkdown(html)
  //   const screenshot = await this.mustLoader().screenshot()

  //   this.soul.dispatch({
  //     action: "scrolledUp",
  //     content: `Readerman scrolled up`,
  //     _metadata: {
  //       screenshot: `data:image/png;base64,${screenshot}`,
  //       content: markdown,
  //     }
  //   })
  // }

  private mustLoader() {
    if (!this.loader) {
      throw new Error("Loader not initialized")
    }
    return this.loader
  }

}