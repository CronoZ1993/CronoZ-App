// Calcula quantos dias faltam para o próximo aniversário
export function diasParaAniversario(dataNascimento) {
    if (!dataNascimento) return null;

    const hoje = new Date();
    const nasc = new Date(dataNascimento);
    const proximoNiver = new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate());

    // Se já passou este ano, calcula para o próximo
    if (hoje > proximoNiver) {
        proximoNiver.setFullYear(hoje.getFullYear() + 1);
    }

    const diferenca = proximoNiver - hoje;
    return Math.ceil(diferenca / (1000 * 60 * 60 * 24));
}

// Gera a mensagem personalizada baseada no prazo (Seção 2 do Pedido)
export function obterMensagemCronoZ(dataNascimento) {
    const dias = diasParaAniversario(dataNascimento);
    if (dias === null) return "Configure seu nascimento no perfil.";
    if (dias === 0 || dias === 365) return "🎉 Feliz Aniversário! Hoje o CronoZ celebra você!";
    if (dias <= 7) return `Faltam apenas ${dias} dias! A contagem regressiva começou!`;
    if (dias <= 30) return `Falta menos de um mês (${dias} dias) para o seu grande dia!`;
    
    return `Seu aniversário é em ${dias} dias. Continue construindo seu legado!`;
}

// Formata data para o padrão brasileiro (DD/MM/AAAA)
export function formatarDataBR(dataISO) {
    if (!dataISO) return "";
    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
}

// Mostrar Notificação (Toast) na tela
export function showToast(mensagem) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = mensagem;
    document.body.appendChild(toast);
    
    // Remove do DOM após a animação (definida no CSS)
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Validar se um e-mail é legítimo
export function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Gerar ID único (Usado para fotos e mensagens)
export function gerarId() {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Bloqueio de cliques múltiplos (Debounce simples)
export function debounce(func, delay = 500) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}
