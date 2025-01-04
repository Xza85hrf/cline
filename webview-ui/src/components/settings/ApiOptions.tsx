import { VSCodeDropdown, VSCodeLink, VSCodeOption, VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { Fragment, memo, useCallback, useEffect, useMemo, useState } from "react"
import styles from "./ApiOptions.module.css"
import { useEvent, useInterval } from "react-use"
import {
	ApiConfiguration,
	ModelInfo,
	anthropicDefaultModelId,
	anthropicModels,
	bedrockDefaultModelId,
	bedrockModels,
	deepseekDefaultModelId,
	deepseekModels,
	geminiDefaultModelId,
	geminiModels,
	openAiModelInfoSaneDefaults,
	openAiNativeDefaultModelId,
	openAiNativeModels,
	openRouterDefaultModelId,
	openRouterDefaultModelInfo,
	vertexDefaultModelId,
	vertexModels,
} from "../../shared/api"
import { ExtensionMessage } from "../../shared/ExtensionMessage"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { vscode } from "../../utils/vscode"
import { ModelDescriptionMarkdown } from "./OpenRouterModelPicker"

interface ApiOptionsProps {
	showModelOptions: boolean
	apiErrorMessage?: string
	modelIdErrorMessage?: string
}

export function normalizeApiConfiguration(apiConfiguration?: ApiConfiguration) {
	const provider = apiConfiguration?.apiProvider || "deepseek"
	const modelId = apiConfiguration?.apiModelId

	const getProviderData = (models: Record<string, ModelInfo>, defaultId: string) => {
		let selectedModelId: string
		let selectedModelInfo: ModelInfo
		if (modelId && modelId in models) {
			selectedModelId = modelId
			selectedModelInfo = models[modelId]
		} else {
			selectedModelId = defaultId
			selectedModelInfo = models[defaultId]
		}
		return { selectedProvider: provider, selectedModelId, selectedModelInfo }
	}

	switch (provider) {
		case "deepseek":
			return {
				selectedProvider: provider,
				selectedModelId: apiConfiguration?.apiModelId || deepseekDefaultModelId,
				selectedModelInfo: deepseekModels[apiConfiguration?.apiModelId as keyof typeof deepseekModels] || deepseekModels[deepseekDefaultModelId]
			}
		case "anthropic":
			return getProviderData(anthropicModels, anthropicDefaultModelId)
		case "bedrock":
			return getProviderData(bedrockModels, bedrockDefaultModelId)
		case "vertex":
			return getProviderData(vertexModels, vertexDefaultModelId)
		case "gemini":
			return getProviderData(geminiModels, geminiDefaultModelId)
		case "openai-native":
			return getProviderData(openAiNativeModels, openAiNativeDefaultModelId)
		case "openrouter":
			return {
				selectedProvider: provider,
				selectedModelId: apiConfiguration?.openRouterModelId || openRouterDefaultModelId,
				selectedModelInfo: apiConfiguration?.openRouterModelInfo || openRouterDefaultModelInfo,
			}
		case "openai":
			return {
				selectedProvider: provider,
				selectedModelId: apiConfiguration?.openAiModelId || "",
				selectedModelInfo: openAiModelInfoSaneDefaults,
			}
		case "ollama":
			return {
				selectedProvider: provider,
				selectedModelId: apiConfiguration?.ollamaModelId || "",
				selectedModelInfo: openAiModelInfoSaneDefaults,
			}
		case "lmstudio":
			return {
				selectedProvider: provider,
				selectedModelId: apiConfiguration?.lmStudioModelId || "",
				selectedModelInfo: openAiModelInfoSaneDefaults,
			}
		default:
			return getProviderData(anthropicModels, anthropicDefaultModelId)
	}
}

const ApiOptions = ({ showModelOptions, apiErrorMessage, modelIdErrorMessage }: ApiOptionsProps) => {
	const { apiConfiguration, setApiConfiguration } = useExtensionState()
	const [ollamaModels, setOllamaModels] = useState<string[]>([])
	const [lmStudioModels, setLmStudioModels] = useState<string[]>([])
	const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

	const handleInputChange = (field: keyof ApiConfiguration) => (event: any) => {
		const updatedConfig = { ...apiConfiguration, [field]: event.target.value }
		setApiConfiguration(updatedConfig)
		// Send the updated configuration to VSCode
		vscode.postMessage({
			type: "apiConfiguration",
			apiConfiguration: updatedConfig,
		})
	}

	const { selectedProvider, selectedModelId, selectedModelInfo } = useMemo(() => {
		return normalizeApiConfiguration(apiConfiguration)
	}, [apiConfiguration])

	// Poll ollama/lmstudio models
	const requestLocalModels = useCallback(() => {
		if (selectedProvider === "ollama") {
			vscode.postMessage({ type: "requestOllamaModels", text: apiConfiguration?.ollamaBaseUrl })
		} else if (selectedProvider === "lmstudio") {
			vscode.postMessage({ type: "requestLmStudioModels", text: apiConfiguration?.lmStudioBaseUrl })
		}
	}, [selectedProvider, apiConfiguration?.ollamaBaseUrl, apiConfiguration?.lmStudioBaseUrl])

	useEffect(() => {
		if (selectedProvider === "ollama" || selectedProvider === "lmstudio") {
			requestLocalModels()
		}
	}, [selectedProvider, requestLocalModels])

	useInterval(requestLocalModels, selectedProvider === "ollama" || selectedProvider === "lmstudio" ? 2000 : null)

	const handleMessage = useCallback((event: MessageEvent<ExtensionMessage>) => {
		const message = event.data
		if (message.type === "ollamaModels" && message.ollamaModels) {
			setOllamaModels(message.ollamaModels)
		} else if (message.type === "lmStudioModels" && message.lmStudioModels) {
			setLmStudioModels(message.lmStudioModels)
		}
	}, [])

	useEvent("message", handleMessage)

	return (
		<div className={styles.container}>
			<div className="dropdown-container">
				<label htmlFor="api-provider">
					<span className={styles.labelText}>API Provider</span>
				</label>
				<VSCodeDropdown
					id="api-provider"
					value={selectedProvider}
					onChange={handleInputChange("apiProvider")}
					className={styles.modelPickerDropdown}>
					<VSCodeOption value="deepseek">DeepSeek</VSCodeOption>
					<VSCodeOption value="anthropic">Anthropic</VSCodeOption>
					<VSCodeOption value="openrouter">OpenRouter</VSCodeOption>
					<VSCodeOption value="gemini">Google Gemini</VSCodeOption>
					<VSCodeOption value="vertex">GCP Vertex AI</VSCodeOption>
					<VSCodeOption value="bedrock">AWS Bedrock</VSCodeOption>
					<VSCodeOption value="openai-native">OpenAI</VSCodeOption>
					<VSCodeOption value="openai">OpenAI Compatible</VSCodeOption>
					<VSCodeOption value="lmstudio">LM Studio</VSCodeOption>
					<VSCodeOption value="ollama">Ollama</VSCodeOption>
				</VSCodeDropdown>
			</div>

			{selectedProvider === "ollama" && (
				<div>
					<VSCodeTextField
						value={apiConfiguration?.ollamaBaseUrl || ""}
						className={styles.fullWidth}
						type="url"
						onInput={handleInputChange("ollamaBaseUrl")}
						placeholder="http://localhost:11434">
						<span className={styles.labelText}>Base URL</span>
					</VSCodeTextField>
					<div className="dropdown-container">
						<label htmlFor="ollama-model">
							<span className={styles.labelText}>Model</span>
						</label>
						<VSCodeDropdown
							id="ollama-model"
							value={apiConfiguration?.ollamaModelId || ""}
							onChange={handleInputChange("ollamaModelId")}
							className={styles.fullWidth}>
							{ollamaModels.map((model) => (
								<VSCodeOption key={model} value={model}>
									{model}
								</VSCodeOption>
							))}
						</VSCodeDropdown>
					</div>
					{showModelOptions && (
						<ModelInfoView
							selectedModelId={selectedModelId}
							modelInfo={selectedModelInfo}
							isDescriptionExpanded={isDescriptionExpanded}
							setIsDescriptionExpanded={setIsDescriptionExpanded}
						/>
					)}
				</div>
			)}

			{selectedProvider === "lmstudio" && (
				<div>
					<VSCodeTextField
						value={apiConfiguration?.lmStudioBaseUrl || ""}
						className={styles.fullWidth}
						type="url"
						onInput={handleInputChange("lmStudioBaseUrl")}
						placeholder="http://localhost:1234">
						<span className={styles.labelText}>Base URL</span>
					</VSCodeTextField>
					<div className="dropdown-container">
						<label htmlFor="lmstudio-model">
							<span className={styles.labelText}>Model</span>
						</label>
						<VSCodeDropdown
							id="lmstudio-model"
							value={apiConfiguration?.lmStudioModelId || ""}
							onChange={handleInputChange("lmStudioModelId")}
							className={styles.fullWidth}>
							{lmStudioModels.map((model) => (
								<VSCodeOption key={model} value={model}>
									{model}
								</VSCodeOption>
							))}
						</VSCodeDropdown>
					</div>
					{showModelOptions && (
						<ModelInfoView
							selectedModelId={selectedModelId}
							modelInfo={selectedModelInfo}
							isDescriptionExpanded={isDescriptionExpanded}
							setIsDescriptionExpanded={setIsDescriptionExpanded}
						/>
					)}
				</div>
			)}

			{selectedProvider === "anthropic" && (
				<div>
					<VSCodeTextField
						value={apiConfiguration?.apiKey || ""}
						className={styles.fullWidth}
						type="password"
						onInput={handleInputChange("apiKey")}
						placeholder="Enter API Key...">
						<span className={styles.labelText}>Anthropic API Key</span>
					</VSCodeTextField>
					<VSCodeTextField
						value={apiConfiguration?.anthropicBaseUrl || ""}
						className={styles.fullWidth}
						type="url"
						onInput={handleInputChange("anthropicBaseUrl")}
						placeholder="Enter base URL...">
						<span className={styles.labelText}>Base URL (optional)</span>
					</VSCodeTextField>
					<div className="dropdown-container">
						<label htmlFor="anthropic-model">
							<span className={styles.labelText}>Model</span>
						</label>
						<VSCodeDropdown
							id="anthropic-model"
							value={apiConfiguration?.apiModelId || anthropicDefaultModelId}
							onChange={handleInputChange("apiModelId")}
							className={styles.fullWidth}>
							{Object.keys(anthropicModels).map((modelId) => (
								<VSCodeOption key={modelId} value={modelId}>
									{modelId}
								</VSCodeOption>
							))}
						</VSCodeDropdown>
					</div>
					{showModelOptions && (
						<ModelInfoView
							selectedModelId={selectedModelId}
							modelInfo={selectedModelInfo}
							isDescriptionExpanded={isDescriptionExpanded}
							setIsDescriptionExpanded={setIsDescriptionExpanded}
						/>
					)}
				</div>
			)}

			{selectedProvider === "bedrock" && (
				<div>
					<VSCodeTextField
						value={apiConfiguration?.awsAccessKey || ""}
						className={styles.fullWidth}
						type="password"
						onInput={handleInputChange("awsAccessKey")}
						placeholder="Enter AWS Access Key...">
						<span className={styles.labelText}>AWS Access Key</span>
					</VSCodeTextField>
					<VSCodeTextField
						value={apiConfiguration?.awsSecretKey || ""}
						className={styles.fullWidth}
						type="password"
						onInput={handleInputChange("awsSecretKey")}
						placeholder="Enter AWS Secret Key...">
						<span className={styles.labelText}>AWS Secret Key</span>
					</VSCodeTextField>
					<VSCodeTextField
						value={apiConfiguration?.awsSessionToken || ""}
						className={styles.fullWidth}
						type="password"
						onInput={handleInputChange("awsSessionToken")}
						placeholder="Enter AWS Session Token (optional)...">
						<span className={styles.labelText}>AWS Session Token (optional)</span>
					</VSCodeTextField>
					<VSCodeTextField
						value={apiConfiguration?.awsRegion || ""}
						className={styles.fullWidth}
						onInput={handleInputChange("awsRegion")}
						placeholder="Enter AWS Region...">
						<span className={styles.labelText}>AWS Region</span>
					</VSCodeTextField>
					<div className="dropdown-container">
						<label htmlFor="bedrock-model">
							<span className={styles.labelText}>Model</span>
						</label>
						<VSCodeDropdown
							id="bedrock-model"
							value={apiConfiguration?.apiModelId || bedrockDefaultModelId}
							onChange={handleInputChange("apiModelId")}
							className={styles.fullWidth}>
							{Object.keys(bedrockModels).map((modelId) => (
								<VSCodeOption key={modelId} value={modelId}>
									{modelId}
								</VSCodeOption>
							))}
						</VSCodeDropdown>
					</div>
					{showModelOptions && (
						<ModelInfoView
							selectedModelId={selectedModelId}
							modelInfo={selectedModelInfo}
							isDescriptionExpanded={isDescriptionExpanded}
							setIsDescriptionExpanded={setIsDescriptionExpanded}
						/>
					)}
				</div>
			)}

			{selectedProvider === "vertex" && (
				<div>
					<VSCodeTextField
						value={apiConfiguration?.vertexProjectId || ""}
						className={styles.fullWidth}
						onInput={handleInputChange("vertexProjectId")}
						placeholder="Enter Project ID...">
						<span className={styles.labelText}>Project ID</span>
					</VSCodeTextField>
					<VSCodeTextField
						value={apiConfiguration?.vertexRegion || ""}
						className={styles.fullWidth}
						onInput={handleInputChange("vertexRegion")}
						placeholder="Enter Region...">
						<span className={styles.labelText}>Region</span>
					</VSCodeTextField>
					<div className="dropdown-container">
						<label htmlFor="vertex-model">
							<span className={styles.labelText}>Model</span>
						</label>
						<VSCodeDropdown
							id="vertex-model"
							value={apiConfiguration?.apiModelId || vertexDefaultModelId}
							onChange={handleInputChange("apiModelId")}
							className={styles.fullWidth}>
							{Object.keys(vertexModels).map((modelId) => (
								<VSCodeOption key={modelId} value={modelId}>
									{modelId}
								</VSCodeOption>
							))}
						</VSCodeDropdown>
					</div>
					{showModelOptions && (
						<ModelInfoView
							selectedModelId={selectedModelId}
							modelInfo={selectedModelInfo}
							isDescriptionExpanded={isDescriptionExpanded}
							setIsDescriptionExpanded={setIsDescriptionExpanded}
						/>
					)}
				</div>
			)}

			{selectedProvider === "gemini" && (
				<div>
					<VSCodeTextField
						value={apiConfiguration?.geminiApiKey || ""}
						className={styles.fullWidth}
						type="password"
						onInput={handleInputChange("geminiApiKey")}
						placeholder="Enter API Key...">
						<span className={styles.labelText}>Gemini API Key</span>
					</VSCodeTextField>
					<div className="dropdown-container">
						<label htmlFor="gemini-model">
							<span className={styles.labelText}>Model</span>
						</label>
						<VSCodeDropdown
							id="gemini-model"
							value={apiConfiguration?.apiModelId || geminiDefaultModelId}
							onChange={handleInputChange("apiModelId")}
							className={styles.fullWidth}>
							{Object.keys(geminiModels).map((modelId) => (
								<VSCodeOption key={modelId} value={modelId}>
									{modelId}
								</VSCodeOption>
							))}
						</VSCodeDropdown>
					</div>
					{showModelOptions && (
						<ModelInfoView
							selectedModelId={selectedModelId}
							modelInfo={selectedModelInfo}
							isDescriptionExpanded={isDescriptionExpanded}
							setIsDescriptionExpanded={setIsDescriptionExpanded}
						/>
					)}
				</div>
			)}

			{selectedProvider === "openai-native" && (
				<div>
					<VSCodeTextField
						value={apiConfiguration?.openAiNativeApiKey || ""}
						className={styles.fullWidth}
						type="password"
						onInput={handleInputChange("openAiNativeApiKey")}
						placeholder="Enter API Key...">
						<span className={styles.labelText}>OpenAI API Key</span>
					</VSCodeTextField>
					<div className="dropdown-container">
						<label htmlFor="openai-native-model">
							<span className={styles.labelText}>Model</span>
						</label>
						<VSCodeDropdown
							id="openai-native-model"
							value={apiConfiguration?.apiModelId || openAiNativeDefaultModelId}
							onChange={handleInputChange("apiModelId")}
							className={styles.fullWidth}>
							{Object.keys(openAiNativeModels).map((modelId) => (
								<VSCodeOption key={modelId} value={modelId}>
									{modelId}
								</VSCodeOption>
							))}
						</VSCodeDropdown>
					</div>
					{showModelOptions && (
						<ModelInfoView
							selectedModelId={selectedModelId}
							modelInfo={selectedModelInfo}
							isDescriptionExpanded={isDescriptionExpanded}
							setIsDescriptionExpanded={setIsDescriptionExpanded}
						/>
					)}
				</div>
			)}

			{selectedProvider === "openai" && (
				<div>
					<VSCodeTextField
						value={apiConfiguration?.openAiBaseUrl || ""}
						className={styles.fullWidth}
						type="url"
						onInput={handleInputChange("openAiBaseUrl")}
						placeholder="Enter base URL...">
						<span className={styles.labelText}>Base URL</span>
					</VSCodeTextField>
					<VSCodeTextField
						value={apiConfiguration?.openAiApiKey || ""}
						className={styles.fullWidth}
						type="password"
						onInput={handleInputChange("openAiApiKey")}
						placeholder="Enter API Key...">
						<span className={styles.labelText}>API Key</span>
					</VSCodeTextField>
					<VSCodeTextField
						value={apiConfiguration?.openAiModelId || ""}
						className={styles.fullWidth}
						onInput={handleInputChange("openAiModelId")}
						placeholder="Enter Model ID...">
						<span className={styles.labelText}>Model ID</span>
					</VSCodeTextField>
					{showModelOptions && (
						<ModelInfoView
							selectedModelId={selectedModelId}
							modelInfo={selectedModelInfo}
							isDescriptionExpanded={isDescriptionExpanded}
							setIsDescriptionExpanded={setIsDescriptionExpanded}
						/>
					)}
				</div>
			)}

			{selectedProvider === "openrouter" && (
				<div>
					<VSCodeTextField
						value={apiConfiguration?.openRouterApiKey || ""}
						className={styles.fullWidth}
						type="password"
						onInput={handleInputChange("openRouterApiKey")}
						placeholder="Enter API Key...">
						<span className={styles.labelText}>OpenRouter API Key</span>
					</VSCodeTextField>
					<VSCodeTextField
						value={apiConfiguration?.openRouterModelId || openRouterDefaultModelId}
						className={styles.fullWidth}
						onInput={handleInputChange("openRouterModelId")}
						placeholder="Enter Model ID...">
						<span className={styles.labelText}>Model ID</span>
					</VSCodeTextField>
					{showModelOptions && (
						<ModelInfoView
							selectedModelId={selectedModelId}
							modelInfo={selectedModelInfo}
							isDescriptionExpanded={isDescriptionExpanded}
							setIsDescriptionExpanded={setIsDescriptionExpanded}
						/>
					)}
				</div>
			)}

			{selectedProvider === "deepseek" && (
				<div>
					<VSCodeTextField
						value={apiConfiguration?.deepseekApiKey || ""}
						className={styles.fullWidth}
						type="password"
						onInput={handleInputChange("deepseekApiKey")}
						placeholder="Enter API Key...">
						<span className={styles.labelText}>DeepSeek API Key</span>
					</VSCodeTextField>
					<VSCodeTextField
						value={apiConfiguration?.deepseekBaseUrl || ""}
						className={styles.fullWidth}
						type="url"
						onInput={handleInputChange("deepseekBaseUrl")}
						placeholder={"Enter base URL..."}>
						<span className={styles.labelText}>Base URL (optional)</span>
					</VSCodeTextField>
					<div className="dropdown-container">
						<label htmlFor="deepseek-model">
							<span className={styles.labelText}>Model</span>
						</label>
						<VSCodeDropdown
							id="deepseek-model"
							value={apiConfiguration?.apiModelId || deepseekDefaultModelId}
							onChange={handleInputChange("apiModelId")}
							className={styles.fullWidth}>
							<VSCodeOption value="deepseek-chat">DeepSeek-V3 Chat (671B MoE)</VSCodeOption>
							<VSCodeOption value="deepseek-coder">DeepSeek-V3 Coder (671B MoE)</VSCodeOption>
						</VSCodeDropdown>
					</div>
					{showModelOptions && (
						<ModelInfoView
							selectedModelId={selectedModelId}
							modelInfo={selectedModelInfo}
							isDescriptionExpanded={isDescriptionExpanded}
							setIsDescriptionExpanded={setIsDescriptionExpanded}
						/>
					)}
					<p className={styles.infoText}>
						This key is stored locally and only used to make API requests from this extension.
						{!apiConfiguration?.deepseekApiKey && (
							<VSCodeLink href="https://platform.deepseek.com/" className={styles.inlineLink}>
								You can get a DeepSeek API key by signing up here.
							</VSCodeLink>
						)}
					</p>
				</div>
			)}

			{apiErrorMessage && <p className={styles.errorMessage}>{apiErrorMessage}</p>}

			{modelIdErrorMessage && <p className={styles.errorMessage}>{modelIdErrorMessage}</p>}
		</div>
	)
}

export const ModelInfoView = ({
	selectedModelId,
	modelInfo,
	isDescriptionExpanded,
	setIsDescriptionExpanded,
}: {
	selectedModelId: string
	modelInfo: ModelInfo
	isDescriptionExpanded: boolean
	setIsDescriptionExpanded: (isExpanded: boolean) => void
}) => {
	const isGemini = Object.keys(geminiModels).includes(selectedModelId)

	const infoItems = [
		modelInfo.description && (
			<ModelDescriptionMarkdown
				key="description"
				markdown={modelInfo.description}
				isExpanded={isDescriptionExpanded}
				setIsExpanded={setIsDescriptionExpanded}
			/>
		),
		<ModelInfoSupportsItem
			key="supportsImages"
			isSupported={modelInfo.supportsImages ?? false}
			supportsLabel="Supports images"
			doesNotSupportLabel="Does not support images"
		/>,
		<ModelInfoSupportsItem
			key="supportsComputerUse"
			isSupported={modelInfo.supportsComputerUse ?? false}
			supportsLabel="Supports computer use"
			doesNotSupportLabel="Does not support computer use"
		/>,
		!isGemini && (
			<ModelInfoSupportsItem
				key="supportsPromptCache"
				isSupported={modelInfo.supportsPromptCache}
				supportsLabel="Supports prompt caching"
				doesNotSupportLabel="Does not support prompt caching"
			/>
		),
		modelInfo.maxTokens !== undefined && modelInfo.maxTokens > 0 && (
			<span key="maxTokens">
				<span className={styles.labelText}>Max output:</span> {modelInfo.maxTokens?.toLocaleString()} tokens
			</span>
		),
		modelInfo.inputPrice !== undefined && modelInfo.inputPrice > 0 && (
			<span key="inputPrice">
				<span className={styles.labelText}>Input price (cache miss):</span> {formatPrice(modelInfo.inputPrice)}/million tokens
			</span>
		),
		modelInfo.tokensPerSecond && (
			<span key="tokensPerSecond">
				<span className={styles.labelText}>Speed:</span> {modelInfo.tokensPerSecond} tokens/second
			</span>
		),
		modelInfo.architecture && (
			<span key="architecture">
				<span className={styles.labelText}>Architecture:</span> {modelInfo.architecture} ({(modelInfo.activatedParams || 0) / 1_000_000_000}B/{(modelInfo.totalParams || 0) / 1_000_000_000}B parameters)
			</span>
		),
		modelInfo.supportsPromptCache && modelInfo.cacheWritesPrice && (
			<span key="cacheWritesPrice">
				<span className={styles.labelText}>Cache writes price:</span>{" "}
				{formatPrice(modelInfo.cacheWritesPrice || 0)}/million tokens
			</span>
		),
		modelInfo.supportsPromptCache && modelInfo.cacheReadsPrice && (
			<span key="cacheReadsPrice">
				<span className={styles.labelText}>Cache reads price:</span>{" "}
				{formatPrice(modelInfo.cacheReadsPrice || 0)}/million tokens
			</span>
		),
		modelInfo.outputPrice !== undefined && modelInfo.outputPrice > 0 && (
			<span key="outputPrice">
				<span className={styles.labelText}>Output price:</span> {formatPrice(modelInfo.outputPrice)}/million tokens
			</span>
		),
		isGemini && (
			<span key="geminiInfo" className={styles.italicText}>
				* Free up to {selectedModelId && selectedModelId.includes("flash") ? "15" : "2"} requests per minute.
				After that, billing depends on prompt size.{" "}
				<VSCodeLink href="https://ai.google.dev/pricing" className={styles.inlineLink}>
					For more info, see pricing details.
				</VSCodeLink>
			</span>
		),
	].filter(Boolean)

	return (
		<p className={styles.modelInfoText}>
			{infoItems.map((item, index) => (
				<Fragment key={index}>
					{item}
					{index < infoItems.length - 1 && <br />}
				</Fragment>
			))}
		</p>
	)
}

const ModelInfoSupportsItem = ({
	isSupported,
	supportsLabel,
	doesNotSupportLabel,
}: {
	isSupported: boolean
	supportsLabel: string
	doesNotSupportLabel: string
}) => (
	<span className={isSupported ? styles.modelInfoSupportSuccess : styles.modelInfoSupportError}>
		<i
			className={`codicon codicon-${isSupported ? "check" : "x"} ${isSupported ? styles.modelInfoIcon : styles.modelInfoIconError}`}></i>
		{isSupported ? supportsLabel : doesNotSupportLabel}
	</span>
)

export function formatPrice(price: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(price)
}

export default memo(ApiOptions)
