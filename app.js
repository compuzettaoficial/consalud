// Parte 1: Configuración y autenticación
let usuarioActual = null;
let recetaAAgendar = null;

firebase.auth().onAuthStateChanged(async user => {
  const info = document.getElementById('user-info');
  if (user) {
    usuarioActual = user;
    info.textContent = '👋 Bienvenido ' + user.displayName;
    if (user.email === 'compuzettaoficial@gmail.com') {
      document.getElementById('admin-actions').style.display = 'block';
    } else {
      document.getElementById('admin-actions').style.display = 'none';
    }
    cargarRecetas();
    cargarFavoritos();
    cargarPlanificador();
  } else {
    usuarioActual = null;
    info.textContent = 'No has iniciado sesión';
    document.getElementById('admin-actions').style.display = 'none';
    document.getElementById('recetas').innerHTML = '';
    document.getElementById('favoritos').innerHTML = '';
    document.getElementById('planificador').innerHTML = '';
  }
});

function loginConGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .catch(error => alert('Error al iniciar sesión: ' + error.message));
}

function logout() {
  firebase.auth().signOut();
}
// Parte 2: Funciones de recetas, favoritos y planificador

async function cargarRecetas() {
  const snap = await firebase.firestore().collection('recetas').get();
  const cont = document.getElementById('recetas');
  cont.innerHTML = '';
  snap.forEach(doc => {
    const r = doc.data();
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${r.titulo}</h3>
      <p>⏱ ${r.tiempo}</p>
      <p><strong>Ingredientes:</strong> ${r.ingredientes}</p>
      <p><strong>Preparación:</strong> ${r.preparacion}</p>
      <p><strong>Categoría:</strong> ${r.categoria}</p>
      <img src="${r.imagen || 'https://via.placeholder.com/150'}" style="width:100px;">
      <button onclick="marcarFavorito('${doc.id}')">❤️ Favorito</button>
      <button onclick="abrirModalAgendar('${doc.id}')">📆 Agendar</button>
      ${usuarioActual.email === 'compuzettaoficial@gmail.com' ? `
        <button onclick="eliminarReceta('${doc.id}')">🗑️ Eliminar</button>
      ` : ''}
    `;
    cont.appendChild(card);
  });
}

async function marcarFavorito(recetaId) {
  if (!usuarioActual) return;
  const ref = firebase.firestore()
    .collection('usuarios').doc(usuarioActual.uid)
    .collection('favoritos').doc(recetaId);
  const doc = await ref.get();
  if (doc.exists) {
    await ref.delete();
  } else {
    await ref.set({ timestamp: Date.now() });
  }
  cargarFavoritos();
}

async function cargarFavoritos() {
  if (!usuarioActual) return;
  const snap = await firebase.firestore()
    .collection('usuarios').doc(usuarioActual.uid)
    .collection('favoritos').get();
  const cont = document.getElementById('favoritos');
  cont.innerHTML = '';
  for (let fav of snap.docs) {
    const recetaDoc = await firebase.firestore().collection('recetas').doc(fav.id).get();
    if (recetaDoc.exists) {
      const r = recetaDoc.data();
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<h4>${r.titulo}</h4><p>${r.tiempo}</p>`;
      cont.appendChild(card);
    }
  }
}

function abrirModalAgendar(id) {
  recetaAAgendar = id;
  document.getElementById('modal-dia').style.display = 'block';
}

function cerrarModalDia() {
  document.getElementById('modal-dia').style.display = 'none';
}

async function confirmarAgendar() {
  if (!usuarioActual || !recetaAAgendar) return;
  const dias = Array.from(document.querySelectorAll('#modal-dia input[type=checkbox]:checked'))
               .map(cb => cb.value);
  const batch = firebase.firestore().batch();
  dias.forEach(dia => {
    const ref = firebase.firestore()
      .collection('usuarios').doc(usuarioActual.uid)
      .collection('planificador').doc();
    batch.set(ref, { recetaId: recetaAAgendar, dia });
  });
  await batch.commit();
  cerrarModalDia();
  cargarPlanificador();
}

async function cargarPlanificador() {
  if (!usuarioActual) return;
  const snap = await firebase.firestore()
    .collection('usuarios').doc(usuarioActual.uid)
    .collection('planificador').get();
  const cont = document.getElementById('planificador');
  cont.innerHTML = '';
  for (let p of snap.docs) {
    const recetaDoc = await firebase.firestore().collection('recetas').doc(p.data().recetaId).get();
    if (recetaDoc.exists) {
      const r = recetaDoc.data();
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<h4>${r.titulo}</h4><p>Día: ${p.data().dia}</p>`;
      cont.appendChild(card);
    }
  }
}

async function guardarReceta() {
  if (!usuarioActual || usuarioActual.email !== 'compuzettaoficial@gmail.com') return;
  const titulo = document.getElementById('titulo').value;
  const ingredientes = document.getElementById('ingredientes').value;
  const tiempo = document.getElementById('tiempo').value;
  const imagen = document.getElementById('imagen').value;
  const categoria = document.getElementById('categoria').value;
  const preparacion = document.getElementById('preparacion').value;
  await firebase.firestore().collection('recetas').add({
    titulo, ingredientes, tiempo, imagen, categoria, preparacion
  });
  cargarRecetas();
}

async function eliminarReceta(id) {
  if (!usuarioActual || usuarioActual.email !== 'compuzettaoficial@gmail.com') return;
  await firebase.firestore().collection('recetas').doc(id).delete();
  cargarRecetas();
}
