// app.js - Núcleo principal do CronoZ App
import { auth, db, onAuthStateChanged, signOut } from './firebase-config.js';
import { showLoading, hideLoading, showToast } from './utils.js';

// Elementos DOM
const loginScreen = document.getElementById('login-screen');
const registerScreen = document.getElementById('register-screen');
const appScreen = document.getElementById('app-screen');
const btnMenu = document.getElementById('btn-menu');
const btnCloseMenu = document.getElementById('btn-close-menu');
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('main-content');
const btnLogout = document.getElementById('btn-logout');
const currentPage = document.getElementById('current-page');
const bottomNavItems = document.querySelectorAll('.nav-item');
const pageElements = document.querySelectorAll('.page');

// Sistema de navegação
class NavigationSystem {
    constructor() {
        this.currentPage = 'home';
        this.init();
    }
    
    init() {
        // Navegação pelo rodapé
        bottomNavItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });
        
        // Navegação pelo menu lateral
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigateTo(page);
                this.closeSidebar();
            });
        });
        
        // Navegação inicial
        this.navigateTo('home');
    }
    
    navigateTo(page) {
        // Atualizar página atual
        this.currentPage = page;
        
        // Atualizar título
        currentPage.textContent = this.getPageTitle(page);
        
        // Esconder todas as páginas
        pageElements.forEach(p => p.classList.remove('active'));
        
        // Mostrar página selecionada
        const targetPage = document.getElementById(`page-${page}`);
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        // Atualizar navegação ativa
        bottomNavItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });
        
        // Atualizar menu lateral
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });
        
        // Rolar para o topo
        mainContent.scrollTo(0, 0);
        
        // Disparar evento customizado
        document.dispatchEvent(new CustomEvent('pageChanged', { detail: page }));
    }
    
    getPageTitle(page) {
        const titles = {
            'home': 'Início',
            'contacts': 'Contatos',
            'chat': 'Chat',
            'calendar': 'Calendário',
            'tree': 'Árvore',
            'albums': 'Álbuns',
            'settings': 'Configurações'
        };
        return titles[page] || 'CronoZ';
    }
    
    openSidebar() {
        sidebar.classList.add('active');
        document.getElementById('modal-overlay').classList.add('active');
    }
    
    closeSidebar() {
        sidebar.classList.remove('active');
        document.getElementById('modal-overlay').classList.remove('active');
    }
}

// Sistema de perfil do usuário
class UserProfile {
    constructor() {
        this.userData = null;
        this.init();
    }
    
    init() {
        // Botão editar perfil
        document.getElementById('btn-edit-profile')?.addEventListener('click', () => {
            this.openEditProfileModal();
        });
        
        // Carregar dados do usuário
        this.loadUserData();
    }
    
    async loadUserData() {
        const user = auth.currentUser;
        if (!user) return;
        
        try {
            showLoading();
            // Aqui você buscaria os dados do Firestore
            // Por enquanto, usamos dados mock
            this.userData = {
                name: user.displayName || 'Usuário CronoZ',
                email: user.email,
                birthday: '--/--/----',
                phone: 'Não informado',
                avatar: 'assets/default-avatar.png'
            };
            
            this.updateUI();
            this.updateBirthdayMessage();
            hideLoading();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            showToast('Erro ao carregar dados do perfil', 'error');
            hideLoading();
        }
    }
    
    updateUI() {
        // Atualizar cabeçalho
        document.getElementById('user-name').textContent = this.userData.name;
        document.getElementById('user-email').textContent = this.userData.email;
        document.getElementById('user-avatar').src = this.userData.avatar;
        
        // Atualizar perfil na página inicial
        document.getElementById('profile-name').textContent = this.userData.name;
        document.getElementById('profile-birthday').textContent = `Aniversário: ${this.userData.birthday}`;
        document.getElementById('profile-phone').textContent = `Telefone: ${this.userData.phone}`;
        document.getElementById('profile-avatar').src = this.userData.avatar;
        
        // Atualizar configurações
        document.getElementById('setting-email').value = this.userData.email;
    }
    
