import { VSCodeButton, VSCodeDataGrid, VSCodeDataGridCell, VSCodeDataGridRow } from "@vscode/webview-ui-toolkit/react"
import React, { memo, useEffect, useState } from "react"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { vscode } from "../../utils/vscode"

interface ModelComparisonProps {
  onClose: () => void
}

const ModelComparison = memo(({ onClose }: ModelComparisonProps) => {
  const { apiConfiguration } = useExtensionState()
  const [models, setModels] = useState<any[]>([])

  useEffect(() => {
    // Fetch model data when component mounts
    vscode.postMessage({ type: "getModelComparisonData", apiConfiguration })
    const listener = (event: MessageEvent) => {
      if (event.data.type === "modelComparisonData") {
        setModels(event.data.models)
      }
    }
    window.addEventListener("message", listener)
    return () => window.removeEventListener("message", listener)
  }, [])

  return (
    <div className="model-comparison">
      <div className="header">
        <h3>Model Comparison</h3>
        <VSCodeButton onClick={onClose}>Close</VSCodeButton>
      </div>

      <VSCodeDataGrid>
        <VSCodeDataGridRow rowType="header">
          <VSCodeDataGridCell cellType="columnheader">Model</VSCodeDataGridCell>
          <VSCodeDataGridCell cellType="columnheader">Provider</VSCodeDataGridCell>
          <VSCodeDataGridCell cellType="columnheader">Context Length</VSCodeDataGridCell>
          <VSCodeDataGridCell cellType="columnheader">Max Tokens</VSCodeDataGridCell>
          <VSCodeDataGridCell cellType="columnheader">Cost (Input/Output)</VSCodeDataGridCell>
        </VSCodeDataGridRow>

        {models.map((model) => (
          <VSCodeDataGridRow key={model.id}>
            <VSCodeDataGridCell>{model.name}</VSCodeDataGridCell>
            <VSCodeDataGridCell>{model.provider}</VSCodeDataGridCell>
            <VSCodeDataGridCell>{model.contextLength}</VSCodeDataGridCell>
            <VSCodeDataGridCell>{model.maxTokens}</VSCodeDataGridCell>
            <VSCodeDataGridCell>
              ${model.inputCost}/1M - ${model.outputCost}/1M
            </VSCodeDataGridCell>
          </VSCodeDataGridRow>
        ))}
      </VSCodeDataGrid>
    </div>
  )
})

export default ModelComparison
