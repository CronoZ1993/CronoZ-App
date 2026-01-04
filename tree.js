// tree.js - Árvore Genealógica Interativa
class TreeModule {
    constructor(app) {
        this.app = app;
        this.treeData = {};
        this.selectedNode = null;
        this.view = 'tree'; // tree, list, timeline
        
        this.init();
    }
    
    async init() {
        await this.loadTree();
        this.render();
        this.setupEventListeners();
    }
    
    async loadTree() {
        try {
            const user = this.app.user;
            if (user) {
                const treeRef = ref(db, `users/${user.uid}/familyTree`);
                const snapshot = await get(treeRef);
                
                if (snapshot.exists()) {
                    this.treeData = snapshot.val();
                } else {
                    this.treeData = this.getSampleTree();
                    await this.saveTree();
                }
            }
        } catch (error) {
            console.error('Erro ao carregar árvore:', error);
            this.treeData = this.getSampleTree();
        }
    }
    
    getSampleTree() {
        return {
            id: 'root',
            name: 'Família Silva',
            nodes: [
                {
                    id: '1',
                    name: 'João Silva',
                    birthDate: '1950-05-15',
                    deathDate: '',
                    gender: 'male',
                    photo: '',
                    parents: [],
                    children: ['3', '4'],
                    spouse: '2',
                    notes: 'Fundador da família'
                },
                {
                    id: '2',
                    name: 'Maria Santos',
                    birthDate: '1952-08-20',
                    deathDate: '',
                    gender: 'female',
                    photo: '',
                    parents: [],
                    children: ['3', '4'],
                    spouse: '1',
                    notes: ''
                },
                {
                    id: '3',
                    name: 'Carlos Silva',
                    birthDate: '1975-03-10',
                    deathDate: '',
                    gender: 'male',
                    photo: '',
                    parents: ['1', '2'],
                    children: [],
                    spouse: '',
                    notes: ''
                }
            ]
        };
    }

  async saveTree() {
        try {
            const user = this.app.user;
            if (user) {
                const treeRef = ref(db, `users/${user.uid}/familyTree`);
                await set(treeRef, this.treeData);
            }
        } catch (error) {
            console.error('Erro ao salvar árvore:', error);
        }
    }
    
    async addPerson(personData) {
        const person = {
            id: Date.now().toString(),
            ...personData,
            createdAt: new Date().toISOString()
        };
        
        this.treeData.nodes.push(person);
        await this.saveTree();
        this.renderTree();
    }
    
    async updatePerson(id, updates) {
        const index = this.treeData.nodes.findIndex(p => p.id === id);
        if (index !== -1) {
            this.treeData.nodes[index] = { ...this.treeData.nodes[index], ...updates };
            await this.saveTree();
            this.renderTree();
        }
    }
    
    async deletePerson(id) {
        this.treeData.nodes = this.treeData.nodes.filter(p => p.id !== id);
        await this.saveTree();
        this.renderTree();
    }
    
