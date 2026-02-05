// Datos iniciales (Simulación de Base de Datos)
let data = [
    { id: '001', name: 'Worship V2 Redesign', status: 'Activo', date: '2023-10-24' },
    { id: '002', name: 'Campaña Marketing Q4', status: 'Pendiente', date: '2023-11-01' },
    { id: '003', name: 'Sistema de Chatbot Risp', status: 'Finalizado', date: '2023-09-15' },
    { id: '004', name: 'Landing Page Cliente X', status: 'Activo', date: '2023-10-20' },
    { id: '005', name: 'Integración Three.js', status: 'Activo', date: '2023-10-28' },
];

let isEditing = false;
let currentId = null;

// Referencias DOM
const tableBody = document.getElementById('table-body');
const modalOverlay = document.getElementById('modal-overlay');
const btnAdd = document.getElementById('btn-add-new');
const btnCancel = document.getElementById('btn-cancel');
const form = document.getElementById('crud-form');
const inputName = document.getElementById('input-name');
const inputStatus = document.getElementById('input-status');
const modalTitle = document.getElementById('modal-title');
const btnLogout = document.getElementById('btn-logout');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    renderTable();
    initNavAnimations();
});

// --- LOGOUT ---
if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('worship_session');
        window.location.href = '../login/login.html';
    });
}

// --- LÓGICA CRUD ---

function renderTable() {
    tableBody.innerHTML = '';
    data.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'table-row';
        // Animación escalonada (Stagger)
        row.style.animationDelay = `${index * 0.07}s`; 
        
        let statusClass = '';
        if(item.status === 'Activo') statusClass = 'status-active';
        else if(item.status === 'Pendiente') statusClass = 'status-pending';
        else statusClass = 'status-finished';

        row.innerHTML = `
            <span style="font-family: 'JetBrains Mono'; color: #666;">#${item.id}</span>
            <span style="font-weight: 600; letter-spacing: -0.3px;">${item.name}</span>
            <span><span class="status-badge ${statusClass}">${item.status}</span></span>
            <span style="color: #888; font-family: 'JetBrains Mono'; font-size: 0.8rem;">${item.date}</span>
            <div class="actions">
                <button class="action-btn edit" onclick="window.editItem('${item.id}')">Editar</button>
                <button class="action-btn delete" onclick="window.deleteItem('${item.id}')">Eliminar</button>
            </div>
        `;
        tableBody.appendChild(row);
    });
}

// Funciones globales para los botones generados dinámicamente
window.editItem = (id) => {
    const item = data.find(d => d.id === id);
    if (item) {
        isEditing = true;
        currentId = id;
        inputName.value = item.name;
        inputStatus.value = item.status;
        modalTitle.textContent = 'Editar Protocolo';
        openModal();
    }
};

window.deleteItem = (id) => {
    if(confirm('¿Confirmar eliminación del protocolo del sistema?')) {
        // Animación de salida
        const rows = Array.from(document.querySelectorAll('.table-row'));
        const rowToDelete = rows.find(r => r.innerHTML.includes(id));
        
        if(rowToDelete) {
            rowToDelete.style.transform = 'translateX(50px)';
            rowToDelete.style.opacity = '0';
            setTimeout(() => {
                data = data.filter(d => d.id !== id);
                renderTable();
            }, 300);
        }
    }
};

// --- MODAL & FORMULARIO ---

function openModal() {
    modalOverlay.classList.remove('hidden');
    void modalOverlay.offsetWidth; // Trigger reflow
    modalOverlay.classList.add('visible');
}

function closeModal() {
    modalOverlay.classList.remove('visible');
    setTimeout(() => {
        modalOverlay.classList.add('hidden');
        form.reset();
        isEditing = false;
        currentId = null;
    }, 300);
}

btnAdd.addEventListener('click', () => {
    isEditing = false;
    modalTitle.textContent = 'Nuevo Protocolo';
    form.reset();
    openModal();
});

btnCancel.addEventListener('click', closeModal);

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = inputName.value;
    const status = inputStatus.value;
    const date = new Date().toISOString().split('T')[0];

    if (isEditing) {
        const index = data.findIndex(d => d.id === currentId);
        if (index !== -1) data[index] = { ...data[index], name, status };
    } else {
        const newId = String(data.length + 1).padStart(3, '0');
        data.push({ id: newId, name, status, date });
    }
    closeModal();
    renderTable();
});

function initNavAnimations() {
    // Aquí podrías agregar lógica para cambiar de pestañas real
    // Por ahora es solo visual en el CSS
}