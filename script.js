// script.js - Script principal unificado (alternativa para módulos)
// Este arquivo é para quem prefere não usar ES modules

console.log('CronoZ App - Script principal carregando...');

// Aguardar DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando app...');
    
    // Inicializar tema
    initTheme();
    
    // Inicializar navegação
    initNavigation();
    
    // Inicializar eventos de login
    initLoginEvents();
    
    // Inicializar sistema de perfil
    initProfileSystem();
    
    // Verificar autenticação
    checkAuthState();
});

// Sistema de tema
function initTheme() {
    const savedTheme = localStorage.getItem('cronoz-theme') || 'auto';
    const savedColor = localStorage.getItem('cronoz-color') || '#d4af37';
    
    applyTheme(savedTheme);
    applyColor(savedColor);
    
    // Configurar seletor de tema
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.value = savedTheme;
        themeSelect.addEventListener('change', function(e) {
            applyTheme(e.target.value);
            localStorage.setItem('cronoz-theme', e.target.value);
            showToast('Tema alterado', 'success');
        });
    }
    
    // Configurar seletor de cor
    const colorPicker = document.getElementById('color-picker');
    const colorHex = document.getElementById('color-hex');
    const btnResetColor = document.getElementById('btn-reset-color');
    
    if (colorPicker && colorHex) {
        colorPicker.value = savedColor;
        colorHex.value = savedColor;
        
        colorPicker.addEventListener('input', function(e) {
            applyColor(e.target.value);
            colorHex.value = e.target.value;
            localStorage.setItem('cronoz-color', e.target.value);
        });
        
        colorHex.addEventListener('input', function(e) {
            const color = e.target.value;
            if (/^#[0-9A-F]{6}$/i.test(color)) {
                applyColor(color);
                colorPicker.value = color;
                localStorage.setItem('cronoz-color', color);
            }
        });
        
        if (btnResetColor) {
            btnResetColor.addEventListener('click', function() {
                const defaultColor = '#d4af37';
                applyColor(defaultColor);
                colorPicker.value = defaultColor;
                colorHex.value = defaultColor;
                localStorage.setItem('cronoz-color', defaultColor);
                showToast('Cor restaurada', 'success');
            });
        }
    }
}

function applyTheme(theme) {
    const root = document.documentElement;
    
    if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.dataset.theme = prefersDark ? 'dark' : 'light';
    } else {
        root.dataset.theme = theme;
    }
}

function applyColor(color) {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', color);
    
    // Calcular variações
    const darker = adjustColor(color, -30);
    const lighter = adjustColor(color, 40);
    
    root.style.setProperty('--primary-dark', darker);
    root.style.setProperty('--primary-light', lighter);
}

function adjustColor(hex, percent) {
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

// Sistema de navegação
function initNavigation() {
    const bottomNavItems = document.querySelectorAll('.nav-item');
    const menuItems = document.querySelectorAll('.menu-item');
    const pages = document.querySelectorAll('.page');
    const currentPage = document.getElementById('current-page');
    const btnMenu = document.getElementById('btn-menu');
    const btnCloseMenu = document.getElementById('btn-close-menu');
    const sidebar = document.getElementById('sidebar');
    const modalOverlay = document.getElementById('modal-overlay');
    
    let currentPageName = 'home';
    
    // Navegação pelo rodapé
    bottomNavItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            navigateTo(this.dataset.page);
        });
    });
    
    // Navegação pelo menu lateral
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            navigateTo(this.dataset.page);
            closeSidebar();
        });
    });
    
    // Menu lateral
    if (btnMenu) {
        btnMenu.addEventListener('click', openSidebar);
    }
    
    if (btnCloseMenu) {
        btnCloseMenu.addEventListener('click', closeSidebar);
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeSidebar);
    }
    
    function navigateTo(page) {
        currentPageName = page;
        
        // Atualizar título
        if (currentPage) {
            currentPage.textContent = getPageTitle(page);
        }
        
        // Esconder todas as páginas
        pages.forEach(p => p.classList.remove('active'));
        
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
        menuItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });
        
        // Rolar para o topo
        const mainContent = document.querySelector('.main-content');
        if (mainContent) mainContent.scrollTo(0, 0);
        
        // Disparar evento
        window.dispatchEvent(new CustomEvent('pageChanged', { detail: page }));
    }
    
    function getPageTitle(page) {
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
    
    function openSidebar() {
        if (sidebar) sidebar.classList.add('active');
        if (modalOverlay) modalOverlay.classList.add('active');
    }
    
    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('active');
        if (modalOverlay) modalOverlay.classList.remove('active');
    }
    
    // Navegação inicial
    navigateTo('home');
}

