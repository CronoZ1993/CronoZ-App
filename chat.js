// chat.js - Sistema de chat em tempo real
import { auth, db } from './firebase-config.js';
import { 
    collection, doc, setDoc, getDoc, updateDoc, 
    deleteDoc, query, where, orderBy, onSnapshot,
    serverTimestamp 
} from './firebase-config.js';
import { showLoading, hideLoading, showToast, getRelativeTime } from './utils.js';

class ChatSystem {
    constructor() {
        this.currentUserId = null;
        this.currentChatId = null;
        this.conversations = [];
        this.messages = [];
        this.init();
    }
    
    async init() {
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.currentUserId = user.uid;
                this.loadConversations();
                this.setupEventListeners();
            }
        });
    }
    
    setupEventListeners() {
        // New chat button
        const newChatBtn = document.getElementById('btn-new-chat');
        if (newChatBtn) {
            newChatBtn.addEventListener('click', () => this.openNewChatModal());
        }
        
        // Chat tabs
        document.querySelectorAll('.chat-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabType = e.currentTarget.dataset.tab;
                this.switchChatTab(tabType);
            });
        });
        
        // Send message
        const sendBtn = document.querySelector('.btn-send');
        const messageInput = document.querySelector('.chat-input input');
        
        if (sendBtn && messageInput) {
            sendBtn.addEventListener('click', () => this.sendMessage());
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
        
        // Listen for start chat events
        document.addEventListener('startChat', (e) => {
            const { contactId, contactName } = e.detail;
            this.startNewChat(contactId, contactName);
        });
    }
    
    switchChatTab(tabType) {
        document.querySelectorAll('.chat-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.tab === tabType) {
                tab.classList.add('active');
            }
        });
        
        // Update UI based on tab
        // Implement tab switching logic here
    }
    
    async loadConversations() {
        if (!this.currentUserId) return;
        
        const conversationsRef = collection(db, 'users', this.currentUserId, 'conversations');
        const q = query(conversationsRef, orderBy('lastMessageAt', 'desc'));
        
        onSnapshot(q, (snapshot) => {
            this.conversations = [];
            snapshot.forEach(doc => {
                this.conversations.push({ id: doc.id, ...doc.data() });
            });
            this.renderConversations();
        });
    }
    
    renderConversations() {
        const container = document.getElementById('conversations-list');
        if (!container) return;
        
        if (this.conversations.length === 0) {
            container.innerHTML = `
                <div class="empty-conversations">
                    <i class="fas fa-comments fa-2x"></i>
                    <p>Nenhuma conversa</p>
                    <button class="btn-small" id="btn-start-first-chat">
                        Iniciar conversa
                    </button>
                </div>
            `;
            
            document.getElementById('btn-start-first-chat')?.addEventListener('click', () => {
                this.openNewChatModal();
            });
            return;
        }
        
        container.innerHTML = this.conversations.map(conv => `
            <div class="conversation-item ${conv.id === this.currentChatId ? 'active' : ''}" 
                 data-chat-id="${conv.id}">
                <img src="${conv.avatar || 'assets/default-avatar.png'}" 
                     alt="${conv.name}" 
                     class="conversation-avatar">
                <div class="conversation-info">
                    <div class="conversation-name">${conv.name}</div>
                    <div class="conversation-preview">${conv.lastMessage || ''}</div>
                </div>
                <div class="conversation-time">
                    ${conv.lastMessageAt ? getRelativeTime(conv.lastMessageAt) : ''}
                </div>
            </div>
        `).join('');
        
        // Add click events
        container.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', () => {
                const chatId = item.dataset.chatId;
                this.openChat(chatId);
            });
        });
    }

async openChat(chatId) {
    this.currentChatId = chatId;
    const conversation = this.conversations.find(c => c.id === chatId);
    
    if (!conversation) return;
    
    // Update UI
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.chatId === chatId) {
            item.classList.add('active');
        }
    });
    
    // Show chat window
    const chatWindow = document.getElementById('chat-window');
    const chatEmpty = document.querySelector('.chat-empty');
    
    if (chatWindow) chatWindow.style.display = 'flex';
    if (chatEmpty) chatEmpty.style.display = 'none';
    
    // Update chat header
    const headerImg = chatWindow?.querySelector('.chat-user-info img');
    const headerName = chatWindow?.querySelector('.chat-user-info h3');
    
    if (headerImg) headerImg.src = conversation.avatar || 'assets/default-avatar.png';
    if (headerName) headerName.textContent = conversation.name;
    
    // Load messages
    await this.loadMessages(chatId);
}

