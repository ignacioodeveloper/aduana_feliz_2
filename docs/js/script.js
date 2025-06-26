document.addEventListener('DOMContentLoaded', function() {
    
    // ===================================================================
    // 1. BASES DE DATOS SIMULADAS Y CONFIGURACIÓN
    // ===================================================================
    
    const users = {
        "8.888.888-8": { password: "gerente", name: "Carlos Gerente", role: "gerente" },
        "9.999.999-9": { password: "operador", name: "Ana Operadora", role: "operador" },
        "15.888.777-K": { password: "pasajero", name: "Sofía Castro", role: "pasajero" }
    };

    const menuConfig = {
        gerente: [
            { id: 'dashboard', icon: 'house-door-fill', text: 'Panel Principal' },
            { id: 'reportes-flujo', icon: 'graph-up-arrow', text: 'Reportes de Flujo' },
            { id: 'gestion-usuarios', icon: 'people-fill', text: 'Gestión de Usuarios' }
        ],
        operador: [
            { id: 'dashboard', icon: 'house-door-fill', text: 'Panel de Operaciones' },
            { id: 'salida-menores', icon: 'person-vcard-fill', text: 'Validación Menores' },
            { id: 'validacion-mascotas', icon: 'file-earmark-check-fill', text: 'Validación Mascotas' },
            { id: 'generacion-formularios', icon: 'file-earmark-text-fill', text: 'Generar Formularios' },
            { id: 'control-sag-pdi', icon: 'pc-display-horizontal', text: 'Control SAG/PDI' }
        ],
        pasajero: [
            { id: 'dashboard', icon: 'house-door-fill', text: 'Mis Trámites' },
            { id: 'consulta-tramite', icon: 'search', text: 'Consultar un Trámite' },
            { id: 'declaracion-alimentos', icon: 'apple', text: 'Declaración de Alimentos' }
        ]
    };

    const tramitesDB = {
        "CHL-2024-12345": {
            title: "Trámite de Ingreso Vehicular",
            timeline: [
                { status: 'success', icon: 'check-lg', title: 'Inicio de Trámite Digital', text: 'Declaración recibida.', time: 'Ayer 10:00' },
                { status: 'success', icon: 'check-lg', title: 'Validación Migratoria (PDI)', text: 'Pasajeros validados.', time: 'Ayer 10:30' },
                { status: 'active', icon: 'arrow-clockwise', title: 'Revisión Aduanera', text: 'En espera de inspección fiscal.', time: 'Hoy 09:15' },
                { status: 'pending', icon: 'hourglass-split', title: 'Finalización del Proceso', text: 'Pendiente.', time: '' }
            ]
        },
        "CHL-2024-67890": {
            title: "Trámite de Declaración SAG",
            timeline: [
                { status: 'success', icon: 'check-lg', title: 'Declaración Jurada Recibida', text: 'Pasajero declara no portar productos.', time: '18/10/2024 14:00' },
                { status: 'success', icon: 'check-lg', title: 'Inspección Aleatoria', text: 'No seleccionado para inspección física.', time: '18/10/2024 14:05' },
                { status: 'success', icon: 'check-lg', title: 'Trámite Finalizado', text: 'Proceso completado exitosamente.', time: '18/10/2024 14:06' }
            ]
        },
        "CHL-2024-55555": {
            title: "Trámite de Ingreso Mascota",
            timeline: [
                { status: 'success', icon: 'check-lg', title: 'Documentación Recibida', text: 'CZE y Vacunas cargadas.', time: '17/10/2024 11:00' },
                { status: 'danger', icon: 'x-lg', title: 'Validación SAG Rechazada', text: 'Certificado de vacuna antirrábica vencido. Requiere acción.', time: '17/10/2024 11:30' },
                { status: 'pending', icon: 'hourglass-split', title: 'Inspección Física', text: 'Pendiente de resolución documental.', time: '' }
            ]
        }
    };
    
    // Variables para los gráficos y el estado del usuario
    let currentUser = null;
    let personasChart = null;
    let vehiculosChart = null;
    
    // ===================================================================
    // 2. LÓGICA DE AUTENTICACIÓN Y NAVEGACIÓN
    // ===================================================================

    // --- Manejador del formulario de login ---
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('usuario').value;
        const password = document.getElementById('password').value;
        document.getElementById('login-error').classList.add('d-none');

        const user = users[username];
        if (user && user.password === password) {
            currentUser = user;
            document.getElementById('login-section').classList.add('d-none');
            document.getElementById('app-section').classList.remove('d-none');
            setupAppForUser(user);
        } else {
            document.getElementById('login-error').classList.remove('d-none');
        }
    });

    // --- Manejador del botón de logout ---
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        // Recargar la página es la forma más simple de resetear el estado del MVP
        window.location.reload();
    });

    // --- Configura la aplicación según el rol del usuario ---
    function setupAppForUser(user) {
        document.getElementById('welcome-user').textContent = user.name;
        generateSidebarMenu(user.role);
        setupDashboard(user.role);
        navigateTo('dashboard');
    }

    // --- Genera el menú lateral dinámicamente ---
    function generateSidebarMenu(role) {
        const menuItems = menuConfig[role];
        const sidebarMenu = document.getElementById('sidebar-menu');
        sidebarMenu.innerHTML = `<h6 class="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted"><span>MENÚ PRINCIPAL</span></h6>`;
        const list = document.createElement('ul');
        list.className = 'nav flex-column';
        menuItems.forEach(item => {
            list.innerHTML += `<li><a class="nav-link" href="#" data-target="${item.id}"><i class="bi bi-${item.icon}"></i>${item.text}</a></li>`;
        });
        sidebarMenu.appendChild(list);

        // Añade listeners a los nuevos links del menú y del dropdown de usuario
        document.querySelectorAll('.nav-link, .dropdown-item').forEach(link => {
            link.addEventListener('click', function(e) {
                if (this.id === 'logout-btn') return;
                e.preventDefault();
                const targetId = this.getAttribute('data-target');
                if (targetId) navigateTo(targetId);
            });
        });
    }
    
    // --- Controla qué sección de contenido se muestra ---
    function navigateTo(targetId) {
        document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
        document.querySelectorAll('#sidebar .nav-link').forEach(link => link.classList.remove('active'));
        
        const targetSection = document.getElementById(targetId);
        if (targetSection) targetSection.classList.add('active');
        
        const activeLink = document.querySelector(`.nav-link[data-target="${targetId}"]`);
        if (activeLink) activeLink.classList.add('active');

        // Si navegamos a la página de reportes, renderiza los gráficos
        if (targetId === 'reportes-flujo') {
            renderCharts();
        }
    }
    
    // ===================================================================
    // 3. FUNCIONALIDADES ESPECÍFICAS DE CADA PANTALLA
    // ===================================================================

    // --- Configura el Dashboard con tarjetas KPI según el rol ---
    function setupDashboard(role) {
        const kpiContainer = document.getElementById('kpi-cards-container');
        kpiContainer.innerHTML = '';
        let kpis = [];

        if (role === 'gerente') {
            kpis = [
                { title: 'Trámites Totales (Mes)', value: '1,245', icon: 'bi-archive-fill', color: 'primary' },
                { title: 'Usuarios Activos', value: '34', icon: 'bi-people-fill', color: 'success' },
                { title: 'Flujo Vehicular (Hoy)', value: '580', icon: 'bi-truck-front-fill', color: 'info' },
                { title: 'Alertas Sistema', value: '2', icon: 'bi-exclamation-triangle-fill', color: 'warning' }
            ];
        } else if (role === 'operador') {
            kpis = [
                { title: 'Trámites Hoy', value: '78', icon: 'bi-calendar-check-fill', color: 'primary' },
                { title: 'Inspecciones Pendientes', value: '12', icon: 'bi-search', color: 'info' },
                { title: 'Alertas Activas', value: '4', icon: 'bi-exclamation-triangle-fill', color: 'warning' },
                { title: 'Documentos Rechazados', value: '3', icon: 'bi-file-earmark-x-fill', color: 'danger' }
            ];
        } else { // Pasajero
            kpiContainer.innerHTML = `<div class="col-12"><p class="lead">Desde aquí podrá acceder a sus trámites y declaraciones de manera simple y rápida.</p></div>`;
            return;
        }

        kpis.forEach(kpi => {
            kpiContainer.innerHTML += `
            <div class="col-md-6 col-xl-3 mb-4">
                <div class="card kpi-card border-${kpi.color} shadow-sm h-100">
                    <div class="card-body"><div class="row no-gutters align-items-center"><div class="col me-2">
                        <div class="text-xs fw-bold text-${kpi.color} text-uppercase mb-1">${kpi.title}</div>
                        <div class="kpi-value mb-0 fw-bold text-gray-800">${kpi.value}</div>
                    </div><div class="col-auto"><i class="bi ${kpi.icon} kpi-icon"></i></div></div></div>
                </div>
            </div>`;
        });
    }

    // --- Renderiza los gráficos de la página de Reportes ---
    function renderCharts() {
        if (!document.getElementById('flujoPersonasChart')) return; // Salir si el canvas no está en el DOM

        const personasCtx = document.getElementById('flujoPersonasChart').getContext('2d');
        const vehiculosCtx = document.getElementById('flujoVehiculosChart').getContext('2d');

        if (personasChart) personasChart.destroy();
        if (vehiculosChart) vehiculosChart.destroy();

        personasChart = new Chart(personasCtx, {
            type: 'line',
            data: { labels: ['Hace 6 días', 'Hace 5', 'Hace 4', 'Hace 3', 'Ayer', 'Hoy'], datasets: [{ label: 'Ingresos', data: [1200, 1500, 1300, 1800, 2200, 2500], borderColor: '#0d6efd', tension: 0.3 }, { label: 'Egresos', data: [1100, 1450, 1250, 1900, 2100, 2400], borderColor: '#198754', tension: 0.3 }] }
        });

        vehiculosChart = new Chart(vehiculosCtx, {
            type: 'bar',
            data: { labels: ['Particulares', 'Buses', 'Camiones de Carga', 'Otros'], datasets: [{ label: 'Cantidad de Vehículos', data: [350, 80, 150, 25], backgroundColor: ['#0d6efd', '#198754', '#ffc107', '#6c757d'] }] },
            options: { plugins: { legend: { display: false } } }
        });
    }

    // --- Lógica para la consulta de trámites del pasajero ---
    const consultarTramiteBtn = document.querySelector("#consulta-tramite button");
    if(consultarTramiteBtn){
        consultarTramiteBtn.addEventListener('click', () => {
            const code = document.querySelector("#consulta-tramite input").value.trim().toUpperCase();
            const tramite = tramitesDB[code];
            const resultDiv = document.querySelector("#consulta-tramite #tramite-result");
            const notFoundDiv = document.querySelector("#consulta-tramite #tramite-not-found");
            const timelineDiv = document.querySelector("#consulta-tramite #tramite-timeline");

            resultDiv.classList.add('d-none');
            notFoundDiv.classList.add('d-none');
            
            if (tramite) {
                timelineDiv.innerHTML = `<h5 class="mb-3">${tramite.title}</h5>`;
                tramite.timeline.forEach(item => {
                    const statusClass = { success: 'bg-success', active: 'bg-primary', pending: 'bg-secondary', danger: 'bg-danger' }[item.status];
                    timelineDiv.innerHTML += `<div class="timeline-item ${item.status}"><div class="timeline-icon ${statusClass}"><i class="bi bi-${item.icon}"></i></div><div class="timeline-content"><strong>${item.title}</strong><p>${item.text} <small class="text-muted">${item.time}</small></p></div></div>`;
                });
                resultDiv.classList.remove('d-none');
            } else {
                notFoundDiv.classList.remove('d-none');
            }
        });
    }

    // --- Lógica para el switch de declaración de alimentos ---
    const declaraSwitch = document.getElementById('declaraProductos');
    if(declaraSwitch){
        declaraSwitch.addEventListener('change', function() {
            document.getElementById('detalle-productos').classList.toggle('d-none', !this.checked);
        });
    }

});