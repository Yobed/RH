import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://nfnqfaeydefqabwewtbe.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbnFmYWV5ZGVmcWFid2V3dGJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI2MzM3MywiZXhwIjoyMDg5ODM5MzczfQ.wTe0ppcBTMYKR11FHQH8lVc26npu3OXq3SLmMDdbfzg";

const EMAIL = process.argv[2];
const PASSWORD = process.argv[3] || "Admin2025!";
const FULL_NAME = process.argv[4] || "Administrateur RH";
const COMPANY_NAME = process.argv[5] || "Mon Entreprise CI";

if (!EMAIL) {
  console.error("Usage: node create-admin.mjs <email> [password] [full_name] [company_name]");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 1. Créer l'utilisateur via admin
console.log(`Création du compte pour ${EMAIL}...`);
const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email: EMAIL,
  password: PASSWORD,
  email_confirm: true,
});

if (authError) {
  console.error("Erreur création utilisateur:", authError.message);
  process.exit(1);
}
const userId = authData.user.id;
console.log("✓ Compte créé, ID:", userId);

// 2. Créer l'entreprise
const { data: company, error: companyError } = await supabase
  .from("companies")
  .insert({ name: COMPANY_NAME })
  .select()
  .single();

if (companyError) {
  console.error("Erreur création entreprise:", companyError.message);
  process.exit(1);
}
console.log("✓ Entreprise créée:", company.name, "(", company.id, ")");

// 3. Créer le profil
const { error: profileError } = await supabase.from("profiles").insert({
  id: userId,
  company_id: company.id,
  full_name: FULL_NAME,
  role: "admin",
  email: EMAIL,
});

if (profileError) {
  console.error("Erreur création profil:", profileError.message);
  process.exit(1);
}
console.log("✓ Profil créé");
console.log("\n=== Compte prêt ===");
console.log("Email    :", EMAIL);
console.log("Password :", PASSWORD);
console.log("Connectez-vous sur http://localhost:3002/login");
