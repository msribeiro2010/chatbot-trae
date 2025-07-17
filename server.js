const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { OpenAI } = require('openai');
const DocumentProcessor = require('./src/services/documentProcessor');
const DatabaseService = require('./src/services/database');
const WebSearchService = require('./src/services/webSearch');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração da OpenAI
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY não configurada. O chatbot funcionará apenas com a base de conhecimento.');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000 // 30 segundos de timeout
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configuração de sessão
app.use(session({
  secret: process.env.SESSION_SECRET || 'napje-ai-default-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // true apenas em HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Middleware de autenticação
const requireAuth = (req, res, next) => {
  if (req.session && req.session.authenticated) {
    return next();
  } else {
    return res.status(401).json({ error: 'Acesso negado. Faça login primeiro.' });
  }
};

// Middleware para servir arquivos estáticos com proteção
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/admin', requireAuth, express.static(path.join(__dirname, 'public/admin')));

// Rotas de páginas
app.get('/profile', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/profile.html'));
});

// Rota para página de login (sem autenticação)
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

// Rota principal com proteção
app.get('/', (req, res) => {
  if (req.session && req.session.authenticated) {
    res.sendFile(path.join(__dirname, 'public/index.html'));
  } else {
    res.redirect('/login');
  }
});

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.txt', '.md'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Use PDF, DOCX, TXT ou MD.'));
    }
  }
});

// Inicializar serviços
const documentProcessor = new DocumentProcessor();
const database = new DatabaseService();
const webSearch = new WebSearchService();

// Inicializar banco de dados
database.init();

// Rotas de autenticação
app.post('/api/login', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Senha é obrigatória' });
    }
    
    const correctPassword = process.env.LOGIN_PASSWORD || 'admin123';
    
    if (password === correctPassword) {
      req.session.authenticated = true;
      req.session.user = req.session.user || { name: 'Adm.Marcelo', avatar: null };
      res.json({ message: 'Login realizado com sucesso' });
    } else {
      res.status(401).json({ error: 'Senha incorreta' });
    }
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
    res.json({ message: 'Logout realizado com sucesso' });
  });
});

// Verificar status de autenticação
app.get('/api/auth-status', (req, res) => {
  res.json({ 
    authenticated: !!(req.session && req.session.authenticated),
    user: req.session.user || { name: 'Adm.Marcelo', avatar: null }
  });
});

// Rotas de perfil
app.get('/api/profile', requireAuth, (req, res) => {
  const user = req.session.user || { name: 'Adm.Marcelo', avatar: null };
  res.json(user);
});

