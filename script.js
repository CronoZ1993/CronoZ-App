// script.js - Sistema Central CronoZ v2.0
console.log('📱 CronoZ iniciando...');

// Variáveis globais
let auth, db, storage;
let currentUser = null;
let contactsManager = null;

// ======================
// INICIALIZAÇÃO DO APP
// ======================

// Aguarda o Firebase ser injetado pelo index.html
function waitForFirebase() {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (window.firebase && window.firebase.app) {
                clearInterval(checkInterval);
                initializeFirebase();
                resolve();
            }
        }, 100);
        
        // Timeout após 10 segundos
        setTimeout(() => {
            clearInterval(checkInterval);
            console.error('❌ Firebase não carregado após 10 segundos');
            showError('Erro de conexão com Firebase');
        }, 10000);
    });
}

function initializeFirebase() {
    try {
        // Configuração do Firebase (deve estar no index.html)
        const firebaseConfig = {
            apiKey: "AIzaSyBIvOoNLoVMqITyAVRI_9ASOIi9ANIlrkQ",
            authDomain: "cronoz-app-2026.firebaseapp.com",
            projectId: "cronoz-app-2026",
            storageBucket: "cronoz-app-2026.firebasestorage.app",
            messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
            appId: "YOUR_APP_ID"
        };

        // Inicializa Firebase
        const app = window.firebase.initializeApp(firebaseConfig);
        auth = window.firebase.auth(app);
        db = window.firebase.firestore(app);
        storage = window.firebase.storage(app);
        
        // Salva globalmente para outros módulos
        window.auth = auth;
        window.db = db;
        window.storage = storage;
        
        console.log('✅ Firebase conectado ao script.js');
        initApp();
        
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase:', error);
        showError('Erro na configuração do Firebase');
    }
}

function initApp() {
    // Configurar navegação
    setupNavigation();
    
    // Monitorar estado de autenticação
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('👤 Usuário logado:', user.email);
            currentUser = user;
            showApp();
            loadUserProfile(user);
        } else {
            showLogin();
        }
    });
    
    // Configurar tema
    setupTheme();
    
    // Configurar notificações
    setupNotifications();
}

// ======================
// NAVEGAÇÃO E TELAS
// ======================

function setupNavigation() {
    // Navegação do Rodapé
    const footerButtons = document.querySelectorAll('.footer-btn');
    footerButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const page = btn.getAttribute('data-page');
            navigateTo(page);
            
            // Atualizar botão ativo
            footerButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Navegação do Menu Lateral
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            navigateTo(page);
            
            // Fechar sidebar em mobile
            if (window.innerWidth < 768) {
                closeSidebar();
            }
        });
    });
    
    // Botão de Menu Hambúrguer
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }
    
    // Overlay do sidebar
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }
    
    // Botão de Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja sair?')) {
                auth.signOut().then(() => {
                    window.location.reload();
                });
            }
        });
    }
}

function navigateTo(page) {
    const content = document.getElementById('app-content');
    const pageTitle = document.getElementById('page-title');
    
    if (!content) return;
    
    // Títulos das páginas
    const titles = {
        'home': 'Início',
        'contacts': 'Contatos',
        'chat': 'Chat',
        'calendar': 'Calendário',
        'tree': 'Árvore Genealógica',
        'albums': 'Álbuns',
        'settings': 'Configurações'
    };
    
    // Atualizar título
    if (pageTitle) {
        pageTitle.textContent = titles[page] || 'CronoZ';
    }
    
    // Carregar conteúdo da página
    switch(page) {
        case 'home':
            content.innerHTML = createHomePage();
            loadHomePage();
            break;
            
        case 'contacts':
            content.innerHTML = createContactsPage();
            loadContactsPage();
            break;
            
        case 'chat':
            content.innerHTML = createChatPage();
            loadChatPage();
            break;
            
        case 'calendar':
            content.innerHTML = createCalendarPage();
            loadCalendarPage();
            break;
            
        case 'tree':
            content.innerHTML = createTreePage();
            loadTreePage();
            break;
            
        case 'albums':
            content.innerHTML = createAlbumsPage();
            loadAlbumsPage();
            break;
            
        case 'settings':
            content.innerHTML = createSettingsPage();
            loadSettingsPage();
            break;
            
        default:
            content.innerHTML = createHomePage();
            loadHomePage();
    }
    
    // Rolar para o topo
    window.scrollTo(0, 0);
}

