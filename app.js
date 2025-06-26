let recetas = JSON.parse(localStorage.getItem("recetas")) || [];
let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
let planificador = JSON.parse(localStorage.getItem("planificador")) || {};

function guardarReceta() {
  const titulo = document.getElementById("titulo").value;
  const ingredientes = document.getElementById("ingredientes").value;
  const tiempo = document.getElementById("tiempo").value;
  const imagen = document.getElementById("imagen").value;
  const preparacion = document.getElementById("preparacion").value;
  const categoria = document.getElementById("categoria").value;

  if (!titulo || !ingredientes || !tiempo) return alert("Por favor completa todos los campos");

  const receta = {
    id: Date.now(),
    titulo,
    ingredientes: ingredientes.split(",").map(i => i.trim()),
    tiempo,
    imagen,
    preparacion,
    categoria
  };

  recetas.push(receta);
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

function mostrarRecetas() {
  const contenedor = document.getElementById("recetas");
  contenedor.innerHTML = "";
  const texto = document.getElementById("busqueda").value.toLowerCase();
  const filtroCategoria = document.getElementById("filtroCategoria").value;
  const soloFav = document.getElementById("verFavoritos").checked;

  const recetasFiltradas = recetas.filter(r =>
    (!texto || r.titulo.toLowerCase().includes(texto) || r.ingredientes.join(",").toLowerCase().includes(texto)) &&
    (!filtroCategoria || r.categoria === filtroCategoria) &&
    (!soloFav || favoritos.includes(r.id))
  );

  if (recetasFiltradas.length === 0) {
    contenedor.innerHTML = "<p>No se encontraron recetas.</p>";
    return;
  }

  recetasFiltradas.forEach(r => {
    const div = document.createElement("div");
    div.className = "tarjeta";
    div.innerHTML = `
      <img src="${r.imagen}" onerror="this.src='https://via.placeholder.com/300x150?text=Sin+imagen'" alt="${r.titulo}"/>
      <h3>${r.titulo}</h3>
      <p>⏱ ${r.tiempo}</p>
      <p><strong>${r.categoria || "Sin categoría"}</strong></p>
      <p>
        <button onclick="verDetalle(${r.id})">Ver más</button>
        <button onclick="editarReceta(${r.id})">✏️ Editar</button>
        <button onclick="eliminarReceta(${r.id})">🗑️ Eliminar</button>
        <button onclick="toggleFavorito(${r.id})">${favoritos.includes(r.id) ? "💔" : "❤️"}</button>
        <button onclick="agregarAPlan(${r.id})">📆 Agendar</button>
      </p>
    `;
    contenedor.appendChild(div);
  });
}

function verDetalle(id) {
  const receta = recetas.find(r => r.id === id);
  if (!receta) return;
  alert(`Ingredientes: ${receta.ingredientes.join(", ")}\n\nPreparación:\n${receta.preparacion}`);
}

function editarReceta(id) {
  const receta = recetas.find(r => r.id === id);
  if (!receta) return;

  document.getElementById("titulo").value = receta.titulo;
  document.getElementById("ingredientes").value = receta.ingredientes.join(", ");
  document.getElementById("tiempo").value = receta.tiempo;
  document.getElementById("imagen").value = receta.imagen;
  document.getElementById("preparacion").value = receta.preparacion;
  document.getElementById("categoria").value = receta.categoria || "";

  eliminarReceta(id);
  document.getElementById("formulario").style.display = "block";
}

function eliminarReceta(id) {
  recetas = recetas.filter(r => r.id !== id);
  localStorage.setItem("recetas", JSON.stringify(recetas));
  mostrarRecetas();
}

function toggleFavorito(id) {
  if (favoritos.includes(id)) {
    favoritos = favoritos.filter(f => f !== id);
  } else {
    favoritos.push(id);
  }
  localStorage.setItem("favoritos", JSON.stringify(favoritos));
  mostrarRecetas();
}

function buscarRecetas() {
  mostrarRecetas();
}

function agregarAPlan(id) {
  const receta = recetas.find(r => r.id === id);
  if (!receta) return;

  const dia = prompt("¿Para qué día de la semana? (ej. lunes, martes...)").toLowerCase();
  const comida = prompt("¿Desayuno, Almuerzo o Cena?").toLowerCase();

  if (!planificador[dia]) planificador[dia] = {};
  planificador[dia][comida] = receta.titulo;

  localStorage.setItem("planificador", JSON.stringify(planificador));
  mostrarPlanificador();
}

function mostrarPlanificador() {
  const cont = document.getElementById("planificador");
  cont.innerHTML = "";
  const dias = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

  dias.forEach(dia => {
    const card = document.createElement("div");
    card.className = "dia-card";
    card.innerHTML = `<h3>${dia}</h3>
      <p>🍳 Desayuno: ${planificador[dia]?.desayuno || "-"}</p>
      <p>🍽️ Almuerzo: ${planificador[dia]?.almuerzo || "-"}</p>
      <p>🌙 Cena: ${planificador[dia]?.cena || "-"}</p>`;
    cont.appendChild(card);
  });

  const btn = document.createElement("button");
  btn.innerText = "🖨️ Imprimir Plan y Lista de Compras";
  btn.onclick = imprimirTodo;
  cont.appendChild(btn);
}

function imprimirTodo() {
  let salida = "📅 Planificador Semanal:\n\n";
  const dias = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
  dias.forEach(dia => {
    salida += `\n${dia.toUpperCase()}:\n`;
    salida += `Desayuno: ${planificador[dia]?.desayuno || "-"}\n`;
    salida += `Almuerzo: ${planificador[dia]?.almuerzo || "-"}\n`;
    salida += `Cena: ${planificador[dia]?.cena || "-"}\n`;
  });

  let ingredientesSet = new Set();
  Object.values(planificador).forEach(comidas => {
    Object.values(comidas).forEach(nombre => {
      const receta = recetas.find(r => r.titulo === nombre);
      receta?.ingredientes.forEach(i => ingredientesSet.add(i));
    });
  });

  salida += "\n🛒 Lista de Compras:\n" + Array.from(ingredientesSet).join(", ");
  alert(salida);
}

mostrarRecetas();
mostrarPlanificador();
