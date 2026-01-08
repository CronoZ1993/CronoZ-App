import { db, auth } from './firebase-config.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Função para Alternar Tema (Claro/Escuro)
export function alternarTema(isDark) {
    if (isDark) {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Função para Aplicar Cor Personalizada (Roda de Cores)
export function aplicarCorPersonalizada(cor) {
    document.documentElement.style.setProperty('--gold', cor);
    // Ajusta o 'gold-dark' automaticamente para manter o contraste
    const darkCor = ajustarBrilho(cor, -20);
    document.documentElement.style.setProperty('--gold-dark', darkCor);
    localStorage.setItem('customColor', cor);
}

// Função Auxiliar para escurecer a cor escolhida
function ajustarBrilho(hex, percent) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.floor(r * (100 + percent) / 100);
    g = Math.floor(g * (100 + percent) / 100);
    b = Math.floor(b * (100 + percent) / 100);
    return `rgb(${r}, ${g}, ${b})`;
}

// Função para Restaurar Padrão Dourado
export function restaurarPadrao() {
    const padrao = "#D4AF37";
    aplicarCorPersonalizada(padrao);
}

// Backup de Dados (Gera um JSON para o usuário baixar)
export async function fazerBackup(userData) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "cronoz_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// Função para Excluir Conta (Atenção: Ação Irreversível)
export async function excluirConta() {
    const confirmar = confirm("TEM CERTEZA? Isso apagará todos os seus dados e árvore genealógica permanentemente.");
    if (confirmar) {
        try {
            const user = auth.currentUser;
            // Aqui deletaríamos o documento no Firestore antes do usuário
            await deleteDoc(doc(db, "usuarios", user.uid));
            await user.delete();
            window.location.reload();
        } catch (error) {
            alert("Erro ao excluir. Re-faça o login e tente novamente.");
        }
    }
}

// Gerenciamento de Assinatura (Premium)
export async function resgatarCodigo(codigo) {
    // Exemplo de lógica de resgate solicitada no pedido
    if (codigo === "CRONOZFREE") {
        alert("Código aceito! 1 mês de Premium resgatado.");
        return true;
    } else {
        alert("Código inválido ou já utilizado.");
        return false;
    }
}

// Função para disparar anúncios (Simulação para integração Google Ads)
export function dispararAnuncio() {
    console.log("Chamando Google Ads...");
    // Aqui entra o script do AdSense que configuraremos no final
}

// Logout
export function sairDaConta() {
    auth.signOut().then(() => {
        window.location.reload();
    });
}
