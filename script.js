// TODO O CÓDIGO QUE EU MANDAR
// script.js - CronoZ Firebase v12 CORRETO
console.log('📱 CronoZ iniciando...');

let auth, db;

// Verificar quando Firebase carrega
setTimeout(() => {
    if (window.auth && window.db) {
        console.log('✅ Firebase pronto');
        auth = window.auth;
        db = window.db;
        iniciarApp();
    } else {
        console.error('❌ Firebase falhou');
        mostrarErro();
    }
}, 1500);

async function iniciarApp() {
    console.log('🎯 Configurando app...');
    
    // BOTÃO ENTRAR - CORRETO para Firebase v12
    const btnEntrar = document.getElementById('login-btn');
    if (btnEntrar) {
        btnEntrar.onclick = async () => {
            console.log('👉 Tentando login...');
            
            const email = document.getElementById('email')?.value?.trim();
            const senha = document.getElementById('password')?.value;
            
            // Validação simples
            if (!email || !senha) {
                alert('Preencha email e senha');
                return;
            }
            
            try {
                btnEntrar.innerHTML = '⏳ Entrando...';
                btnEntrar.disabled = true;
                
                // ✅ CORRETO: Firebase v12 modular
                const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js");
                const userCred = await signInWithEmailAndPassword(auth, email, senha);
                
                console.log('✅ Logado:', userCred.user.email);
                mostrarApp(userCred.user);
                
            } catch (erro) {
                console.error('❌ Erro login:', erro.code);
                
                // Se usuário não existe, criar conta
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
    
    // BOTÃO GOOGLE (simples por enquanto)
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

// FUNÇÃO CRIAR CONTA - CORRETA
async function criarConta(email, senha) {
    try {
        // ✅ CORRETO: Firebase v12
        const { createUserWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js");
        const userCred = await createUserWithEmailAndPassword(auth, email, senha);
        
        alert('✅ Conta criada com sucesso!');
        mostrarApp(userCred.user);
        
    } catch (erro) {
        console.error('Erro criar conta:', erro);
        alert('Erro ao criar: ' + erro.message);
    }
}

// FUNÇÃO MOSTRAR APP
function mostrarApp(usuario) {
    console.log('👤 Mostrando app para:', usuario.email);
    
    // Trocar telas
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'block';
    
    // Atualizar menu
    document.getElementById('user-email').textContent = usuario.email;
    document.getElementById('user-name').textContent = usuario.email.split('@')[0];
    
    // Conteúdo simples
    document.getElementById('app-content').innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
            <h2>🎉 Bem-vindo, ${usuario.email.split('@')[0]}!</h2>
            <p>Login realizado com sucesso!</p>
            
            <button onclick="testarFirestore()" class="btn" style="background: gold; margin: 15px;">
                🔥 Testar Banco de Dados
            </button>
            
            <button onclick="auth.signOut(); location.reload()" class="btn" style="background: #ff4444; color: white; margin: 15px;">
                🚪 Sair do App
            </button>
        </div>
    `;
    
    // Configurar botão Sair no menu
    document.getElementById('logout-btn').onclick = () => {
        auth.signOut();
        location.reload();
    };
}

// FUNÇÃO TESTAR FIRESTORE - CORRETA
window.testarFirestore = async () => {
    try {
        const user = auth.currentUser;
        if (!user) {
            alert('❌ Faça login primeiro');
            return;
        }
        
        // ✅ CORRETO: Firebase v12 Firestore
        const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js");
        
        await addDoc(collection(db, 'usuarios'), {
            uid: user.uid,
            email: user.email,
            primeiroLogin: new Date(),
            teste: 'App CronoZ funcionando!'
        });
        
        alert('✅ Dados salvos no Firestore!');
        console.log('Teste salvo com sucesso');
        
    } catch (erro) {
        console.error('Erro Firestore:', erro);
        alert('❌ Erro ao salvar: ' + erro.message);
    }
};

// FUNÇÃO ERRO
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

console.log('✅ Script carregado. Aguardando Firebase...');
// ======================
// CONFIGURAÇÃO FIRESTORE
// ======================

async function criarEstruturaUsuario(user) {
    try {
        console.log('📁 Criando estrutura para:', user.email);
        
        // Referência ao Firestore (Firebase v12 correto)
        const { doc, setDoc, collection } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js");
        
        // Dados básicos do usuário
        const userData = {
            uid: user.uid,
            email: user.email,
            nome: user.email.split('@')[0], // Nome padrão
            fotoPerfil: '',
            dataNascimento: null,
            telefone: '',
            tema: 'sistema', // 'claro', 'escuro', 'sistema'
            corPrimaria: '#FFD700', // Dourado padrão
            configuracoes: {
                notificacoes: true,
                backupAuto: false,
                idioma: 'pt-BR'
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        // Salvar no Firestore
        const userRef = doc(db, 'usuarios', user.uid);
        await setDoc(userRef, userData);
        
        console.log('✅ Estrutura criada com sucesso');
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao criar estrutura:', error);
        return false;
    }
}

// ======================
// PERFIL DO USUÁRIO
// ======================

function criarTelaPerfil() {
    return `
    <div class="page-content">
        <div class="profile-header">
            <div class="profile-photo-container">
                <img src="" alt="Foto" id="profile-photo" class="profile-photo">
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
            
            <div class="color-picker" style="margin-top: 20px;">
                <label>Cor Principal</label>
                <input type="color" id="input-cor" value="#FFD700" onchange="mudarCor(this.value)">
                <span id="cor-texto">#FFD700</span>
            </div>
        </div>
        
        <div class="profile-section">
            <h3><i class="fas fa-shield-alt"></i> Segurança</h3>
            <button onclick="fazerBackup()" class="btn" style="background: #4CAF50; color: white;">
                <i class="fas fa-cloud-upload-alt"></i> Fazer Backup Agora
            </button>
            <p style="font-size: 12px; color: #666; margin-top: 10px;">
                Último backup: <span id="last-backup">Nunca</span>
            </p>
        </div>
    </div>
    `;
}

// ======================
// FUNÇÕES DO PERFIL
// ======================

// Carregar dados do usuário
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
                mudarTema(data.tema, false); // false = não salva
            }
            
            if (data.corPrimaria) {
                document.getElementById('input-cor').value = data.corPrimaria;
                document.getElementById('cor-texto').textContent = data.corPrimaria;
            }
            
        } else {
            // Primeiro acesso - criar estrutura
            await criarEstruturaUsuario(user);
            carregarPerfil(); // Recarregar
        }
        
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
    }
}

// Salvar perfil
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
        
        // Atualizar display
        document.getElementById('profile-name').textContent = dados.nome || user.email.split('@')[0];
        
        alert('✅ Perfil salvo com sucesso!');
        
    } catch (error) {
        console.error('Erro ao salvar:', error);
        alert('❌ Erro ao salvar: ' + error.message);
    }
}

// Mudar tema
async function mudarTema(tema, salvar = true) {
    // Aplicar visualmente
    document.body.setAttribute('data-tema', tema);
    
    // Marcar opção ativa
    document.querySelectorAll('.theme-option').forEach(el => {
        el.classList.toggle('active', el.getAttribute('data-theme') === tema);
    });
    
    // Salvar no Firestore
    if (salvar && auth.currentUser) {
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

// Mudar cor
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

// Backup manual
async function fazerBackup() {
    try {
        const user = auth.currentUser;
        if (!user) return;
        
        // Obter todos os dados do usuário
        const { doc, getDoc, collection, getDocs } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js");
        
        const userRef = doc(db, 'usuarios', user.uid);
        const userData = await getDoc(userRef);
        
        const contatosRef = collection(db, 'usuarios', user.uid, 'contatos');
        const contatosSnapshot = await getDocs(contatosRef);
        const contatos = contatosSnapshot.docs.map(doc => doc.data());
        
        // Criar objeto de backup
        const backup = {
            usuario: userData.data(),
            contatos: contatos,
            dataBackup: new Date(),
            versao: '1.0'
        };
        
        // Salvar no Storage (Firebase v12)
        const { ref, uploadString } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js");
        const storageRef = ref(storage, `backups/${user.uid}/${Date.now()}.json`);
        
        await uploadString(storageRef, JSON.stringify(backup, null, 2));
        
        // Atualizar UI
        document.getElementById('last-backup').textContent = new Date().toLocaleString();
        
        alert('✅ Backup realizado com sucesso!');
        
    } catch (error) {
        console.error('Erro no backup:', error);
        alert('❌ Erro no backup: ' + error.message);
    }
}

// ======================
// INTEGRAÇÃO COM APP
// ======================

// Modificar a função carregarPagina() do script.js original
function carregarPagina(pagina) {
    const conteudo = document.getElementById('app-content');
    
    if (pagina === 'home') {
        conteudo.innerHTML = criarTelaPerfil();
        carregarPerfil(); // Carregar dados
    } else if (pagina === 'settings') {
        conteudo.innerHTML = criarTelaPerfil(); // Configurações também usa perfil
        carregarPerfil();
    } else {
        // Outras páginas (manter original)
        const conteudos = {
            'contacts': `<div class="page-content"><h2>📇 Contatos</h2><p>Em breve...</p></div>`,
            'chat': `<div class="page-content"><h2>💬 Chat</h2><p>Em breve...</p></div>`,
            'calendar': `<div class="page-content"><h2>📅 Calendário</h2><p>Em breve...</p></div>`,
            'tree': `<div class="page-content"><h2>🌳 Árvore Genealógica</h2><p>Em breve...</p></div>`
        };
        conteudo.innerHTML = conteudos[pagina] || conteudos['home'];
    }
}
