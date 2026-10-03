const API_BASE_URL = "https://verifydoc-api-v1.onrender.com";

const token = localStorage.getItem('authorization');
const userData = JSON.parse(localStorage.getItem('user'));

lucide.createIcons();

// ==================================
// DOM
// ==================================
const menuBtn = document.getElementById("menuBtn");
const closeBtn = document.getElementById("closeBtn");
const mobileMenu = document.getElementById("mobileMenu");
const citizenPopulation = document.getElementById('numberOfCitizen');
const pendingInstitutionPopulation = document.getElementById('pendingInstitution');
const pendingOrganizationPopulation = document.getElementById('pendingOrganization');
const totalUsers = document.getElementById('totalUsers');
const activeInstitutions = document.getElementById('activeInstitutions');
const profilePicture = document.getElementById('profilePicture');

function openMenu() {
  mobileMenu.classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}
function closeMenu() {
  mobileMenu.classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

menuBtn.addEventListener("click", openMenu);
closeBtn.addEventListener("click", closeMenu);
mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
window.addEventListener("resize", () => { if (window.innerWidth >= 1024) closeMenu(); });

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

  console.log(userData);

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