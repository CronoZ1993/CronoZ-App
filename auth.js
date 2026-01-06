// auth.js - Sistema de autenticação do CronoZ App
import { 
    auth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signInWithPopup,
    googleProvider,
    signOut,
    onAuthStateChanged,
    db,
    doc,
    setDoc
} from './firebase-config.js';
import { showLoading, hideLoading, showToast } from './utils.js';

// Elementos DOM
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const btnLogin = document.getElementById('btn-login');
const btnGoogle = document.getElementById('btn-google');
const btnRegister = document.getElementById('btn-register');
const btnForgot = document.getElementById('btn-forgot');
const btnCreateAccount = document.getElementById('btn-create-account');
const btnBackToLogin = document.getElementById('btn-back-to-login');
const registerName = document.getElementById('register-name');
const registerEmail = document.getElementById('register-email');
const registerPassword = document.getElementById('register-password');
const registerConfirm = document.getElementById('register-confirm');
const loginScreen = document.getElementById('login-screen');
const registerScreen = document.getElementById('register-screen');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');

class AuthSystem {
    constructor() {
        this.init();
    }
    
    init() {
        // Eventos de login
        btnLogin?.addEventListener('click', () => this.loginWithEmail());
        btnGoogle?.addEventListener('click', () => this.loginWithGoogle());
        btnForgot?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showForgotPassword();
        });
        
        // Eventos de registro
        btnRegister?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterScreen();
        });
        
        btnCreateAccount?.addEventListener('click', () => this.registerWithEmail());
        btnBackToLogin?.addEventListener('click', () => this.showLoginScreen());
        
        // Permitir login com Enter
        loginPassword?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.loginWithEmail();
            }
        });
        
        registerConfirm?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.registerWithEmail();
            }
        });
        
        // Monitorar estado da autenticação
        this.setupAuthListener();
    }
    
    async loginWithEmail() {
        const email = loginEmail?.value.trim();
        const password = loginPassword?.value;
        
        if (!email || !password) {
            this.showError(loginError, 'Por favor, preencha todos os campos.');
            return;
        }
        
        showLoading();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('Login bem-sucedido:', userCredential.user.email);
            showToast('Login realizado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro no login:', error);
            this.handleAuthError(error, loginError);
        } finally {
            hideLoading();
        }
    }
    
    async loginWithGoogle() {
        showLoading();
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            
            // Criar/atualizar documento do usuário no Firestore
            await this.createUserDocument(user);
            
            console.log('Login Google bem-sucedido:', user.email);
            showToast(`Bem-vindo, ${user.displayName || 'Usuário'}!`, 'success');
        } catch (error) {
            console.error('Erro no login Google:', error);
            this.handleAuthError(error, loginError);
        } finally {
            hideLoading();
        }
    }
    
    async registerWithEmail() {
        const name = registerName?.value.trim();
        const email = registerEmail?.value.trim();
        const password = registerPassword?.value;
        const confirmPassword = registerConfirm?.value;
        
        // Validações
        if (!name || !email || !password || !confirmPassword) {
            this.showError(registerError, 'Por favor, preencha todos os campos.');
            return;
        }
        
        if (password.length < 6) {
            this.showError(registerError, 'A senha deve ter no mínimo 6 caracteres.');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showError(registerError, 'As senhas não coincidem.');
            return;
        }
        
        showLoading();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Atualizar display name
            await this.updateUserProfile(user, name);
            
            // Criar documento do usuário no Firestore
            await this.createUserDocument(user, name);
            
            console.log('Registro bem-sucedido:', user.email);
            showToast('Conta criada com sucesso!', 'success');
            
            // Voltar para login (o auth listener cuidará do redirecionamento)
            this.showLoginScreen();
        } catch (error) {
            console.error('Erro no registro:', error);
            this.handleAuthError(error, registerError);
        } finally {
            hideLoading();
        }
    }
    
    async updateUserProfile(user, displayName) {
        try {
            await updateProfile(user, {
                displayName: displayName,
                // photoURL pode ser adicionado aqui se necessário
            });
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            // Não falhar o registro se apenas o display name falhar
        }
    }
    
    async createUserDocument(user, name = null) {
        try {
            const userDoc = {
                uid: user.uid,
                email: user.email,
                displayName: name || user.displayName || 'Usuário CronoZ',
                photoURL: user.photoURL || 'assets/default-avatar.png',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                settings: {
                    theme: 'auto',
                    accentColor: '#d4af37',
                    notifications: true,
                    privacy: {
                        profile: 'contacts',
                        calendar: 'contacts'
                    }
                }
            };
            
            await setDoc(doc(db, 'users', user.uid), userDoc, { merge: true });
            console.log('Documento do usuário criado/atualizado:', user.uid);
        } catch (error) {
            console.error('Erro ao criar documento do usuário:', error);
            // Não falhar o login/registro se o Firestore falhar
        }
    }
    
    async showForgotPassword() {
        const email = prompt('Digite seu email para redefinir a senha:');
        if (!email) return;
        
        showLoading();
        try {
            await sendPasswordResetEmail(auth, email);
            showToast('Email de recuperação enviado! Verifique sua caixa de entrada.', 'success');
        } catch (error) {
            console.error('Erro ao enviar email de recuperação:', error);
            this.handleAuthError(error);
        } finally {
            hideLoading();
        }
    }
    
    showLoginScreen() {
        loginScreen?.classList.add('active');
        registerScreen?.classList.remove('active');
        this.clearErrors();
    }
    
    showRegisterScreen() {
        loginScreen?.classList.remove('active');
        registerScreen?.classList.add('active');
        this.clearErrors();
    }
    
    showError(element, message) {
        if (element) {
            element.textContent = message;
            element.classList.add('show');
            setTimeout(() => {
                element.classList.remove('show');
            }, 5000);
        } else {
            showToast(message, 'error');
        }
    }
    
    clearErrors() {
        loginError?.classList.remove('show');
        registerError?.classList.remove('show');
    }
    
    handleAuthError(error, errorElement = null) {
        let message = 'Ocorreu um erro na autenticação.';
        
        switch (error.code) {
            case 'auth/invalid-email':
                message = 'Email inválido.';
                break;
            case 'auth/user-disabled':
                message = 'Esta conta foi desativada.';
                break;
            case 'auth/user-not-found':
                message = 'Usuário não encontrado.';
                break;
            case 'auth/wrong-password':
                message = 'Senha incorreta.';
                break;
            case 'auth/email-already-in-use':
                message = 'Este email já está em uso.';
                break;
            case 'auth/weak-password':
                message = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
                break;
            case 'auth/operation-not-allowed':
                message = 'Operação não permitida. Contate o suporte.';
                break;
            case 'auth/popup-closed-by-user':
                message = 'Login com Google cancelado.';
                break;
            case 'auth/popup-blocked':
                message = 'Popup bloqueado. Permitir popups para este site.';
                break;
            case 'auth/network-request-failed':
                message = 'Erro de conexão. Verifique sua internet.';
                break;
            default:
                message = error.message || 'Erro desconhecido.';
        }
        
        if (errorElement) {
            this.showError(errorElement, message);
        } else {
            showToast(message, 'error');
        }
    }
    
    setupAuthListener() {
        onAuthStateChanged(auth, (user) => {
            // O app.js principal cuidará do redirecionamento
            // Esta função é apenas para garantir que o auth system
            // esteja monitorando as mudanças de estado
            if (user) {
                console.log('Auth: Usuário logado:', user.email);
                
                // Atualizar último login no Firestore
                this.updateLastLogin(user.uid);
            } else {
                console.log('Auth: Usuário deslogado');
            }
        });
    }
    
    async updateLastLogin(uid) {
        try {
            await updateDoc(doc(db, 'users', uid), {
                lastLogin: new Date().toISOString()
            });
        } catch (error) {
            console.error('Erro ao atualizar último login:', error);
        }
    }
    
    async logout() {
        try {
            await signOut(auth);
            console.log('Logout realizado');
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            showToast('Erro ao fazer logout', 'error');
        }
    }
}