// Sistema de login
function initLoginEvents() {
    const btnLogin = document.getElementById('btn-login');
    const btnGoogle = document.getElementById('btn-google');
    const btnRegister = document.getElementById('btn-register');
    const btnCreateAccount = document.getElementById('btn-create-account');
    const btnBackToLogin = document.getElementById('btn-back-to-login');
    const btnForgot = document.getElementById('btn-forgot');
    const loginScreen = document.getElementById('login-screen');
    const registerScreen = document.getElementById('register-screen');
    const appScreen = document.getElementById('app-screen');
    
    // Navegação entre telas
    if (btnRegister) {
        btnRegister.addEventListener('click', function(e) {
            e.preventDefault();
            if (loginScreen) loginScreen.classList.remove('active');
            if (registerScreen) registerScreen.classList.add('active');
        });
    }
    
    if (btnBackToLogin) {
        btnBackToLogin.addEventListener('click', function(e) {
            e.preventDefault();
            if (registerScreen) registerScreen.classList.remove('active');
            if (loginScreen) loginScreen.classList.add('active');
        });
    }
    
    // Login com email
    if (btnLogin) {
        btnLogin.addEventListener('click', function() {
            const email = document.getElementById('login-email')?.value;
            const password = document.getElementById('login-password')?.value;
            
            if (!email || !password) {
                showToast('Preencha email e senha', 'error');
                return;
            }
            
            simulateLogin(email, password);
        });
    }
    
    // Login com Google
    if (btnGoogle) {
        btnGoogle.addEventListener('click', function() {
            showLoading('Conectando com Google...');
            setTimeout(() => {
                hideLoading();
                handleUserLoggedIn({
                    email: 'usuario@gmail.com',
                    displayName: 'Usuário Google',
                    uid: 'google_' + Date.now()
                });
                showToast('Login com Google bem-sucedido!', 'success');
            }, 1500);
        });
    }
    
    // Criar conta
    if (btnCreateAccount) {
        btnCreateAccount.addEventListener('click', function() {
            const name = document.getElementById('register-name')?.value;
            const email = document.getElementById('register-email')?.value;
            const password = document.getElementById('register-password')?.value;
            const confirm = document.getElementById('register-confirm')?.value;
            
            if (!name || !email || !password || !confirm) {
                showToast('Preencha todos os campos', 'error');
                return;
            }
            
            if (password !== confirm) {
                showToast('As senhas não coincidem', 'error');
                return;
            }
            
            if (password.length < 6) {
                showToast('Senha deve ter pelo menos 6 caracteres', 'error');
                return;
            }
            
            simulateRegister(name, email, password);
        });
    }
    
    // Esqueci senha
    if (btnForgot) {
        btnForgot.addEventListener('click', function(e) {
            e.preventDefault();
            const email = prompt('Digite seu email para redefinir senha:');
            if (email) {
                showLoading('Enviando email de recuperação...');
                setTimeout(() => {
                    hideLoading();
                    showToast('Email de recuperação enviado!', 'success');
                }, 1500);
            }
        });
    }
    
    // Logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', function() {
            if (confirm('Deseja sair da conta?')) {
                handleUserLoggedOut();
                showToast('Logout realizado', 'success');
            }
        });
    }
}

function simulateLogin(email, password) {
    showLoading('Entrando...');
    
    setTimeout(() => {
        hideLoading();
        
        // Simulação - em produção seria Firebase Auth
        if (email && password) {
            handleUserLoggedIn({
                email: email,
                displayName: email.split('@')[0],
                uid: 'user_' + Date.now()
            });
            showToast('Login bem-sucedido!', 'success');
        } else {
            showToast('Email ou senha incorretos', 'error');
        }
    }, 1500);
}

function simulateRegister(name, email, password) {
    showLoading('Criando conta...');
    
    setTimeout(() => {
        hideLoading();
        
        // Simulação - em produção seria Firebase Auth
        handleUserLoggedIn({
            email: email,
            displayName: name,
            uid: 'user_' + Date.now()
        });
        showToast('Conta criada com sucesso!', 'success');
        
        // Voltar para tela de login (o sistema redirecionará)
        const registerScreen = document.getElementById('register-screen');
        const loginScreen = document.getElementById('login-screen');
        if (registerScreen) registerScreen.classList.remove('active');
        if (loginScreen) loginScreen.classList.add('active');
    }, 2000);
}

