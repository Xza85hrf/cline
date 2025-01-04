import { ApiHandler } from "./index"
import { ModelInfo } from "../shared/api"

export interface ModelComparisonData {
  id: string
  name: string
  provider: string
  contextLength: number
  maxTokens: number
  inputCost: number
  outputCost: number
  tokensPerSecond?: number
  architecture?: string
  activatedParams?: number
  totalParams?: number
  supportsImages: boolean
  supportsComputerUse: boolean
  supportsPromptCache: boolean
}

export function getModelComparisonData(handlers: ApiHandler[]): ModelComparisonData[] {
  return handlers.map(handler => {
    const model = handler.getModel()
    return {
      id: model.id,
      name: model.info.name,
      provider: model.info.provider,
      contextLength: model.info.contextWindow,
      maxTokens: model.info.maxTokens,
      inputCost: model.info.inputPrice || 0,
      outputCost: model.info.outputPrice || 0,
      tokensPerSecond: model.info.tokensPerSecond,
      architecture: model.info.architecture,
      activatedParams: model.info.activatedParams,
      totalParams: model.info.totalParams,
      supportsImages: model.info.supportsImages,
      supportsComputerUse: model.info.supportsComputerUse,
      supportsPromptCache: model.info.supportsPromptCache
    }
  })
}

export function compareModels(models: ModelComparisonData[], criteria: Array<keyof ModelComparisonData> = ['contextLength', 'maxTokens', 'inputCost', 'outputCost', 'tokensPerSecond']): Record<string, any>[] {
  return models.map(model => {
    const comparison: Record<string, any> = {}
    criteria.forEach(criterion => {
      comparison[criterion] = model[criterion]
    })
    return {
      id: model.id,
      name: model.name,
      provider: model.provider,
      ...comparison
    }
  })
}

export function getModelCapabilities(model: ModelComparisonData): string[] {
  const capabilities: string[] = []
  
  if (model.supportsImages) {capabilities.push('Image Processing')}
  if (model.supportsComputerUse) {capabilities.push('Tool Use')}
  if (model.supportsPromptCache) {capabilities.push('Prompt Caching')}
  
  if (model.tokensPerSecond && model.tokensPerSecond >= 50) {capabilities.push('High Performance')}
  if (model.contextLength >= 100000) {capabilities.push('Long Context')}
  
  if (model.architecture === 'MoE') {
    capabilities.push('Mixture of Experts')
    if (model.activatedParams && model.totalParams) {
      capabilities.push(`${(model.activatedParams / 1e9).toFixed(1)}B Active / ${(model.totalParams / 1e9).toFixed(1)}B Total Parameters`)
    }
  }
  
  return capabilities
}
