// VerifyDoc API Base URL
const API_BASE_URL = "https://verifydoc-api-v1.onrender.com";

function showToast (message, toastStyle) {
  Toastify({
    text: message,
    duration: 3000,
    gravity: "top",
    style: toastStyle || {
      background: "green",
      color: "white",
      borderRadius: "8px"
    }
  }).showToast();
};

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login");
const loginForm = document.getElementById("loginForm");

// Create dynamic alert container for feedback
// let alertBox = document.getElementById("loginAlert");
// if (!alertBox) {
//   alertBox = document.createElement("div");
//   alertBox.id = "loginAlert";
//   alertBox.className = "hidden text-sm rounded-md p-3 text-center mb-2 font-medium transition-all";
//   loginForm.parentNode.insertBefore(alertBox, loginForm);
// }

// function showAlert(message, isError = true) {
//   alertBox.innerText = message;
//   alertBox.classList.remove("hidden", "bg-red-100", "text-red-700", "bg-green-100", "text-green-700");
//   if (isError) {
//     alertBox.classList.add("bg-red-100", "text-red-700");
//   } else {
//     alertBox.classList.add("bg-green-100", "text-green-700");
//   }
// }

// function clearAlert() {
//   alertBox.innerText = "";
//   alertBox.classList.add("hidden");
// }

function updateButtonState() {
  const isValid = emailInput.value.trim() !== "" && passwordInput.value.trim() !== "";
  loginBtn.disabled = !isValid;
}

emailInput.addEventListener("input", updateButtonState);
passwordInput.addEventListener("input", updateButtonState);

// Initial validation state on load
updateButtonState();

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  // clearAlert();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  try {
    loginBtn.disabled = true;
    loginBtn.innerText = "Logging in...";

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const resData = await response.json();

    if (!response.ok) {
      throw new Error(resData.message || "Invalid email or password.");
    }

    // Extract JWT token and user info per API spec
    if (resData.data && resData.data.token) {
      localStorage.setItem("authorization", resData.data.token);
      localStorage.setItem("user", JSON.stringify(resData.data.user));
    }

    showToast("Login successful! Redirecting...");

    setTimeout(() => {
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user) {
        showAlert("User information is missing. Please log in again.");
      };

      if (user.profilePicture === null) {
        window.location.href = "../../Authentication/Signup/Profile_picture.html";

        return;
      }

      if (user && user.role === "Admin") {
        window.location.href = "../../Admin-Dashboard/Admin.html";
      } else if (user && user.role === "Organization") {
        window.location.href = "../../Employer-dashbord/dashboard.html";
      } else if (user && user.role === "Institution") {
        window.location.href = "../../Institution-dashbord/dashboard.html";
      } else if (user && user.role === "Citizen") {
        window.location.href = "../../Citizen-dashbord/dashboard.html";
      }
    }, 3000);

  } catch (error) {
    showAlert(error.message || "An unexpected error occurred. Please try again.");
    loginBtn.innerText = "Log in";
    updateButtonState();
  }
});