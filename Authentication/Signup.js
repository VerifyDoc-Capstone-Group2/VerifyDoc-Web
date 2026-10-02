const first_name = document.getElementById("first_name");
const last_name = document.getElementById("last_name");
const email = document.getElementById("email");
const number = document.getElementById("number");
const cac = document.getElementById("cac");
const password = document.getElementById("password");
const digit = document.getElementById("digit");
const confirm_password = document.getElementById("confirm_password");
const header = document.getElementById("header");
const email_text = document.getElementById("email_text");
const submitButton = document.getElementById("create_account");

function checkFields() {
  const submit =
    first_name.value.trim() !== "" &&
    last_name.value.trim() !== "" &&
    email.value.trim() !== "" &&
    password.value.trim() !== "" &&
    confirm_password.value.trim() !== "" &&
    password.value === confirm_password.value;

  submitButton.disabled = !submit;
}

["input", "change"].forEach((eventName) => {
  first_name.addEventListener(eventName, checkFields);
  last_name.addEventListener(eventName, checkFields);
  email.addEventListener(eventName, checkFields);
  cac.addEventListener(eventName, checkFields);
  password.addEventListener(eventName, checkFields);
  confirm_password.addEventListener(eventName, checkFields);
});

const role = new URLSearchParams(window.location.search).get("role");

if (role === "Institution") {
  header.textContent = "Create an institution account";
  email_text.textContent = "Work email";
  number.style.display = "none";
} else if (role === "Organization") {
  header.textContent = "Create an organization account";
  email_text.textContent = "Organization email";
} else {
  header.textContent = "Create an account";
  email_text.textContent = "Email Address";
  number.style.display = "none";
}

checkFields();

const API_URL = "https://verifydoc-api-v1.onrender.com";
async function signUp(data) {
  let url = "auth/register";
  try {
    const response = await fetch(`${API_URL}/${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Success:", result);

    window.location.href = "Registration_complete.html";
  } catch (error) {
    console.error("Error:", error);
    alert("Unable to create your account. Please try again.");
    first_name.value = "";
    last_name.value = "";
    email.value = "";
    cac.value = "";
    password.value = "";
    confirm_password.value = "";
  }
}

submitButton.addEventListener("click", async (e) => {
  const user = {
    firstName: first_name.value.trim(),
    lastName: last_name.value.trim(),
    email: email.value.trim(),
    password: password.value,
    ...(role === "Organization" && {
      cacNumber: cac.value,
    }),
    role: role,
  };
  e.preventDefault();
  if (role === "Institution" || role === "Organization") {
    window.location.href = `Details.html?role=${role}`;
    localStorage.setItem("user", JSON.stringify(user));
    return;
  }

  if (submitButton.disabled) {
    return;
  }

  if (password.value !== confirm_password.value) {
    alert("Passwords do not match.");
    return;
  }

  await signUp({
    firstName: first_name.value.trim(),
    lastName: last_name.value.trim(),
    email: email.value.trim(),
    password: password.value,
    ...(role === "Organization" && {
      cacCertificate: cac.value,
    }),
    role: role,
  });
});