// Inicializar sistema de autenticação
const authSystem = new AuthSystem();

// Exportar para uso global (se necessário)
window.AuthSystem = authSystem;
window.logout = () => authSystem.logout();

console.log('Sistema de autenticação inicializado!');

// Importar funções do Firebase que não foram importadas inicialmente
import { 
    updateProfile, 
    sendPasswordResetEmail,
    updateDoc 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// Exportar funções úteis para outros módulos
export const loginWithEmail = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const registerWithEmail = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

export const loginWithGoogle = () => {
    return signInWithPopup(auth, googleProvider);
};

export const getCurrentUser = () => {
    return auth.currentUser;
};

export const isUserLoggedIn = () => {
    return !!auth.currentUser;
};

// Função para obter token JWT (útil para APIs)
export const getIdToken = async () => {
    if (auth.currentUser) {
        return await auth.currentUser.getIdToken();
    }
    return null;
};

// Função para verificar se o email está verificado
export const isEmailVerified = () => {
    return auth.currentUser?.emailVerified || false;
};

// Função para enviar verificação de email
export const sendEmailVerification = async () => {
    if (auth.currentUser) {
        try {
            await sendEmailVerification(auth.currentUser);
            showToast('Email de verificação enviado!', 'success');
            return true;
        } catch (error) {
            console.error('Erro ao enviar verificação:', error);
            showToast('Erro ao enviar verificação', 'error');
            return false;
        }
    }
    return false;
};

// Função para redefinir senha
export const resetPassword = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        showToast('Email de recuperação enviado!', 'success');
        return true;
    } catch (error) {
        console.error('Erro ao enviar email de recuperação:', error);
        authSystem.handleAuthError(error);
        return false;
    }
};

