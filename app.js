// Estado global
let recetas = [];
let planificador = {};
let recetaAAgendar = null;
let recetaEnEdicion = null;
let usuarioActual = null;
let esAdmin = false;
let favoritos = [];

// Tema claro/oscuro
document.getElementById('toggle-theme').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('tema', isDark ? 'oscuro' : 'claro');
  document.getElementById('toggle-theme').innerText = isDark ? '☀️' : '🌙';
});
function aplicarTemaGuardado() {
  const tema = localStorage.getItem('tema');
  if (tema === 'oscuro') {
    document.body.classList.add('dark');
    document.getElementById('toggle-theme').innerText = '☀️';
  }
}

// Login/Logout
document.getElementById('login-btn').addEventListener('click', async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(provider);
  } catch (e) {
    alert('Error al iniciar sesión: ' + e.message);
  }
});
document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());

// Escuchar cambios de sesión
auth.onAuthStateChanged(async user => {
  usuarioActual = user;
  esAdmin = user && user.email === adminEmail;
  document.getElementById('login-btn').style.display = user ? 'none' : '';
  document.getElementById('logout-btn').style.display = user ? '' : 'none';
  document.querySelector('.agregar-btn').style.display = esAdmin ? '' : 'none';
  document.getElementById('user-name').innerText = user ? `Hola, ${user.displayName}` : '';

  if (user) {
    await cargarRecetas();
    await cargarFavoritos();
    await cargarPlanificador();
    await generarListaCompras();
  } else {
    recetas = [];
    favoritos = [];
    planificador = {};
    mostrarRecetas();
  }
});

// Cargar recetas
async function cargarRecetas() {
  try {
    const snap = await db.collection('recetas').get();
    recetas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    mostrarRecetas();
  } catch (e) {
    console.error('Error cargando recetas:', e);
  }
}

// Guardar receta
async function guardarReceta() {
  const titulo = document.getElementById('titulo').value.trim();
  const ingredientes = document.getElementById('ingredientes').value.trim();
  const tiempo = document.getElementById('tiempo').value.trim();
  const imagen = document.getElementById('imagen').value.trim();
  const preparacion = document.getElementById('preparacion').value.trim();
  const categoria = document.getElementById('categoria').value;

  if (!titulo || !ingredientes || !tiempo || !preparacion || !categoria) {
    alert('Completa todos los campos.');
    return;
  }

  try {
    if (recetaEnEdicion) {
      await db.collection('recetas').doc(recetaEnEdicion)
        .update({ titulo, ingredientes, tiempo, imagen, preparacion, categoria });
    } else {
      await db.collection('recetas').add({ titulo, ingredientes, tiempo, imagen, preparacion, categoria });
    }
    cerrarFormulario();
    await cargarRecetas();
  } catch (e) {
    alert('Error guardando receta: ' + e.message);
  }
}

// Editar receta
function editarReceta(id) {
  const r = recetas.find(r => r.id === id);
  if (!r) return;
  document.getElementById('form-title').innerText = 'Editar Receta';
  document.getElementById('titulo').value = r.titulo;
  document.getElementById('ingredientes').value = r.ingredientes;
  document.getElementById('tiempo').value = r.tiempo;
  document.getElementById('imagen').value = r.imagen;
  document.getElementById('preparacion').value = r.preparacion;
  document.getElementById('categoria').value = r.categoria;
  recetaEnEdicion = r.id;
  mostrarFormulario();
}

// Eliminar receta
async function eliminarReceta(id) {
  if (!confirm('¿Eliminar receta?')) return;
  try {
    await db.collection('recetas').doc(id).delete();
    await cargarRecetas();
    await cargarPlanificador();
    await generarListaCompras();
  } catch (e) {
    alert('Error eliminando receta: ' + e.message);
  }
}

// Mostrar recetas
function mostrarRecetas() {
  const cont = document.getElementById('recetas'); cont.innerHTML = '';
  const txt = document.getElementById('busqueda').value.toLowerCase();
  const cat = document.getElementById('filtroCategoria').value;
  const verFav = document.getElementById('verFavoritos').checked;

  let filtradas = recetas.filter(r =>
    (!txt || r.titulo.toLowerCase().includes(txt) || r.ingredientes.toLowerCase().includes(txt)) &&
    (!cat || r.categoria === cat)
  );
  if (verFav) filtradas = filtradas.filter(r => favoritos.includes(r.id));

  if (filtradas.length === 0) {
    cont.innerHTML = '<p>No se encontraron recetas.</p>';
    return;
  }

  filtradas.forEach(r => {
    const c = document.createElement('div'); c.className = 'card';
    c.innerHTML = `
      <img src="${r.imagen || 'https://via.placeholder.com/150'}" alt="">
      <h3>${r.titulo}</h3>
      <p>⏱ ${r.tiempo}</p>
      <p><strong>Ingredientes:</strong> ${r.ingredientes}</p>
      <p><strong>Preparación:</strong> ${r.preparacion}</p>
      <p><strong>Categoría:</strong> ${r.categoria}</p>
      ${usuarioActual ? `
        <button onclick="toggleFavorito('${r.id}')">
          ${favoritos.includes(r.id) ? '❤️ Quitar favorito' : '🤍 Marcar favorito'}
        </button>
        <button onclick="mostrarModalDia('${r.id}')">📆 Agendar</button>
        <button onclick="compartir('${r.titulo}')">🔗 Compartir</button>
        ${esAdmin ? `
          <button onclick="editarReceta('${r.id}')">✏️ Editar</button>
          <button onclick="eliminarReceta('${r.id}')">🗑️ Eliminar</button>` : ''}
      ` : ''}
    `;
    cont.appendChild(c);
  });
}

