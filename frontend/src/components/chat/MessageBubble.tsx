import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-async';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Bot, Check, Copy } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useThemeStore } from '@/stores/themeStore';
import type { ConversationMessageDTO } from '@/types/domain';

function useResolvedIsDark() {
  const theme = useThemeStore((s) => s.theme);
  if (theme === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches;
  return theme === 'dark';
}

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const isDark = useResolvedIsDark();

  return (
    <div className="relative my-2 overflow-hidden rounded-md border border-border">
      <div className="flex items-center justify-between bg-paper-sunken px-3 py-1.5">
        <span className="font-mono text-xs text-ink-muted">{language || 'text'}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
          aria-label="Copy code"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={isDark ? oneDark : oneLight}
        customStyle={{ margin: 0, fontSize: '0.8125rem' }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

interface MessageBubbleProps {
  message: ConversationMessageDTO;
  onRegenerate?: () => void;
  isLast?: boolean;
}

export function MessageBubble({ message, onRegenerate, isLast }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';

  return (
    <div className={cn('flex gap-3', isAssistant ? 'flex-row' : 'flex-row-reverse')}>
      {isAssistant && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-board text-paper">
          <Bot className="size-4" />
        </div>
      )}
      <div className={cn('flex max-w-[80%] flex-col gap-1', isAssistant ? 'items-start' : 'items-end')}>
        <div
          className={cn(
            'rounded-lg px-4 py-2.5 text-sm leading-relaxed',
            isAssistant ? 'bg-paper-raised border border-border text-ink' : 'bg-board text-paper'
          )}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code(props) {
                const { className, children } = props;
                const match = /language-(\w+)/.exec(className || '');
                const isInline = !match;
                if (isInline) {
                  return (
                    <code className="rounded bg-paper-sunken px-1 py-0.5 font-mono text-[0.85em]">
                      {children}
                    </code>
                  );
                }
                return (
                  <CodeBlock
                    language={match?.[1] ?? ''}
                    value={String(children).replace(/\n$/, '')}
                  />
                );
              },
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>,
              ol: ({ children }) => <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>,
              a: ({ children, href }) => (
                <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                  {children}
                </a>
              ),
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        <div className="flex items-center gap-3 px-1 text-xs text-ink-faint">
          <span>{new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {isAssistant && (
            <>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(message.content);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="hover:text-ink"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
              {isLast && onRegenerate && (
                <button onClick={onRegenerate} className="hover:text-ink">
                  Regenerate
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
