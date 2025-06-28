firebase.auth().onAuthStateChanged(user => {
  const info = document.getElementById('user-info');
  const admin = (user && user.email === 'compuzettaoficial@gmail.com');
  if (user) {
    info.innerHTML = `👋 Bienvenido ${user.displayName}`;
    if (admin) document.getElementById('admin-actions').style.display = 'block';
    cargarRecetas();
  } else {
    info.innerHTML = 'No has iniciado sesión';
    document.getElementById('admin-actions').style.display = 'none';
  }
});

function loginConGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider).catch(e => alert('Error: ' + e.message));
}

function logout() {
  firebase.auth().signOut();
}

function mostrarFormulario() {
  document.getElementById('formulario').style.display = 'block';
}

function guardarReceta() {
  const receta = {
    titulo: document.getElementById('titulo').value,
    ingredientes: document.getElementById('ingredientes').value,
    tiempo: document.getElementById('tiempo').value,
    imagen: document.getElementById('imagen').value,
    categoria: document.getElementById('categoria').value,
    preparacion: document.getElementById('preparacion').value
  };
  db.collection('recetas').add(receta).then(() => {
    alert('Receta guardada');
    document.getElementById('formulario').style.display = 'none';
    cargarRecetas();
  }).catch(e => alert('Error al guardar: ' + e.message));
}

function cargarRecetas() {
  db.collection('recetas').get().then(snapshot => {
    const cont = document.getElementById('recetas');
    cont.innerHTML = '';
    snapshot.forEach(doc => {
      const r = doc.data();
      cont.innerHTML += `<div class='card'>
        <h3>${r.titulo}</h3>
        <p>⏱ ${r.tiempo}</p>
        <p>Ingredientes: ${r.ingredientes}</p>
        <p>Preparación: ${r.preparacion}</p>
        <p>Categoría: ${r.categoria}</p>
        <img src=\"${r.imagen}\" style=\"max-width:100px;\">
      </div>`;
    });
  });
}
