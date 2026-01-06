// tree.js - Sistema de árvore genealógica
import { auth, db } from './firebase-config.js';
import { 
    collection, doc, setDoc, getDoc, updateDoc, 
    deleteDoc, query, where, orderBy, onSnapshot 
} from './firebase-config.js';
import { showLoading, hideLoading, showToast, formatDate, calculateAge } from './utils.js';

class TreeSystem {
    constructor() {
        this.members = [];
        this.currentTree = 'my-tree';
        this.selectedMember = null;
        this.init();
    }
    
    init() {
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.loadTreeMembers();
                this.setupEventListeners();
                this.setupTabs();
            }
        });
    }
    
    setupEventListeners() {
        // Add member button
        const addBtn = document.getElementById('btn-add-member');
        if (addBtn) addBtn.addEventListener('click', () => this.openAddMemberModal());
        
        // Export button
        const exportBtn = document.getElementById('btn-export-tree');
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportTree());
        
        // Tree tabs
        document.querySelectorAll('.tree-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabType = e.currentTarget.dataset.tab;
                this.switchTab(tabType);
            });
        });
    }
    
    setupTabs() {
        this.switchTab('members');
    }
    
    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tree-tab').forEach(t => {
            t.classList.remove('active');
            if (t.dataset.tab === tab) t.classList.add('active');
        });
        
        // Show/hide content
        const membersTab = document.getElementById('tree-members');
        const treeTab = document.getElementById('tree-view-content');
        
        if (membersTab) membersTab.classList.remove('active');
        if (treeTab) treeTab.classList.remove('active');
        
        if (tab === 'members') {
            if (membersTab) membersTab.classList.add('active');
            this.renderMembersList();
        } else {
            if (treeTab) treeTab.classList.add('active');
            this.renderTreeView();
        }
    }
    
    async loadTreeMembers() {
        if (!auth.currentUser) return;
        
        const userId = auth.currentUser.uid;
        const membersRef = collection(db, 'users', userId, 'tree');
        const q = query(membersRef, orderBy('name'));
        
        onSnapshot(q, (snapshot) => {
            this.members = [];
            snapshot.forEach(doc => {
                this.members.push({ id: doc.id, ...doc.data() });
            });
            this.renderMembersList();
            this.renderTreeView();
        });
    }
    
    renderMembersList() {
        const container = document.getElementById('family-members');
        if (!container) return;
        
        if (this.members.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users fa-3x"></i>
                    <p>Nenhum membro na árvore</p>
                    <button class="btn-primary" id="btn-add-first-member">
                        <i class="fas fa-user-plus"></i> Adicionar Primeiro Membro
                    </button>
                </div>
            `;
            
            document.getElementById('btn-add-first-member')?.addEventListener('click', () => {
                this.openAddMemberModal();
            });
            return;
        }
        
        // Find main person (user)
        const mainPerson = this.members.find(m => m.isMainPerson) || this.members[0];
        
        container.innerHTML = this.members.map(member => {
            const age = member.birthDate ? calculateAge(member.birthDate) : null;
            const ageText = age ? `, ${age} anos` : '';
            const relationText = member.relation ? ` (${member.relation})` : '';
            const isMain = member.id === mainPerson.id;
            
            return `
                <div class="member-item ${isMain ? 'main-person' : ''}" data-member-id="${member.id}">
                    <img src="${member.photoURL || 'assets/default-avatar.png'}" 
                         alt="${member.name}"
                         class="member-avatar">
                    <div class="member-info">
                        <div class="member-name">
                            ${member.name}
                            ${isMain ? '<span class="badge" style="background: var(--primary-color);">Eu</span>' : ''}
                        </div>
                        <div class="member-details">
                            <span><i class="fas fa-user-tag"></i> ${member.relation || 'Sem relação definida'}</span>
                            ${member.birthDate ? `<span><i class="fas fa-birthday-cake"></i> ${formatDate(member.birthDate, 'dd/mm/yyyy')}${ageText}</span>` : ''}
                            ${member.deathDate ? `<span><i class="fas fa-cross"></i> Falecido em ${formatDate(member.deathDate, 'dd/mm/yyyy')}</span>` : ''}
                        </div>
                    </div>
                    <div class="member-actions">
                        <button class="member-action-btn btn-edit-member" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="member-action-btn btn-view-tree" title="Ver na árvore">
                            <i class="fas fa-project-diagram"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add event listeners
        container.querySelectorAll('.member-item').forEach((item, index) => {
            const member = this.members[index];
            
            // Edit button
            item.querySelector('.btn-edit-member')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openEditMemberModal(member);
            });
            
            // View in tree button
            item.querySelector('.btn-view-tree')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.switchTab('tree-view');
                this.centerOnMember(member.id);
            });
            
            // Click on member
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.member-actions')) {
                    this.openMemberDetails(member);
                }
            });
        });
    }
    
    openAddMemberModal() {
        const modalContent = `
            <form class="modal-form" id="add-member-form">
                <div class="modal-form-group">
                    <label for="member-name">Nome Completo *</label>
                    <input type="text" id="member-name" required placeholder="Nome do membro">
                </div>
                
                <div class="modal-form-row">
                    <div class="modal-form-group">
                        <label for="member-birth-date">Data de Nascimento</label>
                        <input type="date" id="member-birth-date">
                    </div>
                    
                    <div class="modal-form-group">
                        <label for="member-death-date">Data de Falecimento</label>
                        <input type="date" id="member-death-date">
                    </div>
                </div>
                
                <div class="modal-form-group">
                    <label for="member-relation">Parentesco *</label>
                    <select id="member-relation" required>
                        <option value="">Selecione...</option>
                        <option value="self">Eu mesmo(a)</option>
                        <option value="spouse">Cônjuge</option>
                        <option value="father">Pai</option>
                        <option value="mother">Mãe</option>
                        <option value="son">Filho(a)</option>
                        <option value="daughter">Filha</option>
                        <option value="brother">Irmão</option>
                        <option value="sister">Irmã</option>
                        <option value="grandfather">Avô</option>
                        <option value="grandmother">Avó</option>
                        <option value="grandson">Neto</option>
                        <option value="granddaughter">Neta</option>
                        <option value="uncle">Tio</option>
                        <option value="aunt">Tia</option>
                        <option value="cousin">Primo(a)</option>
                        <option value="other">Outro</option>
                    </select>
                </div>
                
                <div class="modal-form-group">
                    <label for="member-gender">Gênero</label>
                    <select id="member-gender">
                        <option value="">Não informado</option>
                        <option value="male">Masculino</option>
                        <option value="female">Feminino</option>
                        <option value="other">Outro</option>
                    </select>
                </div>
                
                <div class="modal-form-group">
                    <label for="member-spouse">Cônjuge</label>
                    <select id="member-spouse">
                        <option value="">Nenhum</option>
                        ${this.members.filter(m => ['spouse', 'husband', 'wife'].includes(m.relation))
                            .map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
                    </select>
                </div>
                
                <div class="modal-form-group">
                    <label for="member-parents">Pais</label>
                    <div class="parents-select">
                        <select id="member-father">
                            <option value="">Pai (não informado)</option>
                            ${this.members.filter(m => m.gender === 'male')
                                .map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
                        </select>
                        <select id="member-mother">
                            <option value="">Mãe (não informada)</option>
                            ${this.members.filter(m => m.gender === 'female')
                                .map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="modal-form-group">
                    <label for="member-notes">Observações</label>
                    <textarea id="member-notes" rows="3" placeholder="Notas sobre este membro..."></textarea>
                </div>
                
                <div class="modal-form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" id="member-add-to-calendar">
                        Adicionar aniversário ao calendário
                    </label>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn-secondary close-modal">Cancelar</button>
                    <button type="submit" class="btn-primary">Adicionar Membro</button>
                </div>
            </form>
        `;
        
        this.showModal('Adicionar Membro', modalContent);
        
        // Update relation select change
        const relationSelect = document.getElementById('member-relation');
        if (relationSelect) {
            relationSelect.addEventListener('change', (e) => {
                this.updateFormBasedOnRelation(e.target.value);
            });
        }
        
        // Form submission
        document.getElementById('add-member-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addMember();
        });
    }

