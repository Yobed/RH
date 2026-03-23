# SKILL — Formulaires RH
> Lis ce fichier avant de créer tout formulaire avec upload de documents.

## Stack
react-hook-form + zod + shadcn/ui + Supabase Storage

## Pattern upload fichier
```ts
// lib/supabase/storage.ts
export async function uploadDocument(file: File, bucket: string, path: string) {
  const supabase = createBrowserClient()
  const { data, error } = await supabase.storage.from(bucket).upload(path, file)
  if (error) throw new Error(`Upload échoué : ${error.message}`)
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return urlData.publicUrl
}

export function buildStoragePath(companyId: string, employeeId: string, famille: string, filename: string) {
  return `documents/${companyId}/${employeeId}/${famille}/${Date.now()}_${filename}`
}
```

## Formulaire upload document (pattern complet)
```tsx
const schema = z.object({
  name: z.string().min(2),
  famille: z.enum(["Contrat","Diplômes","Paie","Médical","Congés","Disciplinaire","Formation","Autre"]),
  file: z.instanceof(File)
    .refine(f => f.size <= 10 * 1024 * 1024, "Max 10 Mo")
    .refine(f => ["application/pdf","image/jpeg","image/png"].includes(f.type), "PDF, JPEG ou PNG")
})
```

## Familles de documents
Contrat | Diplômes | Paie | Médical | Congés | Disciplinaire | Formation | Autre

## Règles UX
- Validation temps réel (afficher erreurs en cours de saisie)
- Désactiver bouton submit pendant envoi
- Toast succès + redirection après soumission
- Taille max affichée clairement
- Formats acceptés affichés sous le champ

## Notifications toast
```ts
import { toast } from "sonner"
toast.success("Document enregistré")
toast.error("Erreur upload. Réessayez.")
```
