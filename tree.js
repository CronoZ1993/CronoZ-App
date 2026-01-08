import { db, auth } from './firebase-config.js';
import { collection, addDoc, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { showToast } from './utils.js';

let abaAtiva = 'lista';

export function inicializarTree() {
    const uid = auth.currentUser.uid;
    const q = query(collection(db, "arvore"), where("ownerId", "==", uid));

    onSnapshot(q, (snapshot) => {
        const membros = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderizarTreeUI(membros);
    });
}

export async function adicionarFamiliar(nome, parentesco, superiorId = null) {
    try {
        await addDoc(collection(db, "arvore"), {
            ownerId: auth.currentUser.uid,
            nome,
            parentesco,
            superiorId, // Para criar a hierarquia
            criadoEm: new Date().toISOString()
        });
        showToast("Membro adicionado!");
    } catch (e) {
        showToast("Erro ao salvar familiar.");
    }
}

window.mudarAbaTree = (aba) => {
    abaAtiva = aba;
    inicializarTree(); // Re-renderiza com a aba nova
};

function renderizarTreeUI(membros) {
    const area = document.getElementById('content-area');
    area.innerHTML = `
        <div class="card-tray">
            <div class="tabs-tree">
                <button onclick="mudarAbaTree('lista')" class="${abaAtiva === 'lista' ? 'active' : ''}">Lista</button>
                <button onclick="mudarAbaTree('arvore')" class="${abaAtiva === 'arvore' ? 'active' : ''}">Estrutura</button>
            </div>
            <button onclick="promptNovoMembro()" class="btn-gold" style="width:100%; margin-top:10px">+ Novo Familiar</button>
        </div>
        <div id="tree-display" class="animate-in">
            ${abaAtiva === 'lista' ? gerarVisaoLista(membros) : gerarVisaoGrafica(membros)}
        </div>
    `;
}

function gerarVisaoLista(membros) {
    if (membros.length === 0) return "<p class='card-tray'>Nenhum familiar cadastrado.</p>";
    return membros.map(m => `
        <div class="card-tray" style="display:flex; justify-content:space-between">
            <strong>${m.nome}</strong> <span>${m.parentesco}</span>
        </div>
    `).join('');
}

function gerarVisaoGrafica(membros) {
    // Lógica visual para hierarquia (exibição vertical simples)
    return `
        <div class="tree-visual-container">
            ${membros.map(m => `
                <div class="tree-node-box">
                    <div class="node-content">${m.nome}</div>
                    <div class="node-tag">${m.parentesco}</div>
                </div>
            `).join('<div class="tree-connector"></div>')}
        </div>
    `;
}

window.promptNovoMembro = () => {
    const n = prompt("Nome:");
    const p = prompt("Parentesco (ex: Pai, Avó):");
    if(n && p) adicionarFamiliar(n, p);
};
