import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse, NextRequest } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const rl = checkRateLimit(_req, { limit: 5, windowMs: 60_000, key: "invite-portail" });
  if (!rl.success) return rateLimitResponse(rl.resetAt);
  const supabase = createServerClient();

  // Vérification session admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role, company_id")
    .eq("id", user.id)
    .single();

  if (!adminProfile || adminProfile.role === "salarie") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // Récupération de l'employé
  const { data: emp } = await supabase
    .from("employees")
    .select("id, full_name, email, company_id")
    .eq("id", params.id)
    .eq("company_id", adminProfile.company_id)
    .single();

  if (!emp) return NextResponse.json({ error: "Employé introuvable" }, { status: 404 });
  if (!emp.email) return NextResponse.json({ error: "Cet employé n'a pas d'email renseigné" }, { status: 422 });

  // Vérifier si un compte auth existe déjà pour cet employé
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("employee_id", emp.id)
    .maybeSingle();

  if (existingProfile) {
    return NextResponse.json(
      { error: "Ce salarié a déjà un accès au portail", alreadyExists: true },
      { status: 409 }
    );
  }

  const adminClient = createAdminClient();

  // Créer le compte Supabase Auth avec un mot de passe temporaire aléatoire
  const tempPassword = crypto.randomUUID().replace(/-/g, "").substring(0, 16) + "Aa1!";

  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email: emp.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: emp.full_name },
  });

  if (authError || !authUser.user) {
    // Si le compte existe déjà dans auth mais pas dans profiles
    if (authError?.message?.includes("already registered")) {
      return NextResponse.json({ error: "Un compte auth existe déjà pour cet email" }, { status: 409 });
    }
    return NextResponse.json({ error: authError?.message ?? "Erreur création compte" }, { status: 500 });
  }

  // Upsert le profil avec le rôle salarie + lien employee_id
  const { error: profileError } = await adminClient
    .from("profiles")
    .upsert({
      id: authUser.user.id,
      email: emp.email,
      full_name: emp.full_name,
      role: "salarie",
      company_id: emp.company_id,
      employee_id: emp.id,
    });

  if (profileError) {
    // Rollback : supprimer l'utilisateur créé
    await adminClient.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: "Erreur création profil", detail: profileError.message }, { status: 500 });
  }

  // Envoyer un email de réinitialisation de mot de passe (lien de connexion)
  await adminClient.auth.admin.generateLink({
    type: "recovery",
    email: emp.email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/portail` },
  });

  return NextResponse.json({
    success: true,
    message: `Invitation envoyée à ${emp.email}`,
    userId: authUser.user.id,
  });
}
