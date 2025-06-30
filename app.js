let recetas = [];
let planificador = {};  // local cache de planificador
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

// Login / Logout
document.getElementById('login-btn').addEventListener('click', async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  try { await auth.signInWithPopup(provider); }
  catch (e) { alert('Error al iniciar sesión: ' + e.message); }
});
document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());

// Escuchar sesión
auth.onAuthStateChanged(user => {
  usuarioActual = user;
  esAdmin = user && user.email === adminEmail;
  document.getElementById('login-btn').style.display = user ? 'none' : '';
  document.getElementById('logout-btn').style.display = user ? '' : 'none';
  document.querySelector('.agregar-btn').style.display = esAdmin ? '' : 'none';
  cargarRecetas();
  cargarPlanificador();
});

// CRUD Recetas
async function cargarRecetas() {
  try {
    const snap = await db.collection('recetas').get();
    recetas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    mostrarRecetas();
  } catch (e) { console.error('Error cargando recetas:', e); }
}
async function guardarReceta() {
  const t = document.getElementById('titulo').value.trim();
  const i = document.getElementById('ingredientes').value.trim();
  const ti = document.getElementById('tiempo').value.trim();
  const im = document.getElementById('imagen').value.trim();
  const p = document.getElementById('preparacion').value.trim();
  const c = document.getElementById('categoria').value;
  if (!t || !i || !ti || !p || !c) return alert('Completa todos los campos.');
  try {
    if (recetaEnEdicion)
      await db.collection('recetas').doc(recetaEnEdicion).update({ titulo: t, ingredientes: i, tiempo: ti, imagen: im, preparacion: p, categoria: c });
    else
      await db.collection('recetas').add({ titulo: t, ingredientes: i, tiempo: ti, imagen: im, preparacion: p, categoria: c });
    cerrarFormulario(); cargarRecetas();
  } catch (e) { alert('Error guardando receta: ' + e.message); }
}
async function eliminarReceta(id) {
  if (!confirm('¿Eliminar receta?')) return;
  try { await db.collection('recetas').doc(id).delete(); cargarRecetas(); }
  catch (e) { alert('Error eliminando receta: ' + e.message); }
}
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

// Mostrar recetas
function mostrarRecetas() {
  const cont = document.getElementById('recetas'); cont.innerHTML = '';
  const txt = document.getElementById('busqueda').value.toLowerCase();
  const cat = document.getElementById('filtroCategoria').value;
  const filtradas = recetas.filter(r =>
    (!txt || r.titulo.toLowerCase().includes(txt) || r.ingredientes.toLowerCase().includes(txt)) &&
    (!cat || r.categoria === cat)
  );
  if (filtradas.length === 0) cont.innerHTML = '<p>No se encontraron recetas.</p>';
  filtradas.forEach(r => {
    const c = document.createElement('div'); c.className = 'card';
    c.innerHTML = `
      <img src="${r.imagen || 'https://via.placeholder.com/150'}">
      <h3>${r.titulo}</h3>
      <p>⏱ ${r.tiempo}</p>
      <p><strong>Ingredientes:</strong> ${r.ingredientes}</p>
      <p><strong>Preparación:</strong> ${r.preparacion}</p>
      <p><strong>Categoría:</strong> ${r.categoria}</p>
      ${usuarioActual ? `
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
  if (checks.length === 0) return alert('Selecciona días');
  try {
    for (const cb of checks) {
      await db.collection('usuarios').doc(usuarioActual.uid)
        .collection('planificador').doc(cb.value)
        .set({ recetas: firebase.firestore.FieldValue.arrayUnion(recetaAAgendar) }, { merge: true });
    }
    cerrarModalDia(); cargarPlanificador();
  } catch (e) { alert('Error agendando: ' + e.message); }
}

// Planificador con ingredientes
async function cargarPlanificador() {
  if (!usuarioActual) return;
  const cont = document.getElementById('planificador'); cont.innerHTML = '';
  planificador = {}; // reset cache
  const dias = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  for (const dia of dias) {
    const doc = await db.collection('usuarios').doc(usuarioActual.uid)
      .collection('planificador').doc(dia).get();
    const ids = doc.exists && doc.data().recetas || [];
    planificador[dia] = ids;  // guardar en cache
    if (ids.length > 0) {
      const div = document.createElement('div'); div.className = 'card';
      div.innerHTML = `<h4>${dia}</h4>`;
      ids.forEach(id => {
        const r = recetas.find(rr => rr.id === id);
        if (r) div.innerHTML += `<div>🍽️ ${r.titulo} <small>(${r.ingredientes})</small></div>`;
      });
      cont.appendChild(div);
    }
  }
  generarListaCompras();
}

// Lista de compras desde agendado
function generarListaCompras() {
  const lista = document.getElementById('lista-compras'); lista.innerHTML = '';
  let items = [];
  Object.values(planificador).forEach(ids => {
    ids.forEach(id => {
      const r = recetas.find(rr => rr.id === id);
      if (r) items.push(...r.ingredientes.split(',').map(s=>s.trim()));
    });
  });
  if (items.length === 0) { lista.innerHTML = '<p>No hay ingredientes.</p>'; return; }
  const resumen = {};
  items.forEach(i => resumen[i] = (resumen[i]||0)+1);
  const ul = document.createElement('ul');
  Object.keys(resumen).forEach(i => {
    const li = document.createElement('li'); li.textContent = i;
    ul.appendChild(li);
  });
  lista.appendChild(ul);
}

// Compartir
function compartir(t) {
  navigator.clipboard.writeText(location.href + '?q=' + encodeURIComponent(t))
    .then(()=>alert('Enlace copiado'))
    .catch(()=>alert('Error copiando'));
}

// Formularios
function mostrarFormulario() { document.getElementById('formulario').style.display = 'block'; }
function cerrarFormulario() { document.getElementById('formulario').style.display = 'none'; recetaEnEdicion = null; }

// Inicial
aplicarTemaGuardado();
