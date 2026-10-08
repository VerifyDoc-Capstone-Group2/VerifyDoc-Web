console.log("JavaScript is connected");
const API_BASE_URL = "https://verifydoc-api-v1.onrender.com";

const token = localStorage.getItem('authorization');
const userData = JSON.parse(localStorage.getItem('user'));

lucide.createIcons();


const openBtn = document.getElementById("openBtn");
const closeBtn = document.getElementById("closeBtn");
const mobileMenu = document.getElementById("mobileMenu");
const overlay = document.getElementById("overlay");
const citizenPopulation = document.getElementById('numberOfCitizen');
const pendingInstitutionPopulation = document.getElementById('pendingInstitution');
const pendingOrganizationPopulation = document.getElementById('pendingOrganization');
const totalUsers = document.getElementById('totalUsers');
const activeInstitutions = document.getElementById('activeInstitutions');
const profilePicture = document.getElementById('profilePicture');

openBtn.addEventListener("click", () => {
    mobileMenu.classList.remove("hidden");
    overlay.classList.remove("hidden");
});

closeBtn.addEventListener("click", () => {
    mobileMenu.classList.add("hidden");
    overlay.classList.add("hidden");
});

overlay.addEventListener("click", () => {
    mobileMenu.classList.add("hidden");
    overlay.classList.add("hidden");
});

document.addEventListener('DOMContentLoaded', async () => {
  const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });

  const responseData = await response.json();

  const data = await responseData.data

  // Populate the card
  citizenPopulation.textContent = data.users.citizens;
  pendingInstitutionPopulation.textContent = data.institutions.pending;
  pendingOrganizationPopulation.textContent = data.organizations.pending;
  totalUsers.textContent = data.users.total;
  activeInstitutions.textContent = data.institutions.active

  // Display user profile
  if (!userData.profilePicture.url) {
    profilePicture.src = 'https://res.cloudinary.com/qo5vllhj/image/upload/v1790994017/image_8_paptwo.jpg'
  } else {
    profilePicture.src = userData.profilePicture.url
  }
});




const dropdowns = document.querySelectorAll(".dropdown");
dropdowns.forEach((dropdown) => {
  const btn = dropdown.querySelector(".dropdown-btn");
  const menu = dropdown.querySelector(".menu");
  const label = dropdown.querySelector(".label");
  const arrow = dropdown.querySelector(".arrow");
  const defaultText = label.textContent;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();

    // Close all other dropdowns first
    dropdowns.forEach((otherDropdown) => {
      if (otherDropdown !== dropdown) {
        otherDropdown.querySelector(".menu").classList.add("hidden");
        otherDropdown.querySelector(".arrow").classList.remove("rotate-180");
      }
    });

    // Toggle the current dropdown
    menu.classList.toggle("hidden");
    arrow.classList.toggle("rotate-180");
  });

  menu.querySelectorAll("ul").forEach((item) => {
    item.addEventListener("click", () => {
      label.textContent = item.dataset.value || defaultText;

      menu.classList.add("hidden");
      arrow.classList.remove("rotate-180");
    });
  });
});

// Click anywhere else → close every dropdown
document.addEventListener("click", () => {
  dropdowns.forEach((dropdown) => {
    dropdown.querySelector(".menu").classList.add("hidden");
    dropdown.querySelector(".arrow").classList.remove("rotate-180");
  });
});











// ================================
// NEW DROPDOWN
// ================================

const newDropdowns = document.querySelectorAll(".dropdowns");

newDropdowns.forEach((dropdown) => {
  const btn = dropdown.querySelector(".dropdown-btns");
  const menu = dropdown.querySelector(".menus");
  const label = dropdown.querySelector(".labels");
  const arrow = dropdown.querySelector(".arrows");

  if (!btn || !menu || !label || !arrow) return;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();

    // Close other new dropdowns
    newDropdowns.forEach((otherDropdown) => {
      if (otherDropdown !== dropdown) {
        otherDropdown.querySelector(".menus")?.classList.add("hidden");
        otherDropdown.querySelector(".arrows")?.classList.remove("rotate-180");
      }
    });

    // Open / close this dropdown
    menu.classList.toggle("hidden");
    arrow.classList.toggle("rotate-180");
  });

  // Select an option
  menu.querySelectorAll("li").forEach((item) => {
    item.addEventListener("click", () => {
      label.textContent = item.textContent.trim();

      menu.classList.add("hidden");
      arrow.classList.remove("rotate-180");
    });
  });
});

