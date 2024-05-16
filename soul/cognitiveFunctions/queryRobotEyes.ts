import { WorkingMemory, indentNicely, useActions, useSoulMemory } from "@opensouls/engine";
import instruction from "../cognitiveSteps/instruction.js";
import { robotEyes } from "./robotEyes.js";

export const queryRobotEyes = async (workingMemory: WorkingMemory, image: string) => {
  const { log } = useActions()

  const [,query] = await instruction(
    workingMemory,
    indentNicely`
      ${workingMemory.soulName} decided they want to query the robot eyes for more information. What do they want to know?
      Respond with a detailed query to send to ${workingMemory.soulName}'s robot eyes, asking very specific questions to answer.
    `,
    { model: "quality" }
  )

  log(`Querying robot eyes with: ${query}`)
  const answer = await robotEyes({ query, image })

  return {
    query,
    answer
  }
}
