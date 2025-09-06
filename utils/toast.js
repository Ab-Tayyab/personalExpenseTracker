// /utils/toast.js
let toast = document.getElementById("toast");
let toastHeading = document.getElementById("toast-content");

export function toastExecution(content) {
  if (!toast || !toastHeading) {
    // In case DOM not ready yet
    toast = document.getElementById("toast");
    toastHeading = document.getElementById("toast-content");
  }
  if (!toast || !toastHeading) return;

  toastHeading.textContent = content;
  toast.classList.remove("disable");
  toast.classList.add("active");
  setTimeout(() => {
    toast.classList.remove("active");
    toast.classList.add("disable");
  }, 3000);
}

export function closeToast() {
  if (!toast) return;
  toast.classList.remove("active");
  toast.classList.add("disable");
}
