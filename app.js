firebase.auth().onAuthStateChanged(user => {
  const info = document.getElementById('user-info');
  const admin = (user && user.email === 'compuzettaoficial@gmail.com');
  if (user) {
    info.innerHTML = `👋 Bienvenido ${user.displayName}`;
    if (admin) document.getElementById('admin-actions').style.display = 'block';
    cargarRecetas(admin);
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

function mostrarFormulario(id) {
  document.getElementById('formulario').style.display = 'block';
  if (id) {
    // Editar: cargar datos
    db.collection('recetas').doc(id).get().then(doc => {
      const r = doc.data();
      document.getElementById('titulo').value = r.titulo;
      document.getElementById('ingredientes').value = r.ingredientes;
      document.getElementById('tiempo').value = r.tiempo;
      document.getElementById('imagen').value = r.imagen;
      document.getElementById('categoria').value = r.categoria;
      document.getElementById('preparacion').value = r.preparacion;
      document.getElementById('formulario').dataset.editId = id; // marcar ID que se edita
    });
  } else {
    limpiarFormulario();
    delete document.getElementById('formulario').dataset.editId;
  }
}

function limpiarFormulario() {
  document.getElementById('titulo').value = '';
  document.getElementById('ingredientes').value = '';
  document.getElementById('tiempo').value = '';
  document.getElementById('imagen').value = '';
  document.getElementById('categoria').value = '';
  document.getElementById('preparacion').value = '';
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
  const editId = document.getElementById('formulario').dataset.editId;

  if (editId) {
    db.collection('recetas').doc(editId).update(receta).then(() => {
      alert('Receta actualizada');
      document.getElementById('formulario').style.display = 'none';
      cargarRecetas(true);
    }).catch(e => alert('Error al actualizar: ' + e.message));
  } else {
    db.collection('recetas').add(receta).then(() => {
      alert('Receta guardada');
      document.getElementById('formulario').style.display = 'none';
      cargarRecetas(true);
    }).catch(e => alert('Error al guardar: ' + e.message));
  }
}

function eliminarReceta(id) {
  if (confirm('¿Eliminar esta receta?')) {
    db.collection('recetas').doc(id).delete().then(() => {
      alert('Receta eliminada');
      cargarRecetas(true);
    }).catch(e => alert('Error al eliminar: ' + e.message));
  }
}

function cargarRecetas(esAdmin) {
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
        <img src="${r.imagen}" style="max-width:100px;">
        ${esAdmin ? `
          <button onclick="mostrarFormulario('${doc.id}')">✏️ Editar</button>
          <button onclick="eliminarReceta('${doc.id}')">🗑️ Eliminar</button>
        ` : ''}
      </div>`;
    });
  });
}
