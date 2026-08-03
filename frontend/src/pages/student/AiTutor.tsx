import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Send, Sparkles } from 'lucide-react';
import { ConversationSidebar } from '@/components/chat/ConversationSidebar';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useConversation, useConversations, useSendMessage, useStartConversation } from '@/hooks/useAiTutor';
import { getApiErrorMessage } from '@/api/client';
import { toast } from '@/components/ui/toastStore';

const SUGGESTED_QUESTIONS = [
  'Explain this topic like I’m in a hurry',
  'Give me two practice questions on this',
  'What should I study next?',
  'Where do students usually get this wrong?',
];

export function AiTutorPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversationList, isLoading: listLoading } = useConversations();
  const { data: conversation, isLoading: conversationLoading } = useConversation(conversationId);
  const startConversation = useStartConversation();
  const sendMessage = useSendMessage();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages.length, sendMessage.isPending]);

  function handleSend(message: string) {
    if (!message.trim()) return;
    setDraft('');

    if (!conversationId) {
      startConversation.mutate(undefined, {
        onSuccess: (created) => {
          navigate(`/student/ai-tutor/${created.id}`);
          sendMessage.mutate(
            { conversationId: created.id, message },
            { onError: (error) => toast.error('The AI Tutor is unavailable', getApiErrorMessage(error)) }
          );
        },
        onError: (error) => toast.error('Could not start a conversation', getApiErrorMessage(error)),
      });
      return;
    }

    sendMessage.mutate(
      { conversationId, message },
      { onError: (error) => toast.error('The AI Tutor is unavailable', getApiErrorMessage(error)) }
    );
  }

  return (
    <div className="-m-4 flex h-[calc(100svh-3.5rem)] sm:-m-6 lg:-m-8">
      <div className="hidden w-64 shrink-0 md:block">
        <ConversationSidebar
          conversations={conversationList?.items ?? []}
          activeId={conversationId}
          onSelect={(id) => navigate(`/student/ai-tutor/${id}`)}
          onNew={() => navigate('/student/ai-tutor')}
          isLoading={listLoading}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6 sm:px-8">
          {!conversationId && (
            <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-board-soft text-board">
                <Sparkles className="size-6" />
              </div>
              <h1 className="mt-4 font-display text-2xl font-medium text-ink">
                What are you working on?
              </h1>
              <p className="mt-1 text-sm text-ink-muted">
                Ask about any topic — I'll explain, quiz, and point you to what's next.
              </p>
              <div className="mt-6 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="rounded-md border border-border-strong px-3 py-2.5 text-left text-sm text-ink hover:bg-paper-sunken"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {conversationId && conversationLoading && (
            <p className="text-sm text-ink-muted">Loading conversation…</p>
          )}

          {conversationId && conversation && (
            <div className="mx-auto max-w-2xl space-y-5">
              {conversation.messages.map((m, i) => (
                <MessageBubble
                  key={i}
                  message={m}
                  isLast={i === conversation.messages.length - 1 && m.role === 'assistant'}
                  onRegenerate={() => {
                    const lastUser = [...conversation.messages].reverse().find((msg) => msg.role === 'student');
                    if (lastUser) sendMessage.mutate({ conversationId, message: lastUser.content });
                  }}
                />
              ))}
              {sendMessage.isPending && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-border p-4">
          <form
            className="mx-auto flex max-w-2xl items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(draft);
            }}
          >
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(draft);
                }
              }}
              placeholder="Message the AI Tutor..."
              className="min-h-11 flex-1 resize-none"
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              isLoading={sendMessage.isPending || startConversation.isPending}
              disabled={!draft.trim()}
              aria-label="Send message"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