// ======================
// TELA INICIAL / PERFIL
// ======================

function createHomePage() {
    return `
    <div class="page-content">
        <!-- Seção 1: Perfil do Usuário -->
        <div class="tray-card profile-section">
            <div class="profile-header">
                <div class="avatar-container" id="profile-avatar-container">
                    <div class="avatar-placeholder" id="profile-avatar">?</div>
                    <button class="avatar-edit-btn" onclick="editProfilePhoto()">
                        <i class="fas fa-camera"></i>
                    </button>
                </div>
                <div class="profile-info">
                    <h2 id="profile-name">Carregando...</h2>
                    <p id="profile-email">...</p>
                    <p id="profile-birthday"></p>
                </div>
                <button class="btn-icon edit-profile-btn" onclick="openProfileEdit()">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
            
            <div class="profile-stats">
                <div class="stat-item">
                    <i class="fas fa-users"></i>
                    <span id="contacts-count">0</span>
                    <small>Contatos</small>
                </div>
                <div class="stat-item">
                    <i class="fas fa-calendar"></i>
                    <span id="events-count">0</span>
                    <small>Eventos</small>
                </div>
                <div class="stat-item">
                    <i class="fas fa-tree"></i>
                    <span id="family-count">0</span>
                    <small>Familiares</small>
                </div>
            </div>
        </div>
        
        <!-- Seção 2: Mensagem de Aniversário -->
        <div class="tray-card birthday-message-section">
            <div class="section-header">
                <i class="fas fa-birthday-cake"></i>
                <h3>Contagem Regressiva</h3>
            </div>
            <div id="birthday-message" class="birthday-message">
                <p>Calculando dias para seu aniversário...</p>
            </div>
            <div id="birthday-countdown" class="countdown"></div>
        </div>
        
        <!-- Seção 3: Aniversários e Eventos Próximos -->
        <div class="tray-card upcoming-section">
            <div class="section-header">
                <h3>Próximos</h3>
                <div class="upcoming-tabs">
                    <button class="tab-btn active" data-tab="birthdays">
                        <i class="fas fa-birthday-cake"></i>
                        Aniversários
                    </button>
                    <button class="tab-btn" data-tab="events">
                        <i class="fas fa-calendar"></i>
                        Eventos
                    </button>
                </div>
            </div>
            
            <div class="tab-content active" id="birthdays-tab">
                <div id="upcoming-birthdays" class="upcoming-list">
                    <div class="loading">Carregando...</div>
                </div>
                <button class="btn-text" onclick="viewAllBirthdays()">
                    Ver todos os aniversários
                </button>
            </div>
            
            <div class="tab-content" id="events-tab">
                <div id="upcoming-events" class="upcoming-list">
                    <div class="loading">Carregando...</div>
                </div>
                <button class="btn-text" onclick="viewAllEvents()">
                    Ver todos os eventos
                </button>
            </div>
        </div>
        
        <!-- Quick Actions -->
        <div class="quick-actions">
            <button class="quick-action-btn" onclick="navigateTo('contacts')">
                <i class="fas fa-user-plus"></i>
                <span>Adicionar Contato</span>
            </button>
            <button class="quick-action-btn" onclick="addQuickEvent()">
                <i class="fas fa-calendar-plus"></i>
                <span>Novo Evento</span>
            </button>
            <button class="quick-action-btn" onclick="navigateTo('tree')">
                <i class="fas fa-tree"></i>
                <span>Árvore</span>
            </button>
        </div>
    </div>`;
}

async function loadHomePage() {
    if (!currentUser) return;
    
    try {
        // Carregar dados do usuário
        await loadUserProfile(currentUser);
        
        // Calcular mensagem de aniversário
        calculateBirthdayMessage();
        
        // Carregar contagens
        await loadCounts();
        
        // Carregar aniversários próximos
        await loadUpcomingBirthdays();
        
        // Carregar eventos próximos
        await loadUpcomingEvents();
        
        // Configurar tabs
        setupHomeTabs();
        
    } catch (error) {
        console.error('Erro ao carregar página inicial:', error);
        showNotification('Erro ao carregar dados da página inicial', 'error');
    }
}