    updateBirthdayMessage() {
        const birthdayMessage = document.getElementById('birthday-message');
        const countdownDays = document.getElementById('days');
        const countdownHours = document.getElementById('hours');
        
        if (this.userData.birthday === '--/--/----') {
            birthdayMessage.textContent = 'Complete seu perfil para ver mensagens especiais!';
            countdownDays.textContent = '--';
            countdownHours.textContent = '--';
            return;
        }
        
        // Lógica de mensagens de aniversário (simplificada)
        const messages = [
            { days: 365, message: 'Seu aniversário foi a pouco tempo, mas vamos nos preparar para o próximo!' },
            { days: 270, message: 'Ainda temos bastante tempo para descansar, aproveite seus bons momentos!' },
            { days: 180, message: 'Já foi metade do caminho?! Como o tempo voa...' },
            { days: 90, message: 'Acho que já podemos ir planejando sua festa com calma...' },
            { days: 30, message: 'Hora de checar a lista de itens de festa e mandar os convites!' },
            { days: 7, message: 'Eu ouvi bolo? É hora da contagem regressiva... Que venha a festa!' },
            { days: 0, message: 'Parabéns! Desejo a você, muita paz, saúde, prosperidade e felicidade!' }
        ];
        
        // Simular contagem regressiva
        const daysUntilBirthday = 45; // Exemplo
        const hoursUntilBirthday = 12; // Exemplo
        
        countdownDays.textContent = daysUntilBirthday;
        countdownHours.textContent = hoursUntilBirthday;
        
        // Encontrar mensagem apropriada
        const message = messages.find(m => daysUntilBirthday <= m.days)?.message || 
                       'Seu aniversário está chegando!';
        birthdayMessage.textContent = message;
    }
    
    openEditProfileModal() {
        // Criar modal de edição de perfil
        const modalContent = `
            <form class="modal-form" id="edit-profile-form">
                <div class="modal-form-group">
                    <label for="edit-avatar">Foto de Perfil</label>
                    <div class="avatar-upload">
                        <img id="avatar-preview" src="${this.userData.avatar}" alt="Avatar">
                        <input type="file" id="edit-avatar" accept="image/*">
                        <button type="button" class="btn-small" id="btn-remove-avatar">
                            <i class="fas fa-trash"></i> Remover
                        </button>
                    </div>
                </div>
                
                <div class="modal-form-group">
                    <label for="edit-name">Nome Completo</label>
                    <input type="text" id="edit-name" value="${this.userData.name}" required>
                </div>
                
                <div class="modal-form-group">
                    <label for="edit-birthday">Data de Nascimento</label>
                    <input type="date" id="edit-birthday" value="${this.formatDateForInput(this.userData.birthday)}">
                </div>
                
                <div class="modal-form-group">
                    <label for="edit-phone">Telefone</label>
                    <input type="tel" id="edit-phone" value="${this.userData.phone.replace('Telefone: ', '')}">
                </div>
                
                <div class="modal-form-group">
                    <label for="edit-music">Música Favorita</label>
                    <input type="text" id="edit-music" placeholder="Selecione uma música do dispositivo">
                    <button type="button" class="btn-small" id="btn-select-music">
                        <i class="fas fa-music"></i> Selecionar
                    </button>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn-secondary close-modal">Cancelar</button>
                    <button type="submit" class="btn-primary">Salvar Alterações</button>
                </div>
            </form>
        `;
        
        this.showModal('Editar Perfil', modalContent);
        
        // Configurar eventos do modal
        document.getElementById('edit-profile-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfileChanges();
        });
        
