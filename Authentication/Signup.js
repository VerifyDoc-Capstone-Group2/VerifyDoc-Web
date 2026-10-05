const firstName = document.getElementById("firstName");
const lastName = document.getElementById("last_name");
const email = document.getElementById("email");
const phoneNumber = document.getElementById("phoneNumber");
const cac = document.getElementById("cac");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirm_password");
const passwordErrorMessage = document.getElementById("passwordErrorMessage");

const header = document.getElementById("header");
const emailText = document.getElementById("email_text");
const submitButton = document.getElementById("create_account");

const API_URL = "https://verifydoc-api-v1.onrender.com";

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


// ==========================================
// GET ROLE FROM URL
// ==========================================

const role = new URLSearchParams(
  window.location.search
).get("role");


// ==========================================
// CONFIGURE PAGE BASED ON ROLE
// ==========================================

if (role === "Institution") {
  header.textContent = "Create an institution account";
  emailText.textContent = "Institution email";

  // CAC belongs to organizations, not institutions
  if (cac) {
    cac.style.display = "none";
  }

} else if (role === "Organization") {
  header.textContent = "Create an organization account";
  emailText.textContent = "Organization email";

} else {
  header.textContent = "Create an account";
  emailText.textContent = "Email Address";

  if (cac) {
    cac.style.display = "none";
  }
}


// ==========================================
// FORM VALIDATION
// ==========================================

function checkFields() {
  const basicFieldsValid =
    firstName.value.trim() !== "" &&
    lastName.value.trim() !== "" &&
    email.value.trim() !== "" &&
    password.value.trim() !== "" &&
    confirmPassword.value.trim() !== "";

  // Organization must provide CAC number
  const roleFieldsValid =
    role !== "Organization" ||
    (cac && cac.value.trim() !== "");

  submitButton.disabled =
    !(basicFieldsValid && roleFieldsValid);
}


// Listen for changes to required fields
[
  firstName,
  lastName,
  email,
  password,
  confirmPassword,
  cac
].forEach((input) => {
  if (!input) return;

  input.addEventListener("input", checkFields);
  input.addEventListener("change", checkFields);
});

checkFields();


// ==========================================
// CITIZEN REGISTRATION
// ==========================================

async function signUpCitizen(userData) {
  const response = await fetch(
    `${API_URL}/auth/register`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(userData)
    }
  );

  const result = await response.json();

  if (!response.ok) {
    showToast(result.message || "Registration failed", {
      background: "red",
      color: "white",
      borderRadius: "8px"
    });

    throw new Error(
      result.message ||
      `Registration failed (${response.status})`
    );
  }

  if (response.status === 201) {
    showToast("Account created successfully!")
  };

  return result;
};

// ------------------------------------------
// PASSWORD CHECK
// ------------------------------------------
password.addEventListener("input", () => {
  if (password.value.length < 8) {
    passwordErrorMessage.textContent = "Password must contain at least 8 characters.";
    return;
  };

  if (password.value.length >= 8) {
    passwordErrorMessage.textContent = "";
    return;
  }

  if (password.value === "") {
    passwordErrorMessage.textContent = "";

    return;
  };
});

confirmPassword.addEventListener("input", () => {
  if (confirmPassword.value.length < 8) {
    passwordErrorMessage.textContent = "Password must contain at least 8 characters.";
    return;
  }

  if (confirmPassword.value.length >= 8) {
    passwordErrorMessage.textContent = "";
  }

  if (password.value !== confirmPassword.value) {
    passwordErrorMessage.textContent = "Passwords do not match.";
    return;
  };

  if (confirmPassword.value === "") {
    passwordErrorMessage.textContent = "";

    return;
  };
});


// ==========================================
// SUBMIT
// ==========================================

submitButton.addEventListener("click", async (event) => {
  event.preventDefault();

  // Don't continue if fields aren't valid
  if (submitButton.disabled) {
    return;
  }

  // ------------------------------------------
  // DETERMINE USER ROLE
  // ------------------------------------------

  const userRole =
    role === "Organization" ||
    role === "Institution"
      ? role
      : "Citizen";


  // ------------------------------------------
  // BUILD USER DATA
  // ------------------------------------------

  const user = {
    firstName: firstName.value.trim(),

    lastName: lastName.value.trim(),

    email: email.value.trim().toLowerCase(),

    password: password.value,

    role: userRole
  };


  // Phone number is optional
  if (
    phoneNumber &&
    phoneNumber.value.trim().length > 0
  ) {
    if (phoneNumber.value.startsWith("+234")) {
      if (phoneNumber.value.length !== 14) {
        showToast(
          "Invalid phone number.",
          {
            background: "red",
            color: "white",
            borderRadius: "8px"
          }
        );

        return;
      }
    };

    if (phoneNumber.value.startsWith("0")) {
      if (phoneNumber.value.length !== 11) {
        showToast(
          "Invalid phone number.",
          {
            background: "red",
            color: "white",
            borderRadius: "8px"
          }
        );

        return;
      }
    };

    user.phoneNumber =
      phoneNumber.value.trim();
  }


  // ==========================================
  // ORGANIZATION / INSTITUTION
  // ==========================================

  if (
    userRole === "Organization" ||
    userRole === "Institution"
  ) {

    // CAC NUMBER — NOT CAC CERTIFICATE
    if (userRole === "Organization") {
      user.cacNumber = cac.value.trim();
    }


    /*
      This is temporary registration data.

      Details.html will collect the remaining
      Organization/Institution information and
      make the actual registration request.
    */

    sessionStorage.setItem(
      "registrationUser",
      JSON.stringify(user)
    );


    window.location.href =
      `Details.html?role=${userRole}`;

    return;
  }


  // ==========================================
  // CITIZEN
  // ==========================================

  try {

    submitButton.disabled = true;
    submitButton.textContent =
      "Creating account...";


    await signUpCitizen(user);

    sessionStorage.setItem(
      "verificationEmail",
      user.email
    );

    window.location.href = "./Registration_complete.html";

    submitButton.textContent = "Create account";


  } catch (error) {

    console.error(
      "Registration error:",
      error
    );

    showToast(
      error.message ||
      "An error occurred during registration.", {
        background: "red",
        color: "white",
        borderRadius: "8px"
      }
    );


    // Keep their entered information.
    // Don't make them fill everything again.

    submitButton.textContent =
      "Create account";

    checkFields();
  }
});