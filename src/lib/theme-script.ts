/**
 * Theme initialization script to prevent FOUC (Flash of Unstyled Content)
 * This should be inlined in the HTML head before React loads
 */
export const themeScript = `
(function() {
  try {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Determine which theme to apply
    let theme = 'light';
    if (stored === 'dark' || (stored === 'system' && prefersDark) || (!stored && prefersDark)) {
      theme = 'dark';
    }
    
    // Apply immediately to prevent flash
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
  } catch (e) {
    // Ignore errors in unsupported browsers
  }
})();
`;

