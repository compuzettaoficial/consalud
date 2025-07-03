let recetas = [];
let planificador = {};
let recetaAAgendar = null;
let recetaEnEdicion = null;
let usuarioActual = null;
let esAdmin = false;
let favoritos = [];
let modoReordenar = false;

// Tema claro/oscuro
document.getElementById('toggle-theme').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('tema', isDark ? 'oscuro' : 'claro');
  document.getElementById('toggle-theme').innerText = isDark ? '☀️' : '🌙';
});
function aplicarTemaGuardado() {
  const tema = localStorage.getItem('tema');
  if (tema === 'oscuro') {
    document.body.classList.add('dark');
    document.getElementById('toggle-theme').innerText = '☀️';
  }
}

// Login/Logout
document.getElementById('login-btn').addEventListener('click', async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(provider);
  } catch (e) { alert('Error al iniciar sesión: ' + e.message); }
});
document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());

// Cambios de sesión
auth.onAuthStateChanged(async user => {
  usuarioActual = user;
  esAdmin = user && user.email === adminEmail;
  document.getElementById('login-btn').style.display = user ? 'none' : '';
  document.getElementById('logout-btn').style.display = user ? '' : 'none';
  document.querySelector('.agregar-btn').style.display = esAdmin ? '' : 'none';

  if (user) {
    document.getElementById('saludo').innerText = `Hola, ${user.displayName || user.email}`;
    await cargarFavoritos();
    await cargarPlanificador();
    await generarListaCompras();
  } else {
    document.getElementById('saludo').innerText = '';
    favoritos = [];
  }
  await cargarRecetas();
});

// CRUD Recetas
async function cargarRecetas() {
  try {
    const snap = await db.collection('recetas').get();
    recetas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    mostrarRecetas();
  } catch (e) { console.error('Error cargando recetas:', e); }
}

async function guardarReceta() {
  const titulo = document.getElementById('titulo').value.trim();
  const ingredientes = document.getElementById('ingredientes').value.trim();
  const tiempo = document.getElementById('tiempo').value.trim();
  const imagen = document.getElementById('imagen').value.trim();
  const preparacion = document.getElementById('preparacion').value.trim();
  const categoria = document.getElementById('categoria').value;

  if (!titulo || !ingredientes || !tiempo || !preparacion || !categoria) {
    alert('Completa todos los campos.');
    return;
  }

  try {
    if (recetaEnEdicion) {
      await db.collection('recetas').doc(recetaEnEdicion)
        .update({ titulo, ingredientes, tiempo, imagen, preparacion, categoria });
    } else {
      await db.collection('recetas').add({ titulo, ingredientes, tiempo, imagen, preparacion, categoria });
    }
    cerrarFormulario();
    await cargarRecetas();
  } catch (e) { alert('Error guardando receta: ' + e.message); }
}

async function eliminarReceta(id) {
  if (!confirm('¿Eliminar receta?')) return;
  try {
    await db.collection('recetas').doc(id).delete();
    await quitarDeTodosLosDias(id); // también la quitamos del planificador
    await cargarRecetas();
    await cargarPlanificador();
    await generarListaCompras();
  } catch (e) { alert('Error eliminando receta: ' + e.message); }
}

async function quitarDeTodosLosDias(id) {
  if (!usuarioActual) return;
  const ref = db.collection('planificadores').doc(usuarioActual.uid);
  const doc = await ref.get();
  if (!doc.exists) return;
  let datos = doc.data();
  for (let dia in datos) {
    datos[dia] = datos[dia].filter(rid => rid !== id);
  }
  await ref.set(datos);
}

