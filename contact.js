// contacts.js - Sistema de Contatos Completo
class ContactsModule {
    constructor(app) {
        this.app = app;
        this.contacts = [];
        this.categories = ['Favoritos', 'Família', 'Trabalho', 'Amigos', 'Outros'];
        this.currentFilter = 'all';
        
        this.init();
    }
    
    async init() {
        this.loadContacts();
        this.render();
        this.setupEventListeners();
    }
    
    async loadContacts() {
        try {
            // Carregar do Firebase
            const user = this.app.user;
            if (user) {
                const contactsRef = ref(db, `users/${user.uid}/contacts`);
                const snapshot = await get(contactsRef);
                
                if (snapshot.exists()) {
                    this.contacts = Object.values(snapshot.val());
                } else {
                    this.contacts = [];
                }
            }
            
            // Tentar importar contatos do dispositivo
            if ('contacts' in navigator && 'ContactsManager' in window) {
                await this.importDeviceContacts();
            }
            
            this.renderContacts();
        } catch (error) {
            console.error('Erro ao carregar contatos:', error);
            this.contacts = this.getSampleContacts();
            this.renderContacts();
        }
    }
    
    async importDeviceContacts() {
        try {
            const props = ['name', 'email', 'tel', 'address', 'icon'];
            const opts = { multiple: true };
            
            const contacts = await navigator.contacts.select(props, opts);
            
            contacts.forEach(contact => {
                const newContact = {
                    id: Date.now() + Math.random(),
                    name: contact.name?.[0] || 'Sem nome',
                    email: contact.email?.[0] || '',
                    phone: contact.tel?.[0] || '',
                    address: contact.address?.[0] || '',
                    category: 'Outros',
                    favorite: false,
                    blocked: false,
                    notes: '',
                    createdAt: new Date().toISOString()
                };
                
                this.addContact(newContact, false);
            });
            
            await this.saveContacts();
            this.renderContacts();
        } catch (error) {
            console.warn('Não foi possível importar contatos do dispositivo:', error);
        }
    }
    
    getSampleContacts() {
        return [
            {
                id: 1,
                name: 'João Silva',
                email: 'joao@email.com',
                phone: '(11) 99999-9999',
                address: 'São Paulo, SP',
                category: 'Trabalho',
                favorite: true,
                blocked: false,
                notes: 'Colega de trabalho',
                createdAt: '2024-01-01'
            },
            {
                id: 2,
                name: 'Maria Santos',
                email: 'maria@email.com',
                phone: '(21) 98888-8888',
                address: 'Rio de Janeiro, RJ',
                category: 'Família',
                favorite: true,
                blocked: false,
                notes: 'Prima',
                createdAt: '2024-01-02'
            }
        ];
    }

addContact(contactData, save = true) {
        const contact = {
            id: contactData.id || Date.now() + Math.random(),
            ...contactData,
            createdAt: contactData.createdAt || new Date().toISOString()
        };
        
        this.contacts.push(contact);
        
        if (save) {
            this.saveContacts();
            this.renderContacts();
        }
    }
    
    editContact(id, updates) {
        const index = this.contacts.findIndex(c => c.id === id);
        if (index !== -1) {
            this.contacts[index] = { ...this.contacts[index], ...updates };
            this.saveContacts();
            this.renderContacts();
        }
    }
    
    deleteContact(id) {
        this.contacts = this.contacts.filter(c => c.id !== id);
        this.saveContacts();
        this.renderContacts();
    }
    
    toggleFavorite(id) {
        const contact = this.contacts.find(c => c.id === id);
        if (contact) {
            contact.favorite = !contact.favorite;
            this.saveContacts();
            this.renderContacts();
        }
    }
    
    toggleBlock(id) {
        const contact = this.contacts.find(c => c.id === id);
        if (contact) {
            contact.blocked = !contact.blocked;
            this.saveContacts();
            this.renderContacts();
        }
    }
    
    async saveContacts() {
        const user = this.app.user;
        if (user) {
            try {
                const contactsRef = ref(db, `users/${user.uid}/contacts`);
                await set(contactsRef, this.contacts);
            } catch (error) {
                console.error('Erro ao salvar contatos:', error);
                // Fallback para localStorage
                localStorage.setItem(`cronoz_contacts_${user.uid}`, JSON.stringify(this.contacts));
            }
        }
    }
    
    filterContacts(category) {
        this.currentFilter = category;
        this.renderContacts();
    }
    
    searchContacts(query) {
        const searchTerm = query.toLowerCase();
        return this.contacts.filter(contact => 
            contact.name.toLowerCase().includes(searchTerm) ||
            contact.email.toLowerCase().includes(searchTerm) ||
            contact.phone.includes(searchTerm)
        );
    }
    
