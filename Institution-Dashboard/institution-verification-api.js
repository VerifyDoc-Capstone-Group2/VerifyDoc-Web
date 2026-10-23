(() => {
  "use strict";
  const API = "https://verifydoc-api-v1.onrender.com";
  const tbody = document.getElementById("verificationRows");
  const tabs = [...document.querySelectorAll("main button.rounded-full")].slice(0, 3);
  const organization = document.querySelector('select[aria-label="Organization"]');
  const status = document.querySelector('select[aria-label="Status"]');
  const sort = document.querySelector('select[aria-label="Date"]');
  const search = document.querySelector('input[type="search"]');
  const token = () => (localStorage.getItem("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const cell = (value, classes = "px-3") => {
    const td = document.createElement("td");
    td.className = classes;
    td.textContent = value == null || value === "" ? "—" : String(value);
    return td;
  };
  const state = { credentials: [], tab: "all" };
  const isPending = item => item.source === "Citizen" && item.verificationStatus === "Pending" && item.status === "Active";
  const normalized = value => String(value || "").trim().toLowerCase();
  function message(value, error = false) {
    const tr = document.createElement("tr");
    const td = cell(value, "px-4 py-6 text-sm " + (error ? "text-red-700" : "text-neutral-500"));
    td.colSpan = 7;
    tr.append(td);
    tbody.replaceChildren(tr);
  }
  function render() {
    const all = state.credentials;
    const pending = all.filter(isPending);
    const responded = all.filter(item => item.source === "Citizen" && item.verificationStatus !== "Pending");
    [all.length, pending.length, responded.length].forEach((number, i) => {
      if (tabs[i]) tabs[i].textContent = ["All", "Pending", "Responded"][i] + " (" + number + ")";
    });
    tabs.forEach((tab, i) => {
      const selected = ["all", "pending", "responded"][i] === state.tab;
      tab.classList.toggle("bg-blue-600", selected);
      tab.classList.toggle("text-white", selected);
      tab.classList.toggle("bg-neutral-100", !selected);
      tab.classList.toggle("text-neutral-900", !selected);
      tab.setAttribute("aria-pressed", String(selected));
    });
    const q = normalized(search?.value);
    const selectedStatus = status?.value || "Status";
    const selectedOrg = organization?.value || "Organization";
    let items = all.filter(item => {
      if (state.tab === "pending" && !isPending(item)) return false;
      if (state.tab === "responded" && !(item.source === "Citizen" && item.verificationStatus !== "Pending")) return false;
      const label = item.status === "Revoked" ? "Revoked" : item.verificationStatus || "Pending";
      if (selectedStatus !== "Status" && selectedStatus !== label) return false;
      if (selectedOrg !== "Organization" && selectedOrg !== item.issuerName) return false;
      return normalized([item.holderName, item.credentialType, item.title, item.credentialId, item.issuerName].join(" ")).includes(q);
    });
    if (sort?.value === "Oldest first") items = [...items].reverse();
    if (!items.length) return message("No credentials match your filters.");
    const rows = items.map(item => {
      const tr = document.createElement("tr");
      tr.className = "h-[55px] border-b border-neutral-200";
      const label = item.status === "Revoked" ? "Revoked" : item.verificationStatus || "Pending";
      const badgeColors = label === "Verified" ? "border-green-300 bg-green-100 text-green-800" : label === "Pending" ? "border-amber-400 bg-amber-100 text-amber-800" : "border-red-300 bg-red-100 text-red-800";
      const badge = document.createElement("span");
      badge.className = "inline-flex items-center rounded-full border px-[7px] py-1 text-xs font-semibold " + badgeColors;
      badge.textContent = label;
      const statusCell = cell("", "px-3");
      statusCell.append(badge);
      const action = cell("", "px-3");
      const link = document.createElement("a");
      link.className = "inline-flex h-8 min-w-[73px] items-center justify-center rounded-lg border border-blue-800 px-2 text-sm text-blue-800 hover:bg-blue-50";
      link.textContent = "Review";
      link.href = "Review credential.html?credentialId=" + encodeURIComponent(item.credentialId);
      action.append(link);
      const received = item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-GB") : "—";
      tr.append(
        cell(item.holderName, "pl-4 pr-3 lg:pl-[41px]"),
        cell(item.credentialType),
        cell(item.credentialId, "px-3 font-mono text-neutral-900"),
        cell(item.issuerName),
        cell(received),
        statusCell,
        action
      );
      return tr;
    });
    tbody.replaceChildren(...rows);
  }
  async function load() {
    message("Loading credentials…");
    try {
      const auth = token();
      if (!auth) throw new Error("Sign in as an institution member to view credentials.");
      const all = [];
      let page = 1, pages = 1;
      do {
        const response = await fetch(API + "/credentials/institution?page=" + page + "&limit=50", {
          headers: { Authorization: "Bearer " + auth, Accept: "application/json" },
          cache: "no-store"
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.message || "Unable to load institution credentials (" + response.status + ").");
        if (!Array.isArray(body.data?.credentials)) throw new Error("Unexpected credential response.");
        all.push(...body.data.credentials);
        pages = body.data.pagination?.totalPages || 1;
        page++;
      } while (page <= pages);
      state.credentials = all;
      const organizations = [...new Set(all.map(item => item.issuerName).filter(Boolean))].sort();
      if (organization) organization.replaceChildren(new Option("Organization", "Organization"), ...organizations.map(name => new Option(name, name)));
      if (status) status.replaceChildren(new Option("Status", "Status"), ...["Pending", "Verified", "Rejected", "Revoked"].map(name => new Option(name, name)));
      render();
    } catch (error) {
      message(error.message || "Unable to load credentials.", true);
    }
  }
  tabs.forEach((tab, i) => tab.addEventListener("click", () => { state.tab = ["all", "pending", "responded"][i]; render(); }));
  for (const control of [organization, status, sort]) control?.addEventListener("change", render);
  search?.addEventListener("input", render);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();
})();
