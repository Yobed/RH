$routes = Get-ChildItem -Path ".\app\api" -Recurse -Filter "route.ts"

foreach ($file in $routes) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match "createServerClient" -and $content -notmatch "force-dynamic") {
        # Insert after first import block
        $newContent = $content -replace "(import [^\r\n]+\r?\n\r?\n)", "`$1export const dynamic = 'force-dynamic';`r`n`r`n"
        if ($newContent -eq $content) {
            # Fallback: insert after last import line
            $lines = Get-Content $file.FullName
            $lastImportIndex = -1
            for ($i = 0; $i -lt $lines.Count; $i++) {
                if ($lines[$i] -match "^import ") { $lastImportIndex = $i }
            }
            if ($lastImportIndex -ge 0) {
                $newLines = @()
                for ($i = 0; $i -lt $lines.Count; $i++) {
                    $newLines += $lines[$i]
                    if ($i -eq $lastImportIndex) {
                        $newLines += ""
                        $newLines += "export const dynamic = 'force-dynamic';"
                    }
                }
                $newLines | Set-Content $file.FullName
                Write-Host "Fixed (fallback): $($file.FullName)"
            }
        } else {
            $newContent | Set-Content $file.FullName
            Write-Host "Fixed: $($file.FullName)"
        }
    }
}

Write-Host "Done."
