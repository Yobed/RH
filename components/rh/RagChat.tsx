"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Send, Bot, User, BookOpen, Trash2, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <div className="flex h-full flex-col">
      {/* Zone messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-5 py-8 text-center">
            {/* Icône */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Scale className="h-8 w-8 text-primary" />
            </div>

            <div>
              <h2 className="text-xl font-bold">Agent Juridique RH</h2>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                Posez vos questions sur le droit du travail ivoirien.
                Je m'appuie sur le Code du Travail CI (Loi 2015-532).
              </p>
            </div>

            {/* Questions suggérées */}
            <div className="grid gap-2 sm:grid-cols-2 max-w-xl w-full">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="rounded-lg border bg-white px-4 py-3 text-sm text-left hover:bg-muted/40 hover:border-primary/30 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Ces réponses sont indicatives — consultez un juriste pour les cas complexes.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {/* Avatar assistant */}
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`flex flex-col gap-2 max-w-[78%] ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                {/* Bulle */}
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-white border shadow-sm rounded-tl-sm"
                  }`}
                >
                  {msg.loading ? (
                    <div className="flex items-center gap-1.5 py-0.5">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" />
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>

                {/* Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.map((s, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="gap-1 text-xs font-normal"
                      >
                        <BookOpen className="h-3 w-3" />
                        {s.titre}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Avatar utilisateur */}
              {msg.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted mt-0.5">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Zone saisie */}
      <div className="border-t bg-white px-4 py-3">
        {messages.length > 0 && (
          <div className="flex justify-end mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMessages([])}
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Nouvelle conversation
            </Button>
          </div>
        )}

        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez votre question… (Entrée pour envoyer, Shift+Entrée pour saut de ligne)"
            className="resize-none min-h-[48px] max-h-36 text-sm"
            rows={1}
            disabled={loading}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            size="sm"
            className="h-12 w-12 shrink-0 p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          Basé sur le Code du Travail ivoirien (Loi 2015-532) ·
          Vérifiez toujours avec un juriste qualifié
        </p>
      </div>
    </div>
  );
}
