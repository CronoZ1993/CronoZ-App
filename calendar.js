// calendar.js - Sistema de calendário inteligente
import { auth, db } from './firebase-config.js';
import { 
    collection, doc, setDoc, getDoc, updateDoc, 
    deleteDoc, query, where, orderBy, onSnapshot 
} from './firebase-config.js';
import { showLoading, hideLoading, showToast, formatDate } from './utils.js';

class CalendarSystem {
    constructor() {
        this.currentDate = new Date();
        this.events = [];
        this.selectedDate = null;
        this.init();
    }
    
    init() {
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.loadEvents();
                this.setupEventListeners();
                this.renderCalendar();
            }
        });
    }
    
    setupEventListeners() {
        // Navigation buttons
        const prevBtn = document.getElementById('btn-prev-month');
        const nextBtn = document.getElementById('btn-next-month');
        const todayBtn = document.getElementById('btn-today');
        const addEventBtn = document.getElementById('btn-add-event');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevMonth());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextMonth());
        if (todayBtn) todayBtn.addEventListener('click', () => this.goToToday());
        if (addEventBtn) addEventBtn.addEventListener('click', () => this.openAddEventModal());
        
        // View selector
        const viewSelect = document.getElementById('calendar-view');
        if (viewSelect) {
            viewSelect.addEventListener('change', (e) => {
                this.changeView(e.target.value);
            });
        }
        
        // Export button
        const exportBtn = document.getElementById('btn-export-calendar');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportCalendar());
        }
    }
    
    prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }
    
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }
    
    goToToday() {
        this.currentDate = new Date();
        this.renderCalendar();
    }
    
    changeView(view) {
        // Implement different view modes
        console.log('Mudando para visualização:', view);
        // This would change the calendar rendering
    }
    
    async loadEvents() {
        if (!auth.currentUser) return;
        
        const userId = auth.currentUser.uid;
        const eventsRef = collection(db, 'users', userId, 'events');
        const q = query(eventsRef, orderBy('date'));
        
        onSnapshot(q, (snapshot) => {
            this.events = [];
            snapshot.forEach(doc => {
                this.events.push({ id: doc.id, ...doc.data() });
            });
            this.renderCalendar();
            this.renderEventsList();
        });
    }
    
    renderCalendar() {
        const monthElement = document.getElementById('current-month');
        const calendarGrid = document.getElementById('calendar-grid');
        
        if (!monthElement || !calendarGrid) return;
        
        // Month title
        const monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        
        const monthName = monthNames[this.currentDate.getMonth()];
        const year = this.currentDate.getFullYear();
        monthElement.textContent = `${monthName} ${year}`;
        
        // Get first and last day of month
        const firstDay = new Date(year, this.currentDate.getMonth(), 1);
        const lastDay = new Date(year, this.currentDate.getMonth() + 1, 0);
        const daysInMonth = lastDay.getDate();
        const firstDayIndex = firstDay.getDay();
        
        // Today for comparison
        const today = new Date();
        const isTodayMonth = today.getMonth() === this.currentDate.getMonth() && 
                            today.getFullYear() === year;
        
        let calendarHTML = '';
        
        // Previous month days
        const prevMonthLastDay = new Date(year, this.currentDate.getMonth(), 0).getDate();
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            const date = prevMonthLastDay - i;
            calendarHTML += `
                <div class="calendar-day other-month">
                    <div class="date">${date}</div>
                </div>
            `;
        }
        
        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, this.currentDate.getMonth(), day);
            const dateStr = date.toISOString().split('T')[0];
            const isToday = isTodayMonth && day === today.getDate();
            
            // Get events for this day
            const dayEvents = this.getEventsForDate(date);
            const hasBirthday = dayEvents.some(e => e.type === 'birthday');
            const hasEvent = dayEvents.some(e => e.type === 'event');
            const hasHoliday = dayEvents.some(e => e.type === 'holiday');
            
            calendarHTML += `
                <div class="calendar-day ${isToday ? 'today' : ''}" 
                     data-date="${dateStr}"
                     data-day="${day}">
                    <div class="date">${day}</div>
                    <div class="day-events">
                        ${hasBirthday ? '<span class="event-indicator birthday" title="Aniversário"></span>' : ''}
                        ${hasEvent ? '<span class="event-indicator event" title="Evento"></span>' : ''}
                        ${hasHoliday ? '<span class="event-indicator holiday" title="Feriado"></span>' : ''}
                    </div>
                </div>
            `;
        }
        
        // Next month days
        const totalCells = 42; // 6 weeks
        const nextMonthDays = totalCells - (firstDayIndex + daysInMonth);
        for (let day = 1; day <= nextMonthDays; day++) {
            calendarHTML += `
                <div class="calendar-day other-month">
                    <div class="date">${day}</div>
                </div>
            `;
        }
        
        calendarGrid.innerHTML = calendarHTML;
        
        // Add click events
        calendarGrid.querySelectorAll('.calendar-day:not(.other-month)').forEach(day => {
            day.addEventListener('click', () => {
                const dateStr = day.dataset.date;
                const date = new Date(dateStr);
                this.openDayEvents(date);
            });
        });
    }
    
    getEventsForDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.events.filter(event => {
            const eventDate = new Date(event.date).toISOString().split('T')[0];
            return eventDate === dateStr;
        });
    }

