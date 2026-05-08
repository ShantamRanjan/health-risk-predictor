import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Renders markdown returned by MedAdvisor (Groq) into nicely styled
 * chat content — bullets, bold, headings, inline code, tables.
 */
export default function MarkdownMessage({ children }) {
  return (
    <div className="markdown-body text-[14.5px] leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ node, ...p }) => <h1 className="text-base font-bold mt-3 mb-1.5 text-slate-900" {...p} />,
          h2: ({ node, ...p }) => <h2 className="text-base font-bold mt-3 mb-1.5 text-slate-900" {...p} />,
          h3: ({ node, ...p }) => <h3 className="text-sm font-bold mt-2.5 mb-1 text-slate-900" {...p} />,
          h4: ({ node, ...p }) => <h4 className="text-sm font-semibold mt-2.5 mb-1 text-slate-900" {...p} />,

          // Paragraphs — tight spacing inside chat bubbles
          p: ({ node, ...p }) => <p className="my-2 first:mt-0 last:mb-0" {...p} />,

          // Lists
          ul: ({ node, ...p }) => <ul className="my-2 space-y-1 list-disc list-outside pl-5 marker:text-brand-500" {...p} />,
          ol: ({ node, ...p }) => <ol className="my-2 space-y-1 list-decimal list-outside pl-5 marker:text-brand-500 marker:font-semibold" {...p} />,
          li: ({ node, ...p }) => <li className="pl-1" {...p} />,

          // Inline & block code
          code: ({ node, inline, className, children, ...props }) => {
            const isBlock = String(children).includes('\n')
            if (inline || !isBlock) {
              return (
                <code className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[12.5px] font-mono text-brand-700" {...props}>
                  {children}
                </code>
              )
            }
            return (
              <pre className="my-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs">
                <code className="font-mono text-slate-100" {...props}>{children}</code>
              </pre>
            )
          },

          // Inline emphasis
          strong: ({ node, ...p }) => <strong className="font-semibold text-slate-900" {...p} />,
          em: ({ node, ...p }) => <em className="italic text-slate-700" {...p} />,

          // Quotes
          blockquote: ({ node, ...p }) => (
            <blockquote className="my-2 border-l-3 border-brand-200 bg-brand-50/50 px-3 py-1.5 rounded-r-md italic text-slate-700" {...p} />
          ),

          // Links
          a: ({ node, ...p }) => (
            <a className="text-brand-600 underline underline-offset-2 hover:text-brand-700" target="_blank" rel="noreferrer" {...p} />
          ),

          // Tables
          table: ({ node, ...p }) => (
            <div className="my-3 overflow-x-auto">
              <table className="min-w-full text-xs ring-1 ring-slate-200 rounded-lg overflow-hidden" {...p} />
            </div>
          ),
          thead: ({ node, ...p }) => <thead className="bg-slate-100 text-slate-700" {...p} />,
          th: ({ node, ...p }) => <th className="text-left font-semibold px-3 py-2" {...p} />,
          td: ({ node, ...p }) => <td className="border-t border-slate-100 px-3 py-2" {...p} />,

          // Horizontal rule
          hr: () => <hr className="my-3 border-slate-200" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