app.post('/api/profile', requireAuth, (req, res) => {
  try {
    const { name, avatar } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }
    
    req.session.user = {
      name: name.trim(),
      avatar: avatar || null
    };
    
    res.json({ message: 'Perfil atualizado com sucesso', user: req.session.user });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rotas da API

// Rota para chat
app.post('/api/chat', requireAuth, async (req, res) => {
  try {
    const { message, useWebSearch = false } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    // Buscar documentos relevantes na base de conhecimento
    console.log(`🔍 Buscando documentos para: "${message}"`);
    const relevantDocs = await database.searchDocuments(message);
    console.log(`📚 Documentos encontrados: ${relevantDocs.length}`);
    
    if (relevantDocs.length > 0) {
      console.log('📄 Documentos relevantes:', relevantDocs.map(doc => doc.title));
    }
    
    let context = '';
    if (relevantDocs.length > 0) {
      context = 'Informações da base de conhecimento:\n' + 
                relevantDocs.map(doc => `${doc.title}: ${doc.content}`).join('\n\n');
    }

    // Buscar na web se solicitado e habilitado
    let webResults = '';
    if (useWebSearch && process.env.WEB_SEARCH_ENABLED === 'true') {
      try {
        const searchResults = await webSearch.search(message);
        if (searchResults.length > 0) {
          webResults = '\n\nInformações da internet:\n' + 
                      searchResults.map(result => `${result.title}: ${result.snippet}`).join('\n\n');
        }
      } catch (error) {
        console.error('Erro na busca web:', error);
      }
    }

    // Preparar prompt para a OpenAI
    const systemPrompt = `Você é um assistente inteligente e prestativo. Use as informações fornecidas para responder às perguntas do usuário de forma precisa e útil. Se não houver informações suficientes, seja honesto sobre isso.

${context}${webResults}`;

    let response;
    
    // Verificar se a API key está configurada
    if (!process.env.OPENAI_API_KEY) {
      response = "🔑 API OpenAI não configurada. Funcionando apenas com a base de conhecimento.";
      
      if (relevantDocs.length > 0) {
        response += "\n\n📚 Informações encontradas na base de conhecimento:\n" + 
                   relevantDocs.map(doc => `• **${doc.title}**: ${doc.content.substring(0, 300)}...`).join('\n\n');
      } else {
        response += "\n\n❌ Nenhuma informação encontrada na base de conhecimento para sua pergunta.";
      }
    } else {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ],
          max_tokens: 1000,
          temperature: 0.7
        });

        response = completion.choices[0].message.content;
      } catch (openaiError) {
        console.error('Erro da OpenAI:', openaiError);
        
        // Tratar diferentes tipos de erro da OpenAI
        if (openaiError.status === 429) {
          response = "⚠️ Desculpe, o limite de uso da API OpenAI foi atingido. Tente novamente mais tarde ou verifique sua configuração de API.";
        } else if (openaiError.status === 401) {
          response = "🔑 Erro de autenticação: Verifique se sua chave da API OpenAI está configurada corretamente no arquivo .env";
        } else if (openaiError.status === 400) {
          response = "❌ Erro na requisição: A mensagem pode ser muito longa ou conter conteúdo inadequado.";
        } else if (openaiError.status >= 500) {
          response = "🔧 Serviço da OpenAI temporariamente indisponível. Tente novamente em alguns minutos.";
        } else {
          response = "❌ Erro inesperado ao processar sua mensagem. Tente reformular sua pergunta.";
        }
        
        // Se temos informações da base de conhecimento, tentar responder com elas
        if (relevantDocs.length > 0) {
          response += "\n\n📚 Baseado na base de conhecimento disponível:\n" + 
                     relevantDocs.map(doc => `• ${doc.title}: ${doc.content.substring(0, 200)}...`).join('\n');
        }
      }
    }

    // Salvar conversa no histórico
    await database.saveConversation(message, response);

    res.json({ 
      response,
      sources: {
        documents: relevantDocs.length,
        webSearch: useWebSearch && webResults.length > 0
      }
    });

  } catch (error) {
    console.error('Erro no chat:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para upload de documentos
app.post('/api/upload', requireAuth, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;

    // Processar documento
    const content = await documentProcessor.processDocument(filePath);
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Não foi possível extrair conteúdo do documento' });
    }

    // Salvar no banco de dados
    const documentId = await database.saveDocument(originalName, content, filePath);

    // Remover arquivo temporário
    fs.unlinkSync(filePath);

    res.json({ 
      message: 'Documento processado com sucesso',
      documentId,
      title: originalName,
      contentLength: content.length
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro ao processar documento' });
  }
});

// Rota para listar documentos
app.get('/api/documents', requireAuth, async (req, res) => {
  try {
    const documents = await database.getDocuments();
    res.json(documents);
  } catch (error) {
    console.error('Erro ao listar documentos:', error);
    res.status(500).json({ error: 'Erro ao listar documentos' });
  }
});

// Rota para deletar documento
app.delete('/api/documents/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await database.deleteDocument(id);
    res.json({ message: 'Documento removido com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar documento:', error);
    res.status(500).json({ error: 'Erro ao deletar documento' });
  }
});

// Rota para histórico de conversas
app.get('/api/conversations', requireAuth, async (req, res) => {
  try {
    const conversations = await database.getConversations();
    res.json(conversations);
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    res.status(500).json({ error: 'Erro ao buscar conversas' });
  }
});

// Rota para limpar histórico de conversas
app.delete('/api/conversations', requireAuth, async (req, res) => {
  try {
    await database.clearConversations();
    res.json({ message: 'Histórico de conversas limpo com sucesso' });
  } catch (error) {
    console.error('Erro ao limpar conversas:', error);
    res.status(500).json({ error: 'Erro ao limpar conversas' });
  }
});

// Rota para estatísticas
app.get('/api/stats', requireAuth, async (req, res) => {
  try {
    const stats = await database.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande. Máximo 10MB.' });
    }
  }
  res.status(500).json({ error: error.message });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Acesse: http://localhost:${PORT}`);
});

module.exports = app;