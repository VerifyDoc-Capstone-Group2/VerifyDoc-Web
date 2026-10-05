const header = document.getElementById("header");
const profilePicturePlaceholder = document.getElementById(
  "profile-picture-placeholder"
);
const profilePicker = document.getElementById("profile-picker");
const submitButton = document.getElementById("submit-button");
const cropperModal = document.getElementById("cropper-modal");
const cropperContainer = document.getElementById("cropper-container");
const cancelCropBtn = document.getElementById("cancel-crop");
const saveCropBtn = document.getElementById("save-crop");
const avatarPreview = document.getElementById("avatar-preview");

const API_URL = "https://verifydoc-api-v1.onrender.com";

header.textContent = "Upload your profile picture";

let croppieInstance = null;

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

function previewImage(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      cropperModal.showModal();

      if (croppieInstance) {
        croppieInstance.destroy()
      };

      croppieInstance = new Croppie(cropperContainer, {
        viewport: { width: 200, height: 200, type: 'circle' },
        boundary: { width: 300, height: 300 },
        showZoomer: true,
        enableOrientation: true
      });

      croppieInstance.bind({
        url: e.target.result
      });
    }

    reader.readAsDataURL(file);
  }
}


saveCropBtn.addEventListener("click", () => {
  if (croppieInstance) {
    
    croppieInstance.result({ type: 'base64', size: 'viewport', circle: true }).then((croppedImage) => {
      
      avatarPreview.src = croppedImage;
      
      cropperModal.close();
    });
  }

  uploadProfilePicture();
});

cancelCropBtn.addEventListener("click", () => {
  cropperModal.close();

  document.getElementById("profile-picker").value = "";
});

localStorage.setItem("profileSetupSeen", "true");

const uploadProfilePicture = async () => {
  const file = profilePicker.files[0];

  if (!file) {
    showToast("Please select a profile picture before submitting.", {
      background: "red",
      color: "white",
      borderRadius: "8px"
    });
    return;
  };

  const formData = new FormData();

  formData.append("profilePicture", file); 

  const token = localStorage.getItem("authorization");

  const response = await fetch(`${API_URL}/users/me`, {
    method: "PATCH",

    headers: {
      Authorization: `Bearer ${token}`
    },

    body: formData
  });

  const result = await response.json();

  if (!response.ok) {
    showToast(result.message || "Failed to upload profile picture", {
      background: "red",
      color: "white",
      borderRadius: "5px"
    });

    throw new Error(result.message || "Failed to upload profile picture");
  };

  if (response.status === 200) {
    showToast("Profile picture uploaded successfully!");

    setTimeout(() => {
      window.location.href = "../../Citizen-dashbord/dashboard.html";
    }, 1500);
  }
};