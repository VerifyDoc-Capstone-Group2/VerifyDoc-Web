(() => {
  "use strict";
  const API = "https://verifydoc-api-v1.onrender.com";
  const token = localStorage.getItem("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const sectionByTitle = title => [...document.querySelectorAll("h2,h3")].find(h => h.textContent.trim() === title);
  const cell = (value) => {
    const el = document.createElement("td");
    el.className = "border-b border-gray-300 px-4 py-4";
    el.textContent = value == null ? "—" : String(value);
    return el;
  };
  const status = (value) => {
    const span = document.createElement("span");
    span.className = "inline-flex items-center rounded-xl border border-amber-600 bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800";
    span.textContent = value || "Pending Approval";
    return span;
  };
  const link = item => {
    const a = document.createElement("a");
    a.className = "rounded-md border border-primary px-3 py-1 text-xs font-medium text-primary hover:bg-primary hover:text-white";
    a.textContent = "Review";
    a.href = "Application%20details.html?kind=" + encodeURIComponent(item.kind) + "&id=" + encodeURIComponent(item.id);
    return a;
  };
  const empty = (parent, message) => {
    const p = document.createElement("p");
    p.className = "py-4 text-sm text-slate-500";
    p.setAttribute("role", "status");
    p.textContent = message;
    parent.append(p);
  };
  const render = (items) => {
    const tbody = sectionByTitle("Onboarding requests")?.parentElement.querySelector("tbody");
    const pendingPanel = sectionByTitle("Pending applications")?.parentElement;
    if (tbody) {
      tbody.replaceChildren();
      if (!items.length) {
        const row = document.createElement("tr");
        const td = cell("No pending onboarding requests.");
        td.colSpan = 5;
        row.append(td);
        tbody.append(row);
      }
      for (const item of items.slice(0, 10)) {
        const tr = document.createElement("tr");
        tr.append(cell(item.name), cell(item.type || item.kind), cell(item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"));
        const state = cell("");
        state.append(status(item.status));
        tr.append(state);
        const action = cell("");
        action.append(link(item));
        tr.append(action);
        tbody.append(tr);
      }
    }
    if (pendingPanel) {
      [...pendingPanel.children].filter(x => x.tagName !== "H3").forEach(x => x.remove());
      if (!items.length) empty(pendingPanel, "No pending applications.");
      for (const item of items.slice(0, 5)) {
        const card = document.createElement("a");
        card.className = "mt-3 flex items-start justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100";
        card.href = link(item).href;
        const description = document.createElement("div");
        const name = document.createElement("p");
        name.className = "text-base font-medium sm:text-lg";
        name.textContent = item.name || "Unnamed application";
        const type = document.createElement("p");
        type.className = "text-sm tracking-tight text-muted";
        type.textContent = item.type || item.kind;
        description.append(name, type);
        card.append(description, status(item.status));
        pendingPanel.append(card);
      }
    }
  };
  const showActivityUnavailable = () => {
    const panel = sectionByTitle("Verification activity")?.parentElement;
    if (!panel) return;
    [...panel.children].filter(x => x.tagName !== "H3").forEach(x => x.remove());
    empty(panel, "Verification activity history is not available from the current admin API.");
  };
  const load = async () => {
    render([]);
    showActivityUnavailable();
    const tbody = sectionByTitle("Onboarding requests")?.parentElement.querySelector("tbody");
    if (tbody) {
      tbody.replaceChildren();
      const row = document.createElement("tr");
      const td = cell("Loading onboarding requests…");
      td.colSpan = 5;
      row.append(td);
      tbody.append(row);
    }
    try {
      if (!token) throw new Error("Sign in as an administrator to view requests.");
      const headers = { Authorization: "Bearer " + token };
      const meResponse = await fetch(API + "/auth/me", { headers });
      const me = await meResponse.json().catch(() => ({}));
      if (!meResponse.ok || me.data?.role !== "Admin" || me.data?.accountStatus !== "Active") {
        throw new Error("An active Admin account is required.");
      }
      const response = await fetch(API + "/admin/approval-queue", { headers });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || "Unable to load requests.");
      const items = [
        ...(body.data?.organizations || []).map(x => ({ ...x, kind: "Organization", id: x.organizationId, name: x.organizationName, type: x.organizationType })),
        ...(body.data?.institutions || []).map(x => ({ ...x, kind: "Institution", id: x.institutionId, name: x.institutionName, type: x.institutionType }))
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      render(items);
    } catch (error) {
      render([]);
      if (tbody) {
        tbody.replaceChildren();
        const row = document.createElement("tr");
        const td = cell("Could not load requests: " + error.message);
        td.colSpan = 5;
        row.append(td);
        tbody.append(row);
      }
      const panel = sectionByTitle("Pending applications")?.parentElement;
      if (panel) {
        [...panel.children].filter(x => x.tagName !== "H3").forEach(x => x.remove());
        empty(panel, "Could not load pending applications: " + error.message);
      }
    }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();
})();
