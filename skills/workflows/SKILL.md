# SKILL — Workflows n8n
> Lis ce fichier avant de créer ou modifier un workflow n8n.

## Config n8n
- URL : https://yobed-n8n-supabase-claude.hf.space

## Workflow 1 — Alertes Contrats (Cron 08h00 quotidien)
Détecter les CDD/essais expirant dans 30j, 15j, 7j, 1j et envoyer emails.

Noeuds : Schedule → Supabase Query → Loop → Send Email

SQL Query :
```sql
SELECT c.id, c.type_contrat, c.date_fin, e.full_name, e.email, e.poste,
  EXTRACT(day FROM c.date_fin - NOW()) AS jours_restants
FROM contracts c
JOIN employees e ON c.employee_id = e.id
WHERE c.statut = 'actif'
  AND c.date_fin BETWEEN NOW() AND NOW() + INTERVAL '30 days'
ORDER BY c.date_fin ASC
```

## Workflow 2 — Ingestion RAG (Webhook POST /rag/ingest)
PDF → Extraction texte → Chunking 500 tokens → Embedding → pgvector

## Workflow 3 — Agent RAG Juridique (Webhook POST /rag/query)
Question → Embedding → pgvector search → Claude API → Réponse sourcée

Prompt Claude :
```
Tu es expert en droit du travail ivoirien.
CONTEXTE : {{contexte_rag}}
QUESTION : {{question}}
Réponds précisément, cite les articles de loi, indique si avis juridique externe nécessaire.
```

## Workflow 4 — Scoring CV (Webhook POST /recrutement/score-cv)
CV upload → Claude API scoring → Supabase update → Email si score >= 70

Prompt Claude :
```
Analyse ce CV pour le poste : {{titre}}
Compétences requises : {{competences}}
CV : {{cv_text}}
Réponds UNIQUEMENT en JSON :
{"score_global": 85, "detail": {"competences": 90, "experience": 80, "formation": 85}, "recommandation": "shortlist", "justification": "..."}
```

## Workflow 5 — Rappels Évaluations (Cron 1er du mois 09h00)
Créer évaluations dues + notifier managers par email

## Workflow 6 — Classification Documents (Webhook POST /documents/classify)
Nom fichier → Claude API → Famille détectée → Supabase update

## Appel depuis Next.js
```ts
// lib/n8n/webhooks.ts
export async function triggerN8n(path: string, payload: object) {
  const res = await fetch(`${process.env.N8N_BASE_URL}/webhook/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Secret": process.env.N8N_WEBHOOK_SECRET!,
    },
    body: JSON.stringify(payload),
  })
  return res.json()
}
```
