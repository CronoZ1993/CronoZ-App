// settings.js - Sistema de configurações
import { auth, db } from './firebase-config.js';
import { 
    doc, getDoc, updateDoc, 
    updateProfile, updatePassword,
    reauthenticateWithCredential, EmailAuthProvider
} from './firebase-config.js';
import { showLoading, hideLoading, showToast, saveToLocalStorage, loadFromLocalStorage } from './utils.js';

class SettingsSystem {
    constructor() {
        this.userSettings = {};
        this.init();
    }
    
    init() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                await this.loadUserSettings();
                this.setupEventListeners();
                this.initializeSettingsUI();
            }
        });
    }
    
    async loadUserSettings() {
        if (!auth.currentUser) return;
        
        try {
            const userId = auth.currentUser.uid;
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                this.userSettings = userSnap.data().settings || {};
                this.applySettings();
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        }
    }
    
    async saveUserSettings() {
        if (!auth.currentUser) return;
        
        try {
            const userId = auth.currentUser.uid;
            const userRef = doc(db, 'users', userId);
            
            await updateDoc(userRef, {
                settings: this.userSettings,
                updatedAt: new Date().toISOString()
            });
            
            return true;
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            return false;
        }
    }
    
    applySettings() {
        // Apply theme
        const theme = this.userSettings.theme || 'auto';
        this.applyTheme(theme);
        
        // Apply accent color
        const accentColor = this.userSettings.accentColor || '#d4af37';
        this.applyAccentColor(accentColor);
        
        // Apply other settings
        this.updateUIFromSettings();
    }
    
    applyTheme(theme) {
        const root = document.documentElement;
        
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.dataset.theme = prefersDark ? 'dark' : 'light';
        } else {
            root.dataset.theme = theme;
        }
        
        // Save to localStorage for immediate access
        saveToLocalStorage('theme', theme);
        
        // Update select if exists
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = theme;
        }
    }
    
    applyAccentColor(color) {
        const root = document.documentElement;
        root.style.setProperty('--primary-color', color);
        
        // Calculate variations
        const darker = this.adjustColor(color, -30);
        const lighter = this.adjustColor(color, 40);
        
        root.style.setProperty('--primary-dark', darker);
        root.style.setProperty('--primary-light', lighter);
        
        // Save to localStorage
        saveToLocalStorage('accentColor', color);
        
        // Update color pickers if exists
        const colorPicker = document.getElementById('color-picker');
        const colorHex = document.getElementById('color-hex');
        
        if (colorPicker) colorPicker.value = color;
        if (colorHex) colorHex.value = color;
    }
    
    adjustColor(hex, percent) {
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
    
    updateUIFromSettings() {
        // Update toggle switches
        const toggles = {
            'toggle-birthday': 'notifications.birthday',
            'toggle-events': 'notifications.events',
            'toggle-alarm': 'notifications.alarm'
        };
        
        Object.entries(toggles).forEach(([id, path]) => {
            const toggle = document.getElementById(id);
            if (toggle) {
                const value = this.getSetting(path, true);
                toggle.checked = value;
            }
        });
        
        // Update selects
        const selects = {
            'privacy-profile': 'privacy.profile',
            'privacy-calendar': 'privacy.calendar'
        };
        
        Object.entries(selects).forEach(([id, path]) => {
            const select = document.getElementById(id);
            if (select) {
                const value = this.getSetting(path, 'contacts');
                select.value = value;
            }
        });
        
        // Update user info
        this.updateUserInfo();
    }
    
    getSetting(path, defaultValue) {
        const parts = path.split('.');
        let current = this.userSettings;
        
        for (const part of parts) {
            if (current && current[part] !== undefined) {
                current = current[part];
            } else {
                return defaultValue;
            }
        }
        
        return current !== undefined ? current : defaultValue;
    }
    
    setSetting(path, value) {
        const parts = path.split('.');
        let current = this.userSettings;
        
        // Create nested structure if needed
        for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) {
                current[parts[i]] = {};
            }
            current = current[parts[i]];
        }
        
        // Set value
        current[parts[parts.length - 1]] = value;
        
        // Save to Firestore
        this.saveUserSettings();
    }
    
    setupEventListeners() {
        // Theme selector
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                const theme = e.target.value;
                this.applyTheme(theme);
                this.setSetting('theme', theme);
                showToast('Tema alterado', 'success');
            });
        }
        
        // Color picker
        const colorPicker = document.getElementById('color-picker');
        const colorHex = document.getElementById('color-hex');
        const resetColorBtn = document.getElementById('btn-reset-color');
        
        if (colorPicker && colorHex) {
            colorPicker.addEventListener('input', (e) => {
                const color = e.target.value;
                this.applyAccentColor(color);
                colorHex.value = color;
                this.setSetting('accentColor', color);
            });
            
            colorHex.addEventListener('input', (e) => {
                const color = e.target.value;
                if (/^#[0-9A-F]{6}$/i.test(color)) {
                    this.applyAccentColor(color);
                    colorPicker.value = color;
                    this.setSetting('accentColor', color);
                }
            });
            
            if (resetColorBtn) {
                resetColorBtn.addEventListener('click', () => {
                    const defaultColor = '#d4af37';
                    this.applyAccentColor(defaultColor);
                    colorPicker.value = defaultColor;
                    colorHex.value = defaultColor;
                    this.setSetting('accentColor', defaultColor);
                    showToast('Cor restaurada para o padrão', 'success');
                });
            }
        }
        
        // Toggle switches
        document.querySelectorAll('.toggle input[type="checkbox"]').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const settingId = e.target.id;
                const value = e.target.checked;
                
                // Map toggle IDs to settings paths
                const settingMap = {
                    'toggle-birthday': 'notifications.birthday',
                    'toggle-events': 'notifications.events',
                    'toggle-alarm': 'notifications.alarm'
                };
                
                const path = settingMap[settingId];
                if (path) {
                    this.setSetting(path, value);
                    showToast('Configuração salva', 'success');
                }
            });
        });
        
        // Privacy selects
        document.querySelectorAll('.settings-section select').forEach(select => {
            select.addEventListener('change', (e) => {
                const settingId = e.target.id;
                const value = e.target.value;
                
                const settingMap = {
                    'privacy-profile': 'privacy.profile',
                    'privacy-calendar': 'privacy.calendar'
                };
                
                const path = settingMap[settingId];
                if (path) {
                    this.setSetting(path, value);
                    showToast('Configuração de privacidade atualizada', 'success');
                }
            });
        });
        
        // Account buttons
        this.setupAccountButtons();
        
        // Support buttons
        this.setupSupportButtons();
        
        // Premium buttons
        this.setupPremiumButtons();
    }

