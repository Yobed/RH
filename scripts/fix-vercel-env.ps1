# ============================================================
# Script : Synchroniser les variables d'env Vercel (création + mise à jour)
# ============================================================
# Prérequis :
#   1. Variables sensibles chargées dans la session PowerShell :
#        $env:VERCEL_TOKEN          = "vca_xxx"
#        $env:SUPABASE_SERVICE_ROLE_KEY = "eyJ..."
#        $env:NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJ..."
#        $env:GEMINI_API_KEY        = "AIza..."
#        $env:XAI_API_KEY           = "gsk_..."
#        $env:N8N_WEBHOOK_SECRET    = "xxx"
#   2. Ou charge un .env.local avant :
#        Get-Content .env.local | ForEach-Object {
#          if ($_ -match '^([^=#]+)=(.+)$') { Set-Item -Path "env:$($matches[1].Trim())" -Value $matches[2].Trim('"',"'") }
#        }
# ============================================================

$token     = $env:VERCEL_TOKEN
if (-not $token) {
    # Fallback : lire le token Vercel CLI
    $vercelConfigPath = "$env:USERPROFILE\.vercel\auth.json"
    if (Test-Path $vercelConfigPath) {
        $token = (Get-Content $vercelConfigPath | ConvertFrom-Json).token
    }
}
if (-not $token) {
    Write-Host "❌ VERCEL_TOKEN manquant. `$env:VERCEL_TOKEN = 'vca_xxx' ou lance 'vercel login' d'abord." -ForegroundColor Red
    exit 1
}

$projectId = "prj_wb6RTtGMx2M7oWIMFw1Z2esoT9GD"
$teamId    = "team_awjdn0pOsrBBVz04iuYXYyvu"
$baseUrl   = "https://api.vercel.com"
$headers   = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }

$envVars = @(
    [PSCustomObject]@{ key = "NEXT_PUBLIC_SUPABASE_URL";       value = "https://nfnqfaeydefqabwewtbe.supabase.co";   type = "plain"     },
    [PSCustomObject]@{ key = "NEXT_PUBLIC_SUPABASE_ANON_KEY";  value = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY;           type = "plain"     },
    [PSCustomObject]@{ key = "SUPABASE_SERVICE_ROLE_KEY";      value = $env:SUPABASE_SERVICE_ROLE_KEY;               type = "sensitive" },
    [PSCustomObject]@{ key = "GEMINI_API_KEY";                 value = $env:GEMINI_API_KEY;                          type = "sensitive" },
    [PSCustomObject]@{ key = "N8N_BASE_URL";                   value = "https://yobed-n8n-supabase-claude.hf.space"; type = "plain"     },
    [PSCustomObject]@{ key = "N8N_WEBHOOK_SECRET";             value = $env:N8N_WEBHOOK_SECRET;                      type = "sensitive" },
    [PSCustomObject]@{ key = "NEXT_PUBLIC_APP_URL";            value = "https://rh-manager-ci.vercel.app";           type = "plain"     },
    [PSCustomObject]@{ key = "NEXT_PUBLIC_APP_NAME";           value = "RH Manager CI";                              type = "plain"     },
    [PSCustomObject]@{ key = "XAI_API_KEY";                    value = $env:XAI_API_KEY;                             type = "sensitive" }
)

# Garde-fou : refuser de continuer si une clé sensible est vide
$missing = $envVars | Where-Object { $_.type -eq "sensitive" -and [string]::IsNullOrWhiteSpace($_.value) } | ForEach-Object { $_.key }
if ($missing) {
    Write-Host "❌ Variables sensibles manquantes : $($missing -join ', ')" -ForegroundColor Red
    Write-Host "   Charge-les avec `$env:VAR = '...' avant de relancer." -ForegroundColor Yellow
    exit 1
}

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
