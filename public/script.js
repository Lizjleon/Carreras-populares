// public/script.js - controla carrera.html (detalle + inscripción)

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

const infoLocal = {
  "Barcelona": { fecha: "17/01/2026", distancia: "10 km", hora: "10:00 a.m.", imagen: "img/Barcelona.jpg", descripcion: "Corre por el paseo marítimo y disfruta de la brisa del Mediterráneo." },
  "Madrid": { fecha: "21/02/2026", distancia: "10 km", hora: "10:00 a.m.", imagen: "img/Madrid.jpg", descripcion: "Vive la emoción en el corazón de la capital, entre historia y modernidad." },
  "Alicante": { fecha: "11/02/2026", distancia: "5 km", hora: "11:00 a.m.", imagen: "img/Alicante.jpg", descripcion: "Una carrera con vistas al mar, ideal para quienes aman el sol." },
  "Sevilla": { fecha: "04/04/2026", distancia: "10 km", hora: "09:30 a.m.", imagen: "img/Sevilla.jpg", descripcion: "Corre entre la historia y la alegría de una ciudad llena de arte." },
  "Galicia": { fecha: "16/05/2026", distancia: "8 km", hora: "10:00 a.m.", imagen: "img/Galicia.jpg", descripcion: "Paisajes verdes, aire puro y un recorrido natural inolvidable." },
  "Valencia": { fecha: "01/03/2026", distancia: "8 km", hora: "10:00 a.m.", imagen: "img/Valencia.jpg", descripcion: "Un paseo entre la tradición y el futuro." }
};

async function cargarDatos(ciudad) {
  try {
    const res = await fetch('/api/carreras');
    if (res.ok) {
      const lista = await res.json();
      const match = lista.find(c => c.nombre === ciudad);
      if (match) {
        return {
          fecha: match.fecha,
          descripcion: infoLocal[ciudad]?.descripcion || '',
          imagen: infoLocal[ciudad]?.imagen || '',
          distancia: infoLocal[ciudad]?.distancia || '',
          hora: infoLocal[ciudad]?.hora || ''
        };
      }
    }
  } catch {}
  const local = infoLocal[ciudad] || {};
  return {
    fecha: local.fecha || '',
    descripcion: local.descripcion || '',
    imagen: local.imagen || '',
    distancia: local.distancia || '',
    hora: local.hora || ''
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  const ciudad = getQueryParam('ciudad') || '';
  const titulo = document.getElementById('titulo');
  const fechaEl = document.getElementById('fecha');
  const detalle = document.getElementById('detalle');
  const ciudadInput = document.getElementById('ciudadInput');

  if (!ciudad) {
    titulo.textContent = 'Carrera';
    detalle.innerHTML = '<p>Ciudad no especificada.</p>';
    return;
  }

  titulo.textContent = ciudad;
  ciudadInput.value = ciudad;
  ciudadInput.readOnly = true;

  const datos = await cargarDatos(ciudad);

  // --- NUEVO BLOQUE con estructura y clases CSS ---
  detalle.innerHTML = `
    <div class="detalle-imagen">
      <img src="${datos.imagen || 'img/Barcelona.jpg'}" alt="${ciudad}">
    </div>
    <div class="detalle-texto">
      <p>${datos.descripcion || ''}</p>
      <p><strong>Distancia:</strong> ${datos.distancia || '—'} — <strong>Hora de salida:</strong> ${datos.hora || '—'}</p>
    </div>
  `;

  fechaEl.textContent = datos.fecha ? `Fecha: ${datos.fecha}` : '';

  const formIns = document.getElementById('formInscripcion');
  const confirmacion = document.getElementById('confirmacion');

  formIns.addEventListener('submit', async (e) => {
    e.preventDefault();
    confirmacion.classList.add('hidden');
    const fd = Object.fromEntries(new FormData(formIns).entries());
    fd.ciudad = ciudad;

    try {
      const res = await fetch('/api/inscribir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fd)
      });
      const json = await res.json();
      if (!res.ok) {
        confirmacion.textContent = json.error || 'Error al inscribirse';
        confirmacion.classList.remove('hidden');
        confirmacion.classList.add('error-msg');
        return;
      }
      confirmacion.textContent = `✅ Inscrito. Tu dorsal para ${ciudad} es #${json.dorsal}`;
      confirmacion.classList.remove('hidden');
      confirmacion.classList.remove('error-msg');
      confirmacion.classList.add('success-msg');
      formIns.reset();
      ciudadInput.value = ciudad;
    } catch {
      confirmacion.textContent = 'Error de conexión con el servidor';
      confirmacion.classList.remove('hidden');
      confirmacion.classList.add('error-msg');
    }
  });
});
