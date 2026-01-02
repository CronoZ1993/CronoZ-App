// script.js - CronoZ SIMPLES para celular (Firebase v12 FIX)

console.log('📱 CronoZ no celular iniciando...');

// Importações adicionais para Firebase v12
let db, auth, googleProvider;

// Esperar Firebase carregar
setTimeout(async () => {
    try {
        if (window.auth && window.db) {
            console.log('✅ Firebase carregado!');
            
            // Configurar referências corretamente
            auth = window.auth;
            db = window.db;
            googleProvider = window.googleProvider;
            
            // Verificar se já está logado
            auth.onAuthStateChanged((user) => {
                if (user) {
                    console.log('Usuário já logado:', user.email);
                    mostrarApp(user);
                } else {
                    console.log('Nenhum usuário logado');
                    iniciarApp();
                }
            });
            
        } else {
            console.error('❌ Firebase não carregou');
            mostrarErro();
        }
    } catch (error) {
        console.error('Erro ao iniciar:', error);
        mostrarErro();
    }
}, 2000);

function iniciarApp() {
    console.log('🎯 App iniciando...');
    
    // Botão Entrar SIMPLES
    const btnEntrar = document.getElementById('login-btn');
    if (btnEntrar) {
        btnEntrar.onclick = async () => {
            console.log('Botão Entrar clicado');
            
            const email = document.getElementById('email')?.value || 'teste@cronoz.com';
            const senha = document.getElementById('password')?.value || '123456';
            
            try {
                // Mostrar loading
                btnEntrar.innerHTML = '⏳ Entrando...';
                btnEntrar.disabled = true;
                
                // FIREBASE V12 - Método correto
                const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js");
                const userCred = await signInWithEmailAndPassword(auth, email, senha);
                console.log('✅ Logado:', userCred.user.email);
                
                // Mostrar app
                mostrarApp(userCred.user);
                
            } catch (erro) {
                console.error('❌ Erro login:', erro.code, erro.message);
                
                // Tentar criar conta se não existir
                if (erro.code === 'auth/user-not-found') {
                    try {
                        const { createUserWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js");
                        const novaConta = await createUserWithEmailAndPassword(auth, email, senha);
                        console.log('✅ Conta criada:', novaConta.user.email);
                        mostrarApp(novaConta.user);
                    } catch (erro2) {
                        alert('Erro criar conta: ' + erro2.message);
                    }
                } else {
                    alert('Erro: ' + erro.message);
                }
            } finally {
                if (btnEntrar) {
                    btnEntrar.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
                    btnEntrar.disabled = false;
                }
            }
        };
    }
    
    // Configurar navegação
    configurarNavegacao();
}

function mostrarApp(usuario) {
    console.log('Mostrando app para:', usuario.email);
    
    // Esconder login, mostrar app
    document.getElementById('login-screen').style.display = 'none';
    const appScreen = document.getElementById('app-screen');
    appScreen.style.display = 'block';
    
    // Atualizar menu
    if (document.getElementById('user-email')) {
        document.getElementById('user-email').textContent = usuario.email;
        document.getElementById('user-name').textContent = usuario.email.split('@')[0];
    }
    
    // Carregar página inicial
    carregarPagina('home');
}

// FUNÇÃO TESTAR BANCO CORRIGIDA (Firebase v12)
window.testarBanco = async () => {
    try {
        const user = auth.currentUser;
        if (!user) {
            alert('❌ Nenhum usuário logado');
            return;
        }
        
        // FIREBASE V12 - Sintaxe correta
        const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js");
        
        await addDoc(collection(db, 'testes'), {
            usuario: user.email,
            data: new Date(),
            mensagem: 'Teste do celular!',
            plataforma: 'mobile',
            uid: user.uid
        });
        
        alert('✅ Dados salvos no Firestore!');
        console.log('Teste salvo com sucesso');
        
    } catch (erro) {
        console.error('Erro ao salvar:', erro);
        alert('❌ Erro: ' + erro.message);
    }
};

// FUNÇÕES DE NAVEGAÇÃO
function configurarNavegacao() {
    // Botões do footer
    document.querySelectorAll('.footer-btn').forEach(btn => {
        btn.onclick = function() {
            const pagina = this.getAttribute('data-page');
            carregarPagina(pagina);
            
            // Ativar botão clicado
            document.querySelectorAll('.footer-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Atualizar título
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
    const conteudos = {
        'home': `
            <div class="page-content">
                <h2>🎉 Olá ${auth.currentUser?.email?.split('@')[0] || 'Usuário'}!</h2>
                <p>Bem-vindo ao CronoZ!</p>
                
                <div style="margin-top: 30px;">
                    <button onclick="testarBanco()" class="btn btn-primary" style="margin: 10px;">
                        🔥 Testar Firestore
                    </button>
                    
                    <button onclick="sairApp()" class="btn btn-danger" style="margin: 10px;">
                        🚪 Sair
                    </button>
                </div>
            </div>
        `,
        'contacts': `<div class="page-content"><h2>📱 Contatos</h2><p>Em desenvolvimento...</p></div>`,
        'chat': `<div class="page-content"><h2>💬 Chat</h2><p>Em desenvolvimento...</p></div>`,
        'calendar': `<div class="page-content"><h2>📅 Calendário</h2><p>Em desenvolvimento...</p></div>`,
        'tree': `<div class="page-content"><h2>🌳 Árvore Genealógica</h2><p>Em desenvolvimento...</p></div>`
    };
    
    conteudo.innerHTML = conteudos[pagina] || conteudos['home'];
}

// Outras funções globais
window.sairApp = () => {
    auth.signOut();
    location.reload();
};

function mostrarErro() {
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) {
        loginScreen.innerHTML = `
            <div style="padding: 50px; text-align: center;">
                <h2 style="color: red;">⚠️ Problema no Firebase</h2>
                <p>Recarregue a página</p>
                <button onclick="location.reload()" class="btn btn-primary">
                    🔄 Recarregar
                </button>
            </div>
        `;
    }
}

console.log('✅ Script carregado, aguardando Firebase...');
