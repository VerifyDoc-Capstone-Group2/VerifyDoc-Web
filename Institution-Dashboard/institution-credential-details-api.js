(() => {
  "use strict";
  const API = "https://verifydoc-api-v1.onrender.com";
  const main = document.querySelector("main");
  const id = new URLSearchParams(location.search).get("credentialId");
  const dl = main?.querySelector("dl");
  const sections = [...(main?.querySelectorAll("section,aside") || [])];
  const heading = main?.querySelector("section h2");
  const fields = new Map([...dl?.querySelectorAll("div") || []].map(row => [
    row.querySelector("dt")?.textContent.trim(),
    row.querySelector("dd")
  ]));
  const set = (label, value) => {
    const target = fields.get(label);
    if (target) target.textContent = value || "Unavailable";
  };
  const date = value => value && Number.isFinite(new Date(value).getTime()) ? new Date(value).toLocaleDateString("en-GB") : "Unavailable";
  const hidePrototypes = () => {
    // Static QR and verification history must never be mistaken for live verification evidence.
    const qrTitle = [...main.querySelectorAll("h2")].find(h => h.textContent.trim() === "QR Code");
    if (qrTitle) {
      qrTitle.hidden = true;
      if (qrTitle.nextElementSibling) qrTitle.nextElementSibling.hidden = true;
    }
    const history = [...main.querySelectorAll("h2")].find(h => h.textContent.trim() === "Verification history");
    if (history) {
      history.hidden = true;
      let next = history.nextElementSibling;
      while (next && next.tagName !== "H2") {
        const current = next;
        next = next.nextElementSibling;
        current.hidden = true;
      }
    }
    const aside = main.querySelector("aside");
    for (const button of aside?.querySelectorAll("button") || []) button.hidden = true;
    for (const link of aside?.querySelectorAll('a[href="#"]') || []) link.hidden = true;
  };
  async function load() {
    if (!dl) return;
    hidePrototypes();
    if (heading) heading.textContent = "Loading credential…";
    for (const label of fields.keys()) set(label, "Loading…");
    const metadata = main.querySelector("aside");
    for (const p of metadata?.querySelectorAll("p") || []) p.textContent = "Unavailable";
    try {
      if (!/^VDOC-CRED-[0-9]{8}$/.test(id || "")) throw new Error("Open a credential using Review from the credentials list.");
      const token = (localStorage.getItem("authorization") || "").replace(/^Bearer\s+/i, "").trim();
      if (!token) throw new Error("Please sign in with an institution account.");
      const response = await fetch(API + "/credentials/" + encodeURIComponent(id), {
        headers: { Authorization: "Bearer " + token, Accept: "application/json" }, cache: "no-store"
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || "Unable to retrieve credential.");
      const c = result.data;
      if (!c) throw new Error("Credential details unavailable.");
      if (heading) heading.textContent = c.title || "Credential details";
      set("Credential number", c.credentialId);
      set("Credential holder", "Unavailable");
      set("Email", "Not included in credential response");
      set("Institution", c.issuerName);
      set("Credential type", c.credentialType);
      set("Program name", c.fieldOfStudy || c.title);
      set("Issue date", date(c.issueDate));
      set("Expiry date", "Not supported");
      set("Additional information", c.graduationYear ? "Graduation year: " + c.graduationYear : "Unavailable");
      set("Status", c.status === "Revoked" ? "Revoked" : c.verificationStatus);
      const meta = metadata?.querySelectorAll("p");
      if (meta?.[1]) meta[1].textContent = c.issuerName || "Unavailable";
      if (meta?.[3]) meta[3].textContent = date(c.createdAt);
    } catch (error) {
      if (heading) heading.textContent = error.message;
      for (const label of fields.keys()) set(label, "Unavailable");
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();
})();
