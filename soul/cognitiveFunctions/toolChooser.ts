import { WorkingMemory, indentNicely, useActions, useSoulMemory } from "@opensouls/engine";
import decision from "../cognitiveSteps/decision.js";
import { queryRobotEyes } from "./queryRobotEyes.js";

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
  const { log, dispatch } = useActions()
  const lastContent = useSoulMemory("lastContent", "")


  const [withToolChoice, toolChoice] = await decision(
    workingMemory,
    {
      description: indentNicely`
        ${workingMemory.soulName} has skimmed the webpage.
        They are now deciding what to do next. They have access to the following tools:
        * ${ToolPossibilities.scrollDown} - scrolls down the browser one window height. Keep in mind, there might be some text overlap with what they are currently reading.
        * ${ToolPossibilities.scrollUp} - scrolls up the browser one window height.
        * ${ToolPossibilities.queryRobotEyes} - ask Robot Eyes to analyze the page again, ${workingMemory.soulName} can ask specific questions about the page.
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
      dispatch({
        action: "scrollDown",
        content: ""
      })
      log("scroll down")
      return workingMemory
    case ToolPossibilities.scrollUp:
      dispatch({
        action: "scrollUp",
        content: ""
      })
      log("scroll up")
      return workingMemory
    case ToolPossibilities.queryRobotEyes:
      {
        log("querying robot eyes")
        const { query, answer } = await queryRobotEyes(workingMemory)
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
