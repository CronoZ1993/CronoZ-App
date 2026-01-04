// utils.js - Funções Utilitárias
class Utils {
    static formatDate(date, format = 'pt-BR') {
        const d = new Date(date);
        
        switch (format) {
            case 'pt-BR':
                return d.toLocaleDateString('pt-BR');
            case 'time':
                return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            case 'datetime':
                return d.toLocaleString('pt-BR');
            case 'relative':
                return this.getRelativeTime(d);
            default:
                return d.toLocaleDateString();
        }
    }
    
    static getRelativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        
        const minute = 60 * 1000;
        const hour = minute * 60;
        const day = hour * 24;
        const week = day * 7;
        const month = day * 30;
        const year = day * 365;
        
        if (diff < minute) return 'agora';
        if (diff < hour) return `${Math.floor(diff / minute)} min atrás`;
        if (diff < day) return `${Math.floor(diff / hour)} h atrás`;
        if (diff < week) return `${Math.floor(diff / day)} dias atrás`;
        if (diff < month) return `${Math.floor(diff / week)} semanas atrás`;
        if (diff < year) return `${Math.floor(diff / month)} meses atrás`;
        return `${Math.floor(diff / year)} anos atrás`;
    }
    
    static generateId(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    static debounce(func, wait) {
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
    
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    static validatePhone(phone) {
        const re = /^(\+\d{1,3})?\s?\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/;
        return re.test(phone);
    }

  static formatPhone(phone) {
        // Remove tudo que não é número
        const numbers = phone.replace(/\D/g, '');
        
        if (numbers.length === 11) {
            return `(${numbers.slice(0,2)}) ${numbers.slice(2,7)}-${numbers.slice(7)}`;
        } else if (numbers.length === 10) {
            return `(${numbers.slice(0,2)}) ${numbers.slice(2,6)}-${numbers.slice(6)}`;
        }
        
        return phone;
    }
    
    static async compressImage(file, maxWidth = 800, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob(
                        (blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })),
                        'image/jpeg',
                        quality
                    );
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    static downloadFile(content, fileName, contentType = 'text/plain') {
        const a = document.createElement('a');
        const file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(a.href);
    }

  static copyToClipboard(text) {
        if (navigator.clipboard) {
            return navigator.clipboard.writeText(text);
        } else {
            // Fallback para navegadores mais antigos
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return Promise.resolve();
        }
    }
    
    static getFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    static groupBy(array, key) {
        return array.reduce((result, item) => {
            (result[item[key]] = result[item[key]] || []).push(item);
            return result;
        }, {});
    }
    
    static sortBy(array, key, order = 'asc') {
        return [...array].sort((a, b) => {
            let aVal = a[key];
            let bVal = b[key];
            
            // Converter para números se possível
            if (!isNaN(aVal) && !isNaN(bVal)) {
                aVal = parseFloat(aVal);
                bVal = parseFloat(bVal);
            }
            
            if (aVal < bVal) return order === 'asc' ? -1 : 1;
            if (aVal > bVal) return order === 'asc' ? 1 : -1;
            return 0;
        });
    }
    
    static filterBy(array, filters) {
        return array.filter(item => {
            return Object.entries(filters).every(([key, value]) => {
                if (value === undefined || value === null || value === '') return true;
                
                const itemValue = item[key];
                if (typeof value === 'function') {
                    return value(itemValue);
                }
                
                if (Array.isArray(value)) {
                    return value.includes(itemValue);
                }
                
                if (typeof itemValue === 'string' && typeof value === 'string') {
                    return itemValue.toLowerCase().includes(value.toLowerCase());
                }
                
                return itemValue === value;
            });
        });
    }

  static async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    static generateColorFromString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const hue = hash % 360;
        return `hsl(${hue}, 70%, 60%)`;
    }
    
    static getInitials(name) {
        return name
            .split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }
    
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    static isOnline() {
        return navigator.onLine;
    }
    
    static getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        
        if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Safari')) browser = 'Safari';
        else if (ua.includes('Edge')) browser = 'Edge';
        
        return {
            browser,
            mobile: this.isMobile(),
            online: this.isOnline(),
            language: navigator.language
        };
    }
}
```