// Favoritos
async function toggleFavorito(id) {
  if (!usuarioActual) return alert('Inicia sesión primero');
  const ref = db.collection('usuarios').doc(usuarioActual.uid);
  const doc = await ref.get();
  let favs = (doc.exists && doc.data().favoritos) || [];
  try {
    if (favs.includes(id)) {
      await ref.update({ favoritos: firebase.firestore.FieldValue.arrayRemove(id) });
    } else {
      await ref.set({ favoritos: firebase.firestore.FieldValue.arrayUnion(id) }, { merge: true });
    }
    await cargarFavoritos();
  } catch (e) {
    alert('Error actualizando favorito: ' + e.message);
  }
}
async function cargarFavoritos() {
  if (!usuarioActual) { favoritos = []; return; }
  const doc = await db.collection('usuarios').doc(usuarioActual.uid).get();
  favoritos = (doc.exists && doc.data().favoritos) || [];
  mostrarRecetas();
}

// Modal agendar
function mostrarModalDia(id) {
  recetaAAgendar = id;
  document.getElementById('modal-dia').style.display = 'block';
}
function cerrarModalDia() {
  document.getElementById('modal-dia').style.display = 'none';
  recetaAAgendar = null;
  document.querySelectorAll('#modal-dia input[type="checkbox"]').forEach(cb => cb.checked = false);
}
async function agendarEnDias() {
  if (!usuarioActual) return alert('Inicia sesión primero');
  const checks = [...document.querySelectorAll('#modal-dia input[type="checkbox"]:checked')];
  if (checks.length === 0) return alert('Selecciona al menos un día');
  try {
    for (const cb of checks) {
      await db.collection('usuarios').doc(usuarioActual.uid)
        .collection('planificador').doc(cb.value)
        .set({ recetas: firebase.firestore.FieldValue.arrayUnion(recetaAAgendar) }, { merge: true });
    }
    cerrarModalDia();
    await cargarPlanificador();
    await generarListaCompras();
  } catch (e) {
    alert('Error agendando: ' + e.message);
  }
}

// Planificador
async function cargarPlanificador() {
  if (!usuarioActual) return;
  const cont = document.getElementById('planificador'); cont.innerHTML = '';
  const dias = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  for (const dia of dias) {
    const doc = await db.collection('usuarios').doc(usuarioActual.uid)
      .collection('planificador').doc(dia).get();
    const ids = (doc.exists && doc.data().recetas) || [];
    const recetasValidas = ids.map(id => recetas.find(r => r.id === id)).filter(Boolean);
    if (recetasValidas.length > 0) {
      const div = document.createElement('div'); div.className = 'card';
      div.innerHTML = `<h4>${dia}</h4>`;
      recetasValidas.forEach(r => {
        div.innerHTML += `
          <div class="plan-item">
            <span>${r.categoria}: ${r.titulo}</span>
            <button onclick="quitarAgendado('${dia}','${r.id}')">❌</button>
          </div>`;
      });
      cont.appendChild(div);
    }
  }
}
async function quitarAgendado(dia, id) {
  if (!usuarioActual) return;
  try {
    await db.collection('usuarios').doc(usuarioActual.uid)
      .collection('planificador').doc(dia)
      .update({ recetas: firebase.firestore.FieldValue.arrayRemove(id) });
    await cargarPlanificador();
    await generarListaCompras();
  } catch (e) {
    alert('Error quitando del planificador: ' + e.message);
  }
}

// Compartir
function compartir(titulo) {
  navigator.clipboard.writeText(location.href + '?q=' + encodeURIComponent(titulo))
    .then(() => alert('Enlace copiado'))
    .catch(() => alert('Error copiando'));
}

// Formularios
function mostrarFormulario() {
  document.getElementById('formulario').style.display = 'block';
}
function cerrarFormulario() {
  document.getElementById('formulario').style.display = 'none';
  recetaEnEdicion = null;
}

// Lista de compras
async function generarListaCompras() {
  if (!usuarioActual) return;
  const cont = document.getElementById('lista-compras'); cont.innerHTML = '';
  let ingredientes = [];
  const dias = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  for (const dia of dias) {
    const doc = await db.collection('usuarios').doc(usuarioActual.uid)
      .collection('planificador').doc(dia).get();
    const ids = (doc.exists && doc.data().recetas) || [];
    ids.forEach(id => {
      const r = recetas.find(r => r.id === id);
      if (r) ingredientes.push(...r.ingredientes.split(',').map(i => i.trim()));
    });
  }
  if (ingredientes.length === 0) {
    cont.innerHTML = '<p>No hay ingredientes por mostrar.</p>';
    return;
  }
  const resumen = {};
  ingredientes.forEach(item => {
    const nombre = item.toLowerCase();
    resumen[nombre] = (resumen[nombre] || 0) + 1;
  });
  const ul = document.createElement('ul');
  Object.entries(resumen).forEach(([nombre, cantidad]) => {
    const li = document.createElement('li');
    li.textContent = `${cantidad} x ${nombre}`;
    ul.appendChild(li);
  });
  cont.appendChild(ul);
}

// Sidebar
function openNav() {
  document.getElementById('mySidebar').style.width = '250px';
  document.getElementById('overlay').style.display = 'block';
}
function closeNav() {
  document.getElementById('mySidebar').style.width = '0';
  document.getElementById('overlay').style.display = 'none';
}

// Mostrar secciones
function mostrarFavoritos() {
  document.getElementById('verFavoritos').checked = true;
  mostrarRecetas();
  closeNav();
}
function mostrarPlanificador() {
  cargarPlanificador();
  closeNav();
}
function mostrarListaCompras() {
  generarListaCompras();
  closeNav();
}

// Inicial
aplicarTemaGuardado();
