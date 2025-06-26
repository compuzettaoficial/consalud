let recetas = JSON.parse(localStorage.getItem("recetas")) || [];

function guardarReceta() {
  const titulo = document.getElementById("titulo").value;
  const ingredientes = document.getElementById("ingredientes").value;
  const tiempo = document.getElementById("tiempo").value;
  const imagen = document.getElementById("imagen").value;
  const preparacion = document.getElementById("preparacion").value;
  const categoria = document.getElementById("categoria").value;

  if (!titulo || !ingredientes || !tiempo || !preparacion) {
    alert("Completa todos los campos.");
    return;
  }

  recetas.push({
    id: Date.now(),
    titulo, ingredientes, tiempo, imagen, preparacion, categoria,
    favorito: false
  });
  localStorage.setItem("recetas", JSON.stringify(recetas));
  limpiarFormulario();
  document.getElementById("formulario").style.display = "none";
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

function mostrarRecetas() {
  const contenedor = document.getElementById("recetas");
  const filtroTexto = document.getElementById("busqueda").value.toLowerCase();
  const filtroCat = document.getElementById("filtroCategoria").value;
  const soloFav = document.getElementById("verFavoritos").checked;

  contenedor.innerHTML = "";
  recetas
    .filter(r => (!soloFav || r.favorito) &&
                 (!filtroCat || r.categoria === filtroCat) &&
                 (r.titulo.toLowerCase().includes(filtroTexto) || r.ingredientes.toLowerCase().includes(filtroTexto)))
    .forEach(receta => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${receta.titulo} ${receta.favorito ? "❤️" : ""}</h3>
        <p>⏱ ${receta.tiempo}</p>
        ${receta.imagen ? `<img src="${receta.imagen}" alt="Imagen receta" />` : ""}
        <p><strong>Ingredientes:</strong> ${receta.ingredientes}</p>
        <p><strong>Preparación:</strong> ${receta.preparacion}</p>
        <p><strong>Categoría:</strong> ${receta.categoria || "Sin categoría"}</p>
        <button onclick="toggleFavorito(${receta.id})">❤️ Favorito</button>
        <button onclick="eliminarReceta(${receta.id})">🗑️ Eliminar</button>
        <button onclick="agendarReceta('${receta.titulo}')">📆 Agendar</button>
      `;
      contenedor.appendChild(card);
    });
}

function eliminarReceta(id) {
  if (!confirm("¿Eliminar esta receta?")) return;
  recetas = recetas.filter(r => r.id !== id);
  localStorage.setItem("recetas", JSON.stringify(recetas));
  mostrarRecetas();
}

function toggleFavorito(id) {
  const receta = recetas.find(r => r.id === id);
  if (receta) receta.favorito = !receta.favorito;
  localStorage.setItem("recetas", JSON.stringify(recetas));
  mostrarRecetas();
}

function buscarRecetas() {
  mostrarRecetas();
}

function agendarReceta(nombre) {
  const dia = prompt("¿Para qué día deseas agendar esta receta? (Ej: lunes)");
  if (!dia) return;
  const planificador = document.getElementById("planificador");
  const item = document.createElement("p");
  item.textContent = `${dia.toUpperCase()}: ${nombre}`;
  planificador.appendChild(item);
}

document.addEventListener("DOMContentLoaded", mostrarRecetas);
