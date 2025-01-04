export type ApiProvider =
	| "anthropic"
	| "openrouter"
	| "bedrock"
	| "vertex"
	| "openai"
	| "ollama"
	| "lmstudio"
	| "gemini"
	| "openai-native"
	| "deepseek"

export interface ApiHandlerOptions {
	apiModelId?: string
	apiKey?: string // anthropic
	anthropicBaseUrl?: string
	openRouterApiKey?: string
	openRouterModelId?: string
	openRouterModelInfo?: ModelInfo
	awsAccessKey?: string
	awsSecretKey?: string
	awsSessionToken?: string
	awsRegion?: string
	awsUseCrossRegionInference?: boolean
	vertexProjectId?: string
	vertexRegion?: string
	openAiBaseUrl?: string
	openAiApiKey?: string
	openAiModelId?: string
	ollamaModelId?: string
	ollamaBaseUrl?: string
	lmStudioModelId?: string
	lmStudioBaseUrl?: string
	geminiApiKey?: string
	openAiNativeApiKey?: string
	azureApiVersion?: string
	deepseekApiKey?: string
	deepseekBaseUrl?: string
	deepseekModelId?: string
}

export type DeepSeekConfig = {
	temperature?: number
	top_p?: number
	maxTokens?: number
	tokensUsed?: number
}

export type ApiConfiguration = ApiHandlerOptions & {
	apiProvider?: ApiProvider
	deepseek?: DeepSeekConfig
}

// Models

export interface ModelInfo {
  name: string
  provider: string
  maxTokens: number
  contextWindow: number
  contextLength?: number
  supportsImages: boolean
  supportsComputerUse: boolean
  supportsPromptCache: boolean
  inputPrice: number
  outputPrice: number
  inputCostPerMillionTokens?: number
  outputCostPerMillionTokens?: number
  tokensPerSecond?: number
  architecture?: string
  activatedParams?: number
  totalParams?: number
  cacheWritesPrice?: number
  cacheReadsPrice?: number
  description?: string
}

// Anthropic
// https://docs.anthropic.com/en/docs/about-claude/models
export type AnthropicModelId = keyof typeof anthropicModels
export const anthropicDefaultModelId: AnthropicModelId = "claude-3-5-sonnet-20241022"
export const anthropicModels = {
	"claude-3-5-sonnet-20241022": {
		name: "claude-3-5-sonnet-20241022",
		provider: "anthropic",
		maxTokens: 8192,
		contextWindow: 200_000,
		supportsImages: true,
		supportsComputerUse: true,
		supportsPromptCache: true,
		inputPrice: 3.0,
		outputPrice: 15.0,
		cacheWritesPrice: 3.75,
		cacheReadsPrice: 0.3,
	},
	"claude-3-5-haiku-20241022": {
		name: "claude-3-5-haiku-20241022",
		provider: "anthropic",
		maxTokens: 8192,
		contextWindow: 200_000,
		supportsImages: false,
		supportsComputerUse: true,
		supportsPromptCache: true,
		inputPrice: 1.0,
		outputPrice: 5.0,
		cacheWritesPrice: 1.25,
		cacheReadsPrice: 0.1,
	},
	"claude-3-opus-20240229": {
		name: "claude-3-opus-20240229",
		provider: "anthropic",
		maxTokens: 4096,
		contextWindow: 200_000,
		supportsImages: true,
		supportsComputerUse: true,
		supportsPromptCache: true,
		inputPrice: 15.0,
		outputPrice: 75.0,
		cacheWritesPrice: 18.75,
		cacheReadsPrice: 1.5,
	},
	"claude-3-haiku-20240307": {
		name: "claude-3-haiku-20240307",
		provider: "anthropic",
		maxTokens: 4096,
		contextWindow: 200_000,
		supportsImages: true,
		supportsComputerUse: true,
		supportsPromptCache: true,
		inputPrice: 0.25,
		outputPrice: 1.25,
		cacheWritesPrice: 0.3,
		cacheReadsPrice: 0.03,
	},
} as const satisfies Record<string, ModelInfo> // as const assertion makes the object deeply readonly

