const adminEmail = "compuzettaoficial@gmail.com";

auth.onAuthStateChanged(user => {
  const info = document.getElementById('user-info');
  const adminActions = document.getElementById('admin-actions');
  if (user) {
    info.innerHTML = `👋 Bienvenido ${user.displayName || user.email}`;
    if (user.email === adminEmail) {
      adminActions.style.display = 'block';
    } else {
      adminActions.style.display = 'none';
    }
    cargarRecetas();
  } else {
    info.textContent = 'No has iniciado sesión';
    adminActions.style.display = 'none';
    document.getElementById('recetas').innerHTML = '';
  }
});

function loginConGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(error => alert("Error: " + error.message));
}

function logout() {
  auth.signOut();
}

function mostrarFormulario() {
  document.getElementById('formulario').style.display = 'block';
}

function guardarReceta() {
  const nueva = {
    titulo: document.getElementById('titulo').value,
    ingredientes: document.getElementById('ingredientes').value,
    tiempo: document.getElementById('tiempo').value,
    imagen: document.getElementById('imagen').value,
    categoria: document.getElementById('categoria').value,
    preparacion: document.getElementById('preparacion').value
  };
  db.collection("recetas").add(nueva).then(() => {
    alert("Receta guardada");
    document.getElementById('formulario').style.display = 'none';
    cargarRecetas();
  }).catch(error => alert("Error: " + error.message));
}

function cargarRecetas() {
  db.collection("recetas").get().then(snapshot => {
    const contenedor = document.getElementById('recetas');
    contenedor.innerHTML = '';
    snapshot.forEach(doc => {
      const r = doc.data();
      contenedor.innerHTML += `
        <div class="card">
          <img src="${r.imagen || 'https://via.placeholder.com/150'}" alt="Imagen">
          <h3>${r.titulo}</h3>
          <p>⏱ ${r.tiempo}</p>
          <p><strong>Ingredientes:</strong> ${r.ingredientes}</p>
          <p><strong>Preparación:</strong> ${r.preparacion}</p>
          <p><strong>Categoría:</strong> ${r.categoria}</p>
        </div>`;
    });
  });
}

