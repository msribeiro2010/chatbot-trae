class ChatbotApp {
    constructor() {
        this.currentChatId = null;
        this.isLoading = false;
        this.conversations = [];
        this.documents = [];
        this.userProfile = { name: 'Adm.Marcelo', avatar: 'fas fa-user' };
        
        this.initializeElements();
        this.bindEvents();
        this.loadInitialData();
    }

    initializeElements() {
        // Chat elements
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.webSearchToggle = document.getElementById('webSearchToggle');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        // Auth elements
        this.logoutBtn = document.getElementById('logoutBtn');
        this.profileBtn = document.getElementById('profileBtn');
        console.log('Logout button element:', this.logoutBtn);
        console.log('Profile button element:', this.profileBtn);
        
        // Sidebar elements
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
        this.newChatBtn = document.getElementById('newChatBtn');
        this.chatList = document.getElementById('chatList');
        this.adminBtn = document.getElementById('adminBtn');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        
        // Modal elements
        this.adminModal = document.getElementById('adminModal');
        this.closeAdminModal = document.getElementById('closeAdminModal');
        
        // Upload elements
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.selectFilesBtn = document.getElementById('selectFilesBtn');
        this.uploadProgress = document.getElementById('uploadProgress');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        
        // Admin tabs
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // Documents
        this.documentsList = document.getElementById('documentsList');
        this.refreshDocuments = document.getElementById('refreshDocuments');
        
        // Stats
        this.statsGrid = document.getElementById('statsGrid');
    }

    bindEvents() {
        // Auth events
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.logout());
            console.log('Logout event listener added');
        } else {
            console.error('Logout button not found!');
        }
        
        if (this.profileBtn) {
            this.profileBtn.addEventListener('click', () => this.openProfile());
            console.log('Profile event listener added');
        } else {
            console.error('Profile button not found!');
        }
        
        // Chat events
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.messageInput.addEventListener('input', () => this.handleInputChange());
        
        // Sidebar events
        this.mobileMenuBtn.addEventListener('click', () => this.toggleSidebar());
        this.newChatBtn.addEventListener('click', () => this.startNewChat());
        this.adminBtn.addEventListener('click', () => this.openAdminModal());
        this.clearHistoryBtn.addEventListener('click', () => this.clearChatHistory());
        
        // Modal events
        this.closeAdminModal.addEventListener('click', () => this.closeModal());
        this.adminModal.addEventListener('click', (e) => {
            if (e.target === this.adminModal) this.closeModal();
        });
        
        // Upload events
        this.selectFilesBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Tab events
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
        
        // Documents events
        this.refreshDocuments.addEventListener('click', () => this.loadDocuments());
        
        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => this.autoResizeTextarea());
    }

    async loadInitialData() {
        try {
            await Promise.all([
                this.loadUserProfile(),
                this.loadConversations(),
                this.loadDocuments(),
                this.loadStats()
            ]);
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
        }
    }
    
    async loadUserProfile() {
        try {
            const response = await fetch('/api/auth-status');
            if (response.ok) {
                const data = await response.json();
                if (data.user) {
                    this.userProfile = data.user;
                    this.updateUserDisplay();
                }
            }
        } catch (error) {
            console.error('Erro ao carregar perfil do usuário:', error);
        }
    }
    
    updateUserDisplay() {
        // Atualizar exibição do nome do usuário na interface
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(element => {
            element.textContent = this.userProfile.name;
        });
    }

    // Chat functionality
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isLoading) return;

        const useWebSearch = this.webSearchToggle.checked;
        
        // Add user message to chat
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.autoResizeTextarea();
        this.updateSendButton();
        
        // Show typing indicator
        this.showTypingIndicator();
        this.setLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    message, 
                    useWebSearch 
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erro na resposta do servidor');
            }

            // Remove typing indicator
            this.hideTypingIndicator();
            
            // Add bot response
            this.addMessage(data.response, 'bot', data.sources);
            
            // Update conversations list
            await this.loadConversations();
            
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            this.hideTypingIndicator();
            this.addMessage('Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.', 'bot');
        } finally {
            this.setLoading(false);
        }
    }

    addMessage(text, sender, sources = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender} fade-in`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        if (sender === 'user') {
            const userIcon = this.userProfile.avatar || 'fas fa-user';
            avatar.innerHTML = `<i class="${userIcon}"></i>`;
        } else {
            avatar.innerHTML = '<i class="fas fa-robot"></i>';
        }
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        // Preservar quebras de linha e tornar links clicáveis
        const formattedText = this.formatTextWithLinks(text.replace(/\n/g, '<br>'));
        textDiv.innerHTML = formattedText;
        
        content.appendChild(textDiv);
        
        if (sources && sender === 'bot') {
            const sourcesDiv = document.createElement('div');
            sourcesDiv.className = 'message-sources';
            
            let sourcesText = 'Fontes: ';
            if (sources.documents > 0) {
                sourcesText += `${sources.documents} documento(s)`;
            }
            if (sources.webSearch) {
                sourcesText += sources.documents > 0 ? ', Busca na web' : 'Busca na web';
            }
            
            sourcesDiv.textContent = sourcesText;
            content.appendChild(sourcesDiv);
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        
        // Remove welcome message if exists
        const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing-message';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
        
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingMessage = this.chatMessages.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }

    handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendMessage();
        }
    }

    handleInputChange() {
        this.updateSendButton();
    }

    updateSendButton() {
        const hasText = this.messageInput.value.trim().length > 0;
        this.sendBtn.disabled = !hasText || this.isLoading;
    }

    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    formatTextWithLinks(text) {
        // Regex para detectar URLs
        const urlRegex = /(https?:\/\/[^\s<>"]+)/gi;
        
        return text.replace(urlRegex, (url) => {
            // Remove pontuação no final da URL se houver
            const cleanUrl = url.replace(/[.,;:!?]$/, '');
            const punctuation = url.length > cleanUrl.length ? url.slice(-1) : '';
            
            return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="message-link">${cleanUrl}</a>${punctuation}`;
        });
    }

    setLoading(loading) {
        this.isLoading = loading;
        this.loadingOverlay.style.display = loading ? 'flex' : 'none';
        this.updateSendButton();
    }

    // Sidebar functionality
    toggleSidebar() {
        this.sidebar.classList.toggle('open');
    }

    startNewChat() {
        this.currentChatId = null;
        this.chatMessages.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">
                    <i class="fas fa-robot"></i>
                </div>
                <h2>Olá! Eu sou o NAPJe AI</h2>
                <p>Sou seu assistente inteligente. Posso ajudar você com informações dos documentos carregados e também buscar informações atualizadas na internet.</p>
                <div class="welcome-features">
                    <div class="feature">
                        <i class="fas fa-file-text"></i>
                        <span>Análise de Documentos</span>
                    </div>
                    <div class="feature">
                        <i class="fas fa-search"></i>
                        <span>Busca Inteligente</span>
                    </div>
                    <div class="feature">
                        <i class="fas fa-globe"></i>
                        <span>Informações Atualizadas</span>
                    </div>
                </div>
            </div>
        `;
        
        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            this.sidebar.classList.remove('open');
        }
    }

    async loadConversations() {
        try {
            const response = await fetch('/api/conversations');
            const conversations = await response.json();
            
            this.conversations = conversations;
            this.renderConversations();
        } catch (error) {
            console.error('Erro ao carregar conversas:', error);
        }
    }

    renderConversations() {
        this.chatList.innerHTML = '';
        
        if (this.conversations.length === 0) {
            this.chatList.innerHTML = '<p style="color: #a0aec0; font-size: 14px; text-align: center;">Nenhuma conversa ainda</p>';
            return;
        }
        
        this.conversations.slice(0, 10).forEach((conv, index) => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.textContent = conv.user_message.substring(0, 50) + (conv.user_message.length > 50 ? '...' : '');
            chatItem.addEventListener('click', () => this.loadConversation(conv));
            this.chatList.appendChild(chatItem);
        });
    }

    loadConversation(conversation) {
        // This would load a specific conversation
        // For now, we'll just show the message
        this.chatMessages.innerHTML = '';
        this.addMessage(conversation.user_message, 'user');
        this.addMessage(conversation.bot_response, 'bot');
        
        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            this.sidebar.classList.remove('open');
        }
    }

    async clearChatHistory() {
        if (!confirm('Tem certeza que deseja limpar todo o histórico de conversas? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            const response = await fetch('/api/conversations', {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Erro ao limpar histórico');
            }

            // Limpar a lista de conversas
            this.conversations = [];
            this.renderConversations();
            
            // Iniciar nova conversa
            this.startNewChat();
            
            console.log('Histórico de conversas limpo com sucesso');
        } catch (error) {
            console.error('Erro ao limpar histórico:', error);
            alert('Erro ao limpar o histórico de conversas. Tente novamente.');
        }
    }

    // Modal functionality
    openAdminModal() {
        this.adminModal.style.display = 'flex';
        this.loadDocuments();
        this.loadStats();
    }

    closeModal() {
        this.adminModal.style.display = 'none';
    }

    switchTab(tabName) {
        // Update tab buttons
        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update tab contents
        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabName + 'Tab');
        });
        
        // Load data for specific tabs
        if (tabName === 'documents') {
            this.loadDocuments();
        } else if (tabName === 'stats') {
            this.loadStats();
        }
    }

    // File upload functionality
    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.uploadFiles(files);
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        this.uploadFiles(files);
    }

    async uploadFiles(files) {
        if (files.length === 0) return;
        
        const validFiles = files.filter(file => {
            const validTypes = ['.pdf', '.docx', '.txt', '.md'];
            const fileExt = '.' + file.name.split('.').pop().toLowerCase();
            return validTypes.includes(fileExt);
        });
        
        if (validFiles.length === 0) {
            alert('Por favor, selecione apenas arquivos PDF, DOCX, TXT ou MD.');
            return;
        }
        
        this.uploadProgress.style.display = 'block';
        
        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];
            await this.uploadSingleFile(file, i + 1, validFiles.length);
        }
        
        this.uploadProgress.style.display = 'none';
        this.loadDocuments();
        this.loadStats();
        
        // Reset file input
        this.fileInput.value = '';
    }

    async uploadSingleFile(file, current, total) {
        const formData = new FormData();
        formData.append('document', file);
        
        this.progressText.textContent = `Carregando ${file.name} (${current}/${total})...`;
        
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Erro no upload');
            }
            
            const progress = (current / total) * 100;
            this.progressFill.style.width = progress + '%';
            
            console.log('Arquivo carregado:', result);
            
        } catch (error) {
            console.error('Erro no upload:', error);
            alert(`Erro ao carregar ${file.name}: ${error.message}`);
        }
    }

    // Documents functionality
    async loadDocuments() {
        try {
            const response = await fetch('/api/documents');
            const documents = await response.json();
            
            this.documents = documents;
            this.renderDocuments();
        } catch (error) {
            console.error('Erro ao carregar documentos:', error);
        }
    }

    renderDocuments() {
        this.documentsList.innerHTML = '';
        
        if (this.documents.length === 0) {
            this.documentsList.innerHTML = '<p style="color: #a0aec0; text-align: center; padding: 40px;">Nenhum documento carregado ainda</p>';
            return;
        }
        
        this.documents.forEach(doc => {
            const docItem = document.createElement('div');
            docItem.className = 'document-item';
            
            const formatFileSize = (bytes) => {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            };
            
            const uploadDate = new Date(doc.upload_date).toLocaleDateString('pt-BR');
            
            docItem.innerHTML = `
                <div class="document-info">
                    <h4>${doc.title}</h4>
                    <div class="document-meta">
                        ${formatFileSize(doc.file_size)} • Carregado em ${uploadDate}
                    </div>
                </div>
                <div class="document-actions">
                    <button class="delete-btn" onclick="app.deleteDocument('${doc.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            this.documentsList.appendChild(docItem);
        });
    }

    async deleteDocument(documentId) {
        if (!confirm('Tem certeza que deseja remover este documento?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/documents/${documentId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Erro ao deletar documento');
            }
            
            this.loadDocuments();
            this.loadStats();
            
        } catch (error) {
            console.error('Erro ao deletar documento:', error);
            alert('Erro ao deletar documento');
        }
    }

    // Stats functionality
    async loadStats() {
        try {
            const response = await fetch('/api/stats');
            const stats = await response.json();
            
            this.renderStats(stats);
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    renderStats(stats) {
        const formatBytes = (bytes) => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };
        
        this.statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${stats.totalDocuments || 0}</div>
                <div class="stat-label">Total de Documentos</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.totalConversations || 0}</div>
                <div class="stat-label">Total de Conversas</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${formatBytes(stats.totalContentSize || 0)}</div>
                <div class="stat-label">Tamanho da Base</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.recentDocuments || 0}</div>
                <div class="stat-label">Docs esta Semana</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.recentConversations || 0}</div>
                <div class="stat-label">Conversas esta Semana</div>
            </div>
        `;    }
    
    // Auth functionality
    async logout() {
        console.log('Logout button clicked');
        try {
            console.log('Sending logout request...');
            const response = await fetch('/api/logout', {
                method: 'POST'
            });
            
            console.log('Logout response:', response.status);
            
            if (response.ok) {
                console.log('Logout successful, redirecting...');
                // Redirect to login page
                window.location.href = '/login';
            } else {
                console.error('Erro ao fazer logout - Status:', response.status);
            }
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    }
    
    openProfile() {
        console.log('Profile button clicked');
        // Redirect to profile page
        window.location.href = '/profile';
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ChatbotApp();
});

// Handle window resize for responsive behavior
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        document.getElementById('sidebar').classList.remove('open');
    }
});