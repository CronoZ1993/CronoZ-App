// script.js - CronoZ COMPLETO com Perfil, Temas e Backup
console.log('📱 CronoZ iniciando...');

let auth, db, storage;

// ======================
// INTEGRAÇÃO COM CONTATOS
// ======================

// Adicionar esta linha na função carregarPagina()
// Substitua o conteúdo da página 'contacts':
if (pagina === 'contacts') {
    conteudo.innerHTML = criarTelaContatos();
    setTimeout(() => {
        if (typeof carregarContatos === 'function') {
            carregarContatos();
        }
    }, 100);
}

// Adicionar esta linha na função configurarNavegacao()
// (logo após configurar os botões do footer)
document.addEventListener('DOMContentLoaded', function() {
    // Carregar script de contatos dinamicamente
    if (document.querySelector('[data-page="contacts"]')) {
        const script = document.createElement('script');
        script.src = 'contacts.js';
        script.onload = () => console.log('✅ Sistema de Contatos carregado');
        document.head.appendChild(script);
    }
});

// Verificar quando Firebase carrega
setTimeout(() => {
    if (window.auth && window.db && window.storage) {
        console.log('✅ Firebase pronto');
        auth = window.auth;
        db = window.db;
        storage = window.storage;
        iniciarApp();
    } else {
        console.error('❌ Firebase falhou');
        mostrarErro();
    }
}, 1500);

async function iniciarApp() {
    console.log('🎯 Configurando app...');
    
    // Verificar se já está logado
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log('Usuário já logado:', user.email);
            mostrarApp(user);
        } else {
            configurarLogin();
        }
    });
    
    configurarNavegacao();
}

function configurarLogin() {
    // BOTÃO ENTRAR
    const btnEntrar = document.getElementById('login-btn');
    if (btnEntrar) {
        btnEntrar.onclick = async () => {
            const email = document.getElementById('email')?.value?.trim() || 'teste@cronoz.com';
            const senha = document.getElementById('password')?.value || '123456';
            
            try {
                btnEntrar.innerHTML = '⏳ Entrando...';
                btnEntrar.disabled = true;
                
                const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js");
                const userCred = await signInWithEmailAndPassword(auth, email, senha);
                
                console.log('✅ Logado:', userCred.user.email);
                
                // Criar estrutura se for novo usuário
                await criarEstruturaUsuario(userCred.user);
                mostrarApp(userCred.user);
                
            } catch (erro) {
                console.error('❌ Erro login:', erro.code);
                
                if (erro.code === 'auth/user-not-found') {
                    const criar = confirm('Conta não existe. Criar nova conta?');
                    if (criar) {
                        await criarConta(email, senha);
                    }
                } else if (erro.code === 'auth/wrong-password') {
                    alert('Senha incorreta');
                } else {
                    alert('Erro: ' + erro.message);
                }
                
                btnEntrar.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
                btnEntrar.disabled = false;
            }
        };
    }
    
    // BOTÃO GOOGLE
    const btnGoogle = document.getElementById('google-login-btn');
    if (btnGoogle) {
        btnGoogle.onclick = () => {
            alert('Login Google em breve! Use email/senha por agora.');
        };
    }
    
    // BOTÃO CRIAR CONTA
    const linkCriar = document.getElementById('register-link');
    if (linkCriar) {
        linkCriar.onclick = async (e) => {
            e.preventDefault();
            const email = prompt('Digite seu email:');
            const senha = prompt('Digite uma senha (mínimo 6 caracteres):');
            
            if (email && senha && senha.length >= 6) {
                await criarConta(email, senha);
            } else {
                alert('Email ou senha inválidos');
            }
        };
    }
}

