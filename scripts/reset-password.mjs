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

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ADMIN_EMAIL = "yobed.sarl@gmail.com";
const NEW_PASSWORD = "Waliyatb1";

async function main() {
  console.log(`\n🔑 Réinitialisation du mot de passe pour ${ADMIN_EMAIL}\n`);

  // Trouver l'utilisateur
  const { data: list } = await supabase.auth.admin.listUsers();
  const user = list?.users?.find((u) => u.email === ADMIN_EMAIL);

  if (!user) {
    console.error("❌ Utilisateur non trouvé");
    process.exit(1);
  }

  console.log("✅ Utilisateur trouvé :", user.id);

  // Mettre à jour le mot de passe
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    password: NEW_PASSWORD,
    email_confirm: true,
  });

  if (error) {
    console.error("❌ Erreur :", error.message);
    process.exit(1);
  }

  console.log("\n🎉 Mot de passe réinitialisé avec succès !");
  console.log("   Email       :", ADMIN_EMAIL);
  console.log("   Mot de passe:", NEW_PASSWORD);
  console.log("   URL         : http://localhost:3002/login\n");
}

main();
