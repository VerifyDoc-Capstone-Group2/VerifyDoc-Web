(() => {
  "use strict";
  const API = "https://verifydoc-api-v1.onrender.com";
  const $ = id => document.getElementById(id);
  const form = document.querySelector("main form");
  const feedback = $("issue-feedback");
  const reviewButton = $("review-credential");
  const nextButton = $("select-recipient");
  let recipient = null;
  let issuing = false;
  const token = () => (localStorage.getItem("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const say = (message, error = false) => {
    feedback.textContent = message;
    feedback.className = "mt-3 text-sm " + (error ? "text-red-700" : "text-blue-700");
  };
  const field = id => $(id).value.trim();
  const request = async (path, options = {}) => {
    const auth = token();
    if (!auth) throw new Error("Sign in as an institution to issue credentials.");
    const response = await fetch(API + path, {
      ...options, headers: { Authorization: "Bearer " + auth, Accept: "application/json", ...(options.headers || {}) }
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "Request failed (" + response.status + ")");
    return result.data;
  };
  const getRecipient = async () => {
    const email = field("email").toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid citizen email.");
    const data = await request("/credentials/recipients/lookup?email=" + encodeURIComponent(email));
    if (field("first-name") && field("first-name").toLowerCase() !== data.firstName.toLowerCase()) throw new Error("First name does not match the registered citizen.");
    if (field("last-name") && field("last-name").toLowerCase() !== data.lastName.toLowerCase()) throw new Error("Last name does not match the registered citizen.");
    $("first-name").value = data.firstName;
    $("last-name").value = data.lastName;
    recipient = data;
    return data;
  };
  const validate = () => {
    const title = field("credential-title");
    const type = field("type");
    const program = field("program");
    const date = field("issue-date");
    const year = field("graduation-year");
    const file = $("credential-document").files[0];
    if (!title || !type || !program || !date) throw new Error("Complete the credential title, type, program and issue date.");
    if (new Date(date).getTime() > Date.now()) throw new Error("Issue date cannot be in the future.");
    if (year && (+year < 1900 || +year > new Date().getFullYear())) throw new Error("Enter a valid graduation year.");
    if (!file || (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"))) throw new Error("Select a PDF credential document.");
    if (file.size > 5 * 1024 * 1024) throw new Error("PDF must not exceed 5 MB.");
    if (field("expiry-date") && field("expiry-date") < date) throw new Error("Expiry date cannot precede issue date.");
    return file;
  };
  const close = () => $("credential-review-dialog")?.remove();
  const review = async () => {
    if (issuing) return;
    reviewButton.disabled = true;
    say("Checking the registered citizen…");
    try {
      const file = validate();
      const user = await getRecipient();
      say("");
      close();
      const overlay = document.createElement("div");
      overlay.id = "credential-review-dialog";
      overlay.className = "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4";
      const card = document.createElement("section");
      card.className = "w-full max-w-lg rounded-xl bg-white p-6 shadow-xl";
      const heading = document.createElement("h2");
      heading.className = "text-xl font-bold";
      heading.textContent = "Review credential before issuing";
      const summary = document.createElement("dl");
      summary.className = "my-5 space-y-2 text-sm";
      for (const [label, value] of [
        ["Citizen", user.firstName + " " + user.lastName],
        ["Email", user.email], ["Credential title", field("credential-title")],
        ["Credential type", field("type")], ["Program", field("program")],
        ["Issue date", field("issue-date")], ["Document", file.name],
        ["Verification status", "Verified on successful issuance"]
      ]) {
        const row = document.createElement("div");
        row.className = "flex justify-between gap-4 border-b pb-2";
        const dt = document.createElement("dt"); dt.className = "text-slate-500"; dt.textContent = label;
        const dd = document.createElement("dd"); dd.className = "text-right font-medium"; dd.textContent = value;
        row.append(dt, dd); summary.append(row);
      }
      const controls = document.createElement("div");
      controls.className = "flex gap-3";
      const cancel = document.createElement("button");
      cancel.type = "button"; cancel.textContent = "Back"; cancel.className = "flex-1 rounded-lg border p-3";
      cancel.addEventListener("click", close);
      const issue = document.createElement("button");
      issue.type = "button"; issue.textContent = "Issue credential"; issue.className = "flex-1 rounded-lg bg-blue-600 p-3 text-white";
      issue.addEventListener("click", async () => {
        if (issuing) return;
        issuing = true; issue.disabled = true; issue.textContent = "Issuing…";
        try {
          // Recheck the citizen ID and the form state immediately before submission.
          const checked = await getRecipient();
          const documentFile = validate();
          const data = new FormData();
          data.append("citizenId", checked.citizenId);
          data.append("title", field("credential-title"));
          data.append("credentialType", field("type"));
          data.append("fieldOfStudy", field("field-of-study") || field("program"));
          data.append("issueDate", field("issue-date"));
          if (field("graduation-year")) data.append("graduationYear", field("graduation-year"));
          data.append("document", documentFile);
          const created = await request("/credentials", { method: "POST", body: data });
          close();
          say("Credential issued successfully. ID: " + (created.credentialId || "Generated by backend") + ". Status: Verified.");
          form.querySelectorAll("input,textarea,button").forEach(el => { el.disabled = true; });
        } catch (error) {
          issue.disabled = false; issue.textContent = "Issue credential";
          say(error.message, true);
        } finally { issuing = false; }
      });
      controls.append(cancel, issue); card.append(heading, summary, controls); overlay.append(card);
      document.body.append(overlay);
    } catch (error) { say(error.message, true); }
    finally { reviewButton.disabled = false; }
  };
  form.addEventListener("submit", event => { event.preventDefault(); review(); });
  reviewButton.addEventListener("click", review);
  nextButton.addEventListener("click", async () => {
    say("Looking up the citizen…");
    try { const user = await getRecipient(); say("Recipient confirmed: " + user.firstName + " " + user.lastName + ". Complete the credential fields and select Review details."); }
    catch (error) { say(error.message, true); }
  });
  ["email","first-name","last-name"].forEach(id => $(id).addEventListener("input", () => { recipient = null; }));
})();