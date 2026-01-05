// chat.js - SISTEMA DE CHAT EM TEMPO REAL (Parte 1/3)
import { auth, db } from './firebase-config.js';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs,
    setDoc, 
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    arrayUnion,
    arrayRemove
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

class ChatSystem {
    constructor() {
        this.currentUser = null;
        this.conversations = [];
        this.activeChat = null;
        this.messages = [];
        this.groups = [];
        this.init();
    }

    async init() {
        await this.loadCurrentUser();
        this.setupChatListeners();
    }

    async loadCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
    }

    async renderChatPage() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="chat-container">
                <!-- Cabeçalho do Chat -->
                <div class="chat-header">
                    <h2><i class="fas fa-comments"></i> Chat</h2>
                    <div class="header-actions">
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input type="text" id="chatSearch" placeholder="Buscar conversas...">
                        </div>
                        <button class="btn-primary" id="newChatBtn">
                            <i class="fas fa-plus"></i> Novo Chat
                        </button>
                    </div>
                </div>

                <!-- Abas de Chat -->
                <div class="chat-tabs">
                    <button class="tab-btn active" data-tab="conversations" onclick="chatSystem.switchTab('conversations')">
                        <i class="fas fa-comment"></i> Conversas
                    </button>
                    <button class="tab-btn" data-tab="groups" onclick="chatSystem.switchTab('groups')">
                        <i class="fas fa-users"></i> Grupos
                    </button>
                </div>

                <!-- Lista de Conversas -->
                <div class="conversations-list" id="conversationsList">
                    <div class="loading-chats">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Carregando conversas...</p>
                    </div>
                </div>

                <!-- Lista de Grupos -->
                <div class="groups-list" id="groupsList" style="display: none;">
                    <div class="loading-groups">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Carregando grupos...</p>
                    </div>
                </div>

                <!-- Janela de Chat Ativo -->
                <div class="active-chat-window" id="activeChatWindow" style="display: none;">
                    <!-- Será preenchida quando um chat for aberto -->
                </div>
            </div>
        `;

        this.setupChatEvents();
        this.loadConversations();
        this.loadGroups();
        this.addChatStyles();
    }

// Método setupChatListeners - Continuação
setupChatListeners() {
    // Escutar novas mensagens em tempo real
    const userId = localStorage.getItem('userId');
    if (userId) {
        // Listener para conversas do usuário
        const conversationsRef = collection(db, 'users', userId, 'conversations');
        onSnapshot(conversationsRef, (snapshot) => {
            this.conversations = [];
            snapshot.forEach(doc => {
                this.conversations.push({ id: doc.id, ...doc.data() });
            });
            this.renderConversationsList();
        });

        // Listener para grupos
        const groupsRef = collection(db, 'users', userId, 'groups');
        onSnapshot(groupsRef, (snapshot) => {
            this.groups = [];
            snapshot.forEach(doc => {
                this.groups.push({ id: doc.id, ...doc.data() });
            });
            this.renderGroupsList();
        });
    }
}

setupChatEvents() {
    // Novo chat
    document.getElementById('newChatBtn')?.addEventListener('click', () => {
        this.showNewChatModal();
    });

    // Busca em conversas
    document.getElementById('chatSearch')?.addEventListener('input', (e) => {
        this.filterChats(e.target.value);
    });
}

async loadConversations() {
    try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        const conversationsRef = collection(db, 'users', userId, 'conversations');
        const q = query(conversationsRef, orderBy('lastMessageTime', 'desc'));
        const snapshot = await getDocs(q);
        
        this.conversations = [];
        snapshot.forEach(doc => {
            this.conversations.push({ id: doc.id, ...doc.data() });
        });
        
        this.renderConversationsList();
        
    } catch (error) {
        console.error('Erro ao carregar conversas:', error);
    }
}

async loadGroups() {
    try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        const groupsRef = collection(db, 'users', userId, 'groups');
        const q = query(groupsRef, orderBy('lastActivity', 'desc'));
        const snapshot = await getDocs(q);
        
        this.groups = [];
        snapshot.forEach(doc => {
            this.groups.push({ id: doc.id, ...doc.data() });
        });
        
        this.renderGroupsList();
        
    } catch (error) {
        console.error('Erro ao carregar grupos:', error);
    }
}

renderConversationsList() {
    const conversationsList = document.getElementById('conversationsList');
    if (!conversationsList) return;

    if (this.conversations.length === 0) {
        conversationsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comment-slash"></i>
                <h3>Nenhuma conversa</h3>
                <p>Inicie uma nova conversa para começar!</p>
                <button class="btn-primary" onclick="chatSystem.showNewChatModal()">
                    <i class="fas fa-plus"></i> Nova Conversa
                </button>
            </div>
        `;
        return;
    }

    conversationsList.innerHTML = this.conversations.map(conv => `
        <div class="conversation-item" data-id="${conv.id}" onclick="chatSystem.openChat('${conv.id}', '${conv.type || 'contact'}')">
            <div class="conversation-avatar">
                <img src="${conv.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(conv.name)}" 
                     alt="${conv.name}">
                ${conv.unreadCount > 0 ? `<span class="unread-badge">${conv.unreadCount}</span>` : ''}
                ${conv.pinned ? '<span class="pin-badge"><i class="fas fa-thumbtack"></i></span>' : ''}
            </div>
            
            <div class="conversation-info">
                <div class="conversation-header">
                    <h4 class="conversation-name">${conv.name}</h4>
                    <span class="conversation-time">${this.formatTime(conv.lastMessageTime)}</span>
                </div>
                
                <div class="conversation-preview">
                    <p class="last-message">${conv.lastMessage || 'Nenhuma mensagem'}</p>
                    ${conv.unreadCount > 0 ? '<span class="unread-indicator"></span>' : ''}
                </div>
                
                <div class="conversation-meta">
                    ${conv.isGroup ? '<span class="group-badge"><i class="fas fa-users"></i> Grupo</span>' : ''}
                    ${conv.muted ? '<span class="mute-badge"><i class="fas fa-volume-mute"></i></span>' : ''}
                </div>
            </div>
        </div>
    `).join('');
}

