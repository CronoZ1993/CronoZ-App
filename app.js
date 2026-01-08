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
