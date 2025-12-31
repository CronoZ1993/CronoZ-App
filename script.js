// script.js - CronoZ App com Firebase v12

// Função para testar Firebase
window.testarFirebase = async function() {
    try {
        // Testar Firestore
        await window.db.collection('testes').add({
            app: 'CronoZ v12',
            mensagem: 'Firebase funcionando!',
            data: new Date().toISOString(),
            url: window.location.href
        });
        
        alert('✅ Firebase testado com sucesso!\nDados salvos no Firestore.');
        
    } catch (error) {
        console.error('Erro Firebase:', error);
        alert('❌ Erro: ' + error.message);
    }
};

// Inicialização do App
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 CronoZ App inicializando...');
    
    // Elementos
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app-screen');
    const loginBtn = document.getElementById('login-btn');
    const googleLoginBtn = document.getElementById('google-login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Login Simples (para teste)
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            console.log('Login clicado');
            
            // Esconder login, mostrar app
            loginScreen.classList.remove('active');
            loginScreen.style.display = 'none';
            
            appScreen.style.display = 'block';
            appScreen.classList.add('active');
            
            // Mostrar mensagem
            document.getElementById('app-content').innerHTML = `
                <div class="welcome-message">
                    <div style="font-size: 60px; margin-bottom: 20px;">🎉</div>
                    <h2>Bem-vindo ao CronoZ!</h2>
                    <p>Firebase v12 conectado com sucesso.</p>
                    
                    <div style="margin-top: 30px;">
                        <button onclick="testarFirebase()" class="btn btn-primary">
                            <i class="fas fa-bolt"></i> Testar Firebase
                        </button>
                        <button onclick="mostrarInfo()" class="btn btn-secondary">
                            <i class="fas fa-info-circle"></i> Informações
                        </button>
                    </div>
                    
                    <div id="test-result" style="margin-top: 20px;"></div>
                </div>
            `;
        });
    }
    
    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Deseja sair do app?')) {
                appScreen.style.display = 'none';
                loginScreen.style.display = 'block';
                loginScreen.classList.add('active');
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
            sidebarOverlay.classList.add('active');
        });
        
        closeSidebar.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
        
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }
    
    // Navegação do footer
    const footerBtns = document.querySelectorAll('.footer-btn');
    footerBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remover active de todos
            footerBtns.forEach(b => b.classList.remove('active'));
            // Adicionar no clicado
            this.classList.add('active');
            
            // Mudar título
            const page = this.dataset.page;
            const pageTitle = document.getElementById('page-title');
            if (pageTitle) {
                const titles = {
                    home: 'Início',
                    contacts: 'Contatos',
                    chat: 'Chat',
                    calendar: 'Calendário',
                    tree: 'Árvore'
                };
                pageTitle.textContent = titles[page] || 'CronoZ';
            }
            
            // Mostrar conteúdo da página
            const content = document.getElementById('app-content');
            content.innerHTML = `
                <div style="padding: 20px;">
                    <h3>${pageTitle.textContent}</h3>
                    <p>Tela em desenvolvimento...</p>
                    <p style="color: #666; margin-top: 20px;">
                        <i class="fas fa-tools"></i> Em breve: ${pageTitle.textContent.toLowerCase()}
                    </p>
                </div>
            `;
        });
    });
});

// Função para mostrar informações
window.mostrarInfo = function() {
    document.getElementById('test-result').innerHTML = `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-top: 20px; text-align: left;">
            <h4><i class="fas fa-info-circle"></i> Informações do App:</h4>
            <p><strong>URL:</strong> ${window.location.href}</p>
            <p><strong>Firebase:</strong> ${window.firebaseApp ? 'Conectado' : 'Não conectado'}</p>
            <p><strong>Storage:</strong> ${window.storage ? 'Disponível' : 'Indisponível'}</p>
            <p><strong>Firestore:</strong> ${window.db ? 'Disponível' : 'Indisponível'}</p>
            <p><strong>Auth:</strong> ${window.auth ? 'Disponível' : 'Indisponível'}</p>
        </div>
    `;
};

console.log('✅ CronoZ script.js carregado!');
