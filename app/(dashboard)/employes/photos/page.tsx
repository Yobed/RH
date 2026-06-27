import { createServerClient } from "@/lib/supabase/server";
import { EmployeePhotoRegistryClient } from "@/components/rh/EmployeePhotoRegistryClient";
import { PageHelp } from "@/components/rh/PageHelp";
import { IdentificationBadge } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";
export const metadata = { title: "Registre Photos & Trombinoscope — RH Manager CI" };

export default async function EmployeePhotosPage() {
  const supabase = createServerClient();

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, matricule, poste, departement, photo_url, statut, email, phone, type_contrat")
    .order("full_name", { ascending: true });

  return (
    <div className="p-6 md:p-8 space-y-6 bg-slate-50/50 min-h-screen">
      {/* Sleek Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200/80">
              <IdentificationBadge size={14} weight="bold" className="text-[#FF8200]" />
              Identité Visuelle & Biométrie
            </span>
            <PageHelp text="Table dédiée à la numérisation, au contrôle et à la gestion centralisée des photos d'identité des salariés pour le trombinoscope et le pointage faciale." />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Registre Numérique des Photos
          </h1>
        </div>
      </div>

      {/* Main Client Workspace */}
      <EmployeePhotoRegistryClient initialEmployees={employees ?? []} />
    </div>
  );
}
