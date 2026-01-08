import { db, auth } from './firebase-config.js';
import { collection, addDoc, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { showToast } from './utils.js';

let abaAtual = 'lista'; // Controle: 'lista' ou 'arvore'

export function renderizarInterfaceArvore(membros) {
    const area = document.getElementById('content-area');
    area.innerHTML = `
        <div class="card-tray">
            <div class="tabs-tree">
                <button onclick="mudarAbaTree('lista')" class="${abaAtual === 'lista' ? 'active' : ''}">Lista</button>
                <button onclick="mudarAbaTree('arvore')" class="${abaAtual === 'arvore' ? 'active' : ''}">Árvore</button>
            </div>
            <button onclick="promptNovoMembro()" class="btn-gold-small" style="margin-top:10px">+ Novo Membro</button>
            
            <div id="tree-content" class="tree-body">
                ${abaAtual === 'lista' ? gerarLista(membros) : gerarGrafico(membros)}
            </div>
        </div>
    `;
}

window.mudarAbaTree = (aba) => {
    abaAtual = aba;
    // Recarrega a interface (o listener do onSnapshot cuidará disso no app.js)
    showToast(`Mudando para ${aba}`);
};

function gerarLista(membros) {
    if (membros.length === 0) return "<p>Nenhum familiar cadastrado.</p>";
    return membros.map(m => `
        <div class="tree-item-list">
            <span><strong>${m.nome}</strong> (${m.parentesco})</span>
        </div>
    `).join('');
}

function gerarGrafico(membros) {
    // Lógica simplificada de hierarquia visual
    return `
        <div class="tree-graph">
            ${membros.map(m => `
                <div class="tree-node">
                    <div class="node-box">${m.nome}</div>
                    <small>${m.parentesco}</small>
                </div>
            `).join('<div class="tree-line-v"></div>')}
        </div>
    `;
}

export async function adicionarMembro(nome, parentesco) {
    try {
        await addDoc(collection(db, "arvores"), {
            ownerId: auth.currentUser.uid,
            nome,
            parentesco,
            criadoEm: new Date().toISOString()
        });
        showToast("Familiar salvo!");
    } catch (e) {
        showToast("Erro ao salvar membro.");
    }
}

window.promptNovoMembro = () => {
    const nome = prompt("Nome do familiar:");
    const parent = prompt("Parentesco:");
    if(nome && parent) adicionarMembro(nome, parent);
};
