"use client";

import { useState } from "react";
import { 
  MessageSquare, 
  Heart, 
  Smile, 
  ThumbsUp, 
  Send, 
  Image as ImageIcon, 
  ArrowRight, 
  Sparkles, 
  Plus, 
  X,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Trash2
} from "lucide-react";

interface Comment {
  id: string;
  author: string;
  avatar: string;
  date: string;
  content: string;
}

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
  userReactions?: {
    likes?: boolean;
    hearts?: boolean;
    smileys?: boolean;
  };
  comments: Comment[];
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
      userReactions: { likes: true },
      comments: [
        {
          id: "c1",
          author: "Kouassi Jean",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          date: "Il y a 2h",
          content: "Bravo à toute l'équipe ! Superbe performance 👏"
        },
        {
          id: "c2",
          author: "Awa Diop",
          avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
          date: "Il y a 1h",
          content: "Le trophée est bien installé au siège !"
        }
      ]
    },
    {
      id: "2",
      author: "Nathalie Faure",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      date: "Aujourd'hui",
      title: "Bienvenue aux 3 nouveaux talentueux collaborateurs ! 🎉",
      content: "Souhaitons une chaleureuse bienvenue à Marc, Sophie et Ibrahim qui rejoignent les équipes IT et Finance ce matin.",
      reactions: { likes: 24, hearts: 15, smileys: 9 },
      userReactions: { hearts: true, smileys: true },
      comments: [
        {
          id: "c3",
          author: "Marc Yao",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
          date: "Il y a 30 min",
          content: "Merci pour cet accueil si chaleureux ! Ravis de vous rejoindre."
        }
      ]
    },
  ]);

  // Interactive UI States
  const [openCommentPostId, setOpenCommentPostId] = useState<string | null>(null);
  const [newCommentInput, setNewCommentInput] = useState<{ [postId: string]: string }>({});
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);

  // Form State for New Post
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState("");

  const handleReact = (postId: string, type: "likes" | "hearts" | "smileys") => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const isAlreadyReacted = p.userReactions?.[type] || false;
        const delta = isAlreadyReacted ? -1 : 1;

        return {
          ...p,
          reactions: {
            ...p.reactions,
            [type]: Math.max(0, p.reactions[type] + delta),
          },
          userReactions: {
            ...p.userReactions,
            [type]: !isAlreadyReacted,
          },
        };
      })
    );
  };

  const handleToggleComments = (postId: string) => {
    setOpenCommentPostId(openCommentPostId === postId ? null : postId);
  };

  const handleAddComment = (postId: string) => {
    const text = newCommentInput[postId]?.trim();
    if (!text) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      author: "Vous (Directeur RH)",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      date: "À l'instant",
      content: text,
    };

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [...p.comments, newComment],
            }
          : p
      )
    );

    setNewCommentInput((prev) => ({ ...prev, [postId]: "" }));
  };

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: p.comments.filter((c) => c.id !== commentId),
            }
          : p
      )
    );
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;

    const newPost: Post = {
      id: Date.now().toString(),
      author: "Direction RH",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
      date: "À l'instant",
      title: postTitle,
      content: postContent,
      image: postImage.trim() || undefined,
      reactions: { likes: 1, hearts: 0, smileys: 0 },
      userReactions: { likes: true },
      comments: [],
    };

    setPosts([newPost, ...posts]);
    setPostTitle("");
    setPostContent("");
    setPostImage("");
    setIsCreatingPost(false);
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
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreatingPost(true)}
            className="text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:scale-95 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-xs"
            title="Publier une annonce"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Publier</span>
          </button>

          <button 
            onClick={() => setIsViewAllOpen(!isViewAllOpen)}
            className="text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1 hover:underline px-2 py-1.5 rounded-lg"
          >
            <span>{isViewAllOpen ? "Fermer" : "Voir tout"}</span>
            <ArrowRight className={`h-3.5 w-3.5 transition-transform ${isViewAllOpen ? "rotate-90" : ""}`} />
          </button>
        </div>
      </div>

      {/* Quick Post Creator Bar (Collapsed state trigger) */}
      {!isCreatingPost && (
        <div 
          onClick={() => setIsCreatingPost(true)}
          className="mb-4 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 flex items-center gap-3 cursor-pointer hover:border-purple-300 dark:hover:border-purple-600 transition-all group"
        >
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"
            alt="Vous"
            className="h-7 w-7 rounded-full object-cover ring-2 ring-purple-100"
          />
          <span className="text-xs text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 font-medium flex-1">
            Partager une annonce ou une nouveauté à l'équipe...
          </span>
          <ImageIcon className="h-4 w-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
        </div>
      )}

      {/* Modal / Expanded Form to Create Post */}
      {isCreatingPost && (
        <form onSubmit={handleCreatePost} className="mb-4 p-4 rounded-xl bg-purple-50/50 dark:bg-slate-800/80 border border-purple-200 dark:border-purple-900/50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              Nouvelle annonce interne
            </h4>
            <button 
              type="button" 
              onClick={() => setIsCreatingPost(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2.5">
            <input
              type="text"
              placeholder="Titre de l'annonce (ex: Tournoi, Événement, Arrivée...)"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              required
              className="w-full text-xs font-semibold px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />

            <textarea
              placeholder="Rédigez votre message ici..."
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              required
              rows={3}
              className="w-full text-xs px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 resize-none"
            />

            <input
              type="url"
              placeholder="URL d'une image d'illustration (optionnel)"
              value={postImage}
              onChange={(e) => setPostImage(e.target.value)}
              className="w-full text-[11px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreatingPost(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 flex items-center gap-1.5 shadow-xs transition-all"
              >
                <Send className="h-3 w-3" />
                Publier
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Feed Cards */}
      <div className="space-y-4">
        {posts.slice(0, isViewAllOpen ? posts.length : 2).map((post) => {
          const isCommentsOpen = openCommentPostId === post.id;

          return (
            <div
              key={post.id}
              className="group p-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 transition-all hover:border-purple-200 relative"
            >
              {/* Author info & Delete post button */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-3">
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

                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-all opacity-70 group-hover:opacity-100"
                  title="Supprimer cette publication"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Post Title & Content */}
              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">{post.title}</h5>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3 whitespace-pre-line">{post.content}</p>

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
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all active:scale-95 ${
                      post.userReactions?.likes
                        ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/60 hover:bg-slate-100"
                    }`}
                  >
                    <span>👍</span>
                    <span>{post.reactions.likes}</span>
                  </button>

                  <button
                    onClick={() => handleReact(post.id, "hearts")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all active:scale-95 ${
                      post.userReactions?.hearts
                        ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/60 hover:bg-slate-100"
                    }`}
                  >
                    <span>❤️</span>
                    <span>{post.reactions.hearts}</span>
                  </button>

                  <button
                    onClick={() => handleReact(post.id, "smileys")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all active:scale-95 ${
                      post.userReactions?.smileys
                        ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200/60 hover:bg-slate-100"
                    }`}
                  >
                    <span>😊</span>
                    <span>{post.reactions.smileys}</span>
                  </button>
                </div>

                <button
                  onClick={() => handleToggleComments(post.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isCommentsOpen
                      ? "text-purple-600 bg-purple-50 dark:bg-purple-950/50"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>{post.comments.length}</span>
                  {isCommentsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              </div>

              {/* Expandable Comments Section */}
              {isCommentsOpen && (
                <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2.5 animate-in fade-in duration-200">
                  {/* Existing Comments list */}
                  {post.comments.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="group/comment flex gap-2 p-2 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 items-start">
                          <img
                            src={comment.avatar}
                            alt={comment.author}
                            className="h-6 w-6 rounded-full object-cover shrink-0 mt-0.5"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-900 dark:text-white">{comment.author}</span>
                              <span className="text-[9px] text-slate-400">{comment.date}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">{comment.content}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteComment(post.id, comment.id)}
                            className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover/comment:opacity-100 transition-opacity"
                            title="Supprimer le commentaire"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic py-1 text-center">Aucun commentaire pour le moment. Soyez le premier à répondre !</p>
                  )}

                  {/* Add New Comment Input */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Écrire un commentaire..."
                      value={newCommentInput[post.id] || ""}
                      onChange={(e) =>
                        setNewCommentInput((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddComment(post.id);
                      }}
                      className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center transition-all shadow-xs"
                    >
                      <Send className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

