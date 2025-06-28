// Inicializa Firestore
const db = firebase.firestore();
let user = null;
let recetaAAgendar = null;

// Tema oscuro / claro
function toggleTheme() {
  document.body.classList.toggle('dark');
  localStorage.setItem('tema', document.body.classList.contains('dark') ? 'oscuro' : 'claro');
}

// Verifica el tema al iniciar
if (localStorage.getItem('tema') === 'oscuro') {
  document.body.classList.add('dark');
}


// Al cargar, aplicar el tema guardado
if (localStorage.getItem('tema') === 'oscuro') {
  document.body.classList.add('dark');
}


// Login / Logout
firebase.auth().onAuthStateChanged(u => {
  user = u;
  const info = document.getElementById('user-info');
  if (user) {
    info.textContent = '👋 Bienvenido ' + user.displayName;
    document.getElementById('admin-actions').style.display = user.email === 'compuzettaoficial@gmail.com' ? 'block' : 'none';
    cargarRecetas();
    cargarFavoritos();
    cargarPlanificador();
  } else {
    info.textContent = 'No has iniciado sesión';
    document.getElementById('admin-actions').style.display = 'none';
    document.getElementById('recetas').innerHTML = '';
    document.getElementById('favoritos').innerHTML = '';
    document.getElementById('planificador').innerHTML = '';
  }
});

function loginConGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider).catch(err => alert('Error al iniciar sesión: ' + err.message));
}

function logout() {
  firebase.auth().signOut();
}

// Tema oscuro / claro
function toggleTheme() {
  document.body.classList.toggle('dark');
  localStorage.setItem('tema', document.body.classList.contains('dark') ? 'oscuro' : 'claro');
}

// Mostrar formulario
function mostrarFormulario() {
  document.getElementById('formulario').style.display = 'block';
}

// Guardar receta
function guardarReceta() {
  const nueva = {
    titulo: document.getElementById('titulo').value,
    ingredientes: document.getElementById('ingredientes').value,
    tiempo: document.getElementById('tiempo').value,
    imagen: document.getElementById('imagen').value,
    categoria: document.getElementById('categoria').value,
    preparacion: document.getElementById('preparacion').value,
  };
  db.collection('recetas').add(nueva).then(() => {
    alert('Receta guardada');
    document.getElementById('formulario').style.display = 'none';
    cargarRecetas();
  });
}

// Cargar recetas públicas
function cargarRecetas() {
  db.collection('recetas').get().then(snapshot => {
    const div = document.getElementById('recetas');
    div.innerHTML = '';
    snapshot.forEach(doc => {
      const r = doc.data();
      const id = doc.id;
      div.innerHTML += `
        <div class="card">
          <img src="${r.imagen}" alt="">
          <h3>${r.titulo}</h3>
          <p>⏱ ${r.tiempo}</p>
          <p><strong>Ingredientes:</strong> ${r.ingredientes}</p>
          <p><strong>Preparación:</strong> ${r.preparacion}</p>
          <p><strong>Categoría:</strong> ${r.categoria}</p>
          <button onclick="marcarFavorito('${id}')">❤️ Favorito</button>
          <button onclick="abrirModalDia('${id}')">📆 Agendar</button>
          <button onclick="compartirReceta('${id}')">🔗 Compartir</button>
          ${user.email === 'compuzettaoficial@gmail.com' ? `
            <button onclick="eliminarReceta('${id}')">🗑️ Eliminar</button>` : ''}
        </div>`;
    });
  });
}
// Favoritos
function marcarFavorito(id) {
  if (!user) return alert('Inicia sesión');
  db.collection('usuarios').doc(user.uid).collection('favoritos').doc(id).set({ favorito: true }).then(() => {
    cargarFavoritos();
    cargarRecetas(); // recarga para que se vea al toque
  });
}

function cargarFavoritos() {
  if (!user) return;
  const div = document.getElementById('favoritos');
  div.innerHTML = '';
  db.collection('usuarios').doc(user.uid).collection('favoritos').get().then(favs => {
    favs.forEach(favDoc => {
      db.collection('recetas').doc(favDoc.id).get().then(recetaDoc => {
        const r = recetaDoc.data();
        div.innerHTML += `
          <div class="card">
            <h3>${r.titulo}</h3>
            <p>${r.ingredientes}</p>
          </div>`;
      });
    });
  });
}

// Modal días
function abrirModalDia(id) {
  recetaAAgendar = id;
  document.getElementById('modal-dia').style.display = 'block';
}

function cerrarModalDia() {
  document.getElementById('modal-dia').style.display = 'none';
}

// Agendar
function confirmarAgendar() {
  const dias = Array.from(document.querySelectorAll('#modal-dia input[type="checkbox"]:checked')).map(cb => cb.value);
  if (!user) return alert('Inicia sesión');
  dias.forEach(dia => {
    db.collection('usuarios').doc(user.uid).collection('planificador').add({ recetaId: recetaAAgendar, dia });
  });
  cerrarModalDia();
  cargarPlanificador();
}

// Planificador
function cargarPlanificador() {
  if (!user) return;
  const div = document.getElementById('planificador');
  div.innerHTML = '';
  db.collection('usuarios').doc(user.uid).collection('planificador').get().then(snap => {
    snap.forEach(p => {
      const { recetaId, dia } = p.data();
      db.collection('recetas').doc(recetaId).get().then(recetaDoc => {
        const r = recetaDoc.data();
        div.innerHTML += `<div class="card">
          <h4>${dia}: ${r.titulo}</h4>
        </div>`;
      });
    });
  });
}

// Compartir
function compartirReceta(id) {
  const url = window.location.href + '?receta=' + id;
  navigator.clipboard.writeText(url).then(() => alert('Enlace copiado: ' + url));
}

// Eliminar receta (admin)
function eliminarReceta(id) {
  if (!confirm('¿Seguro de eliminar?')) return;
  db.collection('recetas').doc(id).delete().then(() => {
    cargarRecetas();
  });
}
