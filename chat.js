// chat.js - Sistema de Chat em Tempo Real
class ChatModule {
    constructor(app) {
        this.app = app;
        this.chats = [];
        this.currentChat = null;
        this.messages = [];
        this.unsubscribes = [];
        
        this.init();
    }
    
    async init() {
        await this.loadChats();
        this.render();
        this.setupEventListeners();
        this.setupFirebaseListeners();
    }
    
    async loadChats() {
        try {
            const user = this.app.user;
            if (user) {
                const chatsRef = ref(db, `users/${user.uid}/chats`);
                const snapshot = await get(chatsRef);
                
                if (snapshot.exists()) {
                    this.chats = Object.values(snapshot.val());
                    this.chats.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
                }
            }
        } catch (error) {
            console.error('Erro ao carregar chats:', error);
            this.chats = this.getSampleChats();
        }
    }
    
    getSampleChats() {
        return [
            {
                id: '1',
                name: 'Grupo da Família',
                type: 'group',
                participants: ['user1', 'user2', 'user3'],
                lastMessage: 'Boa noite a todos!',
                lastMessageAt: '2024-01-15T20:30:00Z',
                unreadCount: 3,
                pinned: true,
                avatar: '👨‍👩‍👧‍👦'
            },
            {
                id: '2',
                name: 'João Silva',
                type: 'private',
                participants: ['currentUser', 'user2'],
                lastMessage: 'Ok, combinado!',
                lastMessageAt: '2024-01-15T19:45:00Z',
                unreadCount: 0,
                pinned: false,
                avatar: 'JS'
            }
        ];
    }
    
    async startChat(contactId, isGroup = false) {
        const user = this.app.user;
        if (!user) return;
        
        let chat = this.chats.find(c => 
            c.type === (isGroup ? 'group' : 'private') &&
            c.participants.includes(contactId)
        );
        
        if (!chat) {
            chat = {
                id: Date.now().toString(),
                name: isGroup ? 'Novo Grupo' : 'Chat',
                type: isGroup ? 'group' : 'private',
                participants: isGroup ? [] : [user.uid, contactId],
                createdAt: new Date().toISOString(),
                lastMessage: '',
                lastMessageAt: new Date().toISOString(),
                unreadCount: 0,
                pinned: false
            };
            
            if (isGroup) {
                chat.avatar = '👥';
            } else {
                const contact = this.app.modules.contacts.contacts.find(c => c.id === contactId);
                if (contact) {
                    chat.name = contact.name;
                    chat.avatar = contact.name.charAt(0).toUpperCase();
                }
            }
            
            this.chats.unshift(chat);
            await this.saveChat(chat);
        }
        
        this.openChat(chat.id);
    }
    
    async openChat(chatId) {
        this.currentChat = this.chats.find(c => c.id === chatId);
        if (!this.currentChat) return;
        
        // Marcar como lido
        this.currentChat.unreadCount = 0;
        await this.updateChat(this.currentChat);
        
        // Carregar mensagens
        await this.loadMessages(chatId);
        
        this.renderChat();
        this.renderMessages();
    }
    
    async loadMessages(chatId) {
        try {
            const messagesRef = ref(db, `chats/${chatId}/messages`);
            const snapshot = await get(messagesRef);
            
            if (snapshot.exists()) {
                this.messages = Object.values(snapshot.val());
                this.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            } else {
                this.messages = [];
            }
        } catch (error) {
            console.error('Erro ao carregar mensagens:', error);
            this.messages = [];
        }
    }
    
    async sendMessage(content, type = 'text') {
        if (!this.currentChat || !content.trim()) return;
        
        const user = this.app.user;
        const message = {
            id: Date.now().toString(),
            chatId: this.currentChat.id,
            senderId: user.uid,
            senderName: user.displayName || 'Usuário',
            content: content,
            type: type,
            timestamp: new Date().toISOString(),
            readBy: [user.uid],
            reactions: {}
        };
        
        // Adicionar localmente
        this.messages.push(message);
        this.renderMessages();
        
        // Atualizar último mensagem no chat
        this.currentChat.lastMessage = type === 'text' ? content : `[${type}]`;
        this.currentChat.lastMessageAt = message.timestamp;
        
        // Salvar no Firebase
        await Promise.all([
            this.saveMessage(message),
            this.updateChat(this.currentChat)
        ]);
        
        // Rolar para baixo
        this.scrollToBottom();
    }
    
