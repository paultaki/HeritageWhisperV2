// Cleanup script to remove dark mode artifacts from localStorage
// This can be called once on app init or in a useEffect

export function cleanupDarkModeArtifacts() {
  if (typeof window !== 'undefined') {
    try {
      // Remove dark mode preference from localStorage
      localStorage.removeItem('hw-theme');

      // Remove dark class from HTML and body elements if present
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');

      console.log('Dark mode artifacts cleaned up');
    } catch (error) {
      console.error('Error cleaning up dark mode artifacts:', error);
    }
  }
}