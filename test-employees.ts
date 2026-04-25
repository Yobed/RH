import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

async function check() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const serviceClient = createClient(url, serviceKey);
  const anonClient = createClient(url, anonKey);

  console.log("Checking with SERVICE_ROLE_KEY (Bypass RLS):");
  const { data: serviceData, error: serviceErr } = await serviceClient.from("employees").select("id, full_name").limit(3);
  console.log("Data:", serviceData?.length, "Error:", serviceErr?.message);

  console.log("Checking with ANON_KEY (No user session):");
  const { data: anonData, error: anonErr } = await anonClient.from("employees").select("id, full_name").limit(3);
  console.log("Data:", anonData?.length, "Error:", anonErr?.message);
}

check();
