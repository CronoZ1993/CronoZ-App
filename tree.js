// tree.js - ÁRVORE GENEALÓGICA (Parte 1/4)
import { auth, db } from './firebase-config.js';
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
    onSnapshot
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

class FamilyTreeSystem {
    constructor() {
        this.currentUser = null;
        this.familyMembers = [];
        this.treeData = null;
        this.currentView = 'members';
        this.init();
    }

    async init() {
        await this.loadCurrentUser();
        this.setupTreeListeners();
    }

    async loadCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
    }

    async renderTreePage() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="tree-container">
                <!-- Cabeçalho -->
                <div class="tree-header">
                    <h2><i class="fas fa-tree"></i> Árvore Genealógica</h2>
                    <div class="header-actions">
                        <div class="view-selector">
                            <select id="treeViewSelect" onchange="familyTreeSystem.switchView(this.value)">
                                <option value="members">Membros</option>
                                <option value="tree">Visualizar Árvore</option>
                            </select>
                        </div>
                        <button class="btn-primary" id="addMemberBtn">
                            <i class="fas fa-user-plus"></i> Novo Membro
                        </button>
                    </div>
                </div>

                <!-- Conteúdo da Árvore -->
                <div class="tree-content">
                    <!-- Visão: Lista de Membros -->
                    <div class="members-view" id="membersView">
                        <div class="members-header">
                            <div class="search-box">
                                <i class="fas fa-search"></i>
                                <input type="text" id="memberSearch" placeholder="Buscar membros...">
                            </div>
                            <div class="filters">
                                <select id="memberSort">
                                    <option value="name">Nome (A-Z)</option>
                                    <option value="birthdate">Data Nascimento</option>
                                    <option value="added">Data Adição</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="members-list" id="membersList">
                            <div class="loading-members">
                                <i class="fas fa-spinner fa-spin"></i>
                                <p>Carregando membros da família...</p>
                            </div>
                        </div>
                    </div>

                    <!-- Visão: Árvore Visual -->
                    <div class="tree-view" id="treeView" style="display: none;">
                        <div class="tree-controls">
                            <button class="btn-secondary" onclick="familyTreeSystem.zoomIn()">
                                <i class="fas fa-search-plus"></i>
                            </button>
                            <button class="btn-secondary" onclick="familyTreeSystem.zoomOut()">
                                <i class="fas fa-search-minus"></i>
                            </button>
                            <button class="btn-secondary" onclick="familyTreeSystem.resetView()">
                                <i class="fas fa-expand-arrows-alt"></i>
                            </button>
                            <button class="btn-primary" onclick="familyTreeSystem.exportTree()">
                                <i class="fas fa-download"></i> Exportar
                            </button>
                        </div>
                        
                        <div class="tree-canvas-container">
                            <div class="tree-canvas" id="treeCanvas">
                                <!-- A árvore será renderizada aqui com D3.js -->
                                <div class="tree-placeholder">
                                    <i class="fas fa-tree"></i>
                                    <p>Árvore genealógica será exibida aqui</p>
                                    <p class="hint">Adicione membros para visualizar a árvore</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupTreeEvents();
        await this.loadFamilyMembers();
        this.addTreeStyles();
    }

// Métodos de configuração
setupTreeListeners() {
    const userId = localStorage.getItem('userId');
    if (userId) {
        const membersRef = collection(db, 'users', userId, 'family');
        onSnapshot(membersRef, (snapshot) => {
            this.familyMembers = [];
            snapshot.forEach(doc => {
                this.familyMembers.push({ id: doc.id, ...doc.data() });
            });
            this.renderMembersList();
            this.generateTreeData();
        });
    }
}

setupTreeEvents() {
    document.getElementById('addMemberBtn')?.addEventListener('click', () => {
        this.showAddMemberModal();
    });

    document.getElementById('memberSearch')?.addEventListener('input', (e) => {
        this.filterMembers(e.target.value);
    });

    document.getElementById('memberSort')?.addEventListener('change', (e) => {
        this.sortMembers(e.target.value);
    });
}

async loadFamilyMembers() {
    try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        const membersRef = collection(db, 'users', userId, 'family');
        const q = query(membersRef, orderBy('name'));
        const snapshot = await getDocs(q);
        
        this.familyMembers = [];
        snapshot.forEach(doc => {
            this.familyMembers.push({ id: doc.id, ...doc.data() });
        });
        
        this.renderMembersList();
        this.generateTreeData();
        
    } catch (error) {
        console.error('Erro ao carregar membros:', error);
    }
}

