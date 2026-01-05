// calendar.js - CALENDÁRIO INTELIGENTE (Parte 1/5)
import { auth, db } from './firebase-config.js';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs,
    setDoc, 
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

class CalendarSystem {
    constructor() {
        this.currentUser = null;
        this.events = [];
        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
        this.selectedDate = null;
        this.init();
    }

    async init() {
        await this.loadCurrentUser();
    }

    async loadCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
    }

    async renderCalendarPage() {
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <div class="calendar-container">
                <!-- Cabeçalho do Calendário -->
                <div class="calendar-header">
                    <h2><i class="fas fa-calendar-alt"></i> Calendário</h2>
                    <div class="header-controls">
                        <button class="btn-secondary" onclick="calendarSystem.prevMonth()">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        
                        <h3 id="currentMonthYear">${this.getMonthName(this.currentMonth)} ${this.currentYear}</h3>
                        
                        <button class="btn-secondary" onclick="calendarSystem.nextMonth()">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    
                    <div class="header-actions">
                        <button class="btn-primary" onclick="calendarSystem.goToToday()">
                            <i class="fas fa-calendar-day"></i> Hoje
                        </button>
                        <button class="btn-primary" onclick="calendarSystem.showAddEventModal()">
                            <i class="fas fa-plus"></i> Novo Evento
                        </button>
                    </div>
                </div>

                <!-- Estação do Ano -->
                <div class="season-indicator">
                    <span id="seasonIcon">🌞</span>
                    <span id="seasonName">Verão</span>
                </div>

                <!-- Calendário -->
                <div class="calendar-grid" id="calendarGrid">
                    <!-- Dias da semana -->
                    <div class="weekday">Dom</div>
                    <div class="weekday">Seg</div>
                    <div class="weekday">Ter</div>
                    <div class="weekday">Qua</div>
                    <div class="weekday">Qui</div>
                    <div class="weekday">Sex</div>
                    <div class="weekday">Sáb</div>
                    
                    <!-- Dias serão renderizados aqui -->
                </div>

                <!-- Lista de Eventos do Mês -->
                <div class="month-events">
                    <h3><i class="fas fa-list"></i> Eventos deste Mês</h3>
                    <div class="events-list" id="eventsList">
                        <div class="loading-events">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>Carregando eventos...</p>
                        </div>
                    </div>
                </div>

                <!-- Comemorações do Dia -->
                <div class="celebrations-section">
                    <h3><i class="fas fa-globe"></i> Comemorações Hoje</h3>
                    <div class="celebrations-list" id="celebrationsList">
                        <div class="celebration-item">
                            <i class="fas fa-birthday-cake"></i>
                            <span>Dia do Programador</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.renderCalendar();
        this.loadEvents();
        this.updateSeason();
        this.addCalendarStyles();
    }

// Métodos de renderização do calendário
renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;

    // Limpar dias anteriores (mantendo os dias da semana)
    const days = calendarGrid.querySelectorAll('.calendar-day');
    days.forEach(day => day.remove());

    // Calcular primeiro dia do mês
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const startingDay = firstDay.getDay(); // 0 = Domingo
    
    // Quantidade de dias no mês
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    
    // Adicionar dias vazios no início
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Adicionar dias do mês
    const today = new Date();
    const todayString = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.dataset.day = day;
        dayElement.dataset.date = `${day}/${this.currentMonth + 1}/${this.currentYear}`;
        
        // Verificar se é hoje
        const dateString = `${day}/${this.currentMonth + 1}/${this.currentYear}`;
        if (dateString === todayString) {
            dayElement.classList.add('today');
        }
        
        // Verificar se é fim de semana
        const dayOfWeek = new Date(this.currentYear, this.currentMonth, day).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            dayElement.classList.add('weekend');
        }
        
        // Número do dia
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = day;
        
        // Indicadores de eventos
        const indicators = document.createElement('div');
        indicators.className = 'day-indicators';
        
        // Verificar eventos para este dia
        const dayEvents = this.getEventsForDay(day);
        dayEvents.forEach(event => {
            const indicator = document.createElement('div');
            indicator.className = `event-indicator ${event.type}`;
            indicator.title = event.title;
            indicators.appendChild(indicator);
        });
        
        // Fase da lua (simplificado)
        if (day === 1 || day === 15) {
            const moonIndicator = document.createElement('div');
            moonIndicator.className = 'moon-indicator';
            moonIndicator.innerHTML = day === 1 ? '🌑' : '🌕';
            moonIndicator.title = day === 1 ? 'Lua Nova' : 'Lua Cheia';
            dayElement.appendChild(moonIndicator);
        }
        
        dayElement.appendChild(dayNumber);
        dayElement.appendChild(indicators);
        
        // Evento de clique
        dayElement.addEventListener('click', () => {
            this.selectDate(day);
        });
        
        calendarGrid.appendChild(dayElement);
    }
    
    // Atualizar título
    document.getElementById('currentMonthYear').textContent = 
        `${this.getMonthName(this.currentMonth)} ${this.currentYear}`;
}

