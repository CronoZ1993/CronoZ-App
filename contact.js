// contacts.js - Sistema completo de contatos
import { auth, db } from './firebase-config.js';
import { 
    collection, doc, setDoc, getDoc, updateDoc, 
    deleteDoc, query, where, orderBy, onSnapshot 
} from './firebase-config.js';
import { showLoading, hideLoading, showToast, formatDate } from './utils.js';

class ContactsSystem {
    constructor() {
        this.contacts = [];
        this.filteredContacts = [];
        this.currentFilter = 'all';
        this.currentUserId = null;
        this.init();
    }
    
    async init() {
        // Esperar autenticação
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUserId = user.uid;
                await this.loadContacts();
                this.setupEventListeners();
                this.renderContacts();
            }
        });
    }
    
    setupEventListeners() {
        // Botão adicionar contato
        const addBtn = document.getElementById('btn-add-contact');
        const emptyAddBtn = document.getElementById('btn-empty-add-contact');
        
        if (addBtn) addBtn.addEventListener('click', () => this.openAddContactModal());
        if (emptyAddBtn) emptyAddBtn.addEventListener('click', () => this.openAddContactModal());
        
        // Botão importar contatos
        const importBtn = document.getElementById('btn-import-contacts');
        if (importBtn) importBtn.addEventListener('click', () => this.importContacts());
        
        // Filtros
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                this.setFilter(filter);
            });
        });
        
        // Busca
        const searchInput = document.getElementById('contact-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchContacts(e.target.value);
            });
        }
    }
    
    async loadContacts() {
        if (!this.currentUserId) return;
        
        showLoading('Carregando contatos...');
        try {
            const contactsRef = collection(db, 'users', this.currentUserId, 'contacts');
            const q = query(contactsRef, orderBy('name'));
            
            onSnapshot(q, (snapshot) => {
                this.contacts = [];
                snapshot.forEach(doc => {
                    const contact = { id: doc.id, ...doc.data() };
                    this.contacts.push(contact);
                });
                
                this.filteredContacts = [...this.contacts];
                this.renderContacts();
                hideLoading();
            }, (error) => {
                console.error('Erro ao carregar contatos:', error);
                showToast('Erro ao carregar contatos', 'error');
                hideLoading();
            });
            
        } catch (error) {
            console.error('Erro ao carregar contatos:', error);
            showToast('Erro ao carregar contatos', 'error');
            hideLoading();
        }
    }
    
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Atualizar UI dos filtros
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.filter === filter) {
                tab.classList.add('active');
            }
        });
        
        // Aplicar filtro
        this.applyFilter();
    }
    
    applyFilter() {
        switch (this.currentFilter) {
            case 'all':
                this.filteredContacts = [...this.contacts];
                break;
            case 'favorites':
                this.filteredContacts = this.contacts.filter(c => c.isFavorite);
                break;
            case 'family':
                this.filteredContacts = this.contacts.filter(c => c.type === 'family');
                break;
            case 'work':
                this.filteredContacts = this.contacts.filter(c => c.type === 'work');
                break;
            case 'friends':
                this.filteredContacts = this.contacts.filter(c => c.type === 'friends');
                break;
            default:
                this.filteredContacts = [...this.contacts];
        }
        
        this.renderContacts();
    }
    
    searchContacts(query) {
        if (!query.trim()) {
            this.applyFilter();
            return;
        }
        
        const searchTerm = query.toLowerCase();
        this.filteredContacts = this.contacts.filter(contact => {
            return (
                contact.name.toLowerCase().includes(searchTerm) ||
                (contact.email && contact.email.toLowerCase().includes(searchTerm)) ||
                (contact.phone && contact.phone.toLowerCase().includes(searchTerm))
            );
        });
        
        this.renderContacts();
    }
    
    renderContacts() {
        const container = document.getElementById('contacts-list');
        if (!container) return;
        
        if (this.filteredContacts.length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
            
            // Re-add event listener
            const emptyAddBtn = document.getElementById('btn-empty-add-contact');
            if (emptyAddBtn) {
                emptyAddBtn.addEventListener('click', () => this.openAddContactModal());
            }
            return;
        }
        
        container.innerHTML = this.filteredContacts.map(contact => 
            this.getContactHTML(contact)
        ).join('');
        
        // Add event listeners to all contact items
        this.setupContactEventListeners();
    }
    
    getEmptyStateHTML() {
        return `
            <div class="empty-state">
                <i class="fas fa-address-book fa-3x"></i>
                <p>${this.currentFilter === 'all' ? 'Nenhum contato adicionado' : 'Nenhum contato nesta categoria'}</p>
                <button class="btn-primary" id="btn-empty-add-contact">
                    <i class="fas fa-user-plus"></i> 
                    ${this.currentFilter === 'all' ? 'Adicionar Primeiro Contato' : 'Adicionar Contato'}
                </button>
            </div>
        `;
    }
    
    getContactHTML(contact) {
        const birthdayText = contact.birthday ? 
            formatDate(contact.birthday, 'dd/mm/yyyy') : 'Não informado';
        
        const typeLabels = {
            'family': 'Família',
            'work': 'Trabalho', 
            'friends': 'Amigo',
            'other': 'Outro'
        };
        
        return `
            <div class="contact-item" data-id="${contact.id}">
                <img src="${contact.photoURL || 'assets/default-avatar.png'}" 
                     alt="${contact.name}" 
                     class="contact-avatar"
                     onerror="this.src='assets/default-avatar.png'">
                <div class="contact-info">
                    <div class="contact-name">
                        ${contact.name}
                        ${contact.isFavorite ? 
                            '<span class="badge" style="background: var(--warning); color: #000;">★</span>' : ''}
                        <span class="badge" style="background: var(--primary-color); color: white;">
                            ${typeLabels[contact.type] || contact.type}
                        </span>
                    </div>
                    <div class="contact-details">
                        ${contact.phone ? `<span><i class="fas fa-phone"></i> ${contact.phone}</span>` : ''}
                        ${contact.email ? `<span><i class="fas fa-envelope"></i> ${contact.email}</span>` : ''}
                        <span><i class="fas fa-birthday-cake"></i> ${birthdayText}</span>
                    </div>
                </div>
                <div class="contact-actions">
                    <button class="contact-action-btn btn-favorite" 
                            title="${contact.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}">
                        <i class="fas ${contact.isFavorite ? 'fa-star' : 'fa-star'}"></i>
                    </button>
                    <button class="contact-action-btn btn-edit" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="contact-action-btn btn-chat" title="Chat">
                        <i class="fas fa-comment"></i>
                    </button>
                </div>
            </div>
        `;
    }

