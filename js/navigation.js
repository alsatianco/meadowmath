// Navigation JavaScript - Meadow Math

/**
 * Initialize navigation functionality
 */
function initNavigation() {
  const hamburger = document.querySelector('.hamburger');
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.querySelector('.sidebar-backdrop');
  const body = document.body;

  if (!hamburger || !sidebar || !backdrop) {
    console.warn('Navigation elements not found');
    return;
  }

  /**
   * Toggle sidebar open/closed
   */
  function toggleSidebar() {
    hamburger.classList.toggle('open');
    sidebar.classList.toggle('open');
    backdrop.classList.toggle('active');
    body.classList.toggle('sidebar-open');
  }

  /**
   * Close sidebar
   */
  function closeSidebar() {
    hamburger.classList.remove('open');
    sidebar.classList.remove('open');
    backdrop.classList.remove('active');
    body.classList.remove('sidebar-open');
  }

  // Hamburger click event
  hamburger.addEventListener('click', toggleSidebar);

  // Backdrop click event - close sidebar
  backdrop.addEventListener('click', closeSidebar);

  // Close sidebar when navigation item is clicked on mobile
  const navItems = sidebar.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        closeSidebar();
      }
    });
  });

  // Handle window resize - close sidebar on mobile if resizing to desktop
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth >= 768) {
        closeSidebar();
      }
    }, 250);
  });

  // Set active navigation item based on current page
  setActiveNavItem();
}

/**
 * Set active navigation item based on current URL
 */
function setActiveNavItem() {
  const navItems = document.querySelectorAll('.nav-item');
  const currentPath = window.location.pathname.toLowerCase();

  // Extract the section from the current path
  // e.g., "/meadow-math/grade1/index.html" -> "grade1"
  // e.g., "/meadow-math/prek/index.html" -> "prek"
  // e.g., "/meadow-math/index.html" -> "index" (home)
  const pathParts = currentPath.split('/').filter(part => part && part !== 'index.html');
  const currentSection = pathParts[pathParts.length - 1] || 'index';

  navItems.forEach(item => {
    const href = item.getAttribute('href');
    if (!href) return;

    // Remove active class from all items
    item.classList.remove('active');

    // Extract section from href
    // e.g., "grade1/index.html" -> "grade1"
    // e.g., "prek/index.html" -> "prek"
    // e.g., "index.html" -> "index" (home)
    const hrefLower = href.toLowerCase();
    const hrefParts = hrefLower.split('/').filter(part => part && part !== 'index.html');
    const hrefSection = hrefParts[hrefParts.length - 1] || 'index';

    // Match sections
    if (currentSection === hrefSection) {
      item.classList.add('active');
    }
    // Special case: if we're at root or index.html, activate home
    else if ((currentSection === '' || currentSection === 'index' || currentPath.endsWith('/')) 
             && (hrefSection === 'index' || href === 'index.html')) {
      item.classList.add('active');
    }
  });
}

/**
 * Initialize tab functionality for activity pages
 */
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanels = document.querySelectorAll('.tab-panel');

  if (tabButtons.length === 0 || tabPanels.length === 0) {
    return; // No tabs on this page
  }

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetPanel = button.getAttribute('data-tab');

      // Remove active class from all buttons and panels
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanels.forEach(panel => panel.classList.remove('active'));

      // Add active class to clicked button and corresponding panel
      button.classList.add('active');
      const panel = document.getElementById(targetPanel);
      if (panel) {
        panel.classList.add('active');
      }
    });
  });
}

/**
 * Smooth scroll to section
 */
function smoothScrollTo(targetId) {
  const target = document.getElementById(targetId);
  if (target) {
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

/**
 * Add keyboard navigation support
 */
function initKeyboardNavigation() {
  // Escape key closes sidebar on mobile
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar && sidebar.classList.contains('open')) {
        const hamburger = document.querySelector('.hamburger');
        const backdrop = document.querySelector('.sidebar-backdrop');

        hamburger?.classList.remove('open');
        sidebar.classList.remove('open');
        backdrop?.classList.remove('active');
        document.body.classList.remove('sidebar-open');
      }
    }
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initTabs();
  initKeyboardNavigation();
});

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initNavigation,
    initTabs,
    setActiveNavItem,
    smoothScrollTo
  };
}