initializeSettingsUI() {
    // Load saved theme
    const savedTheme = loadFromLocalStorage('theme', 'auto');
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) themeSelect.value = savedTheme;
    
    // Load saved color
    const savedColor = loadFromLocalStorage('accentColor', '#d4af37');
    const colorPicker = document.getElementById('color-picker');
    const colorHex = document.getElementById('color-hex');
    if (colorPicker) colorPicker.value = savedColor;
    if (colorHex) colorHex.value = savedColor;
}

updateUserInfo() {
    const user = auth.currentUser;
    if (!user) return;
    
    // Email
    const emailInput = document.getElementById('setting-email');
    if (emailInput) emailInput.value = user.email || '';
    
    // Name (if available)
    const nameElement = document.querySelector('.user-info h3');
    if (nameElement && user.displayName) {
        nameElement.textContent = user.displayName;
    }
}

setupAccountButtons() {
    // Change password
    const changePwdBtn = document.getElementById('btn-change-password');
    if (changePwdBtn) {
        changePwdBtn.addEventListener('click', () => {
            this.openChangePasswordModal();
        });
    }
    
    // Backup
    const backupBtn = document.getElementById('btn-backup');
    if (backupBtn) {
        backupBtn.addEventListener('click', () => {
            this.createBackup();
        });
    }
    
    // Link Google
    const linkGoogleBtn = document.getElementById('btn-link-google');
    if (linkGoogleBtn) {
        linkGoogleBtn.addEventListener('click', () => {
            this.linkGoogleAccount();
        });
    }
    
    // Delete account
    const deleteAccountBtn = document.getElementById('btn-delete-account');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', () => {
            this.deleteAccount();
        });
    }
}

