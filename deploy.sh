#!/bin/bash

# Script de deploy para GitHub e Vercel
# Uso: ./deploy.sh "mensagem do commit"

set -e

echo "🚀 Iniciando processo de deploy..."

# Verificar se uma mensagem de commit foi fornecida
if [ -z "$1" ]; then
    echo "❌ Erro: Forneça uma mensagem de commit"
    echo "Uso: ./deploy.sh 'sua mensagem de commit'"
    exit 1
fi

COMMIT_MESSAGE="$1"

# Verificar se estamos em um repositório Git
if [ ! -d ".git" ]; then
    echo "📁 Inicializando repositório Git..."
    git init
fi

# Adicionar todos os arquivos
echo "📝 Adicionando arquivos..."
git add .

# Fazer commit
echo "💾 Fazendo commit: $COMMIT_MESSAGE"
git commit -m "$COMMIT_MESSAGE" || echo "⚠️  Nenhuma alteração para commit"

# Verificar se o remote origin existe
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ Remote 'origin' não configurado."
    echo "Configure primeiro com:"
    echo "git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git"
    exit 1
fi

# Push para o GitHub
echo "🔄 Enviando para GitHub..."
git push origin main || git push origin master

echo "✅ Deploy concluído!"
echo "📱 Verifique o status do deploy na Vercel: https://vercel.com/dashboard"
echo "🌐 Sua aplicação estará disponível em alguns minutos."