// AWS Bedrock
// https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html
export type BedrockModelId = keyof typeof bedrockModels
export const bedrockDefaultModelId: BedrockModelId = "anthropic.claude-3-5-sonnet-20241022-v2:0"
export const bedrockModels = {
	"anthropic.claude-3-5-sonnet-20241022-v2:0": {
		name: "anthropic.claude-3-5-sonnet-20241022-v2:0",
		provider: "bedrock",
		maxTokens: 8192,
		contextWindow: 200_000,
		supportsImages: true,
		supportsComputerUse: true,
		supportsPromptCache: false,
		inputPrice: 3.0,
		outputPrice: 15.0,
	},
	"anthropic.claude-3-5-haiku-20241022-v1:0": {
		name: "anthropic.claude-3-5-haiku-20241022-v1:0",
		provider: "bedrock",
		maxTokens: 8192,
		contextWindow: 200_000,
		supportsImages: false,
		supportsComputerUse: true,
		supportsPromptCache: false,
		inputPrice: 1.0,
		outputPrice: 5.0,
	},
	"anthropic.claude-3-5-sonnet-20240620-v1:0": {
		name: "anthropic.claude-3-5-sonnet-20240620-v1:0",
		provider: "bedrock",
		maxTokens: 8192,
		contextWindow: 200_000,
		supportsImages: true,
		supportsComputerUse: true,
		supportsPromptCache: false,
		inputPrice: 3.0,
		outputPrice: 15.0,
	},
	"anthropic.claude-3-opus-20240229-v1:0": {
		name: "anthropic.claude-3-opus-20240229-v1:0",
		provider: "bedrock",
		maxTokens: 4096,
		contextWindow: 200_000,
		supportsImages: true,
		supportsComputerUse: true,
		supportsPromptCache: false,
		inputPrice: 15.0,
		outputPrice: 75.0,
	},
	"anthropic.claude-3-sonnet-20240229-v1:0": {
		name: "anthropic.claude-3-sonnet-20240229-v1:0",
		provider: "bedrock",
		maxTokens: 4096,
		contextWindow: 200_000,
		supportsImages: true,
		supportsComputerUse: true,
		supportsPromptCache: false,
		inputPrice: 3.0,
		outputPrice: 15.0,
	},
	"anthropic.claude-3-haiku-20240307-v1:0": {
		name: "anthropic.claude-3-haiku-20240307-v1:0",
		provider: "bedrock",
		maxTokens: 4096,
		contextWindow: 200_000,
		supportsImages: true,
		supportsComputerUse: true,
		supportsPromptCache: false,
		inputPrice: 0.25,
		outputPrice: 1.25,
	},
} as const satisfies Record<string, ModelInfo>

export const azureOpenAiDefaultApiVersion = "2023-12-01-preview"

// OpenAI Native
export type OpenAiNativeModelId = keyof typeof openAiNativeModels
export const openAiNativeDefaultModelId: OpenAiNativeModelId = "gpt-4-turbo-preview"
export const openAiNativeModels = {
	"gpt-4-turbo-preview": {
		name: "gpt-4-turbo-preview",
		provider: "openai-native",
		maxTokens: 128_000,
		contextWindow: 128_000,
		supportsImages: true,
		supportsComputerUse: false,
		supportsPromptCache: false,
		inputPrice: 10.0,
		outputPrice: 30.0
	},
	"gpt-4": {
		name: "gpt-4",
		provider: "openai-native",
		maxTokens: 8192,
		contextWindow: 8192,
		supportsImages: true,
		supportsComputerUse: false,
		supportsPromptCache: false,
		inputPrice: 30.0,
		outputPrice: 60.0
	},
	"gpt-3.5-turbo": {
		name: "gpt-3.5-turbo",
		provider: "openai-native",
		maxTokens: 4096,
		contextWindow: 4096,
		supportsImages: false,
		supportsComputerUse: false,
		supportsPromptCache: false,
		inputPrice: 0.5,
		outputPrice: 1.5
	},
	"o1-preview": {
		name: "o1-preview",
		provider: "openai-native",
		maxTokens: 4096,
		contextWindow: 4096,
		supportsImages: false,
		supportsComputerUse: false,
		supportsPromptCache: false,
		inputPrice: 0.5,
		outputPrice: 1.5
	},
	"o1-mini": {
		name: "o1-mini",
		provider: "openai-native",
		maxTokens: 2048,
		contextWindow: 2048,
		supportsImages: false,
		supportsComputerUse: false,
		supportsPromptCache: false,
		inputPrice: 0.25,
		outputPrice: 0.75
	}
} as const satisfies Record<string, ModelInfo>

