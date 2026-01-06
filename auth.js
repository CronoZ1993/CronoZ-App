// auth.js - Sistema de autenticação CORRIGIDO
import { 
    getAuth, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { app } from './firebase-config.js';

// Inicializar autenticação
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Elementos DOM
const btnLogin = document.getElementById('btn-login');
const btnGoogle = document.getElementById('btn-google');
const btnCreateAccount = document.getElementById('btn-create-account');
const btnBackToLogin = document.getElementById('btn-back-to-login');
const btnRegister = document.getElementById('btn-register');
const btnLogout = document.getElementById('btn-logout');

// Login com email/senha
if (btnLogin) {
    btnLogin.addEventListener('click', async () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            showToast('Preencha email e senha', 'error');
            return;
        }
        
        try {
            showLoading('Entrando...');
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('Login bem-sucedido:', userCredential.user.email);
            showToast('Login realizado!', 'success');
        } catch (error) {
            console.error('Erro no login:', error);
            showToast('Email ou senha incorretos', 'error');
            hideLoading();
        }
    });
}

// Login com Google
if (btnGoogle) {
    btnGoogle.addEventListener('click', async () => {
        try {
            showLoading('Conectando com Google...');
            const result = await signInWithPopup(auth, googleProvider);
            console.log('Google login:', result.user.email);
            showToast('Login Google realizado!', 'success');
        } catch (error) {
            console.error('Erro Google login:', error);
            showToast('Erro no login Google', 'error');
            hideLoading();
        }
    });
}

// Criar conta
if (btnCreateAccount) {
    btnCreateAccount.addEventListener('click', async () => {
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm').value;
        
        if (!name || !email || !password || !confirmPassword) {
            showToast('Preencha todos os campos', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showToast('As senhas não coincidem', 'error');
            return;
        }
        
        if (password.length < 6) {
            showToast('Senha deve ter 6+ caracteres', 'error');
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
            showToast('Conta criada com sucesso!', 'success');
            
            // 3. Voltar para login
            document.getElementById('register-screen').classList.remove('active');
            document.getElementById('login-screen').classList.add('active');
            
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
            
            showToast(message, 'error');
            hideLoading();
        }
    });
}

// Navegação entre telas
if (btnRegister) {
    btnRegister.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('register-screen').classList.add('active');
    });
}

if (btnBackToLogin) {
    btnBackToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-screen').classList.remove('active');
        document.getElementById('login-screen').classList.add('active');
    });
}

// Logout
if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
        if (confirm('Deseja sair da conta?')) {
            try {
                await signOut(auth);
                showToast('Logout realizado', 'success');
            } catch (error) {
                console.error('Erro ao fazer logout:', error);
            }
        }
    });
}

// Monitorar estado da autenticação
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Usuário logado
        console.log('Usuário autenticado:', user.email);
        
        // Mostrar app, esconder login
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('register-screen').classList.remove('active');
        document.getElementById('app-screen').classList.add('active');
        
        // Atualizar informações do usuário
        updateUserInfo(user);
        
    } else {
        // Usuário não logado
        console.log('Usuário não autenticado');
        
        // Mostrar login, esconder app
        document.getElementById('app-screen').classList.remove('active');
        document.getElementById('login-screen').classList.add('active');
    }
});

// Funções auxiliares (simplificadas)
function showToast(message, type = 'info') {
    console.log(`Toast ${type}:`, message);
    alert(message); // Temporário
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

function updateUserInfo(user) {
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const userAvatar = document.getElementById('user-avatar');
    
    if (userName) userName.textContent = user.displayName || 'Usuário';
    if (userEmail) userEmail.textContent = user.email || '';
    if (userAvatar) userAvatar.src = user.photoURL || 'assets/default-avatar.png';
}

console.log('Sistema de autenticação carregado!');
