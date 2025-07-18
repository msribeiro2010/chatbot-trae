#!/bin/bash

# Script de Deploy Automatizado para GitHub e Vercel
# Uso: ./deploy.sh [--prod] [--check]

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções auxiliares
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar argumentos
PROD_MODE=false
CHECK_MODE=false

for arg in "$@"; do
    case $arg in
        --prod)
            PROD_MODE=true
            shift
            ;;
        --check)
            CHECK_MODE=true
            shift
            ;;
        *)
            echo "Uso: $0 [--prod] [--check]"
            echo "  --prod: Deploy para produção com verificações extras"
            echo "  --check: Apenas verificar status sem fazer deploy"
            exit 1
            ;;
    esac
done

echo "🚀 Iniciando processo de deploy..."

# Verificar se estamos em um repositório Git
if [ ! -d ".git" ]; then
    log_error "Este diretório não é um repositório Git."
    log_info "Execute: git init && git remote add origin <URL_DO_SEU_REPO>"
    exit 1
fi

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    log_error "Node.js não está instalado."
    exit 1
fi

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    log_error "npm não está instalado."
    exit 1
fi

# Verificar dependências
if [ ! -f "package.json" ]; then
    log_error "package.json não encontrado."
    exit 1
fi

if [ ! -d "node_modules" ]; then
    log_warning "node_modules não encontrado. Instalando dependências..."
    npm install
fi

# Verificar arquivos essenciais
essential_files=("server.js" "package.json" "vercel.json")
for file in "${essential_files[@]}"; do
    if [ ! -f "$file" ]; then
        log_error "Arquivo essencial não encontrado: $file"
        exit 1
    fi
done

# Verificar .env.example
if [ ! -f ".env.example" ]; then
    log_warning ".env.example não encontrado."
fi

# Modo de verificação
if [ "$CHECK_MODE" = true ]; then
    log_info "Modo de verificação ativado."
    
    # Verificar status do Git
    echo ""
    log_info "Status do Git:"
    git status --short
    
    # Verificar último commit
    echo ""
    log_info "Último commit:"
    git log --oneline -1
    
    # Verificar remote
    echo ""
    log_info "Remote configurado:"
    git remote -v
    
    exit 0
fi

# Verificações de produção
if [ "$PROD_MODE" = true ]; then
    log_info "Modo produção ativado. Executando verificações extras..."
    
    # Verificar se há .env (não deve estar no repo)
    if [ -f ".env" ]; then
        log_warning "Arquivo .env encontrado. Certifique-se de que está no .gitignore"
    fi
    
    # Verificar .gitignore
    if [ ! -f ".gitignore" ]; then
        log_error ".gitignore não encontrado."
        exit 1
    fi
    
    # Verificar se node_modules está no .gitignore
    if ! grep -q "node_modules" .gitignore; then
        log_error "node_modules não está no .gitignore"
        exit 1
    fi
    
    # Executar testes (se existirem)
    if grep -q '"test"' package.json; then
        log_info "Executando testes..."
        npm test
    fi
fi

# Verificar se há mudanças para commit
if git diff --quiet && git diff --staged --quiet; then
    log_info "Nenhuma mudança detectada para commit."
    log_info "Enviando commits existentes para GitHub..."
else
    # Solicitar mensagem de commit
    echo ""
    echo "📝 Digite a mensagem do commit:"
    read -r commit_message
    
    if [ -z "$commit_message" ]; then
        log_error "Mensagem de commit não pode estar vazia."
        exit 1
    fi
    
    # Adicionar arquivos e fazer commit
    log_info "Adicionando arquivos..."
    git add .
    
    log_info "Fazendo commit..."
    git commit -m "$commit_message"
fi

# Verificar se o remote origin existe
if ! git remote get-url origin > /dev/null 2>&1; then
    log_error "Remote 'origin' não configurado."
    log_info "Execute: git remote add origin <URL_DO_SEU_REPO>"
    exit 1
fi

# Push para GitHub
log_info "Enviando para GitHub..."
if git push origin main; then
    log_success "Código enviado para GitHub com sucesso!"
else
    log_error "Erro ao enviar para GitHub."
    exit 1
fi

# Verificar se Vercel CLI está instalado
if command -v vercel &> /dev/null; then
    echo ""
    log_info "Vercel CLI detectado. Verificando status..."
    
    # Tentar obter informações do projeto
    if vercel ls > /dev/null 2>&1; then
        log_info "Projetos Vercel:"
        vercel ls | head -5
    else
        log_warning "Faça login no Vercel: vercel login"
    fi
else
    log_info "Vercel CLI não instalado. Para instalar: npm i -g vercel"
fi

echo ""
log_success "Deploy concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. 🌐 Acesse https://vercel.com/dashboard"
echo "2. 📁 Importe seu repositório (se ainda não fez)"
echo "3. ⚙️  Configure as variáveis de ambiente obrigatórias:"
echo "   - OPENAI_API_KEY=sk-proj-..."
echo "   - LOGIN_PASSWORD=senha-forte"
echo "   - SESSION_SECRET=chave-32-caracteres"
echo "   - NODE_ENV=production"
if [ "$PROD_MODE" = true ]; then
    echo "   - ALLOWED_ORIGINS=https://seu-dominio.vercel.app"
    echo "   - MAX_LOGIN_ATTEMPTS=5"
    echo "   - LOCKOUT_TIME_MINUTES=15"
fi
echo "4. 🚀 O Vercel fará o deploy automaticamente!"
echo ""
echo "📊 Monitoramento:"
echo "   - Status: https://vercel.com/dashboard"
echo "   - Logs: vercel logs --follow"
echo "   - Docs: ./PRODUCTION_UPDATE_GUIDE.md"
echo ""
if [ "$PROD_MODE" = true ]; then
    echo "🔒 Lembre-se de verificar:"
    echo "   - Logs de segurança após deploy"
    echo "   - Funcionalidade de login"
    echo "   - Rate limiting funcionando"
    echo "   - Headers de segurança ativos"
fi