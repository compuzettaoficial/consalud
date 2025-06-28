// Inicialización de Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Elementos del DOM
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const recetasSection = document.getElementById('recetas');
const favoritosSection = document.getElementById('favoritos');
const planificadorSection = document.getElementById('planificador');
const toggleThemeBtn = document.getElementById('toggleTheme');

// Función para iniciar sesión con Google
loginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then((result) => {
        loadRecetas();
        loadFavoritos(result.user.uid);
        loadPlanificador(result.user.uid);
        toggleThemeBtn.style.display = 'block';
    }).catch((error) => {
        console.error(error);
    });
});

// Función para cerrar sesión
logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
        recetasSection.innerHTML = '';
        favoritosSection.innerHTML = '';
        planificadorSection.innerHTML = '';
        toggleThemeBtn.style.display = 'none';
    });
});

// Cargar recetas desde Firestore
function loadRecetas() {
    db.collection('recetas').get().then((snapshot) => {
        recetasSection.innerHTML = '<h2>Recetas Públicas</h2>';
        snapshot.forEach(doc => {
            const receta = doc.data();
            recetasSection.innerHTML += `
                <div class="receta">
                    <h3>${receta.titulo}</h3>
                    <img src="${receta.imagen}" alt="${receta.titulo}">
                    <p><strong>Ingredientes:</strong> ${receta.ingredientes}</p>
                    <p><strong>Tiempo:</strong> ${receta.tiempo}</p>
                    <p><strong>Preparación:</strong> ${receta.preparacion}</p>
                    <button onclick="addFavorito('${doc.id}')">Agregar a Favoritos</button>
                </div>`;
        });
    });
}

// Cargar favoritos del usuario
function loadFavoritos(userId) {
    db.collection('usuarios').doc(userId).collection('favoritos').get().then((snapshot) => {
        favoritosSection.innerHTML = '<h2>Favoritos</h2>';
        snapshot.forEach(doc => {
            const recetaId = doc.data().recetaId;
            db.collection('recetas').doc(recetaId).get().then(recetaDoc => {
                const receta = recetaDoc.data();
                favoritosSection.innerHTML += `
                    <div class="receta">
                        <h3>${receta.titulo}</h3>
                        <img src="${receta.imagen}" alt="${receta.titulo}">
                        <button onclick="removeFavorito('${userId}', '${recetaId}')">Eliminar</button>
                    </div>`;
            });
        });
    });
}

// Agregar receta a favoritos
function addFavorito(recetaId) {
    const userId = auth.currentUser.uid;
    db.collection('usuarios').doc(userId).collection('favoritos').add({
        recetaId: recetaId
    }).then(() => {
        loadFavoritos(userId);
    });
}

// Eliminar receta de favoritos
function removeFavorito(userId, recetaId) {
    db.collection('usuarios').doc(userId).collection('favoritos').where('recetaId', '==', recetaId).get().then(snapshot => {
        snapshot.forEach(doc => {
            doc.ref.delete().then(() => {
                loadFavoritos(userId);
            });
        });
    });
}

// Cargar planificador del usuario
function loadPlanificador(userId) {
    db.collection('usuarios').doc(userId).collection('planificador').get().then((snapshot) => {
        planificadorSection.innerHTML = '<h2>Planificador</h2>';
        snapshot.forEach(doc => {
            const dia = doc.id;
            const recetasDelDia = doc.data().recetas || [];
            planificadorSection.innerHTML += `<h3>${dia}</h3>`;
            recetasDelDia.forEach(receta => {
                planificadorSection.innerHTML += `<p>${receta.titulo}</p>`;
            });
        });
    });
}

// Escuchar cambios de autenticación
auth.onAuthStateChanged((user) => {
    if (user) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        loadRecetas();
        loadFavoritos(user.uid);
        loadPlanificador(user.uid);
    } else {
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
    }
});

// Cambiar entre modo claro y oscuro
toggleThemeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    toggleThemeBtn.textContent = isDarkMode ? 'Modo Claro' : 'Modo Oscuro';
});
