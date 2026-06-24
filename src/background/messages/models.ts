import type { PlasmoMessaging } from "@plasmohq/messaging"
import type { ModelsRequest, ModelsResponse } from "~/utils/types"
import { fetchFreeModels } from "~/utils/openrouter"

const handler: PlasmoMessaging.MessageHandler<
  ModelsRequest,
  ModelsResponse
> = async (req, res) => {
  try {
    const models = await fetchFreeModels(req.body.apiKey)
    res.send({ models })
  } catch (e) {
    res.send({ error: (e as Error).message })
  }
}

export default handler
