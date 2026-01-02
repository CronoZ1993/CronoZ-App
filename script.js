// script.js - CronoZ App com Firebase v12 - FUNCIONALIDADES COMPLETAS

// Variáveis globais
let currentUser = null;
let authInitialized = false;

// Inicializar Authentication
async function initAuth() {
    try {
        // Verificar se há usuário logado
        window.auth.onAuthStateChanged((user) => {
            if (user) {
                currentUser = user;
                console.log('✅ Usuário já logado:', user.email);
                showApp();
            } else {
                console.log('ℹ️ Nenhum usuário logado');
                showLogin();
            }
            authInitialized = true;
        });
    } catch (error) {
        console.error('❌ Erro na inicialização do Auth:', error);
    }
}

// Função para criar conta
async function criarConta(email, password, nome) {
    try {
        console.log('Criando conta para:', email);
        
        // Criar usuário no Firebase Auth
        const userCredential = await window.auth.createUserWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        
        // Atualizar nome do usuário
        if (nome) {
            await currentUser.updateProfile({
                displayName: nome
            });
        }
        
        // Criar documento do usuário no Firestore
        await window.db.collection('users').doc(currentUser.uid).set({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: nome || email.split('@')[0],
            createdAt: new Date(),
            lastLogin: new Date(),
            settings: {
                theme: 'light',
                notifications: true
            }
        });
        
        console.log('✅ Conta criada com sucesso:', currentUser.email);
        return currentUser;
        
    } catch (error) {
        console.error('❌ Erro ao criar conta:', error);
        throw error;
    }
}

// Função para login com email/senha
async function loginEmailSenha(email, password) {
    try {
        console.log('Tentando login:', email);
        const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
        currentUser = userCredential.user;
        
        // Atualizar último login no Firestore
        await window.db.collection('users').doc(currentUser.uid).update({
            lastLogin: new Date()
        });
        
        console.log('✅ Login bem-sucedido:', currentUser.email);
        return currentUser;
        
    } catch (error) {
        console.error('❌ Erro no login:', error);
        throw error;
    }
}

// Função para login com Google
async function loginGoogle() {
    try {
        console.log('Iniciando login com Google...');
        const provider = new window.GoogleAuthProvider();
        const result = await window.auth.signInWithPopup(provider);
        currentUser = result.user;
        
        // Verificar se é primeira vez (criar documento no Firestore)
        const userDoc = await window.db.collection('users').doc(currentUser.uid).get();
        
        if (!userDoc.exists) {
            await window.db.collection('users').doc(currentUser.uid).set({
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName || currentUser.email.split('@')[0],
                photoURL: currentUser.photoURL || '',
                provider: 'google',
                createdAt: new Date(),
                lastLogin: new Date(),
                settings: {
                    theme: 'light',
                    notifications: true
                }
            });
            console.log('✅ Novo usuário Google criado no Firestore');
        }
        
        console.log('✅ Login Google bem-sucedido:', currentUser.email);
        return currentUser;
        
    } catch (error) {
        console.error('❌ Erro no login Google:', error);
        throw error;
    }
}

// Função para logout
async function logout() {
    try {
        await window.auth.signOut();
        currentUser = null;
        console.log('✅ Logout realizado');
        return true;
    } catch (error) {
        console.error('❌ Erro no logout:', error);
        throw error;
    }
}

// Função para redefinir senha
async function redefinirSenha(email) {
    try {
        await window.auth.sendPasswordResetEmail(email);
        console.log('✅ Email de redefinição enviado para:', email);
        return true;
    } catch (error) {
        console.error('❌ Erro ao enviar email de redefinição:', error);
        throw error;
    }
}

// Mostrar tela de login
function showLogin() {
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    
    if (loginScreen && appScreen) {
        loginScreen.classList.add('active');
        loginScreen.style.display = 'block';
        appScreen.classList.remove('active');
        appScreen.style.display = 'none';
    }
}

// Mostrar tela do app
function showApp() {
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    
    if (loginScreen && appScreen) {
        loginScreen.classList.remove('active');
        loginScreen.style.display = 'none';
        appScreen.classList.add('active');
        appScreen.style.display = 'block';
        
        // Atualizar informações do usuário
        updateUserInfo();
        
        // Mostrar conteúdo inicial
        showHomePage();
    }
}

// Atualizar informações do usuário na UI
function updateUserInfo() {
    if (!currentUser) return;
    
    const elements = {
        'user-name': currentUser.displayName || currentUser.email.split('@')[0],
        'user-email': currentUser.email,
        'user-avatar': currentUser.photoURL || ''
    };
    
    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            if (id === 'user-avatar' && value) {
                element.src = value;
                element.style.display = 'block';
            } else if (id === 'user-avatar' && !value) {
                element.style.display = 'none';
            } else {
                element.textContent = value;
            }
        }
    }
}

