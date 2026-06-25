import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Lire .env.local ---
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
const ANON_KEY = env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
const SERVICE_ROLE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"];

const EMAIL = process.argv[2] || "yobed.sarl@gmail.com";
const PASSWORD = process.argv[3] || "Waliyatb1";
const DO_FIX = process.argv.includes("--fix");

console.log("\n=== DIAGNOSTIC CONNEXION ===");
console.log("URL projet :", SUPABASE_URL);
console.log("Email testé:", EMAIL);
console.log("Mode       :", DO_FIX ? "DIAGNOSTIC + CORRECTION" : "DIAGNOSTIC SEUL");
console.log("");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anon = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- 1. Le compte existe-t-il ? (clé service_role) ---
const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 200 });
if (listErr) {
  console.error("❌ Impossible de lister les utilisateurs:", listErr.message);
  console.error("   (projet injoignable ? clé service_role invalide ?)");
  process.exit(1);
}

const user = list.users.find((u) => (u.email || "").toLowerCase() === EMAIL.toLowerCase());

if (!user) {
  console.log("❌ AUCUN compte avec cet email dans ce projet.");
  console.log("   Comptes existants :", list.users.map((u) => u.email).join(", ") || "(aucun)");
  console.log("\n→ Le compte n'existe pas. Crée-le avec :");
  console.log(`   node scripts/create-admin.mjs ${EMAIL} ${PASSWORD}`);
  process.exit(0);
}

console.log("✅ Compte trouvé");
console.log("   id                :", user.id);
console.log("   email_confirmed_at:", user.email_confirmed_at || "❌ NON CONFIRMÉ");
console.log("   banned_until      :", user.banned_until || "—");
console.log("   last_sign_in_at   :", user.last_sign_in_at || "jamais");
console.log("   providers         :", (user.identities || []).map((i) => i.provider).join(", ") || "—");

// --- 2. Reproduire l'erreur exacte que l'app reçoit ---
console.log("\n=== TEST DE CONNEXION (comme l'app) ===");
const { data: signIn, error: signErr } = await anon.auth.signInWithPassword({
  email: EMAIL,
  password: PASSWORD,
});
if (signErr) {
  console.log("❌ Échec :", signErr.message, `(status ${signErr.status})`);
} else {
  console.log("✅ Connexion RÉUSSIE — le mot de passe testé est correct.");
  console.log("   user:", signIn.user.email);
}

// --- 3. Correction (si --fix) ---
if (DO_FIX) {
  console.log("\n=== CORRECTION ===");
  const { error: fixErr } = await admin.auth.admin.updateUserById(user.id, {
    password: PASSWORD,
    email_confirm: true,
    ban_duration: "none",
  });
  if (fixErr) {
    console.error("❌ Échec correction:", fixErr.message);
    process.exit(1);
  }
  console.log("✅ Mot de passe réinitialisé + email confirmé + déban éventuel levé.");

  // Re-tester
  const { error: retryErr } = await anon.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  console.log(retryErr
    ? `❌ Toujours en échec : ${retryErr.message}`
    : "🎉 Connexion vérifiée — tu peux te connecter dans l'app.");
  console.log("\n   Email       :", EMAIL);
  console.log("   Mot de passe:", PASSWORD);
} else {
  console.log("\n→ Pour corriger (réinitialise le mot de passe + confirme l'email) :");
  console.log(`   node scripts/diag-login.mjs "${EMAIL}" "${PASSWORD}" --fix`);
}
console.log("");
