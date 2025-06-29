let user = null;
const adminEmail = "compuzettaoficial@gmail.com";

firebase.auth().onAuthStateChanged(async (u) => {
  user = u;
  const info = document.getElementById('user-info');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const menu = document.getElementById('menu');

  if (user) {
    info.textContent = `👋 Bienvenido ${user.displayName}`;
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline';
    menu.style.display = 'block';
    cargarRecetasPublicas();
    cargarFavoritos();
    cargarPlanificador();
  } else {
    info.textContent = '';
    loginBtn.style.display = 'inline';
    logoutBtn.style.display = 'none';
    menu.style.display = 'none';
    mostrarSeccion('publicas');
    cargarRecetasPublicas();
  }
});

document.getElementById('login-btn').onclick = () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider);
};
document.getElementById('logout-btn').onclick = () => firebase.auth().signOut();

document.getElementById('toggle-theme').onclick = () => {
  document.body.classList.toggle('dark-mode');
};

function mostrarSeccion(id) {
  ['publicas', 'favoritos', 'planificador', 'compras'].forEach(sec => {
    document.getElementById(sec).style.display = sec === id ? 'block' : 'none';
  });
}

async function cargarRecetasPublicas() {
  const cont = document.getElementById('publicas');
  cont.innerHTML = '';
  const snapshot = await db.collection('recetas').get();
  snapshot.forEach(doc => {
    const r = doc.data();
    cont.innerHTML += `
      <div class="receta">
        <h3>${r.titulo}</h3>
        <img src="${r.imagen}" alt="${r.titulo}">
        <p>⏱ ${r.tiempo}</p>
        <p><strong>Ingredientes:</strong> ${r.ingredientes}</p>
        <p><strong>Preparación:</strong> ${r.preparacion}</p>
        <p><strong>Categoría:</strong> ${r.categoria}</p>
        ${user ? `
          <button onclick="agregarFavorito('${doc.id}')">⭐ Favorito</button>
          <button onclick="agendarReceta('${doc.id}', '${r.titulo}')">📆 Agendar</button>
          ${user.email===adminEmail?`
            <button onclick="editarReceta('${doc.id}')">✏️ Editar</button>
            <button onclick="eliminarReceta('${doc.id}')">🗑 Eliminar</button>
          `:''}
        `:''}
      </div>`;
  });
}

async function agregarFavorito(recetaId) {
  if (!user) return alert('Inicia sesión');
  await db.collection('usuarios').doc(user.uid).collection('favoritos').doc(recetaId).set({ recetaId });
  cargarFavoritos();
}

async function cargarFavoritos() {
  if (!user) return;
  const cont = document.getElementById('favoritos');
  cont.innerHTML = '';
  const favs = await db.collection('usuarios').doc(user.uid).collection('favoritos').get();
  for (const docFav of favs.docs) {
    const receta = await db.collection('recetas').doc(docFav.id).get();
    if (receta.exists) {
      const r = receta.data();
      cont.innerHTML += `<div class="receta"><h3>${r.titulo}</h3></div>`;
    }
  }
}

async function agendarReceta(recetaId, titulo) {
  const dias = prompt('Ingresa días separados por coma (ej: Lunes,Martes):');
  if (!dias) return;
  const listaDias = dias.split(',').map(d=>d.trim());
  for (const dia of listaDias) {
    await db.collection('usuarios').doc(user.uid).collection('planificador').doc(dia).set({
      recetas: firebase.firestore.FieldValue.arrayUnion({ recetaId, titulo })
    }, { merge:true });
  }
  cargarPlanificador();
}

async function cargarPlanificador() {
  if (!user) return;
  const cont = document.getElementById('planificador');
  cont.innerHTML = '';
  const docs = await db.collection('usuarios').doc(user.uid).collection('planificador').get();
  docs.forEach(doc => {
    const data = doc.data();
    cont.innerHTML += `<h4>${doc.id}</h4>` + data.recetas.map(r=>`<div>${r.titulo}</div>`).join('');
  });
}

async function editarReceta(id) {
  const titulo = prompt('Nuevo título:');
  if (titulo) await db.collection('recetas').doc(id).update({ titulo });
  cargarRecetasPublicas();
}

async function eliminarReceta(id) {
  if (confirm('¿Seguro de eliminar?')) {
    await db.collection('recetas').doc(id).delete();
    cargarRecetasPublicas();
  }
}
