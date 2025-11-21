
import { createError } from "h3"
import {process} from "std-env";
import { ANALYSIS_PROMPT } from "~/config/prompts"

interface RequestBody {
  text: string
}

interface AnthropicResponse {
  content: Array<{
    text: string
    type: string
  }>
  id: string
  model: string
  role: string
  stop_reason: string
  stop_sequence: null
  type: string
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

interface AnalysisResult {
  他責志向: number
  誠実性: number
  協調性: number
  柔軟性: number
  学習意欲: number
  楽観性: number
}

export default defineEventHandler(async (event) => {
  const { text }: RequestBody = await readBody(event)

  if (!text || text.trim().length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'テキストが必要です'
    })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'API keyが設定されていません'
    })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: ANALYSIS_PROMPT.replace('{TEXT}', text)
        }]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API error response:', errorText)
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data: AnthropicResponse = await response.json()

    if (!data.content || data.content.length === 0) {
      throw new Error('APIレスポンスにコンテンツが含まれていません')
    }

    const resultText = data.content[0].text.trim()

    // JSONのみを抽出（```json などを除去）
    const jsonMatch = resultText.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) {
      console.error('Invalid response format:', resultText)
      throw new Error('JSON形式の結果が取得できませんでした')
    }

    const parsedResult: AnalysisResult = JSON.parse(jsonMatch[0])

    // 結果の妥当性をチェック
    const requiredKeys = ['他責志向', '誠実性', '協調性', '柔軟性', '学習意欲', '楽観性']
    for (const key of requiredKeys) {
      if (!(key in parsedResult) || typeof parsedResult[key as keyof AnalysisResult] !== 'number') {
        throw new Error(`必要なスキル項目が不足しています: ${key}`)
      }
    }

    return parsedResult

  } catch (error) {
    console.error('Analysis error:', error)

    if (error instanceof SyntaxError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'APIレスポンスの解析に失敗しました'
      })
    }

    if (error instanceof Error && error.message.includes('API error:')) {
      throw createError({
        statusCode: 502,
        statusMessage: '外部APIエラーが発生しました'
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: '分析処理に失敗しました'
    })
  }
})
