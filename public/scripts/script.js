/*const registerLink = document.getElementById('register-link');
if(registerLink){

registerLink.addEventListener('click', function(event) {
  event.preventDefault(); // Prevent default link behavior if needed
  window.location.href = '../register'; // Redirect to register.html
      });}*/
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";

let firebaseApp;
let auth;

function fetchFirebaseConfig() {
  return fetch('/getFirebaseConfig')
    .then(response => response.json());
}

function initializeFirebase(firebaseConfig) {
  firebaseApp = initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  return firebaseApp;
}

fetchFirebaseConfig()
  .then(firebaseConfig => initializeFirebase(firebaseConfig))
  .catch(error => console.error('Error fetching or initializing Firebase:', error));

function showLoading() {
  document.querySelector('.loading-overlay').style.display = 'block';
  document.querySelector('.loading-spinner').style.display = 'block';
}

function hideLoading() {
  document.querySelector('.loading-overlay').style.display = 'none';
  document.querySelector('.loading-spinner').style.display = 'none';
}

// Login functionality
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const togglePassword = document.querySelector('.seepass');
const loginForm = document.querySelector('.login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loadingIndicator = document.getElementById('loadingIndicator');

if (togglePassword) {
  togglePassword.addEventListener('click', function (event) {
    passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
  });
}

if(loginForm){
loginForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  const email = emailInput.value;
  const password = passwordInput.value;
  emailError.textContent = '';
  passwordError.textContent = '';

  if (email && password) {
    showLoading();
    try {
      loadingIndicator.style.display = 'block';
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      const response = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const result = await response.json();
      loadingIndicator.style.display = 'none';

      if (response.ok && result.success) {
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
        } else {
          console.error('Invalid redirectUrl:', result.redirectUrl);
        }
      } else {
        alert(result.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      loadingIndicator.style.display = 'none';
      alert('Login failed. Please check your credentials.');
    } finally {
      hideLoading();
    }
  } else {
    if (!email) emailError.textContent = 'Email is required.';
    if (!password) passwordError.textContent = 'Password is required.';
  }
});
} 
document.getElementById('logoutBtn').addEventListener('click', async () => {
  try {
      const response = await fetch('/logout', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
      });

      const result = await response.json();

      if (result.success) {
          alert('Logged out successfully');
          window.location.href = '/index.html';
      } else {
          alert('Logout failed: ' + result.message);
      }
  } catch (error) {
      alert('An error occurred during logout. Please try again.');
  }
});
// Register functionality
/*
const emailInput1 = document.getElementById('email1');
const passwordInput1 = document.getElementById('password1');
const togglePassword1 = document.querySelector('.seepass1');
const emailError1 = document.getElementById('emailError1');
const passwordError1 = document.getElementById('passwordError1');
const typer = document.getElementById('typer');
const registerForm = document.querySelector('.login-form1');
if(togglePassword1){
togglePassword1.addEventListener('click', function (event) {
  passwordInput1.type = passwordInput1.type === 'password' ? 'text' : 'password';
});
}
if(registerForm){
registerForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  console.log("in r form"); 
  const email1 = emailInput1.value;
  const password1 = passwordInput1.value;
  const mtype = typer.value;
  emailError1.textContent = '';
  passwordError1.textContent = '';

  if (email1 && password1) {
      showLoading();
      try {
        const response = await fetch('/createUser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email1,
                password1,
                mtype,
                         }),
        });

        const result = await response.json();

        if (result.success) {
            alert('User created successfully');
            window.location.href = '../index.html';
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        if (error.message.includes('auth/email-already-exists')) {
            alert('The email address is already in use by another account.');
        } else if (error.message.includes('auth/invalid-email')) {
            alert('The email address is not valid.');
        } else if (error.message.includes('auth/weak-password')) {
            alert('The password is too weak.');
        } else {
            alert('Error creating user. Please try again.');
        }
        console.error('Error creating user:', error.message);
    }
    finally{hideLoading();}}
  else {
      if (!email1) emailError1.textContent = 'Email is required.';
      if (!password1) passwordError1.textContent = 'Password is required.';
    }
  
  });}  */