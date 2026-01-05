// settings.js - CONFIGURAÇÕES DO APP (Parte 1/4)
import { auth, db, storage } from './firebase-config.js';
import { 
    doc, 
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { 
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

class SettingsSystem {
    constructor() {
        this.currentUser = null;
        this.currentTheme = 'light';
        this.primaryColor = '#FFD700';
        this.init();
    }

    async init() {
        await this.loadCurrentUser();
        this.loadSettings();
    }

    async loadCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
    }

    loadSettings() {
        // Carregar configurações salvas
        const savedTheme = localStorage.getItem('theme') || 'light';
        const savedColor = localStorage.getItem('primaryColor') || '#FFD700';
        
        this.currentTheme = savedTheme;
        this.primaryColor = savedColor;
        
        // Aplicar tema
        this.applyTheme(savedTheme);
    }

    async renderSettingsPage() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="settings-container">
                <!-- Cabeçalho -->
                <div class="settings-header">
                    <h2><i class="fas fa-cog"></i> Configurações</h2>
                </div>

                <!-- Menu de Configurações -->
                <div class="settings-menu">
                    <div class="settings-category">
                        <h3><i class="fas fa-palette"></i> Aparência</h3>
                        <div class="settings-items">
                            <div class="settings-item" onclick="settingsSystem.openThemeSettings()">
                                <i class="fas fa-moon"></i>
                                <span>Tema e Cores</span>
                                <i class="fas fa-chevron-right"></i>
                            </div>
                            
                            <div class="settings-item" onclick="settingsSystem.openLayoutSettings()">
                                <i class="fas fa-layer-group"></i>
                                <span>Layout</span>
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                    </div>

                    <div class="settings-category">
                        <h3><i class="fas fa-user-cog"></i> Conta</h3>
                        <div class="settings-items">
                            <div class="settings-item" onclick="settingsSystem.openAccountSettings()">
                                <i class="fas fa-user-edit"></i>
                                <span>Editar Perfil</span>
                                <i class="fas fa-chevron-right"></i>
                            </div>
                            
                            <div class="settings-item" onclick="settingsSystem.openSecuritySettings()">
                                <i class="fas fa-shield-alt"></i>
                                <span>Segurança</span>
                                <i class="fas fa-chevron-right"></i>
                            </div>
                            
                            <div class="settings-item" onclick="settingsSystem.openBackupSettings()">
                                <i class="fas fa-database"></i>
                                <span>Backup e Sincronização</span>
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                    </div>

                    <div class="settings-category">
                        <h3><i class="fas fa-bell"></i> Notificações</h3>
                        <div class="settings-items">
                            <div class="settings-item" onclick="settingsSystem.openNotificationSettings()">
                                <i class="fas fa-bell"></i>
                                <span>Configurar Notificações</span>
                                <i class="fas fa-chevron-right"></i>
                            </div>
                            
                            <div class="settings-item" onclick="settingsSystem.openSoundSettings()">
                                <i class="fas fa-volume-up"></i>
                                <span>Sons e Alertas</span>
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                    </div>

                    <div class="settings-category">
                        <h3><i class="fas fa-coins"></i> Monetização</h3>
                        <div class="settings-items">
                            <div class="settings-item" onclick="settingsSystem.openMonetizationSettings()">
                                <i class="fas fa-ad"></i>
                                <span>Anúncios</span>
                                <i class="fas fa-chevron-right"></i>
                            </div>
                            
                            <div class="settings-item" onclick="settingsSystem.openPremiumSettings()">
                                <i class="fas fa-crown"></i>
                                <span>Premium</span>
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                    </div>

                    <div class="settings-category">
                        <h3><i class="fas fa-info-circle"></i> Sobre</h3>
                        <div class="settings-items">
                            <div class="settings-item" onclick="settingsSystem.openAboutSettings()">
                                <i class="fas fa-info-circle"></i>
                                <span>Sobre o App</span>
                                <i class="fas fa-chevron-right"></i>
                            </div>
                            
                            <div class="settings-item" onclick="settingsSystem.openSupportSettings()">
                                <i class="fas fa-headset"></i>
                                <span>Suporte</span>
                                <i class="fas fa-chevron-right"></i>
                            </div>
                            
                            <div class="settings-item" onclick="settingsSystem.openTermsSettings()">
                                <i class="fas fa-file-contract"></i>
                                <span>Termos de Uso</span>
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Botão de Sair -->
                    <div class="logout-section">
                        <button class="btn-danger logout-btn" onclick="settingsSystem.logout()">
                            <i class="fas fa-sign-out-alt"></i> Sair da Conta
                        </button>
                        
                        <button class="btn-danger delete-account-btn" onclick="settingsSystem.showDeleteAccountModal()">
                            <i class="fas fa-trash"></i> Excluir Conta
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.addSettingsStyles();
    }

// Métodos de Aparência
openThemeSettings() {
    const modalHtml = `
        <div class="modal-overlay active" id="themeSettingsModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-palette"></i> Tema e Cores</h3>
                    <button class="close-modal" onclick="settingsSystem.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <!-- Seleção de Tema -->
                    <div class="settings-section">
                        <h4>Tema</h4>
                        <div class="theme-options">
                            <div class="theme-option ${this.currentTheme === 'light' ? 'selected' : ''}" 
                                 onclick="settingsSystem.selectTheme('light')">
                                <div class="theme-preview light-theme">
                                    <div class="preview-header"></div>
                                    <div class="preview-content"></div>
                                </div>
                                <span>Claro</span>
                            </div>
                            
                            <div class="theme-option ${this.currentTheme === 'dark' ? 'selected' : ''}" 
                                 onclick="settingsSystem.selectTheme('dark')">
                                <div class="theme-preview dark-theme">
                                    <div class="preview-header"></div>
                                    <div class="preview-content"></div>
                                </div>
                                <span>Escuro</span>
                            </div>
                            
                            <div class="theme-option ${this.currentTheme === 'system' ? 'selected' : ''}" 
                                 onclick="settingsSystem.selectTheme('system')">
                                <div class="theme-preview system-theme">
                                    <div class="preview-half light-theme"></div>
                                    <div class="preview-half dark-theme"></div>
                                </div>
                                <span>Sistema</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Seletor de Cores -->
                    <div class="settings-section">
                        <h4>Cor Primária</h4>
                        <div class="color-picker-section">
                            <div class="current-color" style="background: ${this.primaryColor}"></div>
                            <input type="color" id="primaryColorPicker" value="${this.primaryColor}" 
                                   onchange="settingsSystem.changePrimaryColor(this.value)">
                            <input type="text" id="colorHex" value="${this.primaryColor}" 
                                   onchange="settingsSystem.changePrimaryColor(this.value)" 
                                   placeholder="#FFD700">
                        </div>
                        
                        <div class="color-presets">
                            <div class="color-preset" style="background: #FFD700" 
                                 onclick="settingsSystem.changePrimaryColor('#FFD700')"></div>
                            <div class="color-preset" style="background: #4285F4" 
                                 onclick="settingsSystem.changePrimaryColor('#4285F4')"></div>
                            <div class="color-preset" style="background: #34A853" 
                                 onclick="settingsSystem.changePrimaryColor('#34A853')"></div>
                            <div class="color-preset" style="background: #EA4335" 
                                 onclick="settingsSystem.changePrimaryColor('#EA4335')"></div>
                            <div class="color-preset" style="background: #FBBC05" 
                                 onclick="settingsSystem.changePrimaryColor('#FBBC05')"></div>
                            <div class="color-preset" style="background: #8E44AD" 
                                 onclick="settingsSystem.changePrimaryColor('#8E44AD')"></div>
                        </div>
                        
                        <button class="btn-secondary" onclick="settingsSystem.resetColors()">
                            <i class="fas fa-undo"></i> Restaurar Padrão
                        </button>
                    </div>
                    
                    <!-- Bordas -->
                    <div class="settings-section">
                        <h4>Bordas</h4>
                        <div class="border-settings">
                            <label>Espessura das Bordas</label>
                            <div class="slider-container">
                                <input type="range" id="borderWidth" min="1" max="4" value="2" 
                                       oninput="settingsSystem.changeBorderWidth(this.value)">
                                <span id="borderWidthValue">2mm</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="settingsSystem.closeModal()">
                            Fechar
                        </button>
                        <button class="btn-primary" onclick="settingsSystem.saveThemeSettings()">
                            <i class="fas fa-save"></i> Salvar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    this.addThemeModalStyles();
}

selectTheme(theme) {
    this.currentTheme = theme;
    
    // Atualizar seleção visual
    document.querySelectorAll('.theme-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    document.querySelector(`.theme-option[onclick*="${theme}"]`).classList.add('selected');
    
    // Aplicar temporariamente para visualização
    this.applyTheme(theme);
}

applyTheme(theme) {
    if (theme === 'system') {
        // Detectar preferência do sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        theme = prefersDark ? 'dark' : 'light';
    }
    
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

changePrimaryColor(color) {
    this.primaryColor = color;
    
    // Atualizar variável CSS
    document.documentElement.style.setProperty('--primary-color', color);
    localStorage.setItem('primaryColor', color);
    
    // Atualizar inputs
    const colorPicker = document.getElementById('primaryColorPicker');
    const colorHex = document.getElementById('colorHex');
    
    if (colorPicker) colorPicker.value = color;
    if (colorHex) colorHex.value = color;
    
    // Atualizar visualização
    const currentColor = document.querySelector('.current-color');
    if (currentColor) currentColor.style.background = color;
}

changeBorderWidth(width) {
    const value = `${width}px`;
    document.documentElement.style.setProperty('--border-width', value);
    
    const display = document.getElementById('borderWidthValue');
    if (display) display.textContent = `${width}mm`;
}

resetColors() {
    this.changePrimaryColor('#FFD700');
    this.changeBorderWidth('2');
    this.selectTheme('light');
}

async saveThemeSettings() {
    try {
        const userId = localStorage.getItem('userId');
        const userRef = doc(db, 'users', userId);
        
        await updateDoc(userRef, {
            'settings.theme': this.currentTheme,
            'settings.primaryColor': this.primaryColor,
            'settings.borderWidth': document.getElementById('borderWidth')?.value || '2',
            updatedAt: new Date().toISOString()
        });
        
        // Atualizar usuário local
        if (this.currentUser.settings) {
            this.currentUser.settings.theme = this.currentTheme;
            this.currentUser.settings.primaryColor = this.primaryColor;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        }
        
        this.showMessage('Configurações salvas com sucesso!', 'success');
        this.closeModal();
        
    } catch (error) {
        console.error('Erro ao salvar tema:', error);
        this.showMessage('Erro ao salvar configurações', 'error');
    }
}

openAccountSettings() {
    this.showMessage('Funcionalidade em desenvolvimento', 'info');
}

openSecuritySettings() {
    const modalHtml = `
        <div class="modal-overlay active" id="securitySettingsModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-shield-alt"></i> Segurança</h3>
                    <button class="close-modal" onclick="settingsSystem.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="security-options">
                        <div class="security-item">
                            <i class="fas fa-key"></i>
                            <div>
                                <h4>Alterar Senha</h4>
                                <p>Atualize sua senha periodicamente</p>
                            </div>
                            <button class="btn-secondary" onclick="settingsSystem.changePassword()">
                                Alterar
                            </button>
                        </div>
                        
                        <div class="security-item">
                            <i class="fas fa-envelope"></i>
                            <div>
                                <h4>Alterar E-mail</h4>
                                <p>${this.currentUser?.email || 'Não disponível'}</p>
                            </div>
                            <button class="btn-secondary" onclick="settingsSystem.changeEmail()">
                                Alterar
                            </button>
                        </div>
                        
                        <div class="security-item">
                            <i class="fas fa-mobile-alt"></i>
                            <div>
                                <h4>Verificação em Duas Etapas</h4>
                                <p>Proteção adicional para sua conta</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="twoFactorToggle">
                                <span class="slider"></span>
                            </label>
                        </div>
                        
                        <div class="security-item">
                            <i class="fas fa-history"></i>
                            <div>
                                <h4>Histórico de Login</h4>
                                <p>Veja onde sua conta foi acessada</p>
                            </div>
                            <button class="btn-secondary" onclick="settingsSystem.viewLoginHistory()">
                                Ver
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Métodos de Backup e Sincronização
openBackupSettings() {
    const modalHtml = `
        <div class="modal-overlay active" id="backupSettingsModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-database"></i> Backup e Sincronização</h3>
                    <button class="close-modal" onclick="settingsSystem.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="backup-status">
                        <div class="status-item">
                            <i class="fas fa-cloud ${this.getBackupStatus().icon}"></i>
                            <div>
                                <h4>Status do Backup</h4>
                                <p>${this.getBackupStatus().message}</p>
                                <small>Último backup: ${this.getLastBackupDate()}</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="backup-options">
                        <div class="backup-item">
                            <i class="fas fa-save"></i>
                            <div>
                                <h4>Backup Manual</h4>
                                <p>Crie um backup agora de todos os seus dados</p>
                            </div>
                            <button class="btn-primary" onclick="settingsSystem.createManualBackup()">
                                <i class="fas fa-download"></i> Fazer Backup
                            </button>
                        </div>
                        
                        <div class="backup-item">
                            <i class="fas fa-history"></i>
                            <div>
                                <h4>Backup Automático</h4>
                                <p>Configure backups automáticos</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="autoBackupToggle" checked>
                                <span class="slider"></span>
                            </label>
                        </div>
                        
                        <div class="backup-item">
                            <i class="fas fa-upload"></i>
                            <div>
                                <h4>Restaurar Backup</h4>
                                <p>Recupere dados de um backup anterior</p>
                            </div>
                            <button class="btn-secondary" onclick="settingsSystem.restoreBackup()">
                                <i class="fas fa-upload"></i> Restaurar
                            </button>
                        </div>
                    </div>
                    
                    <div class="backup-schedule">
                        <h4>Agendar Backup</h4>
                        <div class="schedule-options">
                            <label class="checkbox-label">
                                <input type="checkbox" id="dailyBackup">
                                <span>Diariamente</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="weeklyBackup">
                                <span>Semanalmente</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="monthlyBackup">
                                <span>Mensalmente</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="backup-storage">
                        <h4>Armazenamento</h4>
                        <div class="storage-bar">
                            <div class="storage-progress" style="width: 45%"></div>
                        </div>
                        <p class="storage-info">4.5 GB de 10 GB utilizados</p>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="settingsSystem.closeModal()">
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

getBackupStatus() {
    const lastBackup = localStorage.getItem('lastBackup');
    
    if (!lastBackup) {
        return {
            icon: 'fa-times-circle',
            message: 'Nenhum backup realizado',
            color: '#EA4335'
        };
    }
    
    const backupDate = new Date(lastBackup);
    const daysDiff = Math.floor((new Date() - backupDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 30) {
        return {
            icon: 'fa-exclamation-triangle',
            message: 'Backup desatualizado',
            color: '#FBBC05'
        };
    } else if (daysDiff > 7) {
        return {
            icon: 'fa-check-circle',
            message: 'Backup recente',
            color: '#34A853'
        };
    } else {
        return {
            icon: 'fa-check-circle',
            message: 'Backup atualizado',
            color: '#34A853'
        };
    }
}

getLastBackupDate() {
    const lastBackup = localStorage.getItem('lastBackup');
    if (!lastBackup) return 'Nunca';
    
    const date = new Date(lastBackup);
    return date.toLocaleDateString('pt-BR');
}

async createManualBackup() {
    try {
        this.showMessage('Criando backup...', 'info');
        
        const userId = localStorage.getItem('userId');
        
        // Coletar dados do usuário
        const backupData = {
            userId: userId,
            userData: this.currentUser,
            timestamp: new Date().toISOString(),
            data: {
                contacts: await this.getUserData('contacts'),
                events: await this.getUserData('events'),
                family: await this.getUserData('family'),
                conversations: await this.getUserData('conversations')
            }
        };
        
        // Criar arquivo JSON
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const filename = `cronoz-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        // Salvar no Storage do Firebase
        const storageRef = ref(storage, `backups/${userId}/${filename}`);
        await uploadBytes(storageRef, blob);
        
        // Atualizar último backup
        localStorage.setItem('lastBackup', new Date().toISOString());
        
        this.showMessage('Backup criado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao criar backup:', error);
        this.showMessage('Erro ao criar backup', 'error');
    }
}

async getUserData(collectionName) {
    try {
        const userId = localStorage.getItem('userId');
        if (!userId) return [];
        
        // Em produção, buscaria do Firestore
        // Por enquanto retorna dados do localStorage
        const data = localStorage.getItem(`cronoz_${collectionName}`);
        return data ? JSON.parse(data) : [];
        
    } catch (error) {
        console.error(`Erro ao buscar ${collectionName}:`, error);
        return [];
    }
}

// Métodos de Monetização
openMonetizationSettings() {
    const modalHtml = `
        <div class="modal-overlay active" id="monetizationModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-coins"></i> Monetização</h3>
                    <button class="close-modal" onclick="settingsSystem.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="ads-status">
                        <h4>Anúncios</h4>
                        <div class="status-toggle">
                            <span>Exibir anúncios no app</span>
                            <label class="switch large">
                                <input type="checkbox" id="adsToggle" checked>
                                <span class="slider"></span>
                            </label>
                        </div>
                        <p class="description">
                            Anúncios ajudam a manter o app gratuito. 
                            Remova-os assinando o Premium.
                        </p>
                    </div>
                    
                    <div class="premium-plans">
                        <h4>Planos Premium</h4>
                        
                        <div class="plan-card basic">
                            <div class="plan-header">
                                <h5>Grátis</h5>
                                <div class="plan-price">R$ 0,00</div>
                            </div>
                            <ul class="plan-features">
                                <li><i class="fas fa-check"></i> Funcionalidades básicas</li>
                                <li><i class="fas fa-check"></i> Até 50 contatos</li>
                                <li><i class="fas fa-check"></i> 1GB de armazenamento</li>
                                <li><i class="fas fa-times"></i> Anúncios exibidos</li>
                                <li><i class="fas fa-times"></i> Backup automático</li>
                            </ul>
                            <button class="btn-secondary" disabled>Atual</button>
                        </div>
                        
                        <div class="plan-card premium">
                            <div class="plan-header">
                                <h5>Premium</h5>
                                <div class="plan-price">R$ 9,90<span>/mês</span></div>
                            </div>
                            <ul class="plan-features">
                                <li><i class="fas fa-check"></i> Todas funcionalidades</li>
                                <li><i class="fas fa-check"></i> Contatos ilimitados</li>
                                <li><i class="fas fa-check"></i> 10GB de armazenamento</li>
                                <li><i class="fas fa-check"></i> Sem anúncios</li>
                                <li><i class="fas fa-check"></i> Backup automático</li>
                            </ul>
                            <button class="btn-primary" onclick="settingsSystem.subscribePremium()">
                                Assinar
                            </button>
                        </div>
                    </div>
                    
                    <div class="promo-code">
                        <h4>Código Promocional</h4>
                        <div class="code-input">
                            <input type="text" id="promoCode" placeholder="Digite seu código">
                            <button class="btn-secondary" onclick="settingsSystem.redeemPromoCode()">
                                Resgatar
                            </button>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="settingsSystem.closeModal()">
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

subscribePremium() {
    this.showMessage('Assinatura Premium em desenvolvimento', 'info');
}

redeemPromoCode() {
    const code = document.getElementById('promoCode')?.value;
    if (!code) {
        this.showMessage('Digite um código', 'error');
        return;
    }
    
    // Simular validação de código
    const validCodes = ['CRONOZ2024', 'PREMIUMFREE', 'LAUNCH50'];
    
    if (validCodes.includes(code.toUpperCase())) {
        this.showMessage('Código resgatado com sucesso!', 'success');
    } else {
        this.showMessage('Código inválido ou expirado', 'error');
    }
}

    // Métodos de Conta
    async logout() {
        if (!confirm('Tem certeza que deseja sair da conta?')) return;
        
        try {
            await auth.signOut();
            localStorage.clear();
            window.location.reload();
        } catch (error) {
            console.error('Erro ao sair:', error);
            this.showMessage('Erro ao sair da conta', 'error');
        }
    }

    showDeleteAccountModal() {
        const modalHtml = `
            <div class="modal-overlay active" id="deleteAccountModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-exclamation-triangle"></i> Excluir Conta</h3>
                        <button class="close-modal" onclick="settingsSystem.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="warning-message">
                            <i class="fas fa-exclamation-circle"></i>
                            <h4>Atenção!</h4>
                            <p>Esta ação é <strong>permanente e irreversível</strong>. Todos os seus dados serão apagados:</p>
                            <ul class="deletion-list">
                                <li><i class="fas fa-trash"></i> Perfil e configurações</li>
                                <li><i class="fas fa-trash"></i> Todos os contatos</li>
                                <li><i class="fas fa-trash"></i> Árvore genealógica</li>
                                <li><i class="fas fa-trash"></i> Calendário e eventos</li>
                                <li><i class="fas fa-trash"></i> Conversas e mensagens</li>
                                <li><i class="fas fa-trash"></i> Álbuns de fotos</li>
                            </ul>
                            <p class="final-warning">Esta ação não pode ser desfeita!</p>
                        </div>
                        
                        <div class="confirmation-step">
                            <label class="checkbox-label">
                                <input type="checkbox" id="confirmDeletion">
                                <span>Eu entendo que todos os meus dados serão perdidos permanentemente</span>
                            </label>
                            
                            <div class="password-confirm">
                                <label>Digite sua senha para confirmar:</label>
                                <input type="password" id="deletePassword" placeholder="Sua senha atual">
                            </div>
                        </div>
                        
                        <div class="modal-actions">
                            <button class="btn-secondary" onclick="settingsSystem.closeModal()">
                                Cancelar
                            </button>
                            <button class="btn-danger" onclick="settingsSystem.deleteAccount()" id="deleteBtn" disabled>
                                <i class="fas fa-trash"></i> Excluir Conta Permanentemente
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Ativar botão apenas quando confirmado
        document.getElementById('confirmDeletion')?.addEventListener('change', function() {
            const deleteBtn = document.getElementById('deleteBtn');
            deleteBtn.disabled = !this.checked;
        });
    }

    async deleteAccount() {
        const password = document.getElementById('deletePassword')?.value;
        
        if (!password) {
            this.showMessage('Digite sua senha para confirmar', 'error');
            return;
        }

        if (!confirm('CONFIRMAÇÃO FINAL: Tem certeza ABSOLUTA que deseja excluir sua conta permanentemente?')) {
            return;
        }

        try {
            this.showMessage('Excluindo conta...', 'info');
            
            // Em produção, aqui teria:
            // 1. Reautenticação do usuário
            // 2. Exclusão de todos os dados do Firestore
            // 3. Exclusão do Storage
            // 4. Exclusão da conta do Authentication
            
            // Por enquanto, simulação
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Limpar localStorage
            localStorage.clear();
            
            // Redirecionar para login
            window.location.reload();
            
        } catch (error) {
            console.error('Erro ao excluir conta:', error);
            this.showMessage('Erro ao excluir conta', 'error');
        }
    }

    // Métodos de Utilidade
    closeModal() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
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

    addSettingsStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .settings-container {
                animation: fadeIn 0.3s ease;
            }
            
            .settings-header {
                margin-bottom: var(--spacing-xl);
            }
            
            .settings-header h2 {
                font-size: 1.5rem;
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
            }
            
            .settings-menu {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-xl);
            }
            
            .settings-category h3 {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                margin-bottom: var(--spacing-md);
                color: var(--primary-color);
                font-size: 1.1rem;
            }
            
            .settings-items {
                background: var(--surface-color);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                overflow: hidden;
            }
            
            .settings-item {
                display: flex;
                align-items: center;
                gap: var(--spacing-md);
                padding: var(--spacing-lg);
                border-bottom: 1px solid var(--border-color);
                cursor: pointer;
                transition: var(--transition);
            }
            
            .settings-item:last-child {
                border-bottom: none;
            }
            
            .settings-item:hover {
                background: var(--border-color);
            }
            
            .settings-item i:first-child {
                width: 24px;
                text-align: center;
                color: var(--primary-color);
            }
            
            .settings-item span {
                flex: 1;
                font-weight: 500;
            }
            
            .settings-item i:last-child {
                color: var(--text-secondary);
            }
            
            .logout-section {
                margin-top: var(--spacing-xl);
                padding-top: var(--spacing-lg);
                border-top: 1px solid var(--border-color);
                display: flex;
                flex-direction: column;
                gap: var(--spacing-md);
            }
            
            .logout-btn, .delete-account-btn {
                width: 100%;
                justify-content: center;
            }
            
            /* Modal de Tema */
            .theme-options {
                display: flex;
                gap: var(--spacing-lg);
                margin-bottom: var(--spacing-xl);
                flex-wrap: wrap;
            }
            
            .theme-option {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: var(--spacing-sm);
                cursor: pointer;
                padding: var(--spacing-sm);
                border-radius: var(--border-radius);
                border: 2px solid transparent;
                transition: var(--transition);
            }
            
            .theme-option.selected {
                border-color: var(--primary-color);
                background: rgba(255, 215, 0, 0.1);
            }
            
            .theme-preview {
                width: 80px;
                height: 60px;
                border-radius: 8px;
                overflow: hidden;
                border: 1px solid var(--border-color);
            }
            
            .light-theme {
                background: white;
            }
            
            .light-theme .preview-header {
                height: 12px;
                background: #f0f0f0;
            }
            
            .light-theme .preview-content {
                height: 48px;
                background: white;
            }
            
            .dark-theme {
                background: #121212;
            }
            
            .dark-theme .preview-header {
                height: 12px;
                background: #1e1e1e;
            }
            
            .dark-theme .preview-content {
                height: 48px;
                background: #121212;
            }
            
            .system-theme {
                display: flex;
            }
            
            .preview-half {
                flex: 1;
            }
            
            .color-picker-section {
                display: flex;
                align-items: center;
                gap: var(--spacing-md);
                margin-bottom: var(--spacing-lg);
            }
            
            .current-color {
                width: 40px;
                height: 40px;
                border-radius: 8px;
                border: 2px solid var(--border-color);
            }
            
            #colorHex {
                flex: 1;
                padding: 8px 12px;
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                background: var(--surface-color);
                color: var(--text-color);
            }
            
            .color-presets {
                display: flex;
                gap: var(--spacing-sm);
                margin-bottom: var(--spacing-lg);
                flex-wrap: wrap;
            }
            
            .color-preset {
                width: 32px;
                height: 32px;
                border-radius: 6px;
                cursor: pointer;
                border: 2px solid transparent;
                transition: var(--transition);
            }
            
            .color-preset:hover {
                transform: scale(1.1);
                border-color: var(--border-color);
            }
            
            .border-settings {
                margin-top: var(--spacing-lg);
            }
            
            .slider-container {
                display: flex;
                align-items: center;
                gap: var(--spacing-md);
                margin-top: var(--spacing-sm);
            }
            
            #borderWidth {
                flex: 1;
            }
            
            /* Segurança */
            .security-options {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-lg);
            }
            
            .security-item {
                display: flex;
                align-items: center;
                gap: var(--spacing-md);
                padding: var(--spacing-md);
                background: var(--surface-color);
                border-radius: var(--border-radius);
                border: 1px solid var(--border-color);
            }
            
            .security-item i:first-child {
                font-size: 1.2rem;
                color: var(--primary-color);
                width: 30px;
            }
            
            .security-item div {
                flex: 1;
            }
            
            .security-item h4 {
                margin-bottom: 2px;
            }
            
            .security-item p {
                font-size: 0.9rem;
                color: var(--text-secondary);
            }
            
            .switch {
                position: relative;
                display: inline-block;
                width: 50px;
                height: 24px;
            }
            
            .switch.large {
                width: 60px;
                height: 30px;
            }
            
            .switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #ccc;
                transition: .4s;
                border-radius: 34px;
            }
            
            .slider:before {
                position: absolute;
                content: "";
                height: 16px;
                width: 16px;
                left: 4px;
                bottom: 4px;
                background-color: white;
                transition: .4s;
                border-radius: 50%;
            }
            
            .switch.large .slider:before {
                height: 22px;
                width: 22px;
                left: 4px;
                bottom: 4px;
            }
            
            input:checked + .slider {
                background-color: var(--primary-color);
            }
            
            input:checked + .slider:before {
                transform: translateX(26px);
            }
            
            .switch.large input:checked + .slider:before {
                transform: translateX(30px);
            }
            
            /* Backup */
            .backup-status, .backup-options {
                margin-bottom: var(--spacing-xl);
            }
            
            .status-item, .backup-item {
                display: flex;
                align-items: center;
                gap: var(--spacing-md);
                padding: var(--spacing-md);
                background: var(--surface-color);
                border-radius: var(--border-radius);
                border: 1px solid var(--border-color);
                margin-bottom: var(--spacing-sm);
            }
            
            .backup-item button {
                white-space: nowrap;
            }
            
            .backup-schedule, .backup-storage {
                margin-bottom: var(--spacing-lg);
            }
            
            .schedule-options {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-sm);
                margin-top: var(--spacing-md);
            }
            
            .storage-bar {
                height: 8px;
                background: var(--border-color);
                border-radius: 4px;
                margin: var(--spacing-sm) 0;
                overflow: hidden;
            }
            
            .storage-progress {
                height: 100%;
                background: var(--primary-color);
                border-radius: 4px;
            }
            
            /* Monetização */
            .ads-status {
                margin-bottom: var(--spacing-xl);
                padding-bottom: var(--spacing-lg);
                border-bottom: 1px solid var(--border-color);
            }
            
            .status-toggle {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: var(--spacing-md) 0;
            }
            
            .description {
                font-size: 0.9rem;
                color: var(--text-secondary);
                line-height: 1.5;
            }
            
            .premium-plans {
                display: flex;
                gap: var(--spacing-lg);
                margin-bottom: var(--spacing-xl);
                flex-wrap: wrap;
            }
            
            .plan-card {
                flex: 1;
                min-width: 250px;
                background: var(--surface-color);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                padding: var(--spacing-lg);
                display: flex;
                flex-direction: column;
            }
            
            .plan-card.premium {
                border: 2px solid var(--primary-color);
                background: rgba(255, 215, 0, 0.05);
            }
            
            .plan-header {
                text-align: center;
                margin-bottom: var(--spacing-lg);
                padding-bottom: var(--spacing-md);
                border-bottom: 1px solid var(--border-color);
            }
            
            .plan-price {
                font-size: 1.5rem;
                font-weight: 700;
                color: var(--primary-color);
                margin-top: var(--spacing-xs);
            }
            
            .plan-price span {
                font-size: 0.9rem;
                color: var(--text-secondary);
            }
            
            .plan-features {
                flex: 1;
                list-style: none;
                padding: 0;
                margin-bottom: var(--spacing-lg);
            }
            
            .plan-features li {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                margin-bottom: var(--spacing-sm);
                font-size: 0.9rem;
            }
            
            .plan-features .fa-check {
                color: #34A853;
            }
            
            .plan-features .fa-times {
                color: #EA4335;
            }
            
            .promo-code {
                margin-bottom: var(--spacing-lg);
            }
            
            .code-input {
                display: flex;
                gap: var(--spacing-sm);
                margin-top: var(--spacing-md);
            }
            
                       .code-input input {
                flex: 1;
                padding: 10px 15px;
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                background: var(--surface-color);
                color: var(--text-color);
            }
            
            /* Excluir Conta */
            .warning-message {
                background: rgba(220, 53, 69, 0.1);
                border: 1px solid var(--danger-color);
                border-radius: var(--border-radius);
                padding: var(--spacing-lg);
                margin-bottom: var(--spacing-lg);
            }
            
            .warning-message i {
                font-size: 2rem;
                color: var(--danger-color);
                margin-bottom: var(--spacing-md);
                display: block;
            }
            
            .deletion-list {
                list-style: none;
                padding: 0;
                margin: var(--spacing-md) 0;
            }
            
            .deletion-list li {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                margin-bottom: var(--spacing-xs);
                color: var(--danger-color);
            }
            
            .final-warning {
                font-weight: 700;
                color: var(--danger-color);
                text-align: center;
                margin-top: var(--spacing-md);
            }
            
            .confirmation-step {
                margin-bottom: var(--spacing-xl);
            }
            
            .password-confirm {
                margin-top: var(--spacing-lg);
            }
            
            .password-confirm input {
                width: 100%;
                padding: 10px 15px;
                margin-top: var(--spacing-sm);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                background: var(--surface-color);
                color: var(--text-color);
            }
            
            @media (max-width: 768px) {
                .theme-options {
                    justify-content: center;
                }
                
                .premium-plans {
                    flex-direction: column;
                }
                
                .plan-card {
                    min-width: 100%;
                }
                
                .security-item, .backup-item, .status-item {
                    flex-direction: column;
                    text-align: center;
                }
                
                .security-item button, .backup-item button {
                    width: 100%;
                }
            }
            
            @media (max-width: 480px) {
                .settings-item {
                    padding: var(--spacing-md);
                }
                
                .modal-content {
                    width: 95%;
                    margin: 10px;
                }
                
                .color-picker-section {
                    flex-direction: column;
                    align-items: stretch;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    addThemeModalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .settings-section {
                margin-bottom: var(--spacing-xl);
                padding-bottom: var(--spacing-lg);
                border-bottom: 1px solid var(--border-color);
            }
            
            .settings-section:last-child {
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
            }
            
            .settings-section h4 {
                margin-bottom: var(--spacing-md);
                color: var(--primary-color);
            }
        `;
        document.head.appendChild(style);
    }
}

// Inicializar sistema de configurações
const settingsSystem = new SettingsSystem();
window.settingsSystem = settingsSystem;

// Integração com o app principal
if (typeof app !== 'undefined') {
    app.renderSettingsPage = async function() {
        await settingsSystem.renderSettingsPage();
    };
}

export default settingsSystem;
```
