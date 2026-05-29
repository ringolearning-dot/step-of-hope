import { useState, useRef, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  HiPaperAirplane,
  HiSparkles,
  HiChatBubbleLeftRight,
  HiTrash,
  HiClipboardDocument,
  HiHandThumbUp,
  HiHandThumbDown,
  HiArrowPath,
  HiStopCircle,
} from 'react-icons/hi2';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  data?: any;
  type?: string;
}

interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

const SUGGESTIONS = [
  "Show me this month's donations",
  "How much did we spend on events?",
  "What bills are due this week?",
  "Show pending reservations",
  "What's our current balance?",
  "Generate a financial summary",
  "Show volunteer overview",
  "What happened today?",
];

function formatMarkdown(text: string): string {
  return text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Bullet points (- or *)
    .replace(/^[-*] (.+)$/gm, '&bull; $1')
    // Numbered lists
    .replace(/^\d+\.\s(.+)$/gm, (_, content) => `&bull; ${content}`)
    // Headers (### or ##)
    .replace(/^###\s(.+)$/gm, '<strong>$1</strong>')
    .replace(/^##\s(.+)$/gm, '<strong>$1</strong>')
    // Line breaks
    .replace(/\n/g, '<br />');
}

export default function AIAssistantAdmin() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function loadConversations() {
    try {
      const res = await api.get('/ai-assistant/admin/conversations');
      setConversations(res.data);
    } catch {}
  }

  async function loadConversation(id: number) {
    try {
      const res = await api.get(`/ai-assistant/admin/conversations/${id}`);
      setMessages(res.data.messages || []);
      setActiveConvId(id);
      setShowSidebar(false);
    } catch { toast.error('Failed to load conversation'); }
  }

  async function deleteConversation(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await api.delete(`/ai-assistant/admin/conversations/${id}`);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConvId === id) {
        setMessages([]);
        setActiveConvId(null);
      }
      toast.success('Conversation deleted');
    } catch { toast.error('Failed to delete conversation'); }
  }

  async function sendMessage(text?: string) {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: msg, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await api.post('/ai-assistant/admin/chat', {
        message: msg,
        conversation_id: activeConvId,
      }, { signal: controller.signal });
      const assistantMsg: Message = {
        role: 'assistant',
        content: res.data.text,
        timestamp: new Date().toISOString(),
        data: res.data.data,
        type: res.data.type,
      };
      setMessages(prev => [...prev, assistantMsg]);
      loadConversations();
    } catch (err: any) {
      if (err?.code === 'ERR_CANCELED' || controller.signal.aborted) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Response stopped.', timestamp: new Date().toISOString() }]);
      } else {
        toast.error('Failed to get response');
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: new Date().toISOString() }]);
      }
    } finally {
      abortControllerRef.current = null;
      setSending(false);
    }
  }

  function startNewChat() {
    setMessages([]);
    setActiveConvId(null);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleStop() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }

  function handleCopy(content: string, index: number) {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  function handleRegenerate(index: number) {
    // Find the last user message before this assistant message
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        // Remove messages from index onward and resend
        setMessages(prev => prev.slice(0, index));
        sendMessage(messages[i].content);
        break;
      }
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Conversation List Sidebar */}
      <div className={`${showSidebar ? 'fixed inset-0 z-50 bg-black/50 lg:relative lg:bg-transparent' : 'hidden'} lg:block lg:w-64 flex-shrink-0`}>
        <div className={`${showSidebar ? 'w-72 h-full' : 'w-full h-full'} bg-white rounded-xl border border-gray-200 flex flex-col`}>
          <div className="p-4 border-b">
            <button onClick={startNewChat} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800">
              <HiSparkles className="w-4 h-4" /> New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map(conv => (
              <button key={conv.id} onClick={() => loadConversation(conv.id)}
                className={`w-full text-left px-4 py-3 text-sm border-b border-gray-50 hover:bg-gray-50 group flex items-center justify-between ${activeConvId === conv.id ? 'bg-blue-50' : ''}`}>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{conv.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(conv.updated_at).toLocaleDateString()}</p>
                </div>
                <button onClick={(e) => deleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity ml-2 flex-shrink-0">
                  <HiTrash className="w-4 h-4" />
                </button>
              </button>
            ))}
            {conversations.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-8">No conversations yet</p>
            )}
          </div>
        </div>
        {showSidebar && <div className="lg:hidden" onClick={() => setShowSidebar(false)} />}
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSidebar(!showSidebar)} className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600">
              <HiChatBubbleLeftRight className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <HiSparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">AI Assistant</h2>
              <p className="text-xs text-gray-400">Powered by Gemini — Ask me about donations, expenses, volunteers, and more</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                <HiSparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Step of Hope AI Assistant</h3>
              <p className="text-gray-500 text-sm max-w-md mb-6">I can help you with financial summaries, donation tracking, expense reports, volunteer management, and reservation info.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => sendMessage(s)}
                    className="text-left px-4 py-3 text-sm border rounded-xl hover:bg-gray-50 hover:border-gray-300 transition text-gray-700">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[80%]">
                <div className={`${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-900'} rounded-2xl px-4 py-3`}>
                  <div className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{
                    __html: formatMarkdown(msg.content)
                  }} />
                  <p className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-slate-400' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1 mt-1.5 ml-1">
                    <button
                      onClick={() => handleCopy(msg.content, i)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      title="Copy"
                    >
                      <HiClipboardDocument className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                      title="Good response"
                    >
                      <HiHandThumbUp className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Bad response"
                    >
                      <HiHandThumbDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRegenerate(i)}
                      disabled={sending}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                      title="Regenerate"
                    >
                      <HiArrowPath className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about donations, expenses, bills, volunteers..."
              rows={1}
              className="flex-1 border rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {sending ? (
              <button
                onClick={handleStop}
                className="px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
                title="Stop generating"
              >
                <HiStopCircle className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim()}
                className="px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 transition"
              >
                <HiPaperAirplane className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
