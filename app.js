let recetas = JSON.parse(localStorage.getItem('recetas')) || [];
let planificador = JSON.parse(localStorage.getItem('planificador')) || {};
let recetaAAgendar = null;
let recetaEnEdicion = null;

// Tema claro / oscuro
document.getElementById('toggle-theme').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('tema', isDark ? 'oscuro' : 'claro');
  document.getElementById('toggle-theme').innerText = isDark ? '☀️ Tema Claro' : '🌙 Tema Oscuro';
});

function aplicarTemaGuardado() {
  const tema = localStorage.getItem('tema');
  if (tema === 'oscuro') {
    document.body.classList.add('dark');
    document.getElementById('toggle-theme').innerText = '☀️ Tema Claro';
  }
}

// Mostrar formulario
function mostrarFormulario() {
  document.getElementById('form-title').innerText = recetaEnEdicion ? 'Editar Receta' : 'Agregar Receta';
  document.getElementById('formulario').style.display = 'block';
}

// Cerrar formulario
function cerrarFormulario() {
  document.getElementById('formulario').style.display = 'none';
  limpiarFormulario();
  recetaEnEdicion = null;
}

// Mostrar modal para elegir días
function mostrarModalDia(id) {
  recetaAAgendar = id;
  document.getElementById('modal-dia').style.display = 'block';
}

// Cerrar modal
function cerrarModalDia() {
  document.getElementById('modal-dia').style.display = 'none';
  recetaAAgendar = null;
  document.querySelectorAll('#modal-dia input[type="checkbox"]').forEach(cb => cb.checked = false);
}

// Guardar receta (nueva o editada)
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

  if (recetaEnEdicion) {
    const receta = recetas.find(r => r.id === recetaEnEdicion);
    if (receta) {
      receta.titulo = titulo;
      receta.ingredientes = ingredientes;
      receta.tiempo = tiempo;
      receta.imagen = imagen;
      receta.preparacion = preparacion;
      receta.categoria = categoria;
    }
  } else {
    const slug = `${titulo.toLowerCase().replace(/ /g, "-")}-${Date.now()}`;
    const nuevaReceta = {
      id: Date.now(),
      titulo,
      ingredientes,
      tiempo,
      imagen,
      preparacion,
      categoria,
      slug,
      favorito: false
    };
    recetas.push(nuevaReceta);
  }

  localStorage.setItem('recetas', JSON.stringify(recetas));
  cerrarFormulario();
  mostrarRecetas();
}

// Limpiar formulario
function limpiarFormulario() {
  document.getElementById('titulo').value = '';
  document.getElementById('ingredientes').value = '';
  document.getElementById('tiempo').value = '';
  document.getElementById('imagen').value = '';
  document.getElementById('preparacion').value = '';
  document.getElementById('categoria').value = '';
}

