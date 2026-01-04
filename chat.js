// chat.js - Sistema de Chat CronoZ
class ChatManager {
    constructor() {
        this.currentChat = null;
        this.chats = [];
        this.groups = [];
        this.init();
    }

    async init() {
        if (!window.auth?.currentUser) return;
        
        this.userId = auth.currentUser.uid;
        await this.loadChats();
        await this.loadGroups();
        this.setupEventListeners();
    }

    async loadChats() {
        try {
            const chatsRef = db.collection('chats')
                .where('participants', 'array-contains', this.userId)
                .where('type', '==', 'private')
                .orderBy('lastMessageAt', 'desc');
            
            const snapshot = await chatsRef.get();
            this.chats = [];
            
            snapshot.forEach(doc => {
                this.chats.push({ id: doc.id, ...doc.data() });
            });
            
            this.renderChats();
        } catch (error) {
            console.error('Erro ao carregar chats:', error);
        }
    }

    renderChats() {
        const container = document.getElementById('chats-list');
        if (!container) return;

        if (this.chats.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <h3>Nenhuma conversa</h3>
                    <p>Inicie uma conversa com seus contatos</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.chats.map(chat => `
            <div class="chat-item" data-id="${chat.id}">
                <div class="chat-avatar">
                    ${chat.photoURL ? 
                        `<img src="${chat.photoURL}" alt="${chat.name}">` : 
                        `<div class="avatar-placeholder">${chat.name?.charAt(0) || '?'}</div>`
                    }
                    ${chat.unreadCount > 0 ? `<span class="unread-badge">${chat.unreadCount}</span>` : ''}
                </div>
                <div class="chat-info">
                    <div class="chat-header">
                        <h4 class="chat-name">${chat.name || 'Chat'}</h4>
                        <span class="chat-time">${this.formatTime(chat.lastMessageAt)}</span>
                    </div>
                    <p class="chat-preview">${chat.lastMessage || 'Nenhuma mensagem'}</p>
                </div>
                ${chat.isPinned ? '<i class="fas fa-thumbtack pinned-icon"></i>' : ''}
            </div>
        `).join('');
    }
}
