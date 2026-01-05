// albums.js - SISTEMA COMPLETO DE ÁLBUNS DE FOTOS (Parte 1/4)
import { auth, db, storage } from './firebase-config.js';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs,
    setDoc, 
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    arrayUnion
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { 
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

class AlbumsSystem {
    constructor() {
        this.currentUser = null;
        this.albums = [];
        this.currentTab = 'my';
        this.init();
    }

    async init() {
        await this.loadCurrentUser();
        this.setupAlbumsListeners();
    }

    async loadCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
    }

    async renderAlbumsPage() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="albums-container">
                <!-- Cabeçalho -->
                <div class="albums-header">
                    <h2><i class="fas fa-images"></i> Álbuns de Fotos</h2>
                    <div class="header-actions">
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input type="text" id="albumsSearch" placeholder="Buscar álbuns...">
                        </div>
                        <button class="btn-primary" id="newAlbumBtn">
                            <i class="fas fa-plus"></i> Novo Álbum
                        </button>
                    </div>
                </div>

                <!-- Abas -->
                <div class="albums-tabs">
                    <button class="tab-btn active" data-tab="my" onclick="albumsSystem.switchTab('my')">
                        <i class="fas fa-user"></i> Meus Álbuns
                    </button>
                    <button class="tab-btn" data-tab="friends" onclick="albumsSystem.switchTab('friends')">
                        <i class="fas fa-users"></i> Álbuns de Amigos
                    </button>
                </div>

                <!-- Filtros -->
                <div class="albums-filters">
                    <div class="filter-group">
                        <label>Ordenar por:</label>
                        <select id="albumsSort" onchange="albumsSystem.sortAlbums()">
                            <option value="name">Nome (A-Z)</option>
                            <option value="date">Data de Criação</option>
                            <option value="updated">Data Atualização</option>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label>Mostrar:</label>
                        <select id="albumsFilter" onchange="albumsSystem.filterAlbums()">
                            <option value="all">Todos</option>
                            <option value="public">Públicos</option>
                            <option value="private">Privados</option>
                            <option value="shared">Compartilhados</option>
                        </select>
                    </div>
                </div>

                <!-- Grade de Álbuns -->
                <div class="albums-grid" id="albumsGrid">
                    <div class="loading-albums">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Carregando álbuns...</p>
                    </div>
                </div>

                <!-- Estado Vazio -->
                <div class="empty-albums" id="emptyAlbums" style="display: none;">
                    <i class="fas fa-images"></i>
                    <h3>Nenhum álbum encontrado</h3>
                    <p>Crie seu primeiro álbum para começar!</p>
                    <button class="btn-primary" onclick="albumsSystem.showNewAlbumModal()">
                        <i class="fas fa-plus"></i> Criar Álbum
                    </button>
                </div>
            </div>
        `;

        this.setupAlbumsEvents();
        await this.loadAlbums();
        this.addAlbumsStyles();
    }

// Métodos de configuração
setupAlbumsListeners() {
    const userId = localStorage.getItem('userId');
    if (userId) {
        const albumsRef = collection(db, 'users', userId, 'albums');
        onSnapshot(albumsRef, (snapshot) => {
            this.albums = [];
            snapshot.forEach(doc => {
                this.albums.push({ id: doc.id, ...doc.data() });
            });
            this.renderAlbumsGrid();
        });
    }
}

setupAlbumsEvents() {
    document.getElementById('newAlbumBtn')?.addEventListener('click', () => {
        this.showNewAlbumModal();
    });

    document.getElementById('albumsSearch')?.addEventListener('input', (e) => {
        this.searchAlbums(e.target.value);
    });
}

async loadAlbums() {
    try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        const albumsRef = collection(db, 'users', userId, 'albums');
        const q = query(albumsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        
        this.albums = [];
        snapshot.forEach(doc => {
            this.albums.push({ id: doc.id, ...doc.data() });
        });
        
        this.renderAlbumsGrid();
        
    } catch (error) {
        console.error('Erro ao carregar álbuns:', error);
    }
}

renderAlbumsGrid() {
    const albumsGrid = document.getElementById('albumsGrid');
    const emptyState = document.getElementById('emptyAlbums');
    
    if (!albumsGrid) return;

    const filteredAlbums = this.filterAlbumsByTab();
    
    if (filteredAlbums.length === 0) {
        albumsGrid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    albumsGrid.style.display = 'grid';
    
    albumsGrid.innerHTML = filteredAlbums.map(album => `
        <div class="album-card" data-id="${album.id}" onclick="albumsSystem.openAlbum('${album.id}')">
            <div class="album-cover">
                <img src="${album.coverImage || 'https://via.placeholder.com/300x200/FFD700/000?text=CronoZ'}" 
                     alt="${album.name}">
                
                <div class="album-overlay">
                    <div class="album-stats">
                        <span><i class="fas fa-image"></i> ${album.photosCount || 0}</span>
                        <span><i class="fas fa-eye"></i> ${album.views || 0}</span>
                    </div>
                    
                    <div class="album-privacy">
                        ${album.privacy === 'public' ? 
                            '<i class="fas fa-globe-americas" title="Público"></i>' : 
                            album.privacy === 'shared' ?
                            '<i class="fas fa-user-friends" title="Compartilhado"></i>' :
                            '<i class="fas fa-lock" title="Privado"></i>'
                        }
                    </div>
                </div>
            </div>
            
            <div class="album-info">
                <h4 class="album-name">${album.name}</h4>
                <p class="album-description">${album.description || 'Sem descrição'}</p>
                
                <div class="album-meta">
                    <span class="album-date">
                        <i class="fas fa-calendar"></i>
                        ${this.formatDate(album.createdAt)}
                    </span>
                    
                    <span class="album-shared">
                        ${album.sharedWith ? 
                            `<i class="fas fa-share-alt"></i> ${album.sharedWith.length}` : 
                            ''
                        }
                    </span>
                </div>
                
                <div class="album-tags">
                    ${album.tags ? album.tags.map(tag => 
                        `<span class="album-tag">${tag}</span>`
                    ).join('') : ''}
                </div>
            </div>
            
            <div class="album-actions">
                <button class="action-btn" onclick="event.stopPropagation(); albumsSystem.editAlbum('${album.id}')" 
                        title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                
                <button class="action-btn" onclick="event.stopPropagation(); albumsSystem.shareAlbum('${album.id}')" 
                        title="Compartilhar">
                    <i class="fas fa-share"></i>
                </button>
                
                <button class="action-btn" onclick="event.stopPropagation(); albumsSystem.deleteAlbum('${album.id}')" 
                        title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

filterAlbumsByTab() {
    let filtered = [...this.albums];
    
    // Filtrar por aba
    if (this.currentTab === 'friends') {
        filtered = filtered.filter(album => album.sharedWith && album.sharedWith.includes(this.currentUser.uid));
    }
    
    // Filtrar por seleção
    const filterValue = document.getElementById('albumsFilter')?.value || 'all';
    if (filterValue !== 'all') {
        filtered = filtered.filter(album => album.privacy === filterValue);
    }
    
    // Filtrar por busca
    const searchTerm = document.getElementById('albumsSearch')?.value.toLowerCase() || '';
    if (searchTerm) {
        filtered = filtered.filter(album => 
            album.name.toLowerCase().includes(searchTerm) ||
            (album.description && album.description.toLowerCase().includes(searchTerm)) ||
            (album.tags && album.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    }
    
    return filtered;
}

formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

switchTab(tab) {
    this.currentTab = tab;
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    this.renderAlbumsGrid();
}

searchAlbums(term) {
    this.renderAlbumsGrid();
}

sortAlbums() {
    const sortBy = document.getElementById('albumsSort')?.value || 'name';
    
    this.albums.sort((a, b) => {
        switch(sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'date':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'updated':
                return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
            default:
                return 0;
        }
    });
    
    this.renderAlbumsGrid();
}

filterAlbums() {
    this.renderAlbumsGrid();
}

// Métodos de CRUD de álbuns
showNewAlbumModal() {
    const modalHtml = `
        <div class="modal-overlay active" id="newAlbumModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-plus"></i> Criar Novo Álbum</h3>
                    <button class="close-modal" onclick="albumsSystem.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="form-section">
                        <h4>Informações do Álbum</h4>
                        
                        <div class="form-group">
                            <label>Nome do Álbum *</label>
                            <input type="text" id="albumName" placeholder="Meu álbum especial" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Descrição</label>
                            <textarea id="albumDescription" rows="3" placeholder="Descreva seu álbum..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>Foto de Capa</label>
                            <div class="cover-upload">
                                <div class="cover-preview" id="coverPreview">
                                    <i class="fas fa-image"></i>
                                    <span>Selecionar imagem</span>
                                </div>
                                <input type="file" id="coverFile" accept="image/*" style="display: none;" 
                                       onchange="albumsSystem.previewCover(event)">
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h4>Configurações de Privacidade</h4>
                        
                        <div class="privacy-options">
                            <label class="radio-label">
                                <input type="radio" name="privacy" value="public" checked>
                                <div class="radio-content">
                                    <i class="fas fa-globe-americas"></i>
                                    <div>
                                        <strong>Público</strong>
                                        <p>Qualquer pessoa pode ver</p>
                                    </div>
                                </div>
                            </label>
                            
                            <label class="radio-label">
                                <input type="radio" name="privacy" value="shared">
                                <div class="radio-content">
                                    <i class="fas fa-user-friends"></i>
                                    <div>
                                        <strong>Compartilhado</strong>
                                        <p>Apenas amigos selecionados</p>
                                    </div>
                                </div>
                            </label>
                            
                            <label class="radio-label">
                                <input type="radio" name="privacy" value="private">
                                <div class="radio-content">
                                    <i class="fas fa-lock"></i>
                                    <div>
                                        <strong>Privado</strong>
                                        <p>Apenas você pode ver</p>
                                    </div>
                                </div>
                            </label>
                        </div>
                        
                        <div class="shared-with" id="sharedWithSection" style="display: none;">
                            <label>Compartilhar com:</label>
                            <div class="friends-select" id="friendsSelect">
                                <!-- Lista de amigos será carregada aqui -->
                                <p>Carregando amigos...</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h4>Configurações Avançadas</h4>
                        
                        <div class="checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="allowDownloads">
                                <span>Permitir download das fotos</span>
                            </label>
                            
                            <label class="checkbox-label">
                                <input type="checkbox" id="allowComments">
                                <span>Permitir comentários</span>
                            </label>
                            
                            <label class="checkbox-label">
                                <input type="checkbox" id="blockScreenshots">
                                <span>Bloquear captura de tela</span>
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label>Marcador de Data</label>
                            <input type="date" id="albumDate">
                        </div>
                        
                        <div class="form-group">
                            <label>Tags (separadas por vírgula)</label>
                            <input type="text" id="albumTags" placeholder="família, férias, aniversário">
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button class="btn-secondary" onclick="albumsSystem.closeModal()">
                            Cancelar
                        </button>
                        <button class="btn-primary" onclick="albumsSystem.saveAlbum()">
                            <i class="fas fa-save"></i> Criar Álbum
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    this.setupAlbumModalEvents();
    this.loadFriendsForSharing();
}

setupAlbumModalEvents() {
    // Mostrar/ocultar seção de compartilhamento
    document.querySelectorAll('input[name="privacy"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const sharedSection = document.getElementById('sharedWithSection');
            sharedSection.style.display = e.target.value === 'shared' ? 'block' : 'none';
        });
    });

    // Upload de capa
    document.getElementById('coverPreview')?.addEventListener('click', () => {
        document.getElementById('coverFile').click();
    });
}

previewCover(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('coverPreview');
        preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        preview.style.background = 'none';
    };
    reader.readAsDataURL(file);
}

async loadFriendsForSharing() {
    try {
        const userId = localStorage.getItem('userId');
        const friendsRef = collection(db, 'users', userId, 'contacts');
        const q = query(friendsRef, where('blocked', '!=', true));
        const snapshot = await getDocs(q);
        
        const friendsSelect = document.getElementById('friendsSelect');
        if (!friendsSelect) return;
        
        if (snapshot.empty) {
            friendsSelect.innerHTML = '<p>Nenhum amigo disponível</p>';
            return;
        }
        
        friendsSelect.innerHTML = snapshot.docs.map(doc => {
            const friend = doc.data();
            return `
                <label class="checkbox-label">
                    <input type="checkbox" value="${friend.id}">
                    <span>${friend.name}</span>
                </label>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Erro ao carregar amigos:', error);
    }
}

async saveAlbum() {
    const name = document.getElementById('albumName').value;
    
    if (!name) {
        this.showMessage('Nome do álbum é obrigatório', 'error');
        return;
    }

    try {
        const userId = localStorage.getItem('userId');
        const albumId = Date.now().toString();
        
        const privacy = document.querySelector('input[name="privacy"]:checked').value;
        const sharedWith = privacy === 'shared' ? 
            Array.from(document.querySelectorAll('#friendsSelect input:checked'))
                .map(cb => cb.value) : [];
        
        const albumData = {
            id: albumId,
            name: name,
            description: document.getElementById('albumDescription').value || '',
            privacy: privacy,
            sharedWith: sharedWith,
            tags: document.getElementById('albumTags').value ?
                document.getElementById('albumTags').value.split(',').map(t => t.trim()) : [],
            settings: {
                allowDownloads: document.getElementById('allowDownloads').checked,
                allowComments: document.getElementById('allowComments').checked,
                blockScreenshots: document.getElementById('blockScreenshots').checked
            },
            dateMarker: document.getElementById('albumDate').value || '',
            coverImage: '', // Será atualizado após upload
            photosCount: 0,
            views: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Upload da capa se existir
        const coverFile = document.getElementById('coverFile').files[0];
        if (coverFile) {
            const coverUrl = await this.uploadCoverImage(coverFile, userId, albumId);
            albumData.coverImage = coverUrl;
        }

        const albumRef = doc(db, 'users', userId, 'albums', albumId);
        await setDoc(albumRef, albumData);
        
        this.showMessage('Álbum criado com sucesso!', 'success');
        this.closeModal();
        this.loadAlbums();
        
    } catch (error) {
        console.error('Erro ao salvar álbum:', error);
        this.showMessage('Erro ao criar álbum', 'error');
    }
}

async uploadCoverImage(file, userId, albumId) {
    try {
        const storageRef = ref(storage, `users/${userId}/albums/${albumId}/cover.jpg`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    } catch (error) {
        console.error('Erro ao fazer upload da capa:', error);
        return '';
    }
}

    // Métodos de álbum individual
    async openAlbum(albumId) {
        try {
            const userId = localStorage.getItem('userId');
            const albumRef = doc(db, 'users', userId, 'albums', albumId);
            const albumDoc = await getDoc(albumRef);
            
            if (!albumDoc.exists()) {
                this.showMessage('Álbum não encontrado', 'error');
                return;
            }
            
            const album = albumDoc.data();
            this.showAlbumView(album);
            
        } catch (error) {
            console.error('Erro ao abrir álbum:', error);
            this.showMessage('Erro ao carregar álbum', 'error');
        }
    }

    showAlbumView(album) {
        const modalHtml = `
            <div class="modal-overlay active" id="albumViewModal">
                <div class="modal-content wide-modal">
                    <div class="modal-header">
                        <h3><i class="fas fa-images"></i> ${album.name}</h3>
                        <button class="close-modal" onclick="albumsSystem.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body album-view">
                        <div class="album-header">
                            <div class="album-cover-large">
                                <img src="${album.coverImage || 'https://via.placeholder.com/800x400/FFD700/000?text=CronoZ'}" 
                                     alt="${album.name}">
                            </div>
                            
                            <div class="album-info-large">
                                <h4>${album.name}</h4>
                                <p class="album-description">${album.description || 'Sem descrição'}</p>
                                
                                <div class="album-meta-large">
                                    <div class="meta-item">
                                        <i class="fas fa-calendar"></i>
                                        <span>Criado em: ${this.formatDate(album.createdAt)}</span>
                                    </div>
                                    
                                    <div class="meta-item">
                                        <i class="fas fa-image"></i>
                                        <span>${album.photosCount || 0} fotos</span>
                                    </div>
                                    
                                    <div class="meta-item">
                                        <i class="fas fa-eye"></i>
                                        <span>${album.views || 0} visualizações</span>
                                    </div>
                                    
                                    <div class="meta-item">
                                        <i class="fas fa-${album.privacy === 'public' ? 'globe-americas' : 
                                                          album.privacy === 'shared' ? 'user-friends' : 'lock'}"></i>
                                        <span>${album.privacy === 'public' ? 'Público' : 
                                               album.privacy === 'shared' ? 'Compartilhado' : 'Privado'}</span>
                                    </div>
                                </div>
                                
                                <div class="album-actions-large">
                                    <button class="btn-primary" onclick="albumsSystem.addPhotosToAlbum('${album.id}')">
                                        <i class="fas fa-plus"></i> Adicionar Fotos
                                    </button>
                                    
                                    <button class="btn-secondary" onclick="albumsSystem.downloadAlbum('${album.id}')" 
                                            ${album.settings?.allowDownloads ? '' : 'disabled'}>
                                        <i class="fas fa-download"></i> Baixar Álbum
                                    </button>
                                    
                                    <button class="btn-secondary" onclick="albumsSystem.shareAlbum('${album.id}')">
                                        <i class="fas fa-share"></i> Compartilhar
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="album-photos">
                            <h4>Fotos do Álbum</h4>
                            
                            ${album.photosCount > 0 ? `
                                <div class="photos-grid" id="photosGrid">
                                    <p>Carregando fotos...</p>
                                </div>
                            ` : `
                                <div class="empty-photos">
                                    <i class="fas fa-camera"></i>
                                    <p>Nenhuma foto neste álbum</p>
                                    <button class="btn-primary" onclick="albumsSystem.addPhotosToAlbum('${album.id}')">
                                        <i class="fas fa-plus"></i> Adicionar Primeira Foto
                                    </button>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        if (album.photosCount > 0) {
            this.loadAlbumPhotos(album.id);
        }
    }

    async loadAlbumPhotos(albumId) {
        try {
            const userId = localStorage.getItem('userId');
            const photosRef = collection(db, 'users', userId, 'albums', albumId, 'photos');
            const snapshot = await getDocs(photosRef);
            
            const photosGrid = document.getElementById('photosGrid');
            if (!photosGrid) return;
            
            if (snapshot.empty) {
                photosGrid.innerHTML = '<p>Nenhuma foto encontrada</p>';
                return;
            }
            
            photosGrid.innerHTML = snapshot.docs.map(doc => {
                const photo = doc.data();
                return `
                    <div class="photo-item" onclick="albumsSystem.viewPhoto('${photo.id}')">
                        <img src="${photo.url}" alt="${photo.name || 'Foto'}">
                        <div class="photo-overlay">
                            <span class="photo-name">${photo.name || 'Sem nome'}</span>
                            <span class="photo-date">${this.formatDate(photo.uploadedAt)}</span>
                        </div>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Erro ao carregar fotos:', error);
        }
    }

    async addPhotosToAlbum(albumId) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        
        input.onchange = async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;
            
            this.showMessage(`Enviando ${files.length} foto(s)...`, 'info');
            
            for (const file of files) {
                await this.uploadPhotoToAlbum(file, albumId);
            }
            
            this.showMessage('Fotos adicionadas com sucesso!', 'success');
            this.closeModal();
            this.openAlbum(albumId);
        };
        
        input.click();
    }

    async uploadPhotoToAlbum(file, albumId) {
        try {
            const userId = localStorage.getItem('userId');
            const photoId = Date.now().toString();
            
            // Upload para Storage
            const storageRef = ref(storage, `users/${userId}/albums/${albumId}/${photoId}.jpg`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            
            // Salvar metadados no Firestore
            const photoData = {
                id: photoId,
                name: file.name,
                url: downloadURL,
                size: file.size,
                type: file.type,
                uploadedAt: new Date().toISOString()
            };
            
            const photoRef = doc(db, 'users', userId, 'albums', albumId, 'photos', photoId);
            await setDoc(photoRef, photoData);
            
            // Atualizar contador do álbum
            const albumRef = doc(db, 'users', userId, 'albums', albumId);
            await updateDoc(albumRef, {
                photosCount: arrayUnion(photoId),
                updatedAt: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Erro ao fazer upload da foto:', error);
        }
    }

    closeModal() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        messageDiv.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'success' ? '#28A745' : type === 'error' ? '#DC3545' : '#17A2B8'};
            color: white;
            padding: 12px 20px;
            border-radius: var(--border-radius);
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.animation = 'slideIn 0.3s ease reverse forwards';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }

    addAlbumsStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .albums-container {
                animation: fadeIn 0.3s ease;
            }
            
            .albums-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: var(--spacing-lg);
                flex-wrap: wrap;
                gap: var(--spacing-md);
            }
            
            .albums-header h2 {
                font-size: 1.5rem;
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
            }
            
            .header-actions {
                display: flex;
                gap: var(--spacing-md);
                align-items: center;
            }
            
            .albums-tabs {
                display: flex;
                gap: var(--spacing-sm);
                margin-bottom: var(--spacing-lg);
                border-bottom: 1px solid var(--border-color);
                padding-bottom: var(--spacing-sm);
            }
            
            .albums-filters {
                display: flex;
                gap: var(--spacing-lg);
                margin-bottom: var(--spacing-lg);
                flex-wrap: wrap;
            }
            
            .albums-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: var(--spacing-lg);
                margin-bottom: var(--spacing-xl);
            }
            
            .album-card {
                background: var(--surface-color);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                overflow: hidden;
                transition: var(--transition);
                cursor: pointer;
            }
            
            .album-card:hover {
                transform: translateY(-4px);
                box-shadow: var(--shadow-lg);
                border-color: var(--primary-color);
            }
            
            .album-cover {
                position: relative;
                height: 200px;
                overflow: hidden;
            }
            
            .album-cover img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.3s ease;
            }
            
            .album-card:hover .album-cover img {
                transform: scale(1.05);
            }
            
            .album-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.7));
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                padding: var(--spacing-md);
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .album-card:hover .album-overlay {
                opacity: 1;
            }
            
            .album-stats {
                display: flex;
                gap: var(--spacing-md);
                color: white;
                font-size: 0.9rem;
            }
            
            .album-privacy {
                color: white;
                font-size: 1.2rem;
            }
            
            .album-info {
                padding: var(--spacing-lg);
            }
            
            .album-name {
                font-size: 1.1rem;
                font-weight: 600;
                margin-bottom: var(--spacing-xs);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .album-description {
                font-size: 0.9rem;
                color: var(--text-secondary);
                margin-bottom: var(--spacing-md);
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            
            .album-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: var(--spacing-sm);
                font-size: 0.8rem;
                color: var(--text-secondary);
            }
            
            .album-tags {
                display: flex;
                flex-wrap: wrap;
                gap: var(--spacing-xs);
                margin-top: var(--spacing-sm);
            }
            
            .album-tag {
                font-size: 0.7rem;
                padding: 2px 8px;
                background: rgba(255, 215, 0, 0.1);
                color: var(--primary-color);
                border-radius: 12px;
            }
            
            .album-actions {
                display: flex;
                justify-content: space-around;
                padding: var(--spacing-md);
                border-top: 1px solid var(--border-color);
                background: var(--surface-color);
            }
            
            .empty-albums {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: var(--spacing-xl);
                text-align: center;
                color: var(--text-secondary);
            }
            
            .empty-albums i {
                font-size: 4rem;
                margin-bottom: var(--spacing-lg);
                color: var(--border-color);
            }
            
            /* Modal de Novo Álbum */
            .cover-upload {
                margin-top: var(--spacing-sm);
            }
            
            .cover-preview {
                width: 100%;
                height: 150px;
                border: 2px dashed var(--border-color);
                border-radius: var(--border-radius);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: var(--transition);
                overflow: hidden;
            }
            
            .cover-preview:hover {
                border-color: var(--primary-color);
                background: var(--surface-color);
            }
            
            .cover-preview img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .privacy-options {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-sm);
                margin-top: var(--spacing-md);
            }
            
            .radio-label {
                display: flex;
                align-items: center;
                gap: var(--spacing-md);
                padding: var(--spacing-md);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                cursor: pointer;
                transition: var(--transition);
            }
            
            .radio-label:hover {
                border-color: var(--primary-color);
                background: var(--surface-color);
            }
            
            .radio-label input:checked + .radio-content {
                color: var(--primary-color);
            }
            
            .radio-content {
                display: flex;
                align-items: center;
                gap: var(--spacing-md);
                flex: 1;
            }
            
            .radio-content i {
                font-size: 1.5rem;
            }
            
            .shared-with {
                margin-top: var(--spacing-lg);
            }
            
            .friends-select {
                max-height: 200px;
                overflow-y: auto;
                padding: var(--spacing-md);
                background: var(--surface-color);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                margin-top: var(--spacing-sm);
                display: flex;
                flex-direction: column;
                gap: var(--spacing-sm);
            }
            
            /* Visualização do Álbum */
            .album-view {
                max-height: 80vh;
                overflow-y: auto;
            }
            
            .album-header {
                display: flex;
                gap: var(--spacing-xl);
                margin-bottom: var(--spacing-xl);
                flex-wrap: wrap;
            }
            
            .album-cover-large {
                flex: 1;
                min-width: 300px;
                max-height: 400px;
                overflow: hidden;
                border-radius: var(--border-radius);
            }
            
            .album-cover-large img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .album-info-large {
                flex: 1;
                min-width: 300px;
            }
            
            .album-info-large h4 {
                font-size: 1.5rem;
                margin-bottom: var(--spacing-sm);
            }
            
            .album-meta-large {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: var(--spacing-md);
                margin: var(--spacing-lg) 0;
            }
            
            .meta-item {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                font-size: 0.9rem;
                color: var(--text-secondary);
            }
            
            .album-actions-large {
                display: flex;
                gap: var(--spacing-md);
                flex-wrap: wrap;
                margin-top: var(--spacing-xl);
            }
            
            .album-photos {
                margin-top: var(--spacing-xl);
                padding-top: var(--spacing-lg);
                border-top: 1px solid var(--border-color);
            }
            
            .photos-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: var(--spacing-md);
                margin-top: var(--spacing-lg);
            }
            
            .photo-item {
                position: relative;
                height: 150px;
                border-radius: var(--border-radius);
                overflow: hidden;
                cursor: pointer;
            }
            
            .photo-item img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.3s ease;
            }
            
            .photo-item:hover img {
                transform: scale(1.05);
            }
            
            .photo-overlay {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
                padding: var(--spacing-sm);
                color: white;
                font-size: 0.8rem;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .photo-item:hover .photo-overlay {
                opacity: 1;
            }
            
            .empty-photos {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: var(--spacing-xl);
                text-align: center;
                color: var(--text-secondary);
            }
            
            .empty-photos i {
                font-size: 3rem;
                margin-bottom: var(--spacing-lg);
                color: var(--border-color);
            }
            
            @media (max-width: 768px) {
                .albums-header {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .header-actions {
                    flex-direction: column;
                }
                
                .albums-grid {
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                }
                
                .album-header {
                    flex-direction: column;
                }
                
                .album-actions-large {
                    flex-direction: column;
                }
                
                .album-actions-large button {
                    width: 100%;
                }
            }
            
            @media (max-width: 480px) {
                .albums-grid {
                    grid-template-columns: 1fr;
                }
                
                .photos-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Inicializar sistema de álbuns
const albumsSystem = new AlbumsSystem();
window.albumsSystem = albumsSystem;

// Integração com o app principal
if (typeof app !== 'undefined') {
    app.renderAlbumsPage = async function() {
        await albumsSystem.renderAlbumsPage();
    };
}

export default albumsSystem;
```
