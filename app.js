// app.js - NÚCLEO DO CRONOZ APP
import { auth, db } from './firebase-config.js';
import { 
    collection, 
    doc, 
    getDoc, 
    updateDoc,
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

class CronoZApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'home';
        this.theme = 'light';
        this.init();
    }

    async init() {
        // Carregar usuário atual
        await this.loadCurrentUser();
        
        // Aplicar tema salvo
        this.applyTheme();
        
        // Configurar navegação
        this.setupNavigation();
        
        // Carregar página inicial
        this.loadPage('home');
        
        // Escutar mudanças no usuário
        this.setupUserListener();
        
        // Configurar eventos do header
        this.setupHeaderEvents();
        
        console.log('CronoZ App inicializado!');
    }

    async loadCurrentUser() {
        const userId = localStorage.getItem('userId');
        const userData = localStorage.getItem('currentUser');
        
        if (userId && userData) {
            this.currentUser = JSON.parse(userData);
            
            // Atualizar dados em tempo real
            const userRef = doc(db, 'users', userId);
            onSnapshot(userRef, (doc) => {
                if (doc.exists()) {
                    this.currentUser = { ...this.currentUser, ...doc.data() };
                    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                    
                    // Atualizar interface se necessário
                    if (this.currentPage === 'home') {
                        this.renderHomePage();
                    }
                }
            });
        }
    }

    setupNavigation() {
        // Navegação inferior
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.navigateTo(page);
            });
        });

        // Botão menu
        document.getElementById('menuBtn')?.addEventListener('click', () => {
            this.toggleSideMenu();
        });

        // Botão perfil
        document.getElementById('profileBtn')?.addEventListener('click', () => {
            this.showProfileModal();
        });
    }

    navigateTo(page) {
        // Atualizar botões ativos
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

        // Atualizar título da página
        const pageTitles = {
            'home': 'Início',
            'contacts': 'Contatos',
            'chat': 'Chat',
            'calendar': 'Calendário',
            'tree': 'Árvore',
            'albums': 'Álbuns'
        };
        
        document.getElementById('currentPage').textContent = pageTitles[page] || page;
        
        // Carregar página
        this.loadPage(page);
        this.currentPage = page;
    }

    async loadPage(page) {
        const mainContent = document.getElementById('mainContent');
        
        // Mostrar loading
        mainContent.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Carregando ${page}...</p>
            </div>
        `;

        try {
            switch(page) {
                case 'home':
                    await this.renderHomePage();
                    break;
                    
                case 'contacts':
                    await this.renderContactsPage();
                    break;
                    
                case 'chat':
                    await this.renderChatPage();
                    break;
                    
                case 'calendar':
                    await this.renderCalendarPage();
                    break;
                    
                case 'tree':
                    await this.renderTreePage();
                    break;
                    
                case 'albums':
                    await this.renderAlbumsPage();
                    break;
                    
                default:
                    this.renderHomePage();
            }
        } catch (error) {
            console.error(`Erro ao carregar página ${page}:`, error);
            mainContent.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Erro ao carregar</h3>
                    <p>${error.message}</p>
                    <button class="btn-primary" onclick="app.loadPage('${page}')">
                        Tentar novamente
                    </button>
                </div>
            `;
        }
    }

    async renderHomePage() {
        const mainContent = document.getElementById('mainContent');
        
        if (!this.currentUser) {
            mainContent.innerHTML = '<p>Carregando perfil...</p>';
            return;
        }

        const birthDate = this.currentUser.birthDate;
        const birthdayMessage = this.getBirthdayMessage(birthDate);
        
        mainContent.innerHTML = `
            <div class="home-container">
                <!-- Seção 1: Perfil do Usuário -->
                <div class="card profile-section">
                    <div class="profile-header">
                        <div class="profile-avatar">
                            <img src="${this.currentUser.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(this.currentUser.displayName)}" 
                                 alt="${this.currentUser.displayName}">
                            <button class="edit-avatar-btn" onclick="app.editProfile()">
                                <i class="fas fa-camera"></i>
                            </button>
                        </div>
                        <div class="profile-info">
                            <h3>${this.currentUser.displayName}</h3>
                            <p class="profile-email">${this.currentUser.email}</p>
                            <p class="profile-birthdate">
                                <i class="fas fa-birthday-cake"></i>
                                ${birthDate ? this.formatDate(birthDate) : 'Data não informada'}
                            </p>
                        </div>
                    </div>
                    <button class="btn-secondary edit-profile-btn" onclick="app.editProfile()">
                        <i class="fas fa-edit"></i> Editar Perfil
                    </button>
                </div>

                <!-- Seção 2: Mensagem do Aniversário -->
                <div class="card birthday-message-section">
                    <div class="section-header">
                        <i class="fas fa-gift"></i>
                        <h3>Próximo Aniversário</h3>
                    </div>
                    <div class="birthday-content">
                        <p>${birthdayMessage}</p>
                        ${birthDate ? `
                            <div class="countdown">
                                <i class="fas fa-clock"></i>
                                <span>Faltam ${this.getDaysUntilBirthday(birthDate)} dias</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Seção 3: Atalhos Rápidos -->
                <div class="card shortcuts-section">
                    <div class="section-header">
                        <i class="fas fa-bolt"></i>
                        <h3>Atalhos</h3>
                    </div>
                    <div class="shortcuts-grid">
                        <div class="shortcut-item" onclick="app.navigateTo('contacts')">
                            <div class="shortcut-icon">
                                <i class="fas fa-user-friends"></i>
                            </div>
                            <span>Contatos</span>
                        </div>
                        
                        <div class="shortcut-item" onclick="app.navigateTo('calendar')">
                            <div class="shortcut-icon">
                                <i class="fas fa-calendar-day"></i>
                            </div>
                            <span>Eventos</span>
                        </div>
                        
                        <div class="shortcut-item" onclick="app.showUpcomingBirthdays()">
                            <div class="shortcut-icon">
                                <i class="fas fa-birthday-cake"></i>
                            </div>
                            <span>Aniversários</span>
                        </div>
                        
                        <div class="shortcut-item" onclick="app.navigateTo('chat')">
                            <div class="shortcut-icon">
                                <i class="fas fa-comment"></i>
                            </div>
                            <span>Mensagens</span>
                        </div>
                    </div>
                </div>

                <!-- Seção: Atividade Recente -->
                <div class="card activity-section">
                    <div class="section-header">
                        <i class="fas fa-history"></i>
                        <h3>Atividade Recente</h3>
                    </div>
                    <div class="activity-list">
                        <div class="activity-item">
                            <i class="fas fa-user-plus activity-icon"></i>
                            <div class="activity-details">
                                <p>Você adicionou um novo contato</p>
                                <span class="activity-time">Hoje, 10:30</span>
                            </div>
                        </div>
                        <div class="activity-item">
                            <i class="fas fa-calendar-plus activity-icon"></i>
                            <div class="activity-details">
                                <p>Evento adicionado ao calendário</p>
                                <span class="activity-time">Ontem, 15:45</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Adicionar estilos específicos da home
        this.addHomeStyles();
    }

    getBirthdayMessage(birthDate) {
        if (!birthDate) {
            return 'Adicione sua data de nascimento para ver mensagens personalizadas!';
        }

        const today = new Date();
        const birth = new Date(birthDate);
        const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
        
        if (nextBirthday < today) {
            nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
        }

        const diffTime = nextBirthday - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffMonths = Math.floor(diffDays / 30);

        if (diffDays === 0) {
            return '🎉 Parabéns! Desejo a você, muita paz, saúde, prosperidade e felicidade! Aproveite seu dia mais especial da melhor forma que puder!';
        } else if (diffDays <= 7) {
            return '🎂 Eu ouvi bolo? É hora da contagem regressiva... Que venha a festa!';
        } else if (diffMonths === 0) {
            return '✨ Esse mês é muito especial, vamos aproveitar ao máximo!';
        } else if (diffMonths === 1) {
            return '📝 Hora de checar a lista de itens de festa e mandar os convites!';
        } else if (diffMonths === 3) {
            return '🎯 Acho que já podemos ir planejando sua festa com calma...';
        } else if (diffMonths === 6) {
            return '⏳ Já foi metade do caminho?! Como o tempo voa...';
        } else if (diffMonths === 9) {
            return '😌 Ainda temos bastante tempo para descansar, aproveite seus bons momentos!';
        } else {
            return '🎁 Seu aniversário foi há pouco tempo, mas vamos nos preparar para o próximo!';
        }
    }

    getDaysUntilBirthday(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
        
        if (nextBirthday < today) {
            nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
        }
        
        const diffTime = nextBirthday - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    async editProfile() {
        const modalHtml = `
            <div class="modal-overlay active" id="profileModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Editar Perfil</h3>
                        <button class="close-modal" onclick="app.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Nome Completo</label>
                            <input type="text" id="editName" value="${this.currentUser.displayName}">
                        </div>
                        
                        <div class="form-group">
                            <label>Data de Nascimento</label>
                            <input type="date" id="editBirthDate" value="${this.currentUser.birthDate || ''}">
                        </div>
                        
                        <div class="form-group">
                            <label>Telefone</label>
                            <input type="tel" id="editPhone" value="${this.currentUser.phoneNumber || ''}">
                        </div>
                        
                        <div class="form-group">
                            <label>Foto de Perfil (URL)</label>
                            <input type="text" id="editPhotoURL" placeholder="Cole a URL da sua foto" 
                                   value="${this.currentUser.photoURL || ''}">
                        </div>
                        
                        <div class="form-actions">
                            <button class="btn-secondary" onclick="app.closeModal()">Cancelar</button>
                            <button class="btn-primary" onclick="app.saveProfile()">Salvar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.addModalStyles();
    }

    async saveProfile() {
        const name = document.getElementById('editName').value;
        const birthDate = document.getElementById('editBirthDate').value;
        const phone = document.getElementById('editPhone').value;
        const photoURL = document.getElementById('editPhotoURL').value;

        try {
            const userId = localStorage.getItem('userId');
            const userRef = doc(db, 'users', userId);
            
            await updateDoc(userRef, {
                displayName: name,
                birthDate: birthDate,
                phoneNumber: phone,
                photoURL: photoURL || '',
                updatedAt: new Date().toISOString()
            });

            // Atualizar usuário local
            this.currentUser.displayName = name;
            this.currentUser.birthDate = birthDate;
            this.currentUser.phoneNumber = phone;
            this.currentUser.photoURL = photoURL;
            
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            this.showMessage('Perfil atualizado com sucesso!', 'success');
            this.closeModal();
            
            // Recarregar página home
            if (this.currentPage === 'home') {
                this.renderHomePage();
            }
            
        } catch (error) {
            console.error('Erro ao salvar perfil:', error);
            this.showMessage('Erro ao salvar perfil', 'error');
        }
    }

    closeModal() {
        const modal = document.getElementById('profileModal');
        if (modal) {
            modal.remove();
        }
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

    applyTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.theme = savedTheme;
        document.body.setAttribute('data-theme', savedTheme);
    }

    setupUserListener() {
        onAuthStateChanged(auth, (user) => {
            if (!user) {
                // Usuário deslogou
                window.location.reload();
            }
        });
    }

    setupHeaderEvents() {
        // Notificações
        document.getElementById('notificationsBtn')?.addEventListener('click', () => {
            this.showNotifications();
        });
    }

    addHomeStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .home-container {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-lg);
            }
            
            .profile-section {
                animation: fadeIn 0.5s ease;
            }
            
            .profile-header {
                display: flex;
                align-items: center;
                gap: var(--spacing-lg);
                margin-bottom: var(--spacing-md);
            }
            
            .profile-avatar {
                position: relative;
                width: 80px;
                height: 80px;
            }
            
            .profile-avatar img {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid var(--primary-color);
            }
            
            .edit-avatar-btn {
                position: absolute;
                bottom: 0;
                right: 0;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                background: var(--primary-color);
                border: none;
                color: black;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .profile-info h3 {
                font-size: 1.5rem;
                margin-bottom: var(--spacing-xs);
            }
            
            .profile-email {
                color: var(--text-secondary);
                font-size: 0.9rem;
                margin-bottom: var(--spacing-xs);
            }
            
            .profile-birthdate {
                display: flex;
                align-items: center;
                gap: var(--spacing-xs);
                color: var(--primary-color);
                font-weight: 500;
            }
            
            .edit-profile-btn {
                width: 100%;
            }
            
            .section-header {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                margin-bottom: var(--spacing-md);
            }
            
            .section-header i {
                color: var(--primary-color);
                font-size: 1.2rem;
            }
            
            .section-header h3 {
                font-size: 1.2rem;
            }
            
            .birthday-content {
                text-align: center;
                padding: var(--spacing-md) 0;
            }
            
            .birthday-content p {
                font-size: 1.1rem;
                line-height: 1.6;
                margin-bottom: var(--spacing-md);
            }
            
            .countdown {
                display: inline-flex;
                align-items: center;
                gap: var(--spacing-sm);
                background: rgba(255, 215, 0, 0.1);
                padding: var(--spacing-sm) var(--spacing-md);
                border-radius: 50px;
                border: 1px solid var(--primary-color);
            }
            
            .countdown i {
                color: var(--primary-color);
            }
            
            .shortcuts-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: var(--spacing-md);
            }
            
            .shortcut-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: var(--spacing-lg);
                background: var(--surface-color);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                cursor: pointer;
                transition: var(--transition);
            }
            
            .shortcut-item:hover {
                transform: translateY(-4px);
                box-shadow: var(--shadow-md);
                border-color: var(--primary-color);
            }
            
            .shortcut-icon {
                width: 60px;
                height: 60px;
                background: rgba(255, 215, 0, 0.1);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: var(--spacing-sm);
            }
            
            .shortcut-icon i {
                font-size: 1.5rem;
                color: var(--primary-color);
            }
            
            .activity-list {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-md);
            }
            
            .activity-item {
                display: flex;
                align-items: center;
                gap: var(--spacing-md);
                padding: var(--spacing-md);
                background: var(--surface-color);
                border-radius: var(--border-radius);
                border: 1px solid var(--border-color);
            }
            
            .activity-icon {
                width: 40px;
                height: 40px;
                background: rgba(40, 167, 69, 0.1);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #28A745;
            }
            
            .activity-details p {
                font-weight: 500;
                margin-bottom: var(--spacing-xs);
            }
            
            .activity-time {
                font-size: 0.8rem;
                color: var(--text-secondary);
            }
            
            /* Modal */
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                animation: fadeIn 0.3s ease;
            }
            
            .modal-content {
                background: var(--surface-color);
                border-radius: var(--border-radius);
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
                animation: slideIn 0.3s ease;
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: var(--spacing-lg);
                border-bottom: 1px solid var(--border-color);
            }
            
            .modal-header h3 {
                margin: 0;
            }
            
            .close-modal {
                background: none;
                border: none;
                font-size: 1.2rem;
                color: var(--text-secondary);
                cursor: pointer;
            }
            
            .modal-body {
                padding: var(--spacing-lg);
            }
            
            .modal-body .form-group {
                margin-bottom: var(--spacing-lg);
            }
            
            .modal-body label {
                display: block;
                margin-bottom: var(--spacing-sm);
                font-weight: 500;
            }
            
            .modal-body input {
                width: 100%;
                padding: var(--spacing-md);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                background: var(--background-color);
                color: var(--text-color);
            }
            
            .form-actions {
                display: flex;
                gap: var(--spacing-md);
                margin-top: var(--spacing-xl);
            }
            
            .form-actions button {
                flex: 1;
            }
        `;
        
        document.head.appendChild(style);
    }

    addModalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    // Métodos para outras páginas (serão implementados em seus próprios módulos)
    async renderContactsPage() {
        mainContent.innerHTML = '<p>Carregando contatos...</p>';
        // Será substituído pelo contacts.js
    }

    async renderChatPage() {
        mainContent.innerHTML = '<p>Carregando chat...</p>';
        // Será substituído pelo chat.js
    }

    async renderCalendarPage() {
        mainContent.innerHTML = '<p>Carregando calendário...</p>';
        // Será substituído pelo calendar.js
    }

    async renderTreePage() {
        mainContent.innerHTML = '<p>Carregando árvore genealógica...</p>';
        // Será substituído pelo tree.js
    }

    async renderAlbumsPage() {
        mainContent.innerHTML = '<p>Carregando álbuns...</p>';
        // Será substituído pelo albums.js
    }

    showNotifications() {
        this.showMessage('Funcionalidade em desenvolvimento', 'info');
    }

    showProfileModal() {
        this.editProfile();
    }

    toggleSideMenu() {
        this.showMessage('Menu lateral em desenvolvimento', 'info');
    }

    showUpcomingBirthdays() {
        this.showMessage('Lista de aniversários em desenvolvimento', 'info');
    }
}

// Inicializar app
const app = new CronoZApp();
window.app = app; // Para acesso global

export default app;
```