setupContactEventListeners() {
    // Favorite buttons
    document.querySelectorAll('.btn-favorite').forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const contact = this.filteredContacts[index];
            this.toggleFavorite(contact.id, !contact.isFavorite);
        });
    });
    
    // Edit buttons
    document.querySelectorAll('.btn-edit').forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const contact = this.filteredContacts[index];
            this.openEditContactModal(contact);
        });
    });
    
    // Chat buttons
    document.querySelectorAll('.btn-chat').forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const contact = this.filteredContacts[index];
            this.startChatWithContact(contact);
        });
    });
    
    // Click on contact item
    document.querySelectorAll('.contact-item').forEach((item, index) => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.contact-actions')) {
                const contact = this.filteredContacts[index];
                this.openContactDetails(contact);
            }
        });
    });
}

async toggleFavorite(contactId, isFavorite) {
    if (!this.currentUserId) return;
    
    try {
        const contactRef = doc(db, 'users', this.currentUserId, 'contacts', contactId);
        await updateDoc(contactRef, { isFavorite });
        
        showToast(
            isFavorite ? 'Contato favoritado!' : 'Contato removido dos favoritos',
            'success'
        );
    } catch (error) {
        console.error('Erro ao favoritar contato:', error);
        showToast('Erro ao atualizar contato', 'error');
    }
}

startChatWithContact(contact) {
    // Navegar para chat
    if (window.app && window.app.navigation) {
        window.app.navigation.navigateTo('chat');
    }
    
    // Disparar evento para iniciar chat
    setTimeout(() => {
        const event = new CustomEvent('startChat', { 
            detail: { contactId: contact.id, contactName: contact.name } 
        });
        document.dispatchEvent(event);
    }, 500);
}

