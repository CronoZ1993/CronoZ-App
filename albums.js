import { db, auth, storage } from './firebase-config.js';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";
import { showToast, gerarId } from './utils.js';

export async function criarAlbum(nome) {
    try {
        await addDoc(collection(db, "albuns"), {
            ownerId: auth.currentUser.uid,
            nome: nome,
            fotos: [],
            criadoEm: new Date().toISOString()
        });
        showToast("Álbum criado!");
        renderAlbums(); 
    } catch (e) {
        showToast("Erro ao criar álbum.");
    }
}

export async function uploadFoto(albumId, file) {
    const uid = auth.currentUser.uid;
    const storageRef = ref(storage, `albuns/${uid}/${albumId}/${gerarId()}`);
    
    try {
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        const albumRef = doc(db, "albuns", albumId);
        
        await updateDoc(albumRef, {
            fotos: arrayUnion({ url, data: new Date().toISOString() })
        });
        showToast("Foto adicionada!");
    } catch (e) {
        showToast("Erro no upload.");
    }
}

export async function carregarAlbunsAmigo(amigoId) {
    const q = query(collection(db, "albuns"), where("ownerId", "==", amigoId));
    const snap = await getDocs(q);
    const container = document.getElementById('amigos-albuns');
    
    if (snap.empty) {
        container.innerHTML = "<p>Este amigo ainda não possui álbuns públicos.</p>";
        return;
    }

    container.innerHTML = snap.docs.map(doc => {
        const a = doc.data();
        const capa = a.fotos.length > 0 ? a.fotos[0].url : 'logo.png';
        return `
            <div class="album-item" onclick="abrirGaleria('${doc.id}')">
                <img src="${capa}">
                <div class="album-label">${a.nome} (${a.fotos.length})</div>
            </div>
        `;
    }).join('');
}

export function renderAlbumsUI(meusAlbuns, listaAmigos) {
    const area = document.getElementById('content-area');
    area.innerHTML = `
        <div class="card-tray">
            <h3>Meus Álbuns</h3>
            <div class="shortcut-grid">
                <button onclick="novoAlbumPrompt()">+ Novo Álbum</button>
            </div>
            <div id="meus-albuns" class="album-grid">
                ${meusAlbuns.map(a => `<div class="album-item"><img src="${a.fotos[0]?.url || 'logo.png'}"><div class="album-label">${a.nome}</div></div>`).join('')}
            </div>
        </div>
        <div class="card-tray">
            <h3>Explorar Amigos</h3>
            <div class="friends-row">
                ${listaAmigos.map(amigo => `
                    <div class="amigo-circle" onclick="carregarAlbunsAmigo('${amigo.uid}')">
                        <img src="${amigo.foto}">
                        <span>${amigo.nome.split(' ')[0]}</span>
                    </div>
                `).join('')}
            </div>
            <div id="amigos-albuns" class="album-grid" style="margin-top:15px"></div>
        </div>
    `;
}

window.novoAlbumPrompt = () => {
    const n = prompt("Nome do álbum:");
    if(n) criarAlbum(n);
};
