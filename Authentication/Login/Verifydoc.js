// VerifyDoc API Base URL
const API_BASE_URL = "https://verifydoc-api-v1.onrender.com";

function showToast(message, toastStyle) {
  Toastify({
    text: message,
    duration: 3000,
    gravity: "top",
    style: toastStyle || {
      background: "green",
      color: "white",
      borderRadius: "8px",
    },
  }).showToast();
}

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login");
const loginForm = document.getElementById("loginForm");

function updateButtonState() {
  const isValid =
    emailInput.value.trim() !== "" && passwordInput.value.trim() !== "";
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

    if (!resData.data?.token || !resData.data?.user) throw new Error("Incomplete login response");

    // Extract JWT token and user info per API spec
    if (resData.data && resData.data.token) {
      localStorage.setItem("authorization", resData.data.token);
      localStorage.setItem("user", JSON.stringify(resData.data.user));
    }

    showToast("Login successful! Redirecting...");

    setTimeout(() => {
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user) {
        showToast("User information is missing. Please log in again.");
        return;
      }

      const profileSetup = localStorage.getItem("profileSetupSeen");

      if (user.role !== "Organization" && !profileSetup && !user.profilePicture?.url) {
        window.location.href =
          "../../Authentication/Signup/Profile_picture.html";

        return;
      }

      if (user && user.role === "Admin") {
        window.location.href = "../../Admin-Dashboard/Admin.html";
      } else if (user && user.role === "Organization") {
        window.location.href = "../../Employer-dashbord/dashboard.html";
      } else if (user && user.role === "Institution") {
        window.location.href =
          "../../Institution-Dashboard/institute dashboard.html";
      } else if (user && user.role === "Citizen") {
        window.location.href = "../../Citizen-Dashboard/Dashboard.html";
      }
    }, 3000);
  } catch (error) {
    showToast(error.message || "Unable to log in. Please try again.", { background: "#DC2626", color: "white" });
    loginBtn.innerText = "Log in";
    updateButtonState();
  }
});