async function loadUserProfile(user) {
    try {
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            const data = userDoc.data();
            
            // Atualizar elementos da página
            const profileName = document.getElementById('profile-name');
            const profileEmail = document.getElementById('profile-email');
            const profileBirthday = document.getElementById('profile-birthday');
            
            if (profileName) profileName.textContent = data.displayName || data.name || user.displayName || 'Usuário CronoZ';
            if (profileEmail) profileEmail.textContent = user.email;
            
            if (data.birthDate && profileBirthday) {
                const birthDate = data.birthDate.toDate ? data.birthDate.toDate() : new Date(data.birthDate);
                const formattedDate = birthDate.toLocaleDateString('pt-BR');
                profileBirthday.textContent = `🎂 ${formattedDate}`;
            }
            
            // Carregar foto de perfil se existir
            if (data.photoURL) {
                const avatar = document.getElementById('profile-avatar');
                if (avatar) {
                    avatar.style.backgroundImage = `url('${data.photoURL}')`;
                    avatar.textContent = '';
                }
            }
            
            return data;
        }
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
    }
}

function calculateBirthdayMessage() {
    const userData = currentUser.userData; // Supondo que isso seja carregado
    
    if (!userData || !userData.birthDate) {
        document.getElementById('birthday-message').innerHTML = 
            '<p>Adicione sua data de nascimento para ver a contagem regressiva!</p>';
        return;
    }
    
    const birthDate = userData.birthDate.toDate ? 
        userData.birthDate.toDate() : new Date(userData.birthDate);
    
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Data do próximo aniversário
    let nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
    if (nextBirthday < today) {
        nextBirthday.setFullYear(currentYear + 1);
    }
    
    // Calcular diferença em dias
    const diffTime = nextBirthday - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let message = '';
    let confetti = false;
    
    if (diffDays === 0) {
        message = "🎉🎂 PARABÉNS! 🎂🎉<br><strong>Hoje é o seu dia especial!</strong><br>Desejo a você muita paz, saúde, prosperidade e felicidade!";
        confetti = true;
    } else if (diffDays <= 7) {
        message = "Eu ouvi bolo? É hora da contagem regressiva... Que venha a festa!";
    } else if (diffDays <= 30) {
        message = "Hora de checar a lista de itens de festa e mandar os convites!";
    } else if (diffDays <= 90) {
        message = "Acho que já podemos ir planejando sua festa com calma...";
    } else if (diffDays <= 180) {
        message = "Já foi metade do caminho?! Como o tempo voa...";
    } else if (diffDays <= 270) {
        message = "Ainda temos bastante tempo para descansar, aproveite seus bons momentos!";
    } else {
        message = "Seu aniversário foi a pouco tempo, mas vamos nos preparar para o próximo!";
    }
    
    const messageElement = document.getElementById('birthday-message');
    const countdownElement = document.getElementById('birthday-countdown');
    
    messageElement.innerHTML = `<p>${message}</p>`;
    countdownElement.innerHTML = `<div class="countdown-item"><span>${diffDays}</span>dias</div>`;
    
    // Adicionar confetti se for o aniversário
    if (confetti) {
        triggerConfetti();
    }
}

async function loadCounts() {
    if (!currentUser) return;
    
    try {
        // Contar contatos
        const contactsRef = db.collection('users').doc(currentUser.uid).collection('contacts');
        const contactsSnapshot = await contactsRef.where('isBlocked', '==', false).get();
        document.getElementById('contacts-count').textContent = contactsSnapshot.size;
        
        // Contar eventos (exemplo)
        document.getElementById('events-count').textContent = '0';
        
        // Contar familiares (exemplo)
        document.getElementById('family-count').textContent = '0';
        
    } catch (error) {
        console.error('Erro ao carregar contagens:', error);
    }
}

async function loadUpcomingBirthdays() {
    const container = document.getElementById('upcoming-birthdays');
    if (!container) return;
    
    container.innerHTML = '<div class="empty-state">Nenhum aniversário próximo</div>';
    
    // Implementar lógica para carregar aniversários dos contatos
}

async function loadUpcomingEvents() {
    const container = document.getElementById('upcoming-events');
    if (!container) return;
    
    container.innerHTML = '<div class="empty-state">Nenhum evento próximo</div>';
    
    // Implementar lógica para carregar eventos
}