renderGroupsList() {
    const groupsList = document.getElementById('groupsList');
    if (!groupsList) return;

    if (this.groups.length === 0) {
        groupsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users-slash"></i>
                <h3>Nenhum grupo</h3>
                <p>Crie ou entre em um grupo para começar!</p>
                <button class="btn-primary" onclick="chatSystem.showNewGroupModal()">
                    <i class="fas fa-plus"></i> Criar Grupo
                </button>
            </div>
        `;
        return;
    }

    groupsList.innerHTML = this.groups.map(group => `
        <div class="group-item" data-id="${group.id}" onclick="chatSystem.openGroup('${group.id}')">
            <div class="group-avatar">
                <img src="${group.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(group.name)}" 
                     alt="${group.name}">
                ${group.unreadCount > 0 ? `<span class="unread-badge">${group.unreadCount}</span>` : ''}
            </div>
            
            <div class="group-info">
                <div class="group-header">
                    <h4 class="group-name">${group.name}</h4>
                    <span class="group-time">${this.formatTime(group.lastActivity)}</span>
                </div>
                
                <div class="group-preview">
                    <p class="last-message">${group.lastMessage || 'Nenhuma mensagem'}</p>
                    <span class="members-count">${group.memberCount || 0} membros</span>
                </div>
                
                <div class="group-meta">
                    ${group.isAdmin ? '<span class="admin-badge"><i class="fas fa-crown"></i> Admin</span>' : ''}
                </div>
            </div>
        </div>
    `).join('');
}

    // Métodos de funcionalidade do chat
    switchTab(tab) {
        this.currentTab = tab;
        
        // Atualizar botões de tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        // Mostrar/ocultar listas
        document.getElementById('conversationsList').style.display = 
            tab === 'conversations' ? 'block' : 'none';
        document.getElementById('groupsList').style.display = 
            tab === 'groups' ? 'block' : 'none';
        
        // Ocultar chat ativo se estiver aberto
        document.getElementById('activeChatWindow').style.display = 'none';
    }

    showNewChatModal() {
        const modalHtml = `
            <div class="modal-overlay active" id="newChatModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Nova Conversa</h3>
                        <button class="close-modal" onclick="chatSystem.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="search-contacts">
                            <input type="text" id="searchContact" placeholder="Buscar contatos..." 
                                   onkeyup="chatSystem.searchContacts(this.value)">
                        </div>
                        
                        <div class="contacts-list-modal" id="contactsListModal">
                            <p>Carregando contatos...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.loadContactsForChat();
    }

    async loadContactsForChat() {
        try {
            const userId = localStorage.getItem('userId');
            const contactsRef = collection(db, 'users', userId, 'contacts');
            const q = query(contactsRef, where('blocked', '!=', true));
            const snapshot = await getDocs(q);
            
            const contactsList = document.getElementById('contactsListModal');
            if (!contactsList) return;
            
            if (snapshot.empty) {
                contactsList.innerHTML = '<p>Nenhum contato disponível</p>';
                return;
            }
            
            contactsList.innerHTML = snapshot.docs.map(doc => {
                const contact = doc.data();
                return `
                    <div class="contact-chat-item" onclick="chatSystem.startChatWithContact('${contact.id}')">
                        <img src="${contact.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(contact.name)}" 
                             alt="${contact.name}">
                        <div>
                            <strong>${contact.name}</strong>
                            <p>${contact.nickname || contact.email || ''}</p>
                        </div>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Erro ao carregar contatos:', error);
        }
    }

    async startChatWithContact(contactId) {
        try {
            const userId = localStorage.getItem('userId');
            
            // Verificar se já existe conversa
            const conversationId = [userId, contactId].sort().join('_');
            const conversationRef = doc(db, 'conversations', conversationId);
            
            const conversationDoc = await getDoc(conversationRef);
            
            if (!conversationDoc.exists()) {
                // Criar nova conversa
                const contactDoc = await getDoc(doc(db, 'users', contactId));
                const contactData = contactDoc.exists() ? contactDoc.data() : { displayName: 'Contato' };
                
                await setDoc(conversationRef, {
                    participants: [userId, contactId],
                    type: 'private',
                    createdAt: serverTimestamp(),
                    lastMessageTime: serverTimestamp(),
                    participantNames: {
                        [userId]: this.currentUser.displayName,
                        [contactId]: contactData.displayName
                    }
                });
                
                // Adicionar conversa ao usuário
                await setDoc(doc(db, 'users', userId, 'conversations', conversationId), {
                    id: conversationId,
                    name: contactData.displayName,
                    photoURL: contactData.photoURL || '',
                    type: 'contact',
                    lastMessageTime: serverTimestamp(),
                    unreadCount: 0
                });
                
                // Adicionar conversa ao contato
                await setDoc(doc(db, 'users', contactId, 'conversations', conversationId), {
                    id: conversationId,
                    name: this.currentUser.displayName,
                    photoURL: this.currentUser.photoURL || '',
                    type: 'contact',
                    lastMessageTime: serverTimestamp(),
                    unreadCount: 0
                });
            }
            
            this.closeModal();
            this.openChat(conversationId, 'contact');
            
        } catch (error) {
            console.error('Erro ao iniciar chat:', error);
            this.showMessage('Erro ao iniciar conversa', 'error');
        }
    }

    openChat(conversationId, type) {
        this.activeChat = { id: conversationId, type: type };
        
        // Ocultar lista de conversas
        document.getElementById('conversationsList').style.display = 'none';
        document.getElementById('groupsList').style.display = 'none';
        
        // Mostrar janela de chat
        const chatWindow = document.getElementById('activeChatWindow');
        chatWindow.style.display = 'block';
        chatWindow.innerHTML = `
            <div class="chat-header-bar">
                <button class="back-btn" onclick="chatSystem.closeActiveChat()">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <div class="chat-partner-info">
                    <img src="" alt="" id="chatPartnerAvatar">
                    <div>
                        <h4 id="chatPartnerName">Carregando...</h4>
                        <p id="chatPartnerStatus">Online</p>
                    </div>
                </div>
                <div class="chat-actions">
                    <button class="action-btn" title="Informações">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    <button class="action-btn" title="Mais opções">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
            </div>
            
            <div class="chat-messages" id="chatMessages">
                <div class="loading-messages">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Carregando mensagens...</p>
                </div>
            </div>
            
            <div class="chat-input-area">
                <div class="input-actions">
                    <button class="action-btn" title="Anexar">
                        <i class="fas fa-paperclip"></i>
                    </button>
                    <button class="action-btn" title="Emojis">
                        <i class="far fa-smile"></i>
                    </button>
                </div>
                
                <input type="text" id="messageInput" placeholder="Digite sua mensagem..." 
                       onkeypress="if(event.key === 'Enter') chatSystem.sendMessage()">
                
                <button class="send-btn" onclick="chatSystem.sendMessage()">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        `;
        
        this.loadChatMessages(conversationId);
        this.setupChatWindowEvents();
    }

    async loadChatMessages(conversationId) {
        try {
            const messagesRef = collection(db, 'conversations', conversationId, 'messages');
            const q = query(messagesRef, orderBy('timestamp', 'asc'));
            
            onSnapshot(q, (snapshot) => {
                this.messages = [];
                snapshot.forEach(doc => {
                    this.messages.push({ id: doc.id, ...doc.data() });
                });
                
                this.renderMessages();
            });
            
        } catch (error) {
            console.error('Erro ao carregar mensagens:', error);
        }
    }

    renderMessages() {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;
        
        messagesContainer.innerHTML = this.messages.map(msg => `
            <div class="message-bubble ${msg.senderId === localStorage.getItem('userId') ? 'sent' : 'received'}">
                <div class="message-content">
                    <p>${msg.text}</p>
                    <span class="message-time">${this.formatTime(msg.timestamp?.toDate())}</span>
                </div>
                ${msg.status === 'read' ? '<span class="read-status"><i class="fas fa-check-double"></i></span>' : ''}
            </div>
        `).join('');
        
        // Rolagem automática para a última mensagem
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        
        if (!text || !this.activeChat) return;
        
        try {
            const userId = localStorage.getItem('userId');
            const messageData = {
                text: text,
                senderId: userId,
                senderName: this.currentUser.displayName,
                timestamp: serverTimestamp(),
                status: 'sent'
            };
            
            const messagesRef = collection(db, 'conversations', this.activeChat.id, 'messages');
            await setDoc(doc(messagesRef), messageData);
            
            // Atualizar última mensagem na conversa
            await updateDoc(doc(db, 'conversations', this.activeChat.id), {
                lastMessage: text,
                lastMessageTime: serverTimestamp(),
                lastSenderId: userId
            });
            
            input.value = '';
            
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            this.showMessage('Erro ao enviar mensagem', 'error');
        }
    }

    closeActiveChat() {
        document.getElementById('activeChatWindow').style.display = 'none';
        document.getElementById('conversationsList').style.display = 'block';
        this.activeChat = null;
    }

    formatTime(timestamp) {
        if (!timestamp) return '';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 86400000) { // Menos de 24h
            return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        } else if (diff < 604800000) { // Menos de 7 dias
            return date.toLocaleDateString('pt-BR', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('pt-BR');
        }
    }

    closeModal() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        messageDiv.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'success' ? '#28A745' : type === 'error' ? '#DC3545' : '#17A2B8'};
            color: white;
            padding: 12px 20px;
            border-radius: var(--border-radius);
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.animation = 'slideIn 0.3s ease reverse forwards';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }

    addChatStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .chat-container {
                animation: fadeIn 0.3s ease;
                height: calc(100vh - 140px);
                display: flex;
                flex-direction: column;
            }
            
            .chat-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: var(--spacing-lg);
                flex-wrap: wrap;
                gap: var(--spacing-md);
            }
            
            .chat-header h2 {
                font-size: 1.5rem;
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
            }
            
            .header-actions {
                display: flex;
                gap: var(--spacing-md);
                align-items: center;
            }
            
            .chat-tabs {
                display: flex;
                gap: var(--spacing-sm);
                margin-bottom: var(--spacing-lg);
                border-bottom: 1px solid var(--border-color);
                padding-bottom: var(--spacing-sm);
            }
            
            .conversations-list, .groups-list {
                flex: 1;
                overflow-y: auto;
                padding-right: var(--spacing-sm);
            }
            
            .conversation-item, .group-item {
                display: flex;
                align-items: center;
                gap: var(--spacing-md);
                padding: var(--spacing-md);
                background: var(--surface-color);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                margin-bottom: var(--spacing-sm);
                cursor: pointer;
                transition: var(--transition);
            }
            
            .conversation-item:hover, .group-item:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-sm);
                border-color: var(--primary-color);
            }
            
            .conversation-avatar, .group-avatar {
                position: relative;
                width: 50px;
                height: 50px;
                flex-shrink: 0;
            }
            
            .conversation-avatar img, .group-avatar img {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid var(--border-color);
            }
            
            .unread-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: var(--primary-color);
                color: #000;
                font-size: 0.7rem;
                min-width: 20px;
                height: 20px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            }
            
            .pin-badge {
                position: absolute;
                bottom: -5px;
                right: -5px;
                background: var(--danger-color);
                color: white;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.6rem;
            }
            
            .conversation-info, .group-info {
                flex: 1;
                min-width: 0;
            }
            
            .conversation-header, .group-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 4px;
            }
            
            .conversation-name, .group-name {
                font-size: 1rem;
                font-weight: 600;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .conversation-time, .group-time {
                font-size: 0.75rem;
                color: var(--text-secondary);
                flex-shrink: 0;
            }
            
            .conversation-preview, .group-preview {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 4px;
            }
            
            .last-message {
                font-size: 0.85rem;
                color: var(--text-secondary);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                flex: 1;
            }
            
            .unread-indicator {
                width: 8px;
                height: 8px;
                background: var(--primary-color);
                border-radius: 50%;
                flex-shrink: 0;
            }
            
            .conversation-meta, .group-meta {
                display: flex;
                gap: var(--spacing-sm);
            }
            
            .group-badge, .admin-badge, .mute-badge {
                font-size: 0.7rem;
                padding: 2px 6px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                gap: 3px;
            }
            
            .group-badge {
                background: rgba(66, 133, 244, 0.1);
                color: #4285F4;
            }
            
            .admin-badge {
                background: rgba(255, 215, 0, 0.1);
                color: var(--primary-color);
            }
            
            .mute-badge {
                background: rgba(220, 53, 69, 0.1);
                color: var(--danger-color);
            }
            
            .members-count {
                font-size: 0.75rem;
                color: var(--text-secondary);
                flex-shrink: 0;
            }
            
            /* Janela de Chat Ativa */
            .active-chat-window {
                position: fixed;
                top: 60px;
                left: 0;
                right: 0;
                bottom: 80px;
                background: var(--background-color);
                display: flex;
                flex-direction: column;
                z-index: 100;
                animation: slideIn 0.3s ease;
            }
            
            .chat-header-bar {
                display: flex;
                align-items: center;
                padding: var(--spacing-md);
                background: var(--surface-color);
                border-bottom: 1px solid var(--border-color);
            }
            
            .back-btn {
                background: none;
                border: none;
                font-size: 1.2rem;
                color: var(--text-color);
                cursor: pointer;
                margin-right: var(--spacing-md);
            }
            
            .chat-partner-info {
                display: flex;
                align-items: center;
                gap: var(--spacing-md);
                flex: 1;
            }
            
            .chat-partner-info img {
                width: 40px;
                height: 40px;
                border-radius: 50%;
            }
            
            .chat-partner-info h4 {
                font-size: 1rem;
                margin-bottom: 2px;
            }
            
            .chat-partner-info p {
                font-size: 0.8rem;
                color: var(--text-secondary);
            }
            
            .chat-actions {
                display: flex;
                gap: var(--spacing-sm);
            }
            
            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: var(--spacing-md);
                display: flex;
                flex-direction: column;
                gap: var(--spacing-sm);
            }
            
            .message-bubble {
                max-width: 70%;
                padding: 8px 12px;
                border-radius: 18px;
                position: relative;
                animation: fadeIn 0.3s ease;
            }
            
            .message-bubble.sent {
                background: var(--primary-color);
                color: #000;
                align-self: flex-end;
                border-bottom-right-radius: 4px;
            }
            
            .message-bubble.received {
                background: var(--surface-color);
                color: var(--text-color);
                align-self: flex-start;
                border-bottom-left-radius: 4px;
                border: 1px solid var(--border-color);
            }
            
            .message-content p {
                margin-bottom: 4px;
                word-break: break-word;
            }
            
            .message-time {
                font-size: 0.7rem;
                opacity: 0.7;
                display: block;
                text-align: right;
            }
            
            .read-status {
                position: absolute;
                bottom: 4px;
                right: 8px;
                font-size: 0.7rem;
            }
            
            .chat-input-area {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                padding: var(--spacing-md);
                background: var(--surface-color);
                border-top: 1px solid var(--border-color);
            }
            
            .input-actions {
                display: flex;
                gap: var(--spacing-sm);
            }
            
            .chat-input-area input {
                flex: 1;
                padding: 10px 15px;
                border: 1px solid var(--border-color);
                border-radius: 20px;
                background: var(--background-color);
                color: var(--text-color);
            }
            
            .send-btn {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: var(--primary-color);
                border: none;
                color: #000;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            /* Modal de contatos */
            .contacts-list-modal {
                max-height: 400px;
                overflow-y: auto;
                margin-top: var(--spacing-md);
            }
            
            .contact-chat-item {
                display: flex;
                align-items: center;
                gap: var(--spacing-md);
                padding: var(--spacing-md);
                border-bottom: 1px solid var(--border-color);
                cursor: pointer;
            }
            
            .contact-chat-item:hover {
                background: var(--surface-color);
            }
            
            .contact-chat-item img {
                width: 40px;
                height: 40px;
                border-radius: 50%;
            }
            
            .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: var(--spacing-xl);
                text-align: center;
                color: var(--text-secondary);
            }
            
            .empty-state i {
                font-size: 3rem;
                margin-bottom: var(--spacing-lg);
                color: var(--border-color);
            }
            
            .loading-chats, .loading-groups, .loading-messages {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: var(--spacing-xl);
                color: var(--text-secondary);
            }
            
            @media (max-width: 768px) {
                .active-chat-window {
                    top: 0;
                    bottom: 60px;
                }
                
                .message-bubble {
                    max-width: 85%;
                }
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Inicializar sistema de chat
const chatSystem = new ChatSystem();
window.chatSystem = chatSystem;

// Integração com o app principal
if (typeof app !== 'undefined') {
    app.renderChatPage = async function() {
        await chatSystem.renderChatPage();
    };
}

export default chatSystem;
```
