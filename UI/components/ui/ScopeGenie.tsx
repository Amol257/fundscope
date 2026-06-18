'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Sparkles, Bot, User, ArrowDown } from 'lucide-react';
import { generateResponse, type ChatMessage, type CompactFund } from '@/lib/scopegenie-engine';
import compactData from '@/lib/compact-data.json';

// ─── Markdown-lite renderer ──────────────────────────────────────
// Converts the bot's markdown output into React elements with
// real Next.js <Link> components for fund deep-links.

function renderBotMessage(text: string) {
  // Split into blocks by double newline
  const blocks = text.split(/\n\n+/);

  return blocks.map((block, bi) => {
    // Table detection
    if (block.includes('|') && block.split('\n').filter(l => l.trim().startsWith('|')).length >= 2) {
      const rows = block.split('\n').filter(l => l.trim().startsWith('|'));
      const headerCells = rows[0].split('|').filter(c => c.trim());
      const dataRows = rows.slice(2); // skip header + separator

      return (
        <div key={bi} className="my-2 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                {headerCells.map((cell, ci) => (
                  <th key={ci} className="text-left px-2 py-1 text-on-surface-variant font-medium">
                    {cell.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, ri) => {
                const cells = row.split('|').filter(c => c.trim());
                return (
                  <tr key={ri} className="border-b border-white/5">
                    {cells.map((cell, ci) => (
                      <td key={ci} className="px-2 py-1 text-on-surface/80">
                        {renderInline(cell.trim())}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    // Regular paragraph or list
    const lines = block.split('\n');
    return (
      <div key={bi} className="mb-2">
        {lines.map((line, li) => {
          // List items
          if (/^[-•]\s/.test(line.trim())) {
            return (
              <div key={li} className="flex gap-1.5 ml-1 mb-0.5">
                <span className="text-primary mt-0.5 shrink-0">•</span>
                <span>{renderInline(line.replace(/^[-•]\s*/, ''))}</span>
              </div>
            );
          }
          // Numbered list
          if (/^\d+\.\s/.test(line.trim())) {
            const match = line.match(/^(\d+)\.\s*(.*)/);
            if (match) {
              return (
                <div key={li} className="flex gap-1.5 ml-1 mb-0.5">
                  <span className="text-primary shrink-0 font-mono text-[10px] mt-0.5">{match[1]}.</span>
                  <span>{renderInline(match[2])}</span>
                </div>
              );
            }
          }
          return <p key={li} className="mb-0.5">{renderInline(line)}</p>;
        })}
      </div>
    );
  });
}

function renderInline(text: string): React.ReactNode[] {
  // Process: bold → links → emoji → plain text
  const parts: React.ReactNode[] = [];
  // Combined regex: [link text](/path) | **bold** | *italic*
  const regex = /\[([^\]]+)\]\(([^)]+)\)|\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Push text before this match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1] && match[2]) {
      // Link
      parts.push(
        <Link
          key={`l-${match.index}`}
          href={match[2]}
          className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
        >
          {match[1]}
        </Link>
      );
    } else if (match[3]) {
      // Bold
      parts.push(
        <strong key={`b-${match.index}`} className="font-semibold text-on-surface">
          {match[3]}
        </strong>
      );
    } else if (match[4]) {
      // Italic
      parts.push(
        <em key={`i-${match.index}`} className="text-on-surface-variant italic">
          {match[4]}
        </em>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}


// ─── Typing indicator ────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary/60"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}


// ─── Main component ──────────────────────────────────────────────

export default function ScopeGenie() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  const funds = compactData as CompactFund[];

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages, scrollToBottom]);

  // Track scroll position
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Send a message
  const sendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate a short "thinking" delay for natural feel
    const delay = 300 + Math.random() * 400;
    setTimeout(() => {
      const response = generateResponse(trimmed, funds);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
    }, delay);
  }, [input, funds]);

  // Quick suggestions
  const suggestions = [
    'Top 5 large cap funds',
    'How does scoring work?',
    'Best ELSS for tax saving',
    'What is Sharpe ratio?',
  ];

  const handleSuggestion = (text: string) => {
    setInput(text);
    setTimeout(() => {
      const userMsg: ChatMessage = { role: 'user', content: text };
      setMessages(prev => [...prev, userMsg]);
      setIsTyping(true);
      setInput('');
      const delay = 300 + Math.random() * 400;
      setTimeout(() => {
        const response = generateResponse(text, funds);
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        setIsTyping(false);
      }, delay);
    }, 50);
  };

  return (
    <>
      {/* ─── Floating Action Button ─── */}
      <motion.button
        id="scopegenie-fab"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #F27D26 0%, #d96d1f 100%)',
          boxShadow: '0 4px 24px rgba(242, 125, 38, 0.4), 0 0 48px rgba(242, 125, 38, 0.15)',
        }}
        whileHover={{ scale: 1.1, boxShadow: '0 6px 32px rgba(242, 125, 38, 0.6)' }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? 'Close ScopeGenie' : 'Open ScopeGenie'}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={22} className="text-black" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Sparkles size={22} className="text-black" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse ring */}
        {!isOpen && messages.length === 0 && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary"
            animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
      </motion.button>

      {/* ─── Chat Panel ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="scopegenie-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-6 z-[9998] w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-8rem)] rounded-2xl overflow-hidden flex flex-col"
            style={{
              background: 'linear-gradient(180deg, rgba(15,15,15,0.98) 0%, rgba(8,8,8,0.99) 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 1px rgba(255,255,255,0.1)',
            }}
          >
            {/* ─── Header ─── */}
            <div
              className="flex items-center gap-3 px-5 py-4 shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(242,125,38,0.08) 0%, transparent 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/15">
                  <Bot size={18} className="text-primary" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success-teal border-2 border-surface" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-on-surface tracking-tight">ScopeGenie</h3>
                <p className="text-[10px] text-on-surface-variant leading-tight">
                  Powered by real FundScope data
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X size={14} className="text-on-surface-variant" />
              </button>
            </div>

            {/* ─── Messages Area ─── */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
            >
              {messages.length === 0 ? (
                /* ─── Welcome Screen ─── */
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="flex flex-col items-center text-center pt-4"
                >
                  <motion.div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'linear-gradient(135deg, rgba(242,125,38,0.15) 0%, rgba(242,125,38,0.05) 100%)', border: '1px solid rgba(242,125,38,0.2)' }}
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Sparkles size={28} className="text-primary" />
                  </motion.div>
                  <h4 className="text-base font-semibold text-on-surface mb-1">
                    Meet ScopeGenie
                  </h4>
                  <p className="text-xs text-on-surface-variant mb-5 max-w-[260px] leading-relaxed">
                    Your AI-powered mutual fund analyst. Ask me about funds, scores, tax rules, or SIP planning.
                  </p>
                  <div className="grid grid-cols-2 gap-2 w-full">
                    {suggestions.map((s, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 + i * 0.08 }}
                        onClick={() => handleSuggestion(s)}
                        className="text-[11px] text-left px-3 py-2.5 rounded-xl text-on-surface-variant hover:text-on-surface transition-all cursor-pointer leading-snug"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                        whileHover={{
                          background: 'rgba(242,125,38,0.08)',
                          borderColor: 'rgba(242,125,38,0.2)',
                        }}
                      >
                        {s}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                /* ─── Message List ─── */
                messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-primary/10 shrink-0 mt-0.5">
                        <Bot size={12} className="text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-primary text-black rounded-br-md'
                          : 'rounded-bl-md text-on-surface/90'
                      }`}
                      style={
                        msg.role === 'assistant'
                          ? {
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.06)',
                            }
                          : undefined
                      }
                    >
                      {msg.role === 'assistant' ? renderBotMessage(msg.content) : msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/5 shrink-0 mt-0.5">
                        <User size={12} className="text-on-surface-variant" />
                      </div>
                    )}
                  </motion.div>
                ))
              )}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 justify-start"
                >
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-primary/10 shrink-0 mt-0.5">
                    <Bot size={12} className="text-primary" />
                  </div>
                  <div
                    className="rounded-2xl rounded-bl-md"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <TypingIndicator />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Scroll-to-bottom button */}
            <AnimatePresence>
              {showScrollDown && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-20 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center shadow-lg cursor-pointer"
                >
                  <ArrowDown size={14} className="text-on-surface-variant" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* ─── Input Area ─── */}
            <div
              className="px-4 py-3 shrink-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Ask about funds, scores, tax..."
                  className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none"
                />
                <motion.button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                  style={{
                    background: input.trim() ? 'rgba(242,125,38,0.9)' : 'transparent',
                  }}
                  whileHover={input.trim() ? { scale: 1.05 } : {}}
                  whileTap={input.trim() ? { scale: 0.95 } : {}}
                >
                  <Send size={14} className={input.trim() ? 'text-black' : 'text-on-surface-variant'} />
                </motion.button>
              </div>
              <p className="text-[9px] text-on-surface-variant/40 text-center mt-2">
                ScopeGenie uses FundScope&apos;s own scoring data · Not financial advice
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
