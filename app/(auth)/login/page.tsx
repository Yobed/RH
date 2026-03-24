"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClientSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Building2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginFormValues) {
    const supabase = createClientSupabase();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast.error("Identifiants incorrects. Vérifiez votre email et mot de passe.");
      return;
    }

    router.push("/rh");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="pb-4 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <Building2 className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold">RH Manager CI</h1>
        <p className="text-sm text-muted-foreground">
          Gestion des ressources humaines — Droit ivoirien
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="email">
              Adresse email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="vous@entreprise.ci"
              autoComplete="email"
              {...register("email", {
                required: "Email requis",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Adresse email invalide",
                },
              })}
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="password">
              Mot de passe
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                className="pr-10"
                {...register("password", {
                  required: "Mot de passe requis",
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Connexion en cours…" : "Se connecter"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
