// settings.js - Configurações Avançadas
class SettingsModule {
    constructor(app) {
        this.app = app;
        this.settings = app.settings;
        
        this.init();
    }
    
    init() {
        this.render();
        this.setupEventListeners();
    }
    
    render() {
        const container = document.getElementById('settings-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="settings-header">
                <h2>Configurações</h2>
            </div>
            
            <div class="settings-layout">
                <div class="settings-sidebar">
                    <div class="settings-menu">
                        <button class="menu-item active" data-section="appearance">
                            <i class="fas fa-palette"></i> Aparência
                        </button>
                        <button class="menu-item" data-section="account">
                            <i class="fas fa-user"></i> Conta
                        </button>
                        <button class="menu-item" data-section="notifications">
                            <i class="fas fa-bell"></i> Notificações
                        </button>
                        <button class="menu-item" data-section="privacy">
                            <i class="fas fa-lock"></i> Privacidade
                        </button>
                        <button class="menu-item" data-section="backup">
                            <i class="fas fa-cloud"></i> Backup
                        </button>
                        <button class="menu-item" data-section="monetization">
                            <i class="fas fa-dollar-sign"></i> Monetização
                        </button>
                        <button class="menu-item" data-section="support">
                            <i class="fas fa-headset"></i> Suporte
                        </button>
                        <button class="menu-item" data-section="about">
                            <i class="fas fa-info-circle"></i> Sobre
                        </button>
                    </div>
                </div>
                
                <div class="settings-content">
                    <div class="settings-section active" id="appearance-section">
                        <h3>Aparência</h3>
                        
                        <div class="setting-group">
                            <label>Tema</label>
                            <div class="theme-selector">
                                <button class="theme-option ${this.settings.theme === 'light' ? 'active' : ''}" 
                                        data-theme="light">
                                    <i class="fas fa-sun"></i>
                                    <span>Claro</span>
                                </button>
                                <button class="theme-option ${this.settings.theme === 'dark' ? 'active' : ''}" 
                                        data-theme="dark">
                                    <i class="fas fa-moon"></i>
                                    <span>Escuro</span>
                                </button>
                                <button class="theme-option ${this.settings.theme === 'auto' ? 'active' : ''}" 
                                        data-theme="auto">
                                    <i class="fas fa-adjust"></i>
                                    <span>Automático</span>
                                </button>
                            </div>
                        </div>

                        <div class="setting-group">
                            <label>Cor Primária</label>
                            <div class="color-picker">
                                <input type="color" id="primary-color" value="${this.settings.primaryColor || '#4CAF50'}">
                                <div class="color-presets">
                                    ${['#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#F44336'].map(color => `
                                        <div class="color-preset" style="background-color: ${color};" 
                                             data-color="${color}"></div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        
                        <div class="setting-group">
                            <label>Densidade da Interface</label>
                            <select id="density-select">
                                <option value="comfortable" ${this.settings.density === 'comfortable' ? 'selected' : ''}>
                                    Confortável
                                </option>
                                <option value="compact" ${this.settings.density === 'compact' ? 'selected' : ''}>
                                    Compacta
                                </option>
                            </select>
                        </div>
                        
                        <div class="setting-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="animations-toggle" 
                                       ${this.settings.animations ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                Animações
                            </label>
                        </div>
                    </div>
                    
                    <div class="settings-section" id="account-section">
                        <h3>Conta</h3>
                        
                        <div class="setting-group">
                            <label>Nome</label>
                            <input type="text" id="display-name" value="${this.app.user?.displayName || ''}">
                        </div>
                        
                        <div class="setting-group">
                            <label>Email</label>
                            <input type="email" id="email" value="${this.app.user?.email || ''}" disabled>
                        </div>
                        
                        <div class="setting-group">
                            <label>Foto de Perfil</label>
                            <div class="avatar-upload">
                                <div class="avatar-preview" id="avatar-preview">
                                    ${this.app.user?.photoURL ? 
                                        `<img src="${this.app.user.photoURL}" alt="Avatar">` : 
                                        `<i class="fas fa-user"></i>`}
                                </div>
                                <input type="file" id="avatar-input" accept="image/*">
                                <button class="btn btn-secondary" id="upload-avatar-btn">Alterar</button>
                            </div>
                        </div>
                        
                        <div class="setting-group">
                            <button class="btn btn-warning" id="change-password-btn">
                                Alterar Senha
                            </button>
                        </div>
                        
                        <div class="setting-group">
                            <button class="btn btn-danger" id="delete-account-btn">
                                Excluir Conta
                            </button>
                        </div>
                    </div>
                    
                    <div class="settings-section" id="notifications-section">
                        <h3>Notificações</h3>
                        
                        <div class="setting-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="notifications-toggle" 
                                       ${this.settings.notifications ? 'checked' : ''}>
                                <span class="checkmark"></span>
                                Habilitar notificações
                            </label>
                        </div>

                        <div class="setting-group">
                            <label>Notificações por Email</label>
                            <div class="checkbox-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="email-messages" 
                                           ${this.settings.emailMessages ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    Novas mensagens
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="email-events" 
                                           ${this.settings.emailEvents ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    Lembretes de eventos
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="email-updates" 
                                           ${this.settings.emailUpdates ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    Atualizações do sistema
                                </label>
                            </div>
                        </div>
                        
                        <div class="setting-group">
                            <label>Notificações Push</label>
                            <div class="checkbox-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="push-messages" 
                                           ${this.settings.pushMessages ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    Mensagens
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="push-birthdays" 
                                           ${this.settings.pushBirthdays ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    Aniversários
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="push-events" 
                                           ${this.settings.pushEvents ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    Eventos
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-section" id="privacy-section">
                        <h3>Privacidade</h3>
                        
                        <div class="setting-group">
                            <label>Visibilidade do Perfil</label>
                            <select id="profile-visibility">
                                <option value="public" ${this.settings.profileVisibility === 'public' ? 'selected' : ''}>
                                    Público
                                </option>
                                <option value="contacts" ${this.settings.profileVisibility === 'contacts' ? 'selected' : ''}>
                                    Apenas contatos
                                </option>
                                <option value="private" ${this.settings.profileVisibility === 'private' ? 'selected' : ''}>
                                    Privado
                                </option>
                            </select>
                        </div>

                        <div class="setting-group">
                            <label>Compartilhamento de Dados</label>
                            <div class="checkbox-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="share-contacts" 
                                           ${this.settings.shareContacts ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    Permitir que contatos me encontrem
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="share-calendar" 
                                           ${this.settings.shareCalendar ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    Compartilhar calendário com contatos
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="share-tree" 
                                           ${this.settings.shareTree ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    Compartilhar árvore genealógica
                                </label>
                            </div>
                        </div>
                        
                        <div class="setting-group">
                            <label>Bloqueio de Captura de Tela</label>
                            <div class="checkbox-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="block-screenshots" 
                                           ${this.settings.blockScreenshots ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    Bloquear captura de tela em álbuns privados
                                </label>
                            </div>
                        </div>
                        
                        <div class="setting-group">
                            <button class="btn btn-secondary" id="data-export-btn">
                                Exportar Meus Dados
                            </button>
                            <button class="btn btn-danger" id="clear-data-btn">
                                Limpar Todos os Dados
                            </button>
                        </div>
                    </div>
                    
                    <div class="settings-section" id="backup-section">
                        <h3>Backup</h3>
                        
                        <div class="setting-group">
                            <label>Frequência de Backup Automático</label>
                            <select id="backup-frequency">
                                <option value="daily" ${this.settings.backupFrequency === 'daily' ? 'selected' : ''}>
                                    Diário
                                </option>
                                <option value="weekly" ${this.settings.backupFrequency === 'weekly' ? 'selected' : ''}>
                                    Semanal
                                </option>
                                <option value="monthly" ${this.settings.backupFrequency === 'monthly' ? 'selected' : ''}>
                                    Mensal
                                </option>
                                <option value="never" ${this.settings.backupFrequency === 'never' ? 'selected' : ''}>
                                    Nunca
                                </option>
                            </select>
                        </div>

                        <div class="setting-group">
                            <label>Último Backup</label>
                            <p id="last-backup">${this.settings.lastBackup || 'Nunca'}</p>
                        </div>
                        
                        <div class="setting-group">
                            <button class="btn btn-primary" id="backup-now-btn">
                                Fazer Backup Agora
                            </button>
                            <button class="btn btn-secondary" id="restore-backup-btn">
                                Restaurar Backup
                            </button>
                        </div>
                        
                        <div class="setting-group">
                            <label>Backup na Nuvem</label>
                            <div class="checkbox-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="cloud-backup" 
                                           ${this.settings.cloudBackup ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    Habilitar backup automático na nuvem
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-section" id="monetization-section">
                        <h3>Monetização</h3>
                        
                        <div class="setting-group">
                            <label>Plano Atual</label>
                            <div class="plan-card ${this.settings.plan === 'premium' ? 'premium' : 'free'}">
                                <h4>${this.settings.plan === 'premium' ? 'Premium' : 'Gratuito'}</h4>
                                <p>${this.settings.plan === 'premium' ? 
                                    'Acesso a todos os recursos' : 
                                    'Recursos limitados'}</p>
                                ${this.settings.plan === 'free' ? 
                                    `<button class="btn btn-primary" id="upgrade-btn">Fazer Upgrade</button>` : 
                                    `<button class="btn btn-secondary" id="downgrade-btn">Cancelar Premium</button>`}
                            </div>
                        </div>
                        
                        <div class="setting-group">
                            <label>Anúncios</label>
                            <div class="checkbox-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="show-ads" 
                                           ${this.settings.showAds ? 'checked' : ''}>
                                    <span class="checkmark"></span>
                                    Mostrar anúncios (plano gratuito)
                                </label>
                            </div>
                        </div>
                        
                        <div class="setting-group">
                            <label>Código Promocional</label>
                            <div class="promo-code">
                                <input type="text" id="promo-code-input" placeholder="Digite o código">
                                <button class="btn btn-secondary" id="apply-promo-btn">Aplicar</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-section" id="support-section">
                        <h3>Suporte</h3>
                        
                        <div class="setting-group">
                            <label>Suporte por IA</label>
                            <button class="btn btn-primary" id="ai-support-btn">
                                <i class="fas fa-robot"></i> Falar com Assistente IA
                            </button>
                        </div>
                        
                        <div class="setting-group">
                            <label>Relatar Problema</label>
                            <textarea id="issue-description" rows="4" 
                                      placeholder="Descreva o problema..."></textarea>
                            <button class="btn btn-secondary" id="report-issue-btn">Enviar Relatório</button>
                        </div>
                        
                        <div class="setting-group">
                            <label>Sugerir Funcionalidade</label>
                            <textarea id="feature-suggestion" rows="4" 
                                      placeholder="Sua sugestão..."></textarea>
                            <button class="btn btn-secondary" id="suggest-feature-btn">Enviar Sugestão</button>
                        </div>
                        
                        <div class="setting-group">
                            <label>Contato do Administrador</label>
                            <p>admin@cronoz.com</p>
                        </div>
                    </div>
                    
                    <div class="settings-section" id="about-section">
                        <h3>Sobre</h3>
                        
                        <div class="about-content">
                            <div class="app-info">
                                <h4>CronoZ App</h4>
                                <p>Versão 1.0.0</p>
                                <p>© 2024 CronoZ. Todos os direitos reservados.</p>
                            </div>
                            
                            <div class="links">
                                <a href="#" id="terms-link">Termos de Uso</a>
                                <a href="#" id="privacy-link">Política de Privacidade</a>
                                <a href="#" id="licenses-link">Licenças</a>
                            </div>
                            
                            <div class="stats">
                                <div class="stat">
                                    <strong>${this.app.modules.contacts.contacts.length}</strong>
                                    <span>Contatos</span>
                                </div>
                                <div class="stat">
                                    <strong>${this.app.modules.calendar.events.length}</strong>
                                    <span>Eventos</span>
                                </div>
                                <div class="stat">
                                    <strong>${this.app.modules.albums.albums.length}</strong>
                                    <span>Álbuns</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

  setupEventListeners() {
        document.addEventListener('click', (e) => {
            // Menu lateral
            if (e.target.closest('.menu-item')) {
                const menuItem = e.target.closest('.menu-item');
                const section = menuItem.dataset.section;
                
                // Remover ativo de todos
                document.querySelectorAll('.menu-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                // Adicionar ativo ao selecionado
                menuItem.classList.add('active');
                
                // Mostrar seção correspondente
                document.querySelectorAll('.settings-section').forEach(sec => {
                    sec.classList.remove('active');
                });
                
                document.getElementById(`${section}-section`).classList.add('active');
            }
            
            // Tema
            if (e.target.closest('.theme-option')) {
                const theme = e.target.closest('.theme-option').dataset.theme;
                this.changeTheme(theme);
            }
            
            // Cor primária
            if (e.target.closest('.color-preset')) {
                const color = e.target.closest('.color-preset').dataset.color;
                document.getElementById('primary-color').value = color;
                this.changePrimaryColor(color);
            }
            
            // Backup agora
            if (e.target.id === 'backup-now-btn') {
                this.createBackup();
            }
            
            // Alterar senha
            if (e.target.id === 'change-password-btn') {
                this.changePassword();
            }
            
            // Exportar dados
            if (e.target.id === 'data-export-btn') {
                this.exportData();
            }
            
            // Suporte por IA
            if (e.target.id === 'ai-support-btn') {
                this.openAISupport();
            }
        });
        
        // Ouvir mudanças em inputs
        const primaryColorInput = document.getElementById('primary-color');
        if (primaryColorInput) {
            primaryColorInput.addEventListener('change', (e) => {
                this.changePrimaryColor(e.target.value);
            });
        }
        
        // Configurações de densidade
        const densitySelect = document.getElementById('density-select');
        if (densitySelect) {
            densitySelect.addEventListener('change', (e) => {
                this.settings.density = e.target.value;
                this.saveSettings();
                this.applyDensity();
            });
        }

    // Configurações de notificações
        const notificationsToggle = document.getElementById('notifications-toggle');
        if (notificationsToggle) {
            notificationsToggle.addEventListener('change', (e) => {
                this.settings.notifications = e.target.checked;
                this.saveSettings();
                
                if (e.target.checked && 'Notification' in window) {
                    Notification.requestPermission();
                }
            });
        }
    }
    
    changeTheme(theme) {
        this.settings.theme = theme;
        this.saveSettings();
        this.applyTheme();
        
        // Atualizar botões ativos
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    }
    
    changePrimaryColor(color) {
        this.settings.primaryColor = color;
        this.saveSettings();
        this.applyPrimaryColor(color);
    }
    
    applyTheme() {
        const root = document.documentElement;
        
        switch (this.settings.theme) {
            case 'dark':
                root.setAttribute('data-theme', 'dark');
                break;
            case 'light':
                root.setAttribute('data-theme', 'light');
                break;
            case 'auto':
                root.removeAttribute('data-theme');
                break;
        }
    }
    
    applyPrimaryColor(color) {
        const root = document.documentElement;
        root.style.setProperty('--primary-color', color);
        root.style.setProperty('--primary-color-dark', this.darkenColor(color, 20));
        root.style.setProperty('--primary-color-light', this.lightenColor(color, 20));
    }
    
    applyDensity() {
        const root = document.documentElement;
        if (this.settings.density === 'compact') {
            root.style.setProperty('--spacing-unit', '4px');
            root.style.setProperty('--border-radius', '3px');
        } else {
            root.style.setProperty('--spacing-unit', '8px');
            root.style.setProperty('--border-radius', '6px');
        }
    }

  darkenColor(color, percent) {
        // Implementar escurecimento de cor
        return color;
    }
    
    lightenColor(color, percent) {
        // Implementar clareamento de cor
        return color;
    }
    
    async createBackup() {
        try {
            const user = this.app.user;
            if (!user) return;
            
            // Coletar todos os dados do usuário
            const backupData = {
                contacts: this.app.modules.contacts.contacts,
                events: this.app.modules.calendar.events,
                tree: this.app.modules.tree.treeData,
                albums: this.app.modules.albums.albums,
                settings: this.settings,
                timestamp: new Date().toISOString()
            };
            
            // Salvar no Firebase
            const backupRef = ref(db, `users/${user.uid}/backups/${Date.now()}`);
            await set(backupRef, backupData);
            
            // Atualizar último backup
            this.settings.lastBackup = new Date().toLocaleString('pt-BR');
            this.saveSettings();
            
            // Atualizar interface
            document.getElementById('last-backup').textContent = this.settings.lastBackup;
            
            alert('Backup criado com sucesso!');
        } catch (error) {
            console.error('Erro ao criar backup:', error);
            alert('Erro ao criar backup.');
        }
    }

  async changePassword() {
        const newPassword = prompt('Digite a nova senha:');
        if (!newPassword) return;
        
        const confirmPassword = prompt('Confirme a nova senha:');
        if (newPassword !== confirmPassword) {
            alert('As senhas não coincidem!');
            return;
        }
        
        try {
            await updatePassword(this.app.user, newPassword);
            alert('Senha alterada com sucesso!');
        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            alert('Erro ao alterar senha.');
        }
    }
    
    async exportData() {
        try {
            const user = this.app.user;
            if (!user) return;
            
            // Coletar todos os dados
            const exportData = {
                contacts: this.app.modules.contacts.contacts,
                events: this.app.modules.calendar.events,
                tree: this.app.modules.tree.treeData,
                albums: this.app.modules.albums.albums,
                settings: this.settings
            };
            
            // Criar arquivo JSON
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            // Criar link de download
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `cronoz-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro ao exportar dados:', error);
            alert('Erro ao exportar dados.');
        }
    }

  openAISupport() {
        // Implementar chat de suporte por IA
        alert('Suporte por IA em desenvolvimento...');
    }
    
    saveSettings() {
        this.app.settings = this.settings;
        localStorage.setItem('cronoz_settings', JSON.stringify(this.settings));
        
        // Salvar no Firebase se usuário estiver logado
        if (this.app.user) {
            const settingsRef = ref(db, `users/${this.app.user.uid}/settings`);
            set(settingsRef, this.settings).catch(console.error);
        }
    }
    
    show() {
        document.getElementById('settings-container').style.display = 'block';
        this.render();
    }
    
    hide() {
        const container = document.getElementById('settings-container');
        if (container) {
            container.style.display = 'none';
        }
    }
}
```