// Mostrar recetas
function mostrarRecetas() {
  const contenedor = document.getElementById('recetas');
  contenedor.innerHTML = '';

  const textoBusqueda = document.getElementById('busqueda').value.toLowerCase();
  const filtroCategoria = document.getElementById('filtroCategoria').value;
  const verFavoritos = document.getElementById('verFavoritos').checked;

  const recetasFiltradas = recetas.filter(r =>
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
      <button onclick="mostrarModalDia(${r.id})">📆 Agendar</button>
      <button onclick="copiarURL('${r.slug}')">🔗 Compartir</button>
    `;
    contenedor.appendChild(card);
  });
}

// Editar receta
function editarReceta(id) {
  const receta = recetas.find(r => r.id === id);
  if (!receta) return;
  document.getElementById('titulo').value = receta.titulo;
  document.getElementById('ingredientes').value = receta.ingredientes;
  document.getElementById('tiempo').value = receta.tiempo;
  document.getElementById('imagen').value = receta.imagen;
  document.getElementById('preparacion').value = receta.preparacion;
  document.getElementById('categoria').value = receta.categoria;
  recetaEnEdicion = id;
  mostrarFormulario();
}

// Eliminar receta
function eliminarReceta(id) {
  recetas = recetas.filter(r => r.id !== id);
  Object.keys(planificador).forEach(dia => {
    planificador[dia] = planificador[dia].filter(r => r.id !== id);
  });
  localStorage.setItem('recetas', JSON.stringify(recetas));
  localStorage.setItem('planificador', JSON.stringify(planificador));
  mostrarRecetas();
  mostrarPlanificador();
  generarListaCompras();
}

// Favorito on/off
function toggleFavorito(id) {
  const receta = recetas.find(r => r.id === id);
  if (receta) {
    receta.favorito = !receta.favorito;
    localStorage.setItem('recetas', JSON.stringify(recetas));
    mostrarRecetas();
  }
}

// Copiar enlace
function copiarURL(slug) {
  const url = `${window.location.origin}${window.location.pathname}?receta=${slug}`;
  navigator.clipboard.writeText(url).then(() => {
    alert("Enlace copiado:\n" + url);
  });
}

// Agendar en varios días
function agendarEnDias() {
  const checkboxes = document.querySelectorAll('#modal-dia input[type="checkbox"]:checked');
  if (checkboxes.length === 0) {
    alert('Selecciona al menos un día.');
    return;
  }
  const receta = recetas.find(r => r.id === recetaAAgendar);
  if (!receta) return;

  checkboxes.forEach(cb => {
    const dia = cb.value;
    if (!planificador[dia]) planificador[dia] = [];
    planificador[dia].push(receta);
  });
  localStorage.setItem('planificador', JSON.stringify(planificador));
  recetaAAgendar = null;
  cerrarModalDia();
  mostrarPlanificador();
  generarListaCompras();
}

// Quitar receta de un día
function quitarRecetaDeDia(dia, index) {
  if (planificador[dia]) {
    planificador[dia].splice(index, 1);
    localStorage.setItem('planificador', JSON.stringify(planificador));
    mostrarPlanificador();
    generarListaCompras();
  }
}

// Mostrar planificador
function mostrarPlanificador() {
  const contenedor = document.getElementById('planificador');
  contenedor.innerHTML = '';
  const dias = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  dias.forEach(dia => {
    const recetasDia = planificador[dia] || [];
    if (recetasDia.length > 0) {
      const diaDiv = document.createElement('div');
      diaDiv.className = 'card';
      diaDiv.innerHTML = `<h4>${dia}</h4>`;
      recetasDia.forEach((r, index) => {
        diaDiv.innerHTML += `
          <div style="display:flex;align-items:center;margin-bottom:5px;">
            <img src="${r.imagen || 'https://via.placeholder.com/50'}" style="width:50px;height:50px;object-fit:cover;border-radius:5px;margin-right:8px;">
            <div style="flex:1;">
              <strong>${r.titulo}</strong><br>
              <small>⏱ ${r.tiempo}</small>
            </div>
            <button onclick="quitarRecetaDeDia('${dia}',${index})">❌</button>
          </div>`;
      });
      contenedor.appendChild(diaDiv);
    }
  });
  if (contenedor.innerHTML === '') {
    contenedor.innerHTML = '<p>No hay recetas agendadas.</p>';
  }
}

// Generar lista de compras
function generarListaCompras() {
  const listaContenedor = document.getElementById('lista-compras');
  listaContenedor.innerHTML = '';
  let todosIngredientes = [];
  Object.values(planificador).forEach(arr => {
    arr.forEach(receta =>
      todosIngredientes.push(...receta.ingredientes.split(',').map(i => i.trim()))
    );
  });
  if (todosIngredientes.length === 0) {
    listaContenedor.innerHTML = '<p>No hay ingredientes por mostrar.</p>';
    return;
  }
  const resumen = {};
  todosIngredientes.forEach(item => {
    const match = item.match(/^(\d+)\s+(.*)/);
    if (match) {
      const cantidad = parseInt(match[1]);
      const nombre = match[2].toLowerCase();
      resumen[nombre] = (resumen[nombre] || 0) + cantidad;
    } else {
      const nombre = item.toLowerCase();
      if (!(nombre in resumen)) resumen[nombre] = '-';
    }
  });
  const ul = document.createElement('ul');
  Object.entries(resumen).forEach(([nombre, cantidad]) => {
    const li = document.createElement('li');
    li.textContent = cantidad === '-' ? nombre : `${cantidad} ${nombre}`;
    ul.appendChild(li);
  });
  listaContenedor.appendChild(ul);
}

// Inicializar
aplicarTemaGuardado();
mostrarRecetas();
mostrarPlanificador();
generarListaCompras();
