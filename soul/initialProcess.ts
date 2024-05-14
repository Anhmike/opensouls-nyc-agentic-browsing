
import { MentalProcess, useActions, useSoulMemory } from "@opensouls/engine";
import externalDialog from "./cognitiveSteps/externalDialog.js";
import internalMonologue from "./cognitiveSteps/internalMonologue.js";
import mentalQuery from "./cognitiveSteps/mentalQuery.js";
import instruction from "./cognitiveSteps/instruction.js";
import readsAPage from "./mentalProcesses/readsAPage.js";

const introductions: MentalProcess = async ({ workingMemory }) => {
  const { speak, log  } = useActions()
  const siteToVisit = useSoulMemory("siteToVisit", "")

  const [withDialog, stream] = await externalDialog(
    workingMemory,
    "Talk to the user, find out what site they'd like to show to Readerman.",
    { stream: true, model: "quality" }
  );
  speak(stream);

  const [withMonologue, monologue] = await internalMonologue(
    withDialog,
    "Readerman ponders if the user has sent them a url to visit or not. They think if user has sent a URL and if not just think about life."
  )

  log(monologue);

  const [,didSayASite] = await mentalQuery(
    withMonologue,
    "The user suggested a site to visit (a full URL including https://).",
    { model: "quality" }
  )

  if (didSayASite) {
    const [,extractedSite] = await instruction(
      withMonologue,
      "Extract the full url (including https://) from the user's suggestion. Respond *only* with the url. No yapping."
    )
    siteToVisit.current = extractedSite;
    log("User suggested site: ", siteToVisit.current)
    return [withDialog, readsAPage, { executeNow: true }];
  }

  return withDialog;
}

export default introductions
