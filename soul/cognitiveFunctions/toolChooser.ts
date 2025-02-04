import { WorkingMemory, indentNicely, useActions, useSoulMemory, useTool } from "@opensouls/engine";
import decision from "../cognitiveSteps/decision.js";
import { queryRobotEyes } from "./queryRobotEyes.js";
import { skimContent } from "./skimmer.js";
import { type BrowserReturn } from "../lib/toolUseReturnType.js";
import externalDialog from "../cognitiveSteps/externalDialog.js";
import { BIG_MODEL } from "../lib/models.js";

export enum ToolPossibilities {
  // visit = "visit",
  scrollDown = "scrollDown",
  scrollUp = "scrollUp",
  queryRobotEyes = "queryRobotEyes",
  readSectionText = "readSectionText",
  saySomething = "saySomething",
  none = "none",
}


export const toolChooser = async (workingMemory: WorkingMemory): Promise<WorkingMemory> => {
  const { log, speak } = useActions()
  const lastContent = useSoulMemory("lastContent", "")
  const lastImage = useSoulMemory("lastImage", "")

  const scrollDown = useTool<void, BrowserReturn>("scrollDown")
  const scrollUp = useTool<void, BrowserReturn>("scrollUp")

  const [, toolChoice] = await decision(
    workingMemory,
    {
      description: indentNicely`
        ${workingMemory.soulName} has skimmed the webpage.
        They are now deciding what to do next. They have access to the following tools:
        * ${ToolPossibilities.scrollDown} - scrolls down the browser one window height. Keep in mind, there might be some text overlap with what they are currently reading.
        * ${ToolPossibilities.scrollUp} - scrolls up the browser one window height.
        * ${ToolPossibilities.queryRobotEyes} - ask Robot Eyes to look at the page again. These are the same eyes that ${workingMemory.soulName} used to visually look at the page initially. They can answer questions about layout, color, etc.
        * ${ToolPossibilities.readSectionText} - read this section of the page carefully (get the full HTML). It will only change if ${workingMemory.soulName} scrolls down or up.
        * ${ToolPossibilities.saySomething} - pause reading the page for a sec, and say something to the interlocutor.
        
        If ${workingMemory.soulName} does not want to use any of those tools, they can choose ${ToolPossibilities.none} and stop reading the page.
      `,
      choices: ToolPossibilities,
    },
    {
      model: "gpt-4-turbo"
    }
  )

  switch (toolChoice) {
    case ToolPossibilities.scrollDown:
      {
        log("scroll down")
        const { markdown, screenshot, isAtBottom } = await scrollDown()
        lastContent.current = markdown

        const withSkim = await skimContent(
          workingMemory.withMonologue(indentNicely`
          ${workingMemory.soulName} scrolls down.
        `),
          markdown,
          screenshot,
        )
        if (isAtBottom) {
          log("at bottom")
          return withSkim
        }

        const [withIntermediate, stream] = await externalDialog(
          withSkim,
          "Exclaim an intermediate critique about the site, but mention you're going to keep looking",
          { model: BIG_MODEL, stream: true }
        )
        speak(stream)

        return toolChooser(withIntermediate)
      }
    case ToolPossibilities.scrollUp:
      {
        log("scroll up")
        const { markdown, screenshot, isAtTop } = await scrollUp()
        lastContent.current = markdown

        const withSkim = await skimContent(
          workingMemory.withMonologue(indentNicely`
          ${workingMemory.soulName} scrolls up.
        `),
          markdown,
          screenshot,
        )
        if (isAtTop) {
          log("at top")
          return withSkim
        }

        const [withIntermediate, stream] = await externalDialog(
          withSkim,
          "Exclaim an intermediate critique about the site, but mention you're going to keep looking",
          { model: BIG_MODEL, stream: true }
        )
        speak(stream)

        return toolChooser(withIntermediate)
      }
    case ToolPossibilities.queryRobotEyes:
      {
        log("querying robot eyes")
        const { query, answer } = await queryRobotEyes(workingMemory, lastImage.current)
        log("Q:", query, "A:", answer)
        return toolChooser(workingMemory.withMonologue(indentNicely`
          ${workingMemory.soulName} asked Robot Eyes:
          > ${query}
          
          ## Robot Eyes responded:
          ${answer}
        `))
      }
    case ToolPossibilities.readSectionText:
      log("reading more deeply")
      return toolChooser(workingMemory.withMonologue(indentNicely`
        ${workingMemory.soulName} decided to read this section of the page carefully.
        Here's what they read from this section of the page:
        ${lastContent.current}
      `))
    case ToolPossibilities.saySomething:
      log("say something")
      // todo: do something?
      return workingMemory
    default:
      log("stopping reading")
      return workingMemory
  }
}
