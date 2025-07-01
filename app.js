function toggleMenu() {
  const s = document.getElementById("sidebar");
  s.style.width = s.style.width === "250px" ? "0" : "250px";
}

function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

function filtrarFavoritos() {
  document.getElementById('verFavoritos').checked = true;
  mostrarRecetas();
  toggleMenu();
}
