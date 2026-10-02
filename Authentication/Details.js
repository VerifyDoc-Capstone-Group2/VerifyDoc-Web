//details
const organization_name = document.getElementById("organization_name");
const organization_type = document.getElementById("organization_type");
const phone_number = document.getElementById("number");
const submitApplication = document.getElementById("submit_application");

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
