// contacts.js - Sistema de Contatos do CronoZ
console.log('📇 Sistema de Contatos carregado');

// ======================
// VARIÁVEIS GLOBAIS
// ======================
let contatosCarregados = [];
let filtroAtivo = 'todos';

// ======================
// TELA DE CONTATOS
// ======================
function criarTelaContatos() {
    return `
    <div class="page-content">
        <div class="contacts-header">
            <h2><i class="fas fa-users"></i> Meus Contatos</h2>
            <div class="contacts-actions">
                <button onclick="importarContatosCelular()" class="btn btn-primary btn-sm">
                    <i class="fas fa-mobile-alt"></i> Importar do Celular
                </button>
                <button onclick="mostrarModalNovoContato()" class="btn btn-success btn-sm">
                    <i class="fas fa-plus"></i> Novo Contato
                </button>
            </div>
        </div>
        
        <!-- Barra de Busca -->
        <div class="search-container">
            <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" id="search-contacts" placeholder="Buscar contato..." 
                       oninput="filtrarContatos()">
            </div>
            
            <select id="filter-category" onchange="filtrarPorCategoria()" class="filter-select">
                <option value="todos">📁 Todos</option>
                <option value="favoritos">⭐ Favoritos</option>
                <option value="familia">👨‍👩‍👧‍👦 Família</option>
                <option value="amigos">👥 Amigos</option>
                <option value="trabalho">💼 Trabalho</option>
                <option value="outros">🔷 Outros</option>
            </select>
            
            <select id="filter-sort" onchange="ordenarContatos()" class="filter-select">
                <option value="nome-a-z">A → Z</option>
                <option value="nome-z-a">Z → A</option>
                <option value="data-recente">➕ Mais recente</option>
                <option value="data-antiga">➖ Mais antigo</option>
                <option value="aniversario">🎂 Aniversário</option>
            </select>
        </div>
        
        <!-- Lista de Contatos -->
        <div id="contacts-list" class="contacts-list">
            <div class="loading-contacts">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Carregando contatos...</p>
            </div>
        </div>
        
        <!-- Estatísticas -->
        <div class="contacts-stats">
            <span id="stats-total">0 contatos</span>
            <span id="stats-favoritos">0 favoritos</span>
            <span id="stats-aniversarios">0 aniversários este mês</span>
        </div>
    </div>
    
    <!-- Modal Novo Contato -->
    <div id="modal-novo-contato" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-user-plus"></i> Novo Contato</h3>
                <button onclick="fecharModal('modal-novo-contato')" class="btn-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="modal-body">
                <div class="form-group">
                    <label>Nome Completo *</label>
                    <input type="text" id="novo-nome" placeholder="Nome do contato" required>
                </div>
                
                <div class="form-group">
                    <label>Apelido</label>
                    <input type="text" id="novo-apelido" placeholder="Como chama?">
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Data de Nascimento</label>
                        <input type="date" id="novo-nascimento">
                    </div>
                    
                    <div class="form-group">
                        <label>Parentesco</label>
                        <select id="novo-parentesco">
                            <option value="outros">Outros</option>
                            <option value="familia">Família</option>
                            <option value="amigos">Amigos</option>
                            <option value="trabalho">Trabalho</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Telefone</label>
                    <input type="tel" id="novo-telefone" placeholder="(11) 99999-9999">
                </div>
                
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="novo-email" placeholder="contato@email.com">
                </div>
                
                <div class="form-group">
                    <label>Observações</label>
                    <textarea id="novo-observacoes" placeholder="Notas sobre este contato..." rows="3"></textarea>
                </div>
                
                <div class="form-check">
                    <input type="checkbox" id="novo-favorito">
                    <label for="novo-favorito">⭐ Marcar como favorito</label>
                </div>
                
                <div class="form-check">
                    <input type="checkbox" id="novo-aniversario-calendario">
                    <label for="novo-aniversario-calendario">📅 Adicionar aniversário ao meu calendário</label>
                </div>
            </div>
            
            <div class="modal-footer">
                <button onclick="fecharModal('modal-novo-contato')" class="btn btn-secondary">
                    Cancelar
                </button>
                <button onclick="salvarNovoContato()" class="btn btn-primary">
                    <i class="fas fa-save"></i> Salvar Contato
                </button>
            </div>
        </div>
    </div>
    
    <!-- Modal Editar Contato -->
    <div id="modal-editar-contato" class="modal">
        <div class="modal-content">
            <!-- Similar ao novo, mas para edição -->
        </div>
    </div>
    `;
}

// ======================
// FUNÇÕES PRINCIPAIS
// ======================

