let recetas = JSON.parse(localStorage.getItem('recetas')) || [];
let planificador = JSON.parse(localStorage.getItem('planificador')) || {}; 
let recetaAAgendar = null;
let recetaEnEdicion = null;

// ------------------ Tema claro / oscuro ------------------
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

// ------------------ Mostrar formulario ------------------
function mostrarFormulario() {
  document.getElementById('form-title').innerText = recetaEnEdicion ? 'Editar Receta' : 'Agregar Receta';
  document.getElementById('formulario').style.display = 'block';
}

function cerrarFormulario() {
  document.getElementById('formulario').style.display = 'none';
  limpiarFormulario();
  recetaEnEdicion = null;
}

// ------------------ Modal días ------------------
function mostrarModalDia(id) {
  recetaAAgendar = id;
  document.getElementById('modal-dia').style.display = 'block';
}

function cerrarModalDia() {
  document.getElementById('modal-dia').style.display = 'none';
  recetaAAgendar = null;
  document.querySelectorAll('#modal-dia input[type="checkbox"]').forEach(cb => cb.checked = false);
}

// ------------------ Guardar receta ------------------
function guardarReceta() {
  const titulo = document.getElementById('titulo').value.trim();
  const ingredientes = document.getElementById('ingredientes').value.trim();
  const tiempo = document.getElementById('tiempo').value.trim();
  const imagen = document.getElementById('imagen').value.trim();
  const preparacion = document.getElementById('preparacion').value.trim();
  const categoria = document.getElementById('categoria').value;

  if (!titulo || !ingredientes || !tiempo || !preparacion || !categoria) {
    alert('Por favor completa todos los campos.');
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
      titulo, ingredientes, tiempo, imagen, preparacion, categoria, favorito: false,
      slug: `${titulo.toLowerCase().replace(/ /g, "-")}-${Date.now()}`
    };
    recetas.push(nuevaReceta);
  }

  localStorage.setItem('recetas', JSON.stringify(recetas));
  cerrarFormulario();
  mostrarRecetas();
}

// ------------------ Limpiar formulario ------------------
function limpiarFormulario() {
  document.getElementById('titulo').value = '';
  document.getElementById('ingredientes').value = '';
  document.getElementById('tiempo').value = '';
  document.getElementById('imagen').value = '';
  document.getElementById('preparacion').value = '';
  document.getElementById('categoria').value = '';
}

// ------------------ Mostrar recetas ------------------
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
      <img src="${r.imagen || 'https://via.placeholder.com/150'}">
      <h3>${r.titulo}</h3>
      <p>⏱ ${r.tiempo}</p>
      <p><strong>Ingredientes:</strong> ${r.ingredientes}</p>
      <p><strong>Preparación:</strong> ${r.preparacion}</p>
      <p><strong>Categoría:</strong> ${r.categoria}</p>
      <button onclick="toggleFavorito(${r.id})">${r.favorito ? '❤️ Quitar favorito' : '🤍 Marcar favorito'}</button>
      <button onclick="editarReceta(${r.id})">✏️ Editar</button>
      <button onclick="eliminarReceta(${r.id})">🗑️ Eliminar</button>
      <button onclick="mostrarModalDia(${r.id})">📆 Agendar</button>
      <button onclick="copiarURL('${r.slug}')">🔗 Compartir</button>
    `;
    contenedor.appendChild(card);
  });
}

// ------------------ Editar / eliminar ------------------
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

function eliminarReceta(id) {
  recetas = recetas.filter(r => r.id !== id);
  Object.keys(planificador).forEach(dia => {
    planificador[dia] = planificador[dia].filter(rid => rid !== id);
  });
  localStorage.setItem('recetas', JSON.stringify(recetas));
  localStorage.setItem('planificador', JSON.stringify(planificador));
  mostrarRecetas();
  mostrarPlanificador();
  generarListaCompras();
}

// ------------------ Favorito ------------------
function toggleFavorito(id) {
  const receta = recetas.find(r => r.id === id);
  if (receta) {
    receta.favorito = !receta.favorito;
    localStorage.setItem('recetas', JSON.stringify(recetas));
    mostrarRecetas();
  }
}

// ------------------ Copiar URL ------------------
function copiarURL(slug) {
  const url = `${window.location.origin}${window.location.pathname}?receta=${slug}`;
  navigator.clipboard.writeText(url).then(() => alert("Enlace copiado:\n" + url));
}

// ------------------ Agendar ------------------
// Ahora solo se guarda el id, no toda la receta
function agendarEnDias() {
  const checks = document.querySelectorAll('#modal-dia input[type="checkbox"]:checked');
  if (checks.length === 0) { alert('Selecciona al menos un día.'); return; }
  checks.forEach(cb => {
    const dia = cb.value;
    if (!planificador[dia]) planificador[dia] = [];
    planificador[dia].push(recetaAAgendar);
  });
  localStorage.setItem('planificador', JSON.stringify(planificador));
  cerrarModalDia();
  mostrarPlanificador();
  generarListaCompras();
}

// ------------------ Mostrar planificador ------------------
function mostrarPlanificador() {
  const cont = document.getElementById('planificador');
  cont.innerHTML = '';
  const dias = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  dias.forEach(dia => {
    const ids = planificador[dia] || [];
    if (ids.length > 0) {
      const diaDiv = document.createElement('div');
      diaDiv.className = 'card';
      diaDiv.innerHTML = `<h4>${dia}</h4>`;
      ids.forEach((id,index) => {
        const receta = recetas.find(r => r.id === id);
        if (!receta) return;
        diaDiv.innerHTML += `
          <div class="mini-card">
            <img src="${receta.imagen || 'https://via.placeholder.com/50'}">
            <div style="flex:1;"><strong>${receta.titulo}</strong><br><small>⏱ ${receta.tiempo}</small></div>
            <button onclick="quitarRecetaDeDia('${dia}',${index})">❌</button>
          </div>`;
      });
      cont.appendChild(diaDiv);
    }
  });
  if (cont.innerHTML === '') cont.innerHTML = '<p>No hay recetas agendadas.</p>';
}

// ------------------ Quitar de día ------------------
function quitarRecetaDeDia(dia,index) {
  planificador[dia].splice(index,1);
  localStorage.setItem('planificador', JSON.stringify(planificador));
  mostrarPlanificador();
  generarListaCompras();
}

// ------------------ Lista de compras ------------------
function generarListaCompras() {
  const lista = {};
  Object.values(planificador).flat().forEach(id => {
    const receta = recetas.find(r => r.id === id);
    if (receta) {
      receta.ingredientes.split(',').map(i=>i.trim()).forEach(item=>{
        lista[item]= (lista[item]||0)+1;
      });
    }
  });
  const cont = document.getElementById('lista-compras');
  cont.innerHTML = '';
  if (Object.keys(lista).length===0) { cont.innerHTML='<p>No hay ingredientes por mostrar.</p>'; return;}
  const ul=document.createElement('ul');
  Object.entries(lista).forEach(([item,count])=>{
    const li=document.createElement('li');
    li.textContent= `${item} x${count}`;
    ul.appendChild(li);
  });
  cont.appendChild(ul);
}

// ------------------ Inicial ------------------
aplicarTemaGuardado();
mostrarRecetas();
mostrarPlanificador();
generarListaCompras();
