import { auth, db } from './firebase-config.js';
import { doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { showToast } from './utils.js';

// Alterar a cor base (Dourado/Personalizado)
export function atualizarCorBase(novaCor) {
    document.documentElement.style.setProperty('--gold', novaCor);
    localStorage.setItem('customColor', novaCor);
    
    // Opcional: Salvar no perfil do usuário no Firestore
    const uid = auth.currentUser.uid;
    updateDoc(doc(db, "usuarios", uid), { corPreferida: novaCor });
    showToast("Cor de destaque atualizada!");
}

// Alternar entre Dark e Light Mode
export function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    showToast(isDark ? "Modo Escuro ativado" : "Modo Claro ativado");
}

window.mudarCorPeloInput = (event) => {
    atualizarCorBase(event.target.value);
};

// Exclusão Definitiva de Conta (Seção de Segurança do Pedido)
export async function excluirContaUsuario() {
    const confirmacao = confirm("ATENÇÃO: Isso excluirá permanentemente todos os seus dados, fotos e árvore. Deseja continuar?");
    
    if (confirmacao) {
        const user = auth.currentUser;
        const uid = user.uid;

        try {
            // 1. Deleta documento no Firestore
            await deleteDoc(doc(db, "usuarios", uid));
            // 2. Deleta o usuário do Auth
            await user.delete();
            
            showToast("Sua conta foi removida com sucesso.");
            window.location.reload();
        } catch (e) {
            showToast("Para excluir, você precisa ter feito login recentemente. Saia e entre de novo.");
        }
    }
}

// Renderiza a tela de personalização no conteúdo principal
export function abrirPersonalizacao() {
    const area = document.getElementById('content-area');
    const corAtual = localStorage.getItem('customColor') || '#D4AF37';
    
    area.innerHTML = `
        <div class="card-tray animate-in">
            <h3>Personalização</h3>
            <p>Escolha sua cor de destaque:</p>
            <div class="color-picker-wrapper">
                <input type="color" value="${corAtual}" onchange="mudarCorPeloInput(event)">
            </div>
            <hr>
            <div class="theme-switch">
                <span>Modo Escuro</span>
                <button onclick="toggleDarkMode()" class="btn-gold-small">Alternar</button>
            </div>
        </div>
    `;
    closeMenu(); // Fecha o menu lateral após abrir a tela
}

window.toggleDarkMode = toggleDarkMode;
window.excluirConta = excluirContaUsuario;
