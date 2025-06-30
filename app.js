let recetas = [];
let planificador = {};
let recetaAAgendar = null;
let recetaEnEdicion = null;
let usuarioActual = null;
let esAdmin = false;

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

// Login
document.getElementById('login-btn').addEventListener('click', async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(provider);
  } catch (e) {
    alert('Error al iniciar sesión: ' + e.message);
  }
});
// Logout
document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());

// Escuchar cambios de sesión
auth.onAuthStateChanged(user => {
  usuarioActual = user;
  esAdmin = user && user.email === adminEmail;
  document.getElementById('login-btn').style.display = user ? 'none' : '';
  document.getElementById('logout-btn').style.display = user ? '' : 'none';
  document.getElementById('add-recipe-btn').style.display = esAdmin ? '' : 'none';
  cargarRecetas();
  cargarPlanificador();
});

// CRUD Recetas
async function cargarRecetas() {
  try {
    const snapshot = await db.collection('recetas').get();
    recetas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    mostrarRecetas();
  } catch (e) {
    console.error('Error cargando recetas:', e);
  }
}
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
      await db.collection('recetas').doc(recetaEnEdicion).update({ titulo, ingredientes, tiempo, imagen, preparacion, categoria });
    } else {
      await db.collection('recetas').add({ titulo, ingredientes, tiempo, imagen, preparacion, categoria });
    }
    cerrarFormulario();
    cargarRecetas();
  } catch (e) {
    alert('Error guardando receta: ' + e.message);
  }
}
async function eliminarReceta(id) {
  if (!confirm('¿Eliminar receta?')) return;
  try {
    await db.collection('recetas').doc(id).delete();
    cargarRecetas();
  } catch (e) {
    alert('Error eliminando receta: ' + e.message);
  }
}
function editarReceta(id) {
  const receta = recetas.find(r => r.id === id);
  if (!receta) return;
  document.getElementById('form-title').innerText = 'Editar Receta';
  document.getElementById('titulo').value = receta.titulo;
  document.getElementById('ingredientes').value = receta.ingredientes;
  document.getElementById('tiempo').value = receta.tiempo;
  document.getElementById('imagen').value = receta.imagen;
  document.getElementById('preparacion').value = receta.preparacion;
  document.getElementById('categoria').value = receta.categoria;
  recetaEnEdicion = receta.id;
  mostrarFormulario();
}

// Mostrar recetas filtradas
function mostrarRecetas() {
  const cont = document.getElementById('recetas');
  cont.innerHTML = '';
  const txt = document.getElementById('busqueda').value.toLowerCase();
  const cat = document.getElementById('filtroCategoria').value;
  const verFav = document.getElementById('verFavoritos').checked;

  const filtradas = recetas.filter(r =>
    (!txt || r.titulo.toLowerCase().includes(txt) || r.ingredientes.toLowerCase().includes(txt)) &&
    (!cat || r.categoria === cat)
  );
  if (filtradas.length === 0) cont.innerHTML = '<p>No se encontraron recetas.</p>';
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
        <button onclick="agendar('${r.id}')">📆 Agendar</button>
        <button onclick="compartir('${r.titulo}')">🔗 Compartir</button>
        ${esAdmin ? `
          <button onclick="editarReceta('${r.id}')">✏️ Editar</button>
          <button onclick="eliminarReceta('${r.id}')">🗑️ Eliminar</button>` : ''}
      ` : ''}
    `;
    cont.appendChild(c);
  });
}

// Planificador
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
    cargarPlanificador();
  } catch (e) {
    alert('Error agendando: ' + e.message);
  }
}
async function cargarPlanificador() {
  if (!usuarioActual) return;
  const cont = document.getElementById('planificador'); cont.innerHTML = '';
  const dias = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  for (const dia of dias) {
    const doc = await db.collection('usuarios').doc(usuarioActual.uid)
      .collection('planificador').doc(dia).get();
    const ids = doc.exists && doc.data().recetas || [];
    if (ids.length > 0) {
      const div = document.createElement('div'); div.className = 'card';
      div.innerHTML = `<h4>${dia}</h4>`;
      ids.forEach(id => {
        const r = recetas.find(rr => rr.id === id);
        if (r) div.innerHTML += `<div>${r.titulo}</div>`;
      });
      cont.appendChild(div);
    }
  }
}

// Compartir
function compartir(titulo) {
  navigator.clipboard.writeText(location.href + '?q=' + encodeURIComponent(titulo))
    .then(()=>alert('Enlace copiado'))
    .catch(()=>alert('Error copiando'));
}

// Formularios
function mostrarFormulario() {
  document.getElementById('formulario').style.display = 'block';
}
function cerrarFormulario() {
  document.getElementById('formulario').style.display = 'none';
  recetaEnEdicion = null;
}

// Inicial
aplicarTemaGuardado();
