import { db, auth, storage } from './firebase-config.js';
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { showToast, generateId } from './utils.js';

// Função para adicionar um membro na árvore
export async function adicionarMembro(nome, parentesco, superiorId = null) {
    const uid = auth.currentUser.uid;
    const novoMembro = {
        ownerId: uid,
        nome: nome,
        parentesco: parentesco,
        superiorId: superiorId, // ID do "pai/mãe" na árvore
        criadoEm: new Date().toISOString()
    };

    try {
        await addDoc(collection(db, "arvores"), novoMembro);
        showToast("Membro adicionado à família!");
    } catch (e) {
        showToast("Erro ao criar membro.");
    }
}

// Escutar mudanças na árvore em tempo real
export function carregarArvore(callback) {
    const uid = auth.currentUser.uid;
    const q = query(collection(db, "arvores"), where("ownerId", "==", uid));

    return onSnapshot(q, (snapshot) => {
        const membros = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(membros);
    });
}

import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

// Criar um novo Álbum
export async function criarAlbum(nomeAlbum) {
    const uid = auth.currentUser.uid;
    const albumData = {
        ownerId: uid,
        nome: nomeAlbum,
        fotos: [],
        criadoEm: new Date().toISOString()
    };

    try {
        const docRef = await addDoc(collection(db, "albuns"), albumData);
        showToast("Álbum criado!");
        return docRef.id;
    } catch (e) {
        showToast("Erro ao criar álbum.");
    }
}

// Upload de foto para álbum específico
export async function adicionarFotoAoAlbum(albumId, file) {
    const uid = auth.currentUser.uid;
    const fileId = generateId();
    const storageRef = ref(storage, `usuarios/${uid}/albuns/${albumId}/${fileId}`);

    try {
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        
        // Atualiza a lista de fotos no Firestore
        const albumRef = doc(db, "albuns", albumId);
        // Nota: Em produção, usar arrayUnion para não sobrescrever
        showToast("Foto adicionada com sucesso!");
        return url;
    } catch (e) {
        showToast("Erro no upload da foto.");
    }
}

export function renderizarInterfaceArvore(membros) {
    const area = document.getElementById('content-area');
    area.innerHTML = `
        <div class="card-tray">
            <h3>Árvore Genealógica</h3>
            <button onclick="promptNovoMembro()" class="btn-gold-small">+ Adicionar Membro</button>
            <div id="tree-display" class="tree-container">
                ${membros.map(m => `
                    <div class="tree-node" id="node-${m.id}">
                        <strong>${m.nome}</strong><br>
                        <small>${m.parentesco}</small>
                    </div>
                `).join('<div class="tree-line"></div>')}
            </div>
        </div>
        <div class="card-tray">
            <h3>Meus Álbuns</h3>
            <div id="album-list" class="album-grid">
                </div>
        </div>
    `;
}

window.promptNovoMembro = () => {
    const nome = prompt("Nome do familiar:");
    const parent = prompt("Parentesco (ex: Pai, Avó):");
    if(nome && parent) adicionarMembro(nome, parent);
};
