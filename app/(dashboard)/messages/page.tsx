import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MessagesClient } from "./MessagesClient";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-white px-6 py-4">
        <h1 className="text-2xl font-bold text-slate-900">Messagerie</h1>
        <p className="text-sm text-slate-600 mt-1">Communication interne RH ↔ Employés</p>
      </div>
      <div className="flex-1 overflow-hidden">
        <MessagesClient currentUserId={user.id} />
      </div>
    </div>
  );
}
