(() => {
  "use strict";
  const API = "https://verifydoc-api-v1.onrender.com";
  const main = document.querySelector("main");
  const tbody = main?.querySelector("#verificationRequestsBody");
  if (!tbody) return;
  const tabs = [...main.querySelectorAll("[data-verification-tab]")];
  const organization = main.querySelector('select[aria-label="Organization"]');
  const status = main.querySelector('select[aria-label="Status"]');
  const date = main.querySelector('select[aria-label="Date"]');
  const search = main.querySelector('input[type="search"]');
  const token = () => (localStorage.getItem("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  let credentials = [];
  let activeTab = "all";
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
  };
  const state = c => c.status === "Revoked" ? "Revoked" : (c.verificationStatus || "Pending");
  const badge = value => ({
    Pending: "border-amber-400 bg-amber-100 text-amber-800",
    Verified: "border-green-300 bg-green-100 text-green-800",
    Rejected: "border-red-300 bg-red-100 text-red-800",
    Revoked: "border-red-300 bg-red-100 text-red-800"
  }[value] || "border-neutral-300 bg-neutral-100 text-neutral-700");
  const formatted = value => {
    const parsed = new Date(value);
    return value && Number.isFinite(parsed.getTime()) ? parsed.toLocaleDateString("en-GB") : "Unavailable";
  };
  const showMessage = (message, error = false) => {
    const row = document.createElement("tr");
    const cell = make("td", "px-4 py-8 text-sm " + (error ? "text-red-700" : "text-neutral-500"), message);
    cell.colSpan = 7;
    row.append(cell);
    tbody.replaceChildren(row);
  };
  const request = async (path, options = {}) => {
    const auth = token();
    if (!auth) throw new Error("Please sign in using an institution account.");
    const response = await fetch(API + path, {
      ...options,
      headers: {
        Authorization: "Bearer " + auth,
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {})
      },
      cache: "no-store"
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || "Request failed (" + response.status + ").");
    return body.data;
  };
  const updateTabs = () => {
    const counts = {
      all: credentials.length,
      pending: credentials.filter(c => state(c) === "Pending" && c.status === "Active").length,
      responded: credentials.filter(c => state(c) !== "Pending").length
    };
    tabs.forEach(tab => {
      const selected = tab.dataset.verificationTab === activeTab;
      tab.textContent = ({ all: "All", pending: "Pending", responded: "Responded" })[tab.dataset.verificationTab] +
        " (" + counts[tab.dataset.verificationTab] + ")";
      tab.classList.toggle("bg-blue-600", selected);
      tab.classList.toggle("text-white", selected);
      tab.classList.toggle("bg-neutral-100", !selected);
      tab.classList.toggle("text-neutral-900", !selected);
      tab.setAttribute("aria-pressed", String(selected));
    });
  };
  const render = () => {
    updateTabs();
    const query = (search?.value || "").trim().toLowerCase();
    const selectedOrganization = organization?.value || "";
    const selectedStatus = status?.value || "";
    const filtered = credentials.filter(c => {
      const value = state(c);
      if (activeTab === "pending" && !(value === "Pending" && c.status === "Active")) return false;
      if (activeTab === "responded" && value === "Pending") return false;
      if (selectedOrganization && c.issuerName !== selectedOrganization) return false;
      if (selectedStatus && value !== selectedStatus) return false;
      return [c.holderName, c.credentialType, c.title, c.credentialId, c.issuerName]
        .join(" ").toLowerCase().includes(query);
    }).sort((a, b) => {
      const delta = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      return date?.value === "Oldest first" ? delta : -delta;
    });
    if (!filtered.length) return showMessage("No verification requests match these filters.");
    const rows = filtered.map(c => {
      const row = make("tr", "h-[55px] border-b border-neutral-200");
      const cells = [
        [c.holderName || "Unavailable", "pl-4 pr-3 lg:pl-[41px]"],
        [c.credentialType || c.title || "Unavailable", "px-3"],
        [c.credentialId || "Unavailable", "px-3 font-mono text-neutral-900"],
        [c.issuerName || "Unavailable", "px-3"],
        [formatted(c.createdAt), "px-3"]
      ];
      for (const [value, css] of cells) row.append(make("td", css, value));
      const statusCell = make("td", "px-3");
      const value = state(c);
      statusCell.append(make("span", "inline-flex min-h-[22px] items-center rounded-full border px-[7px] text-[12px] font-semibold " + badge(value), value));
      row.append(statusCell);
      const cell = make("td", "px-3");
      const button = make("button", "inline-flex h-8 min-w-[73px] items-center justify-center rounded-lg border border-blue-800 px-2 text-[14px] text-blue-800 hover:bg-blue-50", "Review");
      button.type = "button";
      button.addEventListener("click", () => review(c.credentialId));
      cell.append(button);
      row.append(cell);
      return row;
    });
    tbody.replaceChildren(...rows);
  };
  async function review(id) {
    const previous = main.querySelector("#institutionVerificationDialog");
    previous?.remove();
    try {
      const c = await request("/credentials/" + encodeURIComponent(id));
      const backdrop = make("div", "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4");
      backdrop.id = "institutionVerificationDialog";
      backdrop.setAttribute("role", "presentation");
      const panel = make("section", "max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl");
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");
      panel.setAttribute("aria-label", "Review credential");
      panel.append(make("h2", "text-xl font-bold text-gray-900", "Review credential"));
      const details = [
        ["Holder", c.holderName || credentials.find(x => x.credentialId === id)?.holderName || "Unavailable"],
        ["Credential ID", c.credentialId],
        ["Type", c.credentialType || c.title],
        ["Title", c.title],
        ["Issuer", c.issuerName],
        ["Issue date", formatted(c.issueDate)],
        ["Status", state(c)]
      ];
      const dl = make("dl", "my-5 space-y-3 text-sm");
      for (const [label, value] of details) {
        const row = make("div", "flex justify-between gap-4 border-b pb-2");
        row.append(make("dt", "text-gray-500", label), make("dd", "text-right font-medium break-all", value || "Unavailable"));
        dl.append(row);
      }
      panel.append(dl);
      const feedback = make("p", "mb-3 text-sm text-red-700");
      feedback.setAttribute("role", "alert");
      panel.append(feedback);
      const actions = make("div", "flex flex-wrap justify-end gap-2");
      const close = make("button", "rounded-lg border border-gray-300 px-4 py-2", "Close");
      close.type = "button";
      close.addEventListener("click", () => backdrop.remove());
      actions.append(close);
      if (c.source === "Citizen" && state(c) === "Pending" && c.status === "Active") {
        const reject = make("button", "rounded-lg border border-red-600 px-4 py-2 text-red-700", "Reject");
        const verify = make("button", "rounded-lg bg-blue-600 px-4 py-2 text-white", "Verify");
        reject.type = verify.type = "button";
        const decide = async (action, body) => {
          reject.disabled = verify.disabled = true;
          feedback.textContent = "";
          try {
            await request("/credentials/" + encodeURIComponent(id) + "/" + action, {
              method: "PATCH", ...(body ? { body: JSON.stringify(body) } : {})
            });
            backdrop.remove();
            await load();
          } catch (error) {
            feedback.textContent = error.message || "Could not update credential.";
          } finally {
            reject.disabled = verify.disabled = false;
          }
        };
        verify.addEventListener("click", () => {
          if (window.confirm("Verify this credential? This decision confirms the uploaded document against your institution's records.")) decide("verify");
        });
        reject.addEventListener("click", () => {
          const reason = window.prompt("Reason for rejecting this credential (required, maximum 1000 characters):");
          if (reason === null) return;
          if (!reason.trim() || reason.trim().length > 1000) {
            feedback.textContent = "Enter a rejection reason between 1 and 1000 characters.";
            return;
          }
          decide("reject", { rejectionReason: reason.trim() });
        });
        actions.append(reject, verify);
      }
      panel.append(actions);
      backdrop.append(panel);
      backdrop.addEventListener("click", event => { if (event.target === backdrop) backdrop.remove(); });
      document.body.append(backdrop);
      close.focus();
    } catch (error) {
      window.alert(error.message || "Unable to load credential details.");
    }
  }
  async function load() {
    showMessage("Loading verification requests…");
    try {
      const all = [];
      let page = 1, pages = 1;
      do {
        const data = await request("/credentials/institution?view=uploaded&page=" + page + "&limit=50");
        if (!Array.isArray(data?.credentials)) throw new Error("Unexpected credential response.");
        all.push(...data.credentials);
        pages = data.pagination?.totalPages || 1;
        page++;
      } while (page <= pages);
      credentials = all;
      if (organization) {
        const selected = organization.value;
        organization.replaceChildren(new Option("Organization", ""));
        [...new Set(credentials.map(c => c.issuerName).filter(Boolean))].sort().forEach(name => organization.add(new Option(name, name)));
        organization.value = selected;
      }
      if (status) {
        status.replaceChildren(new Option("Status", ""));
        ["Pending", "Verified", "Rejected", "Revoked"].forEach(value => status.add(new Option(value, value)));
      }
      render();
    } catch (error) {
      credentials = [];
      updateTabs();
      showMessage(error.message || "Unable to load verification requests.", true);
    }
  }
  tabs.forEach(tab => tab.addEventListener("click", () => { activeTab = tab.dataset.verificationTab; render(); }));
  for (const control of [organization, status, date, search]) {
    control?.addEventListener(control === search ? "input" : "change", render);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load);
  else load();
})();
