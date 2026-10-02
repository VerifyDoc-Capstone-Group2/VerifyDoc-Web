const email_forgot = document.getElementById("email_forgot");
const resend = document.getElementById("resend");

function Resend() {
  const submit = email_forgot.value.trim() !== "";
  resend.disabled = !submit;
}

email_forgot.addEventListener("change", Resend);

Resend();

resend.addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "./New_password.html";
});
