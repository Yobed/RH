$ErrorActionPreference = 'Continue'
$root = "c:\Users\WILFRIED\OneDrive - Gravel Ivoire\Bureau\Ressource Humaine"

# Tous les fichiers TSX et TS du projet
$files = Get-ChildItem -Path $root -Recurse -Include "*.tsx","*.ts" -File |
    Where-Object { 
        $_.FullName -notmatch "\\node_modules\\" -and 
        $_.FullName -notmatch "\\.next\\" -and
        $_.FullName -notmatch "\\coverage\\"
    }

$total = 0
foreach ($f in $files) {
    $enc  = [System.Text.Encoding]::UTF8
    $raw  = [System.IO.File]::ReadAllText($f.FullName, $enc)
    $orig = $raw

    # Standalone text-slate-400 (pas suivi de dark: juste apres) → text-slate-600
    # On remplace text-slate-400" ou text-slate-400  (avec espace ou guillemets apres)
    $raw = [System.Text.RegularExpressions.Regex]::Replace(
        $raw,
        'text-slate-400(?!\s+dark:)',
        'text-slate-600'
    )

    # text-slate-500 standalone → text-slate-600
    $raw = [System.Text.RegularExpressions.Regex]::Replace(
        $raw,
        'text-slate-500(?!\s+dark:)',
        'text-slate-600'
    )

    # dark:text-slate-500 → dark:text-slate-400  
    $raw = $raw.Replace("dark:text-slate-500", "dark:text-slate-400")

    if ($raw -ne $orig) {
        [System.IO.File]::WriteAllText($f.FullName, $raw, $enc)
        $total++
        Write-Host "  [OK] $($f.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "$total fichiers corriges" -ForegroundColor Cyan