function setupHomeTabs() {
    const tabs = document.querySelectorAll('.upcoming-tabs .tab-btn');
    const contents = document.querySelectorAll('.upcoming-section .tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            // Remover classe ativa de todas as tabs
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // Adicionar classe ativa à tab clicada
            tab.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

// ======================
// TELA DE CONTATOS
// ======================

function createContactsPage() {
    return `
    <div class="page-content">
        <div class="page-header">
            <h2><i class="fas fa-users"></i> Contatos</h2>
            <div class="header-actions">
                <button class="btn-icon" id="import-contacts-btn" title="Importar contatos">
                    <i class="fas fa-file-import"></i>
                </button>
                <button class="btn primary" id="add-contact-btn">
                    <i class="fas fa-user-plus"></i> Adicionar
                </button>
            </div>
        </div>
        
        <div class="tabs">
            <button class="tab-btn active" id="friends-tab">
                <i class="fas fa-user-friends"></i> Amigos
            </button>
            <button class="tab-btn" id="blocked-tab">
                <i class="fas fa-ban"></i> Bloqueados
            </button>
        </div>
        
        <div class="tab-content active" id="friends-content">
            <div class="controls-bar">
                <div class="search-box">
                    <input type="text" id="contact-search" placeholder="Buscar contatos...">
                    <i class="fas fa-search"></i>
                </div>
                
                <div class="filters">
                    <select id="contact-filter" class="filter-select">
                        <option value="all">Todos</option>
                        <option value="favorite">Favoritos</option>
                        <option value="family">Família</option>
                        <option value="friend">Amigos</option>
                        <option value="work">Trabalho</option>
                        <option value="other">Outros</option>
                    </select>
                    
                    <select id="contact-sort" class="sort-select">
                        <option value="name-asc">Nome A-Z</option>
                        <option value="name-desc">Nome Z-A</option>
                        <option value="date-asc">Data ↑</option>
                        <option value="date-desc">Data ↓</option>
                    </select>
                </div>
            </div>
            
            <div class="contacts-list" id="contacts-list">
                <div class="loading">Carregando contatos...</div>
            </div>
        </div>
        
        <div class="tab-content" id="blocked-content">
            <div class="controls-bar">
                <div class="search-box">
                    <input type="text" id="blocked-search" placeholder="Buscar bloqueados...">
                    <i class="fas fa-search"></i>
                </div>
            </div>
            
            <div class="contacts-list" id="blocked-contacts-list">
                <div class="loading">Carregando contatos bloqueados...</div>
            </div>
        </div>
    </div>`;
}

async function loadContactsPage() {
    // Carregar o módulo de contatos se existir
    if (typeof ContactsManager !== 'undefined') {
        contactsManager = new ContactsManager();
    } else {
        // Tentar carregar o script
        const script = document.createElement('script');
        script.src = 'contacts.js';
        script.onload = () => {
            if (typeof ContactsManager !== 'undefined') {
                contactsManager = new ContactsManager();
            }
        };
        document.head.appendChild(script);
    }
    
    setupContactsEvents();
}

function setupContactsEvents() {
    // Tabs
    document.getElementById('friends-tab')?.addEventListener('click', () => {
        showContactsTab('friends');
    });
    
    document.getElementById('blocked-tab')?.addEventListener('click', () => {
        showContactsTab('blocked');
    });
    
    // Botão adicionar
    document.getElementById('add-contact-btn')?.addEventListener('click', () => {
        openAddContactModal();
    });
    
    // Botão importar
    document.getElementById('import-contacts-btn')?.addEventListener('click', () => {
        importDeviceContacts();
    });
    
    // Busca
    const searchInput = document.getElementById('contact-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchContacts(e.target.value);
        });
    }
    
    // Filtros
    const filterSelect = document.getElementById('contact-filter');
    const sortSelect = document.getElementById('contact-sort');
    
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            filterContacts();
        });
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            sortContacts();
        });
    }
}

function showContactsTab(tab) {
    // Atualizar tabs
    document.getElementById('friends-tab')?.classList.toggle('active', tab === 'friends');
    document.getElementById('blocked-tab')?.classList.toggle('active', tab === 'blocked');
    
    // Mostrar conteúdo
    document.getElementById('friends-content')?.classList.toggle('active', tab === 'friends');
    document.getElementById('blocked-content')?.classList.toggle('active', tab === 'blocked');
}

