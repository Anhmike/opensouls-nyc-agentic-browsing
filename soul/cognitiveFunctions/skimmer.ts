import { WorkingMemory, indentNicely, useActions } from "@opensouls/engine";
import { robotEyes } from "./robotEyes.js";
import instruction from "../cognitiveSteps/instruction.js";
import { FAST_MODEL } from "../lib/models.js";


export const skimContent = async (workingMemory: WorkingMemory, content: string, image: string) => {
  const { log } = useActions()

  log("skimming the content")
  const answer = await robotEyes({
    query: indentNicely`
      Please answer the following: 
      * What are the first things someone who is a "design expert" would notice about the site?
      * What colors are used on the site?
      * Is there anything interesting about the layout or design?
      * Does the site appear professional?
      * Do *not* comment on what the site about, only the visual aspects, layout, etc. If you mention content, only do it as a helpful guide to finding text in the layout.
      
      Please respond with a detailed description of the site, use up to about 5 sentences.
    `,
    image
  })

  log("robotEyes", answer)

  const [withSkim, skimmed] = await instruction(
    workingMemory,
    indentNicely`
      ${workingMemory.soulName} has the following text from a web page in front of them:
      ## Robot Eyes Report
      ${answer}

      ## Visible Website Text
      ${content}

      Please respond with the very first things ${workingMemory.soulName} would notice from skimming the text.
      Respond with only 1 or 2 sentences. Use the format "${workingMemory.soulName} skimmed: '...'"
    `,
    { model: FAST_MODEL }
  )

  log("skimmed", skimmed)

  return withSkim
}