// albums.js - Sistema de álbuns de fotos
import { auth, db, storage } from './firebase-config.js';
import { 
    collection, doc, setDoc, getDoc, updateDoc, 
    deleteDoc, query, where, orderBy, onSnapshot,
    ref, uploadBytes, getDownloadURL 
} from './firebase-config.js';
import { showLoading, hideLoading, showToast, formatDate } from './utils.js';

class AlbumsSystem {
    constructor() {
        this.albums = [];
        this.currentAlbum = null;
        this.currentTab = 'my-albums';
        this.init();
    }
    
    init() {
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.loadAlbums();
                this.setupEventListeners();
                this.setupTabs();
            }
        });
    }
    
    setupEventListeners() {
        // Create album button
        const createBtn = document.getElementById('btn-create-album');
        if (createBtn) createBtn.addEventListener('click', () => this.openCreateAlbumModal());
        
        // Album tabs
        document.querySelectorAll('.album-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabType = e.currentTarget.dataset.tab;
                this.switchTab(tabType);
            });
        });
        
        // Search
        const searchInput = document.querySelector('#my-albums-list .search-box input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchAlbums(e.target.value);
            });
        }
    }
    
    setupTabs() {
        this.switchTab('my-albums');
    }
    
    switchTab(tab) {
        this.currentTab = tab;
        
        // Update tab buttons
        document.querySelectorAll('.album-tab').forEach(t => {
            t.classList.remove('active');
            if (t.dataset.tab === tab) t.classList.add('active');
        });
        
        // Show/hide content
        const myAlbums = document.getElementById('my-albums-list');
        const friendAlbums = document.getElementById('friend-albums-list');
        
        if (myAlbums) myAlbums.classList.remove('active');
        if (friendAlbums) friendAlbums.classList.remove('active');
        
        if (tab === 'my-albums') {
            if (myAlbums) myAlbums.classList.add('active');
            this.renderMyAlbums();
        } else {
            if (friendAlbums) friendAlbums.classList.add('active');
            this.renderFriendAlbums();
        }
    }
    
    async loadAlbums() {
        if (!auth.currentUser) return;
        
        const userId = auth.currentUser.uid;
        const albumsRef = collection(db, 'users', userId, 'albums');
        const q = query(albumsRef, orderBy('createdAt', 'desc'));
        
        onSnapshot(q, (snapshot) => {
            this.albums = [];
            snapshot.forEach(doc => {
                this.albums.push({ id: doc.id, ...doc.data() });
            });
            this.renderMyAlbums();
        });
    }
    
    renderMyAlbums() {
        if (this.currentTab !== 'my-albums') return;
        
        const container = document.querySelector('#my-albums-list .albums-grid');
        if (!container) return;
        
        // Add new album card
        let html = `
            <div class="album-card new-album" id="new-album-card">
                <div class="album-cover">
                    <i class="fas fa-plus fa-3x"></i>
                </div>
                <h3>Criar Novo Álbum</h3>
            </div>
        `;
        
        // Add existing albums
        if (this.albums.length > 0) {
            html += this.albums.map(album => {
                const photoCount = album.photos?.length || 0;
                const createdDate = formatDate(album.createdAt, 'dd/mm/yyyy');
                
                return `
                    <div class="album-card" data-album-id="${album.id}">
                        <div class="album-cover">
                            ${album.coverPhoto ? 
                                `<img src="${album.coverPhoto}" alt="${album.name}" 
                                      onerror="this.src='assets/default-album.jpg'">` :
                                `<div class="album-cover-placeholder">
                                    <i class="fas fa-images fa-3x"></i>
                                </div>`
                            }
                            <div class="album-overlay">
                                <span class="album-count">${photoCount} foto${photoCount !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                        <div class="album-info">
                            <h3>${album.name}</h3>
                            <p class="album-date">Criado em ${createdDate}</p>
                            <div class="album-privacy">
                                <i class="fas ${this.getPrivacyIcon(album.privacy)}"></i>
                                ${this.getPrivacyLabel(album.privacy)}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        container.innerHTML = html;
        
        // Add event listeners
        document.getElementById('new-album-card')?.addEventListener('click', () => {
            this.openCreateAlbumModal();
        });
        
        container.querySelectorAll('.album-card:not(.new-album)').forEach((card, index) => {
            const album = this.albums[index];
            card.addEventListener('click', () => {
                this.openAlbum(album);
            });
        });
    }
    
    getPrivacyIcon(privacy) {
        const icons = {
            'public': 'fa-globe',
            'contacts': 'fa-user-friends',
            'family': 'fa-home',
            'private': 'fa-lock'
        };
        return icons[privacy] || 'fa-user';
    }
    
    getPrivacyLabel(privacy) {
        const labels = {
            'public': 'Público',
            'contacts': 'Contatos',
            'family': 'Família',
            'private': 'Privado'
        };
        return labels[privacy] || 'Privado';
    }
    
    renderFriendAlbums() {
        const container = document.getElementById('friend-albums-list');
        if (!container) return;
        
        // This would load from friends' shared albums
        // For now, show empty state
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users fa-3x"></i>
                <p>Nenhum álbum compartilhado por amigos</p>
                <p class="text-muted">Seus amigos ainda não compartilharam álbuns com você</p>
            </div>
        `;
    }
    
    openCreateAlbumModal() {
        const modalContent = `
            <form class="modal-form" id="create-album-form">
                <div class="modal-form-group">
                    <label for="album-name">Nome do Álbum *</label>
                    <input type="text" id="album-name" required placeholder="Ex: Férias 2024">
                </div>
                
                <div class="modal-form-group">
                    <label for="album-description">Descrição</label>
                    <textarea id="album-description" rows="3" placeholder="Descreva seu álbum..."></textarea>
                </div>
                
                <div class="modal-form-group">
                    <label for="album-date">Data do Evento (opcional)</label>
                    <input type="date" id="album-date">
                </div>
                
                <div class="modal-form-group">
                    <label for="album-privacy">Privacidade</label>
                    <select id="album-privacy">
                        <option value="private">Privado (apenas eu)</option>
                        <option value="family">Família</option>
                        <option value="contacts">Contatos</option>
                        <option value="public">Público</option>
                    </select>
                </div>
                
                <div class="modal-form-group">
                    <label for="album-cover">Foto de Capa (opcional)</label>
                    <input type="file" id="album-cover" accept="image/*">
                    <div class="cover-preview" id="cover-preview"></div>
                </div>
                
                <div class="modal-form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="album-allow-download" checked>
                        Permitir download de fotos
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="album-allow-screenshot">
                        Permitir captura de tela
                    </label>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn-secondary close-modal">Cancelar</button>
                    <button type="submit" class="btn-primary">Criar Álbum</button>
                </div>
            </form>
        `;
        
        this.showModal('Criar Álbum', modalContent);
        
        // Cover photo preview
        const coverInput = document.getElementById('album-cover');
        const preview = document.getElementById('cover-preview');
        
        if (coverInput && preview) {
            coverInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        preview.innerHTML = `
                            <img src="${e.target.result}" alt="Preview">
                            <button type="button" class="btn-small" id="remove-cover">
                                <i class="fas fa-times"></i> Remover
                            </button>
                        `;
                        
                        document.getElementById('remove-cover')?.addEventListener('click', () => {
                            coverInput.value = '';
                            preview.innerHTML = '';
                        });
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        
        // Form submission
        document.getElementById('create-album-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createAlbum();
        });
    }

async createAlbum() {
    if (!auth.currentUser) return;
    
    const name = document.getElementById('album-name').value.trim();
    const description = document.getElementById('album-description').value.trim();
    const date = document.getElementById('album-date').value;
    const privacy = document.getElementById('album-privacy').value;
    const allowDownload = document.getElementById('album-allow-download').checked;
    const allowScreenshot = document.getElementById('album-allow-screenshot').checked;
    const coverFile = document.getElementById('album-cover')?.files[0];
    
    if (!name) {
        showToast('Nome do álbum é obrigatório', 'warning');
        return;
    }
    
    showLoading('Criando álbum...');
    try {
        const userId = auth.currentUser.uid;
        const albumId = `album_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Upload cover photo if exists
        let coverPhotoUrl = '';
        if (coverFile) {
            coverPhotoUrl = await this.uploadPhoto(coverFile, `albums/${albumId}/cover`);
        }
        
        const albumData = {
            name,
            description: description || '',
            date: date || null,
            privacy,
            allowDownload,
            allowScreenshot,
            coverPhoto: coverPhotoUrl,
            photos: [],
            ownerId: userId,
            ownerName: auth.currentUser.displayName || 'Usuário',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sharedWith: [] // Array of user IDs who can access
        };
        
        const albumRef = doc(db, 'users', userId, 'albums', albumId);
        await setDoc(albumRef, albumData);
        
        this.closeModal();
        showToast('Álbum criado com sucesso!', 'success');
        
        // Open the new album
        setTimeout(() => {
            this.openAlbum({ id: albumId, ...albumData });
        }, 500);
        
    } catch (error) {
        console.error('Erro ao criar álbum:', error);
        showToast('Erro ao criar álbum', 'error');
    } finally {
        hideLoading();
    }
}

async uploadPhoto(file, path) {
    if (!auth.currentUser) return '';
    
    try {
        const storageRef = ref(storage, `${auth.currentUser.uid}/${path}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error('Erro ao fazer upload:', error);
        throw error;
    }
}

openAlbum(album) {
    this.currentAlbum = album;
    
    // Create album view modal
    const modalContent = `
        <div class="album-view-modal">
            <div class="album-view-header">
                <div class="album-header-info">
                    <h3>${album.name}</h3>
                    <p class="album-header-meta">
                        <i class="fas fa-calendar"></i> 
                        Criado em ${formatDate(album.createdAt, 'dd/mm/yyyy')}
                        • ${album.photos?.length || 0} fotos
                    </p>
                    <div class="album-header-privacy">
                        <i class="fas ${this.getPrivacyIcon(album.privacy)}"></i>
                        ${this.getPrivacyLabel(album.privacy)}
                    </div>
                </div>
                <div class="album-header-actions">
                    <button class="btn-icon" id="btn-add-photos" title="Adicionar fotos">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn-icon" id="btn-share-album" title="Compartilhar">
                        <i class="fas fa-share-alt"></i>
                    </button>
                    <button class="btn-icon" id="btn-edit-album" title="Editar álbum">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
            
            ${album.description ? `
                <div class="album-description">
                    <p>${album.description}</p>
                </div>
            ` : ''}
            
            <div class="album-photos-container" id="album-photos-container">
                ${this.renderAlbumPhotos(album)}
            </div>
            
            <div class="modal-actions">
                <button type="button" class="btn-secondary close-modal">Fechar</button>
            </div>
        </div>
    `;
    
    this.showModal(album.name, modalContent, 'large');
    
    // Add event listeners
    document.getElementById('btn-add-photos')?.addEventListener('click', () => {
        this.openAddPhotosModal(album.id);
    });
    
    document.getElementById('btn-share-album')?.addEventListener('click', () => {
        this.openShareAlbumModal(album);
    });
    
    document.getElementById('btn-edit-album')?.addEventListener('click', () => {
        this.openEditAlbumModal(album);
    });
    
    // Photo click events
    this.setupPhotoViewers();
}

renderAlbumPhotos(album) {
    if (!album.photos || album.photos.length === 0) {
        return `
            <div class="empty-album">
                <i class="fas fa-images fa-3x"></i>
                <h4>Álbum vazio</h4>
                <p>Adicione fotos para começar</p>
                <button class="btn-primary" id="btn-add-first-photo">
                    <i class="fas fa-plus"></i> Adicionar Primeira Foto
                </button>
            </div>
        `;
    }
    
    return `
        <div class="photos-grid">
            ${album.photos.map((photo, index) => `
                <div class="photo-item" data-photo-index="${index}">
                    <img src="${photo.url}" alt="Foto ${index + 1}" 
                         onerror="this.src='assets/default-photo.jpg'">
                    <div class="photo-overlay">
                        <button class="photo-action-btn btn-view-photo" title="Ampliar">
                            <i class="fas fa-search-plus"></i>
                        </button>
                        ${album.allowDownload ? `
                            <button class="photo-action-btn btn-download-photo" title="Download">
                                <i class="fas fa-download"></i>
                            </button>
                        ` : ''}
                        <button class="photo-action-btn btn-delete-photo" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

setupPhotoViewers() {
    // View photo
    document.querySelectorAll('.btn-view-photo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const photoIndex = btn.closest('.photo-item').dataset.photoIndex;
            this.viewPhoto(photoIndex);
        });
    });
    
    // Download photo
    document.querySelectorAll('.btn-download-photo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const photoIndex = btn.closest('.photo-item').dataset.photoIndex;
            this.downloadPhoto(photoIndex);
        });
    });
    
    // Delete photo
    document.querySelectorAll('.btn-delete-photo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const photoIndex = btn.closest('.photo-item').dataset.photoIndex;
            if (confirm('Excluir esta foto?')) {
                this.deletePhoto(photoIndex);
            }
        });
    });
    
    // Add first photo button
    const addFirstBtn = document.getElementById('btn-add-first-photo');
    if (addFirstBtn) {
        addFirstBtn.addEventListener('click', () => {
            this.openAddPhotosModal(this.currentAlbum.id);
        });
    }
}

