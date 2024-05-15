#!/usr/bin/env npx tsx
import "dotenv/config"
import { SoulBrowser } from "../src/soulSupport.js"

const soul = new SoulBrowser()

await soul.start()

process.on('SIGINT', async () => {
  await soul.stop()
  process.exit()
})