async function openAddContactModal() {
    // Implementar modal de adicionar contato
    showNotification('Funcionalidade em desenvolvimento', 'info');
}

async function importDeviceContacts() {
    // Implementar importação de contatos do dispositivo
    showNotification('Funcionalidade em desenvolvimento', 'info');
}

function searchContacts(query) {
    if (contactsManager && typeof contactsManager.searchContacts === 'function') {
        contactsManager.searchContacts(query);
    }
}

function filterContacts() {
    if (contactsManager && typeof contactsManager.filterContacts === 'function') {
        contactsManager.filterContacts();
    }
}

function sortContacts() {
    if (contactsManager && typeof contactsManager.sortContacts === 'function') {
        contactsManager.sortContacts();
    }
}

// ======================
// OUTRAS TELAS (ESQUELETO)
// ======================

function createChatPage() {
    return `
    <div class="page-content">
        <div class="page-header">
            <h2><i class="fas fa-comments"></i> Chat</h2>
        </div>
        <div class="tray-card">
            <h3>Chat em Tempo Real</h3>
            <p>Esta funcionalidade está em desenvolvimento.</p>
            <p>Incluirá:</p>
            <ul>
                <li>Conversas privadas</li>
                <li>Grupos</li>
                <li>Envio de arquivos</li>
                <li>Mensagens criptografadas</li>
            </ul>
        </div>
    </div>`;
}

function createCalendarPage() {
    return `
    <div class="page-content">
        <div class="page-header">
            <h2><i class="fas fa-calendar-alt"></i> Calendário</h2>
        </div>
        <div class="tray-card">
            <h3>Calendário Inteligente</h3>
            <p>Esta funcionalidade está em desenvolvimento.</p>
            <p>Incluirá:</p>
            <ul>
                <li>Visualização mensal/semanal</li>
                <li>Aniversários automáticos</li>
                <li>Fases da lua</li>
                <li>Feriados</li>
                <li>Exportação PDF</li>
            </ul>
        </div>
    </div>`;
}

function createTreePage() {
    return `
    <div class="page-content">
        <div class="page-header">
            <h2><i class="fas fa-tree"></i> Árvore Genealógica</h2>
        </div>
        <div class="tray-card">
            <h3>Árvore Genealógica Interativa</h3>
            <p>Esta funcionalidade está em desenvolvimento.</p>
            <p>Incluirá:</p>
            <ul>
                <li>Diagrama interativo</li>
                <li>Importação de contatos</li>
                <li>Linhas coloridas por parentesco</li>
                <li>Exportação para imagem/PDF</li>
            </ul>
        </div>
    </div>`;
}

function createAlbumsPage() {
    return `
    <div class="page-content">
        <div class="page-header">
            <h2><i class="fas fa-images"></i> Álbuns de Fotos</h2>
        </div>
        <div class="tray-card">
            <h3>Galeria de Fotos</h3>
            <p>Esta funcionalidade está em desenvolvimento.</p>
            <p>Incluirá:</p>
            <ul>
                <li>Albuns públicos/privados</li>
                <li>Compartilhamento com contatos</li>
                <li>Visualização em tela cheia</li>
                <li>Download controlado</li>
            </ul>
        </div>
    </div>`;
}

function createSettingsPage() {
    return `
    <div class="page-content">
        <div class="page-header">
            <h2><i class="fas fa-cog"></i> Configurações</h2>
        </div>
        
        <div class="settings-section">
            <h3><i class="fas fa-palette"></i> Aparência</h3>
            <div class="setting-item">
                <label>Tema</label>
                <select id="theme-select" class="setting-select">
                    <option value="auto">Seguir sistema</option>
                    <option value="light">Claro</option>
                    <option value="dark">Escuro</option>
                </select>
            </div>
            
            <div class="setting-item">
                <label>Cor de destaque</label>
                <input type="color" id="accent-color" value="#FFD700">
            </div>
        </div>
        
        <div class="settings-section">
            <h3><i class="fas fa-user-cog"></i> Conta</h3>
            <div class="setting-item">
                <button class="btn secondary" onclick="changeEmail()">
                    Alterar Email
                </button>
            </div>
            <div class="setting-item">
                <button class="btn secondary" onclick="changePassword()">
                    Alterar Senha
                </button>
            </div>
            <div class="setting-item">
                <button class="btn primary" onclick="backupData()">
                    <i class="fas fa-download"></i> Fazer Backup
                </button>
            </div>
        </div>
        
        <div class="settings-section">
            <h3><i class="fas fa-exclamation-triangle"></i> Zona de Perigo</h3>
            <div class="setting-item">
                <button class="btn danger" onclick="deleteAccount()">
                    <i class="fas fa-trash"></i> Excluir Conta Permanentemente
                </button>
                <p class="setting-description">Esta ação não pode ser desfeita.</p>
            </div>
        </div>
    </div>`;
}