renderMembersList() {
    const membersList = document.getElementById('membersList');
    if (!membersList) return;

    if (this.familyMembers.length === 0) {
        membersList.innerHTML = `
            <div class="empty-members">
                <i class="fas fa-user-slash"></i>
                <h3>Nenhum membro na árvore</h3>
                <p>Adicione o primeiro membro da sua família!</p>
                <button class="btn-primary" onclick="familyTreeSystem.showAddMemberModal()">
                    <i class="fas fa-user-plus"></i> Adicionar Membro
                </button>
            </div>
        `;
        return;
    }

    membersList.innerHTML = this.familyMembers.map(member => `
        <div class="member-card" data-id="${member.id}">
            <div class="member-avatar">
                <img src="${member.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(member.name)}" 
                     alt="${member.name}">
                ${member.isUser ? '<span class="user-badge"><i class="fas fa-user"></i></span>' : ''}
            </div>
            
            <div class="member-info">
                <div class="member-main">
                    <h4 class="member-name">${member.name}</h4>
                    ${member.nickname ? `<p class="member-nickname">"${member.nickname}"</p>` : ''}
                    <div class="member-tags">
                        ${member.relationship ? `<span class="relationship-tag">${member.relationship}</span>` : ''}
                        ${member.generation ? `<span class="generation-tag">${this.getGenerationLabel(member.generation)}</span>` : ''}
                    </div>
                </div>
                
                <div class="member-details">
                    ${member.birthDate ? `
                        <div class="member-detail">
                            <i class="fas fa-birthday-cake"></i>
                            <span>${this.formatDate(member.birthDate)}</span>
                            ${member.age ? `<span class="age">(${member.age} anos)</span>` : ''}
                        </div>
                    ` : ''}
                    
                    ${member.deathDate ? `
                        <div class="member-detail">
                            <i class="fas fa-cross"></i>
                            <span>Falecimento: ${this.formatDate(member.deathDate)}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="member-connections">
                    ${member.spouse ? `<span class="connection"><i class="fas fa-heart"></i> Cônjuge</span>` : ''}
                    ${member.childrenCount > 0 ? `<span class="connection"><i class="fas fa-child"></i> ${member.childrenCount} filhos</span>` : ''}
                    ${member.parents ? `<span class="connection"><i class="fas fa-users"></i> Pais</span>` : ''}
                </div>
            </div>
            
            <div class="member-actions">
                <button class="action-btn" onclick="familyTreeSystem.editMember('${member.id}')" 
                        title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                
                <button class="action-btn" onclick="familyTreeSystem.showRelationships('${member.id}')" 
                        title="Relacionamentos">
                    <i class="fas fa-project-diagram"></i>
                </button>
                
                <button class="action-btn" onclick="familyTreeSystem.deleteMember('${member.id}')" 
                        title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

getGenerationLabel(generation) {
    const labels = {
        '-3': 'Bisavô',
        '-2': 'Avô',
        '-1': 'Pai',
        '0': 'Eu',
        '1': 'Filho',
        '2': 'Neto',
        '3': 'Bisneto'
    };
    return labels[generation] || `Geração ${generation}`;
}

formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

filterMembers(searchTerm) {
    const term = searchTerm.toLowerCase();
    const members = document.querySelectorAll('.member-card');
    
    members.forEach(member => {
        const name = member.querySelector('.member-name').textContent.toLowerCase();
        const nickname = member.querySelector('.member-nickname')?.textContent.toLowerCase() || '';
        const shouldShow = name.includes(term) || nickname.includes(term);
        member.style.display = shouldShow ? 'flex' : 'none';
    });
}

sortMembers(sortBy) {
    switch(sortBy) {
        case 'name':
            this.familyMembers.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'birthdate':
            this.familyMembers.sort((a, b) => {
                const dateA = new Date(a.birthDate || 0);
                const dateB = new Date(b.birthDate || 0);
                return dateA - dateB;
            });
            break;
        case 'added':
            this.familyMembers.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateA - dateB;
            });
            break;
    }
    this.renderMembersList();
}

