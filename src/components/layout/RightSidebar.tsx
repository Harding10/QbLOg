"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getUserNotes } from "@/lib/firebase/services/notes";
import { getUserBugs } from "@/lib/firebase/services/bugs";
import { getUserEvents } from "@/lib/firebase/services/events";
import { getUserSnippets } from "@/lib/firebase/services/snippets";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  Send, Sparkles, Clock, ArrowUpRight, Zap,
  BookOpen, Bug, FileText, Calendar, Code, Trash2, History
} from "lucide-react";

interface TimelineItem {
  id: string;
  title: string;
  type: "journal" | "bug" | "file" | "event" | "snippet";
  date: Date;
  extra?: string;
  href: string;
}

interface ChatHistoryItem {
  id: string;
  question: string;
  response: string;
  timestamp: number;
}

export function RightSidebar() {
  const { user } = useAuth();
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(true);
  
  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);

  // Load chat history & timeline
  useEffect(() => {
    // LocalStorage history
    try {
      const saved = localStorage.getItem("qblog_chat_history");
      if (saved) {
        setChatHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadTimelineData = async () => {
      setLoadingTimeline(true);
      try {
        const userId = user.uid;

        // 1. Fetch Notes (Journal)
        const notes = await getUserNotes(userId).catch(() => []);
        // 2. Fetch Bugs
        const bugs = await getUserBugs(userId).catch(() => []);
        // 3. Fetch Agenda Events
        const events = await getUserEvents(userId).catch(() => []);
        
        // 4. Fetch Files
        let files: any[] = [];
        try {
          const filesQ = query(collection(db, "files"), where("userId", "==", userId));
          const snap = await getDocs(filesQ);
          files = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
          console.error("Error fetching files for timeline:", e);
        }

        const parseDate = (d: any): Date => {
          if (!d) return new Date(0);
          if (d.seconds) return new Date(d.seconds * 1000);
          if (d.toDate) return d.toDate();
          return new Date(d);
        };

        // Construct consolidated timeline
        const items: TimelineItem[] = [
          ...notes.map((item) => ({
            id: item.id || "",
            title: item.title,
            type: "journal" as const,
            date: parseDate(item.createdAt || item.updatedAt),
            href: `/journal/${item.id}`,
            extra: "Log écrit",
          })),
          ...bugs.map((item) => ({
            id: item.id || "",
            title: item.title,
            type: "bug" as const,
            date: parseDate(item.createdAt),
            href: `/bugs`,
            extra: `Bug [${item.status}]`,
          })),
          ...events.map((item) => ({
            id: item.id || "",
            title: item.title,
            type: "event" as const,
            date: parseDate(item.date),
            href: `/agenda`,
            extra: "Agenda",
          })),
          ...files.map((item) => ({
            id: item.id || "",
            title: item.name,
            type: "file" as const,
            date: parseDate(item.createdAt),
            href: `/files`,
            extra: "Fichier",
          })),
        ];

        // Sort items by date desc (newest first)
        const sorted = items
          .filter(item => item.date.getTime() > 0)
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, 8); // Top 8 items

        setTimeline(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTimeline(false);
      }
    };

    loadTimelineData();
  }, [user]);

  const handleSend = async () => {
    if (!chatInput.trim()) return;
    const q = chatInput.trim();
    setChatInput("");
    setIsThinking(true);
    setChatResponse("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: q }]
        })
      });

      if (!res.ok) throw new Error("Erreur de communication");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Impossible de lire le flux");

      const decoder = new TextDecoder();
      let done = false;
      let text = "";

      setIsThinking(false);

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          const parts = chunk.split("\n");
          for (const part of parts) {
            if (part.startsWith('0:')) {
              try {
                const content = JSON.parse(part.slice(2));
                text += content;
                setChatResponse(text);
              } catch (e) {
                // fallthrough
              }
            }
          }
        }
      }

      // Add to history
      if (text.trim()) {
        const newHist: ChatHistoryItem = {
          id: Math.random().toString(36).substring(7),
          question: q,
          response: text,
          timestamp: Date.now()
        };
        const updated = [newHist, ...chatHistory];
        setChatHistory(updated);
        localStorage.setItem("qblog_chat_history", JSON.stringify(updated));
      }

    } catch (err) {
      console.error(err);
      setChatResponse("Désolé, une erreur est survenue lors de la communication avec l'assistant.");
    } finally {
      setIsThinking(false);
    }
  };

  const clearHistory = () => {
    setChatHistory([]);
    localStorage.removeItem("qblog_chat_history");
  };

  const selectHistoryItem = (item: ChatHistoryItem) => {
    setChatResponse(item.response);
  };

  // Helper to choose corresponding styles
  const getTimelineStyles = (type: string) => {
    switch (type) {
      case "journal":
        return { icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" };
      case "bug":
        return { icon: Bug, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" };
      case "file":
        return { icon: FileText, color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-100" };
      case "event":
        return { icon: Calendar, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" };
      case "snippet":
        return { icon: Code, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" };
      default:
        return { icon: Clock, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-100" };
    }
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "À l'instant";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Il y a ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Hier";
    return `Il y a ${days}j`;
  };

  return (
    <aside className="w-72 flex flex-col h-full z-20 bg-white border-l border-slate-200 overflow-hidden">
      
      {/* ── Header ── */}
      <div className="h-[57px] flex items-center px-4 border-b border-slate-200 gap-2 flex-shrink-0 bg-white/95 backdrop-blur-xl">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
        </span>
        <h2 className="text-[13px] font-semibold text-slate-800 tracking-wide uppercase">
          Flux &amp; Copilot
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 gh-scrollbar">

        {/* ── MINI TIMELINE SECTION ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
              Mini Timeline
            </p>
            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full font-medium">
              Activité
            </span>
          </div>

          <div className="relative pl-3 border-l border-slate-100 space-y-4 py-1 max-h-[220px] overflow-y-auto gh-scrollbar">
            {loadingTimeline ? (
              <div className="space-y-3.5 pl-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-6 h-6 rounded bg-slate-100 animate-pulse flex-shrink-0" />
                    <div className="space-y-1.5 flex-1 pt-0.5">
                      <div className="h-3 bg-slate-100 rounded w-4/5 animate-pulse" />
                      <div className="h-2 bg-slate-100 rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : timeline.length === 0 ? (
              <div className="text-center py-6">
                <Clock className="w-5 h-5 text-slate-300 mx-auto mb-1.5" />
                <p className="text-[11px] text-slate-400">Aucune activité récente</p>
              </div>
            ) : (
              timeline.map((item) => {
                const style = getTimelineStyles(item.type);
                const Icon = style.icon;
                return (
                  <Link
                    key={item.id + item.type}
                    href={item.href}
                    className="group relative flex gap-3 items-start pl-1.5 transition-all"
                  >
                    {/* Circle Bullet */}
                    <div className="absolute left-[-17px] top-1 w-2 h-2 rounded-full bg-slate-300 group-hover:bg-indigo-500 border border-white transition-colors" />

                    <div className={`w-6 h-6 rounded-md ${style.bg} border ${style.border} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105`}>
                      <Icon className={`w-3.5 h-3.5 ${style.color}`} />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <p className="text-[11.5px] font-medium text-slate-700 group-hover:text-indigo-600 truncate transition-colors leading-tight">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9.5px] text-slate-400 font-semibold uppercase tracking-wider">
                          {item.extra}
                        </span>
                        <span className="text-[9.5px] text-slate-300 font-bold">•</span>
                        <span className="text-[9.5px] text-slate-400">
                          {timeAgo(item.date)}
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-px group-hover:-translate-y-px transition-all opacity-0 group-hover:opacity-100 flex-shrink-0 mt-0.5" />
                  </Link>
                );
              })
            )}
          </div>
        </section>

        {/* ── AI ASSISTANT & CHAT ── */}
        <section className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-200 bg-slate-50">
              <div className="w-5 h-5 rounded flex items-center justify-center bg-indigo-50 border border-indigo-100">
                <Sparkles className="w-3 h-3 text-indigo-600" />
              </div>
              <span className="text-[12px] font-semibold text-slate-800">Assistant Qb</span>
              <span className="ml-auto text-[9px] py-0.5 px-1.5 rounded bg-indigo-100/60 text-indigo-700 font-bold uppercase tracking-wider">Gemini</span>
            </div>

            {/* Chat Body */}
            <div className="p-3">
              {chatResponse !== null ? (
                <div className="space-y-2">
                  <div className="flex gap-2 items-start">
                    <div className="w-5 h-5 rounded flex items-center justify-center bg-indigo-50 border border-indigo-100 flex-shrink-0 mt-0.5">
                      <Zap className="w-3 h-3 text-indigo-500" />
                    </div>
                    <p className="text-[12px] text-slate-600 leading-relaxed flex-1 whitespace-pre-line">
                      {chatResponse || "Génération..."}
                    </p>
                  </div>
                  <button
                    onClick={() => setChatResponse(null)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium transition-colors pl-7"
                  >
                    ← Poser une autre question
                  </button>
                </div>
              ) : isThinking ? (
                <div className="flex items-center gap-1.5 py-2 pl-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                  <span className="text-[11px] text-slate-400 ml-1">Analyse en cours...</span>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Poser une question dev..."
                    className="
                      flex-1 text-[12px] py-1.5 px-2.5 rounded-md
                      bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400
                      focus:border-indigo-400 focus:bg-white focus:ring-0 transition-colors
                    "
                  />
                  <button
                    onClick={handleSend}
                    disabled={!chatInput.trim()}
                    className="
                      w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0
                      bg-indigo-500 hover:bg-indigo-600 text-white
                      disabled:opacity-30 disabled:cursor-not-allowed
                      transition-colors duration-150 shadow-sm
                    "
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── CHAT HISTORY SECTION ── */}
        <section>
          <div className="flex items-center justify-between mb-2 px-0.5">
            <div className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                Historique de chat
              </p>
            </div>
            {chatHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-[10px] text-slate-400 hover:text-rose-500 font-medium transition-colors"
              >
                Tout effacer
              </button>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100 max-h-[180px] overflow-y-auto gh-scrollbar">
            {chatHistory.length === 0 ? (
              <div className="px-3 py-6 text-center text-slate-400">
                <p className="text-[11px]">Aucun historique de chat</p>
              </div>
            ) : (
              chatHistory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectHistoryItem(item)}
                  className="w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors group flex items-start gap-2.5 min-w-0"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 mt-0.5 flex-shrink-0 transition-colors" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-slate-600 group-hover:text-slate-900 truncate leading-tight font-medium transition-colors">
                      {item.question}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate leading-none">
                      {item.response}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

      </div>
    </aside>
  );
}
