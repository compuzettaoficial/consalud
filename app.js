const adminEmail = "compuzettaoficial@gmail.com";
const auth = firebase.auth();

document.getElementById('login-btn').addEventListener('click', loginConGoogle);
document.getElementById('logout-btn').addEventListener('click', logout);
document.getElementById('toggle-theme').addEventListener('click', toggleTheme);

auth.onAuthStateChanged(async user => {
  const userInfo = document.getElementById('user-info');
  if (user) {
    userInfo.textContent = '👋 Bienvenido ' + user.displayName;
  } else {
    userInfo.textContent = '';
  }
  loadRecetas(); // Siempre cargar recetas
});

async function loadRecetas() {
  const recetasCont = document.getElementById('recetas-publicas');
  recetasCont.innerHTML = 'Cargando recetas...';
  try {
    const snap = await db.collection('recetas').get();
    if (snap.empty) {
      recetasCont.innerHTML = 'No hay recetas.';
      return;
    }
    recetasCont.innerHTML = '';
    snap.forEach(doc => {
      const data = doc.data();
      const div = document.createElement('div');
      div.className = 'receta';
      div.innerHTML = `
        <h3>${data.titulo}</h3>
        <p>⏱ ${data.tiempo}</p>
        <p>Ingredientes: ${data.ingredientes}</p>
        <p>Preparación: ${data.preparacion}</p>
        <p>Categoría: ${data.categoria}</p>
        <img src="${data.imagen}" alt="${data.titulo}" width="200">
      `;
      recetasCont.appendChild(div);
    });
  } catch (error) {
    recetasCont.innerHTML = 'Error al cargar recetas.';
    console.error(error);
  }
}

function loginConGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(console.error);
}

function logout() {
  auth.signOut().catch(console.error);
}

function toggleTheme() {
  document.body.classList.toggle('dark');
}