// Métodos de CRUD de membros
showAddMemberModal() {
    const modalHtml = `
        <div class="modal-overlay active" id="addMemberModal">
            <div class="modal-content wide-modal">
                <div class="modal-header">
                    <h3>Adicionar Membro da Família</h3>
                    <button class="close-modal" onclick="familyTreeSystem.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="form-tabs">
                        <button class="form-tab active" data-tab="basic">Informações Básicas</button>
                        <button class="form-tab" data-tab="relations">Relacionamentos</button>
                        <button class="form-tab" data-tab="additional">Informações Adicionais</button>
                    </div>
                    
                    <div class="form-content">
                        <!-- Aba Básica -->
                        <div class="form-tab-content active" id="basicTab">
                            <div class="form-group">
                                <label>Nome Completo *</label>
                                <input type="text" id="memberName" placeholder="Nome do membro" required>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Apelido</label>
                                    <input type="text" id="memberNickname" placeholder="Como era chamado?">
                                </div>
                                
                                <div class="form-group">
                                    <label>Parentesco *</label>
                                    <select id="memberRelationship">
                                        <option value="">Selecione...</option>
                                        <option value="user">Eu mesmo</option>
                                        <option value="spouse">Cônjuge</option>
                                        <option value="father">Pai</option>
                                        <option value="mother">Mãe</option>
                                        <option value="son">Filho(a)</option>
                                        <option value="daughter">Filha</option>
                                        <option value="brother">Irmão</option>
                                        <option value="sister">Irmã</option>
                                        <option value="grandfather">Avô</option>
                                        <option value="grandmother">Avó</option>
                                        <option value="uncle">Tio</option>
                                        <option value="aunt">Tia</option>
                                        <option value="cousin">Primo(a)</option>
                                        <option value="other">Outro</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Data de Nascimento</label>
                                    <input type="date" id="memberBirthDate">
                                </div>
                                
                                <div class="form-group">
                                    <label>Data de Falecimento</label>
                                    <input type="date" id="memberDeathDate">
                                </div>
                            </div>
                            
                            <div class="checkbox-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="memberIsUser">
                                    <span>Este membro sou eu</span>
                                </label>
                                
                                <label class="checkbox-label">
                                    <input type="checkbox" id="memberAddToCalendar">
                                    <span>Adicionar aniversário ao calendário</span>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Aba Relacionamentos -->
                        <div class="form-tab-content" id="relationsTab">
                            <div class="form-group">
                                <label>Cônjuge</label>
                                <select id="memberSpouse">
                                    <option value="">Nenhum</option>
                                    ${this.familyMembers.map(m => 
                                        `<option value="${m.id}">${m.name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Pai</label>
                                <select id="memberFather">
                                    <option value="">Desconhecido</option>
                                    ${this.familyMembers.filter(m => m.gender === 'male' || !m.gender).map(m => 
                                        `<option value="${m.id}">${m.name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Mãe</label>
                                <select id="memberMother">
                                    <option value="">Desconhecida</option>
                                    ${this.familyMembers.filter(m => m.gender === 'female' || !m.gender).map(m => 
                                        `<option value="${m.id}">${m.name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Filhos</label>
                                <div class="multi-select" id="memberChildren">
                                    ${this.familyMembers.map(m => `
                                        <label class="checkbox-label">
                                            <input type="checkbox" value="${m.id}">
                                            <span>${m.name}</span>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Aba Adicional -->
                        <div class="form-tab-content" id="additionalTab">
                            <div class="form-group">
                                <label>Foto (URL)</label>
                                <input type="text" id="memberPhotoURL" placeholder="Cole a URL da foto">
                            </div>
                            
                            <div class="form-group">
                                <label>Gênero</label>
                                <select id="memberGender">
                                    <option value="">Não especificado</option>
                                    <option value="male">Masculino</option>
                                    <option value="female">Feminino</option>
                                    <option value="other">Outro</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Local de Nascimento</label>
                                <input type="text" id="memberBirthPlace" placeholder="Cidade, Estado">
                            </div>
                            
                            <div class="form-group">
                                <label>Profissão</label>
                                <input type="text" id="memberOccupation" placeholder="Profissão do membro">
                            </div>
                            
                            <div class="form-group">
                                <label>Observações</label>
                                <textarea id="memberNotes" rows="3" placeholder="Notas e informações adicionais"></textarea>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button class="btn-secondary" onclick="familyTreeSystem.closeModal()">
                            Cancelar
                        </button>
                        <button class="btn-primary" onclick="familyTreeSystem.saveMember()">
                            <i class="fas fa-save"></i> Salvar Membro
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    this.setupFormTabs();
}

setupFormTabs() {
    const tabs = document.querySelectorAll('.form-tab');
    const contents = document.querySelectorAll('.form-tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            
            // Atualizar tabs
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Atualizar conteúdos
            contents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}Tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
}

async saveMember() {
    const name = document.getElementById('memberName').value;
    const relationship = document.getElementById('memberRelationship').value;
    
    if (!name || !relationship) {
        this.showMessage('Nome e parentesco são obrigatórios', 'error');
        return;
    }

    try {
        const userId = localStorage.getItem('userId');
        const memberId = Date.now().toString();
        
        // Calcular geração baseada no parentesco
        const generation = this.calculateGeneration(relationship);
        
        const memberData = {
            id: memberId,
            name: name,
            nickname: document.getElementById('memberNickname').value || '',
            relationship: relationship,
            generation: generation,
            birthDate: document.getElementById('memberBirthDate').value || '',
            deathDate: document.getElementById('memberDeathDate').value || '',
            isUser: document.getElementById('memberIsUser').checked,
            photoURL: document.getElementById('memberPhotoURL').value || '',
            gender: document.getElementById('memberGender').value || '',
            birthPlace: document.getElementById('memberBirthPlace').value || '',
            occupation: document.getElementById('memberOccupation').value || '',
            notes: document.getElementById('memberNotes').value || '',
            
            // Relacionamentos
            spouse: document.getElementById('memberSpouse').value || null,
            father: document.getElementById('memberFather').value || null,
            mother: document.getElementById('memberMother').value || null,
            
            // Calcular idade
            age: this.calculateAge(document.getElementById('memberBirthDate').value),
            
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const memberRef = doc(db, 'users', userId, 'family', memberId);
        await setDoc(memberRef, memberData);
        
        // Se for o usuário, atualizar perfil
        if (memberData.isUser) {
            await this.updateUserProfile(memberData);
        }
        
        this.showMessage('Membro salvo com sucesso!', 'success');
        this.closeModal();
        this.loadFamilyMembers();
        
    } catch (error) {
        console.error('Erro ao salvar membro:', error);
        this.showMessage('Erro ao salvar membro', 'error');
    }
}

    // Métodos auxiliares
    calculateGeneration(relationship) {
        const generations = {
            'user': 0,
            'spouse': 0,
            'father': -1,
            'mother': -1,
            'son': 1,
            'daughter': 1,
            'brother': 0,
            'sister': 0,
            'grandfather': -2,
            'grandmother': -2,
            'uncle': -1,
            'aunt': -1,
            'cousin': 0
        };
        return generations[relationship] || 0;
    }

    calculateAge(birthDate) {
        if (!birthDate) return null;
        
        const birth = new Date(birthDate);
        const today = new Date();
        
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    async updateUserProfile(memberData) {
        try {
            const userId = localStorage.getItem('userId');
            const userRef = doc(db, 'users', userId);
            
            await updateDoc(userRef, {
                displayName: memberData.name,
                birthDate: memberData.birthDate
            });
            
            // Atualizar localmente
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            currentUser.displayName = memberData.name;
            currentUser.birthDate = memberData.birthDate;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
        }
    }

    switchView(view) {
        this.currentView = view;
        
        const membersView = document.getElementById('membersView');
        const treeView = document.getElementById('treeView');
        
        if (view === 'members') {
            membersView.style.display = 'block';
            treeView.style.display = 'none';
        } else {
            membersView.style.display = 'none';
            treeView.style.display = 'block';
            this.renderTreeVisualization();
        }
    }

    generateTreeData() {
        // Estruturar dados para visualização da árvore
        this.treeData = {
            nodes: this.familyMembers.map(member => ({
                id: member.id,
                name: member.name,
                nickname: member.nickname,
                relationship: member.relationship,
                generation: member.generation,
                photoURL: member.photoURL,
                isUser: member.isUser
            })),
            links: []
        };
        
        // Criar links baseados nos relacionamentos
        this.familyMembers.forEach(member => {
            if (member.spouse) {
                this.treeData.links.push({
                    source: member.id,
                    target: member.spouse,
                    type: 'spouse'
                });
            }
            
            if (member.father) {
                this.treeData.links.push({
                    source: member.id,
                    target: member.father,
                    type: 'parent'
                });
            }
            
            if (member.mother) {
                this.treeData.links.push({
                    source: member.id,
                    target: member.mother,
                    type: 'parent'
                });
            }
        });
    }

    renderTreeVisualization() {
        const treeCanvas = document.getElementById('treeCanvas');
        if (!treeCanvas || this.familyMembers.length === 0) return;
        
        treeCanvas.innerHTML = `
            <div class="tree-diagram">
                <!-- Diagrama simples sem D3.js -->
                <div class="tree-levels">
                    ${this.renderTreeLevels()}
                </div>
            </div>
        `;
    }

    renderTreeLevels() {
        // Agrupar por geração
        const byGeneration = {};
        this.familyMembers.forEach(member => {
            const gen = member.generation || 0;
            if (!byGeneration[gen]) byGeneration[gen] = [];
            byGeneration[gen].push(member);
        });
        
        // Ordenar gerações
        const generations = Object.keys(byGeneration).sort((a, b) => a - b);
        
        return generations.map(gen => `
            <div class="tree-level" data-generation="${gen}">
                <h4>${this.getGenerationLabel(gen)}</h4>
                <div class="level-members">
                    ${byGeneration[gen].map(member => `
                        <div class="tree-node ${member.isUser ? 'user-node' : ''}" data-id="${member.id}">
                            <div class="node-avatar">
                                <img src="${member.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(member.name)}" 
                                     alt="${member.name}">
                            </div>
                            <div class="node-info">
                                <strong>${member.name}</strong>
                                ${member.nickname ? `<small>"${member.nickname}"</small>` : ''}
                                <div class="node-relationship">${member.relationship}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
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

    addTreeStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .tree-container {
                animation: fadeIn 0.3s ease;
            }
            
            .tree-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: var(--spacing-lg);
                flex-wrap: wrap;
                gap: var(--spacing-md);
            }
            
            .tree-header h2 {
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
            
            .view-selector select {
                padding: 8px 12px;
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                background: var(--surface-color);
                color: var(--text-color);
            }
            
            .members-header {
                display: flex;
                gap: var(--spacing-md);
                margin-bottom: var(--spacing-lg);
                flex-wrap: wrap;
            }
            
            .members-list {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-md);
            }
            
            .member-card {
                display: flex;
                align-items: center;
                gap: var(--spacing-lg);
                padding: var(--spacing-lg);
                background: var(--surface-color);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                transition: var(--transition);
            }
            
            .member-card:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-md);
                border-color: var(--primary-color);
            }
            
            .member-avatar {
                position: relative;
                width: 70px;
                height: 70px;
                flex-shrink: 0;
            }
            
            .member-avatar img {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid var(--border-color);
            }
            
            .user-badge {
                position: absolute;
                bottom: 0;
                right: 0;
                background: var(--primary-color);
                color: #000;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8rem;
            }
            
            .member-info {
                flex: 1;
                min-width: 0;
            }
            
            .member-main {
                margin-bottom: var(--spacing-sm);
            }
            
            .member-name {
                font-size: 1.1rem;
                font-weight: 600;
                margin-bottom: 4px;
            }
            
            .member-nickname {
                color: var(--text-secondary);
                font-style: italic;
                margin-bottom: 4px;
            }
            
            .member-tags {
                display: flex;
                gap: var(--spacing-xs);
                flex-wrap: wrap;
            }
            
            .relationship-tag, .generation-tag {
                font-size: 0.75rem;
                padding: 2px 8px;
                border-radius: 12px;
                display: inline-block;
            }
            
            .relationship-tag {
                background: rgba(255, 215, 0, 0.1);
                color: var(--primary-color);
            }
            
            .generation-tag {
                background: rgba(66, 133, 244, 0.1);
                color: #4285F4;
            }
            
            .member-details {
                display: flex;
                gap: var(--spacing-md);
                margin-bottom: var(--spacing-sm);
                flex-wrap: wrap;
            }
            
            .member-detail {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 0.85rem;
                color: var(--text-secondary);
            }
            
            .member-detail .age {
                color: var(--primary-color);
                font-weight: 500;
            }
            
            .member-connections {
                display: flex;
                gap: var(--spacing-sm);
                flex-wrap: wrap;
            }
            
            .connection {
                font-size: 0.75rem;
                padding: 2px 8px;
                background: var(--surface-color);
                border: 1px solid var(--border-color);
                border-radius: 12px;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .member-actions {
                display: flex;
                gap: var(--spacing-xs);
            }
            
            .tree-view {
                margin-top: var(--spacing-lg);
            }
            
            .tree-controls {
                display: flex;
                gap: var(--spacing-sm);
                margin-bottom: var(--spacing-lg);
                flex-wrap: wrap;
            }
            
            .tree-canvas-container {
                background: var(--surface-color);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                padding: var(--spacing-lg);
                min-height: 500px;
                overflow: auto;
            }
            
            .tree-placeholder {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 400px;
                color: var(--text-secondary);
                text-align: center;
            }
            
            .tree-placeholder i {
                font-size: 4rem;
                margin-bottom: var(--spacing-lg);
                color: var(--border-color);
            }
            
            .tree-placeholder .hint {
                font-size: 0.9rem;
                margin-top: var(--spacing-sm);
            }
            
            .tree-levels {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-xl);
            }
            
            .tree-level {
                border-bottom: 1px solid var(--border-color);
                padding-bottom: var(--spacing-lg);
            }
            
            .tree-level h4 {
                color: var(--primary-color);
                margin-bottom: var(--spacing-md);
                padding-bottom: var(--spacing-sm);
                border-bottom: 1px solid var(--border-color);
            }
            
            .level-members {
                display: flex;
                gap: var(--spacing-lg);
                flex-wrap: wrap;
                justify-content: center;
            }
            
            .tree-node {
                background: var(--background-color);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                padding: var(--spacing-md);
                text-align: center;
                min-width: 120px;
                transition: var(--transition);
            }
            
            .tree-node:hover {
                border-color: var(--primary-color);
                transform: translateY(-2px);
            }
            
            .tree-node.user-node {
                border: 2px solid var(--primary-color);
                background: rgba(255, 215, 0, 0.05);
            }
            
            .node-avatar {
                width: 60px;
                height: 60px;
                margin: 0 auto var(--spacing-sm);
            }
            
            .node-avatar img {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                object-fit: cover;
            }
            
            .node-info {
                font-size: 0.9rem;
            }
            
            .node-relationship {
                font-size: 0.8rem;
                color: var(--text-secondary);
                margin-top: 4px;
            }
            
            /* Modal específico da árvore */
            .wide-modal {
                max-width: 800px;
            }
            
            .form-tabs {
                display: flex;
                gap: var(--spacing-xs);
                margin-bottom: var(--spacing-lg);
                border-bottom: 1px solid var(--border-color);
                padding-bottom: var(--spacing-sm);
            }
            
            .form-tab {
                padding: var(--spacing-sm) var(--spacing-lg);
                border: none;
                background: transparent;
                color: var(--text-secondary);
                cursor: pointer;
                border-radius: var(--border-radius) var(--border-radius) 0 0;
                transition: var(--transition);
            }
            
            .form-tab:hover {
                background: var(--surface-color);
            }
            
            .form-tab.active {
                background: var(--primary-color);
                color: #000;
                font-weight: 600;
            }
            
            .form-tab-content {
                display: none;
                animation: fadeIn 0.3s ease;
            }
            
            .form-tab-content.active {
                display: block;
            }
            
            .multi-select {
                max-height: 200px;
                overflow-y: auto;
                padding: var(--spacing-sm);
                background: var(--surface-color);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                display: flex;
                flex-direction: column;
                gap: var(--spacing-xs);
            }
            
            .empty-members {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: var(--spacing-xl);
                text-align: center;
                color: var(--text-secondary);
            }
            
            .empty-members i {
                font-size: 3rem;
                margin-bottom: var(--spacing-lg);
                color: var(--border-color);
            }
            
            @media (max-width: 768px) {
                .tree-header {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .header-actions {
                    flex-direction: column;
                }
                
                .member-card {
                    flex-direction: column;
                    text-align: center;
                }
                
                .member-details, .member-connections {
                    justify-content: center;
                }
                
                .member-actions {
                    width: 100%;
                    justify-content: center;
                }
                
                .level-members {
                    gap: var(--spacing-md);
                }
                
                .tree-node {
                    min-width: 100px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Inicializar sistema de árvore genealógica
const familyTreeSystem = new FamilyTreeSystem();
window.familyTreeSystem = familyTreeSystem;

// Integração com o app principal
if (typeof app !== 'undefined') {
    app.renderTreePage = async function() {
        await familyTreeSystem.renderTreePage();
    };
}

export default familyTreeSystem;