function loadChatPage() {
    // Implementar chat
}

function loadCalendarPage() {
    // Implementar calendário
}

function loadTreePage() {
    // Implementar árvore genealógica
}

function loadAlbumsPage() {
    // Implementar álbuns
}

function loadSettingsPage() {
    loadThemeSettings();
    setupSettingsEvents();
}

function loadThemeSettings() {
    const theme = localStorage.getItem('cronoz-theme') || 'auto';
    const accentColor = localStorage.getItem('cronoz-accent-color') || '#FFD700';
    
    const themeSelect = document.getElementById('theme-select');
    const colorInput = document.getElementById('accent-color');
    
    if (themeSelect) themeSelect.value = theme;
    if (colorInput) colorInput.value = accentColor;
}

function setupSettingsEvents() {
    // Tema
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            localStorage.setItem('cronoz-theme', e.target.value);
            applyTheme();
        });
    }
    
    // Cor de destaque
    const colorInput = document.getElementById('accent-color');
    if (colorInput) {
        colorInput.addEventListener('change', (e) => {
            localStorage.setItem('cronoz-accent-color', e.target.value);
            applyTheme();
        });
    }
        }

// ======================
// FUNÇÕES DE UTILIDADE
// ======================

function showApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'block';
    document.body.classList.add('app-loaded');
    
    // Carregar página inicial por padrão
    navigateTo('home');
}

function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app-screen').style.display = 'none';
    document.body.classList.remove('app-loaded');
    
    setupLoginEvents();
}

function setupLoginEvents() {
    // Login com email/senha
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                showNotification('Preencha email e senha', 'warning');
                return;
            }
            
            try {
                await auth.signInWithEmailAndPassword(email, password);
            } catch (error) {
                showNotification('Erro no login: ' + error.message, 'error');
            }
        });
    }
    
    // Login com Google
    const googleBtn = document.getElementById('google-login-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                await auth.signInWithPopup(provider);
            } catch (error) {
                showNotification('Erro no login Google: ' + error.message, 'error');
            }
        });
    }
    
    // Registrar nova conta
    const registerBtn = document.getElementById('register-btn');
    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                showNotification('Preencha email e senha', 'warning');
                return;
            }
            
            try {
                await auth.createUserWithEmailAndPassword(email, password);
                
                // Criar perfil do usuário
                const user = auth.currentUser;
                const userRef = db.collection('users').doc(user.uid);
                
                await userRef.set({
                    email: user.email,
                    displayName: user.email.split('@')[0],
                    createdAt: new Date(),
                    theme: 'auto',
                    accentColor: '#FFD700'
                });
                
                showNotification('Conta criada com sucesso!', 'success');
                
            } catch (error) {
                showNotification('Erro ao registrar: ' + error.message, 'error');
            }
        });
    }
    
    // Permitir pressionar Enter para login
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loginBtn.click();
            }
        });
    }
}

function setupTheme() {
    applyTheme();
    
    // Observer para mudanças no tema do sistema
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeMediaQuery.addEventListener('change', applyTheme);
}

function applyTheme() {
    const savedTheme = localStorage.getItem('cronoz-theme') || 'auto';
    const accentColor = localStorage.getItem('cronoz-accent-color') || '#FFD700';
    
    let theme = savedTheme;
    
    if (theme === 'auto') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    document.body.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('--primary-color', accentColor);
    
    // Salvar no perfil do usuário se estiver logado
    if (currentUser) {
        const userRef = db.collection('users').doc(currentUser.uid);
        userRef.update({
            theme: savedTheme,
            accentColor: accentColor,
            updatedAt: new Date()
        }).catch(console.error);
    }
}

