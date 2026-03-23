# SKILL — Agent IA & RAG Juridique
> Lis ce fichier avant de toucher à l'agent RAG ou au scoring CV.

## Architecture RAG
PDF (Code Travail CI, Conventions) → Chunking → Embedding → pgvector
Question RH → Embedding → Recherche cosinus → Claude → Réponse sourcée

## Route API — Agent RAG
```ts
// app/api/rag/query/route.ts
import Anthropic from "@anthropic-ai/sdk"
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const { question } = await req.json()

  // Déclencher via n8n (qui gère embedding + recherche pgvector)
  const result = await fetch(`${process.env.N8N_BASE_URL}/webhook/rag/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  }).then(r => r.json())

  return NextResponse.json(result)
}
```

## Route API — Scoring CV
```ts
// app/api/recrutement/score-cv/route.ts
const message = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [{
    role: "user",
    content: `Analyse ce CV pour : ${job.titre}\nCompétences : ${job.competences}\nCV : ${cvText}\nRéponds en JSON : {"score_global": 0-100, "recommandation": "shortlist|refus"}`
  }]
})
```

## Fonction RPC Supabase (RAG search)
```sql
CREATE OR REPLACE FUNCTION match_legal_documents(
  query_embedding VECTOR(1536),
  filter_company_id UUID DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (id UUID, contenu TEXT, source TEXT, similarity FLOAT)
LANGUAGE SQL AS $$
  SELECT id, contenu, source, 1 - (embedding <=> query_embedding) AS similarity
  FROM legal_documents
  WHERE (company_id IS NULL OR company_id = filter_company_id)
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

## Documents à ingérer en priorité
1. Code du Travail CI (Loi 2015-532)
2. Convention Collective Interprofessionnelle CI
3. Décrets d'application du Code du Travail
4. Règlement intérieur de l'entreprise (par tenant)
