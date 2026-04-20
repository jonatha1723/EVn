# ============================================
#  eve-jn Deploy Script
#  Execute: .\deploy.ps1
#  Opcoes:  .\deploy.ps1 -msg "Descricao"
# ============================================

param(
    [string]$msg = "Update: site atualizado"
)

$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

function Write-Step($text) {
    Write-Host "`n>> $text" -ForegroundColor Cyan
}
function Write-Success($text) {
    Write-Host "OK $text" -ForegroundColor Green
}
function Write-Fail($text) {
    Write-Host "ERRO: $text" -ForegroundColor Red
    exit 1
}

Write-Host "`n============================================" -ForegroundColor DarkCyan
Write-Host "  eve-jn - Deploy Automatico" -ForegroundColor White
Write-Host "============================================`n" -ForegroundColor DarkCyan

# 1. Build
Write-Step "Gerando build de producao..."
npm run build
if ($LASTEXITCODE -ne 0) { Write-Fail "Build falhou." }
Write-Success "Build concluido."

# 2. Deploy Firebase (usa login salvo localmente)
Write-Step "Publicando no Firebase (eve-jn.web.app)..."
npx firebase-tools deploy --only hosting
if ($LASTEXITCODE -ne 0) { Write-Fail "Deploy Firebase falhou. Execute 'npx firebase-tools login' primeiro." }
Write-Success "Site publicado em https://eve-jn.web.app"

# 3. Git push
Write-Step "Sincronizando com GitHub..."
git add .
git commit -m $msg
git push origin main
if ($LASTEXITCODE -ne 0) { Write-Fail "Git push falhou." }
Write-Success "GitHub sincronizado."

Write-Host "`n============================================" -ForegroundColor DarkCyan
Write-Host "  Tudo pronto! Site ao vivo:" -ForegroundColor White
Write-Host "  https://eve-jn.web.app" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor DarkCyan
