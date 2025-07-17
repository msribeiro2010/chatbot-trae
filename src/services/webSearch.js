const axios = require('axios');
const cheerio = require('cheerio');

class WebSearchService {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    this.timeout = 10000; // 10 segundos
  }

  /**
   * Realiza busca na web usando DuckDuckGo
   * @param {string} query - Termo de busca
   * @param {number} maxResults - Número máximo de resultados
   * @returns {Promise<Array>} - Resultados da busca
   */
  async search(query, maxResults = 5) {
    try {
      console.log(`🔍 Buscando na web: ${query}`);
      
      // Usar DuckDuckGo para busca (não requer API key)
      const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: this.timeout
      });

      const results = this.parseDuckDuckGoResults(response.data, maxResults);
      
      // Se não encontrou resultados no DuckDuckGo, tenta busca alternativa
      if (results.length === 0) {
        return await this.fallbackSearch(query, maxResults);
      }
      
      console.log(`✅ Encontrados ${results.length} resultados na web`);
      return results;
      
    } catch (error) {
      console.error('Erro na busca web:', error.message);
      
      // Tentar busca alternativa em caso de erro
      try {
        return await this.fallbackSearch(query, maxResults);
      } catch (fallbackError) {
        console.error('Erro na busca alternativa:', fallbackError.message);
        return [];
      }
    }
  }

  /**
   * Faz parsing dos resultados do DuckDuckGo
   * @param {string} html - HTML da página de resultados
   * @param {number} maxResults - Número máximo de resultados
   * @returns {Array} - Resultados parseados
   */
  parseDuckDuckGoResults(html, maxResults) {
    const $ = cheerio.load(html);
    const results = [];
    
    $('.result').each((index, element) => {
      if (results.length >= maxResults) return false;
      
      const $element = $(element);
      const title = $element.find('.result__title a').text().trim();
      const url = $element.find('.result__title a').attr('href');
      const snippet = $element.find('.result__snippet').text().trim();
      
      if (title && url && snippet) {
        results.push({
          title: this.cleanText(title),
          url: this.cleanUrl(url),
          snippet: this.cleanText(snippet)
        });
      }
    });
    
    return results;
  }

  /**
   * Busca alternativa usando scraping de sites de notícias
   * @param {string} query - Termo de busca
   * @param {number} maxResults - Número máximo de resultados
   * @returns {Promise<Array>} - Resultados da busca
   */
  async fallbackSearch(query, maxResults) {
    try {
      console.log('🔄 Tentando busca alternativa...');
      
      // Busca em sites de notícias brasileiros
      const searchSites = [
        {
          name: 'G1',
          url: `https://g1.globo.com/busca/?q=${encodeURIComponent(query)}`,
          selector: '.widget--info'
        }
      ];
      
      const results = [];
      
      for (const site of searchSites) {
        if (results.length >= maxResults) break;
        
        try {
          const response = await axios.get(site.url, {
            headers: { 'User-Agent': this.userAgent },
            timeout: this.timeout
          });
          
          const $ = cheerio.load(response.data);
          
          $(site.selector).each((index, element) => {
            if (results.length >= maxResults) return false;
            
            const $element = $(element);
            const title = $element.find('a').first().text().trim();
            const url = $element.find('a').first().attr('href');
            const snippet = $element.find('.widget--info__description').text().trim() || 
                           $element.text().trim().substring(0, 200);
            
            if (title && url) {
              results.push({
                title: this.cleanText(title),
                url: this.cleanUrl(url),
                snippet: this.cleanText(snippet)
              });
            }
          });
          
        } catch (siteError) {
          console.error(`Erro ao buscar em ${site.name}:`, siteError.message);
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('Erro na busca alternativa:', error.message);
      return [];
    }
  }

  /**
   * Busca informações específicas sobre um tópico
   * @param {string} topic - Tópico específico
   * @returns {Promise<Array>} - Informações encontradas
   */
  async searchTopic(topic) {
    try {
      const queries = [
        `${topic} definição`,
        `${topic} conceito`,
        `o que é ${topic}`,
        `${topic} explicação`
      ];
      
      const allResults = [];
      
      for (const query of queries) {
        const results = await this.search(query, 2);
        allResults.push(...results);
        
        // Pequena pausa entre as buscas
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Remove duplicatas baseado na URL
      const uniqueResults = allResults.filter((result, index, self) => 
        index === self.findIndex(r => r.url === result.url)
      );
      
      return uniqueResults.slice(0, 5);
      
    } catch (error) {
      console.error('Erro na busca por tópico:', error.message);
      return [];
    }
  }

  /**
   * Extrai conteúdo de uma página web
   * @param {string} url - URL da página
   * @returns {Promise<string>} - Conteúdo extraído
   */
  async extractPageContent(url) {
    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': this.userAgent },
        timeout: this.timeout
      });
      
      const $ = cheerio.load(response.data);
      
      // Remove scripts, styles e outros elementos desnecessários
      $('script, style, nav, header, footer, aside, .ads, .advertisement').remove();
      
      // Extrai o conteúdo principal
      let content = '';
      
      // Tenta encontrar o conteúdo principal
      const mainSelectors = [
        'main',
        'article',
        '.content',
        '.post-content',
        '.entry-content',
        '#content',
        '.main-content'
      ];
      
      for (const selector of mainSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          content = element.text().trim();
          break;
        }
      }
      
      // Se não encontrou conteúdo principal, pega o body
      if (!content) {
        content = $('body').text().trim();
      }
      
      // Limita o tamanho do conteúdo
      return this.cleanText(content).substring(0, 2000);
      
    } catch (error) {
      console.error('Erro ao extrair conteúdo da página:', error.message);
      return '';
    }
  }

  /**
   * Limpa e normaliza texto
   * @param {string} text - Texto para limpar
   * @returns {string} - Texto limpo
   */
  cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ') // Remove múltiplos espaços
      .replace(/\n+/g, ' ') // Remove quebras de linha
      .trim();
  }

  /**
   * Limpa e normaliza URLs
   * @param {string} url - URL para limpar
   * @returns {string} - URL limpa
   */
  cleanUrl(url) {
    if (!url) return '';
    
    // Remove parâmetros de tracking do DuckDuckGo
    if (url.includes('duckduckgo.com/l/?uddg=')) {
      try {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        return decodeURIComponent(urlParams.get('uddg') || url);
      } catch (error) {
        return url;
      }
    }
    
    return url;
  }

  /**
   * Verifica se a busca web está habilitada
   * @returns {boolean} - True se habilitada
   */
  isEnabled() {
    return process.env.WEB_SEARCH_ENABLED === 'true';
  }
}

module.exports = WebSearchService;