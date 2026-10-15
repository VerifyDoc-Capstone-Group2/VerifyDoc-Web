(() => {
  "use strict";
  const API = "https://verifydoc-api-v1.onrender.com";
  const main = document.querySelector("main");
  const tbody = main?.querySelector("table tbody");
  const count = main?.querySelector('button.rounded-full');
  const institutionFilter = main?.querySelector('select[aria-label="Institutions"]');
  const statusFilter = main?.querySelector('select[aria-label="Status"]');
  const dateFilter = main?.querySelector('select[aria-label="Issue date"]');
  const search = main?.querySelector('input[type="search"]');
  const token = () => (localStorage.getItem("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  let records = [];
  const el = (tag, cls, value) => {
    const node = document.createElement(tag);
    node.className = cls;
    if (value !== undefined) node.textContent = String(value);
    return node;
  };
  const displayDate = value => {
    const date = new Date(value);
    return value && Number.isFinite(date.getTime()) ? date.toLocaleDateString("en-GB") : "Unavailable";
  };
  const effectiveStatus = c => c.status === "Revoked" ? "Revoked" : (c.verificationStatus || "Pending");
  const statusClass = status => ({
    Verified: "border-green-300 bg-green-100 text-green-800",
    Pending: "border-amber-300 bg-amber-100 text-amber-800",
    Rejected: "border-red-300 bg-red-100 text-red-800",
    Revoked: "border-red-300 bg-red-100 text-red-800"
  }[status] || "border-gray-300 bg-gray-100 text-gray-800");
  const makeRow = c => {
    const tr = el("tr", "h-[55px] border-b border-neutral-200");
    const cells = [
      [c.credentialId || "Unavailable", "pl-4 pr-3 font-mono text-neutral-900 lg:pl-[41px]"],
      [c.holderName || "Unavailable", "px-3"],
      [c.fieldOfStudy || c.title || "Unavailable", "px-3"],
      [c.issuerName || "Unavailable", "px-3"],
      [displayDate(c.issueDate), "px-3"]
    ];
    for (const [value, cls] of cells) tr.append(el("td", cls, value));
    const statusCell = el("td", "px-3");
    const state = effectiveStatus(c);
    statusCell.append(el("span", "inline-flex min-h-[22px] items-center whitespace-nowrap rounded-full border px-[7px] text-[12px] font-semibold " + statusClass(state), state));
    tr.append(statusCell);
    const action = el("td", "px-3");
    const link = el("a", "inline-flex h-8 w-[73px] items-center justify-center rounded-lg border border-blue-800 text-[14px] text-blue-800 hover:bg-blue-50", "Review");
    link.href = "./Credential details.html?credentialId=" + encodeURIComponent(c.credentialId || "");
    action.append(link);
    tr.append(action);
    return tr;
  };
  const message = (value, error = false) => {
    const tr = document.createElement("tr");
    const td = el("td", "px-4 py-8 text-sm " + (error ? "text-red-700" : "text-neutral-500"), value);
    td.colSpan = 7;
    tr.append(td);
    tbody.replaceChildren(tr);
  };
  const setOptions = (select, placeholder, values) => {
    if (!select) return;
    select.replaceChildren(new Option(placeholder, ""));
    for (const value of values) select.add(new Option(value, value));
  };
  function render() {
    const q = (search?.value || "").trim().toLowerCase();
    const inst = institutionFilter?.value || "";
    const state = statusFilter?.value || "";
    const sort = dateFilter?.value || "";
    const filtered = records.filter(c => {
      const searchable = [c.credentialId, c.holderName, c.fieldOfStudy, c.title, c.issuerName].join(" ").toLowerCase();
      return searchable.includes(q) && (!inst || c.issuerName === inst) && (!state || effectiveStatus(c) === state);
    }).sort((a, b) => {
      const diff = new Date(a.issueDate || 0).getTime() - new Date(b.issueDate || 0).getTime();
      return sort === "Oldest first" ? diff : -diff;
    });
    if (!filtered.length) return message(records.length ? "No credentials match these filters." : "No credentials found for your institution.");
    tbody.replaceChildren(...filtered.map(makeRow));
  }
  async function load() {
    if (!tbody) return;
    message("Loading institution credentials…");
    if (count) count.textContent = "All (—)";
    try {
      const auth = token();
      if (!auth) throw new Error("Please sign in with an institution account.");
      const all = [];
      let page = 1;
      let pages = 1;
      let total = 0;
      do {
        const response = await fetch(API + "/credentials/institution?page=" + page + "&limit=50", {
          headers: { Authorization: "Bearer " + auth, Accept: "application/json" },
          cache: "no-store"
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.message || "Unable to retrieve credentials (" + response.status + ").");
        if (!Array.isArray(body.data?.credentials)) throw new Error("Unexpected credential response.");
        all.push(...body.data.credentials);
        total = body.data.pagination?.total ?? all.length;
        pages = body.data.pagination?.totalPages ?? 1;
        page++;
      } while (page <= pages);
      records = all;
      if (count) count.textContent = "All (" + total + ")";
      setOptions(institutionFilter, "Institutions", [...new Set(records.map(c => c.issuerName).filter(Boolean))].sort());
      setOptions(statusFilter, "Status", ["Pending", "Verified", "Rejected", "Revoked"]);
      setOptions(dateFilter, "Issue date", ["Newest first", "Oldest first"]);
      render();
    } catch (error) {
      message(error.message || "Unable to load institution credentials.", true);
    }
  }
  for (const control of [institutionFilter, statusFilter, dateFilter, search]) {
    control?.addEventListener(control === search ? "input" : "change", render);
  }
  count?.addEventListener("click", () => {
    if (search) search.value = "";
    for (const select of [institutionFilter, statusFilter, dateFilter]) if (select) select.value = "";
    render();
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();
})();
