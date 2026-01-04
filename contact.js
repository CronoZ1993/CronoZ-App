// contacts.js - Sistema Completo de Contatos
class ContactsManager {
    constructor() {
        this.contacts = [];
        this.blockedContacts = [];
        this.currentUser = null;
        this.currentFilter = 'all';
        this.currentSort = 'name-asc';
        
        this.init();
    }

    async init() {
        // Verificar autenticação
        this.currentUser = auth.currentUser;
        if (!this.currentUser) return;

        // Carregar contatos do Firestore
        await this.loadContacts();
        await this.loadBlockedContacts();
        
        this.setupEventListeners();
        this.renderContacts();
        this.renderBlockedContacts();
    }

    async loadContacts() {
        try {
            const contactsRef = collection(db, 'users', this.currentUser.uid, 'contacts');
            const q = query(contactsRef, where('isBlocked', '==', false));
            const snapshot = await getDocs(q);
            
            this.contacts = [];
            snapshot.forEach(doc => {
                this.contacts.push({ id: doc.id, ...doc.data() });
            });
            
            console.log('Contatos carregados:', this.contacts.length);
        } catch (error) {
            console.error('Erro ao carregar contatos:', error);
            showNotification('Erro ao carregar contatos', 'error');
        }
    }

    async loadBlockedContacts() {
        try {
            const contactsRef = collection(db, 'users', this.currentUser.uid, 'contacts');
            const q = query(contactsRef, where('isBlocked', '==', true));
            const snapshot = await getDocs(q);
            
            this.blockedContacts = [];
            snapshot.forEach(doc => {
                this.blockedContacts.push({ id: doc.id, ...doc.data() });
            });
        } catch (error) {
            console.error('Erro ao carregar contatos bloqueados:', error);
        }
    }