openContactDetails(contact) {
    const modalContent = `
        <div class="contact-details-modal">
            <div class="contact-header">
                <img src="${contact.photoURL || 'assets/default-avatar.png'}" 
                     alt="${contact.name}" 
                     class="contact-detail-avatar"
                     onerror="this.src='assets/default-avatar.png'">
                <div class="contact-detail-info">
                    <h3>${contact.name}</h3>
                    <p class="contact-type">${this.getTypeLabel(contact.type)}</p>
                    ${contact.isFavorite ? '<span class="favorite-badge">★ Favorito</span>' : ''}
                </div>
            </div>
            
            <div class="contact-detail-sections">
                <div class="detail-section">
                    <h4><i class="fas fa-info-circle"></i> Informações</h4>
                    ${contact.email ? `<p><strong>Email:</strong> ${contact.email}</p>` : ''}
                    ${contact.phone ? `<p><strong>Telefone:</strong> ${contact.phone}</p>` : ''}
                    ${contact.birthday ? `<p><strong>Aniversário:</strong> ${formatDate(contact.birthday, 'dd/mm/yyyy')}</p>` : ''}
                    ${contact.notes ? `<p><strong>Observações:</strong><br>${contact.notes}</p>` : ''}
                </div>
                
                <div class="detail-section">
                    <h4><i class="fas fa-shield-alt"></i> Permissões</h4>
                    <p><strong>Pode ver meu calendário:</strong> ${contact.canSeeCalendar ? 'Sim' : 'Não'}</p>
                    <p><strong>Pode ver minha árvore:</strong> ${contact.canSeeTree ? 'Sim' : 'Não'}</p>
                    <p><strong>Pode ver meus álbuns:</strong> ${contact.canSeeAlbums ? 'Sim' : 'Não'}</p>
                </div>
            </div>
            
            <div class="modal-actions">
                <button type="button" class="btn-secondary close-modal">Fechar</button>
                <button type="button" class="btn-primary" id="btn-edit-from-details">
                    <i class="fas fa-edit"></i> Editar Contato
                </button>
            </div>
        </div>
    `;
    
    this.showModal(`Detalhes: ${contact.name}`, modalContent);
    
    // Edit button in details
    document.getElementById('btn-edit-from-details')?.addEventListener('click', () => {
        this.closeModal();
        this.openEditContactModal(contact);
    });
}

getTypeLabel(type) {
    const labels = {
        'family': 'Família',
        'work': 'Trabalho',
        'friends': 'Amigo',
        'other': 'Outro'
    };
    return labels[type] || type;
}

openAddContactModal() {
    const modalContent = `
        <form class="modal-form" id="add-contact-form">
            <div class="modal-form-group">
                <label for="contact-name">Nome Completo *</label>
                <input type="text" id="contact-name" required placeholder="Digite o nome">
            </div>
            
            <div class="modal-form-row">
                <div class="modal-form-group">
                    <label for="contact-email">Email</label>
                    <input type="email" id="contact-email" placeholder="email@exemplo.com">
                </div>
                
                <div class="modal-form-group">
                    <label for="contact-phone">Telefone</label>
                    <input type="tel" id="contact-phone" placeholder="(11) 99999-9999">
                </div>
            </div>
            
            <div class="modal-form-group">
                <label for="contact-birthday">Data de Nascimento</label>
                <input type="date" id="contact-birthday">
                <label class="checkbox-label">
                    <input type="checkbox" id="add-to-calendar" checked>
                    Adicionar aniversário ao meu calendário
                </label>
            </div>
            
            <div class="modal-form-group">
                <label for="contact-type">Tipo de Contato</label>
                <select id="contact-type">
                    <option value="friends">Amigo</option>
                    <option value="family">Família</option>
                    <option value="work">Trabalho</option>
                    <option value="other">Outro</option>
                </select>
            </div>
            
            <div class="modal-form-group">
                <label for="contact-notes">Observações</label>
                <textarea id="contact-notes" rows="3" placeholder="Notas sobre este contato..."></textarea>
            </div>
            
            <div class="modal-actions">
                <button type="button" class="btn-secondary close-modal">Cancelar</button>
                <button type="submit" class="btn-primary">Adicionar Contato</button>
            </div>
        </form>
    `;
    
    this.showModal('Adicionar Contato', modalContent);
    
    // Form submission
    const form = document.getElementById('add-contact-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addContact();
    });
}

