"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClientSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, User, Mail, Lock, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error("Le nom de la société est requis.");
      return;
    }
    setLoading(true);
    const supabase = createClientSupabase();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          company_name: companyName.trim(),
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-10 shadow-lg text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
          <CheckCircle className="h-7 w-7 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Compte créé !</h2>
        <p className="text-sm text-slate-500">
          Un email de confirmation a été envoyé à <span className="font-semibold text-slate-700">{email}</span>.
          Confirmez votre adresse puis connectez-vous.
        </p>
        <Button
          onClick={() => router.push("/login")}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Aller à la connexion
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      {/* En-tête */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200">
          <Building2 className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Créer votre espace RH</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Accès multi-sociétés — chaque compte est isolé et sécurisé.
        </p>
      </div>

      {/* Formulaire */}
      <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Nom de la société */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Nom de la société *
            </label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex : Gravel Ivoire SARL"
                required
                className="pl-10 bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-200"
              />
            </div>
          </div>

          {/* Nom complet */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Votre nom complet
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex : Kouassi Jean-Marc"
                className="pl-10 bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-200"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Email *
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@societe.ci"
                required
                className="pl-10 bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-200"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Mot de passe *
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                required
                minLength={6}
                className="pl-10 bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-200"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11 text-sm font-semibold mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Création en cours...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Créer mon espace RH
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>
      </div>

      {/* Lien connexion */}
      <p className="mt-5 text-center text-sm text-slate-500">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
