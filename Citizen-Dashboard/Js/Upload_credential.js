(() => {
  "use strict";
  const API = "https://verifydoc-api-v1.onrender.com";
  const get = id => document.getElementById(id);
  const form = get("credentialForm");
  const fileInput = get("credentialFile");
  const fileName = get("fileName");
  const fileError = get("fileError");
  const message = get("uploadApiMessage");
  const submit = get("nextButton");
  const token = () => (localStorage.getItem("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  let currentProfile = null;
  let previewUrl = null;
  const institutionInput = get("institutionName");
  const institutionResults = get("institutionResults");
  const institutionHelp = get("institutionHelp");
  let selectedInstitution = null;
  let searchTimer = null;
  let searchRequest = null;

  const hideInstitutions = () => {
    institutionResults.classList.add("hidden");
    institutionResults.replaceChildren();
  };
  institutionInput.addEventListener("input", () => {
    selectedInstitution = null;
    clearTimeout(searchTimer);
    searchRequest?.abort();
    hideInstitutions();
    institutionHelp.textContent = "If your institution is not listed, its name will be saved as an unregistered issuer.";
    const query = institutionInput.value.trim();
    if (query.length < 2) return;
    searchTimer = setTimeout(async () => {
      const controller = new AbortController();
      searchRequest = controller;
      try {
        const response = await fetch(API + "/institutions/search?q=" + encodeURIComponent(query), {
          headers: { Accept: "application/json" }, signal: controller.signal
        });
        if (!response.ok) throw new Error("Institution search is unavailable");
        const result = await response.json();
        if (controller.signal.aborted || institutionInput.value.trim() !== query) return;
        hideInstitutions();
        const institutions = Array.isArray(result.data) ? result.data : [];
        for (const institution of institutions) {
          const option = document.createElement("button");
          option.type = "button";
          option.setAttribute("role", "option");
          option.className = "block w-full px-3 py-2 text-left text-xs hover:bg-blue-50 focus:bg-blue-50";
          option.textContent = institution.institutionName + (institution.institutionType ? " — " + institution.institutionType : "");
          option.addEventListener("click", () => {
            selectedInstitution = { id: institution._id, name: institution.institutionName };
            institutionInput.value = institution.institutionName;
            institutionHelp.textContent = "Registered institution selected. Your upload will remain Pending until reviewed.";
            hideInstitutions();
          });
          institutionResults.appendChild(option);
        }
        if (institutions.length) institutionResults.classList.remove("hidden");
      } catch (e) {
        if (e.name !== "AbortError") institutionHelp.textContent =
          "Unable to search registered institutions right now. You can enter the issuer name manually.";
      }
    }, 300);
  });
  document.addEventListener("click", e => {
    if (e.target !== institutionInput && !institutionResults.contains(e.target)) hideInstitutions();
  });

  const menu = get("mobileMenu"), backdrop = get("mobileMenuBackdrop");
  const open = get("openBtn"), close = get("closeBtn");
  function toggleMenu(show) {
    menu?.classList.toggle("hidden", !show);
    menu?.classList.toggle("flex", show);
    backdrop?.classList.toggle("hidden", !show);
    open?.setAttribute("aria-expanded", String(show));
  }
  open?.addEventListener("click", () => toggleMenu(true));
  close?.addEventListener("click", () => toggleMenu(false));
  backdrop?.addEventListener("click", () => toggleMenu(false));
  menu?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => toggleMenu(false)));
  document.addEventListener("keydown", e => { if (e.key === "Escape") toggleMenu(false); });

  const error = text => {
    message.textContent = text;
    message.classList.remove("hidden");
  };
  async function loadProfile() {
    try {
      if (!token()) throw new Error("Sign in to upload credentials.");
      const response = await fetch(API + "/auth/me", {
        headers: { Authorization: "Bearer " + token(), Accept: "application/json" },
        cache: "no-store"
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Unable to load your account.");
      if (result.data?.role !== "Citizen") throw new Error("Only citizens can upload credentials here.");
      currentProfile = result.data;
      get("firstName").value = currentProfile.firstName || "";
      get("lastName").value = currentProfile.lastName || "";
      get("recipientEmail").value = currentProfile.email || "";
    } catch (e) {
      error(e.message);
      submit.disabled = true;
    }
  }
  loadProfile();

  function validateFile(file) {
    return !!file && (file.type === "application/pdf" || (file.type === "" && /\.pdf$/i.test(file.name))) && file.size <= 5 * 1024 * 1024 && file.size > 0;
  }
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    fileName.textContent = file?.name || "";
    fileName.classList.toggle("hidden", !file);
    fileError.classList.toggle("hidden", !file || validateFile(file));
  });
  const drop = fileInput.closest("label");
  drop?.addEventListener("dragover", e => { e.preventDefault(); drop.classList.add("bg-blue-100"); });
  drop?.addEventListener("dragleave", () => drop.classList.remove("bg-blue-100"));
  drop?.addEventListener("drop", e => {
    e.preventDefault();
    drop.classList.remove("bg-blue-100");
    const file = e.dataTransfer?.files?.[0];
    if (!validateFile(file)) { fileError.classList.remove("hidden"); return; }
    const transfer = new DataTransfer();
    transfer.items.add(file);
    fileInput.files = transfer.files;
    fileInput.dispatchEvent(new Event("change"));
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    message.classList.add("hidden");
    if (!form.reportValidity()) return;
    const file = fileInput.files?.[0];
    if (!validateFile(file)) { fileError.classList.remove("hidden"); error("Choose a PDF document of no more than 5 MB."); return; }
    if (!currentProfile || !token()) { error("Your session is unavailable. Please sign in again."); return; }
    const year = get("graduationYear").value.trim();
    const issueDate = get("issueDate").value;
    if (issueDate > new Date().toISOString().slice(0, 10)) { error("Issue date cannot be in the future."); return; }
    if (year && (Number(year) < 1900 || Number(year) > new Date().getFullYear())) { error("Enter a valid graduation year."); return; }
    const data = new FormData();
    if (selectedInstitution && institutionInput.value.trim() === selectedInstitution.name) {
      data.append("institution", selectedInstitution.id);
    } else {
      data.append("issuerName", institutionInput.value.trim());
    }
    data.append("title", get("programName").value.trim());
    data.append("credentialType", get("credentialType").value.trim());
    data.append("issueDate", issueDate);
    if (get("fieldOfStudy").value.trim()) data.append("fieldOfStudy", get("fieldOfStudy").value.trim());
    if (year) data.append("graduationYear", year);
    data.append("document", file);
    submit.disabled = true;
    submit.textContent = "Uploading…";
    try {
      const response = await fetch(API + "/credentials", {
        method: "POST", headers: { Authorization: "Bearer " + token() }, body: data
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Upload failed (" + response.status + ").");
      const credential = result.data;
      if (!credential?.credentialId) throw new Error("Server did not return a credential ID. Check your wallet before retrying.");
      const value = id => get(id).value.trim();
      get("uploadedHolder").textContent = [currentProfile.firstName, currentProfile.lastName].filter(Boolean).join(" ");
      get("uploadedCredentialId").textContent = credential.credentialId;
      get("uploadedInstitution").textContent = credential.issuerName || value("institutionName");
      get("uploadedType").textContent = credential.credentialType || value("credentialType");
      get("uploadedProgram").textContent = credential.title || value("programName");
      get("uploadedIssueDate").textContent = new Date(credential.issueDate || issueDate).toLocaleDateString("en-GB");
      get("uploadedExpiryDate").textContent = "Not available";
      get("uploadedStatus").textContent = credential.verificationStatus || "Pending";
      const preview = get("documentPreview"), placeholder = get("documentPlaceholder");
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = null;
      preview.classList.add("hidden");
      placeholder.textContent = file.name;
      placeholder.classList.remove("hidden");
      get("uploadFormScreen").classList.add("hidden");
      get("uploadedScreen").classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      error(e.message || "Unable to upload credential.");
    } finally {
      submit.disabled = false;
      submit.textContent = "Next";
    }
  });
  get("uploadAnotherButton")?.addEventListener("click", () => {
    form.reset();
    selectedInstitution = null;
    clearTimeout(searchTimer);
    searchRequest?.abort();
    hideInstitutions();
    institutionHelp.textContent = "Select a registered institution from the results, or enter its name manually if it is not listed.";
    if (currentProfile) {
      get("firstName").value = currentProfile.firstName || "";
      get("lastName").value = currentProfile.lastName || "";
      get("recipientEmail").value = currentProfile.email || "";
    }
    fileName.textContent = "";
    fileName.classList.add("hidden");
    fileError.classList.add("hidden");
    message.classList.add("hidden");
    get("uploadedScreen").classList.add("hidden");
    get("uploadFormScreen").classList.remove("hidden");
  });
  if (window.lucide?.createIcons) window.lucide.createIcons();
})();
