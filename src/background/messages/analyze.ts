import type { PlasmoMessaging } from "@plasmohq/messaging"
import type { AnalyzeRequest, AnalyzeResponse } from "~/utils/types"
import { analyzeCode } from "~/utils/openrouter"
import { getCredentials } from "~/background/credentials"

const analyzeHandler: PlasmoMessaging.MessageHandler<
  AnalyzeRequest,
  AnalyzeResponse
> = async (req, res) => {
  try {
    const { apiKey, model } = await getCredentials()
    const analysis = await analyzeCode(apiKey, model, req.body.context)
    res.send({ data: analysis })
  } catch (e) {
    res.send({ error: (e as Error).message })
  }
}

export default analyzeHandler