function checkAuthState() {
    // Verificar se já está logado (simulação)
    const isLoggedIn = localStorage.getItem('cronoz-user') !== null;
    
    if (isLoggedIn) {
        try {
            const user = JSON.parse(localStorage.getItem('cronoz-user'));
            handleUserLoggedIn(user);
        } catch (error) {
            handleUserLoggedOut();
        }
    }
}

function handleUserLoggedIn(user) {
    console.log('Usuário logado:', user.email);
    
    // Salvar usuário no localStorage (simulação)
    localStorage.setItem('cronoz-user', JSON.stringify(user));
    
    // Atualizar UI
    const loginScreen = document.getElementById('login-screen');
    const registerScreen = document.getElementById('register-screen');
    const appScreen = document.getElementById('app-screen');
    
    if (loginScreen) loginScreen.classList.remove('active');
    if (registerScreen) registerScreen.classList.remove('active');
    if (appScreen) appScreen.classList.add('active');
    
    // Atualizar informações do usuário
    updateUserInfo(user);
    
    // Carregar dados do perfil
    loadUserProfile();
}

function handleUserLoggedOut() {
    console.log('Usuário deslogado');
    
    // Remover usuário do localStorage
    localStorage.removeItem('cronoz-user');
    
    // Atualizar UI
    const appScreen = document.getElementById('app-screen');
    const loginScreen = document.getElementById('login-screen');
    
    if (appScreen) appScreen.classList.remove('active');
    if (loginScreen) loginScreen.classList.add('active');
}

// Sistema de perfil
function initProfileSystem() {
    const btnEditProfile = document.getElementById('btn-edit-profile');
    
    if (btnEditProfile) {
        btnEditProfile.addEventListener('click', openEditProfileModal);
    }
}

function updateUserInfo(user) {
    // Atualizar cabeçalho
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const userAvatar = document.getElementById('user-avatar');
    
    if (userName) userName.textContent = user.displayName || 'Usuário';
    if (userEmail) userEmail.textContent = user.email || '';
    if (userAvatar) userAvatar.src = user.photoURL || 'assets/default-avatar.png';
    
    // Atualizar perfil na página inicial
    const profileName = document.getElementById('profile-name');
    const profileAvatar = document.getElementById('profile-avatar');
    
    if (profileName) profileName.textContent = user.displayName || 'Usuário CronoZ';
    if (profileAvatar) profileAvatar.src = user.photoURL || 'assets/default-avatar.png';
}

async function loadUserProfile() {
    // Carregar dados do perfil do usuário
    const user = JSON.parse(localStorage.getItem('cronoz-user') || '{}');
    
    // Simular carregamento de dados
    setTimeout(() => {
        updateBirthdayMessage();
        updateUpcomingEvents();
    }, 500);
}

function openEditProfileModal() {
    const user = JSON.parse(localStorage.getItem('cronoz-user') || '{}');
    
    const modalContent = `
        <form class="modal-form" id="edit-profile-form">
            <div class="modal-form-group">
                <label for="edit-name">Nome Completo</label>
                <input type="text" id="edit-name" value="${user.displayName || ''}">
            </div>
            
            <div class="modal-form-group">
                <label for="edit-birthday">Data de Nascimento</label>
                <input type="date" id="edit-birthday">
            </div>
            
            <div class="modal-form-group">
                <label for="edit-phone">Telefone</label>
                <input type="tel" id="edit-phone" placeholder="(11) 99999-9999">
            </div>
            
            <div class="modal-actions">
                <button type="button" class="btn-secondary close-modal">Cancelar</button>
                <button type="submit" class="btn-primary">Salvar</button>
            </div>
        </form>
    `;
    
    showModal('Editar Perfil', modalContent);
    
    const form = document.getElementById('edit-profile-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProfileChanges();
        });
    }
}

function saveProfileChanges() {
    showLoading('Salvando alterações...');
    
    setTimeout(() => {
        hideLoading();
        closeModal();
        showToast('Perfil atualizado!', 'success');
    }, 1000);
}