// Carregar contatos do Firestore
async function carregarContatos() {
    try {
        const user = auth.currentUser;
        if (!user) return;
        
        const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js");
        const contatosRef = collection(db, 'usuarios', user.uid, 'contatos');
        const snapshot = await getDocs(contatosRef);
        
        contatosCarregados = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            contatosCarregados.push(data);
        });
        
        console.log(`📇 ${contatosCarregados.length} contatos carregados`);
        renderizarContatos();
        atualizarEstatisticas();
        
    } catch (error) {
        console.error('Erro ao carregar contatos:', error);
        mostrarNotificacao('❌ Erro ao carregar contatos');
    }
}

// Renderizar lista de contatos
function renderizarContatos(contatos = contatosCarregados) {
    const container = document.getElementById('contacts-list');
    if (!container) return;
    
    if (contatos.length === 0) {
        container.innerHTML = `
            <div class="empty-contacts">
                <i class="fas fa-user-friends"></i>
                <h3>Nenhum contato ainda</h3>
                <p>Adicione seus primeiros contatos!</p>
                <button onclick="importarContatosCelular()" class="btn btn-primary">
                    <i class="fas fa-mobile-alt"></i> Importar do Celular
                </button>
                <button onclick="mostrarModalNovoContato()" class="btn btn-success">
                    <i class="fas fa-plus"></i> Adicionar Manualmente
                </button>
            </div>
        `;
        return;
    }
    
    let html = '<div class="contacts-grid">';
    
    contatos.forEach(contato => {
        const hoje = new Date();
        const aniversario = contato.dataNascimento ? contato.dataNascimento.toDate() : null;
        const proxAniversario = calcularProximoAniversario(aniversario);
        const diasParaAniversario = calcularDiasParaAniversario(aniversario);
        
        html += `
        <div class="contact-card ${contato.favorito ? 'favorito' : ''}" 
             onclick="abrirDetalhesContato('${contato.id}')">
            <div class="contact-avatar">
                ${contato.favorito ? '<span class="favorite-badge">⭐</span>' : ''}
                <div class="avatar-inicials">
                    ${obterIniciais(contato.nome)}
                </div>
                ${diasParaAniversario <= 30 ? `<span class="birthday-badge">🎂 ${diasParaAniversario}d</span>` : ''}
            </div>
            
            <div class="contact-info">
                <h4>${contato.nome}</h4>
                ${contato.apelido ? `<p class="contact-nickname">"${contato.apelido}"</p>` : ''}
                <p class="contact-details">
                    <span class="contact-relationship ${contato.parentesco || 'outros'}">
                        ${obterIconeParentesco(contato.parentesco)} ${contato.parentesco || 'Contato'}
                    </span>
                    ${contato.telefone ? `<br><i class="fas fa-phone"></i> ${contato.telefone}` : ''}
                </p>
            </div>
            
            <div class="contact-actions">
                <button onclick="event.stopPropagation(); toggleFavorito('${contato.id}')" 
                        class="btn-icon ${contato.favorito ? 'active' : ''}">
                    <i class="fas fa-star"></i>
                </button>
                <button onclick="event.stopPropagation(); editarContato('${contato.id}')" 
                        class="btn-icon">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Importar contatos do celular (Web Contacts API)
async function importarContatosCelular() {
    try {
        // Verificar se a API está disponível
        if (!('contacts' in navigator && 'ContactsManager' in window)) {
            mostrarNotificacao('📱 API de Contatos não disponível neste navegador');
            return;
        }
        
        // Pedir permissão
        const permissoes = await navigator.permissions.query({ name: 'contacts' });
        if (permissoes.state !== 'granted') {
            const permissao = await navigator.contacts.requestPermission();
            if (permissao !== 'granted') {
                mostrarNotificacao('❌ Permissão para contatos negada');
                return;
            }
        }
        
        // Buscar contatos
        const props = ['name', 'tel', 'email', 'birthday'];
        const opts = { multiple: true };
        
        const contatos = await navigator.contacts.select(props, opts);
        
        if (contatos.length === 0) {
            mostrarNotificacao('📇 Nenhum contato selecionado');
            return;
        }
        
        mostrarNotificacao(`📥 Importando ${contatos.length} contatos...`);
        
        // Processar cada contato
        for (const contato of contatos) {
            await salvarContatoImportado(contato);
        }
        
        mostrarNotificacao(`✅ ${contatos.length} contatos importados!`);
        carregarContatos(); // Recarregar lista
        
    } catch (error) {
        console.error('Erro ao importar contatos:', error);
        mostrarNotificacao('❌ Erro ao importar contatos');
    }
}

// Salvar contato importado no Firestore
async function salvarContatoImportado(contato) {
    try {
        const user = auth.currentUser;
        if (!user) return;
        
        const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js");
        
        const dados = {
            nome: contato.name?.[0] || 'Contato sem nome',
            telefone: contato.tel?.[0] || '',
            email: contato.email?.[0] || '',
            dataNascimento: contato.birthday?.[0] ? new Date(contato.birthday[0]) : null,
            parentesco: 'importado',
            favorito: false,
            importado: true,
            dataImportacao: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const contatosRef = collection(db, 'usuarios', user.uid, 'contatos');
        await addDoc(contatosRef, dados);
        
    } catch (error) {
        console.error('Erro ao salvar contato importado:', error);
    }
}

// Adicionar novo contato manualmente
async function salvarNovoContato() {
    try {
        const user = auth.currentUser;
        if (!user) return;
        
        const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js");
        
        const dados = {
            nome: document.getElementById('novo-nome').value.trim(),
            apelido: document.getElementById('novo-apelido').value.trim(),
            dataNascimento: document.getElementById('novo-nascimento').value ? 
                new Date(document.getElementById('novo-nascimento').value) : null,
            parentesco: document.getElementById('novo-parentesco').value,
            telefone: document.getElementById('novo-telefone').value.trim(),
            email: document.getElementById('novo-email').value.trim(),
            observacoes: document.getElementById('novo-observacoes').value.trim(),
            favorito: document.getElementById('novo-favorito').checked,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        if (!dados.nome) {
            mostrarNotificacao('❌ O nome é obrigatório');
            return;
        }
        
        const contatosRef = collection(db, 'usuarios', user.uid, 'contatos');
        await addDoc(contatosRef, dados);
        
        fecharModal('modal-novo-contato');
        limparFormularioNovoContato();
        mostrarNotificacao('✅ Contato salvo com sucesso!');
        
        carregarContatos(); // Recarregar lista
        
        // Adicionar ao calendário se marcado
        if (document.getElementById('novo-aniversario-calendario').checked && dados.dataNascimento) {
            await adicionarAniversarioCalendario(dados);
        }
        
    } catch (error) {
        console.error('Erro ao salvar contato:', error);
        mostrarNotificacao('❌ Erro ao salvar contato');
    }
}

// ======================
// FUNÇÕES AUXILIARES
// ======================

function mostrarModalNovoContato() {
    document.getElementById('modal-novo-contato').style.display = 'block';
}

function fecharModal(id) {
    document.getElementById(id).style.display = 'none';
}

function limparFormularioNovoContato() {
    document.getElementById('novo-nome').value = '';
    document.getElementById('novo-apelido').value = '';
    document.getElementById('novo-nascimento').value = '';
    document.getElementById('novo-telefone').value = '';
    document.getElementById('novo-email').value = '';
    document.getElementById('novo-observacoes').value = '';
    document.getElementById('novo-favorito').checked = false;
    document.getElementById('novo-aniversario-calendario').checked = false;
}

function filtrarContatos() {
    const termo = document.getElementById('search-contacts').value.toLowerCase();
    const filtrados = contatosCarregados.filter(contato => 
        contato.nome.toLowerCase().includes(termo) ||
        (contato.apelido && contato.apelido.toLowerCase().includes(termo)) ||
        (contato.telefone && contato.telefone.includes(termo))
    );
    renderizarContatos(filtrados);
}

function filtrarPorCategoria() {
    const categoria = document.getElementById('filter-category').value;
    filtroAtivo = categoria;
    
    let filtrados = contatosCarregados;
    
    if (categoria === 'favoritos') {
        filtrados = contatosCarregados.filter(c => c.favorito);
    } else if (categoria !== 'todos') {
        filtrados = contatosCarregados.filter(c => c.parentesco === categoria);
    }
    
    renderizarContatos(filtrados);
}

function ordenarContatos() {
    const ordem = document.getElementById('filter-sort').value;
    let ordenados = [...contatosCarregados];
    
    switch (ordem) {
        case 'nome-a-z':
            ordenados.sort((a, b) => a.nome.localeCompare(b.nome));
            break;
        case 'nome-z-a':
            ordenados.sort((a, b) => b.nome.localeCompare(a.nome));
            break;
        case 'data-recente':
            ordenados.sort((a, b) => b.createdAt - a.createdAt);
            break;
        case 'data-antiga':
            ordenados.sort((a, b) => a.createdAt - b.createdAt);
            break;
        case 'aniversario':
            ordenados.sort((a, b) => {
                const diasA = a.dataNascimento ? calcularDiasParaAniversario(a.dataNascimento.toDate()) : 365;
                const diasB = b.dataNascimento ? calcularDiasParaAniversario(b.dataNascimento.toDate()) : 365;
                return diasA - diasB;
            });
            break;
    }
    
    renderizarContatos(ordenados);
}

function atualizarEstatisticas() {
    const total = contatosCarregados.length;
    const favoritos = contatosCarregados.filter(c => c.favorito).length;
    
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const aniversariosMes = contatosCarregados.filter(c => {
        if (!c.dataNascimento) return false;
        const nascimento = c.dataNascimento.toDate();
        return nascimento.getMonth() === mesAtual;
    }).length;
    
    document.getElementById('stats-total').textContent = `${total} contatos`;
    document.getElementById('stats-favoritos').textContent = `${favoritos} favoritos`;
    document.getElementById('stats-aniversarios').textContent = `${aniversariosMes} aniversários este mês`;
}

function obterIniciais(nome) {
    return nome.split(' ')
        .map(palavra => palavra[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

function obterIconeParentesco(parentesco) {
    const icones = {
        'familia': '👨‍👩‍👧‍👦',
        'amigos': '👥',
        'trabalho': '💼',
        'outros': '🔷'
    };
    return icones[parentesco] || '👤';
}

function calcularDiasParaAniversario(dataNascimento) {
    if (!dataNascimento) return 365;
    
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    
    const proximoAniversario = new Date(dataNascimento);
    proximoAniversario.setFullYear(anoAtual);
    
    // Se já passou este ano, calcular para o próximo ano
    if (proximoAniversario < hoje) {
        proximoAniversario.setFullYear(anoAtual + 1);
    }
    
    const diffMs = proximoAniversario - hoje;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

async function toggleFavorito(contatoId) {
    try {
        const user = auth.currentUser;
        if (!user) return;
        
        const { doc, updateDoc, getDoc } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js");
        
        const contatoRef = doc(db, 'usuarios', user.uid, 'contatos', contatoId);
        const contatoDoc = await getDoc(contatoRef);
        
        if (contatoDoc.exists()) {
            const atual = contatoDoc.data().favorito || false;
            await updateDoc(contatoRef, { 
                favorito: !atual,
                updatedAt: new Date()
            });
            
            mostrarNotificacao(atual ? '⭐ Removido dos favoritos' : '⭐ Adicionado aos favoritos');
            carregarContatos(); // Recarregar
        }
        
    } catch (error) {
        console.error('Erro ao favoritar:', error);}
   
// ======================
// FUNÇÕES ADICIONAIS (FALTANTES)
// ======================

function calcularProximoAniversario(dataNascimento) {
    if (!dataNascimento) return null;
    
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    
    const proximo = new Date(dataNascimento);
    proximo.setFullYear(anoAtual);
    
    if (proximo < hoje) {
        proximo.setFullYear(anoAtual + 1);
    }
    
    return proximo;
}

function abrirDetalhesContato(contatoId) {
    const contato = contatosCarregados.find(c => c.id === contatoId);
    if (!contato) return;
    
    alert(`Detalhes de ${contato.nome}\n\n` +
          `📞 Telefone: ${contato.telefone || 'Não informado'}\n` +
          `📧 Email: ${contato.email || 'Não informado'}\n` +
          `🎂 Aniversário: ${contato.dataNascimento ? contato.dataNascimento.toDate().toLocaleDateString('pt-BR') : 'Não informado'}\n` +
          `📝 Observações: ${contato.observacoes || 'Nenhuma'}`);
}

function editarContato(contatoId) {
    mostrarNotificacao('✏️ Edição de contato em breve!');
    // Implementação futura
}

async function adicionarAniversarioCalendario(dadosContato) {
    try {
        const user = auth.currentUser;
        if (!user) return;
        
        const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js");
        
        const evento = {
            tipo: 'aniversario',
            titulo: `🎂 ${dadosContato.nome}`,
            descricao: `Aniversário de ${dadosContato.nome}`,
            data: dadosContato.dataNascimento,
            cor: '#FF4081',
            criadoEm: new Date()
        };
        
        // Salvar no calendário do usuário
        const calendarioRef = collection(db, 'usuarios', user.uid, 'eventos');
        await addDoc(calendarioRef, evento);
        
        mostrarNotificacao('🎂 Aniversário adicionado ao calendário!');
        
    } catch (error) {
        console.error('Erro ao adicionar aniversário:', error);
    }
}

// ======================
// COMPLETAR FUNÇÃO toggleFavorito (QUE ESTÁ CORTADA)
// ======================

// ⭐⭐ ADICIONE ESTE FIM DA FUNÇÃO ⭐⭐
} // <-- Este fecha a função toggleFavorito

// ======================
// EXPORTAR FUNÇÕES PARA USO GLOBAL
// ======================

window.criarTelaContatos = criarTelaContatos;
window.carregarContatos = carregarContatos;
window.importarContatosCelular = importarContatosCelular;
window.mostrarModalNovoContato = mostrarModalNovoContato;
window.fecharModal = fecharModal;
window.salvarNovoContato = salvarNovoContato;
window.filtrarContatos = filtrarContatos;
window.filtrarPorCategoria = filtrarPorCategoria;
window.ordenarContatos = ordenarContatos;
window.toggleFavorito = toggleFavorito;

console.log('✅ Sistema de Contatos pronto para uso');
