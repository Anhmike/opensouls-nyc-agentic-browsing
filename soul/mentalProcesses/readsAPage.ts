
import { MentalProcess, useActions, useProcessManager, useSoulMemory, useTool } from "@opensouls/engine";
import externalDialog from "../cognitiveSteps/externalDialog.js";
import { toolChooser } from "../cognitiveFunctions/toolChooser.js";
import { BIG_MODEL } from "../lib/models.js";
import { skimContent } from "../cognitiveFunctions/skimmer.js";

export enum BrowserResponses {
  visited = "visited",
  scrolledDown = "scrolledDown",
  scrolledUp = "scrolledUp",
}

const readsAPage: MentalProcess = async ({ workingMemory }) => {
  const { speak, log } = useActions()
  const { invocationCount } = useProcessManager()
  const siteToVisit = useSoulMemory("siteToVisit", "")
  const lastContent = useSoulMemory("lastContent", "")
  const visit = useTool<{ url: string }, { screenshot: string, markdown: string}>("visit")

  if (invocationCount === 0) {
    log("dispatching visit", siteToVisit.current)
    const [, stream] = await externalDialog(
      workingMemory,
      "Let the user know readerman is about to read the page.",
      { stream: true, model: BIG_MODEL }
    );
    speak(stream);

    log("dispatching visit", siteToVisit.current)
    const initialPage = await visit({ url: siteToVisit.current })

    log("after visit", siteToVisit.current)

    lastContent.current = initialPage.markdown

    log("skimming the content")
    
    const withSkim = await skimContent(workingMemory, initialPage.markdown, initialPage.screenshot)

    workingMemory = withSkim
  }

  const afterToolChoice = await toolChooser(workingMemory)

  const [withExclamation, stream] = await externalDialog(
    afterToolChoice,
    `Exclaim something interesting about the page that ${workingMemory.soulName} finds super interesting.`,
    { stream: true, model: BIG_MODEL }
  )
  speak(stream)

  return withExclamation
}

export default readsAPage
