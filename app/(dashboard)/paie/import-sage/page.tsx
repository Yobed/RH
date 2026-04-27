import { SageImportDropzone } from "@/components/paie/SageImportDropzone";

export const metadata = { title: "Import Paie Sage — RH Manager CI" };

export default function ImportSagePage() {
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Import Paie Sage</h1>
        <p className="text-sm text-slate-600 mt-1">
          Importez votre livre de paie Sage dans le SIRH. Téléchargez le template,
          copiez vos données, puis importez le fichier rempli.
        </p>
      </div>
      <SageImportDropzone />
    </div>
  );
}
