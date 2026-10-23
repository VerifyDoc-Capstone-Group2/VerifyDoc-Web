(() => {
  "use strict";
  const API = "https://verifydoc-api-v1.onrender.com";
  const credentialId = new URLSearchParams(location.search).get("credentialId");
  const token = () => (localStorage.getItem("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const main = document.querySelector("main");
  const details = main?.querySelector("dl");
  const holderHeading = main?.querySelector("section h2");
  const aside = main?.querySelector("aside");
  const heading = aside?.querySelector("h2");
  const description = aside?.querySelector("p");
  const action = aside?.querySelector("button");
  let credential;
  function message(text, error = false) {
    if (description) {
      description.textContent = text;
      description.classList.toggle("text-red-700", error);
    }
  }
  function field(label, value) {
    for (const entry of details?.querySelectorAll("div") || []) {
      if (entry.querySelector("dt")?.textContent.trim() !== label) continue;
      const target = entry.querySelector("dd");
      if (target) target.textContent = value == null || value === "" ? "Not available" : String(value);
      break;
    }
  }
  const date = value => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleDateString("en-GB") : "Not available";
  function render(item) {
    credential = item;
    if (holderHeading) holderHeading.textContent = item.title || "Credential";
    field("Credential number", item.credentialId);
    field("Credential holder", "Not available");
    field("Email", "Not available");
    field("Institution", item.issuerName);
    field("Credential type", item.credentialType);
    field("Program name", item.fieldOfStudy || item.title);
    field("Issue date", date(item.issueDate));
    field("Expiry date", "Not available");
    field("Status", item.status === "Revoked" ? "Revoked" : item.verificationStatus);
    field("Additional information", item.rejectionReason || "Not available");
    const reviewable = item.source === "Citizen" && item.status === "Active" && item.verificationStatus === "Pending";
    if (heading) {
      heading.textContent = reviewable ? "Credential awaiting verification" : "Credential " + (item.verificationStatus || "details");
      heading.classList.remove("text-green-600");
      heading.classList.add("text-slate-900");
    }
    if (action) {
      action.disabled = !reviewable;
      action.textContent = reviewable ? "Verify credential" : "Already reviewed";
      action.classList.toggle("opacity-50", !reviewable);
    }
    const reject = document.getElementById("rejectCredential");
    if (reject) reject.disabled = !reviewable;
    message(reviewable ? "Review the uploaded credential document before approving or rejecting it." : "This credential is not awaiting review.");
    const documentUrl = item.document?.url;
    const link = document.getElementById("credentialDocumentLink");
    if (link) {
      if (typeof documentUrl === "string" && /^https:\/\//i.test(documentUrl)) {
        link.href = documentUrl;
        link.classList.remove("hidden");
      } else {
        link.removeAttribute("href");
        link.classList.add("hidden");
      }
    }
  }
  async function request(path, options = {}) {
    const response = await fetch(API + path, {
      ...options,
      headers: { Authorization: "Bearer " + token(), Accept: "application/json", ...(options.body ? { "Content-Type": "application/json" } : {}) },
      cache: "no-store"
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || "Request failed (" + response.status + ").");
    return body.data;
  }
  async function decide(kind) {
    if (!credential || credential.source !== "Citizen" || credential.verificationStatus !== "Pending" || credential.status !== "Active") return;
    let reason;
    if (kind === "reject") {
      reason = window.prompt("Enter a reason for rejecting this credential:");
      if (reason === null) return;
      reason = reason.trim();
      if (!reason) return message("A rejection reason is required.", true);
    } else if (!window.confirm("Confirm that you reviewed the document and want to verify this credential?")) return;
    const rejectButton = document.getElementById("rejectCredential");
    if (action) action.disabled = true;
    if (rejectButton) rejectButton.disabled = true;
    message("Submitting your decision…");
    try {
      await request("/credentials/" + encodeURIComponent(credentialId) + "/" + (kind === "reject" ? "reject" : "verify"), {
        method: "PATCH",
        ...(kind === "reject" ? { body: JSON.stringify({ rejectionReason: reason }) } : {})
      });
      const fresh = await request("/credentials/" + encodeURIComponent(credentialId));
      render(fresh);
      message("Credential " + (kind === "reject" ? "rejected" : "verified") + " successfully.");
    } catch (error) {
      message(error.message, true);
      if (action) action.disabled = false;
      if (rejectButton) rejectButton.disabled = false;
    }
  }
  async function init() {
    // Remove the mock QR image; it is not a signed credential QR code.
    const qr = main?.querySelector('svg[aria-label="Credential QR code"]');
    qr?.closest("div")?.remove();
    const qrHeading = [...(main?.querySelectorAll("h2") || [])].find(h => h.textContent.trim() === "QR Code");
    qrHeading?.remove();
    const link = document.createElement("a");
    link.id = "credentialDocumentLink";
    link.className = "mt-5 inline-flex rounded-lg border border-blue-700 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 hidden";
    link.textContent = "View uploaded document";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    details?.after(link);
    const reject = document.createElement("button");
    reject.id = "rejectCredential";
    reject.type = "button";
    reject.className = "mt-3 h-[46px] w-full rounded-lg border border-red-600 text-red-700 hover:bg-red-50";
    reject.textContent = "Reject credential";
    action?.after(reject);
    action?.addEventListener("click", () => decide("verify"));
    reject.addEventListener("click", () => decide("reject"));
    if (action) action.disabled = true;
    reject.disabled = true;
    if (holderHeading) holderHeading.textContent = "Loading credential…";
    for (const label of ["Credential number", "Credential holder", "Email", "Institution", "Credential type", "Program name", "Issue date", "Expiry date", "Status", "Additional information"]) field(label, "Loading…");
    if (heading) heading.textContent = "Verification review";
    message("Loading credential…");
    try {
      if (!/^VDOC-CRED-\d{8}$/.test(credentialId || "")) throw new Error("Open a credential from the Verification list.");
      if (!token()) throw new Error("Sign in as an institution member.");
      render(await request("/credentials/" + encodeURIComponent(credentialId)));
    } catch (error) {
      if (holderHeading) holderHeading.textContent = "Credential unavailable";
      message(error.message, true);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
