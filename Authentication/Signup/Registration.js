// Base API URL

console.log("Registration.js loaded");

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

const API_BASE_URL = "https://verifydoc-api-v1.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const otpInputs = document.querySelectorAll('section input[type="text"]');
  const timerDisplay = document.querySelector("span b");
  const resendBtn = document.querySelector("button");
  const role = new URLSearchParams(window.location.search).get("role") || "";

  let countdownTimer = null;
  let timeLeft = 30;

  // Extract email saved during signup
  const userEmail = sessionStorage.getItem("verificationEmail");

  if (!userEmail) {
    showToast("No email found for verification. Please sign up again.", {
      background: "red",
      color: "white",
      borderRadius: "8px",
    });

    return;
  }

  let isVerifying = false;

  // Auto-focus and numeric entry handling across the 6 boxes
  otpInputs.forEach((input, index) => {
    input.addEventListener("input", (e) => {
      // clearAlert();
      const value = e.target.value;

      e.target.value = value.replace(/[^0-9]/g, "");

      if (e.target.value && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }

      // Collect code when all 6 digits are typed
      const otpCode = Array.from(otpInputs)
        .map((i) => i.value)
        .join("");
      if (otpCode.length === 6) {
        verifyOtp(otpCode);
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && index > 0) {
        otpInputs[index - 1].focus();
      }
    });

    input.addEventListener("paste", (e) => {
      e.preventDefault();
      const pasteData = e.clipboardData.getData("text").trim();
      if (/^\d{6}$/.test(pasteData)) {
        pasteData.split("").forEach((char, idx) => {
          if (otpInputs[idx]) otpInputs[idx].value = char;
        });
        otpInputs[5].focus();
        verifyOtp(pasteData);
      }
    });
  });

  // --- API CALL: VERIFY EMAIL OTP ---
  async function verifyOtp(code) {
    if (isVerifying) return;

    isVerifying = true;

    showToast("Verifying code...", {
      background: "amber",
      color: "black",
      borderRadius: "8px",
    });

    try {
      const response = await fetch(`${API_BASE_URL}/auth/email/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          otp: code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verification failed");
      }

      showToast("Email verified successfully! Redirecting to login...");

      sessionStorage.removeItem("verificationEmail");

      if (role === "Organization" || role === "Institution") {
        setTimeout(() => {
          window.location.href = "Application_submitted.html";
        }, 1500);
      } else {
        setTimeout(() => {
          window.location.href = "../Login/login.html";
        }, 1500);
      }
    } catch (error) {
      showToast("Verification failed. Please try again.", {
        background: "red",
        color: "white",
        borderRadius: "8px",
      });
    } finally {
      isVerifying = false;
    }
  }

  // --- TIMER FOR RESEND BUTTON ---
  function startCountdown() {
    timeLeft = 30;
    resendBtn.disabled = true;
    resendBtn.classList.add("opacity-50", "cursor-not-allowed");

    countdownTimer = setInterval(() => {
      timeLeft--;
      timerDisplay.innerText = `00:${timeLeft < 10 ? "0" : ""}${timeLeft}`;

      if (timeLeft <= 0) {
        clearInterval(countdownTimer);
        resendBtn.disabled = false;
        resendBtn.classList.remove("opacity-50", "cursor-not-allowed");
      }
    }, 1000);
  }

  // --- API CALL: RESEND CODE ---
  resendBtn.addEventListener("click", async () => {
    if (resendBtn.disabled) return;

    // clearAlert();
    showToast("Sending a new verification code...");

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/email/send-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: userEmail }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        showToast("Failed to resend code. Please try again.", {
          background: "red",
          color: "white",
          borderRadius: "8px",
        });

        throw new Error(data.message);
      }

      showToast("Verification code resent successfully!");
      startCountdown();
    } catch (error) {
      showToast("Could not resend code. Please try again.", {
        background: "red",
        color: "white",
        borderRadius: "8px",
      });
    }
  });

  startCountdown();
});
