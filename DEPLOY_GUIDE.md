# 🚀 Guia Rápido de Deploy

## Comandos Essenciais

### 1. Primeira vez (Setup inicial)

```bash
# 1. Criar repositório no GitHub primeiro (via interface web)
# 2. Conectar repositório local
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/SEU_USUARIO/chatbot-trae.git
git branch -M main
git push -u origin main
```

### 2. Atualizações (uso diário)

```bash
# Opção 1: Script automatizado
./deploy.sh "Descrição das alterações"

# Opção 2: Manual
git add .
git commit -m "Descrição das alterações"
git push origin main
```

## ⚙️ Configuração da Vercel

### Variáveis de Ambiente Obrigatórias:

```env
OPENAI_API_KEY=sk-proj-sua-chave-aqui
LOGIN_PASSWORD=sua-senha-segura
SESSION_SECRET=chave-secreta-aleatoria-64-caracteres
```

### Variáveis Opcionais:

```env
PORT=3000
DB_PATH=./database.sqlite
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
WEB_SEARCH_ENABLED=true
```

## 🔗 Links Importantes

- **GitHub**: https://github.com
- **Vercel**: https://vercel.com
- **OpenAI API Keys**: https://platform.openai.com/api-keys

## 📋 Checklist de Deploy

- [ ] Repositório criado no GitHub
- [ ] Código enviado para o GitHub
- [ ] Projeto importado na Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy realizado com sucesso
- [ ] Aplicação testada na URL da Vercel

## 🆘 Comandos de Emergência

```bash
# Verificar status do Git
git status

# Ver histórico de commits
git log --oneline

# Desfazer último commit (mantém alterações)
git reset --soft HEAD~1

# Forçar push (cuidado!)
git push --force origin main

# Verificar remotes configurados
git remote -v
```

## 🔧 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Executar em desenvolvimento
npm run dev

# Executar em produção
npm start
```

---

**💡 Dica**: Use o script `./deploy.sh "mensagem"` para automatizar o processo de commit e push!