const firebaseConfig = {
  apiKey: "AIzaSyBcJ4tbucMLF3lTuDne5cyin4oyoVhTfSs",
  authDomain: "consalud-recetas.firebaseapp.com",
  projectId: "consalud-recetas",
  storageBucket: "consalud-recetas.appspot.com",
  messagingSenderId: "477690744464",
  appId: "1:477690744464:web:597172e85fd29549fd9215"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const adminEmail = "compuzettaoficial@gmail.com";
