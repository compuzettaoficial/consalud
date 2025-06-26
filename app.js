let recetasGlobal = [];
let recetaEditandoId = null;

document.addEventListener('DOMContentLoaded', () => {
  cargarRecetasFirebase();

  const modal = document.getElementById('modal');
  const closeBtn = document.querySelector('.close-btn');

  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  window.addEventListener('click', e => {
    if (e.target === modal) modal.classList.add('hidden');
  });

  const buscador = document.getElementById('buscador');
  buscador.addEventListener('input', e => {
    const valor = e.target.value.toLowerCase();
    const filtradas = recetasGlobal.filter(r =>
      r.titulo.toLowerCase().includes(valor) ||
      r.ingredientes.join(',').toLowerCase().includes(valor)
    );
    renderRecetas(filtradas);
  });
});

async function cargarRecetasFirebase() {
  const snapshot = await db.collection("recetas").get();
  const datos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  recetasGlobal = datos;
  renderRecetas(recetasGlobal);
}

function renderRecetas(recetas) {
  const container = document.getElementById('recetas-container');
  container.innerHTML = '';

  if (recetas.length === 0) {
    container.innerHTML = "<p style='text-align:center; color: #888;'>No se encontraron recetas.</p>";
    return;
  }

  recetas.forEach(receta => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${receta.imagen}" alt="${receta.titulo}">
      <div class="card-content">
        <h3>${receta.titulo}</h3>
        <p>⏱ ${receta.tiempo}</p>
        <button onclick='verDetalle(${JSON.stringify(receta)})'>Ver más</button>
        <button onclick='editarReceta("${receta.id}")'>✏️ Editar</button>
        <button onclick='eliminarReceta("${receta.id}")'>🗑️ Eliminar</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function verDetalle(receta) {
  document.getElementById('modal-title').textContent = receta.titulo;
  document.getElementById('modal-img').src = receta.imagen;
  document.getElementById('modal-tiempo').textContent = receta.tiempo;
  document.getElementById('modal-pasos').textContent = receta.pasos;
  const lista = document.getElementById('modal-ingredientes');
  lista.innerHTML = '';
  receta.ingredientes.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    lista.appendChild(li);
  });
  document.getElementById('modal').classList.remove('hidden');
}

function editarReceta(id) {
  const receta = recetasGlobal.find(r => r.id === id);
  if (!receta) return;

  document.getElementById("titulo").value = receta.titulo;
  document.getElementById("ingredientes").value = receta.ingredientes.join(", ");
  document.getElementById("tiempo").value = receta.tiempo;
  document.getElementById("imagen").value = receta.imagen;
  document.getElementById("pasos").value = receta.pasos;

  recetaEditandoId = id;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function eliminarReceta(id) {
  const confirmacion = confirm("¿Estás seguro de eliminar esta receta?");
  if (!confirmacion) return;

  try {
    await db.collection("recetas").doc(id).delete();
    alert("Receta eliminada ✅");
    cargarRecetasFirebase();
  } catch (error) {
    console.error("Error al eliminar:", error);
    alert("No se pudo eliminar ❌");
  }
}

document.getElementById("recetaForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const nuevaReceta = {
    titulo: document.getElementById("titulo").value.trim(),
    ingredientes: document.getElementById("ingredientes").value.split(",").map(i => i.trim()),
    tiempo: document.getElementById("tiempo").value.trim(),
    imagen: document.getElementById("imagen").value.trim(),
    pasos: document.getElementById("pasos").value.trim()
  };

  try {
    if (recetaEditandoId) {
      await db.collection("recetas").doc(recetaEditandoId).update(nuevaReceta);
      alert("Receta actualizada ✅");
      recetaEditandoId = null;
    } else {
      await db.collection("recetas").add(nuevaReceta);
      alert("Receta guardada ✅");
    }
    this.reset();
    cargarRecetasFirebase();
  } catch (error) {
    console.error("Error al guardar:", error);
    alert("Error al guardar la receta ❌");
  }
});
