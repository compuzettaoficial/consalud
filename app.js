firebase.auth().onAuthStateChanged(user => {
  const info = document.getElementById('user-info');
  if (user) {
    info.textContent = 'Bienvenido ' + user.displayName;
  } else {
    info.textContent = 'No has iniciado sesión';
  }
});

function loginConGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider);
}

function logout() {
  firebase.auth().signOut();
}
