import { memo, useEffect } from "react"
import { useRemark } from "react-remark"
import rehypeHighlight, { Options } from "rehype-highlight"
import styled from "styled-components"
import { visit } from "unist-util-visit"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { CODE_BLOCK_BG_COLOR } from "./CodeBlock"
import "./MarkdownBlock.css"

interface MarkdownBlockProps {
	markdown?: string
}

/**
 * Custom remark plugin that converts plain URLs in text into clickable links
 *
 * The original bug: We were converting text nodes into paragraph nodes,
 * which broke the markdown structure because text nodes should remain as text nodes
 * within their parent elements (like paragraphs, list items, etc.).
 * This caused the entire content to disappear because the structure became invalid.
 */
const remarkUrlToLink = () => {
  return (tree: any) => {
    visit(tree, "text", (node: any, index, parent) => {
      // Improved URL regex to handle more edge cases
      const urlRegex = /https?:\/\/[^\s<>)"]+(?:\/[^\s<>)"]*)?/g
      const matches = node.value.match(urlRegex)
      if (!matches) return

      const parts = node.value.split(urlRegex)
      const children: any[] = []

      parts.forEach((part: string, i: number) => {
        if (part) children.push({ type: "text", value: part })
        if (matches[i]) {
          children.push({
            type: "link",
            url: matches[i],
            children: [{ 
              type: "text", 
              value: matches[i].length > 50 ? 
                `${matches[i].slice(0, 30)}...${matches[i].slice(-17)}` : 
                matches[i]
            }],
            properties: {
              target: "_blank",
              rel: "noopener noreferrer"
            }
          })
        }
      })

      if (parent) {
        parent.children.splice(index, 1, ...children)
      }
    })
  }
}

const StyledMarkdown = styled.div`
  pre {
    background-color: ${CODE_BLOCK_BG_COLOR};
    border-radius: 3px;
    margin: 13px 0;
    padding: 10px;
    max-inline-size: calc(100vw - 20px);
    overflow-x: auto;
    overflow-y: hidden;
    position: relative;
    
    &::before {
      content: attr(data-language);
      position: absolute;
      inset-block-start: 0;
      inset-inline-end: 0;
      padding: 2px 6px;
      background: rgba(255, 255, 255, 0.1);
      color: var(--vscode-editor-foreground);
      font-size: 0.8em;
      border-end-start-radius: 3px;
    }
  }

	pre > code {
		.hljs-deletion {
			background-color: var(--vscode-diffEditor-removedTextBackground);
			display: inline-block;
			inline-size: 100%;
		}
		.hljs-addition {
			background-color: var(--vscode-diffEditor-insertedTextBackground);
			display: inline-block;
			inline-size: 100%;
		}
	}

	code {
		span.line:empty {
			display: none;
		}
		word-wrap: break-word;
		border-radius: 3px;
		background-color: ${CODE_BLOCK_BG_COLOR};
		font-size: var(--vscode-editor-font-size, var(--vscode-font-size, 12px));
		font-family: var(--vscode-editor-font-family);
	}

	code:not(pre > code) {
		font-family: var(--vscode-editor-font-family, monospace);
		color: var(--vscode-textPreformat-foreground, #f78383);
		background-color: var(--vscode-textCodeBlock-background, #1e1e1e);
		padding: 0px 2px;
		border-radius: 3px;
		border: 1px solid var(--vscode-textSeparator-foreground, #424242);
		white-space: pre-line;
		word-break: break-word;
		overflow-wrap: anywhere;
	}

	font-family:
		var(--vscode-font-family),
		system-ui,
		-apple-system,
		BlinkMacSystemFont,
		"Segoe UI",
		Roboto,
		Oxygen,
		Ubuntu,
		Cantarell,
		"Open Sans",
		"Helvetica Neue",
		sans-serif;
	font-size: var(--vscode-font-size, 13px);

	p,
	li,
	ol,
	ul {
		line-height: 1.25;
	}

	ol,
	ul {
		padding-inline-start: 2.5em;
		margin-inline-start: 0;
	}

	p {
		white-space: pre-wrap;
	}

	a {
		text-decoration: none;
	}
	a {
		&:hover {
			text-decoration: underline;
		}
	}
`

const StyledPre = styled.pre<{ theme: any }>`
	& .hljs {
		color: var(--vscode-editor-foreground, #fff);
	}

	${(props) =>
		Object.keys(props.theme)
			.map((key, index) => {
				return `
      & ${key} {
        color: ${props.theme[key]};
      }
    `
			})
			.join("")}
`

const MarkdownBlock = memo(({ markdown }: MarkdownBlockProps) => {
  const { theme } = useExtensionState()
  const [reactContent, setMarkdown] = useRemark({
    remarkPlugins: [
      remarkUrlToLink,
      () => {
        return (tree) => {
          visit(tree, "code", (node: any) => {
            if (!node.lang) {
              node.lang = "javascript"
            } else if (node.lang.includes(".")) {
              node.lang = node.lang.split(".").slice(-1)[0]
            }
            node.data = {
              ...node.data,
              hProperties: {
                'data-language': node.lang
              }
            }
          })
          
          // Add support for tables
          visit(tree, "table", (node: any) => {
            node.data = {
              ...node.data,
              hProperties: {
                className: "markdown-table"
              }
            }
          })
        }
      },
    ],
    rehypePlugins: [
      [rehypeHighlight as any, {
        ignoreMissing: true,
        aliases: {
          js: 'javascript',
          ts: 'typescript',
          py: 'python',
          rb: 'ruby',
          sh: 'bash',
          zsh: 'bash',
          ps1: 'powershell'
        }
      } as Options],
    ],
    rehypeReactOptions: {
      components: {
        pre: ({ node, ...preProps }: any) => <StyledPre {...preProps} theme={theme} />,
        table: ({ node, ...props }: any) => (
          <div className="markdown-block table-container">
            <table {...props} className="markdown-block" />
          </div>
        ),
        th: ({ node, ...props }: any) => (
          <th {...props} className="markdown-block" />
        ),
        td: ({ node, ...props }: any) => (
          <td {...props} className="markdown-block" />
        ),
        blockquote: ({ node, ...props }: any) => (
          <blockquote {...props} className="markdown-block" />
        )
      },
    },
  })

	useEffect(() => {
		setMarkdown(markdown || "")
	}, [markdown, setMarkdown, theme])

	return (
		<div className="markdown-block">
			<StyledMarkdown>{reactContent}</StyledMarkdown>
		</div>
	)
})

export default MarkdownBlock
