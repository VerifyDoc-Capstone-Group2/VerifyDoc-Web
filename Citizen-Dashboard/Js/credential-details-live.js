(() => {
  "use strict";
  const API = "https://verifydoc-api-v1.onrender.com";
  const params = new URLSearchParams(location.search);
  const id = params.get("credentialId") || params.get("id");
  const token = (localStorage.getItem("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const byId = id => document.getElementById(id);
  const put = (id, value) => { if (byId(id)) byId(id).textContent = value == null || value === "" ? "Not available" : String(value); };
  const date = v => v && !Number.isNaN(new Date(v).getTime()) ? new Date(v).toLocaleDateString() : "Not available";
  const history = document.querySelector('[aria-labelledby="share-history-heading"]');
  const link = byId("shareCredential");
  const badge = byId("detailStatus");
  const qr = byId("qrCode")?.closest("section");
  if (qr) qr.classList.add("hidden"); // Never generate a QR from unverified query parameters.
  if (link) link.classList.add("hidden");
  async function request(path) {
    const res = await fetch(API + path, { headers: { Authorization: "Bearer " + token, Accept: "application/json" }, cache: "no-store" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.message || "Request failed (" + res.status + ")");
    return body.data;
  }
  async function load() {
    for (const field of ["detailHolder", "detailHolderValue", "detailId", "detailEmail", "detailInstitution", "detailType", "detailProgram", "detailIssue", "detailExpiry", "detailAdditional"]) put(field, "Loading…");
    if (history) [...history.children].filter(el => el !== history.querySelector("h2") && el !== link).forEach(el => el.remove());
    try {
      if (!token) throw new Error("Please sign in.");
      if (!/^VDOC-CRED-\d{8}$/.test(id || "")) throw new Error("Invalid credential ID. Open a credential from your wallet.");
      const [credential, me] = await Promise.all([request("/credentials/" + encodeURIComponent(id)), request("/auth/me")]);
      const holder = [me.firstName, me.lastName].filter(Boolean).join(" ") || "Not available";
      put("detailHolder", holder);
      put("detailHolderValue", holder);
      put("detailId", credential.credentialId);
      put("detailEmail", me.email);
      put("detailInstitution", credential.issuerName);
      put("detailType", credential.credentialType);
      put("detailProgram", credential.title);
      put("detailIssue", date(credential.issueDate));
      put("detailExpiry", "Not available");
      put("detailAdditional", credential.fieldOfStudy || "Not available");
      const status = credential.status === "Revoked" ? "Revoked" : credential.verificationStatus || "Pending";
      badge.textContent = status;
      badge.className = "inline-flex rounded-full px-2 py-1 text-[10px] font-semibold " +
        (status === "Verified" ? "bg-emerald-100 text-emerald-700" : status === "Pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700");
      put("detail-card-title", credential.source === "Citizen" ? "Uploaded credential details" : "Academic credential details");
      // Show the real document only when a backend URL is available.
      const docUrl = credential.document?.url;
      if (typeof docUrl === "string" && /^https:\/\//.test(docUrl)) {
        const section = byId("documentSection");
        section?.classList.remove("hidden");
        const anchor = document.createElement("a");
        anchor.href = docUrl;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.className = "mt-2 inline-flex text-xs font-medium text-blue-700 underline";
        anchor.textContent = "Open credential document";
        section?.append(anchor);
      }
      if (link && status === "Verified") {
        link.href = "./Share-Credential.html?credentialId=" + encodeURIComponent(id);
        link.classList.remove("hidden");
      } else if (link) {
        link.insertAdjacentElement("beforebegin", Object.assign(document.createElement("p"), {
          className: "mt-4 text-xs text-amber-700",
          textContent: "Only active, verified credentials can be shared."
        }));
      }
      const shares = [];
      let page = 1, total = 1;
      do {
        const data = await request("/credential-shares/mine?page=" + page + "&limit=50");
        shares.push(...data.shares.filter(share => share.credential?.credentialId === id));
        total = data.pagination?.totalPages || 1;
        page++;
      } while (page <= total);
      if (history) {
        const heading = history.querySelector("h2");
        const message = document.createElement("div");
        message.className = "mt-2 text-xs text-slate-600";
        if (!shares.length) message.textContent = "No sharing history for this credential.";
        for (const share of shares) {
          const entry = document.createElement("div");
          entry.className = "border-b border-slate-200 py-2";
          const title = document.createElement("p");
          title.className = "font-semibold";
          title.textContent = share.organization?.name || "Organization unavailable";
          const info = document.createElement("p");
          info.className = "mt-1 text-slate-500";
          info.textContent = date(share.createdAt) + " · " + share.purpose + " · " + share.status + " · Access until " + date(share.expiresAt);
          entry.append(title, info);
          message.append(entry);
        }
        heading?.after(message);
      }
    } catch (error) {
      put("detailHolder", error.message);
      if (history) history.append(Object.assign(document.createElement("p"), { className: "mt-2 text-xs text-red-700", textContent: "Unable to load sharing history." }));
    }
  }
  const mobile = byId("mobileMenu"), backdrop = byId("mobileMenuBackdrop"), open = byId("openBtn"), close = byId("closeBtn");
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