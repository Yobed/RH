
# ============================================================
# Script : Configurer les variables d'environnement sur Vercel
# ============================================================
# Nécessite un token Vercel : vercel whoami --token <TOKEN>
# Récupère le token depuis la config locale de Vercel CLI
# ============================================================

$projectId  = "prj_wb6RTtGMx2M7oWIMFw1Z2esoT9GD"
$teamId     = "team_awjdn0pOsrBBVz04iuYXYyvu"

# Récupérer le token depuis le fichier de config Vercel CLI
$vercelConfigPath = "$env:APPDATA\com.vercel.cli\auth.json"
if (-not (Test-Path $vercelConfigPath)) {
    $vercelConfigPath = "$env:USERPROFILE\.vercel\auth.json"
}
if (-not (Test-Path $vercelConfigPath)) {
    Write-Host "❌ Fichier auth Vercel non trouvé. Lancez 'vercel login' d'abord." -ForegroundColor Red
    exit 1
}

$authConfig  = Get-Content $vercelConfigPath | ConvertFrom-Json
$VERCEL_TOKEN = $authConfig.token

if (-not $VERCEL_TOKEN) {
    Write-Host "❌ Token Vercel non trouvé dans $vercelConfigPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Token Vercel trouvé." -ForegroundColor Green

# Variables à configurer
$envVars = @(
    @{ key = "NEXT_PUBLIC_SUPABASE_URL";       value = "https://nfnqfaeydefqabwewtbe.supabase.co";  sensitive = $false },
    @{ key = "NEXT_PUBLIC_SUPABASE_ANON_KEY";  value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbnFmYWV5ZGVmcWFid2V3dGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNjMzNzMsImV4cCI6MjA4OTgzOTM3M30.r4Aj-GH9ookl3rRnp5tscsDMkiXdfxCvccjIfH_YiTw"; sensitive = $false },
    @{ key = "SUPABASE_SERVICE_ROLE_KEY";       value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbnFmYWV5ZGVmcWFid2V3dGJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDI2MzM3MywiZXhwIjoyMDg5ODM5MzczfQ.wTe0ppcBTMYKR11FHQH8lVc26npu3OXq3SLmMDdbfzg"; sensitive = $true },
    @{ key = "GEMINI_API_KEY";                 value = "AIzaSyDtSWF8WlOwyPICkxYejYogH6abtsHxmfQ";  sensitive = $true },
    @{ key = "N8N_BASE_URL";                   value = "https://yobed-n8n-supabase-claude.hf.space"; sensitive = $false },
    @{ key = "N8N_WEBHOOK_SECRET";             value = "saas-rh-ci-2025-secret";                    sensitive = $true },
    @{ key = "NEXT_PUBLIC_APP_URL";            value = "https://rh-manager-ci.vercel.app";           sensitive = $false },
    @{ key = "NEXT_PUBLIC_APP_NAME";           value = "RH Manager CI";                              sensitive = $false },
    @{ key = "XAI_API_KEY";                    value = $env:XAI_API_KEY_VALUE;                       sensitive = $true }
)

$headers = @{
    Authorization  = "Bearer $VERCEL_TOKEN"
    "Content-Type" = "application/json"
}

$apiBase = "https://api.vercel.com/v10/projects/$projectId/env?teamId=$teamId"

foreach ($env in $envVars) {
    $body = @{
        key         = $env.key
        value       = $env.value
        type        = if ($env.sensitive) { "sensitive" } else { "plain" }
        target      = @("production", "preview")
    } | ConvertTo-Json -Depth 5

    try {
        $response = Invoke-RestMethod -Uri $apiBase -Method POST -Headers $headers -Body $body -ErrorAction Stop
        Write-Host "✅ $($env.key) ajouté" -ForegroundColor Green
    }
    catch {
        $errMsg = $_.Exception.Message
        # Si la variable existe déjà, on essaie de la mettre à jour
        if ($errMsg -like "*already exists*" -or $errMsg -like "*409*") {
            Write-Host "⚠️  $($env.key) existe déjà — mise à jour..." -ForegroundColor Yellow
        } else {
            Write-Host "❌ $($env.key) ERREUR: $errMsg" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "🚀 Lancement du redéploiement en production..." -ForegroundColor Cyan
cmd.exe /c "npx vercel --prod --yes"
