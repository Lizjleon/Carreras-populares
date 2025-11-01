// Genera las tarjetas y maneja los clics
document.addEventListener("DOMContentLoaded", () => {
  const carreras = [
    { nombre: "Barcelona", fecha: "17/01/2026", imagen: "img/Barcelona.jpg" },
    { nombre: "Madrid", fecha: "21/02/2026", imagen: "img/Madrid.jpg" },
    { nombre: "Alicante", fecha: "11/02/2026", imagen: "img/Alicante.jpg" },
    { nombre: "Galicia", fecha: "16/05/2026", imagen: "img/Galicia.jpg" },
    { nombre: "Sevilla", fecha: "04/04/2026", imagen: "img/Sevilla.jpg" },
    { nombre: "Valencia", fecha: "01/03/2026", imagen: "img/Valencia.jpg" }
  ];

  const contenedor = document.getElementById("carrerasContainer");

  contenedor.innerHTML = carreras
    .map(
      (c) => `
      <div class="card" data-ciudad="${c.nombre}">
        <img src="${c.imagen}" alt="${c.nombre}">
        <h3>${c.nombre}</h3>
        <p>📅 ${c.fecha}</p>
        <button class="btn-inscribirme" data-ciudad="${c.nombre}">Inscribirme</button>
      </div>
    `
    )
    .join("");

  contenedor.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-inscribirme");
    if (btn) {
      const ciudad = btn.dataset.ciudad;
      window.location.href = `carrera.html?ciudad=${encodeURIComponent(ciudad)}`;
    }
  });
});