    async saveMessage(message) {
        try {
            const messageRef = ref(db, `chats/${message.chatId}/messages/${message.id}`);
            await set(messageRef, message);
        } catch (error) {
            console.error('Erro ao salvar mensagem:', error);
        }
    }
    
    async saveChat(chat) {
        try {
            const user = this.app.user;
            const chatRef = ref(db, `users/${user.uid}/chats/${chat.id}`);
            await set(chatRef, chat);
        } catch (error) {
            console.error('Erro ao salvar chat:', error);
        }
    }
    
    async updateChat(updates) {
        try {
            const user = this.app.user;
            const chatRef = ref(db, `users/${user.uid}/chats/${updates.id}`);
            await update(chatRef, updates);
        } catch (error) {
            console.error('Erro ao atualizar chat:', error);
        }
    }
    
    setupFirebaseListeners() {
        // Escutar novas mensagens para o chat atual
        if (this.currentChat) {
            const messagesRef = ref(db, `chats/${this.currentChat.id}/messages`);
            const unsubscribe = onChildAdded(messagesRef, (snapshot) => {
                const message = snapshot.val();
                if (!this.messages.find(m => m.id === message.id)) {
                    this.messages.push(message);
                    this.renderMessages();
                    
                    // Se não for do usuário atual, incrementar unread
                    if (message.senderId !== this.app.user.uid) {
                        this.currentChat.unreadCount++;
                        this.updateChat(this.currentChat);
                        this.renderChatList();
                    }
                }
            });
            
            this.unsubscribes.push(unsubscribe);
        }
    }
    
