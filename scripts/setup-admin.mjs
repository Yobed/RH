import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Lire .env.local
const envPath = resolve(__dirname, "../.env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const SUPABASE_URL = env["NEXT_PUBLIC_SUPABASE_URL"];
const SERVICE_ROLE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ADMIN_EMAIL = "admin@yobed.ci";
const ADMIN_PASSWORD = "Waliyatb1";

async function main() {
  console.log(`\n🔧 Setup RH Manager CI → ${SUPABASE_URL}\n`);

  // 1. Créer l'utilisateur auth
  console.log("1️⃣  Création du compte admin...");
  const { data: userData, error: userError } =
    await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });

  if (userError && !userError.message.includes("already been registered")) {
    console.error("   ❌ Erreur auth :", userError.message);
    process.exit(1);
  }

  // Si l'utilisateur existe déjà, le récupérer
  let userId = userData?.user?.id;
  if (!userId) {
    const { data: list } = await supabase.auth.admin.listUsers();
    const existing = list?.users?.find((u) => u.email === ADMIN_EMAIL);
    if (existing) {
      userId = existing.id;
      console.log("   ℹ️  Compte existant trouvé :", userId);
    } else {
      console.error("   ❌ Impossible de trouver l'utilisateur");
      process.exit(1);
    }
  } else {
    console.log("   ✅ Compte créé :", userId);
  }

  // 2. Créer la company
  console.log("2️⃣  Création de la company...");
  const { data: existingCompany } = await supabase
    .from("companies")
    .select("id")
    .eq("name", "Yobed CI")
    .single();

  let companyId = existingCompany?.id;

  if (!companyId) {
    const { data: newCompany, error: companyError } = await supabase
      .from("companies")
      .insert({ name: "Yobed CI", convention_collective: "Convention Collective Interprofessionnelle CI" })
      .select("id")
      .single();

    if (companyError) {
      console.error("   ❌ Erreur company :", companyError.message);
      process.exit(1);
    }
    companyId = newCompany.id;
    console.log("   ✅ Company créée :", companyId);
  } else {
    console.log("   ℹ️  Company existante :", companyId);
  }

  // 3. Créer le profil admin
  console.log("3️⃣  Création du profil admin...");
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        company_id: companyId,
        role: "admin",
        full_name: "Administrateur",
        email: ADMIN_EMAIL,
      },
      { onConflict: "id" }
    );

  if (profileError) {
    console.error("   ❌ Erreur profil :", profileError.message);
    process.exit(1);
  }
  console.log("   ✅ Profil admin créé");

  console.log("\n🎉 Setup terminé !\n");
  console.log("   Email    :", ADMIN_EMAIL);
  console.log("   Mot de passe :", ADMIN_PASSWORD);
  console.log("   URL      :", "http://localhost:3000/login");
  console.log("");
}

main();
