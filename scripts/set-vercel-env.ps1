
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

# Variables à configurer — les secrets viennent de variables d'environnement
# Lance d'abord : $env:SUPABASE_SERVICE_ROLE_KEY = "xxx" ; $env:GEMINI_API_KEY = "xxx" ; etc.
# Ou source un .env.local avant : Get-Content .env.local | ForEach-Object { if ($_ -match '^([^=]+)=(.+)$') { Set-Item -Path "env:$($matches[1])" -Value $matches[2] } }
$envVars = @(
    @{ key = "NEXT_PUBLIC_SUPABASE_URL";       value = "https://nfnqfaeydefqabwewtbe.supabase.co";   sensitive = $false },
    @{ key = "NEXT_PUBLIC_SUPABASE_ANON_KEY";  value = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY;           sensitive = $false },
    @{ key = "SUPABASE_SERVICE_ROLE_KEY";      value = $env:SUPABASE_SERVICE_ROLE_KEY;               sensitive = $true },
    @{ key = "GEMINI_API_KEY";                 value = $env:GEMINI_API_KEY;                          sensitive = $true },
    @{ key = "N8N_BASE_URL";                   value = "https://yobed-n8n-supabase-claude.hf.space"; sensitive = $false },
    @{ key = "N8N_WEBHOOK_SECRET";             value = $env:N8N_WEBHOOK_SECRET;                      sensitive = $true },
    @{ key = "NEXT_PUBLIC_APP_URL";            value = "https://rh-manager-ci.vercel.app";           sensitive = $false },
    @{ key = "NEXT_PUBLIC_APP_NAME";           value = "RH Manager CI";                              sensitive = $false },
    @{ key = "XAI_API_KEY";                    value = $env:XAI_API_KEY;                             sensitive = $true }
)

# Garde-fou : refuser de continuer si une clé sensible est vide
$missing = $envVars | Where-Object { $_.sensitive -and [string]::IsNullOrWhiteSpace($_.value) } | ForEach-Object { $_.key }
if ($missing) {
    Write-Host "❌ Variables sensibles manquantes dans l'environnement : $($missing -join ', ')" -ForegroundColor Red
    Write-Host "   Charge-les avec : `$env:VAR = 'value' avant de relancer ce script." -ForegroundColor Yellow
    exit 1
}

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
