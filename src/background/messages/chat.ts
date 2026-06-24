import type { PlasmoMessaging } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"
import type { ChatRequest, ChatResponse } from "~/utils/types"
import {
  DEFAULT_MODEL,
  STORAGE_KEY_API_KEY,
  STORAGE_KEY_MODEL,
} from "~/utils/constants"
import { chatCompletion } from "~/utils/openrouter"

const storage = new Storage()

const handler: PlasmoMessaging.MessageHandler<
  ChatRequest,
  ChatResponse
> = async (req, res) => {
  try {
    const apiKey = await storage.get<string>(STORAGE_KEY_API_KEY)
    if (!apiKey) {
      throw new Error(
        "No API key configured. Open the extension popup to add your OpenRouter key.",
      )
    }

    const model =
      (await storage.get<string>(STORAGE_KEY_MODEL)) ?? DEFAULT_MODEL

    const { context, history, message } = req.body

    const reply = await chatCompletion(apiKey, model, context, history, message)
    res.send({ reply })
  } catch (e) {
    res.send({ error: (e as Error).message })
  }
}

export default handler
