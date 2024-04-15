import { ChatMessageRoleEnum, WorkingMemory, indentNicely } from "@opensouls/engine"
import instruction from "../cognitiveSteps/instruction.js"

export const robotEyes = async ({ query, image }: { query: string, image: string }) => {

  const robotEyeMan = new WorkingMemory({
    soulName: "robotEyes",
    memories: [
      {
        role: ChatMessageRoleEnum.System,
        content: indentNicely`
          You are a robotic vision assistant. Given an image, and a query, you must do your best to answer the query completely. Take as much text as is needed to concisely answer the query.  Sometimes the query might ask for emotional responses. In those cases, you should provide a response that is appropriate to the image as if a human were seeing it.
        `
      },
      {
        role: ChatMessageRoleEnum.User,
        content: [
          {
            type: "image_url",
            image_url: {
              url: image,
            }
          },
          {
            type: "text",
            text: `Here is the image provided by the user.`
          }
        ]
      }
    ]
  })

  const [, answer] = await instruction(
    robotEyeMan,
    indentNicely`
      Given the image, please answer the following query. Please be very precise, and succinct in your answers. The person querying does not have eyes, but can usually read the text from the image using screen reader software.

      ## Query
      > ${query}

      Please respond with only the precise, and succinct answer to the query. No prefacing, or additional information. No Yapping.
    `,
    {
      model: "exp/firellava-13b"
    }
  )

  return answer
}
