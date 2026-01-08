// Validar E-mail
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Formatar Telefone automaticamente (Ex: (11) 99999-9999)
export function formatPhone(value) {
    if (!value) return "";
    value = value.replace(/\D/g, "");
    value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
    value = value.replace(/(\d)(\d{4})$/, "$1-$2");
    return value;
}

// Mostrar Toast (Aviso flutuante)
export function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, duration);
}

// Gerar ID Único (Útil para novos itens da árvore ou mensagens)
export function generateId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Calcular Idade
export function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

// Debounce (Evita que funções pesadas rodem muitas vezes seguidas)
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Verificar se é dispositivo móvel (para ajustes de UI)
export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Copiar para o Clipboard (Usado para compartilhar códigos de convite)
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast("Copiado para a área de transferência!");
    } catch (err) {
        showToast("Erro ao copiar.");
    }
}