// Middleware para proteger rotas (exemplo)
export const requireAuth = (callback) => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            callback(user);
        } else {
            // Redirecionar para login
            window.location.hash = '#login';
        }
    });
};

// Função para atualizar perfil do usuário
export const updateUserProfile = async (updates) => {
    if (!auth.currentUser) return false;
    
    try {
        await updateProfile(auth.currentUser, updates);
        showToast('Perfil atualizado com sucesso!', 'success');
        return true;
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        showToast('Erro ao atualizar perfil', 'error');
        return false;
    }
};

// Função para deletar conta (requer reautenticação)
export const deleteUserAccount = async () => {
    if (!auth.currentUser) return false;
    
    if (confirm('Tem certeza que deseja excluir sua conta? Esta ação é irreversível.')) {
        showLoading();
        try {
            await auth.currentUser.delete();
            showToast('Conta excluída com sucesso', 'success');
            return true;
        } catch (error) {
            console.error('Erro ao excluir conta:', error);
            
            if (error.code === 'auth/requires-recent-login') {
                showToast('Reautenticação necessária para excluir conta.', 'warning');
                // Aqui você poderia pedir para o usuário fazer login novamente
                const password = prompt('Digite sua senha para confirmar exclusão:');
                if (password) {
                    const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
                    await reauthenticateWithCredential(auth.currentUser, credential);
                    return await deleteUserAccount(); // Tentar novamente
                }
            } else {
                showToast('Erro ao excluir conta', 'error');
            }
            return false;
        } finally {
            hideLoading();
        }
    }
    return false;
};

// Inicialização automática quando o DOM carrega
document.addEventListener('DOMContentLoaded', () => {
    // Preencher email se já existir no localStorage (opcional)
    const savedEmail = localStorage.getItem('cronoz-last-email');
    if (savedEmail && loginEmail) {
        loginEmail.value = savedEmail;
    }
    
    // Salvar email ao fazer login
    const originalLogin = btnLogin.onclick;
    btnLogin.onclick = () => {
        if (loginEmail.value) {
            localStorage.setItem('cronoz-last-email', loginEmail.value);
        }
        if (originalLogin) originalLogin();
    };
});

console.log('Módulo de autenticação carregado completamente!');