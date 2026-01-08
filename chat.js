import { db, auth } from './firebase-config.js';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { showToast, generateId } from './utils.js';

// Função para buscar usuário e iniciar chat
export async function buscarUsuarioParaChat(emailBusca) {
    const q = query(collection(db, "usuarios"), where("email", "==", emailBusca));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        showToast("Usuário não encontrado.");
        return null;
    }

    const destino = querySnapshot.docs[0].data();
    const destinoId = querySnapshot.docs[0].id;
    return criarOuAbrirChat(destinoId, destino.nome);
}

async function criarOuAbrirChat(destinoId, nomeDestino) {
    const uid = auth.currentUser.uid;
    const chatId = uid < destinoId ? `${uid}_${destinoId}` : `${destinoId}_${uid}`;
    
    // Referência do chat (o Firestore criará se não existir ao enviar a primeira msg)
    abrirInterfaceChat(chatId, nomeDestino);
    return chatId;
}

// Simulação de Criptografia (conforme pedido: Chats Criptografados)
function criptografar(texto) {
    return btoa(texto); // Base64 simples para exemplo; pode ser expandido
}

function descriptografar(texto) {
    try { return atob(texto); } catch(e) { return texto; }
}

export async function enviarMensagem(chatId, texto) {
    if (!texto.trim()) return;

    // Verificar menção à IA @Z
    if (texto.includes('@Z')) {
        processarIA(chatId, texto);
    }

    const msgData = {
        senderId: auth.currentUser.uid,
        texto: criptografar(texto),
        timestamp: serverTimestamp(),
        lida: false
    };

    try {
        await addDoc(collection(db, "chats", chatId, "mensagens"), msgData);
    } catch (error) {
        showToast("Erro ao enviar mensagem.");
    }
}

async function processarIA(chatId, textoUser) {
    // Simulação da resposta da IA @Z
    setTimeout(async () => {
        const respostaZ = {
            senderId: "SISTEMA_Z",
            texto: criptografar("Olá! Sou o assistente Z. Em que posso ajudar com o CronoZ?"),
            timestamp: serverTimestamp(),
            isIA: true
        };
        await addDoc(collection(db, "chats", chatId, "mensagens"), respostaZ);
    }, 1500);
}

// Escuta mensagens em tempo real
export function ouvirMensagens(chatId, callback) {
    const q = query(
        collection(db, "chats", chatId, "mensagens"),
        orderBy("timestamp", "asc")
    );

    return onSnapshot(q, (snapshot) => {
        const mensagens = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            texto: descriptografar(doc.data().texto)
        }));
        callback(mensagens);
    });
}

function abrirInterfaceChat(chatId, nome) {
    const appArea = document.getElementById('content-area');
    // Aplicar classe de proteção se configurado (Seção Extra do pedido)
    if (localStorage.getItem('antiScreenshot') === 'true') {
        appArea.classList.add('protected-view');
    }

    appArea.innerHTML = `
        <div class="chat-header card-tray">
            <button onclick="renderizarHome()">←</button>
            <span>${nome}</span>
        </div>
        <div id="chat-window" class="chat-window"></div>
        <div class="chat-footer">
            <input type="text" id="msg-input" placeholder="Digite @Z para ajuda...">
            <button id="btn-send" class="btn-gold-small">Enviar</button>
        </div>
    `;

    document.getElementById('btn-send').onclick = () => {
        const input = document.getElementById('msg-input');
        enviarMensagem(chatId, input.value);
        input.value = '';
    };

    ouvirMensagens(chatId, (mensagens) => {
        renderizarMensagens(mensagens);
    });
}