openChangePasswordModal() {
    const modalContent = `
        <form class="modal-form" id="change-password-form">
            <div class="modal-form-group">
                <label for="current-password">Senha Atual *</label>
                <input type="password" id="current-password" required>
            </div>
            
            <div class="modal-form-group">
                <label for="new-password">Nova Senha *</label>
                <input type="password" id="new-password" required 
                       minlength="6" placeholder="Mínimo 6 caracteres">
            </div>
            
            <div class="modal-form-group">
                <label for="confirm-password">Confirmar Nova Senha *</label>
                <input type="password" id="confirm-password" required>
            </div>
            
            <div class="modal-actions">
                <button type="button" class="btn-secondary close-modal">Cancelar</button>
                <button type="submit" class="btn-primary">Alterar Senha</button>
            </div>
        </form>
    `;
    
    this.showModal('Alterar Senha', modalContent);
    
    document.getElementById('change-password-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.changePassword();
    });
}

async changePassword() {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const user = auth.currentUser;
    
    if (!user || !user.email) {
        showToast('Usuário não autenticado', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showToast('A nova senha deve ter pelo menos 6 caracteres', 'warning');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('As senhas não coincidem', 'warning');
        return;
    }
    
    showLoading('Alterando senha...');
    try {
        // Reauthenticate user
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        
        // Change password
        await updatePassword(user, newPassword);
        
        this.closeModal();
        showToast('Senha alterada com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        
        let message = 'Erro ao alterar senha';
        if (error.code === 'auth/wrong-password') {
            message = 'Senha atual incorreta';
        } else if (error.code === 'auth/weak-password') {
            message = 'A nova senha é muito fraca';
        }
        
        showToast(message, 'error');
    } finally {
        hideLoading();
    }
}

async createBackup() {
    showLoading('Criando backup...');
    
    try {
        const userId = auth.currentUser.uid;
        
        // Get all user data
        const backupData = {
            user: auth.currentUser,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        // Convert to JSON
        const jsonData = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `cronoz_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Backup criado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao criar backup:', error);
        showToast('Erro ao criar backup', 'error');
    } finally {
        hideLoading();
    }
}

async linkGoogleAccount() {
    showToast('Vinculação com Google em desenvolvimento', 'info');
}

async deleteAccount() {
    const user = auth.currentUser;
    if (!user) return;
    
    const confirmation = confirm(
        'Tem certeza que deseja excluir sua conta?\n\n' +
        'Esta ação é PERMANENTE e irá:\n' +
        '• Excluir todos os seus dados\n' +
        '• Remover todos os contatos\n' +
        '• Apagar suas conversas\n' +
        '• Eliminar seu calendário\n\n' +
        'Digite "EXCLUIR" para confirmar:'
    );
    
    if (!confirmation) return;
    
    const userInput = prompt('Digite "EXCLUIR" para confirmar a exclusão:');
    if (userInput !== 'EXCLUIR') {
        showToast('Exclusão cancelada', 'info');
        return;
    }
    
    // Ask for password
    const password = prompt('Digite sua senha para confirmar:');
    if (!password) {
        showToast('Exclusão cancelada', 'info');
        return;
    }
    
    showLoading('Excluindo conta...');
    try {
        // Reauthenticate
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
        
        // Delete user document from Firestore
        const userRef = doc(db, 'users', user.uid);
        await deleteDoc(userRef).catch(() => {
            console.log('User document not found or already deleted');
        });
        
        // Delete user account
        await user.delete();
        
        showToast('Conta excluída com sucesso', 'success');
        
        // App will redirect to login via auth listener
        
    } catch (error) {
        console.error('Erro ao excluir conta:', error);
        
        let message = 'Erro ao excluir conta';
        if (error.code === 'auth/wrong-password') {
            message = 'Senha incorreta';
        } else if (error.code === 'auth/requires-recent-login') {
            message = 'Reautenticação necessária. Faça login novamente.';
        }
        
        showToast(message, 'error');
    } finally {
        hideLoading();
    }
}

setupSupportButtons() {
    const supportButtons = {
        'btn-report': 'Reportar Problema',
        'btn-help': 'Central de Ajuda',
        'btn-tutorial': 'Tutorial',
        'btn-terms': 'Termos de Uso',
        'btn-faq': 'FAQ'
    };
    
    Object.keys(supportButtons).forEach(btnId => {
        const button = document.getElementById(btnId);
        if (button) {
            button.addEventListener('click', () => {
                this.openSupportSection(supportButtons[btnId]);
            });
        }
    });
}

openSupportSection(section) {
    const contentMap = {
        'Reportar Problema': `
            <div class="support-section">
                <h4><i class="fas fa-bug"></i> Reportar Problema</h4>
                <form id="report-form">
                    <div class="modal-form-group">
                        <label for="report-type">Tipo de Problema</label>
                        <select id="report-type">
                            <option value="bug">Bug/Erro</option>
                            <option value="suggestion">Sugestão</option>
                            <option value="performance">Problema de Performance</option>
                            <option value="other">Outro</option>
                        </select>
                    </div>
                    
                    <div class="modal-form-group">
                        <label for="report-description">Descrição *</label>
                        <textarea id="report-description" rows="5" required
                                  placeholder="Descreva o problema em detalhes..."></textarea>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary close-modal">Cancelar</button>
                        <button type="submit" class="btn-primary">Enviar Relatório</button>
                    </div>
                </form>
            </div>
        `,
        'Central de Ajuda': `
            <div class="support-section">
                <h4><i class="fas fa-question-circle"></i> Central de Ajuda</h4>
                <div class="help-content">
                    <h5>Perguntas Frequentes:</h5>
                    <div class="faq-list">
                        <div class="faq-item">
                            <h6>Como adicionar contatos?</h6>
                            <p>Vá para a aba "Contatos" e clique no botão "+". Você pode adicionar manualmente ou importar do dispositivo.</p>
                        </div>
                        <div class="faq-item">
                            <h6>Como criar um evento no calendário?</h6>
                            <p>No calendário, clique em uma data e selecione "Adicionar Evento". Preencha os detalhes e salve.</p>
                        </div>
                        <div class="faq-item">
                            <h6>Como compartilhar álbuns?</h6>
                            <p>Abra o álbum, clique no ícone de compartilhar e selecione os contatos ou gere um link.</p>
                        </div>
                    </div>
                </div>
            </div>
        `,
        'Tutorial': `
            <div class="support-section">
                <h4><i class="fas fa-graduation-cap"></i> Tutorial</h4>
                <div class="tutorial-steps">
                    <div class="step">
                        <h5>Passo 1: Configuração Inicial</h5>
                        <p>Complete seu perfil com foto, nome e data de nascimento.</p>
                    </div>
                    <div class="step">
                        <h5>Passo 2: Adicionar Contatos</h5>
                        <p>Importe seus contatos ou adicione manualmente.</p>
                    </div>
                    <div class="step">
                        <h5>Passo 3: Explorar Funcionalidades</h5>
                        <p>Experimente o chat, calendário, árvore genealógica e álbuns.</p>
                    </div>
                </div>
            </div>
        `
    };
    
    const content = contentMap[section] || `
        <div class="support-section">
            <h4>${section}</h4>
            <p>Conteúdo em desenvolvimento.</p>
        </div>
    `;
    
    this.showModal(section, content);
    
    // Handle report form submission
    const reportForm = document.getElementById('report-form');
    if (reportForm) {
        reportForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitReport();
        });
    }
}

    async submitReport() {
        const type = document.getElementById('report-type').value;
        const description = document.getElementById('report-description').value.trim();
        
        if (!description) {
            showToast('Digite uma descrição', 'warning');
            return;
        }
        
        showLoading('Enviando relatório...');
        
        try {
            // Simulate sending report
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            this.closeModal();
            showToast('Relatório enviado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao enviar relatório:', error);
            showToast('Erro ao enviar relatório', 'error');
        } finally {
            hideLoading();
        }
    }
    
    setupPremiumButtons() {
        // Premium subscription buttons
        document.querySelectorAll('.premium-card .btn-primary').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = e.target.closest('.premium-card');
                const plan = card.querySelector('h3').textContent;
                this.openPremiumModal(plan);
            });
        });
        
        // Redeem promo code
        const redeemBtn = document.getElementById('btn-redeem');
        if (redeemBtn) {
            redeemBtn.addEventListener('click', () => {
                this.redeemPromoCode();
            });
        }
    }
    
    openPremiumModal(plan) {
        const modalContent = `
            <div class="premium-modal">
                <h4><i class="fas fa-crown"></i> ${plan}</h4>
                
                <div class="premium-features">
                    <h5>Benefícios:</h5>
                    <ul>
                        <li><i class="fas fa-check"></i> Remoção de anúncios</li>
                        <li><i class="fas fa-check"></i> Temas exclusivos</li>
                        <li><i class="fas fa-check"></i> Backup automático</li>
                        <li><i class="fas fa-check"></i> Suporte prioritário</li>
                        <li><i class="fas fa-check"></i> Limite de armazenamento aumentado</li>
                    </ul>
                </div>
                
                <div class="premium-payment">
                    <h5>Selecionar Método de Pagamento:</h5>
                    <div class="payment-methods">
                        <label class="payment-method">
                            <input type="radio" name="payment" value="credit" checked>
                            <i class="fas fa-credit-card"></i> Cartão de Crédito
                        </label>
                        <label class="payment-method">
                            <input type="radio" name="payment" value="pix">
                            <i class="fas fa-barcode"></i> PIX
                        </label>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn-secondary close-modal">Cancelar</button>
                    <button type="button" class="btn-primary" id="btn-confirm-purchase">
                        Confirmar Assinatura
                    </button>
                </div>
            </div>
        `;
        
        this.showModal('Assinar Premium', modalContent);
        
        document.getElementById('btn-confirm-purchase')?.addEventListener('click', () => {
            this.processPremiumPurchase(plan);
        });
    }
    
    async processPremiumPurchase(plan) {
        showLoading('Processando pagamento...');
        
        try {
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.closeModal();
            showToast('Assinatura ativada com sucesso!', 'success');
            
            // Update UI
            const statusBadge = document.getElementById('premium-status');
            if (statusBadge) {
                statusBadge.textContent = 'Premium';
                statusBadge.className = 'status-badge premium';
            }
            
        } catch (error) {
            console.error('Erro no processamento:', error);
            showToast('Erro no processamento do pagamento', 'error');
        } finally {
            hideLoading();
        }
    }
    
    redeemPromoCode() {
        const promoCode = document.getElementById('promo-code').value.trim().toUpperCase();
        
        if (!promoCode) {
            showToast('Digite um código promocional', 'warning');
            return;
        }
        
        // Simulate code validation
        const validCodes = {
            'CRONOZ2024': { type: 'month', value: 1 },
            'PREMIUM1Y': { type: 'year', value: 1 },
            'VIPLIFE': { type: 'lifetime', value: 1 }
        };
        
        showLoading('Validando código...');
        
        setTimeout(() => {
            hideLoading();
            
            if (validCodes[promoCode]) {
                const reward = validCodes[promoCode];
                let message = '';
                
                switch (reward.type) {
                    case 'month':
                        message = '1 mês de Premium ativado!';
                        break;
                    case 'year':
                        message = '1 ano de Premium ativado!';
                        break;
                    case 'lifetime':
                        message = 'Assinatura vitalícia ativada!';
                        break;
                }
                
                showToast(message, 'success');
                
                // Clear input
                document.getElementById('promo-code').value = '';
                
                // Update status
                const statusBadge = document.getElementById('premium-status');
                if (statusBadge) {
                    statusBadge.textContent = 'Premium';
                    statusBadge.className = 'status-badge premium';
                }
                
            } else {
                showToast('Código promocional inválido ou expirado', 'error');
            }
        }, 1500);
    }
    
    showModal(title, content) {
        const modal = document.getElementById('modal-contact') || 
                      document.getElementById('modal-event') ||
                      document.createElement('div');
        
        if (!modal.id) {
            modal.id = 'settings-modal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">${content}</div>
        `;
        
        modal.classList.add('active');
        document.getElementById('modal-overlay').classList.add('active');
        
        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });
    }
    
    closeModal() {
        const modals = document.querySelectorAll('.modal');
        const overlay = document.getElementById('modal-overlay');
        
        modals.forEach(modal => modal.classList.remove('active'));
        if (overlay) overlay.classList.remove('active');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const settingsSystem = new SettingsSystem();
    window.settingsSystem = settingsSystem;
    console.log('Sistema de configurações inicializado!');
});

export default SettingsSystem;