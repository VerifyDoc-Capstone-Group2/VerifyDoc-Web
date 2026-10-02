const email = document.getElementById("email");
const password = document.getElementById("password");
const login = document.getElementById("login");

function Login() {
  const submit = email.value.trim() !== "" && password.value.trim() !== "";
  login.disabled = !submit;
}

email.addEventListener("change", Login);
password.addEventListener("change", Login);

Login();

login.addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "../../Employer-dashbord/dashboard.html";
});
