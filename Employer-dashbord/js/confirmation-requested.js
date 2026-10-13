document.addEventListener("DOMContentLoaded", async () => {
  const card = document.querySelector("main .bg-white.rounded-2xl");
  const heading = card?.querySelector("h1");
  const subtitle = heading?.nextElementSibling;
  const values = card?.querySelectorAll(".grid.grid-cols-12 .col-span-8");
  const statusLink = card?.querySelector('a[href="verification-request-status.html"]');
  if (!heading || !values || values.length < 3) return;

  heading.textContent = "Checking confirmation request";
  if (subtitle) subtitle.textContent = "Retrieving the submitted request.";
  values[0].textContent = "—";
  values[1].textContent = "—";
  values[2].textContent = "—";
  if (statusLink) statusLink.removeAttribute("href");

  const requestId = new URLSearchParams(location.search).get("requestId");
  if (!/^[a-f0-9]{24}$/i.test(requestId || "")) {
    heading.textContent = "Request details unavailable";
    if (subtitle) subtitle.textContent = "No valid confirmation request was selected.";
    return;
  }
  const session = window.VerifyDocOrganizationSession;
  if (!session || !(await session.ready)) return;

  try {
    const response = await fetch("https://verifydoc-api-v1.onrender.com/credential-confirmations/organization/" + encodeURIComponent(requestId), {
      headers: { Authorization: "Bearer " + session.getToken() }, cache: "no-store"
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || "Could not load confirmation request");
    const request = body.data;
    if (!request) throw new Error("Confirmation request not found.");
    heading.textContent = "Confirmation Requested";
    if (subtitle) subtitle.textContent = "Your request has been recorded by VerifyDoc.";
    values[0].textContent = String(request.credentialId || "Not available");
    values[1].textContent = "Institution details not provided";
    values[2].textContent = request.status || "Pending";
    if (statusLink) statusLink.href = `verification-request-status.html?requestId=${encodeURIComponent(requestId)}`;
  } catch (error) {
    heading.textContent = "Request details unavailable";
    if (subtitle) subtitle.textContent = error.message || "Unable to retrieve request details.";
  }
});
