import { db, auth } from './firebase-config.js';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { showToast } from './utils.js';

// Função para buscar usuário pelo e-mail (conforme seu pedido)
export async function buscarNovoContato(emailBusca) {
    if (!emailBusca) return showToast("Digite um e-mail válido.");
    
    const q = query(collection(db, "usuarios"), where("email", "==", emailBusca.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        showToast("Usuário não encontrado no CronoZ.");
        return;
    }

    const contatoData = querySnapshot.docs[0].data();
    const contatoId = querySnapshot.docs[0].id;

    if (contatoId === auth.currentUser.uid) {
        showToast("Você não pode adicionar a si mesmo.");
        return;
    }

    adicionarAosContatos(contatoId, contatoData);
}

async function adicionarAosContatos(id, dados) {
    const meuUid = auth.currentUser.uid;
    try {
        await addDoc(collection(db, "usuarios", meuUid, "contatos"), {
            uid: id,
            nome: dados.nome,
            email: dados.email,
            foto: dados.foto || 'logo.png',
            adicionadoEm: serverTimestamp()
        });
        showToast(`${dados.nome} adicionado!`);
        renderContatos(); // Atualiza a lista na tela
    } catch (e) {
        showToast("Erro ao adicionar contato.");
    }
}

// Carregar e exibir a lista de contatos
export async function carregarListaContatos() {
    const meuUid = auth.currentUser.uid;
    const q = query(collection(db, "usuarios", meuUid, "contatos"));
    const snapshot = await getDocs(q);
    
    const container = document.getElementById('contatos-list');
    if (snapshot.empty) {
        container.innerHTML = "<p class='empty-msg'>Sua lista de contatos está vazia.</p>";
        return;
    }

    container.innerHTML = snapshot.docs.map(doc => {
        const c = doc.data();
        return `
            <div class="contact-item card-tray animate-in">
                <img src="${c.foto}" class="contact-avatar">
                <div class="contact-info">
                    <strong>${c.nome}</strong>
                    <span>${c.email}</span>
                </div>
                <div class="contact-actions">
                    <button onclick="changeScreen('chat', '${c.uid}')" title="Chat">💬</button>
                    <button onclick="verAlbunsAmigo('${c.uid}')" title="Álbuns">🖼️</button>
                </div>
            </div>
        `;
    }).join('');
}

// Vincula a busca ao input da tela
window.executarBusca = () => {
    const email = document.getElementById('search-email').value;
    buscarNovoContato(email);
};