// OpenRouter
// https://openrouter.ai/models?order=newest&supported_parameters=tools
export const openRouterDefaultModelId = "anthropic/claude-3.5-sonnet:beta" // will always exist in openRouterModels
export const openRouterDefaultModelInfo: ModelInfo = {
	name: "claude-3.5-sonnet:beta",
	provider: "openrouter",
	maxTokens: 8192,
	contextWindow: 200_000,
	supportsImages: true,
	supportsComputerUse: true,
	supportsPromptCache: true,
	inputPrice: 3.0,
	outputPrice: 15.0,
	cacheWritesPrice: 3.75,
	cacheReadsPrice: 0.3,
	description:
		"The new Claude 3.5 Sonnet delivers better-than-Opus capabilities, faster-than-Sonnet speeds, at the same Sonnet prices. Sonnet is particularly good at:\n\n- Coding: New Sonnet scores ~49% on SWE-Bench Verified, higher than the last best score, and without any fancy prompt scaffolding\n- Data science: Augments human data science expertise; navigates unstructured data while using multiple tools for insights\n- Visual processing: excelling at interpreting charts, graphs, and images, accurately transcribing text to derive insights beyond just the text alone\n- Agentic tasks: exceptional tool use, making it great at agentic tasks (i.e. complex, multi-step problem solving tasks that require engaging with other systems)\n\n#multimodal\n\n_This is a faster endpoint, made available in collaboration with Anthropic, that is self-moderated: response moderation happens on the provider's side instead of OpenRouter's. For requests that pass moderation, it's identical to the [Standard](/anthropic/claude-3.5-sonnet) variant._",
}

// Vertex AI
// https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/use-claude
export type VertexModelId = keyof typeof vertexModels
export const vertexDefaultModelId: VertexModelId = "claude-3-5-sonnet-v2@20241022"
export const vertexModels = {
	"claude-3-5-sonnet-v2@20241022": {
		name: "claude-3-5-sonnet-v2@20241022",
		provider: "vertex",
		maxTokens: 8192,
		contextWindow: 200_000,
		supportsImages: true,
		supportsComputerUse: true,
		supportsPromptCache: false,
		inputPrice: 3.0,
		outputPrice: 15.0,
	},
	"claude-3-5-sonnet@20240620": {
		name: "claude-3-5-sonnet@20240620",
		provider: "vertex",
		maxTokens: 8192,
		contextWindow: 200_000,
		supportsImages: true,
		supportsComputerUse: true,
		supportsPromptCache: false,
		inputPrice: 3.0,
		outputPrice: 15.0,
	},
	"claude-3-5-haiku@20241022": {
		name: "claude-3-5-haiku@20241022",
		provider: "vertex",
		maxTokens: 8192,
		contextWindow: 200_000,
		supportsImages: false,
		supportsComputerUse: true,
		supportsPromptCache: false,
		inputPrice: 1.0,
		outputPrice: 5.0,
	},
	"claude-3-opus@20240229": {
		name: "claude-3-opus@20240229",
		provider: "vertex",
		maxTokens: 4096,
		contextWindow: 200_000,
		supportsImages: true,
		supportsComputerUse: true,
		supportsPromptCache: false,
		inputPrice: 15.0,
		outputPrice: 75.0,
	},
	"claude-3-haiku@20240307": {
		name: "claude-3-haiku@20240307",
		provider: "vertex",
		maxTokens: 4096,
		contextWindow: 200_000,
		supportsImages: true,
		supportsComputerUse: true,
		supportsPromptCache: false,
		inputPrice: 0.25,
		outputPrice: 1.25,
	},
} as const satisfies Record<string, ModelInfo>

// DeepSeek
export type DeepSeekModelId = "deepseek-chat" | "deepseek-coder"
export const deepseekDefaultModelId: DeepSeekModelId = "deepseek-chat"
export const deepseekModels = {
    "deepseek-chat": {
        name: "deepseek-chat",
        provider: "deepseek",
        maxTokens: 8192,
        contextWindow: 64_000,
        supportsImages: false,
        supportsComputerUse: true,
        supportsPromptCache: true,
        inputPrice: 0.14,          // Discounted cache miss price until Feb 8, 2025
        outputPrice: 0.28,         // Discounted price until Feb 8, 2025
        cacheReadsPrice: 0.014,    // Discounted cache hit price until Feb 8, 2025
        tokensPerSecond: 60,
        architecture: "MoE",
        activatedParams: 37_000_000_000,
        totalParams: 671_000_000_000,
        description: "DeepSeek-V3 Chat - 671B MoE model optimized for fast (60 tokens/sec) and high-quality responses."
    },
    "deepseek-coder": {
        name: "deepseek-coder",
        provider: "deepseek",
        maxTokens: 8192,
        contextWindow: 64_000,
        supportsImages: false,
        supportsComputerUse: true,
        supportsPromptCache: true,
        inputPrice: 0.14,          // Using same pricing as chat model
        outputPrice: 0.28,
        cacheReadsPrice: 0.014,
        tokensPerSecond: 60,
        architecture: "MoE",
        activatedParams: 37_000_000_000,
        totalParams: 671_000_000_000,
        description: "DeepSeek-V3 Coder - Specialized for programming tasks with enhanced capabilities."
    }
} as const satisfies Record<string, ModelInfo>

