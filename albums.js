// albums.js - Álbuns de Fotos
class AlbumsModule {
    constructor(app) {
        this.app = app;
        this.albums = [];
        this.currentAlbum = null;
        this.selectedPhotos = new Set();
        
        this.init();
    }
    
    async init() {
        await this.loadAlbums();
        this.render();
        this.setupEventListeners();
    }
    
    async loadAlbums() {
        try {
            const user = this.app.user;
            if (user) {
                const albumsRef = ref(db, `users/${user.uid}/albums`);
                const snapshot = await get(albumsRef);
                
                if (snapshot.exists()) {
                    this.albums = Object.values(snapshot.val());
                } else {
                    this.albums = this.getSampleAlbums();
                }
            }
        } catch (error) {
            console.error('Erro ao carregar álbuns:', error);
            this.albums = this.getSampleAlbums();
        }
    }
    
    getSampleAlbums() {
        return [
            {
                id: '1',
                name: 'Férias 2023',
                description: 'Fotos das férias na praia',
                coverPhoto: 'https://picsum.photos/300/200?random=1',
                photoCount: 24,
                privacy: 'public',
                createdAt: '2023-07-15',
                updatedAt: '2023-07-20',
                tags: ['praia', 'férias', 'família']
            },
            {
                id: '2',
                name: 'Aniversário João',
                description: 'Festa de aniversário',
                coverPhoto: 'https://picsum.photos/300/200?random=2',
                photoCount: 18,
                privacy: 'private',
                createdAt: '2023-08-10',
                updatedAt: '2023-08-10',
                tags: ['aniversário', 'festa', 'amigos']
            }
        ];
    }
    
