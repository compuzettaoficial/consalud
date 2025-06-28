let recetas = JSON.parse(localStorage.getItem('recetas')) || [];
let planificador = JSON.parse(localStorage.getItem('planificador')) || {};
let recetaEnEdicion = null;
let recetaAAgendar = null;

// Tema claro/oscuro
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

// Guardar receta (nueva o editada)
function guardarReceta() {
  const titulo = document.getElementById('titulo').value.trim();
  const ingredientes = document.getElementById('ingredientes').value.trim();
  const tiempo = document.getElementById('tiempo').value.trim();
  const imagen = document.getElementById('imagen').value.trim();
  const preparacion = document.getElementById('preparacion').value.trim();
  const categoria = document.getElementById('categoria').value.trim();

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
    const nuevaReceta = {
      id: Date.now(),
      titulo, ingredientes, tiempo, imagen, preparacion, categoria,
      slug: `${titulo.toLowerCase().replace(/ /g, "-")}-${Date.now()}`,
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

// Editar receta
function editarReceta(id) {
  const receta = recetas.find(r => r.id === id);
  if (!receta) return;
  recetaEnEdicion = id;
  document.getElementById('titulo').value = receta.titulo;
  document.getElementById('ingredientes').value = receta.ingredientes;
  document.getElementById('tiempo').value = receta.tiempo;
  document.getElementById('imagen').value = receta.imagen;
  document.getElementById('preparacion').value = receta.preparacion;
  document.getElementById('categoria').value = receta.categoria;
  mostrarFormulario();
}

// Eliminar receta + quitarla del planificador
function eliminarReceta(id) {
  recetas = recetas.filter(r => r.id !== id);
  for (let dia in planificador) {
    planificador[dia] = planificador[dia].filter(r => r.id !== id);
  }
  localStorage.setItem('recetas', JSON.stringify(recetas));
  localStorage.setItem('planificador', JSON.stringify(planificador));
  mostrarRecetas();
  mostrarPlanificador();
  generarListaCompras();
}

// Favorito
function toggleFavorito(id) {
  const receta = recetas.find(r => r.id === id);
  if (receta) {
    receta.favorito = !receta.favorito;
    localStorage.setItem('recetas', JSON.stringify(recetas));
    mostrarRecetas();
  }
}

// Compartir
function copiarURL(slug) {
  const url = `${window.location.origin}${window.location.pathname}?receta=${slug}`;
  navigator.clipboard.writeText(url).then(() => {
    alert("Enlace copiado al portapapeles:\n" + url);
  });
}

// Mostrar recetas
function mostrarRecetas() {
  const contenedor = document.getElementById('recetas');
  contenedor.innerHTML = '';

  const textoBusqueda = document.getElementById('busqueda').value.toLowerCase();
  const filtroCategoria = document.getElementById('filtroCategoria').value;
  const verFavoritos = document.getElementById('verFavoritos').checked;

  const filtradas = recetas.filter(r =>
    (!textoBusqueda || r.titulo.toLowerCase().includes(textoBusqueda) || r.ingredientes.toLowerCase().includes(textoBusqueda)) &&
    (!filtroCategoria || r.categoria === filtroCategoria) &&
    (!verFavoritos || r.favorito)
  );

  if (filtradas.length === 0) {
    contenedor.innerHTML = '<p>No se encontraron recetas.</p>';
    return;
  }

  filtradas.forEach(r => {
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

// Mostrar modal multi‑check para agendar
function mostrarModalDia(id) {
  recetaAAgendar = id;
  document.querySelectorAll('#modal-dia input[type="checkbox"]').forEach(cb => cb.checked = false);
  document.getElementById('modal-dia').style.display = 'block';
}

// Cerrar modal
function cerrarModalDia() {
  document.getElementById('modal-dia').style.display = 'none';
  recetaAAgendar = null;
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
  cerrarModalDia();
  mostrarPlanificador();
  generarListaCompras();
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
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.innerHTML = `
          <img src="${r.imagen || 'https://via.placeholder.com/50'}" style="width:50px;height:50px;object-fit:cover;border-radius:5px;margin-right:8px;">
          <div style="flex:1;">
            <strong>${r.titulo}</strong><br>
            <small>⏱ ${r.tiempo}</small>
          </div>
          <button onclick="quitarRecetaDeDia('${dia}',${index})">❌</button>
        `;
        diaDiv.appendChild(item);
      });
      contenedor.appendChild(diaDiv);
    }
  });
  if (contenedor.innerHTML === '') {
    contenedor.innerHTML = '<p>No hay recetas agendadas.</p>';
  }
}

// Quitar receta de un día
function quitarRecetaDeDia(dia, index) {
  planificador[dia].splice(index, 1);
  localStorage.setItem('planificador', JSON.stringify(planificador));
  mostrarPlanificador();
  generarListaCompras();
}

// Generar lista de compras
function generarListaCompras() {
  const cont = document.getElementById('lista-compras');
  cont.innerHTML = '';
  let todosIngredientes = [];
  Object.values(planificador).flat().forEach(r =>
    todosIngredientes.push(...r.ingredientes.split(',').map(i => i.trim()))
  );
  if (todosIngredientes.length === 0) {
    cont.innerHTML = '<p>No hay ingredientes por mostrar.</p>';
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
      resumen[nombre] = resumen[nombre] || '-';
    }
  });
  const ul = document.createElement('ul');
  Object.entries(resumen).forEach(([nombre, cantidad]) => {
    const li = document.createElement('li');
    li.textContent = cantidad === '-' ? nombre : `${cantidad} ${nombre}`;
    ul.appendChild(li);
  });
  cont.appendChild(ul);
}

// Al iniciar
aplicarTemaGuardado();
mostrarRecetas();
mostrarPlanificador();
generarListaCompras();
