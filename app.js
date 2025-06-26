let recetasGlobal = [];

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
      </div>`;
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
    await db.collection("recetas").add(nuevaReceta);
    alert("Receta guardada exitosamente ✅");
    this.reset();
    cargarRecetasFirebase();
  } catch (error) {
    console.error("Error al guardar receta:", error);
    alert("Error al guardar la receta ❌");
  }
});

async function cargarRecetasFirebase() {
  const snapshot = await db.collection("recetas").get();
  const datos = snapshot.docs.map(doc => doc.data());
  recetasGlobal = datos;
  renderRecetas(recetasGlobal);
}