    render() {
        const container = document.getElementById('contacts-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="contacts-header">
                <h2>Contatos</h2>
                <div class="contacts-actions">
                    <button class="btn btn-primary" id="add-contact-btn">
                        <i class="fas fa-plus"></i> Novo Contato
                    </button>
                    <button class="btn btn-secondary" id="import-contacts-btn">
                        <i class="fas fa-download"></i> Importar
                    </button>
                    <div class="search-box">
                        <input type="text" id="contact-search" placeholder="Buscar contatos...">
                        <i class="fas fa-search"></i>
                    </div>
                </div>
            </div>
            
            <div class="contacts-filters">
                <button class="filter-btn ${this.currentFilter === 'all' ? 'active' : ''}" data-filter="all">
                    Todos (${this.contacts.length})
                </button>
                <button class="filter-btn ${this.currentFilter === 'favorites' ? 'active' : ''}" data-filter="favorites">
                    <i class="fas fa-star"></i> Favoritos
                </button>
                ${this.categories.map(cat => `
                    <button class="filter-btn ${this.currentFilter === cat ? 'active' : ''}" data-filter="${cat}">
                        ${cat} (${this.contacts.filter(c => c.category === cat).length})
                    </button>
                `).join('')}
            </div>
            
            <div class="contacts-grid" id="contacts-grid">
                <!-- Contatos serão renderizados aqui -->
            </div>
            
            <!-- Modal para adicionar/editar contato -->
            <div class="modal" id="contact-modal">
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h3 id="modal-title">Novo Contato</h3>
                    <form id="contact-form">
                        <input type="hidden" id="contact-id">
                        
                        <div class="form-group">
                            <label for="contact-name">Nome *</label>
                            <input type="text" id="contact-name" required>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="contact-email">Email</label>
                                <input type="email" id="contact-email">
                            </div>
                            <div class="form-group">
                                <label for="contact-phone">Telefone</label>
                                <input type="tel" id="contact-phone">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="contact-address">Endereço</label>
                            <input type="text" id="contact-address">
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="contact-category">Categoria</label>
                                <select id="contact-category">
                                    ${this.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="contact-notes">Notas</label>
                                <textarea id="contact-notes" rows="3"></textarea>
                            </div>
                        </div>

                        <div class="form-checkboxes">
                            <label class="checkbox-label">
                                <input type="checkbox" id="contact-favorite">
                                <span class="checkmark"></span>
                                Favorito
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="contact-blocked">
                                <span class="checkmark"></span>
                                Bloqueado
                            </label>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" id="cancel-contact">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        this.renderContacts();
    }
    
    renderContacts() {
        const grid = document.getElementById('contacts-grid');
        if (!grid) return;
        
        let filteredContacts = this.contacts;
        
        if (this.currentFilter === 'favorites') {
            filteredContacts = this.contacts.filter(c => c.favorite);
        } else if (this.currentFilter !== 'all') {
            filteredContacts = this.contacts.filter(c => c.category === this.currentFilter);
        }
        
        if (filteredContacts.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-address-book"></i>
                    <p>Nenhum contato encontrado</p>
                    <button class="btn btn-primary" id="add-first-contact">Adicionar primeiro contato</button>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = filteredContacts.map(contact => `
            <div class="contact-card ${contact.blocked ? 'blocked' : ''}">
                <div class="contact-header">
                    <div class="contact-avatar">
                        ${contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="contact-info">
                        <h3>${contact.name}</h3>
                        <p>${contact.category}</p>
                    </div>
                    <div class="contact-actions">
                        <button class="icon-btn ${contact.favorite ? 'active' : ''}" data-action="favorite" data-id="${contact.id}">
                            <i class="fas fa-star"></i>
                        </button>
                        <button class="icon-btn" data-action="edit" data-id="${contact.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="icon-btn" data-action="delete" data-id="${contact.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="contact-details">
                    ${contact.email ? `<p><i class="fas fa-envelope"></i> ${contact.email}</p>` : ''}
                    ${contact.phone ? `<p><i class="fas fa-phone"></i> ${contact.phone}</p>` : ''}
                    ${contact.address ? `<p><i class="fas fa-map-marker-alt"></i> ${contact.address}</p>` : ''}
                    ${contact.notes ? `<p><i class="fas fa-sticky-note"></i> ${contact.notes}</p>` : ''}
                </div>
                
                <div class="contact-footer">
                    <button class="btn btn-sm ${contact.blocked ? 'btn-success' : 'btn-warning'}" data-action="block" data-id="${contact.id}">
                        ${contact.blocked ? 'Desbloquear' : 'Bloquear'}
                    </button>
                    <button class="btn btn-sm btn-info" data-action="share" data-id="${contact.id}">
                        Compartilhar
                    </button>
                </div>
            </div>
        `).join('');
    }

setupEventListeners() {
        // Adicionar contato
        document.addEventListener('click', (e) => {
            if (e.target.id === 'add-contact-btn' || e.target.closest('#add-contact-btn')) {
                this.openContactModal();
            }
            
            if (e.target.id === 'add-first-contact') {
                this.openContactModal();
            }
            
            if (e.target.id === 'import-contacts-btn') {
                this.importDeviceContacts();
            }
            
            // Ações dos contatos
            if (e.target.closest('[data-action]')) {
                const button = e.target.closest('[data-action]');
                const action = button.dataset.action;
                const id = button.dataset.id;
                
                switch (action) {
                    case 'favorite':
                        this.toggleFavorite(id);
                        break;
                    case 'edit':
                        this.openContactModal(id);
                        break;
                    case 'delete':
                        if (confirm('Tem certeza que deseja excluir este contato?')) {
                            this.deleteContact(id);
                        }
                        break;
                    case 'block':
                        this.toggleBlock(id);
                        break;
                    case 'share':
                        this.shareContact(id);
                        break;
                }
            }
            
            // Filtros
            if (e.target.closest('.filter-btn')) {
                const filter = e.target.closest('.filter-btn').dataset.filter;
                this.filterContacts(filter);
            }
        });
        
        // Busca
        const searchInput = document.getElementById('contact-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const results = this.searchContacts(e.target.value);
                // Atualizar visualização com resultados
                this.showSearchResults(results);
            });
        }
        
        // Modal
        const modal = document.getElementById('contact-modal');
        const closeBtn = modal?.querySelector('.close');
        const cancelBtn = document.getElementById('cancel-contact');
        
        if (closeBtn) {
            closeBtn.onclick = () => this.closeContactModal();
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = () => this.closeContactModal();
        }
        
        // Fechar modal ao clicar fora
        window.onclick = (e) => {
            if (e.target === modal) {
                this.closeContactModal();
            }
        };
        
        // Formulário
        const form = document.getElementById('contact-form');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                this.saveContactForm();
            };
        }
    }
    
    openContactModal(id = null) {
        const modal = document.getElementById('contact-modal');
        const form = document.getElementById('contact-form');
        
        if (id) {
            // Modo edição
            const contact = this.contacts.find(c => c.id === id);
            if (contact) {
                document.getElementById('modal-title').textContent = 'Editar Contato';
                document.getElementById('contact-id').value = contact.id;
                document.getElementById('contact-name').value = contact.name;
                document.getElementById('contact-email').value = contact.email || '';
                document.getElementById('contact-phone').value = contact.phone || '';
                document.getElementById('contact-address').value = contact.address || '';
                document.getElementById('contact-category').value = contact.category;
                document.getElementById('contact-notes').value = contact.notes || '';
                document.getElementById('contact-favorite').checked = contact.favorite;
                document.getElementById('contact-blocked').checked = contact.blocked;
            }
        } else {
            // Modo criação
            document.getElementById('modal-title').textContent = 'Novo Contato';
            form.reset();
            document.getElementById('contact-id').value = '';
        }
        
        modal.style.display = 'block';
    }
    
    closeContactModal() {
        const modal = document.getElementById('contact-modal');
        modal.style.display = 'none';
    }
    
    saveContactForm() {
        const id = document.getElementById('contact-id').value;
        const contactData = {
            name: document.getElementById('contact-name').value,
            email: document.getElementById('contact-email').value,
            phone: document.getElementById('contact-phone').value,
            address: document.getElementById('contact-address').value,
            category: document.getElementById('contact-category').value,
            notes: document.getElementById('contact-notes').value,
            favorite: document.getElementById('contact-favorite').checked,
            blocked: document.getElementById('contact-blocked').checked
        };
        
        if (id) {
            this.editContact(id, contactData);
        } else {
            this.addContact(contactData);
        }
        
        this.closeContactModal();
    }

    showSearchResults(results) {
        const grid = document.getElementById('contacts-grid');
        if (!grid) return;
        
        if (results.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p>Nenhum contato encontrado</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = results.map(contact => `
            <div class="contact-card">
                <div class="contact-header">
                    <div class="contact-avatar">
                        ${contact.name.charAt(0).toUpperCase()}
                    </div>
                    <h3>${contact.name}</h3>
                </div>
                <p>${contact.email || ''}</p>
                <p>${contact.phone || ''}</p>
            </div>
        `).join('');
    }
    
    shareContact(id) {
        const contact = this.contacts.find(c => c.id === id);
        if (!contact) return;
        
        const shareData = {
            title: `Contato: ${contact.name}`,
            text: `Nome: ${contact.name}\nEmail: ${contact.email || 'N/A'}\nTelefone: ${contact.phone || 'N/A'}`,
            url: window.location.href
        };
        
        if (navigator.share) {
            navigator.share(shareData);
        } else {
            // Fallback para copiar para área de transferência
            navigator.clipboard.writeText(shareData.text);
            alert('Contato copiado para área de transferência!');
        }
    }
    
    show() {
        document.getElementById('contacts-container').style.display = 'block';
        this.render();
    }
    
    hide() {
        const container = document.getElementById('contacts-container');
        if (container) {
            container.style.display = 'none';
        }
    }
}
```
