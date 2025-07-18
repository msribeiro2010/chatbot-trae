# 🚀 Guia de Atualização em Produção

## 📋 Processo Completo de Deploy/Atualização

### 🔄 **Método 1: Atualização Automática (Recomendado)**

#### 1. **Usando o Script Automatizado**
```bash
# Execute o script de deploy
./deploy.sh

# Digite sua mensagem de commit quando solicitado
# Exemplo: "Correção de bug na autenticação"
```

#### 2. **Verificação Automática no Vercel**
- ✅ O Vercel detecta automaticamente mudanças no GitHub
- ✅ Inicia build e deploy automaticamente
- ✅ Notificação por email quando concluído

### 🔧 **Método 2: Atualização Manual**

#### 1. **Preparar e Enviar Código**
```bash
# Adicionar arquivos modificados
git add .

# Fazer commit com mensagem descritiva
git commit -m "🔧 Descrição da atualização"

# Enviar para GitHub
git push origin main
```

#### 2. **Verificar Deploy no Vercel**
```bash
# Instalar Vercel CLI (se não tiver)
npm i -g vercel

# Login no Vercel
vercel login

# Verificar status do projeto
vercel ls

# Forçar novo deploy (se necessário)
vercel --prod
```

## 🔍 **Monitoramento Pós-Deploy**

### 1. **Verificações Essenciais**
- [ ] ✅ Site carregando corretamente
- [ ] ✅ Login funcionando
- [ ] ✅ Upload de arquivos operacional
- [ ] ✅ Chat respondendo adequadamente
- [ ] ✅ Logs sem erros críticos

### 2. **Comandos de Verificação**
```bash
# Verificar logs do Vercel
vercel logs [deployment-url]

# Testar endpoints principais
curl -I https://seu-dominio.vercel.app
curl -I https://seu-dominio.vercel.app/api/auth-status
```

## 🚨 **Rollback de Emergência**

### **Se algo der errado:**

#### 1. **Rollback via Vercel Dashboard**
1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Vá em "Deployments"
4. Clique nos 3 pontos do deploy anterior
5. Selecione "Promote to Production"

#### 2. **Rollback via Git**
```bash
# Reverter último commit
git revert HEAD
git push origin main

# Ou voltar para commit específico
git reset --hard [hash-do-commit]
git push --force origin main
```

## ⚙️ **Variáveis de Ambiente em Produção**

### **Verificar/Atualizar no Vercel:**

1. **Acesse:** [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Selecione:** Seu projeto
3. **Vá em:** Settings → Environment Variables

### **Variáveis Críticas:**
```env
# Obrigatórias
OPENAI_API_KEY=sk-proj-...
LOGIN_PASSWORD=senha-forte-aqui
SESSION_SECRET=chave-32-caracteres-minimo
NODE_ENV=production

# Segurança
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME_MINUTES=15
ALLOWED_ORIGINS=https://seu-dominio.vercel.app

# Opcionais
WEB_SEARCH_ENABLED=true
MAX_FILE_SIZE=10485760
```

## 📊 **Checklist de Atualização**

### **Antes do Deploy:**
- [ ] Código testado localmente
- [ ] Variáveis de ambiente verificadas
- [ ] Backup do banco (se necessário)
- [ ] Documentação atualizada
- [ ] Commit com mensagem clara

### **Durante o Deploy:**
- [ ] Monitorar logs do Vercel
- [ ] Verificar build sem erros
- [ ] Aguardar conclusão completa

### **Após o Deploy:**
- [ ] Testar funcionalidades principais
- [ ] Verificar performance
- [ ] Monitorar logs por 15 minutos
- [ ] Notificar usuários (se necessário)

## 🔧 **Comandos Úteis**

### **Desenvolvimento Local:**
```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Rodar em produção local
npm start
```

### **Git Essenciais:**
```bash
# Ver status
git status

# Ver histórico
git log --oneline

# Ver diferenças
git diff

# Desfazer mudanças não commitadas
git checkout -- .
```

### **Vercel CLI:**
```bash
# Ver projetos
vercel ls

# Ver deployments
vercel ls [projeto]

# Logs em tempo real
vercel logs --follow

# Informações do projeto
vercel inspect
```

## 📱 **Notificações e Alertas**

### **Configurar Webhooks (Opcional):**
1. **Slack/Discord:** Para notificações de deploy
2. **Email:** Alertas de erro em produção
3. **Monitoring:** Uptime e performance

### **Logs de Segurança:**
- Monitorar tentativas de login suspeitas
- Verificar rate limiting funcionando
- Acompanhar uso de recursos

## 🆘 **Suporte e Troubleshooting**

### **Problemas Comuns:**

1. **Build falha:**
   - Verificar dependências no `package.json`
   - Checar variáveis de ambiente
   - Ver logs detalhados no Vercel

2. **Aplicação não carrega:**
   - Verificar `vercel.json`
   - Confirmar rota principal
   - Checar headers de segurança

3. **Erro 500:**
   - Ver logs do servidor
   - Verificar conexão com Supabase
   - Confirmar variáveis de ambiente

### **Contatos de Emergência:**
- **Vercel Support:** [vercel.com/support](https://vercel.com/support)
- **GitHub Status:** [githubstatus.com](https://githubstatus.com)
- **Supabase Status:** [status.supabase.com](https://status.supabase.com)

---

## 🎯 **Resumo Rápido**

**Para atualização simples:**
```bash
./deploy.sh
```

**Para emergência:**
1. Acesse Vercel Dashboard
2. Faça rollback para versão anterior
3. Investigue problema localmente

**Sempre lembre:**
- ✅ Teste localmente primeiro
- ✅ Use mensagens de commit claras
- ✅ Monitore após deploy
- ✅ Tenha plano de rollback

---

*Última atualização: $(date)*