getEventsForDay(day) {
    return this.events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getDate() === day && 
               eventDate.getMonth() === this.currentMonth &&
               eventDate.getFullYear() === this.currentYear;
    });
}

getMonthName(monthIndex) {
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[monthIndex];
}

prevMonth() {
    this.currentMonth--;
    if (this.currentMonth < 0) {
        this.currentMonth = 11;
        this.currentYear--;
    }
    this.renderCalendar();
    this.loadEvents();
}

nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
        this.currentMonth = 0;
        this.currentYear++;
    }
    this.renderCalendar();
    this.loadEvents();
}

goToToday() {
    const today = new Date();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();
    this.renderCalendar();
    this.loadEvents();
    this.updateSeason();
}

updateSeason() {
    const season = this.getSeason(this.currentMonth);
    const seasonIcon = document.getElementById('seasonIcon');
    const seasonName = document.getElementById('seasonName');
    
    if (seasonIcon && seasonName) {
        seasonIcon.textContent = season.emoji;
        seasonName.textContent = season.name;
    }
}

getSeason(month) {
    // Hemisfério sul
    switch(month) {
        case 11: // Dezembro
        case 0:  // Janeiro
        case 1:  // Fevereiro
            return { name: 'Verão', emoji: '☀️' };
        case 2:  // Março
        case 3:  // Abril
        case 4:  // Maio
            return { name: 'Outono', emoji: '🍂' };
        case 5:  // Junho
        case 6:  // Julho
        case 7:  // Agosto
            return { name: 'Inverno', emoji: '❄️' };
        case 8:  // Setembro
        case 9:  // Outubro
        case 10: // Novembro
            return { name: 'Primavera', emoji: '🌸' };
        default:
            return { name: 'Verão', emoji: '☀️' };
    }
}

// Métodos de eventos
async loadEvents() {
    try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        const eventsRef = collection(db, 'users', userId, 'events');
        const q = query(eventsRef, orderBy('date'));
        const snapshot = await getDocs(q);
        
        this.events = [];
        snapshot.forEach(doc => {
            this.events.push({ id: doc.id, ...doc.data() });
        });
        
        this.renderCalendar();
        this.renderEventsList();
        
    } catch (error) {
        console.error('Erro ao carregar eventos:', error);
    }
}