export const openAiModelInfoSaneDefaults: ModelInfo = {
	name: "default",
	provider: "openai",
	maxTokens: -1,
	contextWindow: 128_000,
	supportsImages: true,
	supportsComputerUse: false,
	supportsPromptCache: false,
	inputPrice: 0,
	outputPrice: 0,
}

// Gemini
// https://ai.google.dev/gemini-api/docs/models/gemini
export type GeminiModelId = keyof typeof geminiModels
export const geminiDefaultModelId: GeminiModelId = "gemini-2.0-flash-thinking-exp-1219"
export const geminiModels = {
	"gemini-2.0-flash-thinking-exp-1219": {
		name: "gemini-2.0-flash-thinking-exp-1219",
		provider: "gemini",
		maxTokens: 8192,
		contextWindow: 32_767,
		supportsImages: true,
		supportsComputerUse: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
	},
	"gemini-2.0-flash-exp": {
		name: "gemini-2.0-flash-exp",
		provider: "gemini",
		maxTokens: 8192,
		contextWindow: 1_048_576,
		supportsImages: true,
		supportsComputerUse: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
	},
	"gemini-exp-1206": {
		name: "gemini-exp-1206",
		provider: "gemini",
		maxTokens: 8192,
		contextWindow: 2_097_152,
		supportsImages: true,
		supportsComputerUse: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
	},
	"gemini-1.5-flash-002": {
		name: "gemini-1.5-flash-002",
		provider: "gemini",
		maxTokens: 8192,
		contextWindow: 1_048_576,
		supportsImages: true,
		supportsComputerUse: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
	},
	"gemini-1.5-flash-exp-0827": {
		name: "gemini-1.5-flash-exp-0827",
		provider: "gemini",
		maxTokens: 8192,
		contextWindow: 1_048_576,
		supportsImages: true,
		supportsComputerUse: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
	},
	"gemini-1.5-flash-8b-exp-0827": {
		name: "gemini-1.5-flash-8b-exp-0827",
		provider: "gemini",
		maxTokens: 8192,
		contextWindow: 1_048_576,
		supportsImages: true,
		supportsComputerUse: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
	},
	"gemini-1.5-pro-002": {
		name: "gemini-1.5-pro-002",
		provider: "gemini",
		maxTokens: 8192,
		contextWindow: 2_097_152,
		supportsImages: true,
		supportsComputerUse: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
	},
	"gemini-1.5-pro-exp-0827": {
		name: "gemini-1.5-pro-exp-0827",
		provider: "gemini",
		maxTokens: 8192,
		contextWindow: 2_097_152,
		supportsImages: true,
		supportsComputerUse: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
	},
	"gemini-1.0-pro": {
		name: "gemini-1.0-pro",
		provider: "gemini",
		maxTokens: 32768,
		contextWindow: 128_000,
		supportsImages: true,
		supportsComputerUse: false,
		supportsPromptCache: false,
		inputPrice: 15,
		outputPrice: 60,
	},
	"gemini-1.0-pro-vision": {
		name: "gemini-1.0-pro-vision",
		provider: "gemini",
		maxTokens: 65536,
		contextWindow: 128_000,
		supportsImages: true,
		supportsComputerUse: false,
		supportsPromptCache: false,
		inputPrice: 3,
		outputPrice: 12,
	},
	"gemini-1.0-pro-latest": {
		name: "gemini-1.0-pro-latest",
		provider: "gemini",
		maxTokens: 4096,
		contextWindow: 128_000,
		supportsImages: true,
		supportsComputerUse: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		outputCostPerMillionTokens: 15,
	},
	"gemini-1.0-pro-vision-latest": {
		name: "gemini-1.0-pro-vision-latest",
		provider: "gemini",
		maxTokens: 16384,
		contextWindow: 128_000,
		contextLength: 128_000,
		supportsImages: true,
		supportsComputerUse: false,
		supportsPromptCache: false,
		inputPrice: 0,
		outputPrice: 0,
		inputCostPerMillionTokens: 0.15,
		outputCostPerMillionTokens: 0.6,
	},
} as const satisfies Record<string, ModelInfo>