    setupEventListeners() {
        // Botão adicionar contato
        document.getElementById('addContactBtn')?.addEventListener('click', () => {
            this.showAddContactModal();
        });

        // Filtros
        document.getElementById('contactFilter')?.addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.renderContacts();
        });

        // Ordenação
        document.getElementById('contactSort')?.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.renderContacts();
        });

        // Busca
        document.getElementById('contactSearch')?.addEventListener('input', (e) => {
            this.searchContacts(e.target.value);
        });

        // Alternar abas
        document.getElementById('friendsTab')?.addEventListener('click', () => {
            this.showTab('friends');
        });

        document.getElementById('blockedTab')?.addEventListener('click', () => {
            this.showTab('blocked');
        });

        // Importar contatos do dispositivo
        document.getElementById('importContactsBtn')?.addEventListener('click', () => {
            this.importDeviceContacts();
        });
    }

    showTab(tabName) {
        // Atualizar UI das abas
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        if (tabName === 'friends') {
            document.getElementById('friendsTab').classList.add('active');
            document.getElementById('friendsContent').classList.add('active');
        } else {
            document.getElementById('blockedTab').classList.add('active');
            document.getElementById('blockedContent').classList.add('active');
        }
    }

    showAddContactModal() {
        const modalHTML = `
            <div class="modal" id="addContactModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Adicionar Contato</h3>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="addContactForm">
                            <div class="form-group">
                                <label>Email ou ID do Usuário</label>
                                <input type="text" id="contactIdentifier" required 
                                       placeholder="email@exemplo.com ou ID único">
                            </div>
                            
                            <div class="form-group">
                                <label>Apelido (opcional)</label>
                                <input type="text" id="contactNickname" 
                                       placeholder="Como você chama essa pessoa?">
                            </div>
                            
                            <div class="form-group">
                                <label>Tipo de Relacionamento</label>
                                <select id="contactRelationship">
                                    <option value="all">Todos</option>
                                    <option value="favorite">Favorito</option>
                                    <option value="family">Família</option>
                                    <option value="friend">Amigo</option>
                                    <option value="work">Colega/Trabalho</option>
                                    <option value="other">Outro</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="canSeeCalendar">
                                    Pode ver meu calendário
                                </label>
                            </div>
                            
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="canSeeTree">
                                    Pode ver minha árvore genealógica
                                </label>
                            </div>
                            
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="canSeeAlbums">
                                    Pode ver meus álbuns
                                </label>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn secondary close-modal">Cancelar</button>
                                <button type="submit" class="btn primary">Enviar Pedido</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.getElementById('addContactModal');
        const form = document.getElementById('addContactForm');
        
        // Fechar modal
        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.remove();
            });
        });

        // Enviar formulário
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.sendContactRequest();
            modal.remove();
        });
    }

    async sendContactRequest() {
        const identifier = document.getElementById('contactIdentifier').value;
        const nickname = document.getElementById('contactNickname').value;
        const relationship = document.getElementById('contactRelationship').value;
        const canSeeCalendar = document.getElementById('canSeeCalendar').checked;
        const canSeeTree = document.getElementById('canSeeTree').checked;
        const canSeeAlbums = document.getElementById('canSeeAlbums').checked;

        try {
            // Buscar usuário pelo email/ID
            const userQuery = query(
                collection(db, 'users'),
                where('email', '==', identifier)
            );
            
            const snapshot = await getDocs(userQuery);
            
            if (snapshot.empty) {
                showNotification('Usuário não encontrado', 'error');
                return;
            }

            const targetUser = snapshot.docs[0];
            
            // Criar pedido de amizade
            const requestRef = doc(collection(db, 'friendRequests'));
            await setDoc(requestRef, {
                fromUser: this.currentUser.uid,
                fromUserName: this.currentUser.displayName,
                fromUserEmail: this.currentUser.email,
                toUser: targetUser.id,
                toUserEmail: identifier,
                nickname,
                relationship,
                permissions: {
                    calendar: canSeeCalendar,
                    tree: canSeeTree,
                    albums: canSeeAlbums
                },
                status: 'pending',
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
            });

            showNotification('Pedido de amizade enviado!', 'success');
            
        } catch (error) {
            console.error('Erro ao enviar pedido:', error);
            showNotification('Erro ao enviar pedido', 'error');
        }
    }

    async importDeviceContacts() {
        if ('contacts' in navigator && 'ContactsManager' in window) {
            try {
                const props = ['name', 'email', 'tel', 'address', 'icon'];
                const opts = { multiple: true };
                
                const contacts = await navigator.contacts.select(props, opts);
                
                // Processar cada contato
                for (const contact of contacts) {
                    await this.processDeviceContact(contact);
                }
                
                showNotification(`${contacts.length} contatos importados`, 'success');
                await this.loadContacts();
                this.renderContacts();
                
            } catch (error) {
                console.error('Erro ao importar contatos:', error);
                showNotification('Não foi possível importar contatos', 'error');
            }
        } else {
            showNotification('API de contatos não suportada neste navegador', 'warning');
        }
    }

    async processDeviceContact(contact) {
        // Verificar se já existe
        const existing = this.contacts.find(c => 
            c.email === contact.email?.[0] || 
            c.phone === contact.tel?.[0]
        );
        
        if (existing) return;

        try {
            const contactRef = doc(collection(db, 'users', this.currentUser.uid, 'contacts'));
            await setDoc(contactRef, {
                name: contact.name?.[0] || 'Contato',
                email: contact.email?.[0] || '',
                phone: contact.tel?.[0] || '',
                relationship: 'other',
                isBlocked: false,
                isFavorite: false,
                createdAt: new Date().toISOString(),
                source: 'device'
            });
        } catch (error) {
            console.error('Erro ao salvar contato:', error);
        }
    }

    searchContacts(query) {
        const filtered = this.contacts.filter(contact => {
            const searchStr = query.toLowerCase();
            return (
                contact.name?.toLowerCase().includes(searchStr) ||
                contact.email?.toLowerCase().includes(searchStr) ||
                contact.phone?.includes(searchStr) ||
                contact.nickname?.toLowerCase().includes(searchStr)
            );
        });
        
        this.renderContacts(filtered);
    }

    sortContacts(contacts) {
        const [field, order] = this.currentSort.split('-');
        
        return contacts.sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];
            
            if (field === 'birthDate' || field === 'createdAt') {
                aVal = aVal ? new Date(aVal).getTime() : 0;
                bVal = bVal ? new Date(bVal).getTime() : 0;
            } else if (field === 'name') {
                aVal = aVal?.toLowerCase() || '';
                bVal = bVal?.toLowerCase() || '';
            }
            
            if (order === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    }

    filterContacts(contacts) {
        if (this.currentFilter === 'all') return contacts;
        
        return contacts.filter(contact => 
            contact.relationship === this.currentFilter
        );
    }

    renderContacts(filteredContacts = null) {
        const container = document.getElementById('contactsList');
        if (!container) return;

        let contactsToRender = filteredContacts || this.contacts;
        contactsToRender = this.filterContacts(contactsToRender);
        contactsToRender = this.sortContacts(contactsToRender);

        if (contactsToRender.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="icon">👤</i>
                    <h3>Nenhum contato encontrado</h3>
                    <p>Adicione seus primeiros contatos para começar</p>
                    <button class="btn primary" id="addFirstContact">
                        Adicionar Contato
                    </button>
                </div>
            `;
            
            document.getElementById('addFirstContact')?.addEventListener('click', () => {
                this.showAddContactModal();
            });
            
            return;
        }

        container.innerHTML = contactsToRender.map(contact => `
            <div class="contact-card" data-id="${contact.id}">
                <div class="contact-avatar">
                    ${contact.photoURL ? 
                        `<img src="${contact.photoURL}" alt="${contact.name}">` : 
                        `<div class="avatar-placeholder">${contact.name?.charAt(0) || '?'}</div>`
                    }
                    ${contact.isFavorite ? '<span class="favorite-badge">★</span>' : ''}
                </div>
                
                <div class="contact-info">
                    <div class="contact-header">
                        <h4 class="contact-name">${contact.name}</h4>
                        ${contact.nickname ? `<span class="contact-nickname">${contact.nickname}</span>` : ''}
                    </div>
                    
                    ${contact.relationship !== 'all' ? 
                        `<span class="relationship-badge ${contact.relationship}">
                            ${this.getRelationshipIcon(contact.relationship)}
                            ${this.getRelationshipLabel(contact.relationship)}
                        </span>` : ''
                    }
                    
                    <div class="contact-details">
                        ${contact.email ? `<p><i class="icon">✉️</i> ${contact.email}</p>` : ''}
                        ${contact.phone ? `<p><i class="icon">📱</i> ${contact.phone}</p>` : ''}
                        ${contact.birthDate ? `<p><i class="icon">🎂</i> ${this.formatBirthDate(contact.birthDate)}</p>` : ''}
                    </div>
                </div>
                
                <div class="contact-actions">
                    <button class="btn-icon edit-contact" title="Editar">
                        <i class="icon">✏️</i>
                    </button>
                    <button class="btn-icon favorite-contact" title="${contact.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                        <i class="icon">${contact.isFavorite ? '★' : '☆'}</i>
                    </button>
                    <button class="btn-icon block-contact" title="Bloquear">
                        <i class="icon">🚫</i>
                    </button>
                </div>
            </div>
        `).join('');

        // Adicionar event listeners aos botões
        container.querySelectorAll('.edit-contact').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const contactId = e.target.closest('.contact-card').dataset.id;
                this.showEditContactModal(contactId);
            });
        });

        container.querySelectorAll('.favorite-contact').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const contactId = e.target.closest('.contact-card').dataset.id;
                await this.toggleFavorite(contactId);
            });
        });

        container.querySelectorAll('.block-contact').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const contactId = e.target.closest('.contact-card').dataset.id;
                await this.blockContact(contactId);
            });
        });
    }

    async toggleFavorite(contactId) {
        try {
            const contact = this.contacts.find(c => c.id === contactId);
            if (!contact) return;

            const contactRef = doc(db, 'users', this.currentUser.uid, 'contacts', contactId);
            await updateDoc(contactRef, {
                isFavorite: !contact.isFavorite
            });

            await this.loadContacts();
            this.renderContacts();
            showNotification(contact.isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos', 'success');
            
        } catch (error) {
            console.error('Erro ao atualizar favorito:', error);
        }
    }

    async blockContact(contactId) {
        if (!confirm('Tem certeza que deseja bloquear este contato?')) return;

        try {
            const contactRef = doc(db, 'users', this.currentUser.uid, 'contacts', contactId);
            await updateDoc(contactRef, {
                isBlocked: true,
                blockedAt: new Date().toISOString()
            });

            await this.loadContacts();
            await this.loadBlockedContacts();
            this.renderContacts();
            this.renderBlockedContacts();
            
            showNotification('Contato bloqueado', 'success');
            
        } catch (error) {
            console.error('Erro ao bloquear contato:', error);
        }
    }

    renderBlockedContacts() {
        const container = document.getElementById('blockedContactsList');
        if (!container) return;

        if (this.blockedContacts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="icon">🔓</i>
                    <h3>Nenhum contato bloqueado</h3>
                    <p>Você não bloqueou nenhum contato ainda</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.blockedContacts.map(contact => `
            <div class="contact-card blocked" data-id="${contact.id}">
                <div class="contact-avatar">
                    ${contact.photoURL ? 
                        `<img src="${contact.photoURL}" alt="${contact.name}">` : 
                        `<div class="avatar-placeholder">${contact.name?.charAt(0) || '?'}</div>`
                    }
                </div>
                
                <div class="contact-info">
                    <h4 class="contact-name">${contact.na