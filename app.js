let recetas = JSON.parse(localStorage.getItem('recetas')) || [];
let planificador = JSON.parse(localStorage.getItem('planificador')) || [];

function guardarReceta() {
  const titulo = document.getElementById('titulo').value.trim();
  const ingredientes = document.getElementById('ingredientes').value.trim();
  const tiempo = document.getElementById('tiempo').value.trim();
  const imagen = document.getElementById('imagen').value.trim();
  const preparacion = document.getElementById('preparacion').value.trim();
  const categoria = document.getElementById('categoria').value;

  if (!titulo || !ingredientes || !tiempo || !preparacion) {
    alert('Por favor completa todos los campos obligatorios.');
    return;
  }

  const nuevaReceta = {
    id: Date.now(),
    titulo,
    ingredientes,
    tiempo,
    imagen,
    preparacion,
    categoria,
    favorito: false
  };

  recetas.push(nuevaReceta);
  localStorage.setItem('recetas', JSON.stringify(recetas));
  document.getElementById('formulario').style.display = 'none';
  limpiarFormulario();
  mostrarRecetas();
}

function limpiarFormulario() {
  document.getElementById('titulo').value = '';
  document.getElementById('ingredientes').value = '';
  document.getElementById('tiempo').value = '';
  document.getElementById('imagen').value = '';
  document.getElementById('preparacion').value = '';
  document.getElementById('categoria').value = '';
}

function mostrarRecetas() {
  const contenedor = document.getElementById('recetas');
  contenedor.innerHTML = '';

  const textoBusqueda = document.getElementById('busqueda').value.toLowerCase();
  const filtroCategoria = document.getElementById('filtroCategoria').value;
  const verFavoritos = document.getElementById('verFavoritos').checked;

  let recetasFiltradas = recetas.filter(r =>
    (!textoBusqueda || r.titulo.toLowerCase().includes(textoBusqueda) || r.ingredientes.toLowerCase().includes(textoBusqueda)) &&
    (!filtroCategoria || r.categoria === filtroCategoria) &&
    (!verFavoritos || r.favorito)
  );

  if (recetasFiltradas.length === 0) {
    contenedor.innerHTML = '<p>No se encontraron recetas.</p>';
    return;
  }

  recetasFiltradas.forEach(r => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${r.imagen || 'https://via.placeholder.com/150'}" alt="Imagen receta">
      <h3>${r.titulo}</h3>
      <p>⏱ ${r.tiempo}</p>
      <p><strong>Ingredientes:</strong> ${r.ingredientes}</p>
      <p><strong>Preparación:</strong> ${r.preparacion}</p>
      <p><strong>Categoría:</strong> ${r.categoria || 'Sin categoría'}</p>
      <button onclick="toggleFavorito(${r.id})">${r.favorito ? '❤️ Quitar favorito' : '🤍 Marcar favorito'}</button>
      <button onclick="editarReceta(${r.id})">✏️ Editar</button>
      <button onclick="eliminarReceta(${r.id})">🗑️ Eliminar</button>
      <button onclick="agendar(${r.id})">📆 Agendar</button>
    `;
    contenedor.appendChild(card);
  });
}

function editarReceta(id) {
  const receta = recetas.find(r => r.id === id);
  if (!receta) return;

  document.getElementById('titulo').value = receta.titulo;
  document.getElementById('ingredientes').value = receta.ingredientes;
  document.getElementById('tiempo').value = receta.tiempo;
  document.getElementById('imagen').value = receta.imagen;
  document.getElementById('preparacion').value = receta.preparacion;
  document.getElementById('categoria').value = receta.categoria;
  document.getElementById('formulario').style.display = 'block';

  eliminarReceta(id);
}

function eliminarReceta(id) {
  if (confirm('¿Seguro que deseas eliminar esta receta?')) {
    recetas = recetas.filter(r => r.id !== id);
    localStorage.setItem('recetas', JSON.stringify(recetas));
    mostrarRecetas();
  }
}

function toggleFavorito(id) {
  const receta = recetas.find(r => r.id === id);
  if (receta) {
    receta.favorito = !receta.favorito;
    localStorage.setItem('recetas', JSON.stringify(recetas));
    mostrarRecetas();
  }
}

function buscarRecetas() {
  mostrarRecetas();
}

function agendar(id) {
  const receta = recetas.find(r => r.id === id);
  if (receta && !planificador.find(p => p.id === id)) {
    planificador.push(receta);
    localStorage.setItem('planificador', JSON.stringify(planificador));
    mostrarPlanificador();
  }
}

function cancelarAgenda(id) {
  planificador = planificador.filter(p => p.id !== id);
  localStorage.setItem('planificador', JSON.stringify(planificador));
  mostrarPlanificador();
}

function mostrarPlanificador() {
  const contenedor = document.getElementById('planificador');
  contenedor.innerHTML = '';

  if (planificador.length === 0) {
    contenedor.innerHTML = '<p>No hay recetas agendadas.</p>';
    return;
  }

  planificador.forEach(r => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${r.titulo}</h3>
      <p>⏱ ${r.tiempo}</p>
      <button onclick="cancelarAgenda(${r.id})">❌ Quitar del plan</button>
    `;
    contenedor.appendChild(card);
  });
}

// Mostrar al cargar
mostrarRecetas();
mostrarPlanificador();
