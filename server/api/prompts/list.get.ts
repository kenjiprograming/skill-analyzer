import { PRESET_PROMPTS } from "~/config/prompts"

export default defineEventHandler(async (event) => {
  // プリセット一覧だけを返す
  return {
    prompts: PRESET_PROMPTS
  }
})
