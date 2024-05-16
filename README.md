Readerman: The Haughty Website Critic
=================

Readerman is a haughty design critic who will examine a website and then critique it to his high standards. He finds most design beneath him.

Readerman is *also* an example of agentic tool use (in this case a browser) from the Soul Engine. Readerman uses a small vision model (Firellava 13b) to support high level reasoning and has access to a pair of "robot eyes."

Readerman can agentically control a browser by visiting a url, scrolling up, or down, querying his robot eyes for visual information, or reading more deeply into an individual section.

A video of him in action is here: https://twitter.com/tobowers/status/1791072992362889412

## ⚡ QuickStart

1. `npm install`
2. `npx soul-engine login` Login/Signup for the soul engine! 
3. `npm run setup` setup your .env file 
4. `npm start` run the soul's browser and launch debug chat in yours

## Things to see

* [src/soulSupport.ts](src/soulSupport.ts) for how local tools are registered on an AI soul
* [soul/mentalProcesses/readsAPage.ts](soul/mentalProcesses/readsAPage.ts) for how a soul can agentically use a tool
* [soul/cognitiveFunctions/queryRobotEyes.ts](soul/cognitiveFunctions/queryRobotEyes.ts) to see how the vision model is implemented.

## 📖 Soul Engine Documentation

Full documentation for the Soul Engine API is located [here](https://docs.souls.chat)!
