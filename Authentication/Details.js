const organizationName = document.getElementById("organization_name");
const type = document.getElementById("type");
const name1 = document.getElementById("name");

let organizationType = document.getElementById("organization_type");
const phoneNumber = document.getElementById("number");
const documentInput = document.getElementById("organization_document");
const documentLabel = document.getElementById("document_label");
const official_email = document.getElementById("official_email");
const address = document.getElementById("address");
const website = document.getElementById("website");
const cac_number = document.getElementById("cac_number");
const cacnumber = document.getElementById("cacnumber");
const filePreview = document.getElementById("file_preview");
const submitApplication = document.getElementById("submit_application");
const applicationMessage = document.getElementById("application_message");
const applicationForm = submitApplication.form;
const header = document.getElementById("header");
const description = document.getElementById("text");
const cac_type = document.getElementById("cac_type");
const role = new URLSearchParams(window.location.search).get("role") || "";
// const isInstitution = role.toLowerCase() === "Institution";
const apiUrl = "https://verifydoc-api-v1.onrender.com";
const validOrganizationTypes = ["Employer", "Recruitment Agency", "HR Firm", "Other"];
const validInstitutionTypes = ["Government Institution", "University", "Polytechnic", "Other"];
function showApplicationError(message) {
  applicationMessage.textContent = message;
  applicationMessage.className = "text-sm text-red-600";
  applicationMessage.classList.remove("hidden");
}
function normalizedWebsite(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : "https://" + trimmed;
}

let previewUrl;

if (role === "Institution") {
  header.textContent = "Institution details";
  description.textContent = "Tell us about your institution";
  documentLabel.textContent = "Accreditation document";
  type.textContent = "Institution type";
  name1.textContent = "Institution name";
  cacnumber.style.display = "none";
  const select = document.createElement("select");
  select.id = organizationType.id;
  select.className = organizationType.className;
  select.required = true;
  select.append(new Option("Select institution type", "", true, true));
  for (const value of validInstitutionTypes) select.add(new Option(value, value));
  organizationType.replaceWith(select);
  organizationType = select;
} else {
  header.textContent = "Organization details";
  description.textContent = "Tell us about your organization";
  documentLabel.textContent = "CAC Certificate";
  type.textContent = "Organization type";
  name1.textContent = "Organization name";
  // Organization types must match the backend enum. Use a native select without altering layout.
  const select = document.createElement("select");
  select.id = organizationType.id;
  select.className = organizationType.className;
  select.required = true;
  select.append(new Option("Select organization type", "", true, true));
  for (const value of validOrganizationTypes) select.add(new Option(value, value));
  organizationType.replaceWith(select);
  organizationType = select;
  const phoneLabel = phoneNumber.closest("div.flex")?.querySelector("label");
  if (phoneLabel) phoneLabel.textContent = "Phone number (required)";
}

function checkDetails() {
  submitApplication.disabled =
    organizationName.value.trim() === "" ||
    organizationType.value.trim() === "" ||
    documentInput.files.length === 0 ||
    address.value.trim() === "" ||
    (role === "Organization" && phoneNumber.value.trim() === "") ||
    (role === "Organization" && cac_number.value.trim() === "");
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

  if (selectedFile.type === "application/pdf") {
    filePreview.textContent = selectedFile.name;
  }

  filePreview.classList.remove("hidden");
  checkDetails();
}

[
  organizationName,
  organizationType,
  phoneNumber,
  official_email,
  cac_number,
  address,
  website,
].forEach((input) => {
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
    user = JSON.parse(sessionStorage.getItem("registrationUser") || "null");
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

  //CAC number

  const userData = {
    ...user,
  };

  if (role === "Organization" && !validOrganizationTypes.includes(organizationType.value)) {
    showApplicationError("Select a valid organization type.");
    return;
  }
  if (!official_email.value.trim()) {
    showApplicationError("Enter your organization's official email.");
    return;
  }
  const selectedFile = documentInput.files[0];
  if (!selectedFile || (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf"))) {
    showApplicationError("Please upload a PDF document.");
    return;
  }

  const organization = {
    organizationName: organizationName.value.trim(),
    organizationType: organizationType.value.trim(),
    cacNumber: `${cac_type.value} ${cac_number.value.trim()}`,
    officialEmail: official_email.value.trim(),
    address: address.value.trim(),
    phoneNumber: phoneNumber.value.trim(),
    ...(website.value.trim() ? { website: normalizedWebsite(website.value) } : {}),
  };

  const institution = {
    institutionName: organizationName.value.trim(),
    institutionType: organizationType.value.trim(),
    officialEmail: official_email.value.trim(),
    address: address.value.trim(),
    website: website.value.trim(),
    phoneNumber: phoneNumber.value.trim(),
  };

  formData.append("user", JSON.stringify(userData));
  formData.append(
    role === "Organization" ? "organization" : "institution",
    JSON.stringify(role === "Organization" ? organization : institution),
  );
  formData.append(
    role === "Institution" ? "accreditationDocument" : "cacCertificate",
    documentInput.files[0],
  );

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

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const safeMessage = typeof result.message === "string" && result.message.length < 240
        ? result.message
        : "Registration failed. Please check your details.";
      throw new Error(safeMessage);
    }

    // OTP verification uses the account email, not the institution's official email.
    // Save it only after registration succeeds and before navigating.
    sessionStorage.setItem("verificationEmail", userData.email.trim().toLowerCase());
    sessionStorage.removeItem("registrationUser");
    localStorage.removeItem("user");
    window.location.href = `Registration_complete.html?role=${role}`;
  } catch (error) {
    console.error("Unable to submit application:", error);
    showApplicationError(error instanceof TypeError
      ? "Could not reach the server. Check your connection and try again."
      : error.message || "Unable to submit application. Please try again.");
    submitApplication.disabled = false;
  }
});

window.addEventListener("pagehide", () => {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
  }
});
