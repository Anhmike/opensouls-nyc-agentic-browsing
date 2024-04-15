
import { MentalProcess, indentNicely, useActions, usePerceptions, useProcessManager, useProcessMemory, useSoulMemory } from "@opensouls/engine";
import externalDialog from "../cognitiveSteps/externalDialog.js";
import { robotEyes } from "../cognitiveFunctions/robotEyes.js";
import instruction from "../cognitiveSteps/instruction.js";
import { toolChooser } from "../cognitiveFunctions/toolChooser.js";

export enum BrowserResponses {
  visited = "visited",
  scrolledDown = "scrolledDown",
  scrolledUp = "scrolledUp",
}

const browserResponses: string[] = Object.values(BrowserResponses);

const readsAPage: MentalProcess = async ({ workingMemory }) => {
  const { speak, dispatch, log } = useActions()
  const { invocationCount } = useProcessManager()
  const { invokingPerception } = usePerceptions()
  const siteToVisit = useSoulMemory("siteToVisit", "")
  const lastImage = useSoulMemory("lastImage", "")
  const lastContent = useSoulMemory("lastContent", "")

  const needsSkim = useSoulMemory("needsSkim", true)

  if (invocationCount === 0) {
    console.log("dispatching visit", siteToVisit.current)
    dispatch({
      action: "visit",
      content: siteToVisit.current,
    })
    const [withDialog, stream] = await externalDialog(
      workingMemory,
      "Let the user know readerman is about to read the page.",
      { stream: true, model: "quality" }
    );

    speak(stream);

    return withDialog
  }

  // if (!browserResponses.includes(invokingPerception?.action || "")) {
  //   const [withDialog, stream] = await externalDialog(
  //     workingMemory,
  //     "Let the user know you're busy, and you'll be with them in a sec.",
  //     { stream: true, model: "quality" }
  //   );

  //   speak(stream);
  //   return withDialog
  // }

  if (!invokingPerception) {
    throw new Error("no invoking perception")
  }

  if (invokingPerception._metadata?.screenshot) {
    lastImage.current = invokingPerception._metadata!.screenshot as string // base64 encoded image as data url
    lastContent.current = invokingPerception._metadata!.content as string
  }


  if (needsSkim.current) {
    const answer = await robotEyes({
      query: indentNicely`
        Please answer the following: 
        * What are the first things someone who loves learning would notice about the site?
        * What colors are used on the site?
        * Is there anything interesting about the layout or design?
        * Does the site appear professional?
      `,
      image: lastImage.current
    })
  
    log("robotEyes", answer)
  
    const [withSkim, skimmed] = await instruction(
      workingMemory,
      indentNicely`
        ${workingMemory.soulName} has the following text from a web page in front of them:
        ## Robot Eyes Report
        ${answer}
  
        ## Visible Website Text
        ${lastContent.current}
  
        Please respond with the very first things ${workingMemory.soulName} would notice from skimming the text.
        Respond with only 1 or 2 sentences. Use the format "${workingMemory.soulName} skimmed: '...'"
      `,
    )

    log("skimmed", skimmed)

    workingMemory = withSkim

    needsSkim.current = false
  }



  const afterToolChoice = await toolChooser(workingMemory)

  // TODO: tool choice!

  const [withExclamation, stream] = await externalDialog(
    afterToolChoice,
    `Exclaim something interesting about the page that ${workingMemory.soulName} finds super interesting.`,
    { stream: true, model: "gpt-4-turbo" }
  )
  speak(stream)

  return withExclamation
}

export default readsAPage
