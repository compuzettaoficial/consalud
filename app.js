firebase.auth().onAuthStateChanged(user => {
  const info = document.getElementById('user-info');
  const admin = (user && user.email === 'compuzettaoficial@gmail.com');
  if (user) {
    info.innerHTML = `👋 Bienvenido ${user.displayName}`;
    if (admin) document.getElementById('admin-actions').style.display = 'block';
    cargarRecetas(admin);
    cargarFavoritos(user.uid);
    cargarPlanificador(user.uid);
  } else {
    info.innerHTML = 'No has iniciado sesión';
    document.getElementById('admin-actions').style.display = 'none';
    document.getElementById('favoritos').innerHTML = '';
    document.getElementById('planificador').innerHTML = '';
  }
});

function loginConGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider).catch(e => alert('Error: ' + e.message));
}

function logout() {
  firebase.auth().signOut();
}

// ADMIN: Agregar / editar / eliminar
function mostrarFormulario(id) {
  document.getElementById('formulario').style.display = 'block';
  if (id) {
    db.collection('recetas').doc(id).get().then(doc => {
      const r = doc.data();
      document.getElementById('titulo').value = r.titulo;
      document.getElementById('ingredientes').value = r.ingredientes;
      document.getElementById('tiempo').value = r.tiempo;
      document.getElementById('imagen').value = r.imagen;
      document.getElementById('categoria').value = r.categoria;
      document.getElementById('preparacion').value = r.preparacion;
      document.getElementById('formulario').dataset.editId = id;
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
    });
  } else {
    db.collection('recetas').add(receta).then(() => {
      alert('Receta guardada');
      document.getElementById('formulario').style.display = 'none';
      cargarRecetas(true);
    });
  }
}

function eliminarReceta(id) {
  if (confirm('¿Eliminar esta receta?')) {
    db.collection('recetas').doc(id).delete().then(() => {
      alert('Eliminada');
      cargarRecetas(true);
    });
  }
}

// TODOS LOS USUARIOS: Favoritos
function toggleFavorito(recetaId) {
  const user = firebase.auth().currentUser;
  if (!user) return;
  const ref = db.collection('usuarios').doc(user.uid).collection('favoritos').doc(recetaId);
  ref.get().then(doc => {
    if (doc.exists) {
      ref.delete().then(() => cargarFavoritos(user.uid));
    } else {
      ref.set({ activo: true }).then(() => cargarFavoritos(user.uid));
    }
  });
}

function cargarFavoritos(uid) {
  db.collection('usuarios').doc(uid).collection('favoritos').get().then(snapshot => {
    const favIds = snapshot.docs.map(d => d.id);
    if (favIds.length === 0) {
      document.getElementById('favoritos').innerHTML = '<p>No tienes favoritos aún.</p>';
      return;
    }
    db.collection('recetas').get().then(rs => {
      const cont = document.getElementById('favoritos');
      cont.innerHTML = '';
      rs.forEach(doc => {
        if (favIds.includes(doc.id)) {
          const r = doc.data();
          cont.innerHTML += cardReceta(doc.id, r, false, true);
        }
      });
    });
  });
}

// TODOS: Planificador
function agendar(recetaId, dia) {
  const user = firebase.auth().currentUser;
  if (!user) return;
  db.collection('usuarios').doc(user.uid).collection('planificador').add({ recetaId, dia }).then(() => {
    alert('Agendada');
    cargarPlanificador(user.uid);
  });
}

function cargarPlanificador(uid) {
  db.collection('usuarios').doc(uid).collection('planificador').get().then(snapshot => {
    const plan = {};
    snapshot.forEach(d => {
      const { recetaId, dia } = d.data();
      if (!plan[dia]) plan[dia] = [];
      plan[dia].push(recetaId);
    });
    mostrarPlanificador(plan);
  });
}

function mostrarPlanificador(plan) {
  const cont = document.getElementById('planificador');
  cont.innerHTML = '';
  const dias = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
  dias.forEach(dia => {
    const ids = plan[dia] || [];
    if (ids.length > 0) {
      db.collection('recetas').get().then(rs => {
        cont.innerHTML += `<h4>${dia}</h4>`;
        ids.forEach(id => {
          const doc = rs.docs.find(d => d.id === id);
          if (doc) {
            const r = doc.data();
            cont.innerHTML += `<div class='card'>
              <strong>${r.titulo}</strong> - ${r.tiempo}
            </div>`;
          }
        });
      });
    }
  });
}

// TODOS: Compartir
function compartirReceta(id) {
  const url = `${window.location.href}?receta=${id}`;
  navigator.clipboard.writeText(url).then(() => alert('Enlace copiado: ' + url));
}

// CARD HTML
function cardReceta(id, r, esAdmin, esFavorita) {
  return `<div class='card'>
    <h3>${r.titulo}</h3>
    <p>⏱ ${r.tiempo}</p>
    <p>${r.categoria}</p>
    <img src="${r.imagen}" style="max-width:100px;">
    <button onclick="toggleFavorito('${id}')">${esFavorita ? '❤️ Quitar' : '🤍 Favorito'}</button>
    <button onclick="compartirReceta('${id}')">🔗 Compartir</button>
    <button onclick="agendar('${id}', prompt('Día (Lunes, Martes,...)'))">📅 Agendar</button>
    ${esAdmin ? `<button onclick="mostrarFormulario('${id}')">✏️ Editar</button>
    <button onclick="eliminarReceta('${id}')">🗑️ Eliminar</button>` : ''}
  </div>`;
}

// Cargar recetas
function cargarRecetas(esAdmin) {
  const user = firebase.auth().currentUser;
  let favIds = [];
  if (user) {
    db.collection('usuarios').doc(user.uid).collection('favoritos').get().then(snapshot => {
      favIds = snapshot.docs.map(d => d.id);
      db.collection('recetas').get().then(rs => {
        const cont = document.getElementById('recetas');
        cont.innerHTML = '';
        rs.forEach(doc => {
          const r = doc.data();
          cont.innerHTML += cardReceta(doc.id, r, esAdmin, favIds.includes(doc.id));
        });
      });
    });
  } else {
    db.collection('recetas').get().then(rs => {
      const cont = document.getElementById('recetas');
      cont.innerHTML = '';
      rs.forEach(doc => {
        const r = doc.data();
        cont.innerHTML += cardReceta(doc.id, r, esAdmin, false);
      });
    });
  }
}