function updateBirthdayMessage() {
    const birthdayMessage = document.getElementById('birthday-message');
    const countdownDays = document.getElementById('days');
    const countdownHours = document.getElementById('hours');
    
    if (!birthdayMessage || !countdownDays || !countdownHours) return;
    
    // Mensagens baseadas no tempo até o aniversário
    const messages = [
        { days: 365, message: 'Seu aniversário foi a pouco tempo, mas vamos nos preparar para o próximo!' },
        { days: 270, message: 'Ainda temos bastante tempo para descansar, aproveite seus bons momentos!' },
        { days: 180, message: 'Já foi metade do caminho?! Como o tempo voa...' },
        { days: 90, message: 'Acho que já podemos ir planejando sua festa com calma...' },
        { days: 30, message: 'Hora de checar a lista de itens de festa e mandar os convites!' },
        { days: 7, message: 'Eu ouvi bolo? É hora da contagem regressiva... Que venha a festa!' },
        { days: 0, message: 'Parabéns! Desejo a você, muita paz, saúde, prosperidade e felicidade!' }
    ];
    
    // Simular dias até aniversário
    const daysUntil = Math.floor(Math.random() * 400);
    const hoursUntil = Math.floor(Math.random() * 24);
    
    countdownDays.textContent = daysUntil;
    countdownHours.textContent = hoursUntil;
    
    // Encontrar mensagem apropriada
    const message = messages.find(m => daysUntil <= m.days)?.message || 
                   'Seu aniversário está chegando!';
    birthdayMessage.textContent = message;
}

function updateUpcomingEvents() {
    const upcomingBirthdays = document.getElementById('upcoming-birthdays');
    const upcomingEvents = document.getElementById('upcoming-events');
    
    if (upcomingBirthdays) {
        upcomingBirthdays.innerHTML = `
            <div class="upcoming-item">
                <div class="upcoming-avatar">
                    <i class="fas fa-birthday-cake"></i>
                </div>
                <div class="upcoming-info">
                    <div class="upcoming-name">João Silva</div>
                    <div class="upcoming-date">Em 15 dias</div>
                </div>
            </div>
            <div class="upcoming-item">
                <div class="upcoming-avatar">
                    <i class="fas fa-birthday-cake"></i>
                </div>
                <div class="upcoming-info">
                    <div class="upcoming-name">Maria Santos</div>
                    <div class="upcoming-date">Em 30 dias</div>
                </div>
            </div>
        `;
    }
    
    if (upcomingEvents) {
        upcomingEvents.innerHTML = `
            <div class="event-item">
                <div class="event-color" style="background: #4ECDC4"></div>
                <div class="event-details">
                    <div class="event-name">Reunião com equipe</div>
                    <div class="event-date">Amanhã, 14:00</div>
                </div>
            </div>
            <div class="event-item">
                <div class="event-color" style="background: #FF6B6B"></div>
                <div class="event-details">
                    <div class="event-name">Consulta médica</div>
                    <div class="event-date">28/01, 10:30</div>
                </div>
            </div>
        `;
    }
}

// Sistema de modais
function showModal(title, content) {
    const modal = document.getElementById('modal-profile') || 
                  document.getElementById('modal-contact') ||
                  document.getElementById('modal-event') ||
                  createModal();
    
    const modalHeader = modal.querySelector('.modal-header h2');
    const modalBody = modal.querySelector('.modal-body');
    
    if (modalHeader) modalHeader.textContent = title;
    if (modalBody) modalBody.innerHTML = content;
    
    modal.classList.add('active');
    document.getElementById('modal-overlay').classList.add('active');
    
    // Fechar modal
    modal.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
}

function createModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'dynamic-modal';
    modal.innerHTML = `
        <div class="modal-header">
            <h2></h2>
            <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body"></div>
    `;
    document.body.appendChild(modal);
    return modal;
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    const overlay = document.getElementById('modal-overlay');
    
    modals.forEach(modal => modal.classList.remove('active'));
    if (overlay) overlay.classList.remove('active');
}

// Sistema de toast
function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${icons[type] || icons.info}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Remover toast
    const removeToast = () => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    };
    
    toast.querySelector('.toast-close').addEventListener('click', removeToast);
    
    if (duration > 0) {
        setTimeout(removeToast, duration);
    }
}

// Sistema de loading
function showLoading(message = 'Carregando...') {
    const overlay = document.getElementById('loading-overlay');
    if (!overlay) return;
    
    const messageEl = overlay.querySelector('p');
    if (messageEl) {
        messageEl.textContent = message;
    }
    
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (!overlay) return;
    
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// Inicializar Service Worker para PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('service-worker.js')
            .then(function(registration) {
                console.log('ServiceWorker registrado:', registration.scope);
            })
            .catch(function(error) {
                console.log('Falha no ServiceWorker:', error);
            });
    });
}

// Monitorar conexão
window.addEventListener('online', function() {
    showToast('Conexão restaurada', 'success');
});

window.addEventListener('offline', function() {
    showToast('Conexão perdida - Modo offline', 'warning');
});

console.log('CronoZ App - Script principal carregado com sucesso!');