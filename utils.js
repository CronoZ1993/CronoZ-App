// utils.js - Funções utilitárias do CronoZ App

// Sistema de notificações Toast
export function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${icons[type] || icons.info}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${getToastTitle(type)}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    const removeToast = () => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    };
    
    toast.querySelector('.toast-close').addEventListener('click', removeToast);
    
    if (duration > 0) {
        setTimeout(removeToast, duration);
    }
    
    return toast;
}

function getToastTitle(type) {
    const titles = {
        success: 'Sucesso!',
        error: 'Erro!',
        warning: 'Atenção!',
        info: 'Informação'
    };
    return titles[type] || 'Notificação';
}

// Sistema de loading
export function showLoading(message = 'Carregando...') {
    const overlay = document.getElementById('loading-overlay');
    if (!overlay) return;
    
    const messageEl = overlay.querySelector('p');
    if (messageEl) {
        messageEl.textContent = message;
    }
    
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

export function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (!overlay) return;
    
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// Formatação de datas
export function formatDate(date, format = 'dd/mm/yyyy') {
    if (!date) return '--/--/----';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '--/--/----';
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    
    switch (format) {
        case 'dd/mm/yyyy':
            return `${day}/${month}/${year}`;
        case 'dd/mm/yyyy HH:mm':
            return `${day}/${month}/${year} ${hours}:${minutes}`;
        case 'yyyy-mm-dd':
            return `${year}-${month}-${day}`;
        case 'full':
            return d.toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        default:
            return d.toLocaleDateString('pt-BR');
    }
}

export function formatTime(date) {
    if (!date) return '--:--';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return '--:--';
    
    return d.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Cálculo de idade
export function calculateAge(birthDate) {
    if (!birthDate) return null;
    
    const today = new Date();
    const birth = new Date(birthDate);
    
    if (isNaN(birth.getTime())) return null;
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

// Dias até aniversário
export function daysUntilBirthday(birthDate) {
    if (!birthDate) return null;
    
    const today = new Date();
    const birth = new Date(birthDate);
    
    if (isNaN(birth.getTime())) return null;
    
    const currentYear = today.getFullYear();
    const nextBirthday = new Date(currentYear, birth.getMonth(), birth.getDate());
    
    if (nextBirthday < today) {
        nextBirthday.setFullYear(currentYear + 1);
    }
    
    const diffTime = nextBirthday.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Mensagem de aniversário
export function getBirthdayMessage(daysUntil) {
    if (daysUntil === null || daysUntil === undefined) {
        return 'Complete seu perfil para ver mensagens especiais!';
    }
    
    if (daysUntil === 0) {
        return 'Parabéns! Desejo a você, muita paz, saúde, prosperidade e felicidade! Aproveite seu dia mais especial da melhor forma que puder!';
    } else if (daysUntil <= 7) {
        return 'Eu ouvi bolo? É hora da contagem regressiva... Que venha a festa!';
    } else if (daysUntil <= 30) {
        return 'Esse mês é muito especial, vamos aproveitar ao máximo!';
    } else if (daysUntil <= 90) {
        return 'Hora de checar a lista de itens de festa e mandar os convites!';
    } else if (daysUntil <= 180) {
        return 'Acho que já podemos ir planejando sua festa com calma...';
    } else if (daysUntil <= 270) {
        return 'Já foi metade do caminho?! Como o tempo voa...';
    } else if (daysUntil <= 365) {
        return 'Ainda temos bastante tempo para descansar, aproveite seus bons momentos!';
    } else {
        return 'Seu aniversário foi a pouco tempo, mas vamos nos preparar para o próximo!';
    }
}

// Validação de email
export function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Validação de telefone
export function isValidPhone(phone) {
    const regex = /^(\+\d{1,3}\s?)?(\(?\d{2}\)?[\s-]?)?(\d{4,5}[\s-]?\d{4})$/;
    return regex.test(phone);
}

// Formatação de telefone
export function formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 11) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    
    return phone;
}

// Debounce para pesquisa
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

// Throttle para eventos
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// LocalStorage helpers
export function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(`cronoz-${key}`, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
        return false;
    }
}

export function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(`cronoz-${key}`);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Erro ao carregar do localStorage:', error);
        return defaultValue;
    }
}

export function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(`cronoz-${key}`);
        return true;
    } catch (error) {
        console.error('Erro ao remover do localStorage:', error);
        return false;
    }
}

// Upload de arquivos
export async function uploadFile(file, path) {
    if (!file || !path) return null;
    
    try {
        return new Promise((resolve) => {
            setTimeout(() => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    resolve(e.target.result);
                };
                reader.readAsDataURL(file);
            }, 1000);
        });
    } catch (error) {
        console.error('Erro ao fazer upload:', error);
        return null;
    }
}

// Download de arquivos
export function downloadFile(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
}

// Copiar para clipboard
export function copyToClipboard(text) {
    return navigator.clipboard.writeText(text)
        .then(() => {
            showToast('Copiado para a área de transferência!', 'success');
            return true;
        })
        .catch((error) => {
            console.error('Erro ao copiar:', error);
            showToast('Erro ao copiar', 'error');
            return false;
        });
}

// Gerar ID único
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Formatação de números
export function formatNumber(number, decimals = 0) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(number);
}

// Formatação de moeda
export function formatCurrency(amount) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(amount);
}

// Tempo relativo
export function getRelativeTime(date) {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) {
        return 'agora mesmo';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `há ${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''}`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `há ${diffInHours} h${diffInHours > 1 ? 's' : ''}`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
    }
    
    return formatDate(date, 'dd/mm/yyyy');
}

// Ordenação de arrays
export function sortByProperty(array, property, ascending = true) {
    return [...array].sort((a, b) => {
        const aValue = a[property];
        const bValue = b[property];
        
        if (aValue < bValue) return ascending ? -1 : 1;
        if (aValue > bValue) return ascending ? 1 : -1;
        return 0;
    });
}

// Filtro de arrays
export function filterArray(array, filters) {
    return array.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
            if (value === undefined || value === null) return true;
            if (typeof value === 'function') return value(item[key]);
            return item[key] === value;
        });
    });
}

// Verificar se é mobile
export function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Verificar se está online
export function isOnline() {
    return navigator.onLine;
}

// Detecta mudanças na conexão
export function onConnectionChange(callback) {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
}

// Exportar para global
window.CronoZUtils = {
    showToast,
    hideToast: () => document.querySelectorAll('.toast').forEach(t => t.remove()),
    showLoading,
    hideLoading,
    formatDate,
    formatTime,
    calculateAge,
    daysUntilBirthday,
    getBirthdayMessage,
    isValidEmail,
    isValidPhone,
    formatPhone,
    debounce,
    throttle,
    saveToLocalStorage,
    loadFromLocalStorage,
    removeFromLocalStorage,
    uploadFile,
    downloadFile,
    copyToClipboard,
    generateId,
    formatNumber,
    formatCurrency,
    getRelativeTime,
    sortByProperty,
    filterArray,
    isMobileDevice,
    isOnline,
    onConnectionChange
};

console.log('Utils.js carregado com sucesso!');