    render() {
        const container = document.getElementById('tree-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="tree-header">
                <h2>Árvore Genealógica</h2>
                <div class="tree-actions">
                    <div class="view-selector">
                        <button class="view-btn ${this.view === 'tree' ? 'active' : ''}" data-view="tree">
                            <i class="fas fa-project-diagram"></i> Árvore
                        </button>
                        <button class="view-btn ${this.view === 'list' ? 'active' : ''}" data-view="list">
                            <i class="fas fa-list"></i> Lista
                        </button>
                        <button class="view-btn ${this.view === 'timeline' ? 'active' : ''}" data-view="timeline">
                            <i class="fas fa-timeline"></i> Linha do Tempo
                        </button>
                    </div>
                    
                    <button class="btn btn-primary" id="add-person-btn">
                        <i class="fas fa-user-plus"></i> Adicionar Pessoa
                    </button>
                    
                    <button class="btn btn-secondary" id="import-tree-btn">
                        <i class="fas fa-file-import"></i> Importar
                    </button>
                    
                    <button class="btn btn-secondary" id="export-tree-btn">
                        <i class="fas fa-file-export"></i> Exportar
                    </button>
                </div>
            </div>
            
            <div class="tree-main">
                <div class="tree-sidebar">
                    <div class="tree-stats">
                        <h4>Estatísticas</h4>
                        <div class="stat-item">
                            <span>Total de Pessoas:</span>
                            <strong>${this.treeData.nodes?.length || 0}</strong>
                        </div>
                        <div class="stat-item">
                            <span>Gerações:</span>
                            <strong>${this.calculateGenerations()}</strong>
                        </div>
                        <div class="stat-item">
                            <span>Maior Idade:</span>
                            <strong>${this.getOldestAge()} anos</strong>
                        </div>
                    </div>
                    
                    <div class="tree-search">
                        <input type="text" placeholder="Buscar na árvore..." id="tree-search">
                        <i class="fas fa-search"></i>
                    </div>
                    
                    <div class="tree-list" id="tree-list">
                        <!-- Lista de pessoas será renderizada aqui -->
                    </div>
                </div>
                
                <div class="tree-view" id="tree-view">
                    <!-- Visualização da árvore será renderizada aqui -->
                </div>
            </div>

            <div class="tree-view" id="tree-view">
                    <!-- Visualização da árvore será renderizada aqui -->
                </div>
            </div>
            
            <!-- Modal de pessoa -->
            <div class="modal" id="person-modal">
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h3 id="modal-title">Nova Pessoa</h3>
                    <form id="person-form">
                        <input type="hidden" id="person-id">
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="person-name">Nome *</label>
                                <input type="text" id="person-name" required>
                            </div>
                            <div class="form-group">
                                <label for="person-gender">Gênero</label>
                                <select id="person-gender">
                                    <option value="male">Masculino</option>
                                    <option value="female">Feminino</option>
                                    <option value="other">Outro</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="person-birth">Nascimento</label>
                                <input type="date" id="person-birth">
                            </div>
                            <div class="form-group">
                                <label for="person-death">Falecimento</label>
                                <input type="date" id="person-death">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="person-photo">Foto (URL)</label>
                            <input type="url" id="person-photo">
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="person-parents">Pais</label>
                                <select id="person-parents" multiple>
                                    ${this.treeData.nodes?.map(person => 
                                        `<option value="${person.id}">${person.name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="person-children">Filhos</label>
                                <select id="person-children" multiple>
                                    ${this.treeData.nodes?.map(person => 
                                        `<option value="${person.id}">${person.name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="person-spouse">Cônjuge</label>
                            <select id="person-spouse">
                                <option value="">Nenhum</option>
                                ${this.treeData.nodes?.map(person => 
                                    `<option value="${person.id}">${person.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="person-notes">Notas</label>
                            <textarea id="person-notes" rows="4"></textarea>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" id="cancel-person">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        this.renderView();
    }

  renderView() {
        switch (this.view) {
            case 'tree':
                this.renderTree();
                break;
            case 'list':
                this.renderList();
                break;
            case 'timeline':
                this.renderTimeline();
                break;
        }
        
        this.renderTreeList();
    }
    
    renderTree() {
        const view = document.getElementById('tree-view');
        if (!view) return;
        
        // Usar D3.js para renderizar a árvore
        view.innerHTML = `
            <div class="tree-diagram" id="tree-diagram">
                <svg width="100%" height="600"></svg>
            </div>
        `;
        
        this.renderD3Tree();
    }
    
    renderD3Tree() {
        // Implementação simplificada com D3.js
        const svg = d3.select('#tree-diagram svg');
        const width = svg.node().getBoundingClientRect().width;
        const height = 600;
        
        svg.attr('width', width).attr('height', height);
        
        // Criar estrutura de dados para D3
        const root = this.buildD3Tree();
        
        // Configurar layout da árvore
        const treeLayout = d3.tree().size([height - 100, width - 200]);
        const treeData = treeLayout(root);
        
        // Criar links
        const links = svg.append('g')
            .selectAll('.link')
            .data(treeData.links())
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x))
            .attr('stroke', '#999')
            .attr('fill', 'none');
        
        // Criar nós
        const nodes = svg.append('g')
            .selectAll('.node')
            .data(treeData.descendants())
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.y},${d.x})`)
            .on('click', (event, d) => this.selectNode(d.data.id));
        
        // Adicionar círculos aos nós
        nodes.append('circle')
            .attr('r', 25)
            .attr('fill', d => d.data.gender === 'male' ? '#4A90E2' : '#E24A4A');
        
        // Adicionar texto
        nodes.append('text')
            .attr('dy', '.35em')
            .attr('y', -30)
            .attr('text-anchor', 'middle')
            .text(d => d.data.name)
            .style('font-size', '12px')
            .style('fill', '#333');
        
        nodes.append('text')
            .attr('dy', '.35em')
            .attr('y', 35)
            .attr('text-anchor', 'middle')
            .text(d => d.data.birthDate ? new Date(d.data.birthDate).getFullYear() : '')
            .style('font-size', '10px')
            .style('fill', '#666');
    }
    
    buildD3Tree() {
        // Encontrar a raiz (alguém sem pais)
        const rootPerson = this.treeData.nodes.find(p => 
            !p.parents || p.parents.length === 0
        ) || this.treeData.nodes[0];
        
        const hierarchy = { id: rootPerson.id, name: rootPerson.name, gender: rootPerson.gender, birthDate: rootPerson.birthDate };
        
        const buildChildren = (personId) => {
            const person = this.treeData.nodes.find(p => p.id === personId);
            if (!person || !person.children || person.children.length === 0) return [];

        return person.children.map(childId => {
                const child = this.treeData.nodes.find(p => p.id === childId);
                return {
                    id: child.id,
                    name: child.name,
                    gender: child.gender,
                    birthDate: child.birthDate,
                    children: buildChildren(child.id)
                };
            });
        };
        
        hierarchy.children = buildChildren(rootPerson.id);
        return d3.hierarchy(hierarchy);
    }
    
    renderList() {
        const view = document.getElementById('tree-view');
        if (!view) return;
        
        view.innerHTML = `
            <div class="tree-list-view">
                <h3>Lista de Família</h3>
                <table class="tree-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Gênero</th>
                            <th>Nascimento</th>
                            <th>Idade</th>
                            <th>Pais</th>
                            <th>Filhos</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.treeData.nodes?.map(person => `
                            <tr>
                                <td>
                                    <div class="person-info">
                                        ${person.photo ? `<img src="${person.photo}" alt="${person.name}">` : 
                                          `<div class="person-avatar ${person.gender}">${person.name.charAt(0)}</div>`}
                                        <span>${person.name}</span>
                                    </div>
                                </td>
                                <td>${person.gender === 'male' ? 'Masculino' : 'Feminino'}</td>
                                <td>${person.birthDate ? new Date(person.birthDate).toLocaleDateString('pt-BR') : '-'}</td>
                                <td>${this.calculateAge(person.birthDate, person.deathDate)}</td>
                                <td>${this.getParentsNames(person.parents)}</td>
                                <td>${person.children?.length || 0}</td>
                                <td>
                                    <button class="icon-btn" data-action="edit" data-id="${person.id}">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="icon-btn" data-action="delete" data-id="${person.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    renderTimeline() {
        const view = document.getElementById('tree-view');
        if (!view) return;
        
        // Ordenar pessoas por data de nascimento
        const sortedPeople = [...this.treeData.nodes].sort((a, b) => 
            new Date(a.birthDate || 0) - new Date(b.birthDate || 0)
        );
        
        view.innerHTML = `
            <div class="timeline-view">
                <h3>Linha do Tempo da Família</h3>
                <div class="timeline">
                    ${sortedPeople.map((person, index) => `
                        <div class="timeline-item ${index % 2 === 0 ? 'left' : 'right'}">
                            <div class="timeline-content">
                                <div class="timeline-year">${person.birthDate ? new Date(person.birthDate).getFullYear() : '?'}</div>
                                <div class="timeline-person">
                                    ${person.photo ? `<img src="${person.photo}" alt="${person.name}">` : 
                                      `<div class="person-avatar ${person.gender}">${person.name.charAt(0)}</div>`}
                                    <div>
                                        <h4>${person.name}</h4>
                                        <p>${person.birthDate ? new Date(person.birthDate).toLocaleDateString('pt-BR') : 'Data desconhecida'}</p>
                                        ${person.deathDate ? `<p>Falecimento: ${new Date(person.deathDate).toLocaleDateString('pt-BR')}</p>` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

  renderTreeList() {
        const list = document.getElementById('tree-list');
        if (!list) return;
        
        list.innerHTML = this.treeData.nodes?.map(person => `
            <div class="tree-list-item ${this.selectedNode === person.id ? 'selected' : ''}" data-id="${person.id}">
                <div class="person-avatar ${person.gender}">${person.name.charAt(0)}</div>
                <div class="person-info">
                    <strong>${person.name}</strong>
                    <p>${this.calculateAge(person.birthDate, person.deathDate)} anos</p>
                </div>
            </div>
        `).join('') || '';
    }
    
    calculateAge(birthDate, deathDate) {
        if (!birthDate) return '?';
        
        const birth = new Date(birthDate);
        const end = deathDate ? new Date(deathDate) : new Date();
        
        const years = end.getFullYear() - birth.getFullYear();
        const months = end.getMonth() - birth.getMonth();
        
        return months < 0 ? years - 1 : years;
    }
    
    getParentsNames(parentIds) {
        if (!parentIds || parentIds.length === 0) return '-';
        
        return parentIds.map(id => {
            const parent = this.treeData.nodes.find(p => p.id === id);
            return parent?.name || 'Desconhecido';
        }).join(', ');
    }
    
    calculateGenerations() {
        // Cálculo simplificado de gerações
        const generations = new Set();
        this.treeData.nodes?.forEach(person => {
            if (person.birthDate) {
                const birthYear = new Date(person.birthDate).getFullYear();
                const generation = Math.floor((birthYear - 1900) / 25);
                generations.add(generation);
            }
        });
        return generations.size;
    }
    
    getOldestAge() {
        let oldest = 0;
        this.treeData.nodes?.forEach(person => {
            if (person.birthDate) {
                const age = this.calculateAge(person.birthDate, person.deathDate);
                if (typeof age === 'number' && age > oldest) {
                    oldest = age;
                }
            }
        });
        return oldest;
    }
    
    selectNode(nodeId) {
        this.selectedNode = nodeId;
        this.renderTreeList();
        
        // Mostrar detalhes da pessoa selecionada
        this.showPersonDetails(nodeId);
    }
    
    showPersonDetails(nodeId) {
        const person = this.treeData.nodes.find(p => p.id === nodeId);
        if (!person) return;
        
        // Implementar detalhes da pessoa
        console.log('Detalhes da pessoa:', person);
    }
    
    async importFromContacts() {
        const contacts = this.app.modules.contacts.contacts;
        
        contacts.forEach(contact => {
            if (contact.name && !this.treeData.nodes.find(p => p.name === contact.name)) {
                this.addPerson({
                    name: contact.name,
                    gender: 'other',
                    birthDate: contact.birthday || '',
                    notes: `Importado de contatos: ${contact.email || ''}`
                });
            }
        });
    }
    
    async exportToPDF() {
        // Implementar exportação para PDF
        console.log('Exportando árvore para PDF...');
    }
    
    async exportToImage() {
        // Implementar exportação para imagem
        const svg = document.querySelector('#tree-diagram svg');
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const png = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = 'arvore-genealogica.png';
                link.href = png;
                link.click();
            };
            
            img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
        }
    }
    
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            // Mudar vista
            if (e.target.closest('.view-btn')) {
                const view = e.target.closest('.view-btn').dataset.view;
                this.view = view;
                this.renderView();
            }

         // Adicionar pessoa
            if (e.target.id === 'add-person-btn') {
                this.openPersonModal();
            }
            
            // Importar de contatos
            if (e.target.id === 'import-tree-btn') {
                this.importFromContacts();
            }
            
            // Exportar
            if (e.target.id === 'export-tree-btn') {
                this.exportToImage();
            }
            
            // Selecionar pessoa na lista
            if (e.target.closest('.tree-list-item')) {
                const personId = e.target.closest('.tree-list-item').dataset.id;
                this.selectNode(personId);
            }
            
            // Ações na lista
            if (e.target.closest('[data-action]')) {
                const button = e.target.closest('[data-action]');
                const action = button.dataset.action;
                const id = button.dataset.id;
                
                switch (action) {
                    case 'edit':
                        this.openPersonModal(id);
                        break;
                    case 'delete':
                        if (confirm('Tem certeza que deseja excluir esta pessoa?')) {
                            this.deletePerson(id);
                        }
                        break;
                }
            }
        });
    }
    
    openPersonModal(personId = null) {
        // Implementar abertura do modal de pessoa
        console.log('Abrir modal de pessoa:', personId);
    }
    
    show() {
        document.getElementById('tree-container').style.display = 'block';
        this.render();
    }
    
    hide() {
        const container = document.getElementById('tree-container');
        if (container) {
            container.style.display = 'none';
        }
    }
}
```

