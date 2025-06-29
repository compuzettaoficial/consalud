
let user=null;
auth.onAuthStateChanged(u=>{
 user=u;
 document.getElementById('user-info').innerText=user?
  '👋 '+user.displayName:'No conectado';
 mostrarRecetas();
 if(user&&user.email==='compuzettaoficial@gmail.com')
   document.getElementById('admin-panel').style.display='block';
 else
   document.getElementById('admin-panel').style.display='none';
});
function loginConGoogle(){
 const provider=new firebase.auth.GoogleAuthProvider();
 auth.signInWithPopup(provider).catch(console.error);
}
function logout(){auth.signOut();}
function toggleTheme(){document.body.classList.toggle('dark');}
async function mostrarRecetas(){
 let snap=await db.collection('recetas').get();
 let html='';
 snap.forEach(doc=>{
  let d=doc.data();
  html+=`<div class="receta">
  <img src="${d.imagen}" width="100%"><h3>${d.titulo}</h3>
  <p>${d.tiempo}</p><p>${d.categoria}</p>
  <button onclick="agendar('${doc.id}')">📆</button>
  <button onclick="favorito('${doc.id}')">⭐</button>
  <button onclick="compartir('${d.titulo}')">🔗</button>
  </div>`;
 });
 document.getElementById('recetas').innerHTML=html;
}
function agregarReceta(){
 let d={
  titulo:document.getElementById('titulo').value,
  ingredientes:document.getElementById('ingredientes').value,
  tiempo:document.getElementById('tiempo').value,
  imagen:document.getElementById('imagen').value,
  preparacion:document.getElementById('preparacion').value,
  categoria:document.getElementById('categoria').value
 };
 db.collection('recetas').add(d).then(mostrarRecetas);
}
function buscarRecetas(){
 let q=document.getElementById('search').value.toLowerCase();
 [...document.querySelectorAll('.receta')].forEach(div=>{
   div.style.display=div.innerText.toLowerCase().includes(q)?'':'none';
 });
}
function agendar(id){alert('Aquí irá modal para agendar '+id);}
function favorito(id){alert('Marcado como favorito '+id);}
function compartir(t){navigator.share?navigator.share({title:t}):alert('Copiar link');}
