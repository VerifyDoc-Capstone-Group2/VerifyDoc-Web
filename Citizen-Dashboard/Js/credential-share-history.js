(() => {
  "use strict";

  const API = "https://verifydoc-api-v1.onrender.com";
  const container = document.getElementById("shareHistoryList");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const credentialId = params.get("credentialId") || params.get("id");
  const auth = (localStorage.getItem("authorization") || "")
    .replace(/^Bearer\s+/i, "").trim();

  function element(tag, className, value) {
    const node = document.createElement(tag);
    node.className = className;
    if (value !== undefined) node.textContent = String(value);
    return node;
  }

  function message(value, isError = false) {
    container.replaceChildren(element(
      "p",
      "py-3 text-xs " + (isError ? "text-red-700" : "text-slate-500"),
      value
    ));
  }

  function date(value) {
    const parsed = new Date(value);
    return value && Number.isFinite(parsed.getTime())
      ? parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
      : "Not available";
  }

  function duration(share) {
    const start = new Date(share.createdAt).getTime();
    const end = new Date(share.expiresAt).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end)) return "Not available";
    const days = Math.max(0, Math.ceil((end - start) / 86400000));
    return days + (days === 1 ? " day" : " days");
  }

  function addDetail(list, label, value) {
    list.append(
      element("dt", "", label),
      element("dd", "text-right break-words", value ?? "Not available")
    );
  }

  function render(shares) {
    container.replaceChildren();
    if (!shares.length) {
      message("This credential has not been shared yet.");
      return;
    }
    for (const share of shares) {
      const item = element("article", "border-b border-slate-200 py-3 text-[11px]");
      item.append(element(
        "p", "font-medium text-slate-800",
        share.organization?.name || "Organization unavailable"
      ));
      const details = element(
        "dl", "mt-1 grid grid-cols-[1fr_auto] gap-x-2 gap-y-1 text-slate-500"
      );
      addDetail(details, "Credential ID", share.credential?.credentialId || credentialId);
      addDetail(details, "Shared on", date(share.createdAt));
      addDetail(details, "Duration", duration(share));
      addDetail(details, "Access expires", date(share.expiresAt));
      addDetail(details, "Purpose", share.purpose || "Not specified");
      addDetail(details, "Status", share.status || "Unknown");
      item.append(details);
      container.append(item);
    }
  }

  async function load() {
    if (!credentialId || !/^VDOC-CRED-\d{8}$/.test(credentialId)) {
      message("A valid credential ID is required to load sharing history.", true);
      return;
    }
    if (!auth) {
      message("Sign in to view your credential's sharing history.", true);
      return;
    }
    try {
      const matching = [];
      let page = 1;
      let pages = 1;
      do {
        const response = await fetch(
          API + "/credential-shares/mine?page=" + page + "&limit=50",
          {
            headers: {
              Authorization: "Bearer " + auth,
              Accept: "application/json"
            },
            cache: "no-store"
          }
        );
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.message || "Unable to retrieve sharing history.");
        if (!Array.isArray(body.data?.shares)) throw new Error("Unexpected sharing history response.");
        matching.push(...body.data.shares.filter(
          share => share.credential?.credentialId === credentialId
        ));
        pages = Number(body.data.pagination?.totalPages ?? 1);
        if (!Number.isSafeInteger(pages) || pages < 0) {
          throw new Error("Invalid sharing history pagination.");
        }
        page++;
      } while (page <= pages);
      render(matching);
    } catch (error) {
      message(error.message || "Unable to load sharing history.", true);
    }
  }

  load();
})();
