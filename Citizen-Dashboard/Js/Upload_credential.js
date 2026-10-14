const mobileMenu = document.getElementById("mobileMenu");
const mobileMenuBackdrop = document.getElementById("mobileMenuBackdrop");
const openMenuButton = document.getElementById("openBtn");
const closeMenuButton = document.getElementById("closeBtn");
const credentialForm = document.getElementById("credentialForm");
const credentialFile = document.getElementById("credentialFile");
const fileName = document.getElementById("fileName");
const fileError = document.getElementById("fileError");
const program_name = document.getElementById("programName");
const issue_date = document.getElementById("issueDate");
const expiry_date = document.getElementById("expiryDate");
const institution = document.getElementById("institutionName");
const credential_type = document.getElementById("credentialType");
const first_name = document.getElementById("firstName");
const last_name = document.getElementById("lastName");
const email = document.getElementById("recipientEmail");

function setMobileMenuOpen(isOpen) {
  mobileMenu.classList.toggle("hidden", !isOpen);
  mobileMenu.classList.toggle("flex", isOpen);
  mobileMenuBackdrop.classList.toggle("hidden", !isOpen);
  openMenuButton.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) closeMenuButton.focus();
  else openMenuButton.focus();
}

openMenuButton.addEventListener("click", () => setMobileMenuOpen(true));
closeMenuButton.addEventListener("click", () => setMobileMenuOpen(false));
mobileMenuBackdrop.addEventListener("click", () => setMobileMenuOpen(false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !mobileMenu.classList.contains("hidden"))
    setMobileMenuOpen(false);
});
mobileMenu
  .querySelectorAll("a")
  .forEach((link) =>
    link.addEventListener("click", () => setMobileMenuOpen(false)),
  );

credentialFile.addEventListener("change", () => {
  const selectedFile = credentialFile.files[0];
  fileName.textContent = selectedFile ? selectedFile.name : "";
  fileName.classList.toggle("hidden", !selectedFile);
  fileError.classList.add("hidden");
});
const dropTarget = credentialFile.closest("label");
dropTarget.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropTarget.classList.add("bg-blue-100");
});
dropTarget.addEventListener("dragleave", () =>
  dropTarget.classList.remove("bg-blue-100"),
);
dropTarget.addEventListener("drop", (event) => {
  event.preventDefault();
  dropTarget.classList.remove("bg-blue-100");
  const [droppedFile] = event.dataTransfer.files;
  if (
    droppedFile &&
    (droppedFile.type === "application/pdf" ||
      droppedFile.type.startsWith("image/"))
  ) {
    const transfer = new DataTransfer();
    transfer.items.add(droppedFile);
    credentialFile.files = transfer.files;
    credentialFile.dispatchEvent(new Event("change"));
  } else {
    fileError.classList.remove("hidden");
  }
});

// This prototype previews the uploaded details locally; it does not send files to a server.
credentialForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(credentialForm);
  formData.append("document", credentialFile.files[0]);

  console.log({
    credentialType: credential_type.value.trim(),
    title: program_name.value.trim(),
    expiryDate: expiry_date.value.trim(),
    issueDate: issue_date.value.trim(),
    institution: institution.value.trim(),
    firstName: first_name.value.trim(),
    lastName: last_name.value.trim(),
    email: email.value.trim(),
  });
  if (!credentialForm.reportValidity()) return;
  if (!credentialFile.files.length) {
    fileError.classList.remove("hidden");
    return;
  }
  const value = (id) => document.getElementById(id).value.trim();
  const dateLabel = (id) => {
    const date = value(id);
    return date
      ? new Date(`${date}T00:00:00`).toLocaleDateString("en-GB")
      : "—";
  };
  document.getElementById("uploadedHolder").textContent =
    `${value("firstName")} ${value("lastName")}`;
  document.getElementById("uploadedInstitution").textContent =
    value("institutionName");
  document.getElementById("uploadedType").textContent = value("credentialType");
  document.getElementById("uploadedProgram").textContent = value("programName");
  document.getElementById("uploadedIssueDate").textContent =
    dateLabel("issueDate");
  document.getElementById("uploadedExpiryDate").textContent =
    dateLabel("expiryDate");
  const preview = document.getElementById("documentPreview");
  const placeholder = document.getElementById("documentPlaceholder");

  if (credentialFile.files[0].type.startsWith("image/")) {
    preview.src = URL.createObjectURL(credentialFile.files[0]);
    preview.classList.remove("hidden");
    placeholder.classList.add("hidden");
  } else {
    preview.classList.add("hidden");
    placeholder.textContent = credentialFile.files[0].name;
    placeholder.classList.remove("hidden");
  }
  document.getElementById("uploadFormScreen").classList.add("hidden");
  document.getElementById("uploadedScreen").classList.remove("hidden");
  const qrContainer = document.getElementById("uploadedQrCode");
  qrContainer.replaceChildren();
  if (window.QRCode) {
    new QRCode(qrContainer, {
      text: `VerifyDoc credential NU/1234678 for ${value("firstName")} ${value("lastName")}`,
      width: 64,
      height: 64,
    });
  }
  if (window.lucide) window.lucide.createIcons();
});

document.getElementById("uploadAnotherButton").addEventListener("click", () => {
  credentialForm.reset();
  fileName.textContent = "";
  fileName.classList.add("hidden");
  fileError.classList.add("hidden");
  document.getElementById("documentPreview").classList.add("hidden");
  document.getElementById("documentPlaceholder").classList.remove("hidden");
  document.getElementById("documentPlaceholder").textContent =
    "Credential document";
  document.getElementById("uploadedScreen").classList.add("hidden");
  document.getElementById("uploadFormScreen").classList.remove("hidden");
});

if (window.lucide) window.lucide.createIcons();
