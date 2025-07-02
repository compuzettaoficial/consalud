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
  if (user) {
    await cargarFavoritos();
    await cargarPlanificador();
    await generarListaCompras();
  } else {
    favoritos = [];
  }
  await cargarRecetas();
});

// CRUD Recetas
async function cargarRecetas() {
  try {
    const snap = await db.collection('recetas').get();
    recetas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

// Mostrar recetas (MODIFICADO para mostrar ingredientes y preparación)
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

  if (filtradas.length === 0) cont.innerHTML = '<p>No se encontraron recetas.</p>';
  filtradas.forEach(r => {
    const c = document.createElement('div'); c.className = 'card';
    c.innerHTML = `
      <img src="${r.imagen || 'https://via.placeholder.com/150'}" alt="">
      <h3>${r.titulo}</h3>
      <p><strong>Ingredientes:</strong> ${r.ingredientes}</p>
      <p><strong>Preparación:</strong> ${r.preparacion}</p>
      <p>⏱ ${r.tiempo}</p>
      <button onclick="toggleFavorito('${r.id}')">
        ${favoritos.includes(r.id) ? '❤️ Quitar' : '🤍 Favorito'}
      </button>
      ${usuarioActual ? `
        <button onclick="mostrarModalDia('${r.id}')">📆 Agendar</button>
        <button onclick="compartir('${r.titulo}')">🔗 Compartir</button>
        ${esAdmin ? `<button onclick="editarReceta('${r.id}')">✏️ Editar</button>
        <button onclick="eliminarReceta('${r.id}')">🗑️ Eliminar</button>` : '' }
      ` : ''}
    `;
    cont.appendChild(c);
  });
}

// Favoritos
async function toggleFavorito(id) {
  if (!usuarioActual) {
    alert('Debes iniciar sesión para usar favoritos.');
    return;
  }
  const ref = db.collection('usuarios').doc(usuarioActual.uid);
  const doc = await ref.get();
  let favs = (doc.exists && doc.data().favoritos) || [];
  const esFav = favs.includes(id);
  try {
    if (esFav) {
      await ref.update({ favoritos: firebase.firestore.FieldValue.arrayRemove(id) });
    } else {
      await ref.set({ favoritos: firebase.firestore.FieldValue.arrayUnion(id) }, { merge: true });
    }
    await cargarFavoritos();
  } catch (e) { alert('Error: ' + e.message); }
}
async function cargarFavoritos() {
  if (!usuarioActual) { favoritos=[]; return; }
  const doc = await db.collection('usuarios').doc(usuarioActual.uid).get();
  favoritos = (doc.exists && doc.data().favoritos) || [];
  mostrarRecetas();
}

// Mostrar modales
function mostrarFormulario() {
  document.getElementById('formulario').style.display = 'block';
}
function cerrarFormulario() {
  document.getElementById('formulario').style.display = 'none';
  recetaEnEdicion = null;
}
function mostrarModalDia(id) {
  recetaAAgendar = id;
  document.getElementById('modal-dia').style.display = 'block';
}
function cerrarModalDia() {
  document.getElementById('modal-dia').style.display = 'none';
  recetaAAgendar = null;
  document.querySelectorAll('#modal-dia input[type="checkbox"]').forEach(cb => cb.checked = false);
}

// Botones globales
function mostrarFavoritos() {
  document.getElementById('verFavoritos').checked = true;
  mostrarRecetas();
}
function mostrarTodasRecetas() {
  document.getElementById('verFavoritos').checked = false;
  mostrarRecetas();
}
function mostrarPlanificador() {
  cargarPlanificador();
}
function mostrarListaCompras() {
  generarListaCompras();
}

// AGENDAR EN DIAS
async function agendarEnDias() {
  if (!usuarioActual) {
    alert('Debes iniciar sesión para agendar.');
    return;
  }
  const diasSeleccionados = Array.from(document.querySelectorAll('#modal-dia input[type="checkbox"]:checked'))
    .map(cb => cb.value);
  if (diasSeleccionados.length === 0) {
    alert('Selecciona al menos un día.');
    return;
  }

  try {
    const ref = db.collection('planificadores').doc(usuarioActual.uid);
    const doc = await ref.get();
    let datos = doc.exists ? doc.data() : {};

    diasSeleccionados.forEach(dia => {
      if (!datos[dia]) datos[dia] = [];
      if (!datos[dia].includes(recetaAAgendar)) datos[dia].push(recetaAAgendar);
    });

    await ref.set(datos);
    cerrarModalDia();
    await cargarPlanificador();
  } catch (e) {
    alert('Error al agendar: ' + e.message);
  }
}

// COMPARTIR
function compartir(titulo) {
  const url = window.location.href;
  const texto = `Mira esta receta: ${titulo} - ${url}`;
  if (navigator.share) {
    navigator.share({
      title: titulo,
      text: texto,
      url: url
    }).catch(e => console.error('Error al compartir:', e));
  } else {
    navigator.clipboard.writeText(texto).then(() => {
      alert('Enlace copiado al portapapeles');
    }).catch(e => {
      alert('No se pudo copiar: ' + e.message);
    });
  }
}

// NUEVO: cargarPlanificador mostrando categoría + botón quitar
async function cargarPlanificador() {
  if (!usuarioActual) {
    document.getElementById('planificador').innerHTML = '<p>Inicia sesión para ver tu planificador.</p>';
    return;
  }
  try {
    const ref = db.collection('planificadores').doc(usuarioActual.uid);
    const doc = await ref.get();
    const datos = doc.exists ? doc.data() : {};
    let html = '';

    ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].forEach(dia => {
      html += `<h4>${dia}</h4>`;
      const ids = datos[dia] || [];
      if (ids.length === 0) {
        html += '<p>- Sin recetas -</p>';
      } else {
        ids.forEach(id => {
          const r = recetas.find(rec => rec.id === id);
          if (r) {
            html += `<p>${r.categoria} - ${r.titulo} 
              <button onclick="quitarDeDia('${dia}', '${id}')">🗑️ Quitar</button></p>`;
          } else {
            html += `<p>(Receta eliminada)
              <button onclick="quitarDeDia('${dia}', '${id}')">🗑️ Quitar</button></p>`;
          }
        });
      }
    });
    document.getElementById('planificador').innerHTML = html;
  } catch (e) {
    console.error('Error cargando planificador:', e);
    document.getElementById('planificador').innerHTML = '<p>Error al cargar el planificador.</p>';
  }
}

// NUEVO: quitar receta de un día
async function quitarDeDia(dia, id) {
  if (!usuarioActual) return;
  try {
    const ref = db.collection('planificadores').doc(usuarioActual.uid);
    const doc = await ref.get();
    if (doc.exists) {
      const datos = doc.data();
      if (datos[dia]) {
        datos[dia] = datos[dia].filter(rid => rid !== id);
        await ref.set(datos);
        await cargarPlanificador();
      }
    }
  } catch (e) {
    alert('Error al quitar receta: ' + e.message);
  }
}

// Inicial
aplicarTemaGuardado();
cargarRecetas();
