# =====================================================
#  eve-jn - Script Completo de Deploy
#  Execute: .\deploy.ps1
#  Opcoes:  .\deploy.ps1 -msg "Descricao da mudanca"
# =====================================================

param(
    [string]$msg = "Update: site atualizado"
)

$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# --- Helpers visuais ---
function Write-Header($text) {
    Write-Host "`n================================================" -ForegroundColor DarkCyan
    Write-Host "  $text" -ForegroundColor White
    Write-Host "================================================" -ForegroundColor DarkCyan
}
function Write-Step($n, $text) {
    Write-Host "`n  [$n] $text" -ForegroundColor Cyan
}
function Write-Ok($text) {
    Write-Host "      OK  $text" -ForegroundColor Green
}
function Write-Warn($text) {
    Write-Host "      AVISO: $text" -ForegroundColor Yellow
}
function Write-Fail($text) {
    Write-Host "`n  ERRO: $text" -ForegroundColor Red
    Write-Host "  Processo cancelado.`n" -ForegroundColor DarkRed
    exit 1
}

Write-Header "eve-jn  Publicador Automatico"

# ---- ETAPA 1: Verificar Node/npm ----
Write-Step "1/5" "Verificando ambiente..."
try {
    $nodeVer = node --version 2>&1
    $npmVer  = npm --version 2>&1
    Write-Ok "Node $nodeVer | npm $npmVer"
} catch {
    Write-Fail "Node.js nao encontrado. Instale em https://nodejs.org"
}

# ---- ETAPA 2: Login no Firebase ----
Write-Step "2/5" "Verificando login no Firebase..."

$loginCheck = npx firebase-tools login:list 2>&1
if ($loginCheck -match "No authorized accounts") {
    Write-Warn "Nao logado. Abrindo navegador para login..."
    npx firebase-tools login
    if ($LASTEXITCODE -ne 0) { Write-Fail "Login no Firebase falhou." }
    Write-Ok "Login realizado com sucesso!"
} else {
    Write-Ok "Ja logado no Firebase."
}

# ---- ETAPA 3: Instalar dependencias (se necessario) ----
Write-Step "3/5" "Verificando dependencias..."
if (-not (Test-Path "node_modules")) {
    Write-Warn "Pasta node_modules nao encontrada. Instalando..."
    npm install
    if ($LASTEXITCODE -ne 0) { Write-Fail "npm install falhou." }
    Write-Ok "Dependencias instaladas."
} else {
    Write-Ok "Dependencias ja instaladas."
}

# ---- ETAPA 4: Build ----
Write-Step "4/5" "Gerando build de producao..."
npm run build
if ($LASTEXITCODE -ne 0) { Write-Fail "Build falhou. Verifique os erros acima." }
Write-Ok "Build concluido com sucesso."

# ---- ETAPA 5: Deploy Firebase ----
Write-Step "5/5" "Publicando no Firebase..."
npx firebase-tools deploy --only hosting
if ($LASTEXITCODE -ne 0) { Write-Fail "Deploy falhou." }
Write-Ok "Site publicado: https://eve-jn.web.app"

# ---- ETAPA EXTRA: Git push ----
Write-Step "+" "Sincronizando com GitHub..."
$changes = git status --porcelain
if ($changes) {
    git add .
    git commit -m $msg
    git push origin main
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Git push falhou. Verifique sua conexao ou permissoes."
    } else {
        Write-Ok "GitHub sincronizado."
    }
} else {
    Write-Ok "Nenhuma mudanca local para enviar ao GitHub."
}

# ---- RESULTADO FINAL ----
Write-Host ""
Write-Header "Tudo Pronto!"
Write-Host "  Site ao vivo:" -ForegroundColor White
Write-Host "  https://eve-jn.web.app`n" -ForegroundColor Green
