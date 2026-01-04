// app.js - Arquivo principal que gerencia todos os módulos
class CronoZApp {
    constructor() {
        this.modules = {};
        this.currentModule = null;
        this.user = null;
        this.settings = {};
        
        this.init();
    }
    
    async init() {
        // Carregar configurações do localStorage
        this.loadSettings();
        
        // Inicializar Firebase
        await this.initFirebase();
        
        // Verificar autenticação
        this.checkAuth();
        
        // Inicializar módulos
        this.initModules();
        
        // Configurar navegação
        this.setupNavigation();
        
        console.log('CronoZ App inicializado');
    }
    
    loadSettings() {
        const saved = localStorage.getItem('cronoz_settings');
        if (saved) {
            this.settings = JSON.parse(saved);
        } else {
            this.settings = {
                theme: 'light',
                language: 'pt-br',
                notifications: true,
                backupFrequency: 'daily'
            };
        }
    }
    
    async initFirebase() {
        // Configuração do Firebase já deve estar em script.js
        console.log('Firebase inicializado');
    }
    
    checkAuth() {
        // Verificar se usuário está logado
        const user = localStorage.getItem('cronoz_user');
        if (user) {
            this.user = JSON.parse(user);
            this.showApp();
        } else {
            this.showLogin();
        }
    }
    
    initModules() {
        // Inicializar todos os módulos
        this.modules = {
            contacts: new ContactsModule(this),
            chat: new ChatModule(this),
            calendar: new CalendarModule(this),
            tree: new TreeModule(this),
            albums: new AlbumsModule(this),
            settings: new SettingsModule(this)
        };
    }
    
    setupNavigation() {
        // Configurar eventos de navegação
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const module = e.target.dataset.module;
                this.switchModule(module);
            });
        });
    }
    
    switchModule(moduleName) {
        if (this.currentModule) {
            this.currentModule.hide();
        }
        
        this.currentModule = this.modules[moduleName];
        if (this.currentModule) {
            this.currentModule.show();
        }
        
        // Atualizar navegação ativa
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-module="${moduleName}"]`).classList.add('active');
    }
    
    showApp() {
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
        
        // Carregar módulo padrão
        this.switchModule('contacts');
    }
    
    showLogin() {
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('app-container').style.display = 'none';
    }
}

// Inicializar app quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.cronozApp = new CronoZApp();
});
