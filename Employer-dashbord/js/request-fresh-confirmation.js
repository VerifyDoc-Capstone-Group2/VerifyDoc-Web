// js/request-fresh-confirmation.js
document.addEventListener('DOMContentLoaded', () => {
  const reasonInput = document.getElementById('reason');
  const charCounter = document.getElementById('charCounter');
  const freshForm = document.getElementById('freshConfirmationForm');
  const fieldError = document.getElementById('fieldError');

  // Real-time Character Counter
  if (reasonInput && charCounter) {
    reasonInput.addEventListener('input', () => {
      const currentLength = reasonInput.value.length;
      charCounter.textContent = `${currentLength}/500`;

      if (fieldError && currentLength > 0) {
        fieldError.classList.add('hidden');
        reasonInput.classList.remove('border-rose-400', 'focus:ring-rose-500');
      }
    });
  }

  // Form Validation Handler
  if (freshForm) {
    freshForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const value = reasonInput ? reasonInput.value.trim() : '';

      if (value.length < 3 || value.length > 500) {
        if (fieldError) {
          fieldError.textContent = 'Please enter a reason between 3 and 500 characters.';
          fieldError.classList.remove('hidden');
        }
        if (reasonInput) {
          reasonInput.classList.add('border-rose-400', 'focus:ring-rose-500');
          reasonInput.focus();
        }
        return;
      }
      const shareId = new URLSearchParams(window.location.search).get('shareId');
      if (!/^[a-f0-9]{24}$/i.test(shareId || '')) {
        if (fieldError) { fieldError.textContent = 'Choose a shared credential first.'; fieldError.classList.remove('hidden'); }
        return;
      }
      const session = window.VerifyDocOrganizationSession;
      if (!session || !(await session.ready)) return;
      const button = freshForm.querySelector('button[type="submit"]');
      if (button) button.disabled = true;
      try {
        const response = await fetch(`https://verifydoc-api-v1.onrender.com/credential-shares/organization/${encodeURIComponent(shareId)}/confirmations`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.getToken()}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: value })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Unable to submit confirmation request');
        const requestId = result.data?.id;
        if (!requestId) throw new Error('Server did not return a request ID');
        window.location.assign(`confirmation-requested.html?requestId=${encodeURIComponent(requestId)}`);
      } catch (error) {
        if (fieldError) { fieldError.textContent = error.message || 'Request failed. Please retry.'; fieldError.classList.remove('hidden'); }
      } finally { if (button) button.disabled = false; }
    });
  }
});

// Replace the example credential brief with the selected authorized share.
document.addEventListener('DOMContentLoaded', async () => {
  const card = document.querySelector('main .bg-white.rounded-2xl');
  const heading = card?.querySelector('h2');
  if (!heading) return;
  const detail = heading.nextElementSibling;
  const issuer = detail?.nextElementSibling;
  heading.textContent = 'Loading shared credential…';
  if (detail) detail.textContent = '';
  if (issuer) issuer.textContent = '';
  const shareId = new URLSearchParams(location.search).get('shareId');
  if (!/^[a-f0-9]{24}$/i.test(shareId || '')) { heading.textContent = 'Select a credential from Shared Credentials'; return; }
  const session = window.VerifyDocOrganizationSession;
  if (!session || !(await session.ready)) return;
  try {
    const response = await fetch(`https://verifydoc-api-v1.onrender.com/credential-shares/organization/${encodeURIComponent(shareId)}`, { headers: { Authorization: `Bearer ${session.getToken()}` }, cache: 'no-store' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Unable to load credential');
    heading.textContent = result.data?.credential?.title || 'Credential';
    if (detail) detail.textContent = result.data?.credential?.credentialId || '';
    if (issuer) issuer.textContent = result.data?.credential?.issuerName || '';
  } catch (error) { heading.textContent = error.message || 'Unable to load credential'; }
});
