import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, deleteDoc,
  doc, updateDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBcJ4tbucMLF3lTuDne5cyin4oyoVhTfSs",
  authDomain: "consalud-recetas.firebaseapp.com",
  projectId: "consalud-recetas",
  storageBucket: "consalud-recetas.appspot.com",
  messagingSenderId: "477690744464",
  appId: "1:477690744464:web:597172e85fd29549fd9215"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const recetasRef = collection(db, "recetas");

let recetaEditando = null;

async function guardarReceta() {
  const titulo = document.getElementById("titulo").value;
  const ingredientes = document.getElementById("ingredientes").value;
  const tiempo = document.getElementById("tiempo").value;
  const imagen = document.getElementById("imagen").value;
  const preparacion = document.getElementById("preparacion").value;
  const categoria = document.getElementById("categoria").value;

  if (recetaEditando) {
    await updateDoc(doc(db, "recetas", recetaEditando), {
      titulo, ingredientes, tiempo, imagen, preparacion, categoria
    });
    recetaEditando = null;
    document.getElementById("form-title").innerText = "➕ Agregar nueva receta";
  } else {
    await addDoc(recetasRef, {
      titulo, ingredientes, tiempo, imagen, preparacion, categoria
    });
  }

  document.getElementById("titulo").value = "";
  document.getElementById("ingredientes").value = "";
  document.getElementById("tiempo").value = "";
  document.getElementById("imagen").value = "";
  document.getElementById("preparacion").value = "";
  document.getElementById("categoria").value = "";
}

function mostrarRecetas(query = "", filtroCat = "") {
  onSnapshot(recetasRef, (snapshot) => {
    const recetasDiv = document.getElementById("recetas");
    recetasDiv.innerHTML = "";

    snapshot.docs.forEach(docu => {
      const receta = docu.data();
      const id = docu.id;

      const coincideTexto = receta.titulo.toLowerCase().includes(query.toLowerCase()) ||
        receta.ingredientes.toLowerCase().includes(query.toLowerCase());
      const coincideCategoria = !filtroCat || receta.categoria === filtroCat;

      if (!coincideTexto || !coincideCategoria) return;

      const div = document.createElement("div");
      div.className = "receta";
      div.innerHTML = `
        <h3>${receta.titulo} <small>(${receta.categoria || "Sin categoría"})</small></h3>
        <img src="${receta.imagen}" alt="${receta.titulo}">
        <p><strong>Tiempo:</strong> ${receta.tiempo}</p>
        <p><strong>Ingredientes:</strong> ${receta.ingredientes}</p>
        <p><strong>Preparación:</strong> ${receta.preparacion}</p>
        <div class="acciones">
          <button onclick="editarReceta('${id}', \`${receta.titulo}\`, \`${receta.ingredientes}\`, \`${receta.tiempo}\`, \`${receta.imagen}\`, \`${receta.preparacion}\`, \`${receta.categoria || ""}\`)">✏️ Editar</button>
          <button onclick="eliminarReceta('${id}')">🗑️ Eliminar</button>
        </div>
      `;
      recetasDiv.appendChild(div);
    });
  });
}

window.eliminarReceta = async (id) => {
  await deleteDoc(doc(db, "recetas", id));
};

window.editarReceta = (id, titulo, ingredientes, tiempo, imagen, preparacion, categoria) => {
  recetaEditando = id;
  document.getElementById("form-title").innerText = "✏️ Editando receta";
  document.getElementById("titulo").value = titulo;
  document.getElementById("ingredientes").value = ingredientes;
  document.getElementById("tiempo").value = tiempo;
  document.getElementById("imagen").value = imagen;
  document.getElementById("preparacion").value = preparacion;
  document.getElementById("categoria").value = categoria;
};

window.buscarRecetas = () => {
  const q = document.getElementById("busqueda").value;
  const cat = document.getElementById("filtroCategoria").value;
  mostrarRecetas(q, cat);
};

window.guardarReceta = guardarReceta;
window.buscarRecetas = buscarRecetas;
window.eliminarReceta = eliminarReceta;
window.editarReceta = editarReceta;

mostrarRecetas();

