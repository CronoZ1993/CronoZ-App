import { auth, db, googleProvider } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Elementos da Interface
const loginScreen = document.getElementById('login-screen');
const mainInterface = document.getElementById('main-interface');
const btnLogin = document.getElementById('btn-login');
const btnGoogle = document.getElementById('btn-google');

// Função de Login por E-mail
btnLogin.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        alert("Erro ao entrar: " + error.message);
    }
});

// Função de Login pelo Google
btnGoogle.addEventListener('click', async () => {
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (error) {
        alert("Erro no Google Login: " + error.message);
    }
});

// Monitor de Estado de Autenticação
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Usuário logado
        loginScreen.classList.add('hidden');
        mainInterface.classList.remove('hidden');
        iniciarApp(user);
    } else {
        // Usuário deslogado
        loginScreen.classList.remove('hidden');
        mainInterface.classList.add('hidden');
    }
});

// Função principal após o login
function iniciarApp(user) {
    console.log("Bem-vindo ao CronoZ:", user.displayName);
    // Aqui chamaremos as funções de carregar perfil e aniversário
    carregarPerfil(user.uid);
}

// Troca de Telas (Navegação do Rodapé)
window.changeScreen = (screenName) => {
    const title = document.getElementById('screen-title');
    const titles = {
        'home': 'Início',
        'chat': 'Conversas',
        'tree': 'Minha Árvore',
        'config': 'Ajustes'
    };
    title.innerText = titles[screenName] || 'CronoZ';
    // Lógica para injetar o conteúdo de cada bandeja...
};

import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Função para buscar ou criar perfil no Firestore
async function carregarPerfil(uid) {
    const docRef = doc(db, "usuarios", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const dados = docSnap.data();
        renderizarHome(dados);
    } else {
        // Se for o primeiro login, cria um perfil básico
        const novoPerfil = {
            nome: auth.currentUser.displayName || "Novo Usuário",
            email: auth.currentUser.email,
            nascimento: "",
            criadoEm: new Date().toISOString()
        };
        await setDoc(docRef, novoPerfil);
        renderizarHome(novoPerfil);
    }
}

function renderizarHome(dados) {
    const contentArea = document.getElementById('content-area');
    const msgAniversario = calcularMensagemAniversario(dados.nascimento);
    
    contentArea.innerHTML = `
        <section class="card-tray" id="secao-perfil">
            <h3>Meu Perfil</h3>
            <p><strong>Nome:</strong> ${dados.nome}</p>
            <button onclick="abrirEdicao()" class="btn-gold-small">Editar</button>
        </section>
        
        <section class="card-tray" id="secao-niver">
            <p>${msgAniversario}</p>
        </section>
    `;
}

function calcularMensagemAniversario(dataNasc) {
    if (!dataNasc) return "Configure sua data de nascimento para ver o contador!";
    
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    const proxNiver = new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate());
    
    if (hoje > proxNiver) proxNiver.setFullYear(hoje.getFullYear() + 1);
    
    const diffTime = Math.abs(proxNiver - hoje);
    const diffDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const meses = Math.floor(diffDias / 30);

    if (diffDias === 0 || diffDias === 365) return "Parabéns! O CronoZ te deseja um ótimo dia!";
    if (meses >= 9) return "Seu aniversário foi há pouco tempo, mas vamos nos preparar para o próximo!";
    if (meses >= 6) return "Estamos na metade do caminho para o seu dia!";
    if (meses >= 3) return "Faltam apenas alguns meses, a ansiedade começa a bater!";
    if (meses >= 1) return "Falta pouco mais de um mês para o seu grande dia!";
    if (diffDias <= 7) return "É na próxima semana! Já preparou a comemoração?";
    
    return `Faltam ${diffDias} dias para o seu aniversário!`;
}

import { updateDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

// Função para abrir o Pop-up de Edição
window.abrirEdicao = async () => {
    const user = auth.currentUser;
    const docRef = doc(db, "usuarios", user.uid);
    const snap = await getDoc(docRef);
    const d = snap.data();

    const modal = document.createElement('div');
    modal.id = 'modal-edit';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content card-tray">
            <h3>Editar Perfil</h3>
            <div class="edit-scroll">
                <label>Foto de Perfil:</label>
                <input type="file" id="edit-foto" accept="image/*">
                
                <input type="text" id="edit-nome" placeholder="Nome Completo" value="${d.nome || ''}">
                <input type="date" id="edit-nasc" value="${d.nascimento || ''}">
                <input type="tel" id="edit-tel" placeholder="Contato (Telefone)" value="${d.telefone || ''}">
                <input type="email" id="edit-email" placeholder="E-mail" value="${d.email || ''}" disabled>
                <input type="text" id="edit-musica" placeholder="Música Favorita" value="${d.musica || ''}">
            </div>
            <div class="modal-buttons">
                <button onclick="salvarPerfil()" class="btn-gold">Salvar</button>
                <button onclick="fecharModal()" class="btn-cancel">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.fecharModal = () => {
    const m = document.getElementById('modal-edit');
    if(m) m.remove();
};

window.salvarPerfil = async () => {
    const user = auth.currentUser;
    const docRef = doc(db, "usuarios", user.uid);
    
    const fotoFile = document.getElementById('edit-foto').files[0];
    let fotoUrl = null;

    try {
        if (fotoFile) {
            const storageRef = ref(storage, `perfis/${user.uid}/foto-perfil`);
            await uploadBytes(storageRef, fotoFile);
            fotoUrl = await getDownloadURL(storageRef);
        }

        const novosDados = {
            nome: document.getElementById('edit-nome').value,
            nascimento: document.getElementById('edit-nasc').value,
            telefone: document.getElementById('edit-tel').value,
            musica: document.getElementById('edit-musica').value
        };

        if (fotoUrl) novosDados.foto = fotoUrl;

        await updateDoc(docRef, novosDados);
        fecharModal();
        carregarPerfil(user.uid); // Atualiza a tela inicial
    } catch (e) {
        alert("Erro ao salvar: " + e.message);
    }
};

function calcularMensagemAniversario(dataNasc) {
    if (!dataNasc) return "Configure seu nascimento no perfil!";
    
    const hoje = new Date();
    const nasc = new Date(dataNasc);
    const prox = new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate());
    
    if (hoje > prox) prox.setFullYear(hoje.getFullYear() + 1);
    
    const diff = Math.ceil((prox - hoje) / (1000 * 60 * 60 * 24));
    const meses = Math.floor(diff / 30);

    if (diff === 0 || diff === 365) return "Parabéns! O CronoZ te deseja um ótimo dia!";
    if (meses >= 9) return "Seu aniversário foi a pouco tempo, mas vamos nos preparar para o próximo!";
    if (meses >= 6) return "Estamos na metade do caminho para o seu dia!";
    if (meses >= 3) return "Faltam apenas alguns meses, a ansiedade começa a bater!";
    if (meses >= 1) return "Falta pouco mais de um mês para o seu grande dia!";
    if (diff <= 7) return "É na próxima semana! Já preparou a comemoração?";
    
    return `Faltam ${diff} dias para o seu aniversário!`;
}

import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Função para renderizar a Seção 3 (Atalhos e Calendário)
function renderizarAtalhos() {
    const contentArea = document.getElementById('content-area');
    
    const secaoAtalhos = document.createElement('section');
    secaoAtalhos.className = 'card-tray';
    secaoAtalhos.id = 'secao-atalhos';
    secaoAtalhos.innerHTML = `
        <h3>Atalhos Rápidos</h3>
        <div class="shortcut-grid">
            <button onclick="changeScreen('chat')" class="btn-shortcut">Novo Chat</button>
            <button onclick="abrirEdicao()" class="btn-shortcut">Meu Perfil</button>
            <button onclick="changeScreen('tree')" class="btn-shortcut">Ver Árvore</button>
        </div>
        <hr class="gold-line">
        <div id="mini-calendario">
            <h4>Calendário CronoZ</h4>
            <div id="calendar-render"></div>
        </div>
    `;
    contentArea.appendChild(secaoAtalhos);
    gerarMiniCalendario();
}

// Lógica básica do Calendário
function gerarMiniCalendario() {
    const calEl = document.getElementById('calendar-render');
    const data = new Date();
    const mes = data.toLocaleString('default', { month: 'long' });
    const ano = data.getFullYear();
    
    calEl.innerHTML = `<p class="cal-title">${mes} ${ano}</p>`;
    // Futuramente, aqui injetaremos a grade de dias marcada com o aniversário
}

// Inicialização completa da Home
function iniciarApp(user) {
    console.log("CronoZ iniciado");
    carregarPerfil(user.uid);
    // Chamada para renderizar os atalhos após o perfil
    setTimeout(renderizarAtalhos, 500); 
}

// Exportando funções para o escopo global (necessário para os botões do HTML)
window.changeScreen = (screen) => {
    // Lógica de troca de visibilidade das seções
    console.log("Mudando para:", screen);
};