// Mostrar recetas
function mostrarRecetas() {
  const cont = document.getElementById('recetas'); cont.innerHTML = '';
  const txt = document.getElementById('busqueda').value.toLowerCase();
  const cat = document.getElementById('filtroCategoria').value;
  const verFav = document.getElementById('verFavoritos').checked;

  let filtradas = recetas.filter(r =>
    (!txt || r.titulo.toLowerCase().includes(txt) || r.ingredientes.toLowerCase().includes(txt)) &&
    (!cat || r.categoria === cat)
  );
  if (verFav) filtradas = filtradas.filter(r => favoritos.includes(r.id));

  if (filtradas.length === 0) cont.innerHTML = '<p>No se encontraron recetas.</p>';
  filtradas.forEach(r => {
    const c = document.createElement('div'); c.className = 'card';
    c.innerHTML = `
      <img src="${r.imagen || 'https://via.placeholder.com/150'}" alt="">
      <h3>${r.titulo}</h3>
      <p><strong>Ingredientes:</strong> ${r.ingredientes}</p>
      <p><strong>Preparación:</strong> ${r.preparacion}</p>
      <p>⏱ ${r.tiempo}</p>
      <button onclick="toggleFavorito('${r.id}')">
        ${favoritos.includes(r.id) ? '❤️ Quitar' : '🤍 Favorito'}
      </button>
      ${usuarioActual ? `
        <button onclick="mostrarModalDia('${r.id}')">📆 Agendar</button>
        <button onclick="compartir('${r.id}','${r.titulo}')">🔗 Compartir</button>
        ${esAdmin ? `<button onclick="editarReceta('${r.id}')">✏️</button>
        <button onclick="eliminarReceta('${r.id}')">🗑️</button>` : '' }
      ` : ''}
    `;
    cont.appendChild(c);
  });
}

// Nuevo: compartir receta solo con ID
function compartir(id, titulo) {
  if (!usuarioActual) {
    alert('Debes iniciar sesión para compartir.');
    return;
  }
  const url = `${window.location.origin}?receta=${id}`;
  const texto = `Mira esta receta: ${titulo} - ${url}`;
  if (navigator.share) {
    navigator.share({ title: titulo, text: texto, url }).catch(e => console.error(e));
  } else {
    navigator.clipboard.writeText(texto).then(() => alert('Enlace copiado'));
  }
}

// El resto (favoritos, planificador, lista compras, imprimir, descargar, reordenar, cerrar modales, etc.)
/* ... (puedo enviártelo enseguida en el próximo mensaje por límite de espacio) */

// Favoritos
async function toggleFavorito(id) {
  if (!usuarioActual) { alert('Inicia sesión para usar favoritos.'); return; }
  const ref = db.collection('usuarios').doc(usuarioActual.uid);
  const doc = await ref.get();
  let favs = (doc.exists && doc.data().favoritos) || [];
  const esFav = favs.includes(id);
  try {
    if (esFav) {
      await ref.update({ favoritos: firebase.firestore.FieldValue.arrayRemove(id) });
    } else {
      await ref.set({ favoritos: firebase.firestore.FieldValue.arrayUnion(id) }, { merge: true });
    }
    await cargarFavoritos();
  } catch (e) { alert('Error: ' + e.message); }
}
async function cargarFavoritos() {
  if (!usuarioActual) { favoritos=[]; return; }
  const doc = await db.collection('usuarios').doc(usuarioActual.uid).get();
  favoritos = (doc.exists && doc.data().favoritos) || [];
  mostrarRecetas();
}

// Formulario
function mostrarFormulario() {
  document.getElementById('formulario').style.display = 'block';
}
function cerrarFormulario() {
  document.getElementById('formulario').style.display = 'none';
  recetaEnEdicion = null;
}

// Modal día
function mostrarModalDia(id) {
  recetaAAgendar = id;
  document.getElementById('modal-dia').style.display = 'block';
}
function cerrarModalDia() {
  document.getElementById('modal-dia').style.display = 'none';
  recetaAAgendar = null;
  document.querySelectorAll('#modal-dia input[type="checkbox"]').forEach(cb => cb.checked = false);
}

// Planificador semanal
async function mostrarPlanificador() {
  if (!usuarioActual) { alert('Inicia sesión para ver planificador'); return; }
  try {
    const ref = db.collection('planificadores').doc(usuarioActual.uid);
    const doc = await ref.get();
    const datos = doc.exists ? doc.data() : {};
    let html = '';

    Object.entries(datos).forEach(([dia, ids]) => {
      if (ids.length>0) {
        html += `<div class="print-day">${dia}</div>`;
        ids.forEach((id,i) => {
          const r = recetas.find(r=>r.id===id);
          if (r) {
            html += `<p draggable="${modoReordenar}" data-dia="${dia}" data-id="${id}">
              <span class="print-category">${r.categoria}</span> - ${r.titulo} 
              <button onclick="quitarDeDia('${dia}','${id}')" style="font-size:0.8rem;">❌</button></p>`;
          }
        });
      }
    });
    if (!html) html='<p>No tienes recetas planificadas.</p>';
    html += '<button onclick="imprimirContenido(\'modal-planificador-content\')">🖨️</button>';
    html += '<button onclick="descargarPDF(\'modal-planificador-content\',\'planificador.pdf\')">⬇️</button>';
    document.getElementById('modal-planificador-content').innerHTML=html;
    document.getElementById('modal-planificador').style.display='block';
  } catch(e){console.error(e); alert('Error al cargar planificador'); }
}

