import { createServerClient } from "@/lib/supabase/server";
import { EmployeePhotoRegistryClient } from "@/components/rh/EmployeePhotoRegistryClient";
import { PageShell, PageHeader } from "@/components/ui/page-shell";
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
    <PageShell>
      <PageHeader
        eyebrow="Identité Visuelle & Biométrie"
        eyebrowIcon={<IdentificationBadge size={14} weight="bold" className="text-[#059669]" />}
        title="Registre Numérique des Photos"
        help="Table dédiée à la numérisation, au contrôle et à la gestion centralisée des photos d'identité des salariés pour le trombinoscope et le pointage faciale."
      />

      {/* Main Client Workspace */}
      <EmployeePhotoRegistryClient initialEmployees={employees ?? []} />
    </PageShell>
  );
}
