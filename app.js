// Inicializa Firebase Auth y Firestore
const auth = firebase.auth();
const db = firebase.firestore();

let usuarioActual = null; // Guardará la información del usuario logueado
let recetaEditandoId = null; // Si editamos una receta, guardamos su ID aquí

// Detecta cambios de sesión (login/logout)
auth.onAuthStateChanged(user => {
  usuarioActual = user;
  if (user) {
    document.getElementById('login-btn').style.display = 'none';
    document.getElementById('logout-btn').style.display = 'inline-block';
    document.getElementById('saludo').innerText = `Hola, ${user.email}`;
    document.querySelector('.agregar-btn').style.display = 'inline-block';
  } else {
    document.getElementById('login-btn').style.display = 'inline-block';
    document.getElementById('logout-btn').style.display = 'none';
    document.getElementById('saludo').innerText = '';
    document.querySelector('.agregar-btn').style.display = 'none';
  }
  mostrarRecetas(); // Actualiza la vista
});

// Función para iniciar sesión (login simple con Google)
document.getElementById('login-btn').onclick = () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(err => alert('Error al iniciar sesión: ' + err.message));
};

// Función para cerrar sesión
document.getElementById('logout-btn').onclick = () => auth.signOut();

// Alternar tema claro/oscuro
document.getElementById('toggle-theme').onclick = () => {
  document.body.classList.toggle('dark');
};

// Mostrar formulario modal para agregar receta
function mostrarFormulario() {
  recetaEditandoId = null;
  document.getElementById('form-title').innerText = 'Agregar Receta';
  document.getElementById('titulo').value = '';
  document.getElementById('ingredientes').value = '';
  document.getElementById('tiempo').value = '';
  document.getElementById('imagen').value = '';
  document.getElementById('preparacion').value = '';
  document.getElementById('categoria').value = '';
  document.getElementById('formulario').style.display = 'block';
}

// Cerrar formulario modal
function cerrarFormulario() {
  document.getElementById('formulario').style.display = 'none';
}

