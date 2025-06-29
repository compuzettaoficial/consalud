const adminEmail = "compuzettaoficial@gmail.com";
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;

auth.onAuthStateChanged(user => {
  currentUser = user;
  document.getElementById('loginBtn').style.display = user ? 'none' : 'inline';
  document.getElementById('logoutBtn').style.display = user ? 'inline' : 'none';
  if (user && user.email === adminEmail) {
    document.getElementById('adminPanel').style.display = 'block';
  } else {
    document.getElementById('adminPanel').style.display = 'none';
  }
  cargarRecetas();
});

function loginConGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
}

function logout() {
  auth.signOut();
}

document.getElementById('loginBtn').onclick = loginConGoogle;
document.getElementById('logoutBtn').onclick = logout;

async function cargarRecetas() {
  let snapshot = await db.collection('recetas').get();
  let html = '';
  snapshot.forEach(doc => {
    let r = doc.data();
    html += `
    <div class="tarjeta">
      <img src="${r.imagen}" alt="${r.titulo}">
      <h3>${r.titulo}</h3>
      <p>${r.tiempo}</p>
      <p>${r.ingredientes}</p>
      <p>${r.categoria}</p>
      <button onclick="toggleFavorito('${doc.id}')">⭐ Favorito</button>
      <button onclick="agendar('${doc.id}')">📆 Agendar</button>
    </div>`;
  });
  document.getElementById('recetas').innerHTML = html;
}

async function agregarReceta() {
  const titulo = document.getElementById('titulo').value;
  const ingredientes = document.getElementById('ingredientes').value;
  const tiempo = document.getElementById('tiempo').value;
  const imagen = document.getElementById('imagen').value;
  const categoria = document.getElementById('categoria').value;
  const preparacion = document.getElementById('preparacion').value;
  await db.collection('recetas').add({ titulo, ingredientes, tiempo, imagen, categoria, preparacion });
  cargarRecetas();
}

async function toggleFavorito(recetaId) {
  if (!currentUser) return alert('Inicia sesión');
  const ref = db.collection('usuarios').doc(currentUser.uid).collection('favoritos').doc(recetaId);
  const doc = await ref.get();
  if (doc.exists) {
    await ref.delete();
  } else {
    await ref.set({ recetaId });
  }
  cargarRecetas();
}

async function agendar(recetaId) {
  if (!currentUser) return alert('Inicia sesión');
  const dias = prompt('Escribe los días separados por coma (ejemplo: Lunes,Martes)');
  const lista = dias.split(',').map(d => d.trim());
  for (let dia of lista) {
    await db.collection('usuarios').doc(currentUser.uid)
      .collection('planificador').doc(dia).set({
        recetas: firebase.firestore.FieldValue.arrayUnion({ recetaId })
      }, { merge: true });
  }
  alert('Agendado');
}
document.getElementById('toggleTheme').onclick = () => {
  document.body.classList.toggle('oscuro');
};