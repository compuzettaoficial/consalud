const recetas = JSON.parse(localStorage.getItem("recetas")) || {};

function guardarReceta() {
  const id = Date.now().toString();
  const titulo = document.getElementById("titulo").value;
  const ingredientes = document.getElementById("ingredientes").value;
  const tiempo = document.getElementById("tiempo").value;
  const imagen = document.getElementById("imagen").value;
  const preparacion = document.getElementById("preparacion").value;
  const categoria = document.getElementById("categoria").value;

  if (!titulo || !ingredientes || !tiempo || !imagen || !preparacion) return alert("Todos los campos son obligatorios.");

  recetas[id] = { titulo, ingredientes, tiempo, imagen, preparacion, categoria };
  localStorage.setItem("recetas", JSON.stringify(recetas));
  document.getElementById("formulario").style.display = "none";
  limpiarFormulario();
  mostrarRecetas();
}

function limpiarFormulario() {
  document.getElementById("titulo").value = "";
  document.getElementById("ingredientes").value = "";
  document.getElementById("tiempo").value = "";
  document.getElementById("imagen").value = "";
  document.getElementById("preparacion").value = "";
  document.getElementById("categoria").value = "";
}

function eliminarReceta(id) {
  delete recetas[id];
  localStorage.setItem("recetas", JSON.stringify(recetas));
  mostrarRecetas();
}

function editarReceta(id, titulo, ingredientes, tiempo, imagen, preparacion, categoria) {
  document.getElementById("formulario").style.display = "block";
  document.getElementById("titulo").value = titulo;
  document.getElementById("ingredientes").value = ingredientes;
  document.getElementById("tiempo").value = tiempo;
  document.getElementById("imagen").value = imagen;
  document.getElementById("preparacion").value = preparacion;
  document.getElementById("categoria").value = categoria;

  eliminarReceta(id);
}

function esFavorita(id) {
  const favoritas = JSON.parse(localStorage.getItem("favoritas")) || [];
  return favoritas.includes(id);
}

function toggleFavorito(id) {
  let favoritas = JSON.parse(localStorage.getItem("favoritas")) || [];
  if (favoritas.includes(id)) {
    favoritas = favoritas.filter(fav => fav !== id);
  } else {
    favoritas.push(id);
  }
  localStorage.setItem("favoritas", JSON.stringify(favoritas));
  mostrarRecetas();
}

function buscarRecetas() {
  mostrarRecetas();
}

function mostrarRecetas() {
  const contenedor = document.getElementById("recetas");
  const filtro = document.getElementById("busqueda").value.toLowerCase();
  const categoria = document.getElementById("filtroCategoria").value;
  const soloFavoritos = document.getElementById("verFavoritos")?.checked;
  contenedor.innerHTML = "";

  Object.entries(recetas).forEach(([id, receta]) => {
    if (
      (filtro && !receta.titulo.toLowerCase().includes(filtro) && !receta.ingredientes.toLowerCase().includes(filtro)) ||
      (categoria && receta.categoria !== categoria) ||
      (soloFavoritos && !esFavorita(id))
    ) {
      return;
    }

    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <img src="${receta.imagen}" alt="${receta.titulo}">
      <h3>${receta.titulo} ${receta.categoria ? `<small>(${receta.categoria})</small>` : ""}</h3>
      <p>⏱ ${receta.tiempo}</p>
      <p><strong>Ingredientes:</strong> ${receta.ingredientes}</p>
      <p><strong>Preparación:</strong> ${receta.preparacion}</p>
      <div class="acciones">
        <button onclick="editarReceta('${id}', \`${receta.titulo}\`, \`${receta.ingredientes}\`, \`${receta.tiempo}\`, \`${receta.imagen}\`, \`${receta.preparacion}\`, \`${receta.categoria || ""}\`)">✏️ Editar</button>
        <button onclick="eliminarReceta('${id}')">🗑️ Eliminar</button>
        <button onclick="toggleFavorito('${id}')">${esFavorita(id) ? "💔 Quitar" : "❤️ Favorito"}</button>
      </div>
    `;
    contenedor.appendChild(div);
  });
}

window.guardarReceta = guardarReceta;
window.buscarRecetas = buscarRecetas;
window.eliminarReceta = eliminarReceta;
window.editarReceta = editarReceta;
window.toggleFavorito = toggleFavorito;

mostrarRecetas();