    async createAlbum(albumData) {
        const album = {
            id: Date.now().toString(),
            ...albumData,
            photoCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.albums.unshift(album);
        await this.saveAlbum(album);
        this.renderAlbums();
    }
    
    async saveAlbum(album) {
        try {
            const user = this.app.user;
            if (user) {
                const albumRef = ref(db, `users/${user.uid}/albums/${album.id}`);
                await set(albumRef, album);
            }
        } catch (error) {
            console.error('Erro ao salvar álbum:', error);
        }
    }
    
    async loadAlbumPhotos(albumId) {
        try {
            const user = this.app.user;
            if (user) {
                const photosRef = ref(db, `users/${user.uid}/albums/${albumId}/photos`);
                const snapshot = await get(photosRef);
                
                if (snapshot.exists()) {
                    return Object.values(snapshot.val());
                }
            }
        } catch (error) {
            console.error('Erro ao carregar fotos:', error);
        }
        return [];
    }

  async uploadPhotos(files, albumId) {
        const user = this.app.user;
        if (!user) return;
        
        const uploadPromises = Array.from(files).map(async (file) => {
            // Upload para Firebase Storage
            const storageRef = ref(storage, `users/${user.uid}/albums/${albumId}/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            
            const photo = {
                id: Date.now().toString(),
                url: downloadURL,
                name: file.name,
                size: file.size,
                type: file.type,
                uploadedAt: new Date().toISOString(),
                metadata: {
                    width: 0,
                    height: 0
                }
            };
            
            // Salvar metadados da foto
            await this.savePhoto(albumId, photo);
            return photo;
        });
        
        const photos = await Promise.all(uploadPromises);
        
        // Atualizar contagem do álbum
        const album = this.albums.find(a => a.id === albumId);
        if (album) {
            album.photoCount += photos.length;
            album.updatedAt = new Date().toISOString();
            await this.saveAlbum(album);
        }
        
        return photos;
    }
    
    async savePhoto(albumId, photo) {
        try {
            const user = this.app.user;
            if (user) {
                const photoRef = ref(db, `users/${user.uid}/albums/${albumId}/photos/${photo.id}`);
                await set(photoRef, photo);
            }
        } catch (error) {
            console.error('Erro ao salvar foto:', error);
        }
    }
    
    async shareAlbum(albumId, contactIds) {
        const album = this.albums.find(a => a.id === albumId);
        if (!album) return;
        
        // Implementar lógica de compartilhamento
        console.log('Compartilhando álbum:', album.name, 'com contatos:', contactIds);
    }
    
    render() {
        const container = document.getElementById('albums-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="albums-header">
                <h2>Álbuns de Fotos</h2>
                <div class="albums-actions">
                    <button class="btn btn-primary" id="create-album-btn">
                        <i class="fas fa-plus"></i> Criar Álbum
                    </button>
                    <button class="btn btn-secondary" id="upload-photos-btn">
                        <i class="fas fa-cloud-upload-alt"></i> Enviar Fotos
                    </button>
                </div>
            </div>

            <div class="albums-view" id="albums-view">
                <!-- Lista de álbuns será renderizada aqui -->
            </div>
            
            <div class="album-detail-view" id="album-detail-view" style="display: none;">
                <!-- Detalhes do álbum será renderizado aqui -->
            </div>
            
            <!-- Modal criar álbum -->
            <div class="modal" id="album-modal">
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h3>Novo Álbum</h3>
                    <form id="album-form">
                        <div class="form-group">
                            <label for="album-name">Nome do Álbum *</label>
                            <input type="text" id="album-name" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="album-description">Descrição</label>
                            <textarea id="album-description" rows="3"></textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="album-privacy">Privacidade</label>
                                <select id="album-privacy">
                                    <option value="public">Público</option>
                                    <option value="private">Privado</option>
                                    <option value="shared">Compartilhado</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="album-tags">Tags (separadas por vírgula)</label>
                                <input type="text" id="album-tags">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="album-cover">Foto de Capa (URL)</label>
                            <input type="url" id="album-cover">
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" id="cancel-album">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Criar Álbum</button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Modal upload fotos -->
            <div class="modal" id="upload-modal">
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h3>Enviar Fotos</h3>
                    
                    <div class="upload-zone" id="upload-zone">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <p>Arraste e solte fotos aqui</p>
                        <p>ou</p>
                        <button class="btn btn-secondary" id="browse-btn">Selecionar Arquivos</button>
                        <input type="file" id="file-input" multiple accept="image/*" style="display: none;">
                    </div>

                    <div class="upload-progress" id="upload-progress" style="display: none;">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progress-fill"></div>
                        </div>
                        <p id="progress-text">Enviando...</p>
                    </div>
                    
                    <div class="upload-preview" id="upload-preview"></div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" id="cancel-upload">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="start-upload">Enviar</button>
                    </div>
                </div>
            </div>
            
            <!-- Visualizador de fotos -->
            <div class="modal" id="photo-viewer">
                <div class="modal-content photo-viewer-content">
                    <span class="close">&times;</span>
                    <div class="photo-viewer-main">
                        <button class="nav-btn prev" id="prev-photo">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <img id="viewer-photo" src="" alt="">
                        <button class="nav-btn next" id="next-photo">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    <div class="photo-info">
                        <h4 id="photo-name"></h4>
                        <p id="photo-date"></p>
                        <div class="photo-actions">
                            <button class="icon-btn" id="download-photo">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="icon-btn" id="share-photo">
                                <i class="fas fa-share"></i>
                            </button>
                            <button class="icon-btn" id="delete-photo">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.renderAlbums();
    }

  renderAlbums() {
        const view = document.getElementById('albums-view');
        if (!view) return;
        
        if (this.albums.length === 0) {
            view.innerHTML = `
                <div class="empty-albums">
                    <i class="fas fa-images"></i>
                    <h3>Nenhum álbum criado</h3>
                    <p>Crie seu primeiro álbum para começar</p>
                    <button class="btn btn-primary" id="create-first-album">
                        Criar Primeiro Álbum
                    </button>
                </div>
            `;
            return;
        }
        
        view.innerHTML = `
            <div class="albums-grid">
                ${this.albums.map(album => `
                    <div class="album-card" data-album-id="${album.id}">
                        <div class="album-cover">
                            <img src="${album.coverPhoto || 'https://picsum.photos/300/200?random=' + album.id}" 
                                 alt="${album.name}">
                            <div class="album-overlay">
                                <button class="album-action" data-action="view">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="album-action" data-action="share">
                                    <i class="fas fa-share"></i>
                                </button>
                                <button class="album-action" data-action="edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </div>
                            <span class="photo-count">
                                <i class="fas fa-camera"></i> ${album.photoCount}
                            </span>
                            ${album.privacy === 'private' ? 
                                '<span class="privacy-badge"><i class="fas fa-lock"></i></span>' : ''}
                        </div>
                        <div class="album-info">
                            <h3>${album.name}</h3>
                            <p>${album.description || 'Sem descrição'}</p>
                            <div class="album-meta">
                                <span>${new Date(album.updatedAt).toLocaleDateString('pt-BR')}</span>
                                <div class="album-tags">
                                    ${album.tags?.map(tag => `<span class="tag">${tag}</span>`).join('') || ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderAlbumDetail(albumId) {
        const album = this.albums.find(a => a.id === albumId);
        if (!album) return;
        
        this.currentAlbum = album;
        
        const detailView = document.getElementById('album-detail-view');
        const mainView = document.getElementById('albums-view');
        
        detailView.style.display = 'block';
        mainView.style.display = 'none';
        
        detailView.innerHTML = `
            <div class="album-detail-header">
                <button class="btn btn-secondary" id="back-to-albums">
                    <i class="fas fa-arrow-left"></i> Voltar
                </button>
                <h2>${album.name}</h2>
                <div class="album-detail-actions">
                    <button class="btn btn-primary" id="add-photos-btn">
                        <i class="fas fa-plus"></i> Adicionar Fotos
                    </button>
                    <button class="btn btn-secondary" id="share-album-btn">
                        <i class="fas fa-share"></i> Compartilhar
                    </button>
                    <button class="btn btn-secondary" id="download-album-btn">
                        <i class="fas fa-download"></i> Baixar
                    </button>
                </div>
            </div>

            <div class="album-detail-info">
                <p>${album.description || ''}</p>
                <div class="album-stats">
                    <span><i class="fas fa-images"></i> ${album.photoCount} fotos</span>
                    <span><i class="fas fa-calendar"></i> Criado em ${new Date(album.createdAt).toLocaleDateString('pt-BR')}</span>
                    <span><i class="fas fa-${album.privacy === 'private' ? 'lock' : 'globe'}"></i> ${album.privacy === 'private' ? 'Privado' : 'Público'}</span>
                </div>
            </div>
            
            <div class="album-photos" id="album-photos">
                <div class="photos-grid">
                    <!-- Fotos serão carregadas aqui -->
                </div>
            </div>
        `;
        
        this.loadAndRenderPhotos(albumId);
    }
    
    async loadAndRenderPhotos(albumId) {
        const photos = await this.loadAlbumPhotos(albumId);
        const grid = document.querySelector('#album-photos .photos-grid');
        
        if (!grid) return;
        
        if (photos.length === 0) {
            grid.innerHTML = `
                <div class="empty-photos">
                    <i class="fas fa-images"></i>
                    <h3>Nenhuma foto no álbum</h3>
                    <p>Adicione fotos para começar</p>
                    <button class="btn btn-primary" id="add-first-photos">
                        Adicionar Primeiras Fotos
                    </button>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = photos.map(photo => `
            <div class="photo-item" data-photo-id="${photo.id}">
                <img src="${photo.url}" alt="${photo.name}" loading="lazy">
                <div class="photo-overlay">
                    <button class="photo-action" data-action="view">
                        <i class="fas fa-expand"></i>
                    </button>
                    <button class="photo-action" data-action="select">
                        <i class="far fa-square"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    openPhotoViewer(photoId) {
        const album = this.currentAlbum;
        if (!album) return;
        
        this.loadAlbumPhotos(album.id).then(photos => {
            const photo = photos.find(p => p.id === photoId);
            if (!photo) return;
            
            const viewer = document.getElementById('photo-viewer');
            const img = document.getElementById('viewer-photo');
            const name = document.getElementById('photo-name');
            const date = document.getElementById('photo-date');
            
            img.src = photo.url;
            name.textContent = photo.name;
            date.textContent = new Date(photo.uploadedAt).toLocaleDateString('pt-BR');
            
            viewer.style.display = 'block';
            
            // Configurar navegação
            const currentIndex = photos.findIndex(p => p.id === photoId);

          document.getElementById('prev-photo').onclick = () => {
                if (currentIndex > 0) {
                    this.openPhotoViewer(photos[currentIndex - 1].id);
                }
            };
            
            document.getElementById('next-photo').onclick = () => {
                if (currentIndex < photos.length - 1) {
                    this.openPhotoViewer(photos[currentIndex + 1].id);
                }
            };
        });
    }
    
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            // Criar álbum
            if (e.target.id === 'create-album-btn' || e.target.id === 'create-first-album') {
                document.getElementById('album-modal').style.display = 'block';
            }
            
            // Enviar fotos
            if (e.target.id === 'upload-photos-btn') {
                document.getElementById('upload-modal').style.display = 'block';
            }
            
            // Ver álbum
            if (e.target.closest('.album-card')) {
                const albumCard = e.target.closest('.album-card');
                const albumId = albumCard.dataset.albumId;
                
                if (e.target.closest('[data-action="view"]') || 
                    !e.target.closest('.album-action')) {
                    this.renderAlbumDetail(albumId);
                }
            }
            
            // Voltar para álbuns
            if (e.target.id === 'back-to-albums' || e.target.closest('#back-to-albums')) {
                document.getElementById('album-detail-view').style.display = 'none';
                document.getElementById('albums-view').style.display = 'block';
                this.currentAlbum = null;
            }
            
            // Adicionar fotos ao álbum
            if (e.target.id === 'add-photos-btn' || e.target.id === 'add-first-photos') {
                document.getElementById('upload-modal').style.display = 'block';
            }
            
            // Ver foto
            if (e.target.closest('[data-action="view"]')) {
                const photoItem = e.target.closest('.photo-item');
                if (photoItem) {
                    const photoId = photoItem.dataset.photoId;
                    this.openPhotoViewer(photoId);
                }
            }

          // Fechar modais
            const closeButtons = document.querySelectorAll('.close');
            closeButtons.forEach(btn => {
                btn.onclick = () => {
                    document.querySelectorAll('.modal').forEach(modal => {
                        modal.style.display = 'none';
                    });
                };
            });
            
            // Upload de arquivos
            const browseBtn = document.getElementById('browse-btn');
            const fileInput = document.getElementById('file-input');
            
            if (browseBtn) {
                browseBtn.onclick = () => fileInput.click();
            }
            
            if (fileInput) {
                fileInput.onchange = (e) => this.handleFileSelect(e.target.files);
            }
            
            // Zona de upload
            const uploadZone = document.getElementById('upload-zone');
            if (uploadZone) {
                uploadZone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    uploadZone.classList.add('dragover');
                });
                
                uploadZone.addEventListener('dragleave', () => {
                    uploadZone.classList.remove('dragover');
                });
                
                uploadZone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    uploadZone.classList.remove('dragover');
                    this.handleFileSelect(e.dataTransfer.files);
                });
            }
        });
    }
    
    handleFileSelect(files) {
        const preview = document.getElementById('upload-preview');
        preview.innerHTML = '';
        
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML += `
                    <div class="upload-preview-item">
                        <img src="${e.target.result}" alt="${file.name}">
                        <p>${file.name}</p>
                        <p>${(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        });
    }
    
    show() {
        document.getElementById('albums-container').style.display = 'block';
        this.render();
    }
    
    hide() {
        const container = document.getElementById('albums-container');
        if (container) {
            container.style.display = 'none';
        }
    }
}
```

