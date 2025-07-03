const firebaseConfig = {
  apiKey: "AIzaSyBcJ4tbucMLF3lTuDne5cyin4oyoVhTfSs",
  authDomain: "consalud-recetas.firebaseapp.com",
  projectId: "consalud-recetas",
  storageBucket: "consalud-recetas.appspot.com",
  messagingSenderId: "477690744464",
  appId: "1:477690744464:web:597172e85fd29549fd9215"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const adminEmail = "compuzettaoficial@gmail.com";

let recetas = [];
let planificador = {};
let recetaAAgendar = null;
let recetaEnEdicion = null;
let usuarioActual = null;
let esAdmin = false;
let favoritos = [];
let favoritosActivos = false; // Nuevo: control toggle favoritos

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
  try { await auth.signInWithPopup(provider); }
  catch (e) { alert('Error al iniciar sesión: ' + e.message); }
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
    document.getElementById('saludo').innerText = `Hola, ${user.displayName || user.email}`;
    await cargarFavoritos();
    await cargarPlanificador();
  } else {
    document.getElementById('saludo').innerText = '';
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
  } catch (e) { console.error('Error cargando recetas:', e); }
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
  } catch (e) { alert('Error guardando receta: ' + e.message); }
}

async function eliminarReceta(id) {
  if (!confirm('¿Eliminar receta?')) return;
  try {
    await db.collection('recetas').doc(id).delete();
    // Eliminar también del planificador
    const ref = db.collection('planificadores').doc(usuarioActual.uid);
    const doc = await ref.get();
    if (doc.exists) {
      const datos = doc.data();
      for (let dia in datos) {
        datos[dia] = datos[dia].filter(rid => rid !== id);
      }
      await ref.set(datos);
    }
    await cargarRecetas();
    await cargarPlanificador();
  } catch (e) { alert('Error eliminando receta: ' + e.message); }
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

  let filtradas = recetas.filter(r =>
    (!txt || r.titulo.toLowerCase().includes(txt) || r.ingredientes.toLowerCase().includes(txt)) &&
    (!cat || r.categoria === cat)
  );
  if (favoritosActivos) filtradas = filtradas.filter(r => favoritos.includes(r.id));

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
        <button onclick="compartir('${r.id}')">🔗 Compartir</button>
        ${esAdmin ? `<button onclick="editarReceta('${r.id}')">✏️ Editar</button>
        <button onclick="eliminarReceta('${r.id}')">❌</button>` : '' }
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

// Toggle mostrar favoritos
function toggleVerFavoritos() {
  favoritosActivos = !favoritosActivos;
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

// Planificador / lista compras / imprimir / descargar PDF
function imprimirContenido(id) {
  const contenido = document.getElementById(id).innerHTML;
  const logo = '<img src="img/logo.negro.png" class="print-logo">';
  const titulo = '<div class="print-title">Lista Semanal</div>';
  const win = window.open('', '', 'height=600,width=800');
  win.document.write('<html><head><title>Imprimir</title>');
  win.document.write('<link rel="stylesheet" href="style.css">');
  win.document.write('</head><body id="print-area">');
  win.document.write('<div style="text-align:center;">'+logo+'</div>' + titulo + contenido);
  win.document.write('</body></html>');
  win.document.close();
  win.print();
}
function descargarPDF(id, filename) {
  const contenido = document.getElementById(id).innerHTML;
  const logo = '<img src="img/logo.negro.png" class="print-logo">';
  const titulo = '<div class="print-title">Lista Semanal</div>';
  const blob = new Blob([`<html><head><link rel="stylesheet" href="style.css"></head><body>${logo}${titulo}${contenido}</body></html>`], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Compartir solo receta
function compartir(id) {
  if (!usuarioActual) {
    alert('Debes iniciar sesión para compartir.');
    return;
  }
  const url = `${window.location.origin}${window.location.pathname}#receta-${id}`;
  const texto = `Mira esta receta: ${url}`;
  if (navigator.share) {
    navigator.share({ title: 'Receta', text: texto, url }).catch(e => console.error(e));
  } else {
    navigator.clipboard.writeText(texto).then(() => alert('Enlace copiado')).catch(e => alert('Error: ' + e.message));
  }
}

// Inicial
aplicarTemaGuardado();
cargarRecetas();
