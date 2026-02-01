// About Page JavaScript - Meadow Math

document.addEventListener('DOMContentLoaded', function() {
  initTabs();
  handleHashNavigation();
});

/**
 * Initialize tab functionality
 */
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.dataset.tab;

      // Update button states
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Update content visibility
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabId}-tab`) {
          content.classList.add('active');
        }
      });

      // Update URL hash without scrolling
      history.replaceState(null, null, `#${tabId}`);
    });
  });
}

/**
 * Handle hash navigation (e.g., #privacy deep link)
 */
function handleHashNavigation() {
  const hash = window.location.hash.slice(1); // Remove the # symbol

  if (hash) {
    const tabButton = document.querySelector(`.tab-btn[data-tab="${hash}"]`);
    if (tabButton) {
      tabButton.click();
    }
  }

  // Also listen for hash changes
  window.addEventListener('hashchange', () => {
    const newHash = window.location.hash.slice(1);
    if (newHash) {
      const tabButton = document.querySelector(`.tab-btn[data-tab="${newHash}"]`);
      if (tabButton) {
        tabButton.click();
      }
    }
  });
}
