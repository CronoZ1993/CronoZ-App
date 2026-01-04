// calendar.js - Calendário Inteligente
class CalendarModule {
    constructor(app) {
        this.app = app;
        this.currentDate = new Date();
        this.view = 'month'; // month, week, day
        this.events = [];
        this.holidays = {};
        
        this.init();
    }
    
    async init() {
        await this.loadEvents();
        await this.loadHolidays();
        this.render();
        this.setupEventListeners();
    }
    
    async loadEvents() {
        try {
            const user = this.app.user;
            if (user) {
                const eventsRef = ref(db, `users/${user.uid}/events`);
                const snapshot = await get(eventsRef);
                
                if (snapshot.exists()) {
                    this.events = Object.values(snapshot.val());
                } else {
                    this.events = this.getSampleEvents();
                }
            }
        } catch (error) {
            console.error('Erro ao carregar eventos:', error);
            this.events = this.getSampleEvents();
        }
    }
    
    async loadHolidays() {
        try {
            const currentYear = this.currentDate.getFullYear();
            const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${currentYear}/BR`);
            this.holidays = await response.json();
        } catch (error) {
            console.warn('Não foi possível carregar feriados:', error);
            this.holidays = {};
        }
    }
    
    getSampleEvents() {
        return [
            {
                id: 1,
                title: 'Reunião de Trabalho',
                description: 'Reunião semanal com a equipe',
                start: '2024-01-15T10:00:00',
                end: '2024-01-15T11:00:00',
                color: '#4CAF50',
                type: 'work',
                recurring: 'weekly',
                alarm: '15 minutes',
                guests: ['user1', 'user2']
            },
            {
                id: 2,
                title: 'Aniversário João',
                description: 'Aniversário do João Silva',
                start: '2024-01-20T00:00:00',
                end: '2024-01-20T23:59:59',
                color: '#FF9800',
                type: 'birthday',
                recurring: 'yearly',
                alarm: '1 day'
            }
        ];
    }

getMoonPhase(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        // Cálculo simplificado da fase da lua
        const phases = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
        const cycle = 29.53;
        const knownNewMoon = new Date('2024-01-11');
        const diff = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
        const phaseIndex = Math.floor((diff % cycle) / cycle * 8) % 8;
        
        return {
            phase: phases[phaseIndex],
            index: phaseIndex,
            name: ['Nova', 'Crescente', 'Quarto Crescente', 'Gibosa Crescente', 
                   'Cheia', 'Gibosa Minguante', 'Quarto Minguante', 'Minguante'][phaseIndex]
        };
    }
    
    getBirthdays(date) {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        return this.app.modules.contacts.contacts.filter(contact => {
            if (contact.birthday) {
                const bd = new Date(contact.birthday);
                return bd.getMonth() + 1 === month && bd.getDate() === day;
            }
            return false;
        });
    }
    
    render() {
        const container = document.getElementById('calendar-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="calendar-header">
                <h2>Calendário</h2>
                <div class="calendar-controls">
                    <button class="btn btn-secondary" id="prev-period">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    
                    <div class="view-selector">
                        <button class="view-btn ${this.view === 'month' ? 'active' : ''}" data-view="month">
                            Mês
                        </button>
                        <button class="view-btn ${this.view === 'week' ? 'active' : ''}" data-view="week">
                            Semana
                        </button>
                        <button class="view-btn ${this.view === 'day' ? 'active' : ''}" data-view="day">
                            Dia
                        </button>
                    </div>
                    
                    <h3 id="current-period">Janeiro 2024</h3>
                    
                    <button class="btn btn-secondary" id="next-period">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                    
                    <button class="btn btn-primary" id="today-btn">
                        Hoje
                    </button>
                    
                    <button class="btn btn-primary" id="add-event-btn">
                        <i class="fas fa-plus"></i> Novo Evento
                    </button>
                </div>
            </div>
            
            <div class="calendar-view" id="calendar-view">
                <!-- Vista do calendário será renderizada aqui -->
            </div>
            
            <!-- Modal de evento -->
            <div class="modal" id="event-modal">
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h3 id="modal-title">Novo Evento</h3>
                    <form id="event-form">
                        <input type="hidden" id="event-id">
                        
                        <div class="form-group">
                            <label for="event-title">Título *</label>
                            <input type="text" id="event-title" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="event-description">Descrição</label>
                            <textarea id="event-description" rows="3"></textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="event-start">Início</label>
                                <input type="datetime-local" id="event-start" required>
                            </div>
                            <div class="form-group">
                                <label for="event-end">Fim</label>
                                <input type="datetime-local" id="event-end" required>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="event-color">Cor</label>
                                <input type="color" id="event-color" value="#4CAF50">
                            </div>
                            <div class="form-group">
                                <label for="event-type">Tipo</label>
                                <select id="event-type">
                                    <option value="personal">Pessoal</option>
                                    <option value="work">Trabalho</option>
                                    <option value="birthday">Aniversário</option>
                                    <option value="holiday">Feriado</option>
                                    <option value="other">Outro</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="event-recurring">Recorrência</label>
                                <select id="event-recurring">
                                    <option value="none">Nenhuma</option>
                                    <option value="daily">Diário</option>
                                    <option value="weekly">Semanal</option>
                                    <option value="monthly">Mensal</option>
                                    <option value="yearly">Anual</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="event-alarm">Alarme</label>
                                <select id="event-alarm">
                                    <option value="none">Nenhum</option>
                                    <option value="5 minutes">5 minutos antes</option>
                                    <option value="15 minutes">15 minutos antes</option>
                                    <option value="30 minutes">30 minutos antes</option>
                                    <option value="1 hour">1 hora antes</option>
                                    <option value="1 day">1 dia antes</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="event-guests">Convidados</label>
                            <select id="event-guests" multiple>
                                ${this.app.modules.contacts.contacts.map(contact => 
                                    `<option value="${contact.id}">${contact.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" id="cancel-event">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        this.renderView();
    }
    
    renderView() {
        const view = document.getElementById('calendar-view');
        if (!view) return;
        
        switch (this.view) {
            case 'month':
                this.renderMonthView();
                break;
            case 'week':
                this.renderWeekView();
                break;
            case 'day':
                this.renderDayView();
                break;
        }
    }
    
    renderMonthView() {
        const view = document.getElementById('calendar-view');
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Atualizar título
        document.getElementById('current-period').textContent = 
            this.currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        
        // Criar grade do mês
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDay = firstDay.getDay();
        
        const moonPhase = this.getMoonPhase(this.currentDate);
        
        let html = `
            <div class="month-header">
                <div class="moon-phase">
                    ${moonPhase.phase} ${moonPhase.name}
                </div>
                <div class="week-days">
                    ${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => `
                        <div class="week-day">${day}</div>
                    `).join('')}
                </div>
            </div>
            <div class="month-grid">
        `;

    // Dias vazios no início
        for (let i = 0; i < startDay; i++) {
            html += `<div class="day empty"></div>`;
        }
        
        // Dias do mês
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = this.isToday(date);
            const birthdays = this.getBirthdays(date);
            const events = this.getEventsForDate(date);
            const holiday = this.getHoliday(date);
            
            html += `
                <div class="day ${isToday ? 'today' : ''} ${holiday ? 'holiday' : ''}">
                    <div class="day-header">
                        <span class="day-number">${day}</span>
                        ${holiday ? `<span class="holiday-badge">${holiday.localName}</span>` : ''}
                    </div>
                    
                    <div class="day-events">
                        ${birthdays.map(bd => `
                            <div class="event birthday" title="${bd.name} - Aniversário">
                                🎂 ${bd.name}
                            </div>
                        `).join('')}
                        
                        ${events.map(event => `
                            <div class="event" style="border-left-color: ${event.color};" 
                                 title="${event.title} - ${event.description}">
                                ${event.title}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        html += `</div>`;
        view.innerHTML = html;
    }
    
    renderWeekView() {
        const view = document.getElementById('calendar-view');
        const startOfWeek = this.getStartOfWeek(this.currentDate);
        
        document.getElementById('current-period').textContent = 
            `Semana ${this.getWeekNumber(this.currentDate)}`;
        
        let html = `<div class="week-view">`;
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            
            const events = this.getEventsForDate(date);
            const isToday = this.isToday(date);
            
            html += `
                <div class="week-day-column ${isToday ? 'today' : ''}">
                    <div class="week-day-header">
                        <div class="day-name">${date.toLocaleDateString('pt-BR', { weekday: 'short' })}</div>
                        <div class="day-number ${isToday ? 'today-circle' : ''}">${date.getDate()}</div>
                    </div>
                    
                    <div class="week-day-events">
                        ${events.map(event => `
                            <div class="week-event" style="background-color: ${event.color}20; border-left-color: ${event.color};">
                                <div class="event-time">
                                    ${new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div class="event-title">${event.title}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

    html += `</div>`;
        view.innerHTML = html;
    }
    
    renderDayView() {
        const view = document.getElementById('calendar-view');
        const date = this.currentDate;
        
        document.getElementById('current-period').textContent = 
            date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        
        const events = this.getEventsForDate(date);
        
        let html = `
            <div class="day-view">
                <div class="day-summary">
                    <div class="moon-phase">
                        ${this.getMoonPhase(date).phase} ${this.getMoonPhase(date).name}
                    </div>
                    <div class="birthdays">
                        ${this.getBirthdays(date).map(bd => `
                            <div class="birthday-item">
                                🎂 ${bd.name} faz aniversário hoje!
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="hourly-schedule">
                    ${Array.from({ length: 24 }, (_, hour) => {
                        const hourEvents = events.filter(event => {
                            const eventHour = new Date(event.start).getHours();
                            return eventHour === hour;
                        });
                        
                        return `
                            <div class="hour-row">
                                <div class="hour-label">${hour.toString().padStart(2, '0')}:00</div>
                                <div class="hour-events">
                                    ${hourEvents.map(event => `
                                        <div class="hour-event" style="background-color: ${event.color}40;">
                                            <strong>${event.title}</strong>
                                            <p>${event.description || ''}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        view.innerHTML = html;
    }
    
    getEventsForDate(date) {
        return this.events.filter(event => {
            const eventDate = new Date(event.start);
            return eventDate.getDate() === date.getDate() &&
                   eventDate.getMonth() === date.getMonth() &&
                   eventDate.getFullYear() === date.getFullYear();
        });
    }
    
    getHoliday(date) {
        if (Array.isArray(this.holidays)) {
            return this.holidays.find(h => 
                new Date(h.date).toDateString() === date.toDateString()
            );
        }
        return null;
    }
    
    getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }
    
    getWeekNumber(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return weekNo;
    }
    
    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

async addEvent(eventData) {
        const event = {
            id: Date.now(),
            ...eventData,
            createdAt: new Date().toISOString()
        };
        
        this.events.push(event);
        await this.saveEvent(event);
        this.renderView();
        
        // Configurar alarme
        if (event.alarm && event.alarm !== 'none') {
            this.setAlarm(event);
        }
    }
    
    async saveEvent(event) {
        try {
            const user = this.app.user;
            if (user) {
                const eventRef = ref(db, `users/${user.uid}/events/${event.id}`);
                await set(eventRef, event);
            }
        } catch (error) {
            console.error('Erro ao salvar evento:', error);
        }
    }
    
    setAlarm(event) {
        const eventTime = new Date(event.start);
        let alarmTime = eventTime;
        
        switch (event.alarm) {
            case '5 minutes':
                alarmTime.setMinutes(eventTime.getMinutes() - 5);
                break;
            case '15 minutes':
                alarmTime.setMinutes(eventTime.getMinutes() - 15);
                break;
            case '30 minutes':
                alarmTime.setMinutes(eventTime.getMinutes() - 30);
                break;
            case '1 hour':
                alarmTime.setHours(eventTime.getHours() - 1);
                break;
            case '1 day':
                alarmTime.setDate(eventTime.getDate() - 1);
                break;
        }
        
        const now = new Date();
        const delay = alarmTime - now;
        
        if (delay > 0) {
            setTimeout(() => {
                this.showNotification(event);
            }, delay);
        }
    }
    
    showNotification(event) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Lembrete: ${event.title}`, {
                body: event.description || 'Evento está prestes a começar',
                icon: '/assets/icon.png'
            });
        }
    }
    
    async exportToPDF() {
        // Implementar exportação para PDF usando jsPDF
        console.log('Exportando calendário para PDF...');
    }
    
    async shareCalendar() {
        // Implementar compartilhamento de calendário
        console.log('Compartilhando calendário...');
    }
    
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            // Navegação
            if (e.target.id === 'prev-period') {
                this.navigate(-1);
            }
            
            if (e.target.id === 'next-period') {
                this.navigate(1);
            }
            
            if (e.target.id === 'today-btn') {
                this.currentDate = new Date();
                this.renderView();
            }
            
            // Mudar vista
            if (e.target.closest('.view-btn')) {
                const view = e.target.closest('.view-btn').dataset.view;
                this.view = view;
                this.renderView();
            }
            
            // Adicionar evento
            if (e.target.id === 'add-event-btn') {
                this.openEventModal();
            }

            // Clicar em um dia no mês
            if (e.target.closest('.day:not(.empty)')) {
                const dayElement = e.target.closest('.day');
                const dayNumber = dayElement.querySelector('.day-number').textContent;
                const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), parseInt(dayNumber));
                
                this.currentDate = date;
                this.view = 'day';
                this.renderView();
            }
        });
    }
    
    navigate(direction) {
        switch (this.view) {
            case 'month':
                this.currentDate.setMonth(this.currentDate.getMonth() + direction);
                break;
            case 'week':
                this.currentDate.setDate(this.currentDate.getDate() + (direction * 7));
                break;
            case 'day':
                this.currentDate.setDate(this.currentDate.getDate() + direction);
                break;
        }
        this.renderView();
    }
    
    openEventModal(eventId = null) {
        // Implementar abertura do modal de evento
        console.log('Abrir modal de evento:', eventId);
    }
    
    show() {
        document.getElementById('calendar-container').style.display = 'block';
        this.render();
    }
    
    hide() {
        const container = document.getElementById('calendar-container');
        if (container) {
            container.style.display = 'none';
        }
    }
}
```
