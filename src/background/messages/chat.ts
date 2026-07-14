import type { PlasmoMessaging } from "@plasmohq/messaging"
import type { ChatRequest, ChatResponse } from "~/utils/types"
import { chatCompletion } from "~/utils/openrouter"
import { getCredentials } from "~/background/credentials"

const chatHandler: PlasmoMessaging.MessageHandler<
  ChatRequest,
  ChatResponse
> = async (req, res) => {
  try {
    const { apiKey, model } = await getCredentials()
    const { context, history, message } = req.body
    const reply = await chatCompletion(apiKey, model, context, history, message)
    res.send({ reply })
  } catch (e) {
    res.send({ error: (e as Error).message })
  }
}

export default chatHandler