renderEventsList() {
    const container = document.getElementById('month-events');
    if (!container) return;
    
    // Filter events for current month
    const currentMonth = this.currentDate.getMonth();
    const currentYear = this.currentDate.getFullYear();
    
    const monthEvents = this.events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.getMonth() === currentMonth && 
               eventDate.getFullYear() === currentYear;
    });
    
    if (monthEvents.length === 0) {
        container.innerHTML = '<p>Nenhum evento este mês</p>';
        return;
    }
    
    // Sort by date
    monthEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    container.innerHTML = monthEvents.map(event => {
        const eventDate = new Date(event.date);
        const day = eventDate.getDate();
        const month = eventDate.getMonth() + 1;
        
        const color = this.getEventColor(event.type);
        
        return `
            <div class="event-item" data-event-id="${event.id}">
                <div class="event-color" style="background: ${color}"></div>
                <div class="event-details">
                    <div class="event-name">${event.title}</div>
                    <div class="event-time">
                        <i class="fas fa-calendar"></i> ${day}/${month.toString().padStart(2, '0')}
                        ${event.time ? ` • ${event.time}` : ''}
                    </div>
                </div>
                <button class="event-action-btn" title="Ver detalhes">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    }).join('');
    
    // Add click events
    container.querySelectorAll('.event-item').forEach(item => {
        item.addEventListener('click', () => {
            const eventId = item.dataset.eventId;
            const event = this.events.find(e => e.id === eventId);
            if (event) this.openEventDetails(event);
        });
    });
}

getEventColor(eventType) {
    const colors = {
        'birthday': '#FF6B6B',
        'event': '#4ECDC4',
        'meeting': '#45B7D1',
        'holiday': '#96CEB4',
        'other': '#FFEAA7'
    };
    return colors[eventType] || '#95A5A6';
}

openDayEvents(date) {
    this.selectedDate = date;
    const dayEvents = this.getEventsForDate(date);
    
    const modalContent = `
        <div class="day-events-modal">
            <h3><i class="fas fa-calendar-day"></i> ${formatDate(date, 'full')}</h3>
            
            ${dayEvents.length === 0 ? 
                '<p class="no-events">Nenhum evento para esta data</p>' : 
                `<div class="day-events-list">
                    ${dayEvents.map(event => `
                        <div class="day-event-item" data-event-id="${event.id}">
                            <div class="day-event-color" style="background: ${this.getEventColor(event.type)}"></div>
                            <div class="day-event-info">
                                <h4>${event.title}</h4>
                                <p>${event.description || 'Sem descrição'}</p>
                                ${event.time ? `<p><i class="fas fa-clock"></i> ${event.time}</p>` : ''}
                            </div>
                            <div class="day-event-actions">
                                <button class="btn-small btn-edit-event" data-event-id="${event.id}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn-small btn-delete-event" data-event-id="${event.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>`
            }
            
            <div class="modal-actions">
                <button type="button" class="btn-secondary close-modal">Fechar</button>
                <button type="button" class="btn-primary" id="btn-add-event-to-day">
                    <i class="fas fa-plus"></i> Adicionar Evento
                </button>
            </div>
        </div>
    `;
    
    this.showModal('Eventos do Dia', modalContent);
    
    // Add event buttons
    document.getElementById('btn-add-event-to-day')?.addEventListener('click', () => {
        this.closeModal();
        this.openAddEventModal(date);
    });
    
    // Edit/delete buttons
    document.querySelectorAll('.btn-edit-event').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const eventId = btn.dataset.eventId;
            const event = this.events.find(e => e.id === eventId);
            if (event) this.openEditEventModal(event);
        });
    });
    
    document.querySelectorAll('.btn-delete-event').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const eventId = btn.dataset.eventId;
            if (confirm('Tem certeza que deseja excluir este evento?')) {
                this.deleteEvent(eventId);
            }
        });
    });
}

openAddEventModal(prefillDate = null) {
    const defaultDate = prefillDate || new Date();
    const dateStr = defaultDate.toISOString().split('T')[0];
    
    const modalContent = `
        <form class="modal-form" id="add-event-form">
            <div class="modal-form-group">
                <label for="event-title">Título do Evento *</label>
                <input type="text" id="event-title" required placeholder="Ex: Reunião importante">
            </div>
            
            <div class="modal-form-row">
                <div class="modal-form-group">
                    <label for="event-date">Data *</label>
                    <input type="date" id="event-date" value="${dateStr}" required>
                </div>
                
                <div class="modal-form-group">
                    <label for="event-time">Hora (opcional)</label>
                    <input type="time" id="event-time">
                </div>
            </div>
            
            <div class="modal-form-group">
                <label for="event-type">Tipo de Evento</label>
                <select id="event-type">
                    <option value="event">Evento</option>
                    <option value="birthday">Aniversário</option>
                    <option value="meeting">Reunião</option>
                    <option value="holiday">Feriado</option>
                    <option value="other">Outro</option>
                </select>
            </div>
            
            <div class="modal-form-group">
                <label for="event-description">Descrição</label>
                <textarea id="event-description" rows="3" placeholder="Detalhes do evento..."></textarea>
            </div>
            
            <div class="modal-form-group">
                <label for="event-color">Cor do Evento</label>
                <input type="color" id="event-color" value="#4ECDC4">
            </div>
            
            <div class="modal-form-row">
                <div class="modal-form-group">
                    <label>
                        <input type="checkbox" id="event-all-day" checked>
                        Dia inteiro
                    </label>
                </div>
                
                <div class="modal-form-group">
                    <label>
                        <input type="checkbox" id="event-recurring">
                        Evento recorrente
                    </label>
                </div>
            </div>
            
            <div class="modal-form-group">
                <label>
                    <input type="checkbox" id="event-notification" checked>
                    Ativar notificação
                </label>
                <div id="notification-time" style="margin-left: 20px; display: none;">
                    <label for="notification-minutes">Minutos antes:</label>
                    <select id="notification-minutes">
                        <option value="5">5 minutos</option>
                        <option value="15">15 minutos</option>
                        <option value="30">30 minutos</option>
                        <option value="60">1 hora</option>
                        <option value="1440">1 dia</option>
                    </select>
                </div>
            </div>
            
            <div class="modal-actions">
                <button type="button" class="btn-secondary close-modal">Cancelar</button>
                <button type="submit" class="btn-primary">Adicionar Evento</button>
            </div>
        </form>
    `;
    
    this.showModal('Novo Evento', modalContent);
    
    // Toggle notification time
    const notificationCheckbox = document.getElementById('event-notification');
    const notificationTime = document.getElementById('notification-time');
    
    if (notificationCheckbox && notificationTime) {
        notificationCheckbox.addEventListener('change', () => {
            notificationTime.style.display = 
                notificationCheckbox.checked ? 'block' : 'none';
        });
    }
    
    // Form submission
    document.getElementById('add-event-form').addEventListener('submit', (e) => {
        e.preventDefault();
        this.addEvent();
    });
}

    async addEvent() {
        if (!auth.currentUser) return;
        
        const title = document.getElementById('event-title').value.trim();
        const date = document.getElementById('event-date').value;
        const time = document.getElementById('event-time').value;
        const type = document.getElementById('event-type').value;
        const description = document.getElementById('event-description').value.trim();
        const color = document.getElementById('event-color').value;
        const isAllDay = document.getElementById('event-all-day').checked;
        const isRecurring = document.getElementById('event-recurring').checked;
        const hasNotification = document.getElementById('event-notification').checked;
        const notificationMinutes = document.getElementById('notification-minutes')?.value || '15';
        
        if (!title || !date) {
            showToast('Título e data são obrigatórios', 'warning');
            return;
        }
        
        showLoading('Adicionando evento...');
        try {
            const userId = auth.currentUser.uid;
            const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Combine date and time
            let eventDateTime = new Date(date);
            if (time && !isAllDay) {
                const [hours, minutes] = time.split(':');
                eventDateTime.setHours(parseInt(hours), parseInt(minutes));
            }
            
            const eventData = {
                title,
                date: eventDateTime.toISOString(),
                time: time && !isAllDay ? time : null,
                type,
                description,
                color,
                isAllDay,
                isRecurring,
                hasNotification,
                notificationMinutes: hasNotification ? parseInt(notificationMinutes) : null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            const eventRef = doc(db, 'users', userId, 'events', eventId);
            await setDoc(eventRef, eventData);
            
            this.closeModal();
            showToast('Evento adicionado com sucesso!', 'success');
            
        } catch (error) {
            console.error('Erro ao adicionar evento:', error);
            showToast('Erro ao adicionar evento', 'error');
        } finally {
            hideLoading();
        }
    }
    
    openEditEventModal(event) {
        const eventDate = new Date(event.date);
        const dateStr = eventDate.toISOString().split('T')[0];
        const timeStr = event.time || '';
        
        const modalContent = `
            <form class="modal-form" id="edit-event-form">
                <div class="modal-form-group">
                    <label for="edit-event-title">Título do Evento *</label>
                    <input type="text" id="edit-event-title" value="${event.title}" required>
                </div>
                
                <div class="modal-form-row">
                    <div class="modal-form-group">
                        <label for="edit-event-date">Data *</label>
                        <input type="date" id="edit-event-date" value="${dateStr}" required>
                    </div>
                    
                    <div class="modal-form-group">
                        <label for="edit-event-time">Hora</label>
                        <input type="time" id="edit-event-time" value="${timeStr}">
                    </div>
                </div>
                
                <div class="modal-form-group">
                    <label for="edit-event-type">Tipo</label>
                    <select id="edit-event-type">
                        <option value="event" ${event.type === 'event' ? 'selected' : ''}>Evento</option>
                        <option value="birthday" ${event.type === 'birthday' ? 'selected' : ''}>Aniversário</option>
                        <option value="meeting" ${event.type === 'meeting' ? 'selected' : ''}>Reunião</option>
                        <option value="holiday" ${event.type === 'holiday' ? 'selected' : ''}>Feriado</option>
                        <option value="other" ${event.type === 'other' ? 'selected' : ''}>Outro</option>
                    </select>
                </div>
                
                <div class="modal-form-group">
                    <label for="edit-event-description">Descrição</label>
                    <textarea id="edit-event-description" rows="3">${event.description || ''}</textarea>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn-secondary close-modal">Cancelar</button>
                    <button type="submit" class="btn-primary">Salvar</button>
                    <button type="button" class="btn-danger" id="btn-delete-event-modal">
                        Excluir
                    </button>
                </div>
            </form>
        `;
        
        this.showModal('Editar Evento', modalContent);
        
        document.getElementById('edit-event-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateEvent(event.id);
        });
        
        document.getElementById('btn-delete-event-modal').addEventListener('click', () => {
            if (confirm('Excluir este evento?')) {
                this.deleteEvent(event.id);
            }
        });
    }
    
    async updateEvent(eventId) {
        if (!auth.currentUser) return;
        
        const title = document.getElementById('edit-event-title').value.trim();
        const date = document.getElementById('edit-event-date').value;
        const time = document.getElementById('edit-event-time').value;
        const type = document.getElementById('edit-event-type').value;
        const description = document.getElementById('edit-event-description').value.trim();
        
        if (!title || !date) {
            showToast('Título e data são obrigatórios', 'warning');
            return;
        }
        
        showLoading('Atualizando evento...');
        try {
            const userId = auth.currentUser.uid;
            const eventRef = doc(db, 'users', userId, 'events', eventId);
            
            const updateData = {
                title,
                date: new Date(date).toISOString(),
                time: time || null,
                type,
                description,
                updatedAt: new Date().toISOString()
            };
            
            await updateDoc(eventRef, updateData);
            
            this.closeModal();
            showToast('Evento atualizado!', 'success');
            
        } catch (error) {
            console.error('Erro ao atualizar evento:', error);
            showToast('Erro ao atualizar evento', 'error');
        } finally {
            hideLoading();
        }
    }
    
    async deleteEvent(eventId) {
        if (!auth.currentUser) return;
        
        showLoading('Excluindo evento...');
        try {
            const userId = auth.currentUser.uid;
            const eventRef = doc(db, 'users', userId, 'events', eventId);
            await deleteDoc(eventRef);
            
            this.closeModal();
            showToast('Evento excluído!', 'success');
            
        } catch (error) {
            console.error('Erro ao excluir evento:', error);
            showToast('Erro ao excluir evento', 'error');
        } finally {
            hideLoading();
        }
    }
    
    openEventDetails(event) {
        const eventDate = new Date(event.date);
        const formattedDate = formatDate(eventDate, 'dd/mm/yyyy');
        const formattedTime = event.time ? ` às ${event.time}` : '';
        
        const modalContent = `
            <div class="event-details-modal">
                <div class="event-detail-header" style="border-left: 5px solid ${event.color || '#4ECDC4'}">
                    <h3>${event.title}</h3>
                    <p class="event-detail-date">
                        <i class="fas fa-calendar"></i> ${formattedDate}${formattedTime}
                    </p>
                    <span class="event-type-badge">${this.getEventTypeLabel(event.type)}</span>
                </div>
                
                <div class="event-detail-content">
                    ${event.description ? `
                        <div class="event-detail-section">
                            <h4><i class="fas fa-align-left"></i> Descrição</h4>
                            <p>${event.description}</p>
                        </div>
                    ` : ''}
                    
                    <div class="event-detail-section">
                        <h4><i class="fas fa-info-circle"></i> Informações</h4>
                        <p><strong>Tipo:</strong> ${this.getEventTypeLabel(event.type)}</p>
                        <p><strong>Duração:</strong> ${event.isAllDay ? 'Dia inteiro' : 'Horário específico'}</p>
                        ${event.hasNotification ? `
                            <p><strong>Notificação:</strong> ${event.notificationMinutes} minutos antes</p>
                        ` : ''}
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn-secondary close-modal">Fechar</button>
                    <button type="button" class="btn-primary" id="btn-edit-event-details">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </div>
            </div>
        `;
        
        this.showModal('Detalhes do Evento', modalContent);
        
        document.getElementById('btn-edit-event-details')?.addEventListener('click', () => {
            this.closeModal();
            this.openEditEventModal(event);
        });
    }
    
    getEventTypeLabel(type) {
        const labels = {
            'event': 'Evento',
            'birthday': 'Aniversário',
            'meeting': 'Reunião',
            'holiday': 'Feriado',
            'other': 'Outro'
        };
        return labels[type] || type;
    }
    
    async exportCalendar() {
        // Implement export to PDF/Image
        showToast('Exportação em desenvolvimento', 'info');
    }
    
    showModal(title, content) {
        // Use existing modal or create one
        const modal = document.getElementById('modal-event') || 
                      document.getElementById('modal-contact') ||
                      document.createElement('div');
        
        if (!modal.id) {
            modal.id = 'calendar-modal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div class="modal-header">
                <h2>${title}</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">${content}</div>
        `;
        
        modal.classList.add('active');
        document.getElementById('modal-overlay').classList.add('active');
        
        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => this.closeModal());
        });
    }
    
    closeModal() {
        const modals = document.querySelectorAll('.modal');
        const overlay = document.getElementById('modal-overlay');
        
        modals.forEach(modal => modal.classList.remove('active'));
        if (overlay) overlay.classList.remove('active');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const calendarSystem = new CalendarSystem();
    window.calendarSystem = calendarSystem;
    console.log('Sistema de calendário inicializado!');
});

export default CalendarSystem;