    render() {
        const container = document.getElementById('chat-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="chat-layout">
                <div class="chat-sidebar">
                    <div class="chat-header">
                        <h2>Conversas</h2>
                        <button class="btn btn-primary" id="new-chat-btn">
                            <i class="fas fa-plus"></i> Nova Conversa
                        </button>
                    </div>
                    
                    <div class="chat-search">
                        <input type="text" placeholder="Buscar conversas..." id="chat-search-input">
                        <i class="fas fa-search"></i>
                    </div>
                    
                    <div class="chat-list" id="chat-list">
                        <!-- Lista de conversas será renderizada aqui -->
                    </div>
                </div>
                
                <div class="chat-main" id="chat-main">
                    <div class="chat-empty-state">
                        <i class="fas fa-comments"></i>
                        <h3>Selecione uma conversa</h3>
                        <p>Ou inicie uma nova conversa</p>
                    </div>
                </div>
            </div>
            
            <!-- Modal nova conversa -->
            <div class="modal" id="new-chat-modal">
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h3>Nova Conversa</h3>
                    
                    <div class="new-chat-options">
                        <button class="option-btn" id="new-private-chat">
                            <i class="fas fa-user"></i>
                            <span>Conversa Privada</span>
                        </button>
                        <button class="option-btn" id="new-group-chat">
                            <i class="fas fa-users"></i>
                            <span>Novo Grupo</span>
                        </button>
                    </div>
                    
                    <div id="contacts-selector" style="display: none;">
                        <h4>Selecione contatos</h4>
                        <div class="contacts-selector-list" id="contacts-selector-list"></div>
                        <div class="modal-actions">
                            <button class="btn btn-secondary" id="cancel-chat">Cancelar</button>
                            <button class="btn btn-primary" id="create-chat">Criar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.renderChatList();
    }
    
    renderChatList() {
        const chatList = document.getElementById('chat-list');
        if (!chatList) return;
        
        if (this.chats.length === 0) {
            chatList.innerHTML = `
                <div class="empty-chat-list">
                    <i class="fas fa-comment-slash"></i>
                    <p>Nenhuma conversa</p>
                </div>
            `;
            return;
        }
        
        chatList.innerHTML = this.chats.map(chat => `
            <div class="chat-item ${this.currentChat?.id === chat.id ? 'active' : ''}" data-chat-id="${chat.id}">
                <div class="chat-avatar">${chat.avatar}</div>
                <div class="chat-info">
                    <div class="chat-header">
                        <h4>${chat.name}</h4>
                        <span class="chat-time">${this.formatTime(chat.lastMessageAt)}</span>
                    </div>
                    <div class="chat-preview">
                        <p>${chat.lastMessage || 'Nenhuma mensagem'}</p>
                        ${chat.unreadCount > 0 ? `<span class="unread-badge">${chat.unreadCount}</span>` : ''}
                        ${chat.pinned ? `<i class="fas fa-thumbtack pinned-icon"></i>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    renderChat() {
        const chatMain = document.getElementById('chat-main');
        if (!chatMain || !this.currentChat) return;
        
        chatMain.innerHTML = `
            <div class="chat-header">
                <div class="chat-info">
                    <div class="chat-avatar">${this.currentChat.avatar}</div>
                    <div>
                        <h3>${this.currentChat.name}</h3>
                        <p>${this.currentChat.type === 'group' ? 'Grupo' : 'Online'}</p>
                    </div>
                </div>
                <div class="chat-actions">
                    <button class="icon-btn" id="chat-info-btn">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    <button class="icon-btn" id="pin-chat-btn">
                        <i class="fas fa-thumbtack ${this.currentChat.pinned ? 'active' : ''}"></i>
                    </button>
                    <button class="icon-btn" id="more-options-btn">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
            </div>
            
            <div class="chat-messages" id="chat-messages">
                <!-- Mensagens serão renderizadas aqui -->
            </div>
            
            <div class="chat-input-container">
                <div class="chat-input-actions">
                    <button class="icon-btn" id="attach-btn">
                        <i class="fas fa-paperclip"></i>
                    </button>
                    <button class="icon-btn" id="emoji-btn">
                        <i class="fas fa-smile"></i>
                    </button>
                </div>
                <div class="chat-input-wrapper">
                    <input type="text" 
                           id="chat-input" 
                           placeholder="Digite sua mensagem..."
                           autocomplete="off">
                    <button class="icon-btn" id="send-btn">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    renderMessages() {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        
        if (this.messages.length === 0) {
            container.innerHTML = `
                <div class="empty-messages">
                    <p>Nenhuma mensagem ainda</p>
                    <p>Envie a primeira mensagem!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.messages.map(message => `
            <div class="message ${message.senderId === this.app.user.uid ? 'sent' : 'received'}">
                <div class="message-content">
                    ${message.type === 'text' ? message.content : 
                      message.type === 'image' ? `<img src="${message.content}" alt="Imagem">` :
                      message.type === 'file' ? `<div class="file-message">
                          <i class="fas fa-file"></i>
                          <span>${message.content}</span>
                      </div>` : message.content}
                </div>
                <div class="message-time">
                    ${this.formatTime(message.timestamp)}
                    ${message.senderId === this.app.user.uid ? 
                      `<i class="fas fa-check${message.readBy.length > 1 ? '-double' : ''}"></i>` : ''}
                </div>
            </div>
        `).join('');
        
        this.scrollToBottom();
    }
    
    scrollToBottom() {
        const container = document.getElementById('chat-messages');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
    
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 24 * 60 * 60 * 1000) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diff < 7 * 24 * 60 * 60 * 1000) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString();
        }
    }
    
    setupEventListeners() {
        // Nova conversa
        document.addEventListener('click', (e) => {
            if (e.target.id === 'new-chat-btn' || e.target.closest('#new-chat-btn')) {
                document.getElementById('new-chat-modal').style.display = 'block';
            }
            
            // Selecionar conversa
            if (e.target.closest('.chat-item')) {
                const chatId = e.target.closest('.chat-item').dataset.chatId;
                this.openChat(chatId);
            }
            
            // Enviar mensagem
            if (e.target.id === 'send-btn' || e.target.closest('#send-btn')) {
                const input = document.getElementById('chat-input');
                if (input.value.trim()) {
                    this.sendMessage(input.value);
                    input.value = '';
                }
            }
            
            // Tecla Enter para enviar
            const chatInput = document.getElementById('chat-input');
            if (chatInput) {
                chatInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (chatInput.value.trim()) {
                            this.sendMessage(chatInput.value);
                            chatInput.value = '';
                        }
                    }
                });
            }
        });
    }
    
    show() {
        document.getElementById('chat-container').style.display = 'block';
        this.render();
    }
    
    hide() {
        const container = document.getElementById('chat-container');
        if (container) {
            container.style.display = 'none';
        }
        
        // Limpar listeners do Firebase
        this.unsubscribes.forEach(unsub => unsub());
        this.unsubscribes = [];
    }
}