// Mostrar página inicial
function showHomePage() {
    const content = document.getElementById('app-content');
    if (!content) return;
    
    content.innerHTML = `
        <div class="page-home" style="padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 60px; color: #FFD700; margin-bottom: 20px;">🎉</div>
                <h2>Bem-vindo ao CronoZ!</h2>
                <p style="color: #666;">${currentUser ? `Logado como: ${currentUser.email}` : ''}</p>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 30px;">
                <div class="card" onclick="testarFirestore()" style="background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center; cursor: pointer; border: 2px solid #FFD700;">
                    <div style="font-size: 30px; margin-bottom: 10px;">🔥</div>
                    <h4>Testar Firestore</h4>
                    <p style="color: #666; font-size: 14px;">Salvar dados no banco</p>
                </div>
                
                <div class="card" onclick="verificarUsuario()" style="background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center; cursor: pointer; border: 2px solid #6C63FF;">
                    <div style="font-size: 30px; margin-bottom: 10px;">👤</div>
                    <h4>Verificar Usuário</h4>
                    <p style="color: #666; font-size: 14px;">Ver informações da conta</p>
                </div>
                
                <div class="card" onclick="mostrarConfig()" style="background: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center; cursor: pointer; border: 2px solid #4CAF50;">
                    <div style="font-size: 30px; margin-bottom: 10px;">⚙️</div>
                    <h4>Configurações</h4>
                    <p style="color: #666; font-size: 14px;">Configurar app</p>
                </div>
            </div>
            
            <div id="test-result" style="margin-top: 30px;"></div>
        </div>
    `;
}

// Inicialização do App
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 CronoZ App inicializando...');
    
    // Aguardar Firebase carregar
    if (!window.auth || !window.db) {
        console.error('❌ Firebase não inicializado');
        setTimeout(() => location.reload(), 2000);
        return;
    }
    
    // Inicializar auth
    await initAuth();
    
    // Configurar eventos após auth inicializado
    setTimeout(() => setupEventListeners(), 500);
});

// Configurar event listeners
function setupEventListeners() {
    // Elementos
    const loginBtn = document.getElementById('login-btn');
    const googleLoginBtn = document.getElementById('google-login-btn');
    const registerLink = document.getElementById('register-link');
    const forgotPassword = document.getElementById('forgot-password');
    const logoutBtn = document.getElementById('logout-btn');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    // Login com Email/Senha
    if (loginBtn) {
        loginBtn.addEventListener('click', async function() {
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            
            if (!email || !password) {
                showMessage('Por favor, preencha email e senha', 'error');
                return;
            }
            
            try {
                // Mostrar loading
                const originalText = loginBtn.innerHTML;
                loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
                loginBtn.disabled = true;
                
                await loginEmailSenha(email, password);
                showApp();
                showMessage('Login realizado com sucesso!', 'success');
                
            } catch (error) {
                let message = 'Erro no login: ';
                switch(error.code) {
                    case 'auth/user-not-found':
                        message += 'Usuário não encontrado. Crie uma conta primeiro.';
                        break;
                    case 'auth/wrong-password':
                        message += 'Senha incorreta.';
                        break;
                    case 'auth/invalid-email':
                        message += 'Email inválido.';
                        break;
                    case 'auth/user-disabled':
                        message += 'Conta desativada.';
                        break;
                    case 'auth/too-many-requests':
                        message += 'Muitas tentativas. Tente mais tarde.';
                        break;
                    default:
                        message += error.message;
                }
                showMessage(message, 'error');
            } finally {
                // Restaurar botão
                if (loginBtn) {
                    loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
                    loginBtn.disabled = false;
                }
            }
        });
    }
    
    // Login com Google
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async function() {
            try {
                const originalText = googleLoginBtn.innerHTML;
                googleLoginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Conectando...';
                googleLoginBtn.disabled = true;
                
                await loginGoogle();
                showApp();
                showMessage('Login com Google realizado!', 'success');
                
            } catch (error) {
                let message = 'Erro no login Google: ';
                if (error.code === 'auth/popup-blocked') {
                    message += 'Popup bloqueado. Permita popups para este site.';
                } else if (error.code === 'auth/popup-closed-by-user') {
                    message += 'Popup fechado. Tente novamente.';
                } else {
                    message += error.message;
                }
                showMessage(message, 'error');
            } finally {
                if (googleLoginBtn) {
                    googleLoginBtn.innerHTML = '<i class="fab fa-google"></i> Continuar com Google';
                    googleLoginBtn.disabled = false;
                }
            }
        });
    }
    
    // Criar conta
    if (registerLink) {
        registerLink.addEventListener('click', async function(e) {
            e.preventDefault();
            
            const email = prompt('Digite seu email para cadastro:');
            if (!email || !email.includes('@')) {
                showMessage('Email inválido', 'error');
                return;
            }
            
            const nome = prompt('Digite seu nome (opcional):') || '';
            const password = prompt('Digite uma senha (mínimo 6 caracteres):');
            
            if (!password || password.length < 6) {
                showMessage('Senha deve ter pelo menos 6 caracteres', 'error');
                return;
            }
            
            try {
                await criarConta(email, password, nome);
                showApp();
                showMessage('✅ Conta criada com sucesso! Você está logado.', 'success');
                
            } catch (error) {
                let message = 'Erro ao criar conta: ';
                if (error.code === 'auth/email-already-in-use') {
                    message += 'Email já cadastrado. Faça login.';
                } else if (error.code === 'auth/invalid-email') {
                    message += 'Email inválido.';
                } else if (error.code === 'auth/weak-password') {
                    message += 'Senha muito fraca. Use pelo menos 6 caracteres.';
                } else {
                    message += error.message;
                }
                showMessage(message, 'error');
            }
        });
    }
    
    // Esqueci senha
    if (forgotPassword) {
        forgotPassword.addEventListener('click', async function(e) {
            e.preventDefault();
            
            const email = prompt('Digite seu email para redefinir senha:');
            if (!email) return;
            
            try {
                await redefinirSenha(email);
                showMessage('📧 Email de redefinição enviado! Verifique sua caixa de entrada.', 'success');
            } catch (error) {
                let message = 'Erro ao enviar email: ';
                if (error.code === 'auth/user-not-found') {
                    message += 'Email não cadastrado.';
                } else if (error.code === 'auth/invalid-email') {
                    message += 'Email inválido.';
                } else {
                    message += error.message;
                }
                showMessage(message, 'error');
            }
        });
    }
    
    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            if (confirm('Tem certeza que deseja sair?')) {
                try {
                    await logout();
                    showLogin();
                    showMessage('Logout realizado com sucesso!', 'info');
                } catch (error) {
                    showMessage('Erro ao sair: ' + error.message, 'error');
                }
            }
        });
    }
    
    // Menu mobile
    const menuBtn = document.getElementById('menu-btn');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('close-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.add('active');
            if (sidebarOverlay) sidebarOverlay.classList.add('active');
        });
        
        if (closeSidebar) {
            closeSidebar.addEventListener('click', () => {
                sidebar.classList.remove('active');
                if (sidebarOverlay) sidebarOverlay.classList.remove('active');
            });
        }
        
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            });
        }
    }
    
    // Navegação do footer
    const footerBtns = document.querySelectorAll('.footer-btn');
    footerBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            footerBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const page = this.dataset.page;
            navigateToPage(page);
        });
    });
    
    console.log('✅ Event listeners configurados!');
}

