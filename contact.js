[span_0](start_span)//[span_0](end_span) - Sistema de Contatos do CronoZ Otimizado
console.log('📇 Sistema de Contatos carregado');

[span_1](start_span)let contatosCarregados = [];[span_1](end_span)
[span_2](start_span)let filtroAtivo = 'todos';[span_2](end_span)

// Função para criar a interface (Bandeja Flutuante)
function criarTelaContatos() {
    return `
    <div class="page-content tray-container">
        <div class="contacts-header">
            <h2><i class="fas fa-users"></i> Meus Contatos</h2>
            <div class="contacts-actions">
                <button onclick="importarContatosCelular()" class="btn-cronoz">
                    <i class="fas fa-mobile-alt"></i> Importar
                </button>
                <button onclick="mostrarModalNovoContato()" class="btn-cronoz success">
                    <i class="fas fa-plus"></i> Novo
                </button>
            </div>
        [span_3](start_span)</div>[span_3](end_span)
        
        <div class="search-container">
            <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" id="search-contacts" placeholder="Buscar..." oninput="filtrarContatos()">
            [span_4](start_span)</div>[span_4](end_span)
            
            <div class="filters-row">
                <select id="filter-category" onchange="filtrarPorCategoria()" class="filter-select">
                    <option value="todos">📁 Todos</option>
                    <option value="favoritos">⭐ Favoritos</option>
                    <option value="familia">👨‍👩‍👧‍👦 Família</option>
                    <option value="amigos">👥 Amigos</option>
                [span_5](start_span)</select>[span_5](end_span)
                
                <select id="filter-sort" onchange="ordenarContatos()" class="filter-select">
                    <option value="nome-a-z">A → Z</option>
                    <option value="aniversario">🎂 Aniversário</option>
                [span_6](start_span)</select>[span_6](end_span)
            </div>
        [span_7](start_span)</div>[span_7](end_span)
        
        <div id="contacts-list" class="contacts-list tray-content">
            [span_8](start_span)</div>[span_8](end_span)
        
        <div class="contacts-stats">
            <span id="stats-total">0 contatos</span>
            <span id="stats-aniversarios">0 este mês</span>
        [span_9](start_span)</div>[span_9](end_span)
    </div>

    <div id="modal-novo-contato" class="modal-overlay" style="display:none;">
        <div class="modal-content tray-style">
            <div class="modal-header">
                <h3>Novo Contato</h3>
                <button onclick="fecharModal('modal-novo-contato')" class="btn-close">×</button>
            </div>
            <div class="modal-body">
                <input type="text" id="novo-nome" placeholder="Nome Completo *" required>
                <input type="text" id="novo-apelido" placeholder="Apelido">
                <input type="date" id="novo-nascimento">
                <select id="novo-parentesco">
                    <option value="amigos">Amigos</option>
                    <option value="familia">Família</option>
                    <option value="trabalho">Trabalho</option>
                    <option value="outros">Outros</option>
                </select>
                <input type="tel" id="novo-telefone" placeholder="Telefone">
                <div class="form-check">
                    <input type="checkbox" id="novo-favorito"> <label>Favorito ⭐</label>
                </div>
                <div class="form-check">
                    <input type="checkbox" id="novo-is-me"> <label>Este contato sou eu (Perfil) 👤</label>
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="salvarNovoContato()" class="btn-save">Salvar</button>
            </div>
        </div>
    </div>
    [span_10](start_span)[span_11](start_span)`;[span_10](end_span)[span_11](end_span)
}

// ======================
// LOGICA DE DADOS
// ======================

async function carregarContatos() {
    const user = auth.currentUser;
    [span_12](start_span)if (!user) return;[span_12](end_span)

    try {
        const { collection, getDocs, query, orderBy } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js");
        const contatosRef = collection(db, 'usuarios', user.uid, 'contatos');
        [span_13](start_span)const snapshot = await getDocs(contatosRef);[span_13](end_span)
        
        [span_14](start_span)contatosCarregados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));[span_14](end_span)
        renderizarContatos();
        [span_15](start_span)atualizarEstatisticas();[span_15](end_span)
    } catch (e) {
        console.error("Erro:", e);
    }
}

function renderizarContatos(contatos = contatosCarregados) {
    const container = document.getElementById('contacts-list');
    [span_16](start_span)if (!container) return;[span_16](end_span)

    if (contatos.length === 0) {
        [span_17](start_span)[span_18](start_span)container.innerHTML = `<div class="empty-state">Nenhum contato encontrado.</div>`;[span_17](end_span)[span_18](end_span)
        return;
    }

    container.innerHTML = contatos.map(c => {
        const diasParaNiver = c.dataNascimento ? calcularDiasParaAniversario(c.dataNascimento.toDate ? c.dataNascimento.toDate() : new Date(c.dataNascimento)) : 365;
        return `
        <div class="contact-card ${c.isMe ? 'is-me-card' : ''}" onclick="abrirDetalhesContato('${c.id}')">
            <div class="contact-avatar">
                ${obterIniciais(c.nome)}
                ${diasParaNiver <= 30 ? `<span class="niver-tag">🎂</span>` : ''}
            </div>
            <div class="contact-info">
                <h4>${c.nome} ${c.isMe ? '(Eu)' : ''}</h4>
                <p>${c.telefone || 'Sem fone'}</p>
            </div>
            <button onclick="event.stopPropagation(); toggleFavorito('${c.id}')" class="fav-btn">
                ${c.favorito ? '⭐' : '☆'}
            </button>
        </div>`;
    [span_19](start_span)[span_20](start_span)}).join('');[span_19](end_span)[span_20](end_span)
}