        document.getElementById('edit-avatar').addEventListener('change', (e) => {
            this.previewAvatar(e.target.files[0]);
        });
    }
    
    formatDateForInput(dateStr) {
        if (dateStr === '--/--/----') return '';
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month}-${day}`;
    }
    
    previewAvatar(file) {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('avatar-preview').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }
    
    async saveProfileChanges() {
        showLoading();
        try {
            // Simular salvamento
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Atualizar dados locais
            this.userData.name = document.getElementById('edit-name').value;
            this.userData.phone = `Telefone: ${document.getElementById('edit-phone').value}`;
            
            // Aqui você salvaria no Firestore
            // await updateDoc(doc(db, 'users', auth.currentUser.uid), {...});
            
            this.updateUI();
            this.closeModal();
            showToast('Perfil atualizado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao salvar perfil:', error);
            showToast('Erro ao salvar alterações', 'error');
        } finally {
            hideLoading();
        }
    }
    
    showModal(title, content) {
        const modal = document.getElementById('modal-profile');
        const modalHeader = modal.querySelector('.modal-header h2');
        const modalBody = modal.querySelector('.modal-body');
        
        modalHeader.innerHTML = `<i class="fas fa-user-edit"></i> ${title}`;
        modalBody.innerHTML = content;
        
        modal.classList.add('active');
        document.getElementById('modal-overlay').classList.add('active');
        
        // Fechar modal
        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });
    }
    
    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.getElementById('modal-overlay').classList.remove('active');
    }
}

// Sistema de inicialização do app
class CronoZApp {
    constructor() {
        this.navigation = null;
        this.userProfile = null;
        this.isInitialized = false;
        this.init();
    }
    
    init() {
        // Configurar eventos de autenticação
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.handleUserLoggedIn(user);
            } else {
                this.handleUserLoggedOut();
            }
        });
        
        // Configurar eventos do menu
        btnMenu?.addEventListener('click', () => this.navigation?.openSidebar());
        btnCloseMenu?.addEventListener('click', () => this.navigation?.closeSidebar());
        
        // Fechar sidebar ao clicar fora
        document.getElementById('modal-overlay')?.addEventListener('click', () => {
            this.navigation?.closeSidebar();
        });
        
        // Logout
        btnLogout?.addEventListener('click', () => this.logout());
        
        // Inicializar tema
        this.initTheme();
    }
    
    handleUserLoggedIn(user) {
        console.log('Usuário logado:', user.email);
        
        // Mostrar app, esconder login
        loginScreen.classList.remove('active');
        registerScreen.classList.remove('active');
        appScreen.classList.add('active');
        
        // Inicializar sistemas
        if (!this.isInitialized) {
            this.navigation = new NavigationSystem();
            this.userProfile = new UserProfile();
            this.isInitialized = true;
            
            // Mostrar mensagem de boas-vindas
            setTimeout(() => {
                showToast(`Bem-vindo de volta, ${user.displayName || 'Usuário'}!`, 'success');
            }, 500);
        }
        
        // Atualizar dados do usuário
        this.userProfile?.loadUserData();
    }
    
    handleUserLoggedOut() {
        console.log('Usuário deslogado');
        
        // Mostrar login, esconder app
        appScreen.classList.remove('active');
        loginScreen.classList.add('active');
        
        // Resetar estado
        this.isInitialized = false;
        this.navigation = null;
        this.userProfile = null;
    }
    
    async logout() {
        try {
            showLoading();
            await signOut(auth);
            showToast('Logout realizado com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            showToast('Erro ao fazer logout', 'error');
        } finally {
            hideLoading();
        }
    }
    
    initTheme() {
        // Carregar tema salvo
        const savedTheme = localStorage.getItem('cronoz-theme') || 'auto';
        const savedColor = localStorage.getItem('cronoz-color') || '#d4af37';
        
        // Aplicar tema
        this.applyTheme(savedTheme);
        this.applyColor(savedColor);
        
        // Configurar seletor de tema
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = savedTheme;
            themeSelect.addEventListener('change', (e) => {
                this.applyTheme(e.target.value);
                localStorage.setItem('cronoz-theme', e.target.value);
            });
        }
        
        // Configurar seletor de cor
        const colorPicker = document.getElementById('color-picker');
        const colorHex = document.getElementById('color-hex');
        const btnResetColor = document.getElementById('btn-reset-color');
        
        if (colorPicker && colorHex) {
            colorPicker.value = savedColor;
            colorHex.value = savedColor;
            
            colorPicker.addEventListener('input', (e) => {
                this.applyColor(e.target.value);
                colorHex.value = e.target.value;
                localStorage.setItem('cronoz-color', e.target.value);
            });
            
            colorHex.addEventListener('input', (e) => {
                const color = e.target.value;
                if (/^#[0-9A-F]{6}$/i.test(color)) {
                    this.applyColor(color);
                    colorPicker.value = color;
                    localStorage.setItem('cronoz-color', color);
                }
            });
            
            if (btnResetColor) {
                btnResetColor.addEventListener('click', () => {
                    const defaultColor = '#d4af37';
                    this.applyColor(defaultColor);
                    colorPicker.value = defaultColor;
                    colorHex.value = defaultColor;
                    localStorage.setItem('cronoz-color', defaultColor);
                });
            }
        }
    }
    
    applyTheme(theme) {
        const root = document.documentElement;
        
        if (theme === 'auto') {
            // Usar preferência do sistema
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.dataset.theme = prefersDark ? 'dark' : 'light';
        } else {
            root.dataset.theme = theme;
        }
    }
    
    applyColor(color) {
        const root = document.documentElement;
        root.style.setProperty('--primary-color', color);
        
        // Calcular variações
        const darker = this.adjustColor(color, -30);
        const lighter = this.adjustColor(color, 40);
        
        root.style.setProperty('--primary-dark', darker);
        root.style.setProperty('--primary-light', lighter);
    }
    
    adjustColor(hex, percent) {
        // Converte hex para RGB, ajusta brilho, converte de volta para hex
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        
        return '#' + (
            0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }
}

// Sistema de contatos (simplificado para exemplo)
class ContactsSystem {
    constructor() {
        this.contacts = [];
        this.init();
    }
    
    init() {
        // Botão adicionar contato
        document.getElementById('btn-add-contact')?.addEventListener('click', () => {
            this.openAddContactModal();
        });
        
        document.getElementById('btn-empty-add-contact')?.addEventListener('click', () => {
            this.openAddContactModal();
        });
        
        // Filtros
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.filterContacts(tab.dataset.filter);
            });
        });
        
        // Busca
        document.getElementById('contact-search')?.addEventListener('input', (e) => {
            this.searchContacts(e.target.value);
        });
        
        // Carregar contatos
        this.loadContacts();
    }
    
    async loadContacts() {
        // Simular carregamento de contatos
        this.contacts = [
            {
                id: '1',
                name: 'João Silva',
                email: 'joao@exemplo.com',
                phone: '(11) 99999-9999',
                avatar: 'assets/default-avatar.png',
                type: 'family',
                birthday: '15/03/1990',
                isFavorite: true
            },
            {
                id: '2',
                name: 'Maria Santos',
                email: 'maria@exemplo.com',
                phone: '(11) 98888-8888',
                avatar: 'assets/default-avatar.png',
                type: 'work',
                birthday: '22/07/1985',
                isFavorite: false
            }
        ];
        
        this.renderContacts();
    }
    
    renderContacts() {
        const container = document.getElementById('contacts-list');
        if (!container) return;
        
        if (this.contacts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-address-book fa-3x"></i>
                    <p>Nenhum contato adicionado</p>
                    <button class="btn-primary" id="btn-empty-add-contact">
                        <i class="fas fa-user-plus"></i> Adicionar Primeiro Contato
                    </button>
                </div>
            `;
            
            document.getElementById('btn-empty-add-contact')?.addEventListener('click', () => {
                this.openAddContactModal();
            });
            return;
        }
        
        container.innerHTML = this.contacts.map(contact => `
            <div class="contact-item" data-id="${contact.id}">
                <img src="${contact.avatar}" alt="Avatar" class="contact-avatar">
                <div class="contact-info">
                    <div class="contact-name">
                        ${contact.name}
                        ${contact.isFavorite ? '<span class="badge" style="background: var(--warning); color: #000;">★</span>' : ''}
                        <span class="badge" style="background: var(--primary-color); color: white;">
                            ${this.getTypeLabel(contact.type)}
                        </span>
                    </div>
                    <div class="contact-details">
                        <span><i class="fas fa-phone"></i> ${contact.phone}</span>
                        <span><i class="fas fa-envelope"></i> ${contact.email}</span>
                        <span><i class="fas fa-birthday-cake"></i> ${contact.birthday}</span>
                    </div>
                </div>
                <div class="contact-actions">
                    <button class="contact-action-btn btn-favorite" title="Favoritar">
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
        `).join('');
        
        // Adicionar eventos
        container.querySelectorAll('.btn-favorite').forEach((btn, index) => {
            btn.addEventListener('click', () => this.toggleFavorite(this.contacts[index].id));
        });
        
        container.querySelectorAll('.btn-edit').forEach((btn, index) => {
            btn.addEventListener('click', () => this.openEditContactModal(this.contacts[index].id));
        });
        
        container.querySelectorAll('.btn-chat').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                // Navegar para chat com este contato
                app.navigation.navigateTo('chat');
                // Aqui você iniciaria uma conversa
            });
        });
    }
    
    getTypeLabel(type) {
        const labels = {
            'all': 'Todos',
            'favorites': 'Favoritos',
            'family': 'Família',
            'work': 'Trabalho',
            'friends': 'Amigos'
        };
        return labels[type] || type;
    }
    
    filterContacts(filter) {
        console.log('Filtrando por:', filter);
        // Implementar filtragem real
    }
    
    searchContacts(query) {
        console.log('Buscando:', query);
        // Implementar busca real
    }
    
    toggleFavorite(contactId) {
        const contact = this.contacts.find(c => c.id === contactId);
        if (contact) {
            contact.isFavorite = !contact.isFavorite;
            this.renderContacts();
            showToast(
                contact.isFavorite ? 'Contato favoritado!' : 'Contato removido dos favoritos',
                'success'
            );
        }
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
                        <input type="checkbox" id="add-to-calendar">
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
        
        document.getElementById('add-contact-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addContact();
        });
    }
    
    openEditContactModal(contactId) {
        const contact = this.contacts.find(c => c.id === contactId);
        if (!contact) return;
        
        const modalContent = `
            <form class="modal-form" id="edit-contact-form">
                <div class="modal-form-group">
                    <label for="edit-contact-name">Nome Completo *</label>
                    <input type="text" id="edit-contact-name" value="${contact.name}" required>
                </div>
                
                <div class="modal-form-row">
                    <div class="modal-form-group">
                        <label for="edit-contact-email">Email</label>
                        <input type="email" id="edit-contact-email" value="${contact.email}">
                    </div>
                    
                    <div class="modal-form-group">
                        <label for="edit-contact-phone">Telefone</label>
                        <input type="tel" id="edit-contact-phone" value="${contact.phone}">
                    </div>
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
                    <label>
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
        
        document.getElementById('edit-contact-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateContact(contactId);
        });
        
        document.getElementById('btn-delete-contact').addEventListener('click', () => {
            if (confirm('Tem certeza que deseja excluir este contato?')) {
                this.deleteContact(contactId);
            }
        });
    }
    
    async addContact() {
        showLoading();
        try {
            // Simular adição de contato
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const newContact = {
                id: Date.now().toString(),
                name: document.getElementById('contact-name').value,
                email: document.getElementById('contact-email').value,
                phone: document.getElementById('contact-phone').value,
                avatar: 'assets/default-avatar.png',
                type: document.getElementById('contact-type').value,
                birthday: '', // Converter data depois
                isFavorite: false
            };
            
            this.contacts.push(newContact);
            this.renderContacts();
            this.closeModal();
            showToast('Contato adicionado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao adicionar contato:', error);
            showToast('Erro ao adicionar contato', 'error');
        } finally {
            hideLoading();
        }
    }
    
    async updateContact(contactId) {
        showLoading();
        try {
            const contact = this.contacts.find(c => c.id === contactId);
            if (contact) {
                contact.name = document.getElementById('edit-contact-name').value;
                contact.email = document.getElementById('edit-contact-email').value;
                contact.phone = document.getElementById('edit-contact-phone').value;
                contact.type = document.getElementById('edit-contact-type').value;
                contact.isFavorite = document.getElementById('edit-is-favorite').checked;
                
                this.renderContacts();
                this.closeModal();
                showToast('Contato atualizado com sucesso!', 'success');
            }
        } catch (error) {
            console.error('Erro ao atualizar contato:', error);
            showToast('Erro ao atualizar contato', 'error');
        } finally {
            hideLoading();
        }
    }
    
    async deleteContact(contactId) {
        showLoading();
        try {
            this.contacts = this.contacts.filter(c => c.id !== contactId);
            this.renderContacts();
            this.closeModal();
            showToast('Contato excluído com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao excluir contato:', error);
            showToast('Erro ao excluir contato', 'error');
        } finally {
            hideLoading();
        }
    }
    
    showModal(title, content) {
        const modal = document.getElementById('modal-contact');
        const modalHeader = modal.querySelector('.modal-header h2');
        const modalBody = modal.querySelector('.modal-body');
        
        modalHeader.innerHTML = `<i class="fas fa-user-plus"></i> ${title}`;
        modalBody.innerHTML = content;
        
        modal.classList.add('active');
        document.getElementById('modal-overlay').classList.add('active');
        
        // Fechar modal
        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });
    }
    
    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.getElementById('modal-overlay').classList.remove('active');
    }
}
```

// Sistema de calendário (simplificado)
class CalendarSystem {
    constructor() {
        this.currentDate = new Date();
        this.init();
    }
    
    init() {
        // Navegação do calendário
        document.getElementById('btn-prev-month')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });
        
        document.getElementById('btn-next-month')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });
        
        document.getElementById('btn-today')?.addEventListener('click', () => {
            this.currentDate = new Date();
            this.renderCalendar();
        });
        
        // Adicionar evento
        document.getElementById('btn-add-event')?.addEventListener('click', () => {
            this.openAddEventModal();
        });
        
        // Renderizar calendário inicial
        this.renderCalendar();
    }
    
    renderCalendar() {
        const monthElement = document.getElementById('current-month');
        const calendarGrid = document.getElementById('calendar-grid');
        
        if (!monthElement || !calendarGrid) return;
        
        // Atualizar título do mês
        const monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        
        monthElement.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        
        // Gerar dias do calendário
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const daysInMonth = lastDay.getDate();
        const firstDayIndex = firstDay.getDay();
        const today = new Date();
        
        let calendarHTML = '';
        
        // Dias do mês anterior
        const prevMonthLastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 0).getDate();
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            const date = prevMonthLastDay - i;
            calendarHTML += `
                <div class="calendar-day other-month">
                    <div class="date">${date}</div>
                </div>
            `;
        }
        
        // Dias do mês atual
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
            const isToday = date.toDateString() === today.toDateString();
            
            calendarHTML += `
                <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${date.toISOString()}">
                    <div class="date">${day}</div>
                    <div class="day-events">
                        <span class="event-indicator birthday"></span>
                        <span class="event-indicator event"></span>
                        <span class="event-indicator holiday"></span>
                    </div>
                </div>
            `;
        }
        
        // Dias do próximo mês
        const totalCells = 42; // 6 semanas * 7 dias
        const nextMonthDays = totalCells - (firstDayIndex + daysInMonth);
        for (let day = 1; day <= nextMonthDays; day++) {
            calendarHTML += `
                <div class="calendar-day other-month">
                    <div class="date">${day}</div>
                </div>
            `;
        }
        
        calendarGrid.innerHTML = calendarHTML;
        
        // Adicionar eventos aos dias
        calendarGrid.querySelectorAll('.calendar-day:not(.other-month)').forEach(day => {
            day.addEventListener('click', () => {
                const date = new Date(day.dataset.date);
                this.openDayEventsModal(date);
            });
        });
    }
    
    openAddEventModal() {
        const modalContent = `
            <form class="modal-form" id="add-event-form">
                <div class="modal-form-group">
                    <label for="event-title">Título do Evento *</label>
                    <input type="text" id="event-title" required placeholder="Ex: Aniversário do João">
                </div>
                
                <div class="modal-form-row">
                    <div class="modal-form-group">
                        <label for="event-date">Data</label>
                        <input type="date" id="event-date" required>
                    </div>
                    
                    <div class="modal-form-group">
                        <label for="event-time">Hora</label>
                        <input type="time" id="event-time">
                    </div>
                </div>
                
                <div class="modal-form-group">
                    <label for="event-type">Tipo de Evento</label>
                    <select id="event-type">
                        <option value="event">Evento</option>
                        <option value="birthday">Aniversário</option>
                        <option value="meeting">Reunião</option>
                        <option value="holiday">Feriado</option>
                        <option value="other">Outro</option>
                    </select>
                </div>
                
                <div class="modal-form-group">
                    <label for="event-description">Descrição</label>
                    <textarea id="event-description" rows="3" placeholder="Detalhes do evento..."></textarea>
                </div>
                
                <div class="modal-form-group">
                    <label>
                        <input type="checkbox" id="event-alarm" checked>
                        Ativar alarme
                    </label>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn-secondary close-modal">Cancelar</button>
                    <button type="submit" class="btn-primary">Adicionar Evento</button>
                </div>
            </form>
        `;
        
        this.showModal('Novo Evento', modalContent);
        
        // Preencher data atual
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('event-date').value = today;
        
        document.getElementById('add-event-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addEvent();
        });
    }
    
    openDayEventsModal(date) {
        const modalContent = `
            <div class="day-events-modal">
                <h3>Eventos para ${date.toLocaleDateString('pt-BR')}</h3>
                <div class="events-list" id="day-events-list">
                    <p>Nenhum evento para esta data.</p>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary close-modal">Fechar</button>
                    <button type="button" class="btn-primary" id="btn-add-event-to-day">
                        <i class="fas fa-plus"></i> Adicionar Evento
                    </button>
                </div>
            </div>
        `;
        
        this.showModal('Eventos do Dia', modalContent);
        
        document.getElementById('btn-add-event-to-day').addEventListener('click', () => {
            this.closeModal();
            this.openAddEventModal();
        });
    }
    
    async addEvent() {
        showLoading();
        try {
            // Simular adição de evento
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const eventData = {
                title: document.getElementById('event-title').value,
                date: document.getElementById('event-date').value,
                type: document.getElementById('event-type').value,
                description: document.getElementById('event-description').value,
                hasAlarm: document.getElementById('event-alarm').checked
            };
            
            console.log('Evento adicionado:', eventData);
            this.closeModal();
            this.renderCalendar();
            showToast('Evento adicionado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao adicionar evento:', error);
            showToast('Erro ao adicionar evento', 'error');
        } finally {
            hideLoading();
        }
    }
    
    showModal(title, content) {
        const modal = document.getElementById('modal-event');
        const modalHeader = modal.querySelector('.modal-header h2');
        const modalBody = modal.querySelector('.modal-body');
        
        modalHeader.innerHTML = `<i class="fas fa-calendar-plus"></i> ${title}`;
        modalBody.innerHTML = content;
        
        modal.classList.add('active');
        document.getElementById('modal-overlay').classList.add('active');
        
        // Fechar modal
        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });
    }
    
    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.getElementById('modal-overlay').classList.remove('active');
    }
}

// Inicializar aplicação
const app = new CronoZApp();
let contactsSystem = null;
let calendarSystem = null;

// Inicializar sistemas quando a página muda
document.addEventListener('pageChanged', (e) => {
    const page = e.detail;
    
    switch (page) {
        case 'contacts':
            if (!contactsSystem) {
                contactsSystem = new ContactsSystem();
            }
            break;
            
        case 'calendar':
            if (!calendarSystem) {
                calendarSystem = new CalendarSystem();
            }
            break;
            
        case 'chat':
            // Inicializar chat se necessário
            break;
            
        case 'tree':
            // Inicializar árvore se necessário
            break;
            
        case 'albums':
            // Inicializar álbuns se necessário
            break;
            
        case 'settings':
            // Configurações já inicializadas
            break;
    }
});

// Exportar para uso global (se necessário)
window.CronoZApp = app;
window.ContactsSystem = ContactsSystem;
window.CalendarSystem = CalendarSystem;

console.log('CronoZ App inicializado com sucesso!');