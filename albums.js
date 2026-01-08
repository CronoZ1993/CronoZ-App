import { db, auth, storage } from './firebase-config.js';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";
import { showToast, generateId } from './utils.js';

// Criar novo álbum pessoal
export async function criarNovoAlbum(nome) {
    const uid = auth.currentUser.uid;
    try {
        await addDoc(collection(db, "albuns"), {
            ownerId: uid,
            nome: nome,
            fotos: [],
            privado: true,
            criadoEm: new Date().toISOString()
        });
        showToast("Álbum criado com sucesso!");
    } catch (e) {
        showToast("Erro ao criar álbum.");
    }
}

// Upload de foto para um álbum específico
export async function fazerUploadFoto(albumId, arquivo) {
    const uid = auth.currentUser.uid;
    const fotoId = generateId();
    const storageRef = ref(storage, `usuarios/${uid}/albuns/${albumId}/${fotoId}`);

    try {
        await uploadBytes(storageRef, arquivo);
        const url = await getDownloadURL(storageRef);
        const albumRef = doc(db, "albuns", albumId);
        await updateDoc(albumRef, {
            fotos: arrayUnion({ url, data: new Date().toISOString() })
        });
        showToast("Foto adicionada!");
    } catch (e) {
        showToast("Erro no upload.");
    }
}

// Buscar álbuns de um amigo específico
export async function buscarAlbunsAmigo(amigoId) {
    const q = query(collection(db, "albuns"), where("ownerId", "==", amigoId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Listar contatos que possuem álbuns
export async function listarContatosComAlbuns() {
    const uid = auth.currentUser.uid;
    // Buscamos na coleção de contatos (que será alimentada pelo chat/busca)
    const q = query(collection(db, "usuarios")); 
    const snapshot = await getDocs(q);
    
    return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => u.id !== uid); // Remove a si mesmo da lista de amigos
}

export async function renderizarInterfaceAlbuns() {
    const area = document.getElementById('content-area');
    const amigos = await listarContatosComAlbuns();

    area.innerHTML = `
        <div class="card-tray">
            <h3>Meus Álbuns</h3>
            <button onclick="promptNovoAlbum()" class="btn-gold-small">+ Criar Álbum</button>
            <div id="meus-albuns-list" class="album-grid"></div>
        </div>

        <div class="card-tray">
            <h3>Álbuns de Amigos</h3>
            <div class="amigos-lista-albuns">
                ${amigos.map(amigo => `
                    <div class="amigo-item" onclick="verAlbunsAmigo('${amigo.id}')">
                        <img src="${amigo.foto || 'logo.png'}" class="chat-avatar">
                        <span>${amigo.nome}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

window.promptNovoAlbum = () => {
    const nome = prompt("Nome do álbum:");
    if(nome) criarNovoAlbum(nome);
};

window.verAlbunsAmigo = async (id) => {
    const albuns = await buscarAlbunsAmigo(id);
    // Lógica para abrir os álbuns do amigo selecionado
    console.log("Álbuns do amigo:", albuns);
};
