// script.js - CronoZ SIMPLES para celular

console.log('📱 CronoZ no celular iniciando...');

// Esperar Firebase carregar
setTimeout(() => {
    if (window.auth && window.db) {
        console.log('✅ Firebase carregado!');
        iniciarApp();
    } else {
        console.error('❌ Firebase não carregou');
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
                
                // Tentar login
                const userCred = await window.auth.signInWithEmailAndPassword(email, senha);
                console.log('✅ Logado:', userCred.user.email);
                
                // Mostrar app
                mostrarApp(userCred.user);
                
            } catch (erro) {
                console.error('❌ Erro login:', erro);
                
                // Tentar criar conta se não existir
                if (erro.code === 'auth/user-not-found') {
                    try {
                        const novaConta = await window.auth.createUserWithEmailAndPassword(email, senha);
                        console.log('✅ Conta criada:', novaConta.user.email);
                        mostrarApp(novaConta.user);
                    } catch (erro2) {
                        alert('Erro criar conta: ' + erro2.message);
                    }
                } else {
                    alert('Erro: ' + erro.message);
                }
            } finally {
                btnEntrar.innerHTML = 'Entrar';
            }
        };
    }
    
    // Botão Google
    const btnGoogle = document.getElementById('google-login-btn');
    if (btnGoogle) {
        btnGoogle.onclick = async () => {
            console.log('Google clicado');
            alert('Google em desenvolvimento');
        };
    }
    
    // Link Criar conta
    const linkCriar = document.getElementById('register-link');
    if (linkCriar) {
        linkCriar.onclick = (e) => {
            e.preventDefault();
            const email = prompt('Email para cadastro:');
            const senha = prompt('Senha (min 6 letras):');
            
            if (email && senha && senha.length >= 6) {
                window.auth.createUserWithEmailAndPassword(email, senha)
                    .then(user => {
                        alert('✅ Conta criada!');
                        mostrarApp(user.user);
                    })
                    .catch(erro => alert('Erro: ' + erro.message));
            }
        };
    }
    
    // Botão Sair
    const btnSair = document.getElementById('logout-btn');
    if (btnSair) {
        btnSair.onclick = () => {
            window.auth.signOut();
            location.reload();
        };
    }
}

function mostrarApp(usuario) {
    console.log('Mostrando app para:', usuario.email);
    
    // Esconder login, mostrar app
    document.getElementById('login-screen').style.display = 'none';
    const appScreen = document.getElementById('app-screen');
    appScreen.style.display = 'block';
    
    // Conteúdo do app
    document.getElementById('app-content').innerHTML = `
        <div style="padding: 20px; text-align: center;">
            <h2>🎉 Olá ${usuario.email.split('@')[0]}!</h2>
            <p>App CronoZ funcionando no celular!</p>
            
            <button onclick="testarBanco()" style="margin: 10px; padding: 15px; background: gold; border: none; border-radius: 10px; font-size: 16px;">
                🔥 Testar Banco
            </button>
            
            <button onclick="sairApp()" style="margin: 10px; padding: 15px; background: #ff4444; color: white; border: none; border-radius: 10px; font-size: 16px;">
                🚪 Sair
            </button>
        </div>
    `;
    
    // Atualizar menu
    document.getElementById('user-email').textContent = usuario.email;
    document.getElementById('user-name').textContent = usuario.email.split('@')[0];
}

function mostrarErro() {
    document.getElementById('login-screen').innerHTML = `
        <div style="padding: 50px; text-align: center;">
            <h2 style="color: red;">⚠️ Problema no Firebase</h2>
            <p>Recarregue a página</p>
            <button onclick="location.reload()" style="padding: 15px; background: gold; border: none; border-radius: 10px;">
                🔄 Recarregar
            </button>
        </div>
    `;
}

// Funções globais
window.testarBanco = async () => {
    try {
        const user = window.auth.currentUser;
        await window.db.collection('testes').add({
            usuario: user.email,
            data: new Date(),
            mensagem: 'Teste do celular!',
            plataforma: 'mobile'
        });
        alert('✅ Dados salvos!');
    } catch (erro) {
        alert('❌ Erro: ' + erro.message);
    }
};

window.sairApp = () => {
    window.auth.signOut();
    location.reload();
};

console.log('✅ Script carregado, aguardando Firebase...');
