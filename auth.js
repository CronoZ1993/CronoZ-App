// auth.js - Sistema de autenticação SIMPLIFICADO
console.log('Auth.js carregado');

// URLs do Firebase v9
const FIREBASE_AUTH_URL = 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';

// Configuração do seu projeto Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBIvOoNLoVMqITyAVRI_9ASOIi9ANIlrkQ",
    authDomain: "cronoz-app-2026.firebaseapp.com",
    projectId: "cronoz-app-2026",
    storageBucket: "cronoz-app-2026.firebasestorage.app",
    messagingSenderId: "961118541246",
    appId: "1:961118541246:web:5b8afd85ecfa41969795ef"
};

// Carregar Firebase dinamicamente
async function loadFirebaseAuth() {
    try {
        // Importar módulos
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js');
        const { 
            getAuth, 
            signInWithEmailAndPassword,
            createUserWithEmailAndPassword,
            signInWithPopup,
            GoogleAuthProvider,
            signOut,
            onAuthStateChanged,
            updateProfile
        } = await import(FIREBASE_AUTH_URL);
        
        // Inicializar Firebase
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const googleProvider = new GoogleAuthProvider();
        
        console.log('Firebase Auth carregado');
        
        // Configurar eventos
        setupAuthEvents(auth, googleProvider);
        
    } catch (error) {
        console.error('Erro ao carregar Firebase:', error);
        showError('Erro de conexão. Recarregue a página.');
    }
}

function setupAuthEvents(auth, googleProvider) {
    // Login com email/senha
    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) {
        btnLogin.addEventListener('click', async () => {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            if (!email || !password) {
                showError('Preencha email e senha');
                return;
            }
            
            try {
                showLoading('Entrando...');
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                console.log('Login bem-sucedido:', userCredential.user.email);
                showSuccess('Login realizado!');
            } catch (error) {
                console.error('Erro no login:', error);
                showError('Email ou senha incorretos');
                hideLoading();
            }
        });
    }
    
    // Login com Google
    const btnGoogle = document.getElementById('btn-google');
    if (btnGoogle) {
        btnGoogle.addEventListener('click', async () => {
            try {
                showLoading('Conectando com Google...');
                const result = await signInWithPopup(auth, googleProvider);
                console.log('Google login:', result.user.email);
                showSuccess('Login Google realizado!');
            } catch (error) {
                console.error('Erro Google login:', error);
                
                if (error.code === 'auth/popup-closed-by-user') {
                    showError('Login cancelado');
                } else {
                    showError('Erro no login Google');
                }
                hideLoading();
            }
        });
    }
    
    // Criar conta
    const btnCreateAccount = document.getElementById('btn-create-account');
    if (btnCreateAccount) {
        btnCreateAccount.addEventListener('click', async () => {
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm').value;
            
            if (!name || !email || !password || !confirmPassword) {
                showError('Preencha todos os campos');
                return;
            }
            
            if (password !== confirmPassword) {
                showError('As senhas não coincidem');
                return;
            }
            
            if (password.length < 6) {
                showError('Senha deve ter 6+ caracteres');
                return;
            }
            
            try {
                showLoading('Criando conta...');
                
                // 1. Criar usuário
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                
                // 2. Atualizar nome do perfil
                await updateProfile(user, {
                    displayName: name
                });
                
                console.log('Conta criada:', user.email);
                showSuccess('Conta criada com sucesso!');
                
                // 3. Limpar formulário
                document.getElementById('register-name').value = '';
                document.getElementById('register-email').value = '';
                document.getElementById('register-password').value = '';
                document.getElementById('register-confirm').value = '';
                
                // 4. Voltar para login
                setTimeout(() => {
                    document.getElementById('register-screen').classList.remove('active');
                    document.getElementById('login-screen').classList.add('active');
                }, 1500);
                
            } catch (error) {
                console.error('Erro ao criar conta:', error);
                
                let message = 'Erro ao criar conta';
                if (error.code === 'auth/email-already-in-use') {
                    message = 'Email já está em uso';
                } else if (error.code === 'auth/invalid-email') {
                    message = 'Email inválido';
                } else if (error.code === 'auth/weak-password') {
                    message = 'Senha muito fraca';
                }
                
                showError(message);
                hideLoading();
            }
        });
    }
    
    // Monitorar autenticação
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('Usuário autenticado:', user.email);
            handleUserLoggedIn(user);
        } else {
            console.log('Usuário não autenticado');
            handleUserLoggedOut();
        }
    });
}

function handleUserLoggedIn(user) {
    // Mostrar app
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('register-screen').classList.remove('active');
    document.getElementById('app-screen').classList.add('active');
    
    // Atualizar informações
    updateUserInfo(user);
    
    // Mostrar mensagem
    showSuccess(`Bem-vindo, ${user.displayName || 'Usuário'}!`);
}

function handleUserLoggedOut() {
    // Mostrar login
    document.getElementById('app-screen').classList.remove('active');
    document.getElementById('login-screen').classList.add('active');
}

function updateUserInfo(user) {
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const profileName = document.getElementById('profile-name');
    
    if (userName) userName.textContent = user.displayName || 'Usuário';
    if (userEmail) userEmail.textContent = user.email || '';
    if (profileName) profileName.textContent = user.displayName || 'Usuário';
}

// Funções auxiliares
function showError(message) {
    alert(`❌ ${message}`);
}

function showSuccess(message) {
    alert(`✅ ${message}`);
}

function showLoading(message) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.querySelector('p').textContent = message;
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'none';
}

// Navegação entre telas
document.getElementById('btn-register')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('register-screen').classList.add('active');
});

document.getElementById('btn-back-to-login')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('register-screen').classList.remove('active');
    document.getElementById('login-screen').classList.add('active');
});

// Logout
document.getElementById('btn-logout')?.addEventListener('click', async () => {
    if (confirm('Deseja sair da conta?')) {
        try {
            // Recarregar auth se necessário
            const { getAuth } = await import(FIREBASE_AUTH_URL);
            const auth = getAuth();
            await signOut(auth);
            showSuccess('Logout realizado');
        } catch (error) {
            console.error('Erro logout:', error);
        }
    }
});

// Iniciar quando DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('Iniciando auth system...');
    loadFirebaseAuth();
});
