document.addEventListener('DOMContentLoaded', () => {
  fetch('recetas.json')
    .then(res => res.json())
    .then(data => renderRecetas(data));

  const modal = document.getElementById('modal');
  const closeBtn = document.querySelector('.close-btn');

  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  window.addEventListener('click', e => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });
});

function renderRecetas(recetas) {
  const container = document.getElementById('recetas-container');
  recetas.forEach(receta => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${receta.imagen}" alt="${receta.titulo}">
      <div class="card-content">
        <h3>${receta.titulo}</h3>
        <p>⏱ ${receta.tiempo}</p>
        <button onclick='verDetalle(${JSON.stringify(receta)})'>Ver más</button>
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