viewPhoto(photoIndex) {
    if (!this.currentAlbum?.photos?.[photoIndex]) return;
    
    const photo = this.currentAlbum.photos[photoIndex];
    
    const modalContent = `
        <div class="photo-viewer-modal">
            <div class="photo-viewer-header">
                <button class="btn-icon" id="btn-prev-photo">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span class="photo-counter">Foto ${parseInt(photoIndex) + 1} de ${this.currentAlbum.photos.length}</span>
                <button class="btn-icon" id="btn-next-photo">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            
            <div class="photo-viewer-content">
                <img src="${photo.url}" alt="Foto" class="fullscreen-photo">
            </div>
            
            <div class="photo-viewer-footer">
                ${photo.description ? `<p class="photo-description">${photo.description}</p>` : ''}
                ${photo.uploadedAt ? `<p class="photo-date">${formatDate(photo.uploadedAt, 'dd/mm/yyyy HH:mm')}</p>` : ''}
                
                <div class="photo-actions">
                    ${this.currentAlbum.allowDownload ? `
                        <button class="btn-icon" id="btn-download-full-photo" title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                    ` : ''}
                    <button class="btn-icon" id="btn-share-photo" title="Compartilhar">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    this.showModal('Visualizar Foto', modalContent, 'fullscreen');
    
    // Navigation
    document.getElementById('btn-prev-photo')?.addEventListener('click', () => {
        this.navigatePhoto(-1, photoIndex);
    });
    
    document.getElementById('btn-next-photo')?.addEventListener('click', () => {
        this.navigatePhoto(1, photoIndex);
    });
    
    // Download
    document.getElementById('btn-download-full-photo')?.addEventListener('click', () => {
        this.downloadPhoto(photoIndex);
    });
}

navigatePhoto(direction, currentIndex) {
    const newIndex = parseInt(currentIndex) + direction;
    const photos = this.currentAlbum.photos;
    
    if (newIndex >= 0 && newIndex < photos.length) {
        this.closeModal();
        setTimeout(() => {
            this.viewPhoto(newIndex.toString());
        }, 300);
    }
}

    async downloadPhoto(photoIndex) {
        if (!this.currentAlbum?.photos?.[photoIndex] || !this.currentAlbum.allowDownload) {
            showToast('Download não permitido', 'warning');
            return;
        }
        
        const photo = this.currentAlbum.photos[photoIndex];
        
        try {
            const response = await fetch(photo.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `foto_${this.currentAlbum.name}_${photoIndex + 1}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showToast('Download iniciado!', 'success');
        } catch (error) {
            console.error('Erro ao fazer download:', error);
            showToast('Erro ao fazer download', 'error');
        }
    }
    
    async deletePhoto(photoIndex) {
        if (!this.currentAlbum || !auth.currentUser) return;
        
        showLoading('Excluindo foto...');
        try {
            const userId = auth.currentUser.uid;
            const albumRef = doc(db, 'users', userId, 'albums', this.currentAlbum.id);
            
            // Remove photo from array
            const updatedPhotos = [...this.currentAlbum.photos];
            updatedPhotos.splice(photoIndex, 1);
            
            await updateDoc(albumRef, {
                photos: updatedPhotos,
                updatedAt: new Date().toISOString()
            });
            
            showToast('Foto excluída!', 'success');
            
            // Refresh album view
            this.currentAlbum.photos = updatedPhotos;
            this.refreshAlbumView();
            
        } catch (error) {
            console.error('Erro ao excluir foto:', error);
            showToast('Erro ao excluir foto', 'error');
        } finally {
            hideLoading();
        }
    }
    
    refreshAlbumView() {
        const container = document.getElementById('album-photos-container');
        if (container && this.currentAlbum) {
            container.innerHTML = this.renderAlbumPhotos(this.currentAlbum);
            this.setupPhotoViewers();
        }
    }
    
    openAddPhotosModal(albumId) {
        const modalContent = `
            <form class="modal-form" id="add-photos-form">
                <div class="modal-form-group">
                    <label for="photos-input">Selecionar Fotos *</label>
                    <input type="file" id="photos-input" accept="image/*" multiple required>
                    <p class="help-text">Selecione uma ou mais fotos (máx. 10 por vez)</p>
                    <div class="photos-preview" id="photos-preview"></div>
                </div>
                
                <div class="modal-form-group">
                    <label for="photos-description">Descrição (opcional)</label>
                    <textarea id="photos-description" rows="2" 
                              placeholder="Descrição para todas as fotos..."></textarea>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn-secondary close-modal">Cancelar</button>
                    <button type="submit" class="btn-primary">Adicionar Fotos</button>
                </div>
            </form>
        `;
        
        this.showModal('Adicionar Fotos', modalContent);
        
        // Preview selected photos
        const photosInput = document.getElementById('photos-input');
        const preview = document.getElementById('photos-preview');
        
        if (photosInput && preview) {
            photosInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files).slice(0, 10); // Limit to 10
                preview.innerHTML = '';
                
                files.forEach((file, index) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const div = document.createElement('div');
                        div.className = 'photo-preview-item';
                        div.innerHTML = `
                            <img src="${e.target.result}" alt="Preview ${index + 1}">
                            <button type="button" class="btn-remove-preview" data-index="${index}">
                                <i class="fas fa-times"></i>
                            </button>
                        `;
                        preview.appendChild(div);
                        
                        // Remove button
                        div.querySelector('.btn-remove-preview').addEventListener('click', () => {
                            // Remove from file list (simplified)
                            div.remove();
                        });
                    };
                    reader.readAsDataURL(file);
                });
            });
        }
        
        // Form submission
        document.getElementById('add-photos-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addPhotos(albumId);
        });
    }
    
    async addPhotos(albumId) {
        if (!auth.currentUser) return;
        
        const filesInput = document.getElementById('photos-input');
        const description = document.getElementById('photos-description').value.trim();
        
        if (!filesInput.files.length) {
            showToast('Selecione pelo menos uma foto', 'warning');
            return;
        }
        
        const files = Array.from(filesInput.files).slice(0, 10);
        
        showLoading(`Enviando ${files.length} foto(s)...`);
        try {
            const userId = auth.currentUser.uid;
            const albumRef = doc(db, 'users', userId, 'albums', albumId);
            const albumSnap = await getDoc(albumRef);
            
            if (!albumSnap.exists()) {
                throw new Error('Álbum não encontrado');
            }
            
            const albumData = albumSnap.data();
            const currentPhotos = albumData.photos || [];
            
            // Upload each photo
            for (const file of files) {
                const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const path = `albums/${albumId}/${photoId}`;
                
                const photoUrl = await this.uploadPhoto(file, path);
                
                currentPhotos.push({
                    id: photoId,
                    url: photoUrl,
                    description: description || '',
                    uploadedAt: new Date().toISOString(),
                    size: file.size,
                    name: file.name
                });
            }
            
            // Update album
            await updateDoc(albumRef, {
                photos: currentPhotos,
                updatedAt: new Date().toISOString()
            });
            
            this.closeModal();
            showToast(`${files.length} foto(s) adicionada(s) com sucesso!`, 'success');
            
            // Refresh if album is open
            if (this.currentAlbum?.id === albumId) {
                this.currentAlbum.photos = currentPhotos;
                this.refreshAlbumView();
            }
            
        } catch (error) {
            console.error('Erro ao adicionar fotos:', error);
            showToast('Erro ao adicionar fotos', 'error');
        } finally {
            hideLoading();
        }
    }
    
    openEditAlbumModal(album) {
        const modalContent = `
            <form class="modal-form" id="edit-album-form">
                <!-- Similar to create form but with existing values -->
                <div class="modal-form-group">
                    <label for="edit-album-name">Nome do Álbum *</label>
                    <input type="text" id="edit-album-name" value="${album.name}" required>
                </div>
                
                <!-- Other fields... -->
                
                <div class="modal-actions">
                    <button type="button" class="btn-secondary close-modal">Cancelar</button>
                    <button type="submit" class="btn-primary">Salvar</button>
                    <button type="button" class="btn-danger" id="btn-delete-album">
                        Excluir Álbum
                    </button>
                </div>
            </form>
        `;
        
        this.showModal('Editar Álbum', modalContent);
        // Implementation similar to create album
    }
    
    openShareAlbumModal(album) {
        const modalContent = `
            <div class="share-album-modal">
                <h4><i class="fas fa-share-alt"></i> Compartilhar Álbum</h4>
                
                <div class="share-options">
                    <div class="share-option">
                        <h5>Link de Compartilhamento</h5>
                        <div class="share-link">
                            <input type="text" id="share-link" 
                                   value="https://cronoz.app/album/${album.id}" readonly>
                            <button class="btn-small" id="btn-copy-link">
                                <i class="fas fa-copy"></i> Copiar
                            </button>
                        </div>
                    </div>
                    
                    <div class="share-option">
                        <h5>Compartilhar com Contatos</h5>
                        <div class="share-contacts" id="share-contacts-list">
                            <!-- Contacts list here -->
                        </div>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn-secondary close-modal">Fechar</button>
                </div>
            </div>
        `;
        
        this.showModal('Compartilhar Álbum', modalContent);
        
        // Copy link
        document.getElementById('btn-copy-link')?.addEventListener('click', () => {
            const linkInput = document.getElementById('share-link');
            linkInput.select();
            navigator.clipboard.writeText(linkInput.value)
                .then(() => showToast('Link copiado!', 'success'));
        });
    }
    
    searchAlbums(query) {
        // Implement search functionality
        console.log('Searching albums:', query);
    }
    
    showModal(title, content, size = 'normal') {
        const modal = document.getElementById('modal-contact') || 
                      document.getElementById('modal-event') ||
                      document.createElement('div');
        
        if (!modal.id) {
            modal.id = 'albums-modal';
            modal.className = `modal ${size}`;
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div class="modal-header">
                <h2><i class="fas fa-images"></i> ${title}</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">${content}</div>
        `;
        
        modal.classList.add('active');
        document.getElementById('modal-overlay').classList.add('active');
        
        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });
    }
    
    closeModal() {
        const modals = document.querySelectorAll('.modal');
        const overlay = document.getElementById('modal-overlay');
        
        modals.forEach(modal => modal.classList.remove('active'));
        if (overlay) overlay.classList.remove('active');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const albumsSystem = new AlbumsSystem();
    window.albumsSystem = albumsSystem;
    console.log('Sistema de álbuns inicializado!');
});

export default AlbumsSystem;