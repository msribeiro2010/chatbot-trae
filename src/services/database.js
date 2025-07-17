const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const SupabaseService = require('./supabase');

class DatabaseService {
  constructor() {
    this.useSupabase = process.env.USE_SUPABASE === 'true';
    this.dbPath = process.env.DB_PATH || './database.sqlite';
    this.db = null;
    
    if (this.useSupabase) {
      this.supabaseService = new SupabaseService();
    }
  }

  /**
   * Inicializa o banco de dados e cria as tabelas necessárias
   */
  init() {
    if (this.useSupabase) {
      return this.supabaseService.init();
    }
    
    console.log('🔍 [Database] Buscando documentos no SQLite...');
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Erro ao conectar com o banco de dados:', err);
          reject(err);
          return;
        }
        
        console.log('✅ Conectado ao banco de dados SQLite');
        this.createTables()
          .then(resolve)
          .catch(reject);
      });
    });
  }

  /**
   * Cria as tabelas necessárias
   */
  createTables() {
    return new Promise((resolve, reject) => {
      // Primeiro criar as tabelas
      const tables = [
        // Tabela de documentos
        `CREATE TABLE IF NOT EXISTS documents (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          file_path TEXT,
          file_size INTEGER,
          upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // Tabela de conversas
        `CREATE TABLE IF NOT EXISTS conversations (
          id TEXT PRIMARY KEY,
          user_message TEXT NOT NULL,
          bot_response TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          session_id TEXT
        )`,
        
        // Tabela de chunks de documentos para busca mais eficiente
        `CREATE TABLE IF NOT EXISTS document_chunks (
          id TEXT PRIMARY KEY,
          document_id TEXT NOT NULL,
          chunk_text TEXT NOT NULL,
          chunk_index INTEGER NOT NULL,
          FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
        )`
      ];

      // Depois criar os índices
      const indexes = [
        `CREATE INDEX IF NOT EXISTS idx_documents_title ON documents(title)`,
        `CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations(timestamp)`,
        `CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id)`,
        `CREATE INDEX IF NOT EXISTS idx_document_chunks_text ON document_chunks(chunk_text)`
      ];

      // Criar tabelas primeiro
      let completed = 0;
      const total = tables.length;

      const createIndexes = () => {
        let indexCompleted = 0;
        const indexTotal = indexes.length;
        
        indexes.forEach((sql) => {
          this.db.run(sql, (err) => {
            if (err) {
              console.error('Erro ao criar índice:', err);
              // Não rejeitar por erro de índice, apenas logar
            }
            
            indexCompleted++;
            if (indexCompleted === indexTotal) {
              console.log('✅ Tabelas e índices criados com sucesso');
              resolve();
            }
          });
        });
      };

      tables.forEach((sql) => {
        this.db.run(sql, (err) => {
          if (err) {
            console.error('Erro ao criar tabela:', err);
            reject(err);
            return;
          }
          
          completed++;
          if (completed === total) {
            // Agora criar os índices
            createIndexes();
          }
        });
      });
    });
  }

  /**
   * Salva um documento na base de conhecimento
   * @param {string} title - Título do documento
   * @param {string} content - Conteúdo do documento
   * @param {string} filePath - Caminho do arquivo (opcional)
   * @returns {Promise<string>} - ID do documento salvo
   */
  saveDocument(title, content, filePath = null) {
    if (this.useSupabase) {
      return this.supabaseService.saveDocument(title, content, filePath);
    }
    
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const fileSize = content.length;
      
      const sql = `INSERT INTO documents (id, title, content, file_path, file_size) 
                   VALUES (?, ?, ?, ?, ?)`;
      
      this.db.run(sql, [id, title, content, filePath, fileSize], function(err) {
        if (err) {
          console.error('Erro ao salvar documento:', err);
          reject(err);
          return;
        }
        
        console.log(`📄 Documento salvo: ${title} (ID: ${id})`);
        resolve(id);
      });
    });
  }

  /**
   * Busca documentos relevantes baseado em uma query
   * @param {string} query - Texto de busca
   * @param {number} limit - Limite de resultados
   * @returns {Promise<Array>} - Documentos encontrados
   */
  async searchDocuments(query, limit = 5) {
    if (this.useSupabase) {
      try {
        console.log('🔍 [Database] Tentando buscar no Supabase...');
        const result = await this.supabaseService.searchDocuments(query, limit);
        console.log(`✅ [Database] Supabase retornou ${result.length} documentos`);
        return result;
      } catch (error) {
        console.log('⚠️ [Database] Erro no Supabase, usando SQLite como fallback:', error.message);
        // Fallback para SQLite em caso de erro
      }
    }
    
    return new Promise((resolve, reject) => {
      // Busca simples por palavras-chave no título e conteúdo
      const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
      
      if (keywords.length === 0) {
        resolve([]);
        return;
      }

      // Constrói a query SQL com LIKE para cada palavra-chave
      const conditions = keywords.map(() => 
        '(LOWER(title) LIKE ? OR LOWER(content) LIKE ?)'
      ).join(' AND ');
      
      const sql = `SELECT id, title, content, upload_date 
                   FROM documents 
                   WHERE ${conditions}
                   ORDER BY upload_date DESC 
                   LIMIT ?`;
      
      const params = [];
      keywords.forEach(keyword => {
        params.push(`%${keyword}%`, `%${keyword}%`);
      });
      params.push(limit);
      
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Erro ao buscar documentos:', err);
          reject(err);
          return;
        }
        
        // Limita o conteúdo retornado para evitar respostas muito longas
        const results = rows.map(row => ({
          ...row,
          content: row.content.substring(0, 1000) + (row.content.length > 1000 ? '...' : '')
        }));
        
        resolve(results);
      });
    });
  }

  /**
   * Obtém todos os documentos
   * @returns {Promise<Array>} - Lista de documentos
   */
  getDocuments() {
    if (this.useSupabase) {
      return this.supabaseService.getDocuments();
    }
    
    return new Promise((resolve, reject) => {
      const sql = `SELECT id, title, file_size, upload_date, last_updated 
                   FROM documents 
                   ORDER BY upload_date DESC`;
      
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          console.error('Erro ao buscar documentos:', err);
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  /**
   * Remove um documento
   * @param {string} documentId - ID do documento
   * @returns {Promise<void>}
   */
  deleteDocument(documentId) {
    if (this.useSupabase) {
      return this.supabaseService.deleteDocument(documentId);
    }
    
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM documents WHERE id = ?';
      
      this.db.run(sql, [documentId], function(err) {
        if (err) {
          console.error('Erro ao deletar documento:', err);
          reject(err);
          return;
        }
        
        console.log(`🗑️ Documento removido: ${documentId}`);
        resolve();
      });
    });
  }

  /**
   * Salva uma conversa no histórico
   * @param {string} userMessage - Mensagem do usuário
   * @param {string} botResponse - Resposta do bot
   * @param {string} sessionId - ID da sessão (opcional)
   * @returns {Promise<string>} - ID da conversa
   */
  saveConversation(userMessage, botResponse, sessionId = null) {
    if (this.useSupabase) {
      return this.supabaseService.saveConversation(userMessage, botResponse, sessionId);
    }
    
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const sql = `INSERT INTO conversations (id, user_message, bot_response, session_id) 
                   VALUES (?, ?, ?, ?)`;
      
      this.db.run(sql, [id, userMessage, botResponse, sessionId], function(err) {
        if (err) {
          console.error('Erro ao salvar conversa:', err);
          reject(err);
          return;
        }
        resolve(id);
      });
    });
  }

  /**
   * Obtém o histórico de conversas
   * @param {number} limit - Limite de conversas
   * @returns {Promise<Array>} - Histórico de conversas
   */
  getConversations(limit = 50) {
    if (this.useSupabase) {
      return this.supabaseService.getConversations(limit);
    }
    
    return new Promise((resolve, reject) => {
      const sql = `SELECT user_message, bot_response, timestamp 
                   FROM conversations 
                   ORDER BY timestamp DESC 
                   LIMIT ?`;
      
      this.db.all(sql, [limit], (err, rows) => {
        if (err) {
          console.error('Erro ao buscar conversas:', err);
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  /**
   * Limpa todo o histórico de conversas
   * @returns {Promise<void>}
   */
  clearConversations() {
    if (this.useSupabase) {
      return this.supabaseService.clearConversations();
    }
    
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM conversations';
      
      this.db.run(sql, [], function(err) {
        if (err) {
          console.error('Erro ao limpar conversas:', err);
          reject(err);
          return;
        }
        
        console.log(`🗑️ Histórico de conversas limpo: ${this.changes} conversas removidas`);
        resolve();
      });
    });
  }

  /**
   * Obtém estatísticas do sistema
   * @returns {Promise<Object>} - Estatísticas
   */
  getStats() {
    if (this.useSupabase) {
      return this.supabaseService.getStats();
    }
    
    return new Promise((resolve, reject) => {
      const queries = {
        totalDocuments: 'SELECT COUNT(*) as count FROM documents',
        totalConversations: 'SELECT COUNT(*) as count FROM conversations',
        totalContentSize: 'SELECT SUM(file_size) as size FROM documents',
        recentDocuments: 'SELECT COUNT(*) as count FROM documents WHERE upload_date > datetime("now", "-7 days")',
        recentConversations: 'SELECT COUNT(*) as count FROM conversations WHERE timestamp > datetime("now", "-7 days")'
      };

      const stats = {};
      const queryKeys = Object.keys(queries);
      let completed = 0;

      queryKeys.forEach(key => {
        this.db.get(queries[key], [], (err, row) => {
          if (err) {
            console.error(`Erro ao buscar estatística ${key}:`, err);
            stats[key] = 0;
          } else {
            stats[key] = row.count || row.size || 0;
          }
          
          completed++;
          if (completed === queryKeys.length) {
            resolve(stats);
          }
        });
      });
    });
  }

  /**
   * Fecha a conexão com o banco de dados
   */
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Erro ao fechar banco de dados:', err);
        } else {
          console.log('🔒 Conexão com banco de dados fechada');
        }
      });
    }
  }
}

module.exports = DatabaseService;