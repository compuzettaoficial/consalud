const recetas = JSON.parse(localStorage.getItem("recetas")) || [];
const favoritos = JSON.parse(localStorage.getItem("favoritos")) || {};
const planificador = JSON.parse(localStorage.getItem("planificador")) || {};

function guardarLocal() {
  localStorage.setItem("recetas", JSON.stringify(recetas));
  localStorage.setItem("favoritos", JSON.stringify(favoritos));
  localStorage.setItem("planificador", JSON.stringify(planificador));
}

function guardarReceta() {
  const titulo = document.getElementById("titulo").value;
  const ingredientes = document.getElementById("ingredientes").value;
  const tiempo = document.getElementById("tiempo").value;
  const imagen = document.getElementById("imagen").value;
  const preparacion = document.getElementById("preparacion").value;
  const categoria = document.getElementById("categoria").value;

  if (!titulo || !ingredientes || !tiempo || !preparacion) {
    alert("Por favor, completa todos los campos obligatorios.");
    return;
  }

  const nueva = {
    id: Date.now(),
    titulo,
    ingredientes,
    tiempo,
    imagen,
    preparacion,
    categoria
  };

  recetas.push(nueva);
  guardarLocal();
  mostrarRecetas();
  document.getElementById("formulario").style.display = "none";
  document.querySelectorAll("#formulario input, #formulario textarea").forEach(e => e.value = "");
  document.getElementById("categoria").value = "";
}

function mostrarRecetas() {
  const contenedor = document.getElementById("recetas");
  contenedor.innerHTML = "";
  const filtro = document.getElementById("busqueda")?.value?.toLowerCase() || "";
  const categoriaFiltro = document.getElementById("filtroCategoria")?.value || "";
  const soloFav = document.getElementById("verFavoritos")?.checked;

  const filtradas = recetas.filter(r => {
    const coincideTexto = r.titulo.toLowerCase().includes(filtro) || r.ingredientes.toLowerCase().includes(filtro);
    const coincideCat = !categoriaFiltro || r.categoria === categoriaFiltro;
    const coincideFav = !soloFav || favoritos[r.id];
    return coincideTexto && coincideCat && coincideFav;
  });

  for (const r of filtradas) {
    const div = document.createElement("div");
    div.className = "receta";
    div.innerHTML = \`
      <h3>\${r.titulo}</h3>
      <p>⏱ \${r.tiempo}</p>
      <button onclick="toggleFavorito(\${r.id})">\${favoritos[r.id] ? "❤️" : "🤍"}</button>
      <button onclick="eliminarReceta(\${r.id})">🗑️</button>
      <button onclick="agendar(\${r.id})">🗓️</button>
    \`;
    contenedor.appendChild(div);
  }
}

function eliminarReceta(id) {
  const i = recetas.findIndex(r => r.id === id);
  if (i !== -1) recetas.splice(i, 1);
  delete favoritos[id];
  guardarLocal();
  mostrarRecetas();
}

function toggleFavorito(id) {
  favoritos[id] = !favoritos[id];
  guardarLocal();
  mostrarRecetas();
}

function agendar(id) {
  const dia = prompt("¿Para qué día quieres agendar esta receta? (ej: lunes)");
  if (!dia) return;
  planificador[dia] = planificador[dia] || [];
  planificador[dia].push(id);
  guardarLocal();
  mostrarPlanificador();
}

function mostrarPlanificador() {
  const dias = ["lunes","martes","miércoles","jueves","viernes","sábado","domingo"];
  const contenedor = document.getElementById("planificador");
  contenedor.innerHTML = "";
  for (const d of dias) {
    const div = document.createElement("div");
    div.innerHTML = "<h4>" + d.charAt(0).toUpperCase() + d.slice(1) + "</h4>";
    const lista = (planificador[d] || []).map(id => {
      const receta = recetas.find(r => r.id === id);
      return receta ? "<li>" + receta.titulo + "</li>" : "";
    }).join("");
    div.innerHTML += "<ul>" + lista + "</ul>";
    contenedor.appendChild(div);
  }
}

function buscarRecetas() {
  mostrarRecetas();
}

// Exponer funciones globalmente
window.guardarReceta = guardarReceta;
window.eliminarReceta = eliminarReceta;
window.toggleFavorito = toggleFavorito;
window.agendar = agendar;
window.buscarRecetas = buscarRecetas;

mostrarRecetas();
mostrarPlanificador();