/* ============================================================
   Kickoff'26 — Shared Utilities
   ============================================================ */
const Utils = (() => {
  const esc = s => {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  };

  const sanitizeInput = s => {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[<>]/g, '');
  };

  const pct = n => Math.round(n * 100);

  return { esc, sanitizeInput, pct };
})();
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}
