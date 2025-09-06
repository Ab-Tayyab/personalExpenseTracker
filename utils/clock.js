export function updateClock() {
  const now = new Date();
  const clockEl = document.getElementById("clock");
  const dateEl = document.getElementById("date");
  if (clockEl) clockEl.innerText = now.toLocaleTimeString();
  if (dateEl) dateEl.innerText = now.toDateString();
}