// Botón reordenar (simulado)
function activarReordenar(){
  modoReordenar=!modoReordenar;
  alert('Modo reordenar activado (a implementar arrastrar)');
}

// Quitar receta de un día
async function quitarDeDia(dia,id){
  const ref = db.collection('planificadores').doc(usuarioActual.uid);
  const doc = await ref.get();
  let datos = doc.exists ? doc.data() : {};
  datos[dia]=datos[dia].filter(rid=>rid!==id);
  await ref.set(datos);
  await mostrarPlanificador();
}

// Lista de compras
async function mostrarListaCompras() {
  if (!usuarioActual) { alert('Inicia sesión'); return; }
  try {
    const ref = db.collection('planificadores').doc(usuarioActual.uid);
    const doc = await ref.get();
    const datos = doc.exists ? doc.data() : {};
    const ingredientesTotales={};
    Object.values(datos).flat().forEach(id=>{
      const r=recetas.find(rec=>rec.id===id);
      if(r){
        r.ingredientes.split(',').forEach(ing=>{
          const clave=ing.trim().toLowerCase();
          if(clave) ingredientesTotales[clave]=(ingredientesTotales[clave]||0)+1;
        });
      }
    });
    let html='<ul>';
    Object.entries(ingredientesTotales).forEach(([ing,cant])=>{
      html+=`<li>${cant>1?cant+' x ':''}${ing}</li>`;
    });
    html+='</ul>';
    if(!Object.keys(ingredientesTotales).length) html='<p>No hay ingredientes planificados.</p>';
    html += '<button onclick="imprimirContenido(\'modal-lista-content\')">🖨️</button>';
    html += '<button onclick="descargarPDF(\'modal-lista-content\',\'lista.pdf\')">⬇️</button>';
    document.getElementById('modal-lista-content').innerHTML=html;
    document.getElementById('modal-lista').style.display='block';
  } catch(e){console.error(e);alert('Error al generar lista');}
}

// Imprimir
function imprimirContenido(id){
  const contenido=document.getElementById(id).innerHTML;
  const win=window.open('','','height=600,width=800');
  win.document.write('<html><head><title>Imprimir</title>');
  win.document.write('<link rel="stylesheet" href="style.css">');
  win.document.write('</head><body>'+contenido+'</body></html>');
  win.document.close(); win.print();
}

// Descargar PDF (html)
function descargarPDF(id,filename){
  const contenido=document.getElementById(id).innerHTML;
  const blob=new Blob([`<html><head><link rel="stylesheet" href="style.css"></head><body>${contenido}</body></html>`],{type:'application/octet-stream'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=filename;a.click();
  URL.revokeObjectURL(url);
}

// Otros
function cerrarModalPlanificador(){ document.getElementById('modal-planificador').style.display='none'; }
function cerrarModalLista(){ document.getElementById('modal-lista').style.display='none'; }
async function agendarEnDias(){
  if (!usuarioActual) { alert('Inicia sesión'); return; }
  const dias=Array.from(document.querySelectorAll('#modal-dia input[type="checkbox"]:checked')).map(cb=>cb.value);
  if(!dias.length){alert('Selecciona día');return;}
  const ref=db.collection('planificadores').doc(usuarioActual.uid);
  const doc=await ref.get(); let datos=doc.exists?doc.data():{};
  dias.forEach(dia=>{
    if(!datos[dia])datos[dia]=[];
    if(!datos[dia].includes(recetaAAgendar))datos[dia].push(recetaAAgendar);
  });
  await ref.set(datos);
  cerrarModalDia(); await mostrarPlanificador();
}
function mostrarFavoritos(){ document.getElementById('verFavoritos').checked=true; mostrarRecetas(); }
function mostrarTodasRecetas(){ window.scrollTo({top:0,behavior:'smooth'}); }
aplicarTemaGuardado(); cargarRecetas();
