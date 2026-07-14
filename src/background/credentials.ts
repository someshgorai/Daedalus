import { Storage } from "@plasmohq/storage"
import {
  DEFAULT_MODEL,
  STORAGE_KEY_API_KEY,
  STORAGE_KEY_MODEL,
} from "~/utils/constants"

const storage = new Storage()

export interface Credentials {
  apiKey: string
  model: string
}

export async function getCredentials(): Promise<Credentials> {
  const apiKey = await storage.get<string>(STORAGE_KEY_API_KEY)
  if (!apiKey) {
    throw new Error(
      "No API key configured. Open the extension popup to add your OpenRouter key.",
    )
  }

  const model =
    (await storage.get<string>(STORAGE_KEY_MODEL)) ?? DEFAULT_MODEL

  return { apiKey, model }
}