async addContact() {
    if (!this.currentUserId) {
        showToast('Faça login para adicionar contatos', 'error');
        return;
    }
    
    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    const birthday = document.getElementById('contact-birthday').value;
    const type = document.getElementById('contact-type').value;
    const notes = document.getElementById('contact-notes').value.trim();
    const addToCalendar = document.getElementById('add-to-calendar').checked;
    
    // Validation
    if (!name) {
        showToast('Nome é obrigatório', 'error');
        return;
    }
    
    showLoading('Adicionando contato...');
    try {
        const contactId = this.generateContactId();
        const contactData = {
            name,
            email: email || '',
            phone: phone || '',
            birthday: birthday || '',
            type,
            notes: notes || '',
            isFavorite: false,
            photoURL: 'assets/default-avatar.png',
            canSeeCalendar: false,
            canSeeTree: false,
            canSeeAlbums: false,
            addedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Save to Firestore
        const contactRef = doc(db, 'users', this.currentUserId, 'contacts', contactId);
        await setDoc(contactRef, contactData);
        
        // Add to calendar if requested
        if (addToCalendar && birthday) {
            await this.addBirthdayToCalendar(contactData, contactId);
        }
        
        this.closeModal();
        showToast('Contato adicionado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao adicionar contato:', error);
        showToast('Erro ao adicionar contato', 'error');
    } finally {
        hideLoading();
    }
}

generateContactId() {
    return 'contact_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

async addBirthdayToCalendar(contact, contactId) {
    if (!this.currentUserId || !contact.birthday) return;
    
    try {
        const eventId = 'birthday_' + contactId;
        const birthday = new Date(contact.birthday);
        const currentYear = new Date().getFullYear();
        
        const eventData = {
            title: `🎂 Aniversário de ${contact.name}`,
            description: `Aniversário de ${contact.name}`,
            date: new Date(currentYear, birthday.getMonth(), birthday.getDate()).toISOString(),
            type: 'birthday',
            isRecurring: true,
            isAllDay: true,
            contactId: contactId,
            color: '#FF6B6B',
            createdAt: new Date().toISOString()
        };
        
        const eventRef = doc(db, 'users', this.currentUserId, 'events', eventId);
        await setDoc(eventRef, eventData);
        
    } catch (error) {
        console.error('Erro ao adicionar aniversário ao calendário:', error);
    }
}

openEditContactModal(contact) {
    const modalContent = `
        <form class="modal-form" id="edit-contact-form">
            <div class="modal-form-group">
                <label for="edit-contact-name">Nome Completo *</label>
                <input type="text" id="edit-contact-name" value="${contact.name}" required>
            </div>
            
            <div class="modal-form-row">
                <div class="modal-form-group">
                    <label for="edit-contact-email">Email</label>
                    <input type="email" id="edit-contact-email" value="${contact.email || ''}">
                </div>
                
                <div class="modal-form-group">
                    <label for="edit-contact-phone">Telefone</label>
                    <input type="tel" id="edit-contact-phone" value="${contact.phone || ''}">
                </div>
            </div>
            
            <div class="modal-form-group">
                <label for="edit-contact-birthday">Data de Nascimento</label>
                <input type="date" id="edit-contact-birthday" 
                       value="${contact.birthday ? contact.birthday.split('T')[0] : ''}">
                <label class="checkbox-label">
                    <input type="checkbox" id="edit-add-to-calendar" ${contact.birthday ? 'checked' : ''}>
                    Adicionar aniversário ao meu calendário
                </label>
            </div>
            
            <div class="modal-form-group">
                <label for="edit-contact-type">Tipo de Contato</label>
                <select id="edit-contact-type">
                    <option value="friends" ${contact.type === 'friends' ? 'selected' : ''}>Amigo</option>
                    <option value="family" ${contact.type === 'family' ? 'selected' : ''}>Família</option>
                    <option value="work" ${contact.type === 'work' ? 'selected' : ''}>Trabalho</option>
                    <option value="other" ${contact.type === 'other' ? 'selected' : ''}>Outro</option>
                </select>
            </div>
            
            <div class="modal-form-group">
                <label for="edit-contact-notes">Observações</label>
                <textarea id="edit-contact-notes" rows="3">${contact.notes || ''}</textarea>
            </div>
            
            <div class="modal-form-group">
                <h4>Permissões</h4>
                <label class="checkbox-label">
                    <input type="checkbox" id="edit-can-see-calendar" ${contact.canSeeCalendar ? 'checked' : ''}>
                    Pode ver meu calendário
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" id="edit-can-see-tree" ${contact.canSeeTree ? 'checked' : ''}>
                    Pode ver minha árvore genealógica
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" id="edit-can-see-albums" ${contact.canSeeAlbums ? 'checked' : ''}>
                    Pode ver meus álbuns de fotos
                </label>
            </div>
            
            <div class="modal-form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="edit-is-favorite" ${contact.isFavorite ? 'checked' : ''}>
                    Contato Favorito
                </label>
            </div>
            
            <div class="modal-actions">
                <button type="button" class="btn-secondary close-modal">Cancelar</button>
                <button type="submit" class="btn-primary">Salvar Alterações</button>
                <button type="button" class="btn-danger" id="btn-delete-contact">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        </form>
    `;
    
    this.showModal('Editar Contato', modalContent);
    
    // Form submission
    const form = document.getElementById('edit-contact-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.updateContact(contact.id);
    });
    
    // Delete button
    document.getElementById('btn-delete-contact').addEventListener('click', () => {
        if (confirm('Tem certeza que deseja excluir este contato?')) {
            this.deleteContact(contact.id);
        }
    });
}

async updateContact(contactId) {
    if (!this.currentUserId) return;
    
    const name = document.getElementById('edit-contact-name').value.trim();
    const email = document.getElementById('edit-contact-email').value.trim();
    const phone = document.getElementById('edit-contact-phone').value.trim();
    const birthday = document.getElementById('edit-contact-birthday').value;
    const type = document.getElementById('edit-contact-type').value;
    const notes = document.getElementById('edit-contact-notes').value.trim();
    const isFavorite = document.getElementById('edit-is-favorite').checked;
    const canSeeCalendar = document.getElementById('edit-can-see-calendar').checked;
    const canSeeTree = document.getElementById('edit-can-see-tree').checked;
    const canSeeAlbums = document.getElementById('edit-can-see-albums').checked;
    const addToCalendar = document.getElementById('edit-add-to-calendar').checked;
    
    if (!name) {
        showToast('Nome é obrigatório', 'error');
        return;
    }
    
    showLoading('Atualizando contato...');
    try {
        const contactRef = doc(db, 'users', this.currentUserId, 'contacts', contactId);
        
        const updateData = {
            name,
            email: email || '',
            phone: phone || '',
            birthday: birthday || '',
            type,
            notes: notes || '',
            isFavorite,
            canSeeCalendar,
            canSeeTree,
            canSeeAlbums,
            updatedAt: new Date().toISOString()
        };
        
        await updateDoc(contactRef, updateData);
        
        // Handle calendar birthday
        if (addToCalendar && birthday) {
            await this.addBirthdayToCalendar(updateData, contactId);
        }
        
        this.closeModal();
        showToast('Contato atualizado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao atualizar contato:', error);
        showToast('Erro ao atualizar contato', 'error');
    } finally {
        hideLoading();
    }
}

async deleteContact(contactId) {
    if (!this.currentUserId) return;
    
    if (!confirm('Tem certeza que deseja excluir este contato? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    showLoading('Excluindo contato...');
    try {
        const contactRef = doc(db, 'users', this.currentUserId, 'contacts', contactId);
        await deleteDoc(contactRef);
        
        // Also delete from calendar
        await this.deleteBirthdayFromCalendar(contactId);
        
        this.closeModal();
        showToast('Contato excluído com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao excluir contato:', error);
        showToast('Erro ao excluir contato', 'error');
    } finally {
        hideLoading();
    }
}

async deleteBirthdayFromCalendar(contactId) {
    if (!this.currentUserId) return;
    
    try {
        const eventId = 'birthday_' + contactId;
        const eventRef = doc(db, 'users', this.currentUserId, 'events', eventId);
        await deleteDoc(eventRef);
    } catch (error) {
        console.error('Erro ao remover aniversário do calendário:', error);
    }
}

async importContacts() {
    if (!navigator.contacts) {
        showToast('Importação de contatos não suportada neste navegador', 'warning');
        return;
    }
    
    try {
        const props = ['name', 'email', 'tel'];
        const opts = { multiple: true };
        
        const contacts = await navigator.contacts.select(props, opts);
        
        if (contacts.length === 0) {
            showToast('Nenhum contato selecionado', 'info');
            return;
        }
        
        showLoading(`Importando ${contacts.length} contatos...`);
        
        let importedCount = 0;
        for (const deviceContact of contacts) {
            try {
                await this.importSingleContact(deviceContact);
                importedCount++;
            } catch (error) {
                console.error('Erro ao importar contato:', error);
            }
        }
        
        hideLoading();
        showToast(`${importedCount} contatos importados com sucesso!`, 'success');
        
    } catch (error) {
        console.error('Erro na importação:', error);
        showToast('Erro ao importar contatos', 'error');
        hideLoading();
    }
}

async importSingleContact(deviceContact) {
    if (!this.currentUserId) return;
    
    const name = deviceContact.name?.[0] || 'Contato sem nome';
    const email = deviceContact.email?.[0] || '';
    const phone = deviceContact.tel?.[0] || '';
    
    // Check if contact already exists
    const exists = this.contacts.some(c => 
        c.email === email || c.phone === phone
    );
    
    if (exists) return; // Skip duplicates
    
    const contactId = this.generateContactId();
    const contactData = {
        name,
        email,
        phone,
        birthday: '',
        type: 'friends',
        notes: 'Importado do dispositivo',
        isFavorite: false,
        photoURL: 'assets/default-avatar.png',
        canSeeCalendar: false,
        canSeeTree: false,
        canSeeAlbums: false,
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    const contactRef = doc(db, 'users', this.currentUserId, 'contacts', contactId);
    await setDoc(contactRef, contactData);
}

    // Modal methods
    showModal(title, content) {
        const modal = document.getElementById('modal-contact');
        if (!modal) {
            console.error('Modal de contato não encontrado');
            return;
        }
        
        const modalHeader = modal.querySelector('.modal-header h2');
        const modalBody = modal.querySelector('.modal-body');
        
        if (modalHeader) {
            modalHeader.innerHTML = `<i class="fas fa-user-plus"></i> ${title}`;
        }
        
        if (modalBody) {
            modalBody.innerHTML = content;
        }
        
        modal.classList.add('active');
        document.getElementById('modal-overlay').classList.add('active');
        
        // Close buttons
        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });
        
        // Close on overlay click
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('modal-overlay')) {
                this.closeModal();
            }
        });
    }
    
    closeModal() {
        const modals = document.querySelectorAll('.modal');
        const overlay = document.getElementById('modal-overlay');
        
        modals.forEach(modal => modal.classList.remove('active'));
        if (overlay) overlay.classList.remove('active');
    }
    
    // Block/Unblock contacts (for future implementation)
    async blockContact(contactId) {
        if (!this.currentUserId) return;
        
        try {
            const contactRef = doc(db, 'users', this.currentUserId, 'contacts', contactId);
            await updateDoc(contactRef, { isBlocked: true });
            showToast('Contato bloqueado', 'success');
        } catch (error) {
            console.error('Erro ao bloquear contato:', error);
            showToast('Erro ao bloquear contato', 'error');
        }
    }
    
    async unblockContact(contactId) {
        if (!this.currentUserId) return;
        
        try {
            const contactRef = doc(db, 'users', this.currentUserId, 'contacts', contactId);
            await updateDoc(contactRef, { isBlocked: false });
            showToast('Contato desbloqueado', 'success');
        } catch (error) {
            console.error('Erro ao desbloquear contato:', error);
            showToast('Erro ao desbloquear contato', 'error');
        }
    }
    
    // Get contacts for birthday reminders
    getUpcomingBirthdays(daysAhead = 90) {
        const today = new Date();
        const upcoming = [];
        
        this.contacts.forEach(contact => {
            if (!contact.birthday) return;
            
            const birthday = new Date(contact.birthday);
            const nextBirthday = new Date(
                today.getFullYear(),
                birthday.getMonth(),
                birthday.getDate()
            );
            
            if (nextBirthday < today) {
                nextBirthday.setFullYear(today.getFullYear() + 1);
            }
            
            const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
            
            if (daysUntil <= daysAhead) {
                upcoming.push({
                    ...contact,
                    daysUntil,
                    nextBirthday: nextBirthday.toISOString()
                });
            }
        });
        
        // Sort by days until
        upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
        
        return upcoming;
    }
    
    // Export contacts to CSV
    exportContactsToCSV() {
        if (this.contacts.length === 0) {
            showToast('Nenhum contato para exportar', 'info');
            return;
        }
        
        const headers = ['Nome', 'Email', 'Telefone', 'Aniversário', 'Tipo', 'Favorito'];
        const csvRows = [headers.join(',')];
        
        this.contacts.forEach(contact => {
            const row = [
                `"${contact.name}"`,
                `"${contact.email || ''}"`,
                `"${contact.phone || ''}"`,
                `"${contact.birthday ? formatDate(contact.birthday, 'dd/mm/yyyy') : ''}"`,
                `"${this.getTypeLabel(contact.type)}"`,
                `"${contact.isFavorite ? 'Sim' : 'Não'}"`
            ];
            csvRows.push(row.join(','));
        });
        
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `contatos_cronoz_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Contatos exportados com sucesso!', 'success');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const contactsSystem = new ContactsSystem();
    window.contactsSystem = contactsSystem;
    
    console.log('Sistema de contatos inicializado!');
});

// Export for module usage
export default ContactsSystem;