async loadMessages(chatId) {
    if (!this.currentUserId || !chatId) return;
    
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    onSnapshot(q, (snapshot) => {
        this.messages = [];
        snapshot.forEach(doc => {
            this.messages.push({ id: doc.id, ...doc.data() });
        });
        this.renderMessages();
    });
}

renderMessages() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    
    container.innerHTML = this.messages.map(msg => {
        const isCurrentUser = msg.senderId === this.currentUserId;
        const time = msg.timestamp ? getRelativeTime(msg.timestamp.toDate()) : '';
        
        return `
            <div class="message ${isCurrentUser ? 'sent' : 'received'}">
                <div class="message-content">${msg.content}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
    }).join('');
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

async sendMessage() {
    const input = document.querySelector('.chat-input input');
    if (!input || !input.value.trim() || !this.currentChatId || !this.currentUserId) return;
    
    const content = input.value.trim();
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
        const messageData = {
            content,
            senderId: this.currentUserId,
            timestamp: serverTimestamp(),
            type: 'text',
            read: false
        };
        
        const messageRef = doc(db, 'chats', this.currentChatId, 'messages', messageId);
        await setDoc(messageRef, messageData);
        
        // Update conversation last message
        await this.updateConversationLastMessage(this.currentChatId, content);
        
        input.value = '';
        
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        showToast('Erro ao enviar mensagem', 'error');
    }
}

async updateConversationLastMessage(chatId, lastMessage) {
    if (!this.currentUserId) return;
    
    try {
        const convRef = doc(db, 'users', this.currentUserId, 'conversations', chatId);
        await updateDoc(convRef, {
            lastMessage,
            lastMessageAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Erro ao atualizar conversa:', error);
    }
}

openNewChatModal() {
    const modalContent = `
        <div class="new-chat-modal">
            <div class="modal-form-group">
                <label>Selecionar Contato</label>
                <div class="contacts-select" id="contacts-select-list">
                    <!-- Contacts will be loaded here -->
                    <p>Carregando contatos...</p>
                </div>
            </div>
            
            <div class="modal-form-group">
                <label>Ou digite o ID do usuário</label>
                <input type="text" id="new-chat-userid" placeholder="ID do usuário">
            </div>
            
            <div class="modal-actions">
                <button type="button" class="btn-secondary close-modal">Cancelar</button>
                <button type="button" class="btn-primary" id="btn-start-chat">
                    Iniciar Conversa
                </button>
            </div>
        </div>
    `;
    
    this.showModal('Nova Conversa', modalContent);
    this.loadContactsForChat();
    
    document.getElementById('btn-start-chat')?.addEventListener('click', () => {
        this.startChatFromModal();
    });
}

async loadContactsForChat() {
    const container = document.getElementById('contacts-select-list');
    if (!container) return;
    
    // Load contacts from contacts system
    if (window.contactsSystem?.contacts) {
        const contacts = window.contactsSystem.contacts;
        
        if (contacts.length === 0) {
            container.innerHTML = '<p>Nenhum contato disponível</p>';
            return;
        }
        
        container.innerHTML = contacts.map(contact => `
            <div class="contact-select-item" data-contact-id="${contact.id}">
                <img src="${contact.photoURL || 'assets/default-avatar.png'}" 
                     alt="${contact.name}"
                     class="contact-select-avatar">
                <div class="contact-select-info">
                    <div class="contact-select-name">${contact.name}</div>
                    <div class="contact-select-email">${contact.email || ''}</div>
                </div>
                <input type="radio" name="selected-contact" 
                       value="${contact.id}" id="contact-${contact.id}">
            </div>
        `).join('');
        
        // Add selection events
        container.querySelectorAll('.contact-select-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.type !== 'radio') {
                    const radio = item.querySelector('input[type="radio"]');
                    if (radio) radio.checked = true;
                    
                    // Update UI
                    container.querySelectorAll('.contact-select-item').forEach(i => {
                        i.classList.remove('selected');
                    });
                    item.classList.add('selected');
                }
            });
        });
    } else {
        container.innerHTML = '<p>Carregue seus contatos primeiro</p>';
    }
}

async startChatFromModal() {
    // Get selected contact
    const selectedContact = document.querySelector('input[name="selected-contact"]:checked');
    const userIdInput = document.getElementById('new-chat-userid')?.value.trim();
    
    if (!selectedContact && !userIdInput) {
        showToast('Selecione um contato ou digite um ID', 'warning');
        return;
    }
    
    showLoading('Iniciando conversa...');
    
    try {
        let contactId, contactName;
        
        if (selectedContact) {
            contactId = selectedContact.value;
            // Get contact name from contacts system
            const contact = window.contactsSystem?.contacts?.find(c => c.id === contactId);
            contactName = contact?.name || 'Contato';
        } else {
            // Search user by ID
            contactId = userIdInput;
            contactName = await this.getUserNameById(userIdInput);
            if (!contactName) {
                hideLoading();
                showToast('Usuário não encontrado', 'error');
                return;
            }
        }
        
        await this.startNewChat(contactId, contactName);
        this.closeModal();
        
    } catch (error) {
        console.error('Erro ao iniciar chat:', error);
        showToast('Erro ao iniciar conversa', 'error');
    } finally {
        hideLoading();
    }
}

async getUserNameById(userId) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            return userSnap.data().displayName || 'Usuário';
        }
        return null;
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        return null;
    }
}

async startNewChat(contactId, contactName) {
    if (!this.currentUserId) return;
    
    // Generate chat ID (sorted IDs to ensure uniqueness)
    const chatId = [this.currentUserId, contactId].sort().join('_');
    
    // Check if chat already exists
    const existingConv = this.conversations.find(c => c.id === chatId);
    if (existingConv) {
        this.openChat(chatId);
        return;
    }
    
    try {
        // Create chat document
        const chatData = {
            participants: [this.currentUserId, contactId],
            createdAt: serverTimestamp(),
            lastMessage: '',
            lastMessageAt: serverTimestamp()
        };
        
        const chatRef = doc(db, 'chats', chatId);
        await setDoc(chatRef, chatData);
        
        // Create conversation for current user
        const userConvRef = doc(db, 'users', this.currentUserId, 'conversations', chatId);
        await setDoc(userConvRef, {
            chatId,
            name: contactName,
            avatar: 'assets/default-avatar.png',
            lastMessage: '',
            lastMessageAt: serverTimestamp(),
            unreadCount: 0,
            isGroup: false
        });
        
        // Create conversation for other user (if exists in our system)
        const otherConvRef = doc(db, 'users', contactId, 'conversations', chatId);
        await setDoc(otherConvRef, {
            chatId,
            name: auth.currentUser?.displayName || 'Usuário CronoZ',
            avatar: auth.currentUser?.photoURL || 'assets/default-avatar.png',
            lastMessage: '',
            lastMessageAt: serverTimestamp(),
            unreadCount: 0,
            isGroup: false
        }).catch(() => {
            // Other user might not exist in our system yet
            console.log('Outro usuário não encontrado no sistema');
        });
        
        // Open the new chat
        this.openChat(chatId);
        showToast(`Conversa com ${contactName} iniciada`, 'success');
        
    } catch (error) {
        console.error('Erro ao criar chat:', error);
        showToast('Erro ao iniciar conversa', 'error');
    }
}

// Group chat methods
async createGroupChat(groupName, participants) {
    if (!this.currentUserId || !groupName || !participants?.length) return;
    
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
        const groupData = {
            name: groupName,
            creatorId: this.currentUserId,
            participants: [...participants, this.currentUserId],
            createdAt: serverTimestamp(),
            isGroup: true,
            avatar: 'assets/default-group-avatar.png'
        };
        
        const groupRef = doc(db, 'groups', groupId);
        await setDoc(groupRef, groupData);
        
        // Create conversation for each participant
        for (const userId of groupData.participants) {
            const convRef = doc(db, 'users', userId, 'conversations', groupId);
            await setDoc(convRef, {
                chatId: groupId,
                name: groupName,
                avatar: groupData.avatar,
                lastMessage: '',
                lastMessageAt: serverTimestamp(),
                unreadCount: 0,
                isGroup: true,
                participants: groupData.participants
            }).catch(() => {
                console.log(`Usuário ${userId} não encontrado`);
            });
        }
        
        showToast(`Grupo "${groupName}" criado com sucesso!`, 'success');
        return groupId;
        
    } catch (error) {
        console.error('Erro ao criar grupo:', error);
        showToast('Erro ao criar grupo', 'error');
        return null;
    }
}

openCreateGroupModal() {
    const modalContent = `
        <form class="modal-form" id="create-group-form">
            <div class="modal-form-group">
                <label for="group-name">Nome do Grupo *</label>
                <input type="text" id="group-name" required placeholder="Nome do grupo">
            </div>
            
            <div class="modal-form-group">
                <label>Selecionar Participantes</label>
                <div class="group-participants-select" id="group-participants-list">
                    <!-- Contacts will be loaded here -->
                    <p>Carregando contatos...</p>
                </div>
            </div>
            
            <div class="modal-form-group">
                <label for="group-avatar">Foto do Grupo (opcional)</label>
                <input type="file" id="group-avatar" accept="image/*">
            </div>
            
            <div class="modal-actions">
                <button type="button" class="btn-secondary close-modal">Cancelar</button>
                <button type="submit" class="btn-primary">Criar Grupo</button>
            </div>
        </form>
    `;
    
    this.showModal('Criar Grupo', modalContent);
    this.loadContactsForGroup();
    
    document.getElementById('create-group-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.createGroupFromModal();
    });
}

    async loadContactsForGroup() {
        const container = document.getElementById('group-participants-list');
        if (!container) return;
        
        if (window.contactsSystem?.contacts) {
            const contacts = window.contactsSystem.contacts;
            
            container.innerHTML = contacts.map(contact => `
                <div class="group-participant-item" data-contact-id="${contact.id}">
                    <input type="checkbox" id="group-contact-${contact.id}" 
                           value="${contact.id}" class="group-contact-checkbox">
                    <label for="group-contact-${contact.id}" class="group-contact-label">
                        <img src="${contact.photoURL || 'assets/default-avatar.png'}" 
                             alt="${contact.name}"
                             class="group-contact-avatar">
                        <div class="group-contact-info">
                            <div class="group-contact-name">${contact.name}</div>
                            <div class="group-contact-email">${contact.email || ''}</div>
                        </div>
                    </label>
                </div>
            `).join('');
        }
    }
    
    async createGroupFromModal() {
        const groupName = document.getElementById('group-name')?.value.trim();
        const checkboxes = document.querySelectorAll('.group-contact-checkbox:checked');
        
        if (!groupName) {
            showToast('Digite um nome para o grupo', 'warning');
            return;
        }
        
        if (checkboxes.length === 0) {
            showToast('Selecione pelo menos um participante', 'warning');
            return;
        }
        
        const participants = Array.from(checkboxes).map(cb => cb.value);
        
        showLoading('Criando grupo...');
        try {
            const groupId = await this.createGroupChat(groupName, participants);
            
            if (groupId) {
                this.closeModal();
                this.openChat(groupId);
            }
        } catch (error) {
            console.error('Erro ao criar grupo:', error);
            showToast('Erro ao criar grupo', 'error');
        } finally {
            hideLoading();
        }
    }
    
    // Utility methods
    showModal(title, content) {
        const modal = document.getElementById('modal-contact') || 
                      document.createElement('div');
        
        if (!modal.id) {
            modal.id = 'chat-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">${content}</div>
            `;
            document.body.appendChild(modal);
        } else {
            const modalHeader = modal.querySelector('.modal-header h2');
            const modalBody = modal.querySelector('.modal-body');
            
            if (modalHeader) modalHeader.textContent = title;
            if (modalBody) modalBody.innerHTML = content;
        }
        
        modal.classList.add('active');
        document.getElementById('modal-overlay').classList.add('active');
        
        // Close buttons
        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });
    }
    
    closeModal() {
        const modals = document.querySelectorAll('.modal');
        const overlay = document.getElementById('modal-overlay');
        
        modals.forEach(modal => modal.classList.remove('active'));
        if (overlay) overlay.classList.remove('active');
    }
    
    // Mark messages as read
    async markMessagesAsRead(chatId) {
        if (!this.currentUserId || !chatId) return;
        
        try {
            const messagesRef = collection(db, 'chats', chatId, 'messages');
            const q = query(messagesRef, where('read', '==', false), 
                          where('senderId', '!=', this.currentUserId));
            
            const querySnapshot = await getDocs(q);
            
            const updatePromises = [];
            querySnapshot.forEach(doc => {
                updatePromises.push(updateDoc(doc.ref, { read: true }));
            });
            
            await Promise.all(updatePromises);
            
        } catch (error) {
            console.error('Erro ao marcar mensagens como lidas:', error);
        }
    }
    
    // Delete conversation
    async deleteConversation(chatId) {
        if (!this.currentUserId || !chatId) return;
        
        if (!confirm('Tem certeza que deseja excluir esta conversa?')) return;
        
        try {
            const convRef = doc(db, 'users', this.currentUserId, 'conversations', chatId);
            await deleteDoc(convRef);
            
            showToast('Conversa excluída', 'success');
            
        } catch (error) {
            console.error('Erro ao excluir conversa:', error);
            showToast('Erro ao excluir conversa', 'error');
        }
    }
}

// Initialize chat system
document.addEventListener('DOMContentLoaded', () => {
    const chatSystem = new ChatSystem();
    window.chatSystem = chatSystem;
    
    console.log('Sistema de chat inicializado!');
});

export default ChatSystem;