
$token     = "vca_8gCdg646vHWwFhAFO5ubFQWLYvRH1eHKruZNxldXJ6FpI9R2HZ2W3TgD"
$projectId = "prj_wb6RTtGMx2M7oWIMFw1Z2esoT9GD"
$teamId    = "team_awjdn0pOsrBBVz04iuYXYyvu"
$baseUrl   = "https://api.vercel.com"
$headers   = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

$envVars = @(
    [PSCustomObject]@{ key = "NEXT_PUBLIC_SUPABASE_URL";      value = "https://nfnqfaeydefqabwewtbe.supabase.co"; type = "plain" },
    [PSCustomObject]@{ key = "NEXT_PUBLIC_SUPABASE_ANON_KEY"; value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbnFmYWV5ZGVmcWFid2V3dGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjMzNzMsImV4cCI6MjA4OTgzOTM3M30.r4Aj-GH9ookl3rRnp5tscsDMkiXdfxCvccjIfH_YiTw"; type = "plain" },
    [PSCustomObject]@{ key = "SUPABASE_SERVICE_ROLE_KEY";      value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbnFmYWV5ZGVmcWFid2V3dGJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI2MzM3MywiZXhwIjoyMDg5ODM5MzczfQ.wTe0ppcBTMYKR11FHQH8lVc26npu3OXq3SLmMDdbfzg"; type = "sensitive" },
    [PSCustomObject]@{ key = "GEMINI_API_KEY";                 value = "AIzaSyDtSWF8WlOwyPICkxYejYogH6abtsHxmfQ"; type = "sensitive" },
    [PSCustomObject]@{ key = "N8N_BASE_URL";                   value = "https://yobed-n8n-supabase-claude.hf.space"; type = "plain" },
    [PSCustomObject]@{ key = "N8N_WEBHOOK_SECRET";             value = "saas-rh-ci-2025-secret"; type = "sensitive" },
    [PSCustomObject]@{ key = "NEXT_PUBLIC_APP_URL";            value = "https://rh-manager-ci.vercel.app"; type = "plain" },
    [PSCustomObject]@{ key = "NEXT_PUBLIC_APP_NAME";           value = "RH Manager CI"; type = "plain" },
    [PSCustomObject]@{ key = "XAI_API_KEY";                    value = "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"; type = "sensitive" }
)

Write-Host "Recuperation des variables existantes..." -ForegroundColor Cyan
$listResp = Invoke-RestMethod -Uri "$baseUrl/v9/projects/$projectId/env?teamId=$teamId&limit=100" -Headers $headers -Method GET

$existingIds = @{}
foreach ($e in $listResp.envs) {
    $existingIds[$e.key] = $e.id
}
Write-Host "$($existingIds.Count) variables trouvees sur Vercel" -ForegroundColor Gray
Write-Host ""

foreach ($v in $envVars) {
    $body = @{
        key    = $v.key
        value  = $v.value
        type   = $v.type
        target = @("production", "preview")
    } | ConvertTo-Json -Depth 5

    if ($existingIds.ContainsKey($v.key)) {
        $id = $existingIds[$v.key]
        try {
            Invoke-RestMethod `
                -Uri "$baseUrl/v9/projects/$projectId/env/$id`?teamId=$teamId" `
                -Headers $headers -Method PATCH -Body $body | Out-Null
            Write-Host "  [UPDATED] $($v.key)" -ForegroundColor Green
        } catch {
            Write-Host "  [ERREUR]  $($v.key) : $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        try {
            Invoke-RestMethod `
                -Uri "$baseUrl/v10/projects/$projectId/env?teamId=$teamId" `
                -Headers $headers -Method POST -Body $body | Out-Null
            Write-Host "  [CREATED] $($v.key)" -ForegroundColor Green
        } catch {
            Write-Host "  [ERREUR]  $($v.key) : $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "Done! Lancement du redeploiement en production..." -ForegroundColor Cyan
cmd /c "npx vercel --prod --yes"
