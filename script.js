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
