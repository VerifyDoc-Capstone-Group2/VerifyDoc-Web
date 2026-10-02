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
    freshForm.addEventListener('submit', (e) => {
      const value = reasonInput ? reasonInput.value.trim() : '';

      if (!value) {
        e.preventDefault();
        if (fieldError) {
          fieldError.classList.remove('hidden');
        }
        if (reasonInput) {
          reasonInput.classList.add('border-rose-400', 'focus:ring-rose-500');
          reasonInput.focus();
        }
      }
    });
  }
});