import { db, auth } from './firebase-config.js';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { showToast } from './utils.js';

// Criptografia Simples (Base64) - Pode ser expandida para AES futuramente
const encrypt = (text) => btoa(unescape(encodeURIComponent(text)));
const decrypt = (text) => {
    try { return decodeURIComponent(escape(atob(text))); } 
    catch(e) { return text; }
};

export async function enviarMensagem(chatId, texto) {
    if (!texto.trim()) return;

    // Verifica menção ao Assistente @Z
    if (texto.includes('@Z')) {
        responderComoZ(chatId, texto);
    }

    const msgData = {
        senderId: auth.currentUser.uid,
        texto: encrypt(texto),
        timestamp: serverTimestamp()
    };

    try {
        await addDoc(collection(db, "chats", chatId, "mensagens"), msgData);
    } catch (e) {
        showToast("Erro ao enviar mensagem.");
    }
}

async function responderComoZ(chatId, pergunta) {
    // Simulação de processamento da IA
    setTimeout(async () => {
        const resposta = {
            senderId: "SISTEMA_Z",
            texto: encrypt("Olá! Sou o Z. Estou processando sua dúvida sobre o CronoZ..."),
            timestamp: serverTimestamp(),
            isIA: true
        };
        await addDoc(collection(db, "chats", chatId, "mensagens"), resposta);
    }, 1200);
}

export function ouvirChat(chatId, callback) {
    const q = query(
        collection(db, "chats", chatId, "mensagens"),
        orderBy("timestamp", "asc")
    );

    return onSnapshot(q, (snapshot) => {
        const mensagens = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            texto: decrypt(doc.data().texto)
        }));
        callback(mensagens);
    });
}

export function renderizarChat(chatId, nomeDestino) {
    const area = document.getElementById('content-area');
    area.innerHTML = `
        <div class="chat-container">
            <div id="chat-messages" class="chat-window"></div>
            <div class="chat-input-area card-tray">
                <input type="text" id="input-msg" placeholder="Mensagem (use @Z para ajuda)">
                <button onclick="dispararEnvio('${chatId}')" class="btn-gold">➤</button>
            </div>
        </div>
    `;

    ouvirChat(chatId, (mensagens) => {
        const win = document.getElementById('chat-messages');
        win.innerHTML = mensagens.map(m => `
            <div class="message ${m.senderId === auth.currentUser.uid ? 'msg-sent' : 'msg-received'}">
                ${m.texto}
            </div>
        `).join('');
        win.scrollTop = win.scrollHeight;
    });
}

window.dispararEnvio = (id) => {
    const input = document.getElementById('input-msg');
    enviarMensagem(id, input.value);
    input.value = '';
};
