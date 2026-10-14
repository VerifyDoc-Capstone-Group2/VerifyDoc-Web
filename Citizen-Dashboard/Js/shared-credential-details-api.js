(() => {
  "use strict";
  const API = "https://verifydoc-api-v1.onrender.com";
  const shareId = new URLSearchParams(location.search).get("shareId");
  const token = (localStorage.getItem("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const byId = id => document.getElementById(id);
  const set = (id, value) => { if (byId(id)) byId(id).textContent = value ?? "Not available"; };
  const date = value => value && Number.isFinite(new Date(value).getTime()) ? new Date(value).toLocaleDateString() : "Not available";
  const button = byId("cancelSharing");
  const message = byId("cancelMessage");
  const statusBadge = byId("shareStatus");
  let current = null;
  // The prototype's old cancel listener only changes the UI. Intercept it before it fires.
  button?.addEventListener("click", async event => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!current || current.status !== "Active" || !window.confirm("Cancel this credential share? The organization will lose access.")) return;
    button.disabled = true;
    button.textContent = "Cancelling…";
    try {
      const response = await fetch(API + "/credential-shares/" + encodeURIComponent(shareId) + "/revoke", {
        method: "PATCH", headers: { Authorization: "Bearer " + token, Accept: "application/json" }
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Unable to cancel sharing.");
      current.status = "Revoked";
      setStatus("Revoked");
      message.textContent = "Sharing cancelled. This organization can no longer access this credential.";
      message.className = "mt-4 rounded-md bg-emerald-50 p-3 text-xs font-medium text-emerald-800";
      button.textContent = "Sharing cancelled";
    } catch (error) {
      message.textContent = error.message;
      message.className = "mt-4 rounded-md bg-red-50 p-3 text-xs font-medium text-red-700";
      button.disabled = false;
      button.textContent = "Cancel sharing";
    }
  }, true);
  function setStatus(status) {
    statusBadge.textContent = status;
    statusBadge.className = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold " +
      (status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700");
    button.disabled = status !== "Active";
    button.textContent = status === "Active" ? "Cancel sharing" : "Sharing " + status.toLowerCase();
  }
  async function load() {
    // Remove prototype values and its unsigned QR. A QR must never imply an unverified URL grants access.
    for (const id of ["holderHeading", "credentialId", "institution", "programName", "employer", "sharedDate", "shareDuration", "sharePurpose"]) set(id, "Loading…");
    byId("qrCode")?.replaceChildren();
    const qrSection = byId("qrCode")?.closest("section");
    if (qrSection) qrSection.classList.add("hidden");
    const definitions = document.querySelectorAll('section[aria-labelledby="credential-heading"] dl > div');
    for (const entry of definitions) {
      const key = entry.querySelector("dt")?.textContent.trim();
      if (["Credential holder", "Email", "Credential type", "Issue date", "Expiry date", "Additional information", "Status"].includes(key)) {
        const dd = entry.querySelector("dd");
        if (dd) dd.textContent = "Not available";
      }
    }
    button.disabled = true;
    try {
      if (!shareId || !/^[a-f\d]{24}$/i.test(shareId)) throw new Error("Invalid share ID. Open this page using Review from Shared credentials.");
      if (!token) throw new Error("Please sign in to review your shares.");
      let page = 1, totalPages = 1, share = null;
      do {
        const response = await fetch(API + "/credential-shares/mine?page=" + page + "&limit=50", { headers: { Authorization: "Bearer " + token, Accept: "application/json" }, cache: "no-store" });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || "Unable to load share.");
        if (!Array.isArray(result.data?.shares)) throw new Error("Invalid sharing response.");
        share = result.data.shares.find(item => item.shareId === shareId) || null;
        totalPages = result.data.pagination?.totalPages || 1;
        page++;
      } while (!share && page <= totalPages);
      if (!share) throw new Error("Share not found in your account.");
      current = share;
      set("holderHeading", share.credential?.title);
      set("credentialId", share.credential?.credentialId);
      set("institution", share.credential?.issuerName);
      set("programName", share.credential?.title);
      set("employer", share.organization?.name);
      set("sharedDate", date(share.createdAt));
      set("shareDuration", date(share.expiresAt) + " (access expiry)");
      set("sharePurpose", share.purpose);
      for (const entry of definitions) {
        const key = entry.querySelector("dt")?.textContent.trim();
        const dd = entry.querySelector("dd");
        if (!dd) continue;
        if (key === "Credential type") dd.textContent = share.credential?.credentialType || "Not available";
        if (key === "Issue date") dd.textContent = date(share.credential?.issueDate);
        if (key === "Status") dd.textContent = share.credential?.verificationStatus || "Not available";
      }
      setStatus(share.status);
    } catch (error) {
      set("holderHeading", error.message);
      setStatus("Unavailable");
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();
})();
