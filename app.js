let recetas = JSON.parse(localStorage.getItem("recetas")) || [];
let favoritos = JSON.parse(localStorage.getItem("favoritos")) || {};
let planificador = JSON.parse(localStorage.getItem("planificador")) || {};

function guardarReceta() {
  const receta = {
    id: Date.now(),
    titulo: document.getElementById("titulo").value,
    ingredientes: document.getElementById("ingredientes").value,
    tiempo: document.getElementById("tiempo").value,
    imagen: document.getElementById("imagen").value,
    preparacion: document.getElementById("preparacion").value,
    categoria: document.getElementById("categoria").value
  };
  recetas.push(receta);
  localStorage.setItem("recetas", JSON.stringify(recetas));
  limpiarFormulario();
  document.getElementById("formulario").style.display = "none";
  buscarRecetas();
}

function limpiarFormulario() {
  document.getElementById("titulo").value = "";
  document.getElementById("ingredientes").value = "";
  document.getElementById("tiempo").value = "";
  document.getElementById("imagen").value = "";
  document.getElementById("preparacion").value = "";
  document.getElementById("categoria").value = "";
}

function buscarRecetas() {
  const texto = document.getElementById("busqueda").value.toLowerCase();
  const categoria = document.getElementById("filtroCategoria").value;
  const soloFavoritos = document.getElementById("verFavoritos").checked;
  const contenedor = document.getElementById("recetas");
  contenedor.innerHTML = "";

  recetas.filter(r => {
    return (!texto || r.titulo.toLowerCase().includes(texto) || r.ingredientes.toLowerCase().includes(texto)) &&
           (!categoria || r.categoria === categoria) &&
           (!soloFavoritos || favoritos[r.id]);
  }).forEach(r => {
    const div = document.createElement("div");
    div.className = "receta";
    div.innerHTML = `
      <h3>${r.titulo} ${favoritos[r.id] ? "❤️" : ""}</h3>
      <p>⏱ ${r.tiempo}</p>
      ${r.imagen ? `<img src="${r.imagen}" alt="${r.titulo}">` : ""}
      <p><strong>Ingredientes:</strong> ${r.ingredientes}</p>
      <p><strong>Preparación:</strong> ${r.preparacion}</p>
      <button onclick="agendar('${r.id}')">📅 Agendar</button>
      <button onclick="toggleFavorito('${r.id}')">❤️ Favorito</button>
      <button onclick="eliminarReceta('${r.id}')">🗑️ Eliminar</button>
    `;
    contenedor.appendChild(div);
  });
}

function eliminarReceta(id) {
  recetas = recetas.filter(r => r.id != id);
  delete favoritos[id];
  localStorage.setItem("recetas", JSON.stringify(recetas));
  localStorage.setItem("favoritos", JSON.stringify(favoritos));
  buscarRecetas();
  mostrarPlanificador();
}

function toggleFavorito(id) {
  favoritos[id] = !favoritos[id];
  localStorage.setItem("favoritos", JSON.stringify(favoritos));
  buscarRecetas();
}

function agendar(id) {
  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const dia = prompt("¿Para qué día de la semana quieres agendar esta receta?\n" + dias.join(", "));
  if (dias.includes(dia)) {
    if (!planificador[dia]) planificador[dia] = [];
    planificador[dia].push(id);
    localStorage.setItem("planificador", JSON.stringify(planificador));
    mostrarPlanificador();
  }
}

function mostrarPlanificador() {
  const cont = document.getElementById("planificador");
  cont.innerHTML = "";
  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  dias.forEach(dia => {
    const recetasDia = planificador[dia] || [];
    if (recetasDia.length > 0) {
      const div = document.createElement("div");
      div.innerHTML = `<h3>${dia}</h3>`;
      recetasDia.forEach((id, i) => {
        const receta = recetas.find(r => r.id == id);
        if (receta) {
          div.innerHTML += `
            <p>
              ${receta.titulo}
              <button onclick="eliminarAgendado('${dia}', ${i})">❌</button>
            </p>
          `;
        }
      });
      cont.appendChild(div);
    }
  });
}

function eliminarAgendado(dia, index) {
  planificador[dia].splice(index, 1);
  if (planificador[dia].length === 0) delete planificador[dia];
  localStorage.setItem("planificador", JSON.stringify(planificador));
  mostrarPlanificador();
}

buscarRecetas();
mostrarPlanificador();
