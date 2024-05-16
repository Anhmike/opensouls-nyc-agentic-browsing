import { indentNicely } from "@opensouls/engine";
import { $ } from "execa";
import fs from "node:fs/promises";

const envFilePath = '.env';

try {
  await fs.access(envFilePath);
  console.log(`The file ${envFilePath} exists. Exiting...`);
  process.exit(0);
} catch (error) {
  console.log('setting up .env file');
}

const resp = await $`npx soul-engine apikey --json`

const { organization, apiKey } = JSON.parse(resp.stdout)

await fs.writeFile(envFilePath, indentNicely`
  SOUL_ENGINE_API_KEY=${apiKey}
  SOUL_ENGINE_ORGANIZATION=${organization}
`)
