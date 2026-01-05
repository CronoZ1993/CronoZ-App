// contacts.js - SISTEMA COMPLETO DE CONTATOS
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
    onSnapshot
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

class ContactsSystem {
    constructor() {
        this.currentUser = null;
        this.contacts = [];
        this.filteredContacts = [];
        this.currentView = 'friends';
        this.selectedCategory = 'all';
        this.searchTerm = '';
        this.sortBy = 'name';
        this.sortOrder = 'asc';
    }

    async init() {
        await this.loadCurrentUser();
        this.setupContactsListeners();
    }

    async loadCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
    }

    async renderContactsPage() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="contacts-container">
                <!-- Cabeçalho -->
                <div class="contacts-header">
                    <h2><i class="fas fa-address-book"></i> Contatos</h2>
                    <div class="header-actions">
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input type="text" id="contactsSearch" placeholder="Buscar contatos..." 
                                   onkeyup="contactsSystem.filterContacts()">
                        </div>
                        <button class="btn-primary" id="addContactBtn">
                            <i class="fas fa-user-plus"></i> Novo
                        </button>
                    </div>
                </div>

                <!-- Abas de Navegação -->
                <div class="contacts-tabs">
                    <button class="tab-btn active" data-tab="friends" onclick="contactsSystem.switchTab('friends')">
                        <i class="fas fa-users"></i> Amigos
                    </button>
                    <button class="tab-btn" data-tab="blocked" onclick="contactsSystem.switchTab('blocked')">
                        <i class="fas fa-ban"></i> Bloqueados
                    </button>
                </div>

                <!-- Filtros e Ordenação -->
                <div class="contacts-filters">
                    <div class="filter-group">
                        <label>Categoria:</label>
                        <select id="categoryFilter" onchange="contactsSystem.filterContacts()">
                            <option value="all">Todos</option>
                            <option value="favorite">Favoritos</option>
                            <option value="family">Família</option>
                            <option value="friend">Amigos</option>
                            <option value="work">Trabalho</option>
                            <option value="other">Outros</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Ordenar por:</label>
                        <select id="sortFilter" onchange="contactsSystem.filterContacts()">
                            <option value="name">Nome (A-Z)</option>
                            <option value="name_desc">Nome (Z-A)</option>
                            <option value="birthdate">Data Nascimento</option>
                            <option value="added">Data Adição</option>
                        </select>
                    </div>
                </div>

                <!-- Lista de Contatos -->
                <div class="contacts-list" id="contactsList">
                    <div class="loading-contacts">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Carregando contatos...</p>
                    </div>
                </div>

                <!-- Mensagem Vazia -->
                <div class="empty-state" id="emptyState" style="display: none;">
                    <i class="fas fa-user-slash"></i>
                    <h3>Nenhum contato encontrado</h3>
                    <p>Adicione seu primeiro contato para começar!</p>
                    <button class="btn-primary" onclick="contactsSystem.showAddContactModal()">
                        <i class="fas fa-user-plus"></i> Adicionar Contato
                    </button>
                </div>
            </div>
        `;

        this.setupContactsEvents();
        await this.loadContacts();
        this.addContactsStyles();
    }

    setupContactsListeners() {
        // Escutar mudanças nos contatos em tempo real
        const userId = localStorage.getItem('userId');
        if (userId) {
            const contactsRef = collection(db, 'users', userId, 'contacts');
            
            onSnapshot(contactsRef, (snapshot) => {
                this.contacts = [];
                snapshot.forEach(doc => {
                    this.contacts.push({ id: doc.id, ...doc.data() });
                });
                
                this.filterContacts();
            });
        }
    }

    async loadContacts() {
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) return;

            const contactsRef = collection(db, 'users', userId, 'contacts');
            const q = query(contactsRef, where('blocked', '==', false));
            const snapshot = await getDocs(q);
            
            this.contacts = [];
            snapshot.forEach(doc => {
                this.contacts.push({ id: doc.id, ...doc.data() });
            });
            
            this.filterContacts();
            
        } catch (error) {
            console.error('Erro ao carregar contatos:', error);
        }
    }

    filterContacts() {
        this.searchTerm = document.getElementById('contactsSearch')?.value.toLowerCase() || '';
        this.selectedCategory = document.getElementById('categoryFilter')?.value || 'all';
        this.sortBy = document.getElementById('sortFilter')?.value || 'name';
        
        // Filtrar por aba
        if (this.currentView === 'blocked') {
            this.filteredContacts = this.contacts.filter(contact => contact.blocked === true);
        } else {
            this.filteredContacts = this.contacts.filter(contact => contact.blocked !== true);
        }
        
        // Filtrar por categoria
        if (this.selectedCategory !== 'all') {
            this.filteredContacts = this.filteredContacts.filter(
                contact => contact.category === this.selectedCategory
            );
        }
        
        // Filtrar por busca
        if (this.searchTerm) {
            this.filteredContacts = this.filteredContacts.filter(contact =>
                contact.name.toLowerCase().includes(this.searchTerm) ||
                (contact.nickname && contact.nickname.toLowerCase().includes(this.searchTerm)) ||
                (contact.email && contact.email.toLowerCase().includes(this.searchTerm))
            );
        }
        
        // Ordenar
        this.sortContacts();
        
        // Renderizar lista
        this.renderContactsList();
    }

    sortContacts() {
        this.filteredContacts.sort((a, b) => {
            let valueA, valueB;
            
            switch(this.sortBy) {
                case 'name':
                case 'name_desc':
                    valueA = a.name.toLowerCase();
                    valueB = b.name.toLowerCase();
                    break;
                    
                case 'birthdate':
                    valueA = a.birthDate || '';
                    valueB = b.birthDate || '';
                    break;
                    
                case 'added':
                    valueA = a.createdAt || '';
                    valueB = b.createdAt || '';
                    break;
                    
                default:
                    return 0;
            }
            
            if (this.sortBy === 'name_desc') {
                return valueB.localeCompare(valueA);
            }
            
            return valueA.localeCompare(valueB);
        });
    }

    renderContactsList() {
        const contactsList = document.getElementById('contactsList');
        const emptyState = document.getElementById('emptyState');
        
        if (!contactsList) return;
        
        if (this.filteredContacts.length === 0) {
            contactsList.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        contactsList.style.display = 'block';
        
        contactsList.innerHTML = this.filteredContacts.map(contact => `
            <div class="contact-card" data-id="${contact.id}">
                <div class="contact-avatar">
                    <img src="${contact.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(contact.name)}" 
                         alt="${contact.name}">
                    ${contact.favorite ? '<span class="favorite-badge"><i class="fas fa-star"></i></span>' : ''}
                </div>
                
                <div class="contact-info">
                    <div class="contact-main">
                        <h4 class="contact-name">${contact.name}</h4>
                        ${contact.nickname ? `<p class="contact-nickname">${contact.nickname}</p>` : ''}
                        ${contact.relationship ? `<span class="contact-relationship">${contact.relationship}</span>` : ''}
                    </div>
                    
                    <div class="contact-details">
                        ${contact.birthDate ? `
                            <div class="contact-detail">
                                <i class="fas fa-birthday-cake"></i>
                                <span>${this.formatDate(contact.birthDate)}</span>
                            </div>
                        ` : ''}

                        ${contact.phone ? `
                            <div class="contact-detail">
                                <i class="fas fa-phone"></i>
                                <span>${contact.phone}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="contact-actions">
                    <button class="action-btn" onclick="contactsSystem.editContact('${contact.id}')" 
                            title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    
                    <button class="action-btn" onclick="contactsSystem.toggleFavorite('${contact.id}')" 
                            title="${contact.favorite ? 'Remover favorito' : 'Favoritar'}">
                        <i class="fas ${contact.favorite ? 'fa-star' : 'fa-star'}"></i>
                    </button>
                    
                    <button class="action-btn" onclick="contactsSystem.blockContact('${contact.id}')" 
                            title="Bloquear">
                        <i class="fas fa-ban"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    switchTab(tab) {
        this.currentView = tab;
        
        // Atualizar botões de tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        // Atualizar filtro de categoria se for bloqueados
        const categoryFilter = document.getElementById('categoryFilter');
        if (tab === 'blocked') {
            categoryFilter.disabled = true;
        } else {
            categoryFilter.disabled = false;
        }
        
        this.filterContacts();
    }

    showAddContactModal() {
        const modalHtml = `
            <div class="modal-overlay active" id="addContactModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Adicionar Novo Contato</h3>
                        <button class="close-modal" onclick="contactsSystem.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="form-section">
                            <h4><i class="fas fa-user"></i> Informações Básicas</h4>
                            
                            <div class="form-group">
                                <label>Nome Completo *</label>
                                <input type="text" id="contactName" placeholder="Nome do contato" required>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Apelido</label>
                                    <input type="text" id="contactNickname" placeholder="Como chama?">
                                </div>
                                
                                <div class="form-group">
                                    <label>Parentesco</label>
                                    <input type="text" id="contactRelationship" placeholder="Ex: Amigo, Mãe, Irmão">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Categoria</label>
                                <select id="contactCategory">
                                    <option value="friend">Amigo</option>
                                    <option value="family">Família</option>
                                    <option value="work">Trabalho</option>
                                    <option value="favorite">Favorito</option>
                                    <option value="other">Outro</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h4><i class="fas fa-calendar"></i> Data de Nascimento</h4>
                            <div class="form-group">
                                <input type="date" id="contactBirthDate">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="addToCalendar">
                                    <span>Adicionar aniversário ao meu calendário</span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h4><i class="fas fa-address-card"></i> Contatos</h4>
                            
                            <div class="form-group">
                                <label>Telefone</label>
                                <input type="tel" id="contactPhone" placeholder="(00) 00000-0000">
                            </div>
                            
                            <div class="form-group">
                                <label>E-mail</label>
                                <input type="email" id="contactEmail" placeholder="contato@email.com">
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h4><i class="fas fa-cog"></i> Configurações</h4>
                            
                            <div class="checkbox-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="contactFavorite">
                                    <span>Marcar como favorito</span>
                                </label>
                                
                                <label class="checkbox-label">
                                    <input type="checkbox" id="contactMe">
                                    <span>Este contato sou eu</span>
                                </label>
                                
                                <label class="checkbox-label">
                                    <input type="checkbox" id="addToFamilyTree">
                                    <span>Adicionar à minha árvore genealógica</span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h4><i class="fas fa-eye"></i> Permissões</h4>
                            <p class="section-description">O que este contato pode ver:</p>
                            
                            <div class="permissions-grid">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="permissionCalendar">
                                    <span>Meu calendário</span>
                                </label>
                                
                                <label class="checkbox-label">
                                    <input type="checkbox" id="permissionTree">
                                    <span>Minha árvore genealógica</span>
                                </label>
                                
                                <label class="checkbox-label">
                                    <input type="checkbox" id="permissionAlbums">
                                    <span>Meus álbuns de fotos</span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button class="btn-secondary" onclick="contactsSystem.closeModal()">
                                Cancelar
                            </button>
                            <button class="btn-primary" onclick="contactsSystem.saveContact()">
                                <i class="fas fa-save"></i> Salvar Contato
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    async saveContact() {
        const name = document.getElementById('contactName').value;
        
        if (!name) {
            this.showMessage('Nome é obrigatório', 'error');
            return;
        }

        try {
            const userId = localStorage.getItem('userId');
            const contactId = Date.now().toString(); // ID único
            
            const contactData = {
                id: contactId,
                name: name,
                nickname: document.getElementById('contactNickname').value || '',
                relationship: document.getElementById('contactRelationship').value || '',
                category: document.getElementById('contactCategory').value,
                birthDate: document.getElementById('contactBirthDate').value || '',
                phone: document.getElementById('contactPhone').value || '',
                email: document.getElementById('contactEmail').value || '',
                photoURL: '',
                favorite: document.getElementById('contactFavorite').checked,
                isMe: document.getElementById('contactMe').checked,
                blocked: false,
                permissions: {
                    calendar: document.getElementById('permissionCalendar').checked,
                    tree: document.getElementById('permissionTree').checked,
                    albums: document.getElementById('permissionAlbums').checked
                },
                addedToCalendar: document.getElementById('addToCalendar').checked,
                addedToTree: document.getElementById('addToFamilyTree').checked,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const contactRef = doc(db, 'users', userId, 'contacts', contactId);
            await setDoc(contactRef, contactData);
            
            // Se marcar "este contato sou eu", atualizar perfil do usuário
            if (contactData.isMe) {
                await this.updateUserProfile(contactData);
            }
            
            // Se marcar para adicionar à árvore genealógica
            if (contactData.addedToTree) {
                await this.addToFamilyTree(contactData);
            }
            
            this.showMessage('Contato salvo com sucesso!', 'success');
            this.closeModal();
            
        } catch (error) {
            console.error('Erro ao salvar contato:', error);
            this.showMessage('Erro ao salvar contato', 'error');
        }
    }

    async updateUserProfile(contactData) {
        try {
            const userId = localStorage.getItem('userId');
            const userRef = doc(db, 'users', userId);
            
            await updateDoc(userRef, {
                displayName: contactData.name,
                birthDate: contactData.birthDate,
                phoneNumber: contactData.phone
            });
            
            // Atualizar localmente
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            currentUser.displayName = contactData.name;
            currentUser.birthDate = contactData.birthDate;
            currentUser.phoneNumber = contactData.phone;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
        }
    }

    async addToFamilyTree(contactData) {
        // Implementação será feita no módulo tree.js
        console.log('Adicionando à árvore genealógica:', contactData);
        this.showMessage('Contato será adicionado à árvore genealógica', 'info');
    }

    async editContact(contactId) {
        try {
            const userId = localStorage.getItem('userId');
            const contactRef = doc(db, 'users', userId, 'contacts', contactId);
            const contactDoc = await getDoc(contactRef);
            
            if (!contactDoc.exists()) {
                this.showMessage('Contato não encontrado', 'error');
                return;
            }
            
            const contact = contactDoc.data();
            this.showEditContactModal(contact);
            
        } catch (error) {
            console.error('Erro ao editar contato:', error);
            this.showMessage('Erro ao carregar contato', 'error');
        }
    }

    showEditContactModal(contact) {
        const modalHtml = `
            <div class="modal-overlay active" id="editContactModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Editar Contato</h3>
                        <button class="close-modal" onclick="contactsSystem.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="form-section">
                            <h4><i class="fas fa-user"></i> Informações Básicas</h4>
                            
                            <div class="form-group">
                                <label>Nome Completo *</label>
                                <input type="text" id="editContactName" value="${contact.name}" required>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Apelido</label>
                                    <input type="text" id="editContactNickname" value="${contact.nickname || ''}">
                                </div>
                                
                                <div class="form-group">
                                    <label>Parentesco</label>
                                    <input type="text" id="editContactRelationship" value="${contact.relationship || ''}">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Categoria</label>
                                <select id="editContactCategory">
                                    <option value="friend" ${contact.category === 'friend' ? 'selected' : ''}>Amigo</option>
                                    <option value="family" ${contact.category === 'family' ? 'selected' : ''}>Família</option>
                                    <option value="work" ${contact.category === 'work' ? 'selected' : ''}>Trabalho</option>
                                    <option value="favorite" ${contact.category === 'favorite' ? 'selected' : ''}>Favorito</option>
                                    <option value="other" ${contact.category === 'other' ? 'selected' : ''}>Outro</option>
                                </select>
                            </div>
                        </div>
                        
                        <!-- Outras seções similares à modal de adicionar -->
                        
                        <div class="form-actions">
                            <button class="btn-danger" onclick="contactsSystem.deleteContact('${contact.id}')">
                                <i class="fas fa-trash"></i> Excluir
                            </button>
                            <button class="btn-secondary" onclick="contactsSystem.closeModal()">
                                Cancelar
                            </button>
                            <button class="btn-primary" onclick="contactsSystem.updateContact('${contact.id}')">
                                <i class="fas fa-save"></i> Atualizar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    async updateContact(contactId) {
        // Implementação similar ao saveContact, mas com updateDoc
        this.showMessage('Funcionalidade em desenvolvimento', 'info');
    }

    async deleteContact(contactId) {
        if (!confirm('Tem certeza que deseja excluir este contato? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            const userId = localStorage.getItem('userId');
            const contactRef = doc(db, 'users', userId, 'contacts', contactId);
            await deleteDoc(contactRef);
            
            this.showMessage('Contato excluído com sucesso', 'success');
            this.closeModal();
            
        } catch (error) {
            console.error('Erro ao excluir contato:', error);
            this.showMessage('Erro ao excluir contato', 'error');
        }
    }

    async toggleFavorite(contactId) {
        try {
            const userId = localStorage.getItem('userId');
            const contactRef = doc(db, 'users', userId, 'contacts', contactId);
            const contactDoc = await getDoc(contactRef);
            
            if (contactDoc.exists()) {
                const currentFavorite = contactDoc.data().favorite || false;
                
                await updateDoc(contactRef, {
                    favorite: !currentFavorite,
                    updatedAt: new Date().toISOString()
                });
                
                this.showMessage(
                    !currentFavorite ? 'Contato favoritado!' : 'Contato removido dos favoritos',
                    'success'
                );
            }
            
        } catch (error) {
            console.error('Erro ao favoritar contato:', error);
            this.showMessage('Erro ao atualizar contato', 'error');
        }
    }

    async blockContact(contactId) {
        if (!confirm('Tem certeza que deseja bloquear este contato? Ele não poderá ver suas informações.')) {
            return;
        }

        try {
            const userId = localStorage.getItem('userId');
            const contactRef = doc(db, 'users', userId, 'contacts', contactId);
            
            await updateDoc(contactRef, {
                blocked: true,
                updatedAt: new Date().toISOString()
            });
            
            this.showMessage('Contato bloqueado com sucesso', 'success');
            
        } catch (error) {
            console.error('Erro ao bloquear contato:', error);
            this.showMessage('Erro ao bloquear contato', 'error');
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

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    setupContactsEvents() {
        document.getElementById('addContactBtn')?.addEventListener('click', () => {
            this.showAddContactModal();
        });
    }

    addContactsStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .contacts-container {
                animation: fadeIn 0.3s ease;
            }
            
            .contacts-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: var(--spacing-lg);
                flex-wrap: wrap;
                gap: var(--spacing-md);
            }
            
            .contacts-header h2 {
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
            
            .search-box {
                position: relative;
                min-width: 200px;
            }
            
            .search-box i {
                position: absolute;
                left: 12px;
                top: 50%;
                transform: translateY(-50%);
                color: var(--text-secondary);
            }
            
            .search-box input {
                width: 100%;
                padding: 10px 10px 10px 40px;
                border: 1px solid var(--border-color);
                border-radius: 20px;
                background: var(--surface-color);
                color: var(--text-color);
            }
            
            .contacts-tabs {
                display: flex;
                gap: var(--spacing-sm);
                margin-bottom: var(--spacing-lg);
                border-bottom: 1px solid var(--border-color);
                padding-bottom: var(--spacing-sm);
            }
            
            .tab-btn {
                padding: var(--spacing-sm) var(--spacing-lg);
                border: none;
                background: transparent;
                color: var(--text-secondary);
                cursor: pointer;
                border-radius: var(--border-radius) var(--border-radius) 0 0;
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                transition: var(--transition);
            }

            .tab-btn:hover {
                background: var(--border-color);
            }
            
            .tab-btn.active {
                background: var(--primary-color);
                color: #000;
                font-weight: 600;
            }
            
            .contacts-filters {
                display: flex;
                gap: var(--spacing-lg);
                margin-bottom: var(--spacing-lg);
                flex-wrap: wrap;
            }
            
            .filter-group {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
            }
            
            .filter-group label {
                font-weight: 500;
            }
            
            .filter-group select {
                padding: 8px 12px;
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                background: var(--surface-color);
                color: var(--text-color);
            }
            
            .contacts-list {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-md);
            }
            
            .loading-contacts {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: var(--spacing-xl);
                color: var(--text-secondary);
            }
            
            .loading-contacts i {
                font-size: 2rem;
                margin-bottom: var(--spacing-md);
            }
            
            .contact-card {
                display: flex;
                align-items: center;
                gap: var(--spacing-lg);
                padding: var(--spacing-lg);
                background: var(--surface-color);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                transition: var(--transition);
                cursor: pointer;
            }
            
            .contact-card:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-md);
                border-color: var(--primary-color);
            }
            
            .contact-avatar {
                position: relative;
                width: 60px;
                height: 60px;
                flex-shrink: 0;
            }
            
            .contact-avatar img {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid var(--border-color);
            }
            
            .favorite-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: var(--primary-color);
                color: #000;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8rem;
            }
            
            .contact-info {
                flex: 1;
                min-width: 0;
            }
            
            .contact-main {
                margin-bottom: var(--spacing-sm);
            }
            
            .contact-name {
                font-size: 1.1rem;
                font-weight: 600;
                margin-bottom: 4px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .contact-nickname {
                color: var(--text-secondary);
                font-size: 0.9rem;
                margin-bottom: 4px;
            }
            
            .contact-relationship {
                display: inline-block;
                background: rgba(255, 215, 0, 0.1);
                color: var(--primary-color);
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: 500;
            }
            
            .contact-details {
                display: flex;
                gap: var(--spacing-md);
                flex-wrap: wrap;
            }
            
            .contact-detail {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 0.85rem;
                color: var(--text-secondary);
            }
            
            .contact-actions {
                display: flex;
                gap: var(--spacing-sm);
            }
            
            .action-btn {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border: 1px solid var(--border-color);
                background: var(--surface-color);
                color: var(--text-color);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: var(--transition);
            }
            
            .action-btn:hover {
                background: var(--border-color);
                transform: scale(1.1);
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
            
            .empty-state h3 {
                margin-bottom: var(--spacing-sm);
                color: var(--text-color);
            }
            
            .form-section {
                margin-bottom: var(--spacing-xl);
                padding-bottom: var(--spacing-lg);
                border-bottom: 1px solid var(--border-color);
            }
            
            .form-section h4 {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                margin-bottom: var(--spacing-lg);
                color: var(--primary-color);
            }
            
            .form-row {
                display: flex;
                gap: var(--spacing-md);
            }
            
            .form-row .form-group {
                flex: 1;
            }
            
            .checkbox-label {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                cursor: pointer;
                margin-bottom: var(--spacing-sm);
            }
            
            .checkbox-label input {
                width: auto;
            }
            
            .checkbox-group {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-sm);
            }
            
            .section-description {
                color: var(--text-secondary);
                margin-bottom: var(--spacing-md);
                font-size: 0.9rem;
            }
            
            .permissions-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: var(--spacing-sm);
            }
            
            .btn-danger {
                background: var(--danger-color);
                color: white;
                border: none;
                padding: var(--spacing-md) var(--spacing-lg);
                border-radius: var(--border-radius);
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                transition: var(--transition);
            }
            
            .btn-danger:hover {
                opacity: 0.9;
            }
            
            @media (max-width: 768px) {
                .contacts-header {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .header-actions {
                    flex-direction: column;
                }
                
                .search-box {
                    min-width: 100%;
                }
                
                .contacts-filters {
                    flex-direction: column;
                    gap: var(--spacing-md);
                }
                
                .filter-group {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .contact-card {
                    flex-direction: column;
                    text-align: center;
                }
                
                .contact-details {
                    justify-content: center;
                }
                
                .contact-actions {
                    width: 100%;
                    justify-content: center;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Inicializar sistema de contatos
const contactsSystem = new ContactsSystem();
window.contactsSystem = contactsSystem;

// Integração com o app principal
if (typeof app !== 'undefined') {
    // Substituir a função renderContactsPage do app
    app.renderContactsPage = async function() {
        await contactsSystem.renderContactsPage();
    };
}

export default contactsSystem;
```