// Navegação entre páginas
function navigateToPage(page) {
    const pageTitle = document.getElementById('page-title');
    const content = document.getElementById('app-content');
    
    if (!content) return;
    
    const pages = {
        home: {
            title: 'Início',
            content: showHomePage
        },
        contacts: {
            title: 'Contatos',
            content: () => content.innerHTML = `
                <div class="page-contacts" style="padding: 20px;">
                    <h3><i class="fas fa-users"></i> Contatos</h3>
                    <p>Gerencie seus contatos e amigos.</p>
                    <button class="btn btn-primary" onclick="adicionarContato()" style="margin-top: 20px;">
                        <i class="fas fa-user-plus"></i> Adicionar Contato
                    </button>
                </div>
            `
        },
        chat: {
            title: 'Chat',
            content: () => content.innerHTML = `
                <div class="page-chat" style="padding: 20px;">
                    <h3><i class="fas fa-comment"></i> Chat</h3>
                    <p>Converse com seus contatos em tempo real.</p>
                    <div style="background: #f0f8ff; padding: 20px; border-radius: 10px; margin-top: 20px;">
                        <p>Funcionalidade em desenvolvimento...</p>
                    </div>
                </div>
            `
        },
        calendar: {
            title: 'Calendário',
            content: () => content.innerHTML = `
                <div class="page-calendar" style="padding: 20px;">
                    <h3><i class="fas fa-calendar"></i> Calendário</h3>
                    <p>Gerencie eventos, aniversários e compromissos.</p>
                </div>
            `
        },
        tree: {
            title: 'Árvore',
            content: () => content.innerHTML = `
                <div class="page-tree" style="padding: 20px;">
                    <h3><i class="fas fa-tree"></i> Árvore Genealógica</h3>
                    <p>Construa e visualize sua árvore familiar.</p>
                </div>
            `
        }
    };
    
    if (pages[page]) {
        if (pageTitle) pageTitle.textContent = pages[page].title;
        pages[page].content();
    }
}

// Funções auxiliares
function showMessage(message, type = 'info') {
    // Criar elemento de mensagem
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0
