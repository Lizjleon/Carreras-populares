const adminLoginForm = document.getElementById('adminLoginForm');
const adminLoginMsg = document.getElementById('adminLoginMsg');
const loginCard = document.getElementById('loginCard');
const panelSection = document.getElementById('panelSection');
const filtro = document.getElementById('filtro');
const cargarBtn = document.getElementById('cargar');
const lista = document.getElementById('lista');

adminLoginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  adminLoginMsg.classList.add('hidden');

  const user = document.getElementById('adminUser').value.trim();
  const pass = document.getElementById('adminPass').value.trim();

  try {
    const res = await fetch('/api/admin-login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ user, pass })
    });
    if (!res.ok) {
      const json = await res.json();
      adminLoginMsg.textContent = json.error || 'Credenciales incorrectas';
      adminLoginMsg.classList.remove('hidden');
      return;
    }
    // Mostrar panel
    loginCard.classList.add('hidden');
    panelSection.classList.remove('hidden');
    cargarLista(); // carga inicial
  } catch (err) {
    adminLoginMsg.textContent = 'Error de conexión';
    adminLoginMsg.classList.remove('hidden');
  }
});

async function cargarLista() {
  lista.innerHTML = '<li>Cargando...</li>';
  const ciudad = filtro.value || '';
  const url = ciudad ? `/api/participantes?ciudad=${encodeURIComponent(ciudad)}` : '/api/participantes';
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      lista.innerHTML = '<li>No hay participantes.</li>';
      return;
    }

    // normalizar: eliminar visualmente duplicados por DNI (si quieres eliminar DB usar endpoint DELETE)
    const vistos = new Set();
    const filtrados = data.filter(r => {
      if (!r.dni) return false;
      if (vistos.has(r.dni)) return false;
      vistos.add(r.dni);
      return true;
    });

    lista.innerHTML = filtrados.map(p => `
      <li>
        <strong>${p.nombre || '—'} ${p.apellidos || ''}</strong> —
        ${p.carrera || p.ciudad_participante || 'Sin ciudad'} |
        Dorsal: <b>${p.dorsal || '-'}</b> |
        DNI: ${p.dni || '-'}
        <br/>
        <button class="borrar" data-id="${p.id}">🗑️ Borrar</button>
      </li>
    `).join('');

    // attach delete handlers
    document.querySelectorAll('.borrar').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (!confirm('¿Eliminar participante?')) return;
        await fetch(`/api/participante/${id}`, { method: 'DELETE' });
        cargarLista();
      });
    });

  } catch (err) {
    console.error(err);
    lista.innerHTML = '<li>Error al cargar participantes.</li>';
  }
}

cargarBtn.addEventListener('click', cargarLista);