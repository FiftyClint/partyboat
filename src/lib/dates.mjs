/** "2026-10-19" -> "October 19, 2026". Parsed as a calendar date, never shifted by time zone. */
export function longDate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  const month = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ][m - 1];
  return `${month} ${d}, ${y}`;
}
