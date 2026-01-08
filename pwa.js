// Registro do Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('CronoZ: Pronto para uso offline.'))
            .catch(err => console.error('Erro ao registrar PWA:', err));
    });
}

// Lógica para capturar o evento de instalação (Prompt)
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    // Impede que o navegador mostre o prompt automático
    e.preventDefault();
    deferredPrompt = e;
    console.log('CronoZ: Pronto para ser instalado no dispositivo.');
});

// Função para disparar a instalação manualmente (pode chamar via botão nas Configs)
export function instalarCronoZ() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('Usuário aceitou a instalação.');
            }
            deferredPrompt = null;
        });
    } else {
        alert("O CronoZ já está instalado ou seu navegador não suporta a instalação direta.");
    }
}
