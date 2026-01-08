import { db, auth } from './firebase-config.js';
import { collection, addDoc, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { showToast, formatarDataBR } from './utils.js';

export async function salvarEvento(titulo, data, descricao = "") {
    try {
        await addDoc(collection(db, "eventos"), {
            ownerId: auth.currentUser.uid,
            titulo,
            data, // Formato YYYY-MM-DD
            descricao,
            criadoEm: new Date().toISOString()
        });
        showToast("Evento agendado!");
        renderCalendarUI();
    } catch (e) {
        showToast("Erro ao salvar evento.");
    }
}

export async function buscarEventos() {
    const uid = auth.currentUser.uid;
    const q = query(collection(db, "eventos"), where("ownerId", "==", uid), orderBy("data", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function renderCalendarUI() {
    const area = document.getElementById('content-area');
    const eventos = await buscarEventos();

    area.innerHTML = `
        <div class="card-tray animate-in">
            <h3>Novo Evento</h3>
            <div class="input-group">
                <input type="text" id="ev-titulo" placeholder="O que vai acontecer?">
                <input type="date" id="ev-data">
                <button onclick="dispararNovoEvento()" class="btn-gold">Agendar</button>
            </div>
        </div>

        <div class="card-tray">
            <h3>Próximas Datas</h3>
            <div id="calendar-list" class="event-list">
                ${eventos.length === 0 ? '<p>Nenhum evento agendado.</p>' : ''}
                ${eventos.map(ev => `
                    <div class="event-item">
                        <div class="event-date">${formatarDataBR(ev.data)}</div>
                        <div class="event-info">
                            <strong>${ev.titulo}</strong>
                            <span>${ev.descricao}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

window.dispararNovoEvento = () => {
    const t = document.getElementById('ev-titulo').value;
    const d = document.getElementById('ev-data').value;
    if(t && d) salvarEvento(t, d);
    else showToast("Preencha título e data.");
};
