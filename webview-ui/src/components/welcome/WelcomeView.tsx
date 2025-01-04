import { VSCodeButton, VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import { useEffect, useState } from "react"
import styles from "./WelcomeView.module.css"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { validateApiConfiguration } from "../../utils/validate"
import { vscode } from "../../utils/vscode"
import ApiOptions from "../settings/ApiOptions"

const WelcomeView = () => {
	const { apiConfiguration } = useExtensionState()

	const [apiErrorMessage, setApiErrorMessage] = useState<string | undefined>(undefined)

	const disableLetsGoButton = apiErrorMessage != null

	const handleSubmit = () => {
		vscode.postMessage({ type: "apiConfiguration", apiConfiguration })
	}

	useEffect(() => {
		setApiErrorMessage(validateApiConfiguration(apiConfiguration))
	}, [apiConfiguration])

	return (
		<div className={styles.container}>
			<h2> Hi, I'm Deep-Cline 🤖</h2>
			<p>
				Powered by{" "}
				<VSCodeLink href="https://platform.deepseek.com/" className={styles.link}>
					DeepSeek-V3
				</VSCodeLink>
				, a state-of-the-art 671B parameter MoE model optimized for fast (60 tokens/sec) responses, I can handle complex tasks with high efficiency. My 64K context window and prompt caching capabilities enable me to work effectively with large codebases and complex projects.{" "}
				and access to tools that let me create & edit files, explore complex projects, use the browser, and
				execute terminal commands (with your permission, of course). I can even use MCP to create new tools and
				extend my own capabilities.
			</p>

			<b>To get started, this extension needs an API provider for DeepSeek.</b>

			<div className={styles.buttonContainer}>
				<ApiOptions showModelOptions={false} />
				<VSCodeButton onClick={handleSubmit} disabled={disableLetsGoButton} className={styles.submitButton}>
					Let's go!
				</VSCodeButton>
			</div>
		</div>
	)
}

export default WelcomeView