renderEventsList() {
    const eventsList = document.getElementById('eventsList');
    if (!eventsList) return;

    const monthEvents = this.events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getMonth() === this.currentMonth &&
               eventDate.getFullYear() === this.currentYear;
    });

    if (monthEvents.length === 0) {
        eventsList.innerHTML = `
            <div class="empty-events">
                <i class="fas fa-calendar-times"></i>
                <p>Nenhum evento este mês</p>
            </div>
        `;
        return;
    }

    eventsList.innerHTML = monthEvents.map(event => `
        <div class="event-item" data-id="${event.id}">
            <div class="event-color ${event.type}"></div>
            <div class="event-details">
                <div class="event-header">
                    <h4>${event.title}</h4>
                    <span class="event-date">${this.formatEventDate(event.date)}</span>
                </div>
                <p class="event-description">${event.description || 'Sem descrição'}</p>
                ${event.location ? `<p class="event-location"><i class="fas fa-map-marker-alt"></i> ${event.location}</p>` : ''}
            </div>
            <div class="event-actions">
                <button class="action-btn" onclick="calendarSystem.editEvent('${event.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn" onclick="calendarSystem.deleteEvent('${event.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

formatEventDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    });
}

selectDate(day) {
    this.selectedDate = new Date(this.currentYear, this.currentMonth, day);
    
    // Destacar dia selecionado
    document.querySelectorAll('.calendar-day.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    const selectedElement = document.querySelector(`.calendar-day[data-day="${day}"]`);
    if (selectedElement) {
        selectedElement.classList.add('selected');
    }
    
    this.showDayEvents(day);
}

showDayEvents(day) {
    const dayEvents = this.getEventsForDay(day);
    
    if (dayEvents.length === 0) {
        this.showMessage('Nenhum evento para este dia', 'info');
        return;
    }
    
    const eventsHtml = dayEvents.map(event => `
        <div class="day-event-item">
            <span class="event-type ${event.type}"></span>
            <div>
                <strong>${event.title}</strong>
                <p>${event.description || ''}</p>
                <small>${event.time || 'Dia todo'}</small>
            </div>
        </div>
    `).join('');
    
    const modalHtml = `
        <div class="modal-overlay active" id="dayEventsModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Eventos do Dia ${day}</h3>
                    <button class="close-modal" onclick="calendarSystem.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    ${eventsHtml}
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="calendarSystem.closeModal()">
                            Fechar
                        </button>
                        <button class="btn-primary" onclick="calendarSystem.showAddEventModal(${day})">
                            <i class="fas fa-plus"></i> Novo Evento
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

showAddEventModal(day = null) {
    const defaultDate = day ? 
        `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` :
        '';
    
    const modalHtml = `
        <div class="modal-overlay active" id="addEventModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Novo Evento</h3>
                    <button class="close-modal" onclick="calendarSystem.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <div class="form-group">
                        <label>Título do Evento *</label>
                        <input type="text" id="eventTitle" placeholder="Nome do evento" required>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Data *</label>
                            <input type="date" id="eventDate" value="${defaultDate}" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Hora</label>
                            <input type="time" id="eventTime">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Tipo de Evento</label>
                        <select id="eventType">
                            <option value="event">Evento</option>
                            <option value="birthday">Aniversário</option>
                            <option value="meeting">Reunião</option>
                            <option value="reminder">Lembrete</option>
                            <option value="holiday">Feriado</option>
                            <option value="personal">Pessoal</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Descrição</label>
                        <textarea id="eventDescription" rows="3" placeholder="Detalhes do evento"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label>Local</label>
                        <input type="text" id="eventLocation" placeholder="Local do evento">
                    </div>
                    
                    <div class="form-group">
                        <label>Cor do Evento</label>
                        <input type="color" id="eventColor" value="#FFD700">
                    </div>
                    
                    <div class="checkbox-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="eventRecurring">
                            <span>Evento recorrente</span>
                        </label>
                        
                        <label class="checkbox-label">
                            <input type="checkbox" id="eventNotify">
                            <span>Receber notificação</span>
                        </label>
                    </div>
                    
                    <div class="form-actions">
                        <button class="btn-secondary" onclick="calendarSystem.closeModal()">
                            Cancelar
                        </button>
                        <button class="btn-primary" onclick="calendarSystem.saveEvent()">
                            <i class="fas fa-save"></i> Salvar Evento
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Métodos de CRUD de eventos
async saveEvent() {
    const title = document.getElementById('eventTitle').value;
    const date = document.getElementById('eventDate').value;
    
    if (!title || !date) {
        this.showMessage('Título e data são obrigatórios', 'error');
        return;
    }

    try {
        const userId = localStorage.getItem('userId');
        const eventId = Date.now().toString();
        
        const eventData = {
            id: eventId,
            title: title,
            date: date,
            time: document.getElementById('eventTime').value || '',
            type: document.getElementById('eventType').value,
            description: document.getElementById('eventDescription').value || '',
            location: document.getElementById('eventLocation').value || '',
            color: document.getElementById('eventColor').value,
            recurring: document.getElementById('eventRecurring').checked,
            notify: document.getElementById('eventNotify').checked,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const eventRef = doc(db, 'users', userId, 'events', eventId);
        await setDoc(eventRef, eventData);
        
        this.showMessage('Evento salvo com sucesso!', 'success');
        this.closeModal();
        this.loadEvents();
        
    } catch (error) {
        console.error('Erro ao salvar evento:', error);
        this.showMessage('Erro ao salvar evento', 'error');
    }
}

async editEvent(eventId) {
    try {
        const userId = localStorage.getItem('userId');
        const eventRef = doc(db, 'users', userId, 'events', eventId);
        const eventDoc = await getDoc(eventRef);
        
        if (!eventDoc.exists()) {
            this.showMessage('Evento não encontrado', 'error');
            return;
        }
        
        const event = eventDoc.data();
        this.showEditEventModal(event);
        
    } catch (error) {
        console.error('Erro ao editar evento:', error);
        this.showMessage('Erro ao carregar evento', 'error');
    }
}

showEditEventModal(event) {
    const modalHtml = `
        <div class="modal-overlay active" id="editEventModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Editar Evento</h3>
                    <button class="close-modal" onclick="calendarSystem.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <!-- Formulário similar ao addEvent, mas preenchido -->
                    <div class="form-group">
                        <label>Título do Evento *</label>
                        <input type="text" id="editEventTitle" value="${event.title}" required>
                    </div>
                    
                    <div class="form-actions">
                        <button class="btn-danger" onclick="calendarSystem.deleteEvent('${event.id}')">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                        <button class="btn-secondary" onclick="calendarSystem.closeModal()">
                            Cancelar
                        </button>
                        <button class="btn-primary" onclick="calendarSystem.updateEvent('${event.id}')">
                            <i class="fas fa-save"></i> Atualizar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

async updateEvent(eventId) {
    // Implementação similar ao saveEvent
    this.showMessage('Funcionalidade em desenvolvimento', 'info');
}

async deleteEvent(eventId) {
    if (!confirm('Tem certeza que deseja excluir este evento?')) {
        return;
    }

    try {
        const userId = localStorage.getItem('userId');
        const eventRef = doc(db, 'users', userId, 'events', eventId);
        await deleteDoc(eventRef);
        
        this.showMessage('Evento excluído com sucesso', 'success');
        this.closeModal();
        this.loadEvents();
        
    } catch (error) {
        console.error('Erro ao excluir evento:', error);
        this.showMessage('Erro ao excluir evento', 'error');
    }
}

closeModal() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => modal.remove());
}

showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    messageDiv.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${type === 'success' ? '#28A745' : type === 'error' ? '#DC3545' : '#17A2B8'};
        color: white;
        padding: 12px 20px;
        border-radius: var(--border-radius);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'slideIn 0.3s ease reverse forwards';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

    addCalendarStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .calendar-container {
                animation: fadeIn 0.3s ease;
            }
            
            .calendar-header {
                margin-bottom: var(--spacing-lg);
            }
            
            .calendar-header h2 {
                font-size: 1.5rem;
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                margin-bottom: var(--spacing-md);
            }
            
            .header-controls {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: var(--spacing-lg);
                margin-bottom: var(--spacing-md);
            }
            
            .header-controls button {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                padding: 0;
            }
            
            .header-controls h3 {
                font-size: 1.2rem;
                min-width: 200px;
                text-align: center;
            }
            
            .header-actions {
                display: flex;
                gap: var(--spacing-md);
                justify-content: center;
                flex-wrap: wrap;
            }
            
            .season-indicator {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: var(--spacing-sm);
                background: var(--surface-color);
                padding: var(--spacing-sm) var(--spacing-md);
                border-radius: var(--border-radius);
                margin-bottom: var(--spacing-lg);
                border: 1px solid var(--border-color);
            }
            
            #seasonIcon {
                font-size: 1.5rem;
            }
            
            #seasonName {
                font-weight: 600;
                color: var(--primary-color);
            }
            
            .calendar-grid {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 2px;
                margin-bottom: var(--spacing-xl);
                background: var(--border-color);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius);
                overflow: hidden;
            }
            
            .weekday {
                background: var(--surface-color);
                text-align: center;
                padding: var(--spacing-sm);
                font-weight: 600;
                color: var(--text-color);
                border-bottom: 1px solid var(--border-color);
            }
            
            .calendar-day {
                background: var(--background-color);
                min-height: 80px;
                padding: var(--spacing-sm);
                position: relative;
                cursor: pointer;
                transition: var(--transition);
                border: 1px solid transparent;
            }
            
            .calendar-day:hover {
                background: var(--surface-color);
                border-color: var(--primary-color);
            }
            
            .calendar-day.empty {
                background: var(--surface-color);
                cursor: default;
            }
            
            .calendar-day.today {
                background: rgba(255, 215, 0, 0.1);
                border-color: var(--primary-color);
            }
            
            .calendar-day.weekend {
                background: rgba(0, 0, 0, 0.02);
            }
            
            .calendar-day.selected {
                background: rgba(255, 215, 0, 0.2);
                border: 2px solid var(--primary-color);
            }
            
            .day-number {
                font-size: 1.1rem;
                font-weight: 600;
                margin-bottom: var(--spacing-xs);
            }
            
            .day-indicators {
                display: flex;
                flex-direction: column;
                gap: 2px;
                position: absolute;
                bottom: 4px;
                left: 4px;
                right: 4px;
            }
            
            .event-indicator {
                height: 4px;
                border-radius: 2px;
                width: 100%;
            }
            
            .event-indicator.event {
                background: #4285F4;
            }
            
            .event-indicator.birthday {
                background: #EA4335;
            }
            
            .event-indicator.meeting {
                background: #34A853;
            }
            
            .event-indicator.holiday {
                background: #FBBC05;
            }
            
            .moon-indicator {
                position: absolute;
                top: 4px;
                right: 4px;
                font-size: 0.8rem;
            }
            
            .month-events, .celebrations-section {
                background: var(--surface-color);
                padding: var(--spacing-lg);
                border-radius: var(--border-radius);
                margin-bottom: var(--spacing-lg);
                border: 1px solid var(--border-color);
            }
            
            .month-events h3, .celebrations-section h3 {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                margin-bottom: var(--spacing-md);
                font-size: 1.1rem;
            }
            
            .events-list {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-md);
            }
            
            .event-item {
                display: flex;
                align-items: center;
                gap: var(--spacing-md);
                padding: var(--spacing-md);
                background: var(--background-color);
                border-radius: var(--border-radius);
                border: 1px solid var(--border-color);
            }
            
            .event-color {
                width: 8px;
                height: 100%;
                min-height: 40px;
                border-radius: 4px;
                flex-shrink: 0;
            }
            
            .event-details {
                flex: 1;
                min-width: 0;
            }
            
            .event-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 4px;
            }
            
            .event-header h4 {
                font-size: 1rem;
                font-weight: 600;
                margin-right: var(--spacing-sm);
            }
            
            .event-date {
                font-size: 0.8rem;
                color: var(--text-secondary);
                flex-shrink: 0;
            }
            
            .event-description {
                font-size: 0.9rem;
                color: var(--text-secondary);
                margin-bottom: 4px;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            
            .event-location {
                font-size: 0.8rem;
                color: var(--text-secondary);
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .event-actions {
                display: flex;
                gap: var(--spacing-xs);
            }
            
            .empty-events {
                text-align: center;
                padding: var(--spacing-xl);
                color: var(--text-secondary);
            }
            
            .empty-events i {
                font-size: 2rem;
                margin-bottom: var(--spacing-sm);
            }
            
            .celebrations-list {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-sm);
            }
            
            .celebration-item {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                padding: var(--spacing-sm);
                background: var(--background-color);
                border-radius: var(--border-radius);
            }
            
            .day-event-item {
                display: flex;
                align-items: center;
                gap: var(--spacing-md);
                padding: var(--spacing-md);
                margin-bottom: var(--spacing-sm);
                background: var(--surface-color);
                border-radius: var(--border-radius);
            }
            
            @media (max-width: 768px) {
                .calendar-day {
                    min-height: 60px;
                    padding: 4px;
                }
                
                .day-number {
                    font-size: 0.9rem;
                }
                
                .event-indicator {
                    height: 3px;
                }
                
                .event-item {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .event-actions {
                    align-self: flex-end;
                }
            }
            
            @media (max-width: 480px) {
                .calendar-grid {
                    gap: 1px;
                }
                
                .calendar-day {
                    min-height: 50px;
                }
                
                .day-indicators {
                    display: none;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// Inicializar sistema de calendário
const calendarSystem = new CalendarSystem();
window.calendarSystem = calendarSystem;

// Integração com o app principal
if (typeof app !== 'undefined') {
    app.renderCalendarPage = async function() {
        await calendarSystem.renderCalendarPage();
    };
}

export default calendarSystem;