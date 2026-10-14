(() => {
  "use strict";
  const API = "https://verifydoc-api-v1.onrender.com";
  const params = new URLSearchParams(location.search);
  const id = params.get("credentialId") || params.get("id");
  const token = (localStorage.getItem("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const get = id => document.getElementById(id);
  const feedback = get("shareFeedback");
  const button = get("shareButton");
  const choices = get("employerChoices");
  const search = get("employerSearch");
  const form = get("shareForm");
  let organizations = [];
  let credential = null;
  let shareResults = [];
  const checked = name => [...document.querySelectorAll('input[name="' + name + '"]:checked')].map(x => x.value);
  const error = message => { feedback.textContent = message; feedback.className = "mt-3 min-h-4 text-xs text-red-700"; };
  const request = async (path, options = {}) => {
    const response = await fetch(API + path, { ...options, headers: { Authorization: "Bearer " + token, Accept: "application/json", ...(options.headers || {}) }, cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || "Request failed (" + response.status + ")");
    return body.data;
  };
  const update = () => {
    const selected = checked("employer");
    get("summaryEmployers").textContent = selected.length ? selected.map(id => organizations.find(o => String(o._id) === id)?.organizationName || "Organization").join(", ") : "Select at least one employer";
    get("summaryPurpose").textContent = checked("purpose")[0] || "Select a sharing purpose";
    get("summaryDuration").textContent = checked("duration")[0] || "Select an access duration";
    button.disabled = !credential || credential.verificationStatus !== "Verified" || credential.status !== "Active" || !selected.length || !checked("purpose").length || !checked("duration").length;
  };
  const renderOrganizations = () => {
    const query = search.value.trim().toLowerCase();
    choices.replaceChildren();
    const filtered = organizations.filter(o => o.organizationName.toLowerCase().includes(query));
    get("employerEmpty").classList.toggle("hidden", filtered.length > 0);
    if (!filtered.length) get("employerEmpty").textContent = organizations.length ? "No registered organizations match your search." : "No approved organizations available.";
    for (const org of filtered) {
      const label = document.createElement("label");
      label.className = "cursor-pointer";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = "employer";
      input.value = String(org._id);
      input.className = "choice-input sr-only";
      const selected = checked("employer");
      input.checked = selected.includes(String(org._id));
      const card = document.createElement("span");
      card.className = "choice-card block min-h-12 rounded-md border border-slate-200 p-2 transition hover:border-blue-300";
      const name = document.createElement("span");
      name.className = "block text-[11px] font-medium";
      name.textContent = org.organizationName;
      const type = document.createElement("span");
      type.className = "mt-0.5 block text-[9px] text-slate-500";
      type.textContent = org.organizationType || "Organization";
      card.append(name, type);
      label.append(input, card);
      choices.append(label);
    }
  };
  async function load() {
    choices.replaceChildren();
    get("employerEmpty").classList.remove("hidden");
    get("employerEmpty").textContent = "Loading approved organizations…";
    button.disabled = true;
    get("summaryCredential").textContent = "Loading credential…";
    if (id) {
      get("backToDetails").href = "./Credential-Details.html?credentialId=" + encodeURIComponent(id);
      get("cancelButton").href = get("backToDetails").href;
    }
    try {
      if (!token) throw new Error("Please sign in to share credentials.");
      if (!/^VDOC-CRED-\d{8}$/.test(id || "")) throw new Error("Select a credential from your wallet before sharing.");
      credential = await request("/credentials/" + encodeURIComponent(id));
      get("summaryCredential").textContent = credential.title || credential.credentialType || id;
      if (credential.status !== "Active" || credential.verificationStatus !== "Verified") throw new Error("Only active, verified credentials can be shared. This credential is " + (credential.verificationStatus || credential.status) + ".");
      let page = 1, totalPages = 1;
      do {
        const data = await request("/credential-shares/eligible-organizations?page=" + page + "&limit=50");
        if (!Array.isArray(data.organizations)) throw new Error("Unexpected organization response.");
        organizations.push(...data.organizations);
        totalPages = data.pagination?.totalPages || 1;
        page++;
      } while (page <= totalPages);
      renderOrganizations();
      update();
    } catch (err) {
      error(err.message);
      get("employerEmpty").textContent = "Unable to load eligible organizations.";
      button.disabled = true;
    }
  }
  form.addEventListener("change", update);
  search.addEventListener("input", renderOrganizations);
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (button.disabled) return;
    const selected = checked("employer");
    const purpose = checked("purpose")[0];
    const duration = Number.parseInt(checked("duration")[0], 10);
    if (!Number.isInteger(duration) || duration < 1 || duration > 365) return error("Select a valid duration.");
    button.disabled = true;
    button.textContent = "Sharing…";
    shareResults = [];
    const failures = [];
    try {
      // One share per organization. A partial success is never reported as total success.
      for (const organizationId of selected) {
        try {
          const expiresAt = new Date(Date.now() + duration * 86400000).toISOString();
          const result = await request("/credential-shares", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credentialId: id, organizationId, purpose, expiresAt })
          });
          shareResults.push(result);
        } catch (err) {
          failures.push((organizations.find(o => String(o._id) === organizationId)?.organizationName || "Organization") + ": " + err.message);
        }
      }
      if (failures.length) {
        error((shareResults.length ? shareResults.length + " share(s) created. " : "") + "Unable to share with: " + failures.join("; "));
        if (!shareResults.length) return;
      }
      get("sharedNotification").textContent = "Successfully shared with " + shareResults.length + " organization(s)." + (failures.length ? " Some requests failed; see the message below." : "");
      get("shareNotifications").classList.remove("hidden");
      get("decisionPanel").classList.add("hidden");
      get("successPanel").classList.remove("hidden");
      get("success-heading").focus();
      // A locally generated QR of the credential details URL is not a secure share token.
      get("downloadQr").disabled = true;
      get("downloadQr").title = "Share-specific QR codes are not yet provided by the backend.";
      get("qrNotification").textContent = "QR sharing link is not available for this share.";
      get("idNotification").textContent = "Credential ID: " + id;
      if (window.lucide) window.lucide.createIcons();
    } finally {
      button.textContent = "Share";
      update();
    }
  });
  get("copyCredentialId").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(id || "");
      get("successActionFeedback").textContent = "Credential ID copied.";
    } catch {
      get("successActionFeedback").textContent = "Copy manually: " + (id || "Not available");
    }
  });
  const mobile = get("mobileMenu"), backdrop = get("mobileMenuBackdrop"), open = get("openBtn"), close = get("closeBtn");
  const toggle = visible => {
    mobile?.classList.toggle("hidden", !visible);
    mobile?.classList.toggle("flex", visible);
    backdrop?.classList.toggle("hidden", !visible);
    open?.setAttribute("aria-expanded", String(visible));
  };
  open?.addEventListener("click", () => toggle(true));
  close?.addEventListener("click", () => toggle(false));
  backdrop?.addEventListener("click", () => toggle(false));
  document.addEventListener("keydown", e => { if (e.key === "Escape") toggle(false); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();
})();