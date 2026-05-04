
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
  const content = "test content " + Date.now();
  const buffer = Buffer.from(content);
  
  console.log("Testing rh-documents bucket with documents/ prefix...");
  const { data: d1, error: e1 } = await supabase.storage
    .from("rh-documents")
    .upload(`documents/test_${Date.now()}.txt`, buffer, { upsert: true });
  
  if (e1) console.error("rh-documents error:", e1);
  else console.log("rh-documents success:", d1);

  console.log("\nTesting documents bucket...");
  const { data: d2, error: e2 } = await supabase.storage
    .from("documents")
    .upload(`test_${Date.now()}.txt`, buffer, { upsert: true });

  if (e2) console.error("documents error:", e2);
  else console.log("documents success:", d2);
}

test();
