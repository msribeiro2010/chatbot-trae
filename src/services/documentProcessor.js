const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

class DocumentProcessor {
  constructor() {
    this.supportedFormats = ['.pdf', '.docx', '.txt', '.md'];
  }

  /**
   * Processa um documento e extrai seu conteúdo de texto
   * @param {string} filePath - Caminho para o arquivo
   * @returns {Promise<string>} - Conteúdo extraído do documento
   */
  async processDocument(filePath) {
    try {
      const fileExtension = path.extname(filePath).toLowerCase();
      
      if (!this.supportedFormats.includes(fileExtension)) {
        throw new Error(`Formato de arquivo não suportado: ${fileExtension}`);
      }

      let content = '';

      switch (fileExtension) {
        case '.pdf':
          content = await this.processPDF(filePath);
          break;
        case '.docx':
          content = await this.processDOCX(filePath);
          break;
        case '.txt':
        case '.md':
          content = await this.processTextFile(filePath);
          break;
        default:
          throw new Error(`Processador não implementado para: ${fileExtension}`);
      }

      // Limpar e normalizar o conteúdo
      content = this.cleanContent(content);
      
      return content;
    } catch (error) {
      console.error('Erro ao processar documento:', error);
      throw error;
    }
  }

  /**
   * Processa arquivos PDF
   * @param {string} filePath - Caminho para o arquivo PDF
   * @returns {Promise<string>} - Texto extraído
   */
  async processPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      throw new Error('Erro ao extrair texto do PDF');
    }
  }

  /**
   * Processa arquivos DOCX
   * @param {string} filePath - Caminho para o arquivo DOCX
   * @returns {Promise<string>} - Texto extraído
   */
  async processDOCX(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      console.error('Erro ao processar DOCX:', error);
      throw new Error('Erro ao extrair texto do DOCX');
    }
  }

  /**
   * Processa arquivos de texto simples
   * @param {string} filePath - Caminho para o arquivo
   * @returns {Promise<string>} - Conteúdo do arquivo
   */
  async processTextFile(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      console.error('Erro ao processar arquivo de texto:', error);
      throw new Error('Erro ao ler arquivo de texto');
    }
  }

  /**
   * Limpa e normaliza o conteúdo extraído
   * @param {string} content - Conteúdo bruto
   * @returns {string} - Conteúdo limpo
   */
  cleanContent(content) {
    if (!content) return '';
    
    return content
      // Remove múltiplas quebras de linha
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Remove espaços extras
      .replace(/[ \t]+/g, ' ')
      // Remove espaços no início e fim das linhas
      .split('\n')
      .map(line => line.trim())
      .join('\n')
      // Remove linhas vazias no início e fim
      .trim();
  }

  /**
   * Divide o conteúdo em chunks menores para melhor processamento
   * @param {string} content - Conteúdo completo
   * @param {number} maxChunkSize - Tamanho máximo do chunk
   * @returns {Array<string>} - Array de chunks
   */
  chunkContent(content, maxChunkSize = 1000) {
    if (!content || content.length <= maxChunkSize) {
      return [content];
    }

    const chunks = [];
    const sentences = content.split(/[.!?]+/);
    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;

      const potentialChunk = currentChunk + (currentChunk ? '. ' : '') + trimmedSentence;
      
      if (potentialChunk.length <= maxChunkSize) {
        currentChunk = potentialChunk;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk + '.');
        }
        currentChunk = trimmedSentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk + '.');
    }

    return chunks.filter(chunk => chunk.length > 0);
  }

  /**
   * Extrai metadados do documento
   * @param {string} filePath - Caminho para o arquivo
   * @returns {Object} - Metadados do documento
   */
  extractMetadata(filePath) {
    const stats = fs.statSync(filePath);
    const fileExtension = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath, fileExtension);

    return {
      fileName,
      fileExtension,
      fileSize: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      isSupported: this.supportedFormats.includes(fileExtension)
    };
  }

  /**
   * Valida se o arquivo pode ser processado
   * @param {string} filePath - Caminho para o arquivo
   * @returns {boolean} - True se o arquivo pode ser processado
   */
  canProcess(filePath) {
    try {
      const fileExtension = path.extname(filePath).toLowerCase();
      return this.supportedFormats.includes(fileExtension);
    } catch (error) {
      return false;
    }
  }
}

module.exports = DocumentProcessor;