function setupNotifications() {
    // Sistema de notificações toast
    window.showNotification = function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remover após 5 segundos
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        // Fechar manualmente
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        });
    };
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-overlay';
    errorDiv.innerHTML = `
        <div class="error-content">
            <h3>❌ Erro</h3>
            <p>${message}</p>
            <button onclick="location.reload()" class="btn primary">Recarregar</button>
        </div>
    `;
    document.body.appendChild(errorDiv);
}

function triggerConfetti() {
    // Implementar confetti simples
    console.log('🎉 Confetti!');
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar && overlay) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ======================
// FUNÇÕES DE CONTA
// ======================

async function backupData() {
    if (!currentUser) return;
    
    try {
        // Coletar dados do usuário
        const userRef = db.collection('users').doc(currentUser.uid);
        const userData = await userRef.get();
        
        // Coletar contatos
        const contactsRef = db.collection('users').doc(currentUser.uid).collection('contacts');
        const contactsSnapshot = await contactsRef.get();
        const contactsData = contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Criar objeto de backup
        const backup = {
            user: userData.data(),
            contacts: contactsData,
            backupDate: new Date().toISOString(),
            appVersion: '1.0.0'
        };
        
        // Converter para JSON
        const jsonData = JSON.stringify(backup, null, 2);
        
        // Criar blob e download
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cronoz-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Backup criado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao criar backup:', error);
        showNotification('Erro ao criar backup', 'error');
    }
}

async function changeEmail() {
    const newEmail = prompt('Digite o novo email:');
    if (!newEmail) return;
    
    try {
        await currentUser.updateEmail(newEmail);
        
        // Atualizar no Firestore
        const userRef = db.collection('users').doc(currentUser.uid);
        await userRef.update({
            email: newEmail,
            updatedAt: new Date()
        });
        
        showNotification('Email atualizado com sucesso!', 'success');
    } catch (error) {
        showNotification('Erro ao atualizar email: ' + error.message, 'error');
    }
}

async function changePassword() {
    const newPassword = prompt('Digite a nova senha (mínimo 6 caracteres):');
    if (!newPassword || newPassword.length < 6) {
        showNotification('Senha deve ter pelo menos 6 caracteres', 'warning');
        return;
    }
    
    try {
        await currentUser.updatePassword(newPassword);
        showNotification('Senha atualizada com sucesso!', 'success');
    } catch (error) {
        showNotification('Erro ao atualizar senha: ' + error.message, 'error');
    }
}

async function deleteAccount() {
    if (!confirm('Tem certeza que deseja excluir sua conta permanentemente? Esta ação NÃO pode ser desfeita.')) {
        return;
    }
    
    const confirmText = prompt('Digite "EXCLUIR" para confirmar:');
    if (confirmText !== 'EXCLUIR') {
        showNotification('Exclusão cancelada', 'info');
        return;
    }
    
    try {
        // Excluir dados do Firestore
        const batch = db.batch();
        
        // Excluir contatos
        const contactsRef = db.collection('users').doc(currentUser.uid).collection('contacts');
        const contactsSnapshot = await contactsRef.get();
        contactsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // Excluir dados do usuário
        const userRef = db.collection('users').doc(currentUser.uid);
        batch.delete(userRef);
        
        await batch.commit();
        
        // Excluir conta de autenticação
        await currentUser.delete();
        
        showNotification('Conta excluída permanentemente', 'info');
        setTimeout(() => location.reload(), 2000);
        
    } catch (error) {
        console.error('Erro ao excluir conta:', error);
        showNotification('Erro ao excluir conta: ' + error.message, 'error');
    }
}

// ======================
// INICIALIZAÇÃO FINAL
// ======================

// Iniciar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM carregado, iniciando CronoZ...');
    waitForFirebase();
});

// Exportar funções globais
window.navigateTo = navigateTo;
window.editProfilePhoto = () => showNotification('Funcionalidade em desenvolvimento', 'info');
window.openProfileEdit = () => showNotification('Funcionalidade em desenvolvimento', 'info');
window.viewAllBirthdays = () => navigateTo('contacts');
window.viewAllEvents = () => navigateTo('calendar');
window.addQuickEvent = () => showNotification('Funcionalidade em desenvolvimento', 'info');
window.backupData = backupData;
window.changeEmail = changeEmail;
window.changePassword = changePassword;
window.deleteAccount = deleteAccount;
window.toggleSidebar = toggleSidebar;
```
