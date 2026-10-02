//details
const organization_name = document.getElementById("organization_name");
const organization_type = document.getElementById("organization_type");
const phone_number = document.getElementById("number");
const submitApplication = document.getElementById("submit_application");
const header = document.getElementById("header");
const text = document.getElementById("text");

//Details
function checkDetails() {
  const submitDetails =
    organization_name.value.trim() !== "" &&
    organization_type.value.trim() !== "" &&
    phone_number.value.trim() !== "";

  submitApplication.disabled = !submitDetails;
}

//Details
organization_name.addEventListener("change", checkDetails);
organization_type.addEventListener("change", checkDetails);
phone_number.addEventListener("change", checkDetails);

checkDetails();

submitApplication.addEventListener("click", (e) => {
  e.preventDefault();
  window.location.href = "Application_submitted.html";
});
const role = new URLSearchParams(window.location.search).get("role");
if (role === "institution") {
  header.textContent = "Institution details";
  text.textContent = "Tell us about your institution";
} else {
  header.textContent = "Organization details";
  text.textContent = "Tell us about your organization";
}
