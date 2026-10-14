(() => {
  "use strict";
  const API = "https://verifydoc-api-v1.onrender.com";
  const token = localStorage.getItem("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const params = new URLSearchParams(location.search);
  const isDetails = /Application details\.html$/i.test(decodeURIComponent(location.pathname));
  const text = (tag, value, className = "") => {
    const el = document.createElement(tag);
    el.textContent = value == null || value === "" ? "Not provided" : String(value);
    el.className = className;
    return el;
  };
  const api = async (path, options = {}) => {
    if (!token) throw new Error("Admin sign-in required.");
    const res = await fetch(API + path, {
      ...options,
      headers: { Authorization: "Bearer " + token, ...(options.body ? { "Content-Type": "application/json" } : {}) }
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || "Request failed (" + res.status + ")");
    return json.data;
  };
  const fetchQueue = async () => {
    const me = await api("/auth/me");
    if (me?.role !== "Admin" || me?.accountStatus !== "Active") throw new Error("An active Admin account is required.");
    const queue = await api("/admin/approval-queue");
    return [
      ...(queue?.organizations || []).map(item => ({ ...item, kind: "Organization", id: item.organizationId, name: item.organizationName, type: item.organizationType })),
      ...(queue?.institutions || []).map(item => ({ ...item, kind: "Institution", id: item.institutionId, name: item.institutionName, type: item.institutionType }))
    ].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  };
  const listing = async () => {
    const tbody = document.querySelector("table tbody");
    if (!tbody) return;
    tbody.replaceChildren();
    const notice = document.createElement("p");
    notice.className = "mx-4 my-3 text-sm text-slate-600";
    notice.setAttribute("role", "status");
    tbody.closest("table").before(notice);
    notice.textContent = "Loading pending applications…";
    try {
      const items = await fetchQueue();
      const filterButtons = [...document.querySelectorAll("button")].filter(b => /^(All \(|Institution \(|Employer \()/.test(b.textContent.trim()));
      const render = (filter = "All") => {
        tbody.replaceChildren();
        const filtered = items.filter(x => filter === "All" || (filter === "Institution" ? x.kind === "Institution" : x.kind === "Organization"));
        notice.textContent = filtered.length ? "" : "No pending applications.";
        for (const item of filtered) {
          const tr = document.createElement("tr");
          tr.className = "text-slate-500";
          const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—";
          for (const value of [item.name, item.type || item.kind, date]) {
            const td = text("td", value, "border-b border-gray-300 px-4 py-4");
            tr.append(td);
          }
          const status = document.createElement("td");
          status.className = "border-b border-gray-300 px-4 py-4";
          status.append(text("span", item.status || "Pending Approval", "inline-flex items-center rounded-xl border border-amber-600 bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900"));
          tr.append(status);
          const action = document.createElement("td");
          action.className = "border-b border-gray-300 px-4 py-4";
          const link = text("a", "Review", "rounded-md border border-primary px-3 py-1 text-xs font-medium text-primary hover:bg-primary hover:text-white");
          link.href = "Application%20details.html?kind=" + encodeURIComponent(item.kind) + "&id=" + encodeURIComponent(item.id);
          action.append(link);
          tr.append(action);
          tbody.append(tr);
        }
      };
      for (const [i, b] of filterButtons.entries()) {
        const type = i === 0 ? "All" : i === 1 ? "Institution" : "Organization";
        b.textContent = (i === 0 ? "All" : i === 1 ? "Institution" : "Employer") + " (" + items.filter(x => type === "All" || (type === "Institution" ? x.kind === "Institution" : x.kind === "Organization")).length + ")";
        b.addEventListener("click", () => render(type));
      }
      render();
    } catch (err) {
      notice.textContent = "Unable to load onboarding requests: " + err.message;
    }
  };
  const details = async () => {
    const section = document.querySelector('section[aria-labelledby="app-title"]');
    const dl = section?.querySelector("dl");
    const decision = document.querySelector('aside[aria-labelledby="decision-title"]');
    if (!section || !dl) return;
    const alert = document.querySelector('[role="alert"]');
    if (alert) alert.hidden = true; // Do not claim a review flag unless the API supplies one.
    dl.replaceChildren();
    const message = text("p", "Loading application…", "my-3 text-sm text-slate-600");
    section.insertBefore(message, dl);
    const buttons = [...(decision?.querySelectorAll("button") || [])];
    buttons.forEach(b => b.disabled = true);
    const documentLink = section.querySelector('a[aria-label^="Open"]');
    if (documentLink) documentLink.hidden = true;
    try {
      const kind = params.get("kind");
      const id = params.get("id");
      if (!["Organization", "Institution"].includes(kind) || !id) throw new Error("Select an application from Onboarding.");
      const queue = await fetchQueue();
      const item = queue.find(x => x.kind === kind && x.id === id);
      if (!item) throw new Error("Application is no longer pending, or was not found.");
      const fields = [
        ["User type", kind],
        ["Official email", item.officialEmail],
        [kind + " name", item.name],
        [kind + " type", item.type],
        ["Phone number", item.phoneNumber],
        ["Address", item.address],
        ["Website", item.website],
        ...(kind === "Organization" ? [["CAC number", item.cacNumber]] : []),
        ["Status", item.status]
      ];
      for (const [label, value] of fields) {
        const row = document.createElement("div");
        row.className = "flex flex-col gap-0.5 border-b border-neutral-300 px-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-2.5";
        row.append(text("dt", label, "text-sm text-neutral-500 sm:text-body sm:text-neutral-700"), text("dd", value || "Not provided", "break-all font-medium sm:text-right"));
        dl.append(row);
      }
      const doc = kind === "Organization" ? item.cacCertificate?.url : item.accreditationDocument?.url;
      if (documentLink && doc && /^https:\/\//i.test(doc)) {
        documentLink.hidden = false;
        documentLink.href = doc;
        documentLink.target = "_blank";
        documentLink.rel = "noopener noreferrer";
        const label = documentLink.querySelector("div");
        if (label) label.textContent = kind === "Organization" ? "View CAC certificate" : "View accreditation document";
      }
      message.textContent = "";
      const decide = async (action) => {
        if (action === "reject" && !confirm("Reject this application?")) return;
        let body;
        if (action === "reject") {
          const reason = prompt("Enter the reason for rejection:");
          if (!reason?.trim()) return;
          body = JSON.stringify({ rejectionReason: reason.trim() });
        } else if (!confirm("Approve this application?")) return;
        buttons.forEach(b => b.disabled = true);
        message.textContent = "Submitting decision…";
        try {
          const path = kind === "Organization" ? "organizations" : "institutions";
          await api("/admin/" + path + "/" + encodeURIComponent(id) + "/" + (action === "reject" ? "reject" : "approve"), { method: "PATCH", ...(body ? { body } : {}) });
          location.assign("Onboarding.html");
        } catch (err) {
          message.textContent = "Decision failed: " + err.message;
          buttons.slice(0,2).forEach(b => b.disabled = false);
        }
      };
      if (buttons[0]) { buttons[0].disabled = false; buttons[0].addEventListener("click", () => decide("approve")); }
      if (buttons[1]) { buttons[1].disabled = false; buttons[1].addEventListener("click", () => decide("reject")); }
      // The backend has no manual-verification request action.
      if (buttons[2]) { buttons[2].disabled = true; buttons[2].title = "Not supported by the current API"; }
    } catch (err) {
      message.textContent = "Unable to load application: " + err.message;
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => isDetails ? details() : listing());
  else (isDetails ? details() : listing());
})();
