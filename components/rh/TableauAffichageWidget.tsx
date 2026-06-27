"use client";

import { useState } from "react";
import { MessageSquare, Heart, Smile, ThumbsUp, Share2, Image as ImageIcon, ArrowRight, Sparkles } from "lucide-react";

interface Post {
  id: string;
  author: string;
  avatar: string;
  date: string;
  title: string;
  content: string;
  image?: string;
  reactions: {
    likes: number;
    hearts: number;
    smileys: number;
  };
  commentsCount: number;
}

export function TableauAffichageWidget() {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "1",
      author: "Hélène Caron",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      date: "3 avril 2026",
      title: "Final de tennis inter-entreprises 2026 🎾",
      content: "Félicitations à l'équipe RH et Opérations pour la victoire lors du tournoi de ce week-end au Club de Tennis de Marcory !",
      image: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600&auto=format&fit=crop&q=80",
      reactions: { likes: 13, hearts: 8, smileys: 5 },
      commentsCount: 4,
    },
    {
      id: "2",
      author: "Nathalie Faure",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      date: "Aujourd'hui",
      title: "Bienvenue aux 3 nouveaux talentueux collaborateurs ! 🎉",
      content: "Souhaitons une chaleureuse bienvenue à Marc, Sophie et Ibrahim qui rejoignent les équipes IT et Finance ce matin.",
      reactions: { likes: 24, hearts: 15, smileys: 9 },
      commentsCount: 8,
    },
  ]);

  const handleReact = (postId: string, type: "likes" | "hearts" | "smileys") => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              reactions: {
                ...p.reactions,
                [type]: p.reactions[type] + 1,
              },
            }
          : p
      )
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Tableau d'affichage</h3>
            <p className="text-[11px] text-slate-500 font-medium">Vie d'entreprise & annonces internes</p>
          </div>
        </div>
        <button className="text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1 hover:underline">
          <span>Voir tout</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Feed Cards */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 transition-all hover:border-purple-200"
          >
            {/* Author info */}
            <div className="flex items-center gap-3 mb-2.5">
              <img
                src={post.avatar}
                alt={post.author}
                className="h-8 w-8 rounded-full object-cover ring-2 ring-white dark:ring-slate-700"
              />
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-none">{post.author}</h4>
                <span className="text-[10px] text-slate-400 mt-0.5 block">{post.date}</span>
              </div>
            </div>

            {/* Post Title & Content */}
            <h5 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-1">{post.title}</h5>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">{post.content}</p>

            {/* Attached Image */}
            {post.image && (
              <div className="mb-3 rounded-lg overflow-hidden h-40 w-full relative group">
                <img
                  src={post.image}
                  alt="Attachment"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}

            {/* Reactions & Interaction bar */}
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleReact(post.id, "likes")}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 text-slate-600 dark:text-slate-300 text-[11px] font-bold border border-slate-200/60 transition-all"
                >
                  <span>👍</span>
                  <span>{post.reactions.likes}</span>
                </button>
                <button
                  onClick={() => handleReact(post.id, "hearts")}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-rose-50 text-slate-600 dark:text-slate-300 text-[11px] font-bold border border-slate-200/60 transition-all"
                >
                  <span>❤️</span>
                  <span>{post.reactions.hearts}</span>
                </button>
                <button
                  onClick={() => handleReact(post.id, "smileys")}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-50 text-slate-600 dark:text-slate-300 text-[11px] font-bold border border-slate-200/60 transition-all"
                >
                  <span>😊</span>
                  <span>{post.reactions.smileys}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {post.commentsCount}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