// Guardar receta (nueva o editar)
function guardarReceta() {
  const datos = {
    titulo: document.getElementById('titulo').value,
    ingredientes: document.getElementById('ingredientes').value,
    tiempo: document.getElementById('tiempo').value,
    imagen: document.getElementById('imagen').value,
    preparacion: document.getElementById('preparacion').value,
    categoria: document.getElementById('categoria').value,
    uid: usuarioActual ? usuarioActual.uid : null,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (recetaEditandoId) {
    // Editar
    db.collection('recetas').doc(recetaEditandoId).update(datos).then(() => {
      cerrarFormulario();
      mostrarRecetas();
    });
  } else {
    // Nueva
    db.collection('recetas').add(datos).then(() => {
      cerrarFormulario();
      mostrarRecetas();
    });
  }
}

// Mostrar recetas aplicando búsqueda y filtros
function mostrarRecetas() {
  let query = db.collection('recetas').orderBy('timestamp', 'desc');
  const filtroCat = document.getElementById('filtroCategoria').value;
  const soloFavs = document.getElementById('verFavoritos').checked;
  const buscar = document.getElementById('busqueda').value.toLowerCase();

  query.get().then(snapshot => {
    let html = '';
    snapshot.forEach(doc => {
      const receta = doc.data();
      receta.id = doc.id;

      // Filtrar por categoría
      if (filtroCat && receta.categoria !== filtroCat) return;

      // Filtrar favoritos (simple, por ejemplo por UID del usuario)
      if (soloFavs && receta.uid !== (usuarioActual ? usuarioActual.uid : '')) return;

      // Buscar por título
      if (buscar && !receta.titulo.toLowerCase().includes(buscar)) return;

      html += `
      <div class="card">
        <img src="${receta.imagen || 'img/default.jpg'}" alt="">
        <h3>${receta.titulo}</h3>
        <p><strong>Categoría:</strong> ${receta.categoria}</p>
        <p>${receta.tiempo}</p>
        <button onclick="editarReceta('${receta.id}')">✏️ Editar</button>
        <button onclick="eliminarReceta('${receta.id}')">🗑️ Eliminar</button>
        <button onclick="abrirModalDia('${receta.id}')">📅 Agendar</button>
      </div>`;
    });
    document.getElementById('recetas').innerHTML = html;
  });
}

// Editar receta (llenar formulario con datos)
function editarReceta(id) {
  recetaEditandoId = id;
  db.collection('recetas').doc(id).get().then(doc => {
    const receta = doc.data();
    document.getElementById('form-title').innerText = 'Editar Receta';
    document.getElementById('titulo').value = receta.titulo;
    document.getElementById('ingredientes').value = receta.ingredientes;
    document.getElementById('tiempo').value = receta.tiempo;
    document.getElementById('imagen').value = receta.imagen;
    document.getElementById('preparacion').value = receta.preparacion;
    document.getElementById('categoria').value = receta.categoria;
    document.getElementById('formulario').style.display = 'block';
  });
}

// Eliminar receta
function eliminarReceta(id) {
  if (confirm('¿Seguro que deseas eliminar esta receta?')) {
    db.collection('recetas').doc(id).delete().then(mostrarRecetas);
  }
}

// Mostrar modal para seleccionar días
function abrirModalDia(idReceta) {
  document.getElementById('modal-dia').dataset.idReceta = idReceta;
  document.getElementById('modal-dia').style.display = 'block';
}

// Cerrar modal días
function cerrarModalDia() {
  document.getElementById('modal-dia').style.display = 'none';
}

// Agendar en días seleccionados
function agendarEnDias() {
  const idReceta = document.getElementById('modal-dia').dataset.idReceta;
  const dias = Array.from(document.querySelectorAll('#modal-dia input[type=checkbox]:checked')).map(cb => cb.value);
  dias.forEach(dia => {
    db.collection('planificador').add({
      dia, idReceta, uid: usuarioActual.uid
    });
  });
  cerrarModalDia();
}

// Mostrar planificador semanal
function mostrarPlanificador() {
  document.getElementById('modal-planificador').style.display = 'block';
  db.collection('planificador').where('uid', '==', usuarioActual.uid).get().then(async snapshot => {
    let html = `<div id="print-area"><img src="img/logo.negro.png" class="print-logo"><h2 class="print-title">Mi Planificador Semanal</h2>`;
    for (const doc of snapshot.docs) {
      const item = doc.data();
      const recetaDoc = await db.collection('recetas').doc(item.idReceta).get();
      if (recetaDoc.exists) {
        const receta = recetaDoc.data();
        html += `
        <div class="print-day">${item.dia}</div>
        <div class="print-category">${receta.categoria}</div>
        <p>${receta.titulo}</p>
        <button onclick="eliminarPlanificacion('${doc.id}')">Eliminar</button>`;
      }
    }
    html += `</div><button onclick="imprimirLista()">🖨️ Imprimir</button> <button onclick="descargarPDF()">📥 Descargar PDF</button>`;
    document.getElementById('modal-planificador-content').innerHTML = html;
  });
}

// Eliminar elemento del planificador
function eliminarPlanificacion(id) {
  db.collection('planificador').doc(id).delete().then(mostrarPlanificador);
}

// Cerrar modal planificador
function cerrarModalPlanificador() {
  document.getElementById('modal-planificador').style.display = 'none';
}

// Mostrar lista de compras (ingredientes)
function mostrarListaCompras() {
  document.getElementById('modal-lista').style.display = 'block';
  db.collection('recetas').where('uid', '==', usuarioActual.uid).get().then(snapshot => {
    let html = `<div id="print-area"><img src="img/logo.negro.png" class="print-logo"><h2 class="print-title">Lista de Compras</h2><ul>`;
    snapshot.forEach(doc => {
      const receta = doc.data();
      receta.ingredientes.split(',').forEach(ing => {
        html += `<li>${ing.trim()}</li>`;
      });
    });
    html += `</ul></div><button onclick="imprimirLista()">🖨️ Imprimir</button> <button onclick="descargarPDF()">📥 Descargar PDF</button>`;
    document.getElementById('modal-lista-content').innerHTML = html;
  });
}

// Cerrar modal lista
function cerrarModalLista() {
  document.getElementById('modal-lista').style.display = 'none';
}

// Imprimir área con logo y título
function imprimirLista() {
  window.print();
}

// Descargar PDF (simple, genera PDF de #print-area)
function descargarPDF() {
  const area = document.getElementById('print-area').outerHTML;
  const blob = new Blob([area], {type: 'text/html'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'lista.html';
  a.click();
  URL.revokeObjectURL(url);
}

// Al hacer clic en 🏠 scroll al inicio
function mostrarTodasRecetas() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