async function criarConta(email, senha) {
    try {
        const { createUserWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js");
        const userCred = await createUserWithEmailAndPassword(auth, email, senha);
        
        // Criar estrutura inicial
        await criarEstruturaUsuario(userCred.user);
        
        alert('✅ Conta criada com sucesso!');
        mostrarApp(userCred.user);
        
    } catch (erro) {
        console.error('Erro criar conta:', erro);
        alert('Erro ao criar: ' + erro.message);
    }
}

// ======================
// ESTRUTURA FIRESTORE
// ======================

async function criarEstruturaUsuario(user) {
    try {
        console.log('📁 Criando estrutura para:', user.email);
        
        const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js");
        
        const userData = {
            uid: user.uid,
            email: user.email,
            nome: user.email.split('@')[0],
            fotoPerfil: '',
            dataNascimento: null,
            telefone: '',
            tema: 'sistema',
            corPrimaria: '#FFD700',
            configuracoes: {
                notificacoes: true,
                backupAuto: false,
                idioma: 'pt-BR'
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const userRef = doc(db, 'usuarios', user.uid);
        await setDoc(userRef, userData);
        
        console.log('✅ Estrutura criada');
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao criar estrutura:', error);
        return false;
    }
}

// ======================
// TELA DE PERFIL
// ======================

function criarTelaPerfil() {
    return `
    <div class="page-content">
        <div class="profile-header">
            <div class="profile-photo-container">
                <div class="profile-photo" id="profile-photo">
                    <i class="fas fa-user"></i>
                </div>
                <button onclick="trocarFoto()" class="btn-photo-edit">
                    <i class="fas fa-camera"></i>
                </button>
            </div>
            <h2 id="profile-name">Carregando...</h2>
            <p id="profile-email">carregando...</p>
        </div>
        
        <div class="profile-section">
            <h3><i class="fas fa-user-edit"></i> Informações Pessoais</h3>
            
            <div class="form-group">
                <label>Nome Completo</label>
                <input type="text" id="input-nome" placeholder="Seu nome">
            </div>
            
            <div class="form-group">
                <label>Data de Nascimento</label>
                <input type="date" id="input-nascimento">
            </div>
            
            <div class="form-group">
                <label>Telefone</label>
                <input type="tel" id="input-telefone" placeholder="(11) 99999-9999">
            </div>
            
            <button onclick="salvarPerfil()" class="btn btn-primary">
                <i class="fas fa-save"></i> Salvar Alterações
            </button>
        </div>
        
        <div class="profile-section">
            <h3><i class="fas fa-palette"></i> Aparência</h3>
            
            <div class="theme-selector">
                <div class="theme-option" data-theme="sistema" onclick="mudarTema('sistema')">
                    <div class="theme-preview sistema"></div>
                    <span>Sistema</span>
                </div>
                <div class="theme-option" data-theme="claro" onclick="mudarTema('claro')">
                    <div class="theme-preview claro"></div>
                    <span>Claro</span>
                </div>
                <div class="theme-option" data-theme="escuro" onclick="mudarTema('escuro')">
                    <div class="theme-preview escuro"></div>
                    <span>Escuro</span>
                </div>
            </div>
            
            <div class="color-picker">
                <label>Cor Principal</label>
                <div class="color-input-group">
                    <input type="color" id="input-cor" value="#FFD700" onchange="mudarCor(this.value)">
                    <span id="cor-texto">#FFD700</span>
                </div>
            </div>
        </div>
        
        <div class="profile-section">
            <h3><i class="fas fa-shield-alt"></i> Segurança</h3>
            <button onclick="fazerBackup()" class="btn-backup">
                <i class="fas fa-cloud-upload-alt"></i> Fazer Backup Agora
            </button>
            <p class="backup-info">
                Último backup: <span id="last-backup">Nunca</span>
            </p>
        </div>
    </div>
    `;
}

// ======================
// FUNÇÕES DO PERFIL
// ======================

async function carregarPerfil() {
    try {
        const user = auth.currentUser;
        if (!user) return;
        
        const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js");
        const userRef = doc(db, 'usuarios', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const data = userDoc.data();
            
            // Preencher formulário
            if (document.getElementById('input-nome')) {
                document.getElementById('input-nome').value = data.nome || '';
                document.getElementById('input-telefone').value = data.telefone || '';
                
                if (data.dataNascimento) {
                    const date = data.dataNascimento.toDate();
                    document.getElementById('input-nascimento').value = date.toISOString().split('T')[0];
                }
                
                document.getElementById('profile-name').textContent = data.nome || user.email.split('@')[0];
                document.getElementById('profile-email').textContent = user.email;
                
                // Aplicar tema
                if (data.tema) {
                    aplicarTema(data.tema);
                }
                
                if (data.corPrimaria) {
                    document.getElementById('input-cor').value = data.corPrimaria;
                    document.getElementById('cor-texto').textContent = data.corPrimaria;
                    document.documentElement.style.setProperty('--cor-primaria', data.corPrimaria);
                }
            }
            
        } else {
            // Primeiro acesso
            await criarEstruturaUsuario(user);
            setTimeout(() => carregarPerfil(), 1000);
        }
        
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
    }
}

async function salvarPerfil() {
    try {
        const user = auth.currentUser;
        if (!user) return;
        
        const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js");
        
        const dados = {
            nome: document.getElementById('input-nome').value,
            telefone: document.getElementById('input-telefone').value,
            dataNascimento: document.getElementById('input-nascimento').value ? 
                new Date(document.getElementById('input-nascimento').value) : null,
            updatedAt: new Date()
        };
        
        const userRef = doc(db, 'usuarios', user.uid);
        await updateDoc(userRef, dados);
        
        document.getElementById('profile-name').textContent = dados.nome || user.email.split('@')[0];
        mostrarNotificacao('✅ Perfil salvo com sucesso!');
        
    } catch (error) {
        console.error('Erro ao salvar:', error);
        mostrarNotificacao('❌ Erro ao salvar: ' + error.message);
    }
}

function aplicarTema(tema) {
    document.body.setAttribute('data-tema', tema);
    document.querySelectorAll('.theme-option').forEach(el => {
        el.classList.toggle('active', el.getAttribute('data-theme') === tema);
    });
}

async function mudarTema(tema) {
    aplicarTema(tema);
    
    if (auth.currentUser) {
        try {
            const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js");
            const userRef = doc(db, 'usuarios', auth.currentUser.uid);
            await updateDoc(userRef, { 
                tema: tema,
                updatedAt: new Date()
            });
        } catch (error) {
            console.error('Erro ao salvar tema:', error);
        }
    }
}

async function mudarCor(cor) {
    document.documentElement.style.setProperty('--cor-primaria', cor);
    document.getElementById('cor-texto').textContent = cor;
    
    if (auth.currentUser) {
        try {
            const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js");
            const userRef = doc(db, 'usuarios', auth.currentUser.uid);
            await updateDoc(userRef, { 
                corPrimaria: cor,
                updatedAt: new Date()
            });
        } catch (error) {
            console.error('Erro ao salvar cor:', error);
        }
    }
}

async function fazerBackup() {
    try {
        const user = auth.currentUser;
        if (!user) return;
        
        const { doc, getDoc, collection, getDocs } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js");
        
        const userRef = doc(db, 'usuarios', user.uid);
        const userData = await getDoc(userRef);
        
        const backup = {
            usuario: userData.data(),
            dataBackup: new Date(),
            versao: '1.0'
        };
        
        const { ref, uploadString } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js");
        const storageRef = ref(storage, `backups/${user.uid}/${Date.now()}.json`);
        
        await uploadString(storageRef, JSON.stringify(backup, null, 2));
        
        document.getElementById('last-backup').textContent = new Date().toLocaleString();
        mostrarNotificacao('✅ Backup realizado com sucesso!');
        
    } catch (error) {
        console.error('Erro no backup:', error);
        mostrarNotificacao('❌ Erro no backup: ' + error.message);
    }
}

function trocarFoto() {
    mostrarNotificacao('📷 Upload de foto em breve!');
}

function mostrarNotificacao(mensagem) {
    // Criar notificação temporária
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = mensagem;
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--cor-primaria);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// ======================
// NAVEGAÇÃO
// ======================

function configurarNavegacao() {
    // Botões do footer
    document.querySelectorAll('.footer-btn').forEach(btn => {
        btn.onclick = function() {
            const pagina = this.getAttribute('data-page');
            carregarPagina(pagina);
            
            document.querySelectorAll('.footer-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            if (document.getElementById('page-title')) {
                const titulos = {
                    'home': 'Início',
                    'contacts': 'Contatos',
                    'chat': 'Chat',
                    'calendar': 'Calendário',
                    'tree': 'Árvore'
                };
                document.getElementById('page-title').textContent = titulos[pagina] || pagina;
            }
        };
    });
    
    // Botão Sair
    const btnSair = document.getElementById('logout-btn');
    if (btnSair) {
        btnSair.onclick = () => {
            auth.signOut();
            location.reload();
        };
    }
}

function carregarPagina(pagina) {
    const conteudo = document.getElementById('app-content');
    
    if (pagina === 'home') {
        conteudo.innerHTML = criarTelaPerfil();
        setTimeout(() => carregarPerfil(), 100);
    } else if (pagina === 'settings') {
        conteudo.innerHTML = criarTelaPerfil();
        setTimeout(() => carregarPerfil(), 100);
    } else {
        const conteudos = {
            'contacts': `<div class="page-content"><h2>📇 Contatos</h2><p>Em breve...</p></div>`,
            'chat': `<div class="page-content"><h2>💬 Chat</h2><p>Em breve...</p></div>`,
            'calendar': `<div class="page-content"><h2>📅 Calendário</h2><p>Em breve...</p></div>`,
            'tree': `<div class="page-content"><h2>🌳 Árvore Genealógica</h2><p>Em breve...</p></div>`
        };
        conteudo.innerHTML = conteudos[pagina] || conteudos['home'];
    }
}

// ======================
// FUNÇÃO PRINCIPAL
// ======================

function mostrarApp(usuario) {
    console.log('👤 Mostrando app para:', usuario.email);
    
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'block';
    
    if (document.getElementById('user-email')) {
        document.getElementById('user-email').textContent = usuario.email;
        document.getElementById('user-name').textContent = usuario.email.split('@')[0];
    }
    
    carregarPagina('home');
}

function mostrarErro() {
    const loginDiv = document.getElementById('login-screen');
    if (loginDiv) {
        loginDiv.innerHTML = `
            <div style="padding: 50px; text-align: center;">
                <h2 style="color: #ff4444;">⚠️ Erro de Conexão</h2>
                <p>Não foi possível conectar ao Firebase.</p>
                <button onclick="location.reload()" class="btn" style="background: gold;">
                    🔄 Tentar Novamente
                </button>
            </div>
        `;
    }
}

console.log('✅ Script CronoZ carregado');
