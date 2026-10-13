// js/verification-requests-status.js
document.addEventListener('DOMContentLoaded', () => {
  // Initialize icons if Lucide is available
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

// Show backend confirmation status, never a static demo timeline.
document.addEventListener('DOMContentLoaded', async () => {
  const card = document.querySelector('main .bg-white.rounded-2xl');
  if (!card) return;
  const brief = card.querySelector('h2');
  const submitted = card.querySelector('.border-t.border-b p.text-slate-400');
  const timeline = card.querySelector('.relative.pl-8');
  if (brief) brief.textContent = 'Loading confirmation request…';
  if (submitted) submitted.textContent = '—';
  if (timeline) timeline.replaceChildren();
  const session = window.VerifyDocOrganizationSession;
  if (!session || !(await session.ready)) return;
  const requestedId = new URLSearchParams(location.search).get('requestId');
  try {
    const url = requestedId
      ? "https://verifydoc-api-v1.onrender.com/credential-confirmations/organization/" + encodeURIComponent(requestedId)
      : "https://verifydoc-api-v1.onrender.com/credential-confirmations/organization?page=1&limit=1";
    if (requestedId && !/^[a-f0-9]{24}$/i.test(requestedId)) throw new Error("Invalid confirmation request ID");
    const response = await fetch(url, {
      headers: { Authorization: "Bearer " + session.getToken() }, cache: "no-store"
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || "Unable to retrieve confirmation");
    const found = requestedId ? body.data : body.data?.requests?.[0];
    if (!found) {
      if (brief) brief.textContent = 'No confirmation request found';
      return;
    }
    if (brief) brief.textContent = `Credential reference: ${found.credentialId || 'Unavailable'}`;
    if (submitted) submitted.textContent = found.createdAt ? new Date(found.createdAt).toLocaleString() : '—';
    if (timeline) {
      const stages = [
        ['Request submitted', found.createdAt ? new Date(found.createdAt).toLocaleString() : 'Submitted'],
        [found.status === 'Pending' ? 'Institution reviewing' : 'Institution responded', found.status],
        ['Confirmation outcome', found.status === 'Pending' ? 'Awaiting response' : found.status]
      ];
      stages.forEach(([label, value]) => {
        const step = document.createElement('div');
        step.className = 'relative flex items-start gap-3';
        const content = document.createElement('div');
        content.appendChild(Object.assign(document.createElement('p'), { className: 'text-xs font-bold text-slate-800', textContent: label }));
        content.appendChild(Object.assign(document.createElement('p'), { className: 'text-[11px] text-slate-500 mt-0.5', textContent: value }));
        step.appendChild(content);
        timeline.appendChild(step);
      });
      if (found.responseNote) {
        const note = document.createElement('p');
        note.className = 'text-xs text-slate-600 mt-3';
        note.textContent = `Institution note: ${found.responseNote}`;
        timeline.appendChild(note);
      }
    }
  } catch (error) {
    if (brief) brief.textContent = error.message || 'Unable to load confirmation status';
  }
});
