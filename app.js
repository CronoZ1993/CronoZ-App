import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Estado Global do App
const CronoZ = {
    user: null,
    telaAtual: 'home',
    config: {
        tema: localStorage.getItem('theme') || 'light',
        corBase: localStorage.getItem('customColor') || '#D4AF37'
    }
};

// Monitor de Autenticação
onAuthStateChanged(auth, (user) => {
    if (user) {
        CronoZ.user = user;
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-interface').classList.remove('hidden');
        inicializarApp();
    } else {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('main-interface').classList.add('hidden');
    }
});

async function inicializarApp() {
    console.log("CronoZ: Iniciando sistema...");
    aplicarPreferencias();
    changeScreen('home'); 
}

// Função Principal de Navegação
window.changeScreen = (target) => {
    const contentArea = document.getElementById('content-area');
    const screenTitle = document.getElementById('screen-title');
    
    // Mapeamento de Títulos conforme o pedido
    const titulos = {
        'home': 'Início',
        'contatos': 'Meus Contatos',
        'chat': 'Conversas Criptografadas',
        'albums': 'Álbuns de Memórias',
        'calendar': 'Calendário CronoZ',
        'tree': 'Árvore Genealógica',
        'config': 'Configurações'
    };

    screenTitle.innerText = titulos[target] || 'CronoZ';
    CronoZ.telaAtual = target;

    // Limpa a área e carrega a tela específica
    contentArea.innerHTML = '<div class="loading">Carregando...</div>';
    roteador(target);
    
    // Fecha o menu lateral caso esteja aberto
    closeMenu();
};

function roteador(target) {
    switch(target) {
        case 'home': renderHome(); break;
        case 'contatos': renderContatos(); break;
        case 'chat': renderChatList(); break;
        case 'albums': renderAlbums(); break;
        case 'calendar': renderCalendar(); break;
        case 'tree': renderTree(); break;
        case 'config': renderConfig(); break;
    }
}

window.toggleMenu = () => {
    const menu = document.getElementById('side-menu');
    menu.classList.toggle('active');
};

window.closeMenu = () => {
    const menu = document.getElementById('side-menu');
    menu.classList.remove('active');
};

function aplicarPreferencias() {
    // Aplica o tema salvo
    if (CronoZ.config.tema === 'dark') {
        document.body.classList.add('dark-theme');
    }
    // Aplica a cor dourada (ou personalizada)
    document.documentElement.style.setProperty('--gold', CronoZ.config.corBase);
}

// Placeholder das funções de renderização 
// (Elas serão preenchidas conforme criarmos os arquivos específicos)
function renderHome() { 
    // Aqui entrará a lógica das bandeiras 1, 2 e 3 do Início
    console.log("Renderizando Home..."); 
}

import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Função para renderizar a Home (Bandejas 1, 2 e 3)
async function renderHome() {
    const user = CronoZ.user;
    const docRef = doc(db, "usuarios", user.uid);
    const docSnap = await getDoc(docRef);
    const dados = docSnap.exists() ? docSnap.data() : { nome: user.displayName, nascimento: "" };

    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <section class="card-tray animate-in">
            <h3>Bem-vindo, ${dados.nome.split(' ')[0]}</h3>
            <p>Sua jornada CronoZ continua aqui.</p>
        </section>
        
        <section class="card-tray" id="niver-tray">
            <p>${calcularMensagemNiver(dados.nascimento)}</p>
        </section>

        <section class="card-tray">
            <h3>Atalhos Rápidos</h3>
            <div class="shortcut-grid">
                <button onclick="changeScreen('chat')">Mensagens</button>
                <button onclick="changeScreen('tree')">Árvore</button>
                <button onclick="toggleMenu()">Ajustes</button>
            </div>
        </section>
    `;
}

function calcularMensagemNiver(data) {
    if (!data) return "Adicione sua data de nascimento para ver o contador.";
    // A lógica de cálculo de dias (que já validamos) entra aqui
    return "Faltam X dias para o seu aniversário!"; 
}

function renderContatos() {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="card-tray">
            <h3>Meus Contatos</h3>
            <div class="search-box">
                <input type="email" id="search-email" placeholder="Buscar por e-mail...">
                <button onclick="buscarNovoContato()" class="btn-gold">Adicionar</button>
            </div>
            <div id="contatos-list"></div>
        </div>
    `;
    // Aqui chamaremos a função de listar contatos do chat.js depois
}

function renderChatList() {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="card-tray">
            <h3>Conversas</h3>
            <div id="chat-threads"></div>
        </div>
    `;
}

function renderAlbums() {
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
        <div class="card-tray">
            <h3>Meus Álbuns</h3>
            <div class="album-grid" id="meus-albuns"></div>
            <hr>
            <h3>Álbuns de Amigos</h3>
            <div id="amigos-albuns"></div>
        </div>
    `;
}

function renderCalendar() {
    document.getElementById('content-area').innerHTML = `
        <div class="card-tray">
            <h3>Calendário CronoZ</h3>
            <div id="calendar-full"></div>
        </div>
    `;
}

function renderTree() {
    document.getElementById('content-area').innerHTML = `
        <div class="card-tray">
            <div class="tabs-tree">
                <button onclick="mudarAbaTree('lista')">Lista</button>
                <button onclick="mudarAbaTree('arvore')">Árvore</button>
            </div>
            <div id="tree-container"></div>
        </div>
    `;
}

function renderConfig() {
    document.getElementById('content-area').innerHTML = `
        <div class="card-tray">
            <h3>Configurações da Conta</h3>
            <button onclick="abrirEdicao()" class="btn-gold">Editar Perfil</button>
            <button onclick="fazerBackup()" class="btn-gold">Exportar Dados</button>
            <hr>
            <button onclick="excluirConta()" class="btn-danger">Excluir Minha Conta</button>
        </div>
    `;
}

// Inicializa o evento de logout global
window.sairDaConta = () => {
    auth.signOut();
};

// Registro do PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
    .then(() => console.log("CronoZ: Offline Ready!"))
    .catch((err) => console.log("Erro PWA:", err));
}
