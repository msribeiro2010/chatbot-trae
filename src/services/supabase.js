const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

class SupabaseService {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    this.supabase = null;
  }

  /**
   * Inicializa a conexão com o Supabase
   */
  init() {
    return new Promise((resolve, reject) => {
      try {
        this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
        console.log('✅ Conectado ao Supabase');
        this.createTables()
          .then(resolve)
          .catch(reject);
      } catch (error) {
        console.error('Erro ao conectar com o Supabase:', error);
        reject(error);
      }
    });
  }

  /**
   * Cria as tabelas necessárias no Supabase
   */
  async createTables() {
    try {
      // Verificar se as tabelas já existem
      const { data: tables, error } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (error && !error.message.includes('relation "information_schema.tables" does not exist')) {
        throw error;
      }

      const existingTables = tables ? tables.map(t => t.table_name) : [];

      // Criar tabelas se não existirem
      if (!existingTables.includes('documents')) {
        const { error: docError } = await this.supabase.rpc('create_documents_table');
        if (docError && !docError.message.includes('already exists')) {
          console.log('Tabela documents pode já existir ou será criada via SQL');
        }
      }

      if (!existingTables.includes('conversations')) {
        const { error: convError } = await this.supabase.rpc('create_conversations_table');
        if (convError && !convError.message.includes('already exists')) {
          console.log('Tabela conversations pode já existir ou será criada via SQL');
        }
      }

      if (!existingTables.includes('document_chunks')) {
        const { error: chunkError } = await this.supabase.rpc('create_document_chunks_table');
        if (chunkError && !chunkError.message.includes('already exists')) {
          console.log('Tabela document_chunks pode já existir ou será criada via SQL');
        }
      }

      console.log('✅ Tabelas verificadas/criadas no Supabase');
    } catch (error) {
      console.log('⚠️ Aviso: Algumas tabelas podem precisar ser criadas manualmente no Supabase');
      console.log('Execute os seguintes SQLs no editor SQL do Supabase:');
      console.log(`
-- Tabela de documentos
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de conversas
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_message TEXT NOT NULL,
  bot_response TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT
);

-- Tabela de chunks de documentos
CREATE TABLE IF NOT EXISTS document_chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_documents_title ON documents(title);
CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations(timestamp);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
`);
    }
  }

  /**
   * Salva um documento na base de conhecimento
   */
  async saveDocument(title, content, filePath = null) {
    try {
      const id = uuidv4();
      const fileSize = content.length;
      
      const { data, error } = await this.supabase
        .from('documents')
        .insert({
          id,
          title,
          content,
          file_path: filePath,
          file_size: fileSize
        })
        .select();

      if (error) throw error;
      
      console.log(`📄 Documento salvo: ${title} (ID: ${id})`);
      return id;
    } catch (error) {
      console.error('Erro ao salvar documento:', error);
      throw error;
    }
  }

  /**
   * Busca documentos relevantes baseado em uma query
   */
  async searchDocuments(query, limit = 5) {
    try {
      console.log(`🔍 [Supabase] Buscando por: "${query}"`);
      const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
      console.log(`🔑 [Supabase] Keywords extraídas: ${keywords.join(', ')}`);
      
      if (keywords.length === 0) {
        console.log('⚠️ [Supabase] Nenhuma keyword válida encontrada');
        return [];
      }

      // Primeiro, vamos verificar quantos documentos existem no total
      const { count } = await this.supabase
        .from('documents')
        .select('*', { count: 'exact', head: true });
      
      console.log(`📊 [Supabase] Total de documentos na base: ${count}`);

      // Usar textSearch do Supabase ou ilike para busca
      let queryBuilder = this.supabase
        .from('documents')
        .select('id, title, content, upload_date');

      // Construir condições de busca - buscar por qualquer keyword em título ou conteúdo
      const orConditions = keywords.map(keyword => 
        `title.ilike.%${keyword}%,content.ilike.%${keyword}%`
      ).join(',');
      
      queryBuilder = queryBuilder.or(orConditions);
      
      console.log(`🔍 [Supabase] Query OR conditions: ${orConditions}`);

      const { data, error } = await queryBuilder
        .order('upload_date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ [Supabase] Erro na query:', error);
        throw error;
      }

      console.log(`✅ [Supabase] Documentos encontrados na busca: ${data?.length || 0}`);

      // Limita o conteúdo retornado
      const results = data.map(row => ({
        ...row,
        content: row.content.substring(0, 1000) + (row.content.length > 1000 ? '...' : '')
      }));
      
      return results;
    } catch (error) {
      console.error('❌ [Supabase] Erro ao buscar documentos:', error);
      throw error;
    }
  }

  /**
   * Obtém todos os documentos
   */
  async getDocuments() {
    try {
      const { data, error } = await this.supabase
        .from('documents')
        .select('id, title, file_size, upload_date, last_updated')
        .order('upload_date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
      throw error;
    }
  }

  /**
   * Remove um documento
   */
  async deleteDocument(documentId) {
    try {
      const { error } = await this.supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
      
      console.log(`🗑️ Documento removido: ${documentId}`);
    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      throw error;
    }
  }

  /**
   * Salva uma conversa no histórico
   */
  async saveConversation(userMessage, botResponse, sessionId = null) {
    try {
      const id = uuidv4();
      
      const { data, error } = await this.supabase
        .from('conversations')
        .insert({
          id,
          user_message: userMessage,
          bot_response: botResponse,
          session_id: sessionId
        })
        .select();

      if (error) throw error;
      return id;
    } catch (error) {
      console.error('Erro ao salvar conversa:', error);
      throw error;
    }
  }

  /**
   * Obtém o histórico de conversas
   */
  async getConversations(limit = 50) {
    try {
      const { data, error } = await this.supabase
        .from('conversations')
        .select('user_message, bot_response, timestamp')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      throw error;
    }
  }

  /**
   * Limpa todo o histórico de conversas
   */
  async clearConversations() {
    try {
      const { error } = await this.supabase
        .from('conversations')
        .delete()
        .neq('id', ''); // Deleta todos os registros

      if (error) throw error;
      
      console.log('🗑️ Histórico de conversas limpo');
    } catch (error) {
      console.error('Erro ao limpar conversas:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas do sistema
   */
  async getStats() {
    try {
      const stats = {};

      // Total de documentos
      const { count: totalDocuments } = await this.supabase
        .from('documents')
        .select('*', { count: 'exact', head: true });

      // Total de conversas
      const { count: totalConversations } = await this.supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true });

      // Tamanho total do conteúdo
      const { data: sizeData } = await this.supabase
        .from('documents')
        .select('file_size');
      
      const totalContentSize = sizeData ? sizeData.reduce((sum, doc) => sum + (doc.file_size || 0), 0) : 0;

      // Documentos recentes (últimos 7 dias)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentDocuments } = await this.supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .gte('upload_date', sevenDaysAgo.toISOString());

      // Conversas recentes (últimos 7 dias)
      const { count: recentConversations } = await this.supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', sevenDaysAgo.toISOString());

      return {
        totalDocuments: totalDocuments || 0,
        totalConversations: totalConversations || 0,
        totalContentSize,
        recentDocuments: recentDocuments || 0,
        recentConversations: recentConversations || 0
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        totalDocuments: 0,
        totalConversations: 0,
        totalContentSize: 0,
        recentDocuments: 0,
        recentConversations: 0
      };
    }
  }

  /**
   * Fecha a conexão (não necessário no Supabase)
   */
  close() {
    console.log('🔒 Conexão com Supabase finalizada');
  }
}

module.exports = SupabaseService;