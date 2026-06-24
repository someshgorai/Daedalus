import { useState } from "react"

interface CodeBlockProps {
  code: string
  language?: string
  note?: string
}

export function CodeBlock({ code, language, note }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const lines = code.split("\n")

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="code-block">
      <div className="code-block__header">
        {language && <span className="code-block__language">{language}</span>}
        {note && <span className="code-block__note">{note}</span>}
        <button
          className={`code-block__copy ${copied ? "code-block__copy--done" : ""}`}
          onClick={copy}
          title="Copy snippet"
          aria-label="Copy snippet"
        >
          {copied ? "✓" : "⧉"}
        </button>
      </div>
      <div className="code-block__body">
        <div className="code-block__lines">
          {lines.map((_, index) => <div key={index}>{index + 1}</div>)}
        </div>
        <pre className="code-block__code">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}
