firebase.auth().onAuthStateChanged(user => {
  const info = document.getElementById('user-info');
  const recetasDiv = document.getElementById('recetas');

  if (user) {
    info.textContent = 'Bienvenido ' + user.displayName;
    cargarRecetas(); // Cargar recetas cuando el usuario está logueado
  } else {
    info.textContent = 'No has iniciado sesión';
    recetasDiv.innerHTML = ''; // Limpiar recetas si no está logueado
  }
});

function loginConGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider).catch(error => {
    console.error('Error al iniciar sesión:', error);
    alert('Error al iniciar sesión: ' + error.message);
  });
}

function logout() {
  firebase.auth().signOut();
}

function cargarRecetas() {
  const recetasDiv = document.getElementById('recetas');
  recetasDiv.innerHTML = '<p>Cargando recetas...</p>';

  firebase.firestore().collection('recetas').get()
    .then(snapshot => {
      recetasDiv.innerHTML = ''; // limpiar
      if (snapshot.empty) {
        recetasDiv.innerHTML = '<p>No hay recetas todavía.</p>';
      } else {
        snapshot.forEach(doc => {
          const r = doc.data();
          const card = document.createElement('div');
          card.className = 'card';
          card.innerHTML = `
            <h3>${r.titulo}</h3>
            <p>⏱ ${r.tiempo}</p>
            <p><strong>Ingredientes:</strong> ${r.ingredientes}</p>
            <p><strong>Preparación:</strong> ${r.preparacion}</p>
            <p><strong>Categoría:</strong> ${r.categoria || 'Sin categoría'}</p>
            <img src="${r.imagen || 'https://via.placeholder.com/150'}" alt="Imagen" style="max-width:100%; height:auto;">
          `;
          recetasDiv.appendChild(card);
        });
      }
    })
    .catch(error => {
      console.error('Error al cargar recetas:', error);
      recetasDiv.innerHTML = '<p>Error al cargar recetas.</p>';
    });
}
