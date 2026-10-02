const full_name = document.getElementById("full_name");
const email = document.getElementById("email");
const password = document.getElementById("password");
const confirm_password = document.getElementById("confirm_password");
const submitButton = document.getElementById("create_account");

function checkFields() {
  const submit =
    full_name.value.trim() !== "" &&
    email.value.trim() !== "" &&
    password.value.trim() !== "" &&
    confirm_password.value.trim() !== "";

  submitButton.disabled = !submit;
}

full_name.addEventListener("change", checkFields);
email.addEventListener("change", checkFields);
password.addEventListener("change", checkFields);
confirm_password.addEventListener("change", checkFields);

checkFields();

submitButton.addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "Registration_complete.html";
});
