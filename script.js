// script.js - Sistema Central CronoZ
console.log('📱 CronoZ iniciando...');

// Variáveis de instância global
let auth, db, storage;

// ======================
// INICIALIZAÇÃO E MONITORAMENTO
// ======================

// Aguarda o Firebase ser injetado pelo index.html
const checkFirebase = setInterval(() => {
    if (window.auth && window.db) {
        clearInterval(checkFirebase);
        auth = window.auth;
        db = window.db;
        storage = window.storage;
        console.log('✅ Firebase conectado ao script.js');
        iniciarApp();
    }
}, 500);

function iniciarApp() {
    configurarNavegacao();
    
    // Monitor de estado de autenticação
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log('👤 Usuário logado:', user.email);
            mostrarApp(user);
        } else {
            configurarLogin();
        }
    });
}

// ======================
// NAVEGAÇÃO E TELAS
// ======================

function configurarNavegacao() {
    // Navegação do Rodapé e Sidebar
    const navButtons = document.querySelectorAll('.footer-btn, .menu-item');
    
    navButtons.forEach(btn => {
        btn.onclick = function(e) {
            e.preventDefault();
            const pagina = this.getAttribute('data-page');
            
            // Atualiza classe ativa
            navButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            carregarPagina(pagina);
            
            // Fecha sidebar se for mobile
            if(window.innerWidth < 768) {
                document.getElementById('sidebar')?.classList.remove('active');
                document.getElementById('sidebar-overlay')?.classList.remove('active');
            }
        };
    });

    // Botão de Logout
    const btnSair = document.getElementById('logout-btn');
    if (btnSair) {
        btnSair.onclick = () => {
            auth.signOut().then(() => location.reload());
        };
    }
}

async function carregarPagina(pagina) {
    const conteudo = document.getElementById('app-content');
    const tituloPagina = document.getElementById('page-title');
    
    // Atualiza o título do cabeçalho
    const titulos = {
        'home': 'Início',
        'contacts': 'Meus Contatos',
        'chat': 'Conversas',
        'calendar': 'Calendário',
        'tree': 'Árvore Genealógica',
        'settings': 'Configurações'
    };
    if (tituloPagina) tituloPagina.textContent = titulos[pagina] || 'CronoZ';

    // Roteamento de conteúdo
    switch(pagina) {
        case 'home':
            conteudo.innerHTML = criarTelaPerfil();
            carregarPerfil();
            break;
            
        case 'contacts':
            // Verifica se a função existe no contacts.js
            if (typeof criarTelaContatos === 'function') {
                conteudo.innerHTML = criarTelaContatos();
                carregarContatos(); // Função dentro do contacts.js
            } else {
                conteudo.innerHTML = `<div class="empty-state">Erro ao carregar módulo de contatos.</div>`;
            }
            break;
            
        case 'chat':
            conteudo.innerHTML = `<div class="page-content tray-style"><h2>💬 Chat</h2><p>Módulo em desenvolvimento...</p></div>`;
            break;
            
        case 'calendar':
            conteudo.innerHTML = `<div class="page-content tray-style"><h2>📅 Calendário</h2><p>Módulo em desenvolvimento...</p></div>`;
            break;

        default:
            conteudo.innerHTML = criarTelaPerfil();
            carregarPerfil();
    }
}

// ======================
// GESTÃO DE PERFIL (SEÇÃO 1)
// ======================

function criarTelaPerfil() {
    return `
    <div class="page-content tray-container">
        <div class="welcome-card tray-style mb-4">
            <div class="profile-main-info">
                <div class="profile-avatar-big" id="main-avatar">?</div>
                <div>
                    <h2 id="display-name">Carregando...</h2>
                    <p id="display-email">...</p>
                </div>
            </div>
        </div>

        <div class="tray-style">
            <h3><i class="fas fa-edit"></i> Editar Perfil</h3>
            <div class="form-group">
                <label>Nome Completo</label>
                <input type="text" id="input-nome" class="cronoz-input">
            </div>
            <div class="form-group">
                <label>Data de Nascimento</label>
                <input type="date" id="input-nascimento" class="cronoz-input">
            </div>
            <div class="form-group">
                <label>Telefone</label>
                <input type="tel" id="input-telefone" class="cronoz-input" placeholder="(00) 00000-0000">
            </div>
            <button onclick="salvarPerfil()" class="btn-cronoz primary w-100">
                <i class="fas fa-save"></i> Atualizar Perfil
            </button>
        </div>
    </div>`;
}

async function carregarPerfil() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js");
        const userRef = doc(db, 'usuarios', user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const data = userDoc.data();
            document.getElementById('input-nome').value = data.nome || '';
            document.getElementById('display-name').textContent = data.nome || 'Usuário CronoZ';
            document.getElementById('display-email').textContent = user.email;
            document.getElementById('input-telefone').value = data.telefone || '';
            
            if (data.dataNascimento) {
                const date = data.dataNascimento.toDate ? data.dataNascimento.toDate() : new Date(data.dataNascimento);
                document.getElementById('input-nascimento').value = date.toISOString().split('T')[0];
            }
        }
    } catch (e) { console.error("Erro ao carregar perfil:", e); }
}

async function salvarPerfil() {
    const user = auth.currentUser;
    const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js");
    
    const novosDados = {
        nome: document.getElementById('input-nome').value,
        telefone: document.getElementById('input-telefone').value,
        dataNascimento: new Date(document.getElementById('input-nascimento').value),
        updatedAt: new Date()
    };

    try {
        await updateDoc(doc(db, 'usuarios', user.uid), novosDados);
        alert('✅ Perfil atualizado com sucesso!');
        carregarPerfil();
    } catch (e) { alert('❌ Erro ao salvar.'); }
}

// ======================
// LOGIN E INTERFACE
// ======================

function mostrarApp(usuario) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'block';
    carregarPagina('home');
}

function configurarLogin() {
    const btnEntrar = document.getElementById('login-btn');
    if (btnEntrar) {
        btnEntrar.onclick = async () => {
            const email = document.getElementById('email').value;
            const senha = document.getElementById('password').value;
            const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js");
            
            try {
                await signInWithEmailAndPassword(auth, email, senha);
            } catch (e) {
                alert("Erro no login: " + e.message);
            }
        };
    }
}
