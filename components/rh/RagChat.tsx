"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { 
  Send, 
  Bot, 
  User, 
  BookOpen, 
  Trash2, 
  Scale, 
  Info,
  ArrowRight,
  ShieldCheck,
  Search,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Source = { titre: string; source: string };

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  loading?: boolean;
};

const EXAMPLE_QUESTIONS = [
  "Quels sont les délais de préavis pour un CDI ?",
  "Comment calculer l'indemnité de licenciement ?",
  "Combien de fois peut-on renouveler un CDD en Côte d'Ivoire ?",
  "Quels sont les délais pour saisir l'Inspection du Travail ?",
  "Quelle est la durée des congés payés annuels ?",
  "Quand le CDD se transforme-t-il automatiquement en CDI ?",
];

export function RagChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || loading) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: question.trim(),
      };

      const loadingMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        loading: true,
      };

      setMessages((prev) => [...prev, userMsg, loadingMsg]);
      setInput("");
      setLoading(true);

      try {
        const history = messages
          .filter((m) => !m.loading)
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch("/api/rag/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: question.trim(), history }),
        });

        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          throw new Error(err.error ?? "Erreur serveur");
        }

        const data = (await res.json()) as {
          answer: string;
          sources: Source[];
          used_rag: boolean;
        };

        setMessages((prev) =>
          prev.map((m) =>
            m.loading
              ? {
                  ...m,
                  loading: false,
                  content: data.answer,
                  sources: data.sources,
                }
              : m
          )
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur inconnue";
        toast.error(msg);
        setMessages((prev) => prev.filter((m) => !m.loading));
      } finally {
        setLoading(false);
        setTimeout(() => textareaRef.current?.focus(), 50);
      }
    },
    [loading, messages]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="flex h-[750px] flex-col pro-card overflow-hidden backdrop-blur-xl relative">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-400/20 rounded-full blur-[100px] animate-pulse [animation-delay:2s]" />
      </div>

      {/* Header */}
      <div className="px-6 py-4 border-b border-white/40 bg-white/40 flex items-center justify-between backdrop-blur-md relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
            <Scale className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 leading-tight flex items-center gap-2">
              Expert Juridique CI
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-1.5 h-5 font-bold uppercase text-[9px]">
                Live
              </Badge>
            </h2>
            <p className="text-[11px] text-slate-600 font-medium">Code du Travail (Loi 2015-532)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMessages([])}
                    className="h-9 w-9 rounded-full text-slate-600 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Effacer l&apos;historique</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Badge variant="outline" className="bg-white/50 border-slate-200 text-slate-600 font-medium py-1 px-2.5">
            <ShieldCheck className="h-3 w-3 mr-1.5 text-teal-500" />
            Conformité IA
          </Badge>
        </div>
      </div>

      {/* Chat Area */}
      <ScrollArea 
        viewportRef={scrollRef}
        className="flex-1 px-6 py-6 overflow-hidden relative z-10"
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full flex flex-col items-center justify-center gap-8 py-12 text-center"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shadow-2xl">
                  <Bot className="h-10 w-10 text-white" />
                </div>
              </div>

              <div className="max-w-md space-y-3">
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight">Bonjour, comment puis-je vous aider ?</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Je suis votre assistant spécialisé en droit du travail ivoirien. 
                  Je peux analyser vos contrats, simuler des indemnités ou répondre à vos questions réglementaires.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl px-4">
                {EXAMPLE_QUESTIONS.map((q, idx) => (
                  <motion.button
                    key={q}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                    onClick={() => sendMessage(q)}
                    className="group relative flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/60 p-4 text-left transition-all hover:border-primary/50 hover:bg-white hover:shadow-xl hover:shadow-primary/5"
                  >
                    <div className="h-8 w-8 shrink-0 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Search className="h-4 w-4 text-slate-600 group-hover:text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">{q}</span>
                    <ArrowRight className="h-3 w-3 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-8 pb-4">
              {messages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="h-9 w-9 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0 mt-1">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                  )}

                  <div className={`flex flex-col gap-2.5 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`relative rounded-3xl px-5 py-4 text-[13.5px] leading-relaxed shadow-sm transition-all ${
                        msg.role === "user"
                          ? "bg-slate-900 text-white font-medium rounded-tr-md selection:bg-primary selection:text-white"
                          : "bg-white border border-slate-100 text-slate-700 rounded-tl-md"
                      }`}
                    >
                      {msg.loading ? (
                        <div className="flex items-center gap-2 py-1">
                          <div className="flex gap-1.5">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 1, delay: i * 0.15 }}
                                className="h-1.5 w-1.5 rounded-full bg-primary"
                              />
                            ))}
                          </div>
                          <span className="text-[11px] font-bold text-primary uppercase tracking-wider animate-pulse">Réflexion Juridique...</span>
                        </div>
                      ) : msg.role === "user" ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="markdown-message">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 my-3 marker:text-slate-400">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 my-3 marker:text-slate-400">{children}</ol>,
                              li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                              h1: ({ children }) => <h2 className="text-base font-semibold text-slate-900 mt-3 mb-2 first:mt-0">{children}</h2>,
                              h2: ({ children }) => <h3 className="text-sm font-semibold text-slate-900 mt-3 mb-2 first:mt-0">{children}</h3>,
                              h3: ({ children }) => <h4 className="text-sm font-semibold text-slate-800 mt-3 mb-1.5 first:mt-0">{children}</h4>,
                              code: ({ children }) => <code className="px-1 py-0.5 rounded bg-slate-100 text-[12px] font-mono text-slate-800">{children}</code>,
                              pre: ({ children }) => <pre className="my-3 p-3 rounded-md bg-slate-50 border border-slate-100 overflow-x-auto text-[12px] leading-relaxed">{children}</pre>,
                              blockquote: ({ children }) => <blockquote className="border-l-2 border-slate-200 pl-3 italic text-slate-600 my-3">{children}</blockquote>,
                              a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">{children}</a>,
                              hr: () => <hr className="my-4 border-slate-100" />,
                              table: ({ children }) => <div className="overflow-x-auto my-3"><table className="text-[12px] border-collapse w-full">{children}</table></div>,
                              th: ({ children }) => <th className="border border-slate-200 bg-slate-50 px-2 py-1 text-left font-semibold">{children}</th>,
                              td: ({ children }) => <td className="border border-slate-200 px-2 py-1 align-top">{children}</td>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {msg.sources && msg.sources.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {msg.sources.map((s, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                          >
                            <Badge
                              variant="secondary"
                              className="bg-primary/5 hover:bg-primary/10 text-primary border-primary/20 gap-1.5 py-1 px-2.5 cursor-help"
                            >
                              <BookOpen className="h-3 w-3" />
                              <span className="font-bold text-[10px] uppercase tracking-tight">{s.titre}</span>
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-primary/20">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-6 pt-0 relative z-10">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-teal-500/50 rounded-[24px] blur opacity-0 group-focus-within:opacity-30 transition duration-500" />
          <div className="relative bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden focus-within:border-primary transition-all">
            <div className="flex items-end p-2 gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ex: Quel est le montant de l'indemnité compensatrice de congés ?"
                className="flex-1 w-full border-none focus-visible:ring-0 resize-none min-h-[50px] max-h-32 py-3 px-4 text-sm font-medium text-slate-700 bg-transparent"
                rows={1}
                disabled={loading}
              />
              <div className="flex flex-col gap-2 pb-1.5 pr-1.5">
                <Button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className={`h-10 w-10 rounded-2xl p-0 transition-all duration-300 shadow-md ${
                    input.trim() ? "translate-y-0 scale-100 shadow-primary/30" : "translate-y-1 scale-95 shadow-none"
                  }`}
                >
                  {loading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                      <Sparkles className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="px-4 py-2 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                <span className="flex items-center gap-1.5">
                  <div className="h-1 w-1 rounded-full bg-slate-300" />
                  Shift + Entree : Saut
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="h-1 w-1 rounded-full bg-slate-300" />
                  Entree : Envoyer
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary/60 uppercase">
                <Info className="h-3 w-3" />
                Dernière Loi: 2015
              </div>
            </div>
          </div>
        </div>
        
        <p className="mt-4 text-center text-[10px] text-slate-600 font-medium px-4">
          Ces réponses sont générées par IA à titre informatif sur la base de la législation ivoirienne.
          <span className="text-primary/60 ml-1 cursor-help hover:underline">Accéder au Code Complet</span>
        </p>
      </div>
    </div>
  );
}

