const loginForm = document.getElementById('loginForm');
const perfilForm = document.getElementById('perfilForm');
const loginError = document.getElementById('loginError');
const loginSection = document.getElementById('loginSection');
const perfilSection = document.getElementById('perfilSection');
const dorsalPreview = document.getElementById('dorsalPreview');
const nombrePreview = document.getElementById('nombrePreview');
const numeroPreview = document.getElementById('numeroPreview');
const colorInput = document.getElementById('colorInput');
const fuenteSelect = document.getElementById('fuenteSelect');
const mensaje = document.getElementById('mensaje');

let participante = null;

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');
  const dni = document.getElementById('dniLogin').value.trim();
  const password = document.getElementById('passLogin').value.trim();

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni, password })
    });

    if (!res.ok) {
      const err = await res.json();
      loginError.textContent = err.error || 'Credenciales incorrectas';
      loginError.classList.remove('hidden');
      return;
    }

    participante = await res.json();

    // Mostrar perfil y ocultar login
    loginSection.classList.add('hidden');
    perfilSection.classList.remove('hidden');

    nombrePreview.textContent = `${participante.nombre} ${participante.apellidos}`;
    numeroPreview.textContent = participante.dorsal
      ? `#${String(participante.dorsal).padStart(4, '0')}`
      : `#${String(participante.id).padStart(4, '0')}`;

    // ✅ Cargar datos guardados del participante
    if (participante.telefono) perfilForm.telefono.value = participante.telefono;
    if (participante.ciudad) {
      perfilForm.ciudad.value = participante.ciudad;
      perfilForm.ciudad.disabled = true; // 🔒 Bloquear ciudad si ya está asignada
    }
    if (participante.color) colorInput.value = participante.color;
    if (participante.fuente) fuenteSelect.value = participante.fuente;

    actualizarDorsalPreview();
  } catch (err) {
    console.error(err);
    loginError.textContent = 'Error de conexión';
    loginError.classList.remove('hidden');
  }
});

function actualizarDorsalPreview() {
  if (!participante) return;
  const color = colorInput.value || participante.color || '#7b5cff';
  const fuente = fuenteSelect.value || participante.fuente || 'Arial';
  dorsalPreview.style.background = color;
  dorsalPreview.style.fontFamily = fuente;
  nombrePreview.textContent = `${participante.nombre} ${participante.apellidos}`;
  numeroPreview.textContent = participante.dorsal
    ? `#${String(participante.dorsal).padStart(4, '0')}`
    : `#${String(participante.id).padStart(4, '0')}`;
}

colorInput.addEventListener('input', actualizarDorsalPreview);
fuenteSelect.addEventListener('change', actualizarDorsalPreview);

perfilForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!participante) return;
  const data = {
    telefono: perfilForm.telefono.value,
    ciudad: perfilForm.ciudad.value,
    color: colorInput.value,
    fuente: fuenteSelect.value,
    imagen: participante.imagen || ''
  };
  try {
    const res = await fetch(`/api/participante/${participante.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    mensaje.textContent = json.actualizado
      ? '✅ Perfil actualizado'
      : 'Sin cambios';
    mensaje.classList.remove('hidden');
  } catch (err) {
    mensaje.textContent = 'Error al actualizar';
    mensaje.classList.remove('hidden');
  }
});
