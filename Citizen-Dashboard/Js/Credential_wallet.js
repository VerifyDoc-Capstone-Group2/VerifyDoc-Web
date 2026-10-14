const searchInput = document.getElementById("credentialSearch");
const typeFilter = document.getElementById("typeFilter");
const statusFilter = document.getElementById("statusFilter");
const dateFilterDesktop = document.getElementById("dateFilterDesktop");
const dateFilterMobile = document.getElementById("dateFilterMobile");
const applyFiltersButton = document.getElementById("applyFilters");
const resetFiltersButton = document.getElementById("resetFilters");
const walletContent = document.getElementById("walletContent");
const noCredentialsState = document.getElementById("noCredentialsState");
const loadingState = document.getElementById("loadingState");

const degree_name = document.querySelector(".degree_name");
const school_name = document.querySelectorAll(".school_name");
const status = document.querySelector(".status");
const credential_number = document.querySelector(".credential_number");
const date = document.querySelector(".date");
const review = document.getElementById("review");
const credentialRows = Array.from(
  document.querySelectorAll("#credentialList > li"),
);
const emptyState = document.getElementById("emptyState");

//filter state
function filterCredentials() {
  const query = searchInput.value.trim().toLowerCase();
  const type = typeFilter.value;
  const status = statusFilter.value;
  const date = window.matchMedia("(min-width: 1024px)").matches
    ? dateFilterDesktop.value
    : dateFilterMobile.value;
  let visibleCount = 0;

  credentialRows.forEach((row) => {
    const searchableText = (row.dataset.search || row.textContent).toLowerCase();
    const matchesQuery = searchableText.includes(query);
    const matchesType = !type || row.dataset.type === type;
    const matchesStatus = !status || row.dataset.status === status;
    const matchesDate =
      !date ||
      (date === "expired" && row.dataset.status === "expired") ||
      (date === "soon" &&
        row.dataset.status !== "expired" &&
        new Date(row.dataset.expiry) <=
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    const isVisible =
      matchesQuery && matchesType && matchesStatus && matchesDate;
    row.classList.toggle("hidden", !isVisible);
    if (isVisible) visibleCount += 1;
  });
  emptyState.classList.toggle("hidden", visibleCount !== 0);
}

const isDesktop = window.matchMedia("(min-width: 1024px)");
if (isDesktop.matches) {
  [searchInput, typeFilter, statusFilter, dateFilterDesktop].forEach(
    (control) => {
      control.addEventListener(
        control === searchInput ? "input" : "change",
        filterCredentials,
      );
    },
  );
}
applyFiltersButton.addEventListener("click", filterCredentials);
resetFiltersButton.addEventListener("click", () => {
  searchInput.value = "";
  typeFilter.value = "";
  statusFilter.value = "";
  dateFilterMobile.value = "";
  dateFilterDesktop.value = "";
  filterCredentials();
});

// The reference includes wallet, empty, and loading screens; query values preview those states.
const viewState = new URLSearchParams(window.location.search).get("state");
if (viewState === "empty") {
  walletContent.classList.add("hidden");
  noCredentialsState.classList.remove("hidden");
} else if (viewState === "loading") {
  walletContent.classList.add("hidden");
  loadingState.classList.remove("hidden");
  window.setTimeout(() => {
    loadingState.classList.add("hidden");
    walletContent.classList.remove("hidden");
  }, 900);
} else {
  filterCredentials();
}

function openCredential(row) {
  const button = row.querySelector(".review-button");
  const params = new URLSearchParams({
    name: button.dataset.name,
    institution: button.dataset.institution,
    status: button.dataset.status,
    id: button.dataset.id,
    expiry: button.dataset.expiry,
    type: row.dataset.type,
  });
  window.location.href = `./Credential-Details.html?${params.toString()}`;
}

credentialRows.forEach((row) => {
  row.addEventListener("click", (event) => {
    if (!event.target.closest(".review-button")) openCredential(row);
  });
  row.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.target === row) openCredential(row);
  });
  row.querySelector(".review-button").addEventListener("click", (event) => {
    event.stopPropagation();
    openCredential(row);
  });
});

if (window.lucide) window.lucide.createIcons();

async function fetchWallet() {
  const API_BASE_URL = "https://verifydoc-api-v1.onrender.com";
  const token = localStorage.getItem("authorization");

  //get user details
  try {
    const response = await fetch(`${API_BASE_URL}/credentials/wallet  `, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    console.log(data);
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

fetchWallet();