updateFormBasedOnRelation(relation) {
    const spouseSelect = document.getElementById('member-spouse');
    const parentsDiv = document.querySelector('.parents-select');
    
    if (!spouseSelect || !parentsDiv) return;
    
    // Show/hide spouse field
    if (['spouse', 'husband', 'wife'].includes(relation)) {
        spouseSelect.style.display = 'block';
        spouseSelect.previousElementSibling.style.display = 'block';
    } else {
        spouseSelect.style.display = 'none';
        spouseSelect.previousElementSibling.style.display = 'none';
    }
    
    // Show/hide parents fields
    if (['son', 'daughter', 'brother', 'sister'].includes(relation)) {
        parentsDiv.style.display = 'block';
        parentsDiv.previousElementSibling.style.display = 'block';
    } else {
        parentsDiv.style.display = 'none';
        parentsDiv.previousElementSibling.style.display = 'none';
    }
}

async addMember() {
    if (!auth.currentUser) return;
    
    const name = document.getElementById('member-name').value.trim();
    const birthDate = document.getElementById('member-birth-date').value;
    const deathDate = document.getElementById('member-death-date').value;
    const relation = document.getElementById('member-relation').value;
    const gender = document.getElementById('member-gender').value;
    const spouseId = document.getElementById('member-spouse').value;
    const fatherId = document.getElementById('member-father').value;
    const motherId = document.getElementById('member-mother').value;
    const notes = document.getElementById('member-notes').value.trim();
    const addToCalendar = document.getElementById('member-add-to-calendar').checked;
    
    if (!name || !relation) {
        showToast('Nome e parentesco são obrigatórios', 'warning');
        return;
    }
    
    // Check if this is the main person
    const isMainPerson = relation === 'self';
    
    showLoading('Adicionando membro...');
    try {
        const userId = auth.currentUser.uid;
        const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const memberData = {
            name,
            birthDate: birthDate || null,
            deathDate: deathDate || null,
            relation,
            gender,
            spouseId: spouseId || null,
            fatherId: fatherId || null,
            motherId: motherId || null,
            notes: notes || '',
            isMainPerson,
            photoURL: 'assets/default-avatar.png',
            addedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const memberRef = doc(db, 'users', userId, 'tree', memberId);
        await setDoc(memberRef, memberData);
        
        // Add to calendar if requested
        if (addToCalendar && birthDate) {
            await this.addBirthdayToCalendar(memberData, memberId);
        }
        
        // Update spouse if selected
        if (spouseId) {
            await this.updateSpouse(spouseId, memberId);
        }
        
        // Update children if parents selected
        if (fatherId || motherId) {
            await this.updateParents(fatherId, motherId, memberId);
        }
        
        this.closeModal();
        showToast('Membro adicionado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao adicionar membro:', error);
        showToast('Erro ao adicionar membro', 'error');
    } finally {
        hideLoading();
    }
}

async updateSpouse(spouseId, newSpouseId) {
    if (!auth.currentUser) return;
    
    try {
        const userId = auth.currentUser.uid;
        const spouseRef = doc(db, 'users', userId, 'tree', spouseId);
        await updateDoc(spouseRef, { spouseId: newSpouseId });
    } catch (error) {
        console.error('Erro ao atualizar cônjuge:', error);
    }
}

async updateParents(fatherId, motherId, childId) {
    if (!auth.currentUser) return;
    
    try {
        const userId = auth.currentUser.uid;
        
        // Update father's children
        if (fatherId) {
            const fatherRef = doc(db, 'users', userId, 'tree', fatherId);
            const fatherSnap = await getDoc(fatherRef);
            if (fatherSnap.exists()) {
                const fatherData = fatherSnap.data();
                const children = fatherData.children || [];
                if (!children.includes(childId)) {
                    children.push(childId);
                    await updateDoc(fatherRef, { children });
                }
            }
        }
        
        // Update mother's children
        if (motherId) {
            const motherRef = doc(db, 'users', userId, 'tree', motherId);
            const motherSnap = await getDoc(motherRef);
            if (motherSnap.exists()) {
                const motherData = motherSnap.data();
                const children = motherData.children || [];
                if (!children.includes(childId)) {
                    children.push(childId);
                    await updateDoc(motherRef, { children });
                }
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar pais:', error);
    }
}

async addBirthdayToCalendar(member, memberId) {
    if (!auth.currentUser || !member.birthDate) return;
    
    try {
        const userId = auth.currentUser.uid;
        const eventId = `birthday_${memberId}`;
        const birthday = new Date(member.birthDate);
        
        const eventData = {
            title: `🎂 ${member.name}`,
            description: `Aniversário de ${member.name} (${member.relation})`,
            date: birthday.toISOString(),
            type: 'birthday',
            isRecurring: true,
            isAllDay: true,
            treeMemberId: memberId,
            color: '#FF6B6B',
            createdAt: new Date().toISOString()
        };
        
        const eventRef = doc(db, 'users', userId, 'events', eventId);
        await setDoc(eventRef, eventData);
        
    } catch (error) {
        console.error('Erro ao adicionar aniversário:', error);
    }
}

openEditMemberModal(member) {
    const birthDate = member.birthDate ? member.birthDate.split('T')[0] : '';
    const deathDate = member.deathDate ? member.deathDate.split('T')[0] : '';
    
    const modalContent = `
        <form class="modal-form" id="edit-member-form">
            <div class="modal-form-group">
                <label for="edit-member-name">Nome Completo *</label>
                <input type="text" id="edit-member-name" value="${member.name}" required>
            </div>
            
            <div class="modal-form-row">
                <div class="modal-form-group">
                    <label for="edit-member-birth-date">Data de Nascimento</label>
                    <input type="date" id="edit-member-birth-date" value="${birthDate}">
                </div>
                
                <div class="modal-form-group">
                    <label for="edit-member-death-date">Data de Falecimento</label>
                    <input type="date" id="edit-member-death-date" value="${deathDate}">
                </div>
            </div>
            
            <div class="modal-form-group">
                <label for="edit-member-relation">Parentesco</label>
                <select id="edit-member-relation" ${member.isMainPerson ? 'disabled' : ''}>
                    <option value="self" ${member.relation === 'self' ? 'selected' : ''}>Eu mesmo(a)</option>
                    <option value="spouse" ${member.relation === 'spouse' ? 'selected' : ''}>Cônjuge</option>
                    <option value="father" ${member.relation === 'father' ? 'selected' : ''}>Pai</option>
                    <option value="mother" ${member.relation === 'mother' ? 'selected' : ''}>Mãe</option>
                    <option value="son" ${member.relation === 'son' ? 'selected' : ''}>Filho</option>
                    <option value="daughter" ${member.relation === 'daughter' ? 'selected' : ''}>Filha</option>
                    <option value="brother" ${member.relation === 'brother' ? 'selected' : ''}>Irmão</option>
                    <option value="sister" ${member.relation === 'sister' ? 'selected' : ''}>Irmã</option>
                    <option value="other" ${member.relation === 'other' ? 'selected' : ''}>Outro</option>
                </select>
            </div>
            
            <div class="modal-form-group">
                <label for="edit-member-gender">Gênero</label>
                <select id="edit-member-gender">
                    <option value="" ${!member.gender ? 'selected' : ''}>Não informado</option>
                    <option value="male" ${member.gender === 'male' ? 'selected' : ''}>Masculino</option>
                    <option value="female" ${member.gender === 'female' ? 'selected' : ''}>Feminino</option>
                    <option value="other" ${member.gender === 'other' ? 'selected' : ''}>Outro</option>
                </select>
            </div>
            
            <div class="modal-form-group">
                <label for="edit-member-notes">Observações</label>
                <textarea id="edit-member-notes" rows="3">${member.notes || ''}</textarea>
            </div>
            
            <div class="modal-actions">
                <button type="button" class="btn-secondary close-modal">Cancelar</button>
                <button type="submit" class="btn-primary">Salvar Alterações</button>
                <button type="button" class="btn-danger" id="btn-delete-member">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        </form>
    `;
    
    this.showModal('Editar Membro', modalContent);
    
    document.getElementById('edit-member-form').addEventListener('submit', (e) => {
        e.preventDefault();
        this.updateMember(member.id);
    });
    
    document.getElementById('btn-delete-member').addEventListener('click', () => {
        if (confirm('Excluir este membro da árvore?')) {
            this.deleteMember(member.id);
        }
    });
}

async updateMember(memberId) {
    if (!auth.currentUser) return;
    
    const name = document.getElementById('edit-member-name').value.trim();
    const birthDate = document.getElementById('edit-member-birth-date').value;
    const deathDate = document.getElementById('edit-member-death-date').value;
    const relation = document.getElementById('edit-member-relation').value;
    const gender = document.getElementById('edit-member-gender').value;
    const notes = document.getElementById('edit-member-notes').value.trim();
    
    if (!name) {
        showToast('Nome é obrigatório', 'warning');
        return;
    }
    
    showLoading('Atualizando membro...');
    try {
        const userId = auth.currentUser.uid;
        const memberRef = doc(db, 'users', userId, 'tree', memberId);
        
        const updateData = {
            name,
            birthDate: birthDate || null,
            deathDate: deathDate || null,
            relation,
            gender,
            notes: notes || '',
            updatedAt: new Date().toISOString()
        };
        
        await updateDoc(memberRef, updateData);
        
        this.closeModal();
        showToast('Membro atualizado!', 'success');
        
    } catch (error) {
        console.error('Erro ao atualizar membro:', error);
        showToast('Erro ao atualizar membro', 'error');
    } finally {
        hideLoading();
    }
}

async deleteMember(memberId) {
    if (!auth.currentUser) return;
    
    if (!confirm('Tem certeza? Esta ação não pode ser desfeita.')) return;
    
    showLoading('Excluindo membro...');
    try {
        const userId = auth.currentUser.uid;
        const memberRef = doc(db, 'users', userId, 'tree', memberId);
        await deleteDoc(memberRef);
        
        // Remove from calendar
        await this.removeBirthdayFromCalendar(memberId);
        
        this.closeModal();
        showToast('Membro excluído!', 'success');
        
    } catch (error) {
        console.error('Erro ao excluir membro:', error);
        showToast('Erro ao excluir membro', 'error');
    } finally {
        hideLoading();
    }
}

async removeBirthdayFromCalendar(memberId) {
    if (!auth.currentUser) return;
    
    try {
        const userId = auth.currentUser.uid;
        const eventId = `birthday_${memberId}`;
        const eventRef = doc(db, 'users', userId, 'events', eventId);
        await deleteDoc(eventRef);
    } catch (error) {
        console.error('Erro ao remover aniversário:', error);
    }
}

openMemberDetails(member) {
    const age = member.birthDate ? calculateAge(member.birthDate) : null;
    const ageText = age ? ` (${age} anos)` : '';
    
    // Find spouse
    const spouse = member.spouseId ? 
        this.members.find(m => m.id === member.spouseId) : null;
    
    // Find parents
    const father = member.fatherId ? 
        this.members.find(m => m.id === member.fatherId) : null;
    const mother = member.motherId ? 
        this.members.find(m => m.id === member.motherId) : null;
    
    // Find children
    const children = this.members.filter(m => 
        m.fatherId === member.id || m.motherId === member.id
    );
    
    const modalContent = `
        <div class="member-details-modal">
            <div class="member-detail-header">
                <img src="${member.photoURL || 'assets/default-avatar.png'}" 
                     alt="${member.name}"
                     class="member-detail-avatar">
                <div class="member-detail-info">
                    <h3>${member.name}</h3>
                    <p class="member-detail-relation">${this.getRelationLabel(member.relation)}</p>
                    ${member.isMainPerson ? '<span class="badge main-badge">Principal</span>' : ''}
                </div>
            </div>
            
            <div class="member-detail-sections">
                <div class="detail-section">
                    <h4><i class="fas fa-info-circle"></i> Informações</h4>
                    ${member.birthDate ? `
                        <p><strong>Nascimento:</strong> ${formatDate(member.birthDate, 'dd/mm/yyyy')}${ageText}</p>
                    ` : ''}
                    ${member.deathDate ? `
                        <p><strong>Falecimento:</strong> ${formatDate(member.deathDate, 'dd/mm/yyyy')}</p>
                    ` : ''}
                    ${member.gender ? `
                        <p><strong>Gênero:</strong> ${this.getGenderLabel(member.gender)}</p>
                    ` : ''}
                    ${member.notes ? `<p><strong>Observações:</strong><br>${member.notes}</p>` : ''}
                </div>
                
                ${spouse || father || mother || children.length > 0 ? `
                    <div class="detail-section">
                        <h4><i class="fas fa-users"></i> Familiares</h4>
                        ${spouse ? `<p><strong>Cônjuge:</strong> ${spouse.name}</p>` : ''}
                        ${father ? `<p><strong>Pai:</strong> ${father.name}</p>` : ''}
                        ${mother ? `<p><strong>Mãe:</strong> ${mother.name}</p>` : ''}
                        ${children.length > 0 ? `
                            <p><strong>Filhos:</strong></p>
                            <ul class="children-list">
                                ${children.map(child => `<li>${child.name}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </div>
                ` : ''}
            </div>
            
            <div class="modal-actions">
                <button type="button" class="btn-secondary close-modal">Fechar</button>
                <button type="button" class="btn-primary" id="btn-edit-member-details">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </div>
        </div>
    `;
    
    this.showModal('Detalhes do Membro', modalContent);
    
    document.getElementById('btn-edit-member-details')?.addEventListener('click', () => {
        this.closeModal();
        this.openEditMemberModal(member);
    });
}

getRelationLabel(relation) {
    const labels = {
        'self': 'Eu mesmo(a)',
        'spouse': 'Cônjuge',
        'father': 'Pai',
        'mother': 'Mãe',
        'son': 'Filho',
        'daughter': 'Filha',
        'brother': 'Irmão',
        'sister': 'Irmã',
        'grandfather': 'Avô',
        'grandmother': 'Avó',
        'grandson': 'Neto',
        'granddaughter': 'Neta',
        'uncle': 'Tio',
        'aunt': 'Tia',
        'cousin': 'Primo(a)',
        'other': 'Outro'
    };
    return labels[relation] || relation;
}

getGenderLabel(gender) {
    const labels = {
        'male': 'Masculino',
        'female': 'Feminino',
        'other': 'Outro'
    };
    return labels[gender] || gender;
}

renderTreeView() {
    const container = document.getElementById('tree-canvas');
    if (!container) return;
    
    if (this.members.length === 0) {
        container.innerHTML = `
            <div class="tree-empty">
                <i class="fas fa-tree fa-3x"></i>
                <h3>Sua árvore genealógica</h3>
                <p>Adicione membros para visualizar sua árvore</p>
                <button class="btn-primary" id="btn-add-first-tree-member">
                    <i class="fas fa-user-plus"></i> Adicionar Primeiro Membro
                </button>
            </div>
        `;
        
        document.getElementById('btn-add-first-tree-member')?.addEventListener('click', () => {
            this.openAddMemberModal();
        });
        return;
    }
    
    // Simple tree visualization (you can enhance this with a proper tree library)
    container.innerHTML = `
        <div class="tree-visualization">
            <div class="tree-nodes">
                ${this.generateTreeNodes()}
            </div>
            <div class="tree-legend">
                <h4>Legenda:</h4>
                <p><span class="legend-color self"></span> Eu</p>
                <p><span class="legend-color male"></span> Masculino</p>
                <p><span class="legend-color female"></span> Feminino</p>
                <p><span class="legend-color other"></span> Outro</p>
            </div>
        </div>
    `;
}

    generateTreeNodes() {
        // Find main person
        const mainPerson = this.members.find(m => m.isMainPerson) || this.members[0];
        if (!mainPerson) return '';
        
        let html = '';
        
        // Generate tree starting from main person
        html += this.generatePersonNode(mainPerson, 'main');
        
        // Add spouse if exists
        if (mainPerson.spouseId) {
            const spouse = this.members.find(m => m.id === mainPerson.spouseId);
            if (spouse) {
                html += this.generatePersonNode(spouse, 'spouse');
            }
        }
        
        // Add parents
        const father = mainPerson.fatherId ? 
            this.members.find(m => m.id === mainPerson.fatherId) : null;
        const mother = mainPerson.motherId ? 
            this.members.find(m => m.id === mainPerson.motherId) : null;
        
        if (father || mother) {
            html += '<div class="parents-row">';
            if (father) html += this.generatePersonNode(father, 'parent');
            if (mother) html += this.generatePersonNode(mother, 'parent');
            html += '</div>';
        }
        
        // Add children
        const children = this.members.filter(m => 
            m.fatherId === mainPerson.id || m.motherId === mainPerson.id
        );
        
        if (children.length > 0) {
            html += '<div class="children-row">';
            children.forEach(child => {
                html += this.generatePersonNode(child, 'child');
            });
            html += '</div>';
        }
        
        return html;
    }
    
    generatePersonNode(person, type) {
        const age = person.birthDate ? calculateAge(person.birthDate) : null;
        const ageText = age ? `, ${age} anos` : '';
        const isDeceased = !!person.deathDate;
        
        const nodeClass = `tree-node ${type} ${person.gender || ''} ${isDeceased ? 'deceased' : ''}`;
        
        return `
            <div class="${nodeClass}" data-member-id="${person.id}">
                <div class="tree-node-content">
                    <img src="${person.photoURL || 'assets/default-avatar.png'}" 
                         alt="${person.name}"
                         class="tree-node-avatar">
                    <div class="tree-node-info">
                        <div class="tree-node-name">${person.name}</div>
                        <div class="tree-node-details">
                            <div>${this.getRelationLabel(person.relation)}</div>
                            ${person.birthDate ? 
                                `<div>${formatDate(person.birthDate, 'dd/mm/yyyy')}${ageText}</div>` : 
                                ''}
                        </div>
                    </div>
                </div>
                ${isDeceased ? '<div class="deceased-badge">✝</div>' : ''}
            </div>
        `;
    }
    
    centerOnMember(memberId) {
        const memberNode = document.querySelector(`.tree-node[data-member-id="${memberId}"]`);
        if (memberNode && memberNode.scrollIntoView) {
            memberNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Highlight temporarily
            memberNode.classList.add('highlighted');
            setTimeout(() => {
                memberNode.classList.remove('highlighted');
            }, 2000);
        }
    }
    
    async exportTree() {
        if (this.members.length === 0) {
            showToast('Nenhum membro para exportar', 'info');
            return;
        }
        
        showLoading('Gerando exportação...');
        
        try {
            // Generate PDF/Image content
            const exportContent = this.generateExportContent();
            
            // For now, just show a message
            // In a real implementation, you would use a PDF library
            setTimeout(() => {
                hideLoading();
                showToast('Exportação em desenvolvimento', 'info');
                
                // Show preview
                this.showExportPreview(exportContent);
            }, 1000);
            
        } catch (error) {
            console.error('Erro ao exportar árvore:', error);
            showToast('Erro ao exportar árvore', 'error');
            hideLoading();
        }
    }
    
    generateExportContent() {
        const mainPerson = this.members.find(m => m.isMainPerson) || this.members[0];
        
        let content = `ÁRVORE GENEALÓGICA - ${mainPerson?.name || 'Família'}\n`;
        content += `Gerado em: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
        
        content += "MEMBROS:\n";
        content += "=".repeat(50) + "\n";
        
        this.members.forEach((member, index) => {
            const age = member.birthDate ? calculateAge(member.birthDate) : null;
            const ageText = age ? ` (${age} anos)` : '';
            
            content += `${index + 1}. ${member.name}\n`;
            content += `   Parentesco: ${this.getRelationLabel(member.relation)}\n`;
            if (member.birthDate) {
                content += `   Nascimento: ${formatDate(member.birthDate, 'dd/mm/yyyy')}${ageText}\n`;
            }
            if (member.deathDate) {
                content += `   Falecimento: ${formatDate(member.deathDate, 'dd/mm/yyyy')}\n`;
            }
            if (member.notes) {
                content += `   Observações: ${member.notes}\n`;
            }
            content += "\n";
        });
        
        return content;
    }
    
    showExportPreview(content) {
        const modalContent = `
            <div class="export-preview">
                <h4><i class="fas fa-file-export"></i> Prévia da Exportação</h4>
                <div class="preview-content">
                    <pre>${content}</pre>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn-secondary close-modal">Fechar</button>
                    <button type="button" class="btn-primary" id="btn-copy-export">
                        <i class="fas fa-copy"></i> Copiar
                    </button>
                    <button type="button" class="btn-primary" id="btn-download-export">
                        <i class="fas fa-download"></i> Baixar como TXT
                    </button>
                </div>
            </div>
        `;
        
        this.showModal('Exportar Árvore', modalContent);
        
        document.getElementById('btn-copy-export')?.addEventListener('click', () => {
            navigator.clipboard.writeText(content)
                .then(() => showToast('Copiado para a área de transferência!', 'success'))
                .catch(() => showToast('Erro ao copiar', 'error'));
        });
        
        document.getElementById('btn-download-export')?.addEventListener('click', () => {
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `arvore_genealogica_${new Date().toISOString().split('T')[0]}.txt`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('Download iniciado!', 'success');
        });
    }
    
    showModal(title, content) {
        const modal = document.getElementById('modal-contact') || 
                      document.getElementById('modal-event') ||
                      document.createElement('div');
        
        if (!modal.id) {
            modal.id = 'tree-modal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div class="modal-header">
                <h2><i class="fas fa-tree"></i> ${title}</h2>
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
    const treeSystem = new TreeSystem();
    window.treeSystem = treeSystem;
    console.log('Sistema de árvore genealógica inicializado!');
});

export default TreeSystem;