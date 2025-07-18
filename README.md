# Chatbot Inteligente com IA

Um chatbot moderno e inteligente que combina a potência da OpenAI com uma base de conhecimento local e capacidades de busca na web.

## 🚀 Deploy no GitHub e Vercel

### Pré-requisitos
- Conta no [GitHub](https://github.com)
- Conta na [Vercel](https://vercel.com)
- Chave da API OpenAI
- Git instalado localmente

### Passo 1: Subir para o GitHub

1. **Inicializar repositório Git (se ainda não foi feito):**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Criar repositório no GitHub:**
   - Acesse [GitHub](https://github.com) e faça login
   - Clique em "New repository"
   - Nome: `chatbot-trae` (ou outro nome de sua escolha)
   - Deixe como público ou privado conforme preferir
   - **NÃO** marque "Initialize with README" (já temos um)
   - Clique em "Create repository"

3. **Conectar repositório local ao GitHub:**
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/chatbot-trae.git
   git branch -M main
   git push -u origin main
   ```

### Passo 2: Deploy na Vercel

1. **Acessar Vercel:**
   - Vá para [vercel.com](https://vercel.com)
   - Faça login com sua conta GitHub

2. **Importar projeto:**
   - Clique em "New Project"
   - Selecione o repositório `chatbot-trae`
   - Clique em "Import"

3. **Configurar variáveis de ambiente:**
   Na seção "Environment Variables", adicione:
   ```
   OPENAI_API_KEY=sua_chave_openai_aqui
   LOGIN_PASSWORD=sua_senha_segura_aqui
   SESSION_SECRET=uma_chave_secreta_aleatoria_aqui
   PORT=3000
   DB_PATH=./database.sqlite
   UPLOAD_DIR=./uploads
   MAX_FILE_SIZE=10485760
   WEB_SEARCH_ENABLED=true
   ```

4. **Deploy:**
   - Clique em "Deploy"
   - Aguarde o processo de build e deploy
   - Sua aplicação estará disponível em uma URL como: `https://chatbot-trae.vercel.app`

### Passo 3: Configurações Importantes

#### Variáveis de Ambiente Obrigatórias:
- `OPENAI_API_KEY`: Sua chave da API OpenAI
- `LOGIN_PASSWORD`: Senha para acessar o sistema
- `SESSION_SECRET`: Chave secreta para sessões (gere uma aleatória)

#### Variáveis Opcionais:
- `PORT`: Porta do servidor (padrão: 3000)
- `DB_PATH`: Caminho do banco SQLite
- `UPLOAD_DIR`: Diretório de uploads
- `MAX_FILE_SIZE`: Tamanho máximo de arquivo (bytes)
- `WEB_SEARCH_ENABLED`: Habilitar busca web

### Passo 4: Atualizações Futuras

Para atualizar a aplicação:

1. **Fazer alterações localmente**
2. **Commit e push:**
   ```bash
   git add .
   git commit -m "Descrição das alterações"
   git push origin main
   ```
3. **A Vercel fará o redeploy automaticamente**

### 🔧 Configuração Local para Desenvolvimento

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Criar arquivo .env:**
   ```bash
   cp .env.example .env
   ```
   Edite o arquivo `.env` com suas configurações.

3. **Executar em modo desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Executar em modo produção:**
   ```bash
   npm start
   ```

### 📝 Notas Importantes

- O arquivo `vercel.json` já está configurado para o deploy
- O `.gitignore` protege arquivos sensíveis
- O banco SQLite será criado automaticamente na Vercel
- Os uploads são temporários na Vercel (use storage externo para produção)
- A aplicação usa autenticação por senha simples

### 🆘 Solução de Problemas

**Erro de build na Vercel:**
- Verifique se todas as dependências estão no `package.json`
- Confirme se as variáveis de ambiente estão configuradas

**Erro de autenticação:**
- Verifique se `LOGIN_PASSWORD` está definida
- Confirme se `SESSION_SECRET` está configurada

**Erro de OpenAI:**
- Verifique se `OPENAI_API_KEY` está correta
- Confirme se há créditos na conta OpenAI

### 📞 Suporte

Se encontrar problemas, verifique:
1. Logs da Vercel (aba "Functions")
2. Console do navegador
3. Configurações de variáveis de ambiente

## 🚀 Funcionalidades

- **Chat Inteligente**: Integração com OpenAI GPT-3.5-turbo
- **Base de Conhecimento**: Upload e processamento de documentos (PDF, DOCX, TXT, MD)
- **Busca na Web**: Capacidade de buscar informações atualizadas na internet
- **Interface Moderna**: Design inspirado no Claude com tema escuro/claro
- **Área Administrativa**: Gerenciamento de documentos e estatísticas
- **Histórico de Conversas**: Armazenamento e recuperação de conversas anteriores
- **Tratamento de Erros**: Sistema robusto de tratamento de erros da API

## 📋 Pré-requisitos

- Node.js 18+ (recomendado)
- NPM ou Yarn
- Chave da API OpenAI (opcional, mas recomendada)

## 🛠️ Instalação

1. **Clone ou baixe o projeto**
```bash
cd projeto-chatbot-trae
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**

⚠️ **IMPORTANTE**: Nunca compartilhe suas chaves de API!

Copie o arquivo de exemplo e configure suas chaves:
```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure suas chaves:
```env
# Configuração da OpenAI (obrigatório para IA)
OPENAI_API_KEY=sua_chave_openai_aqui

# Configuração do servidor
PORT=3010

# Configuração do banco de dados
DB_PATH=./database.sqlite

# Configuração de uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Busca na web (opcional)
WEB_SEARCH_ENABLED=true

# Configurações de autenticação
LOGIN_PASSWORD=sua_senha_segura_aqui
SESSION_SECRET=sua_chave_secreta_de_sessao_aqui
```

4. **Inicie o servidor**
```bash
npm start
```

5. **Acesse o chatbot**
Abra seu navegador e vá para: `http://localhost:3000`

## 🔧 Configuração da API OpenAI

1. Acesse [OpenAI Platform](https://platform.openai.com/)
2. Crie uma conta ou faça login
3. Vá para "API Keys" e crie uma nova chave
4. Copie a chave e cole no arquivo `.env`

**Nota**: O chatbot funcionará sem a API OpenAI, mas apenas com a base de conhecimento local.

## 📚 Como Usar

### Upload de Documentos
1. Clique no ícone de configurações (⚙️) no canto superior direito
2. Vá para a aba "Upload de Documentos"
3. Arraste e solte ou selecione arquivos (PDF, DOCX, TXT, MD)
4. Os documentos serão processados e adicionados à base de conhecimento

### Chat
1. Digite sua pergunta na caixa de texto
2. Pressione Enter ou clique em "Enviar"
3. O chatbot buscará informações na base de conhecimento e/ou usará a IA
4. Para busca na web, marque a opção "Buscar na web" antes de enviar

### Gerenciamento
- **Documentos**: Visualize e delete documentos da base de conhecimento
- **Estatísticas**: Veja métricas de uso do chatbot
- **Histórico**: Acesse conversas anteriores

## 🏗️ Estrutura do Projeto

```
projeto-chatbot-trae/
├── public/                 # Frontend
│   ├── css/
│   │   └── style.css      # Estilos da interface
│   ├── js/
│   │   └── app.js         # JavaScript do frontend
│   └── index.html         # Página principal
├── src/
│   └── services/          # Serviços backend
│       ├── database.js    # Gerenciamento do banco SQLite
│       ├── documentProcessor.js # Processamento de documentos
│       └── webSearch.js   # Busca na web
├── uploads/               # Arquivos temporários
├── .env                   # Variáveis de ambiente
├── server.js             # Servidor principal
└── package.json          # Dependências
```

## 🔍 Tipos de Arquivo Suportados

- **PDF**: Extração de texto completo
- **DOCX**: Documentos do Microsoft Word
- **TXT**: Arquivos de texto simples
- **MD**: Arquivos Markdown

**Limite**: 10MB por arquivo

## ⚠️ Tratamento de Erros

O sistema possui tratamento robusto para:

- **Erro 429**: Limite de API atingido
- **Erro 401**: Chave de API inválida
- **Erro 400**: Requisição malformada
- **Erro 500+**: Problemas no servidor OpenAI
- **Sem API**: Funcionamento apenas com base de conhecimento

## 🚨 Solução de Problemas

### Erro "API OpenAI não configurada"
- Verifique se a chave está correta no arquivo `.env`
- Certifique-se de que a chave tem créditos disponíveis

### Erro "Limite de uso atingido"
- Aguarde alguns minutos antes de tentar novamente
- Verifique seu plano na OpenAI Platform

### Documentos não são processados
- Verifique se o arquivo está em um formato suportado
- Certifique-se de que o arquivo não está corrompido
- Verifique se o tamanho não excede 10MB

### Servidor não inicia
- Verifique se a porta 3000 não está em uso
- Execute `npm install` novamente
- Verifique os logs de erro no terminal

## 🔒 Segurança

### ⚠️ ATENÇÃO: Proteção de Chaves de API

**NUNCA** faça commit do arquivo `.env` para repositórios públicos! Este arquivo contém:
- Chave da API OpenAI (pode gerar custos se mal utilizada)
- Senha de login da aplicação
- Chave secreta de sessão

### Medidas de Segurança Implementadas:

✅ **Arquivo `.gitignore`**: O arquivo `.env` está protegido contra commits acidentais
✅ **Template `.env.example`**: Arquivo de exemplo sem informações sensíveis
✅ **Autenticação**: Sistema de login protege o acesso à aplicação
✅ **Processamento Local**: Documentos são processados localmente
✅ **Sessões Seguras**: Gerenciamento seguro de sessões de usuário

### Antes de Fazer Deploy:

1. **Verifique o `.gitignore`**: Certifique-se de que `.env` está listado
2. **Use Variáveis de Ambiente**: Em produção, configure as variáveis no servidor
3. **Senhas Fortes**: Use senhas complexas para `LOGIN_PASSWORD` e `SESSION_SECRET`
4. **Monitore Uso**: Acompanhe o uso da API OpenAI para evitar custos inesperados

### Se Você Acidentalmente Expôs uma Chave:

1. **Revogue imediatamente** a chave na OpenAI Platform
2. **Gere uma nova chave** e atualize o `.env`
3. **Verifique o histórico** do Git para remover a chave exposta
4. **Monitore sua conta** OpenAI por uso não autorizado

## 📈 Melhorias Futuras

- [ ] Suporte a mais formatos de arquivo
- [ ] Integração com outros modelos de IA
- [ ] Sistema de usuários e permissões
- [ ] API REST completa
- [ ] Deploy em nuvem
- [ ] Busca semântica avançada

## 🤝 Contribuição

Sinta-se à vontade para contribuir com melhorias, correções de bugs ou novas funcionalidades!

## 📄 Licença

Este projeto é de uso livre para fins educacionais e pessoais.