// auth.js
import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { 
    doc, 
    setDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

class AuthSystem {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthState();
    }

    setupEventListeners() {
        // Login com Email/Senha
        document.getElementById('loginBtn')?.addEventListener('click', () => this.login());
        
        // Login com Google
        document.getElementById('googleLoginBtn')?.addEventListener('click', () => this.loginWithGoogle());
        
        // Registrar nova conta
        document.getElementById('registerBtn')?.addEventListener('click', () => this.register());
        
        // Sair do app
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
        
        // Tecla Enter no login
        document.getElementById('password')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
    }

    async login() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            this.showMessage('Preencha todos os campos', 'error');
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            this.showMessage('Login realizado com sucesso!', 'success');
            await this.loadUserProfile(user.uid);
            this.showApp();
            
        } catch (error) {
            console.error('Erro no login:', error);
            this.showMessage(this.getErrorMessage(error.code), 'error');
        }
    }

    async loginWithGoogle() {
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const user = userCredential.user;
            
            // Verificar se é primeiro login
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            
            if (!userDoc.exists()) {
                // Criar perfil para novo usuário Google
                await this.createUserProfile(user);
            }
            
            this.showMessage('Login Google realizado!', 'success');
            this.showApp();
            
        } catch (error) {
            console.error('Erro no login Google:', error);
            this.showMessage(this.getErrorMessage(error.code), 'error');
        }
    }

    async register() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            this.showMessage('Preencha todos os campos', 'error');
            return;
        }

        if (password.length < 6) {
            this.showMessage('Senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Criar perfil do usuário
            await this.createUserProfile(user);
            
            this.showMessage('Conta criada com sucesso!', 'success');
            this.showApp();
            
        } catch (error) {
            console.error('Erro no registro:', error);
            this.showMessage(this.getErrorMessage(error.code), 'error');
        }
    }

    async createUserProfile(user) {
        try {
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                photoURL: user.photoURL || '',
                phoneNumber: user.phoneNumber || '',
                birthDate: '',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                settings: {
                    theme: 'system',
                    primaryColor: '#FFD700',
                    language: 'pt-BR',
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                }
            };

            await setDoc(doc(db, 'users', user.uid), userData);
            console.log('Perfil do usuário criado:', user.uid);
            
        } catch (error) {
            console.error('Erro ao criar perfil:', error);
        }
    }

    async loadUserProfile(userId) {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                
                // Atualizar último login
                await setDoc(doc(db, 'users', userId), {
                    lastLogin: new Date().toISOString()
                }, { merge: true });
                
                // Salvar no localStorage para uso no app
                localStorage.setItem('currentUser', JSON.stringify(userData));
                localStorage.setItem('userId', userId);
                
                return userData;
            }
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
        }
        return null;
    }

    checkAuthState() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Usuário está logado
                await this.loadUserProfile(user.uid);
                this.showApp();
            } else {
                // Usuário não está logado
                this.showLogin();
            }
        });
    }

    async logout() {
        try {
            await signOut(auth);
            localStorage.clear();
            this.showMessage('Você saiu da conta', 'info');
            this.showLogin();
        } catch (error) {
            console.error('Erro ao sair:', error);
            this.showMessage('Erro ao sair da conta', 'error');
        }
    }

    showLogin() {
        document.getElementById('loginScreen').classList.add('active');
        document.getElementById('appScreen').classList.remove('active');
    }

    showApp() {
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('appScreen').classList.add('active');
        
        // Iniciar o app principal
        if (typeof app !== 'undefined') {
            app.init();
        }
    }

    showMessage(message, type = 'info') {
        // Criar elemento de mensagem
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Estilos da mensagem
        messageDiv.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-color)' : 
                        type === 'error' ? 'var(--danger-color)' : 
                        'var(--info-color)'};
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
        
        // Remover após 3 segundos
        setTimeout(() => {
            messageDiv.style.animation = 'slideIn 0.3s ease reverse forwards';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }

    getErrorMessage(errorCode) {
        const messages = {
            'auth/invalid-email': 'E-mail inválido',
            'auth/user-disabled': 'Conta desativada',
            'auth/user-not-found': 'Usuário não encontrado',
            'auth/wrong-password': 'Senha incorreta',
            'auth/email-already-in-use': 'E-mail já está em uso',
            'auth/weak-password': 'Senha muito fraca',
            'auth/network-request-failed': 'Erro de conexão',
            'auth/popup-closed-by-user': 'Login cancelado pelo usuário'
        };
        
        return messages[errorCode] || 'Erro desconhecido. Tente novamente.';
    }
}

// Inicializar sistema de autenticação
const authSystem = new AuthSystem();
export default authSystem;