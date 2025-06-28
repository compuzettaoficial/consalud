const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
firebase.auth().onAuthStateChanged(user => {
  const info = document.getElementById('user-info');
  if (user) {
    info.textContent = '👋 Bienvenido ' + user.displayName;
  } else {
    info.textContent = 'No has iniciado sesión';
  }
});

// Login con Google
function loginConGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider).catch(err => {
    console.error("Error al iniciar sesión:", err);
    alert("Error: " + err.message);
  });
}

// Logout
function logout() {
  firebase.auth().signOut();
}

// Cargar recetas públicas
function cargarRecetas() {
  db.collection('recetas').get().then(snapshot => {
    const recetasDiv = document.getElementById('recetas');
    recetasDiv.innerHTML = '';
    snapshot.forEach(doc => {
      const r = doc.data();
      const card = document.createElement('div');
      card.className = 'receta-card';
      card.innerHTML = `
        <img src="${r.imagen || 'https://via.placeholder.com/150'}">
        <h3>${r.titulo}</h3>
        <p>⏱ ${r.tiempo}</p>
        <p><strong>Ingredientes:</strong> ${r.ingredientes}</p>
        <p><strong>Preparación:</strong> ${r.preparacion}</p>
        <p><strong>Categoría:</strong> ${r.categoria}</p>
      `;
      recetasDiv.appendChild(card);
    });
  }).catch(err => {
    console.error("Error al cargar recetas:", err);
  });
}

// Al iniciar
cargarRecetas();
