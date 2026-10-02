const organizationName = document.getElementById("organization_name");
const type = document.getElementById("type");
const name1 = document.getElementById("name");

const organizationType = document.getElementById("organization_type");
const phoneNumber = document.getElementById("number");
const documentInput = document.getElementById("organization_document");
const documentLabel = document.getElementById("document_label");
const filePreview = document.getElementById("file_preview");
const submitApplication = document.getElementById("submit_application");
const applicationMessage = document.getElementById("application_message");
const applicationForm = submitApplication.form;
const header = document.getElementById("header");
const description = document.getElementById("text");
const role = new URLSearchParams(window.location.search).get("role") || "";
const isInstitution = role.toLowerCase() === "Institution";
const apiUrl = "https://verifydoc-api-v1.onrender.com";
let previewUrl;

if (isInstitution) {
  header.textContent = "Institution details";
  description.textContent = "Tell us about your institution";
  documentLabel.textContent = "Accreditation document";
  type.textContent = "Institution type";
  name1.textContent = "Institution name";
} else {
  header.textContent = "Organization details";
  description.textContent = "Tell us about your organization";
  documentLabel.textContent = "CAC Certificate";
  type.textContent = "Organization Type";
  name1.textContent = "Organization name";
}

function checkDetails() {
  submitApplication.disabled =
    organizationName.value.trim() === "" ||
    organizationType.value.trim() === "" ||
    phoneNumber.value.trim() === "" ||
    documentInput.files.length === 0;
}

function showFilePreview() {
  const selectedFile = documentInput.files[0];
  filePreview.replaceChildren();

  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = undefined;
  }

  if (!selectedFile) {
    filePreview.classList.add("hidden");
    checkDetails();
    return;
  }

  const fileName = document.createElement("p");
  fileName.className = "break-all text-sm font-semibold text-[#111827]";
  fileName.textContent = selectedFile.name;
  filePreview.append(fileName);

  if (
    selectedFile.type === "application/pdf" ||
    selectedFile.type.startsWith("image/")
  ) {
    previewUrl = URL.createObjectURL(selectedFile);
    if (selectedFile.type === "application/pdf") {
      const pdf = document.createElement("iframe");
      pdf.src = previewUrl;
      pdf.title = `Preview of ${selectedFile.name}`;
      pdf.className = "mt-3 h-80 w-full rounded border";
      filePreview.append(pdf);
    } else {
      const image = document.createElement("img");
      image.src = previewUrl;
      image.alt = `Preview of ${selectedFile.name}`;
      image.className = "mt-3 max-h-80 max-w-full rounded object-contain";
      filePreview.append(image);
    }
  }

  filePreview.classList.remove("hidden");
  checkDetails();
}

[organizationName, organizationType, phoneNumber].forEach((input) => {
  input.addEventListener("input", checkDetails);
});
documentInput.addEventListener("change", showFilePreview);

checkDetails();

applicationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  checkDetails();
  applicationMessage.classList.add("hidden");

  if (submitApplication.disabled) {
    return;
  }

  let user;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch (error) {
    console.error("Unable to read saved signup details:", error);
  }

  if (!user) {
    applicationMessage.textContent =
      "Signup details were not found. Please return to signup and try again.";
    applicationMessage.className = "text-sm text-red-600";
    return;
  }

  const formData = new FormData();
  Object.entries({
    ...user,
    organizationName: organizationName.value.trim(),
    organizationType: organizationType.value.trim(),
    phoneNumber: phoneNumber.value.trim(),
  }).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });
  formData.append(
    isInstitution ? "accreditedDocument" : "cacCertificate",
    documentInput.files[0],
  );

  console.log({
    ...user,
    organizationName: organizationName.value.trim(),
    organizationType: organizationType.value.trim(),
    phoneNumber: phoneNumber.value.trim(),
  });

  submitApplication.disabled = true;
  applicationMessage.textContent = "Submitting your application...";
  applicationMessage.className = "text-sm text-[#737373]";

  let url = "";

  if (role === "Organization") {
    url = "auth/register-organization";
  } else {
    url = "auth/register-institution";
  }
  try {
    const response = await fetch(`${apiUrl}/${url}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Registration failed with status ${response.status}`);
    }

    localStorage.removeItem("user");
    window.location.href = "Application_submitted.html";
  } catch (error) {
    console.error("Unable to submit application:", error);
    applicationMessage.textContent =
      "Unable to submit your application. Please try again.";
    applicationMessage.className = "text-sm text-red-600";
    submitApplication.disabled = false;
  }
});

window.addEventListener("pagehide", () => {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
  }
});
