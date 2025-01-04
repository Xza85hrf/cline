import { VSCodeButton, VSCodeLink, VSCodeTextArea, VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import "./SettingsView.css"
import React, { memo, useEffect, useState } from "react"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { validateApiConfiguration, validateModelId } from "../../utils/validate"
import { vscode } from "../../utils/vscode"
import ApiOptions from "./ApiOptions"

const IS_DEV = false // FIXME: use flags when packaging

type SettingsViewProps = {
	onDone: () => void
}

const SettingsView = ({ onDone }: SettingsViewProps) => {
	const { apiConfiguration, version, customInstructions, setCustomInstructions, openRouterModels } =
		useExtensionState()
	const [apiErrorMessage, setApiErrorMessage] = useState<string | undefined>(undefined)
	const [modelIdErrorMessage, setModelIdErrorMessage] = useState<string | undefined>(undefined)
	const handleSubmit = () => {
		const apiValidationResult = validateApiConfiguration(apiConfiguration)
		const modelIdValidationResult = validateModelId(apiConfiguration, openRouterModels)

		setApiErrorMessage(apiValidationResult)
		setModelIdErrorMessage(modelIdValidationResult)
		if (!apiValidationResult && !modelIdValidationResult) {
			vscode.postMessage({ type: "apiConfiguration", apiConfiguration })
			vscode.postMessage({ type: "customInstructions", text: customInstructions })
			onDone()
		}
	}

	useEffect(() => {
		setApiErrorMessage(undefined)
		setModelIdErrorMessage(undefined)
	}, [apiConfiguration])

	// validate as soon as the component is mounted
	/*
	useEffect will use stale values of variables if they are not included in the dependency array. so trying to use useEffect with a dependency array of only one value for example will use any other variables' old values. In most cases you don't want this, and should opt to use react-use hooks.
	
	useEffect(() => {
		// uses someVar and anotherVar
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [someVar])

	If we only want to run code once on mount we can use react-use's useEffectOnce or useMount
	*/

	const handleResetState = () => {
		vscode.postMessage({ type: "resetState" })
	}

	return (
		<div className="settings-container">
			<div className="header">
				<h3 className="title">Settings</h3>
				<VSCodeButton onClick={handleSubmit}>Done</VSCodeButton>
			</div>
			<div className="content">
				<div className="settings-section">
					<ApiOptions
						showModelOptions={true}
						apiErrorMessage={apiErrorMessage}
						modelIdErrorMessage={modelIdErrorMessage}
					/>
				</div>

				<div className="settings-section">
					<h4 className="title section-title">DeepSeek Settings</h4>
					<div className="param-row">
						<VSCodeTextField
							value={apiConfiguration?.deepseek?.temperature?.toString() ?? "0.7"}
							onInput={(e: any) => 
								vscode.postMessage({
									type: "apiConfiguration",
									apiConfiguration: {
										...apiConfiguration,
										deepseek: {
											...apiConfiguration?.deepseek,
											temperature: parseFloat(e.target.value)
										}
									}
								})
							}>
							Temperature
						</VSCodeTextField>
						<VSCodeTextField
							value={apiConfiguration?.deepseek?.top_p?.toString() ?? "1.0"}
							onInput={(e: any) => 
								vscode.postMessage({
									type: "apiConfiguration",
									apiConfiguration: {
										...apiConfiguration,
										deepseek: {
											...apiConfiguration?.deepseek,
											top_p: parseFloat(e.target.value)
										}
									}
								})
							}>
							Top P
						</VSCodeTextField>
						<VSCodeTextField
							value={apiConfiguration?.deepseek?.maxTokens?.toString() ?? "2048"}
							onInput={(e: any) => 
								vscode.postMessage({
									type: "apiConfiguration",
									apiConfiguration: {
										...apiConfiguration,
										deepseek: {
											...apiConfiguration?.deepseek,
											maxTokens: parseInt(e.target.value)
										}
									}
								})
							}>
							Max Tokens
						</VSCodeTextField>
					</div>
					<div className="deepseek-settings">
						<p className="description">
							Configure DeepSeek-specific parameters for text generation.
						</p>
					<div className="token-info">
						<div className="token-progress">
							<div 
								className="token-progress-bar"
							/>
						</div>
						<div className="token-text">
							<span>
								Tokens Used: {apiConfiguration?.deepseek?.tokensUsed ?? 0}
							</span>
							<span className={
								(apiConfiguration?.deepseek?.tokensUsed ?? 0) >= 
								(apiConfiguration?.deepseek?.maxTokens ?? 2048) 
									? 'token-warning' 
									: ''
							}>
								Token Limit: {apiConfiguration?.deepseek?.maxTokens ?? 2048}
							</span>
						</div>
					</div>
					<VSCodeButton 
						onClick={() => vscode.postMessage({ type: "testPrompt" })}
						className="test-prompt-button"
					>
						Test Prompt
					</VSCodeButton>
					</div>
					<VSCodeTextArea
						value={customInstructions ?? ""}
						className="custom-instructions"
						rows={4}
						placeholder={
							'e.g. "Run unit tests at the end", "Use TypeScript with async/await", "Speak in Spanish"'
						}
						onInput={(e: any) => setCustomInstructions(e.target?.value ?? "")}>
						<span className="custom-instructions-label">Custom Instructions</span>
					</VSCodeTextArea>
					<p className="instruction-text">
						These instructions are added to the end of the system prompt sent with every request.
					</p>
				</div>

				{IS_DEV && (
					<>
						<div className="debug-section">Debug</div>
						<VSCodeButton onClick={handleResetState} className="reset-button">
							Reset State
						</VSCodeButton>
						<p className="reset-text">
							This will reset all global state and secret storage in the extension.
						</p>
					</>
				)}

				<div className="footer">
					<p className="footer-text">
						If you have any questions or feedback, feel free to open an issue at{" "}
						<VSCodeLink href="https://github.com/cline/cline" className="inline-link">
							https://github.com/cline/cline
						</VSCodeLink>
					</p>
					<p className="version">v{version}</p>
				</div>
			</div>
		</div>
	)
}

export default memo(SettingsView)
