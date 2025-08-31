 const PIN_KEY = "appPIN";
    let currentMode = "login"; // login | set | edit

    const form = document.getElementById("loginForm");
    const pinInput = document.getElementById("pin");
    const formTitle = document.getElementById("formTitle");
    const loginBtn = document.getElementById("loginBtn");
    const editPinBtn = document.getElementById("editPinBtn");

    // Live clock
    function updateClock() {
      const now = new Date();
      document.getElementById("clock").innerText = now.toLocaleTimeString();
      document.getElementById("date").innerText = now.toDateString();
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Initialize
    function init() {
      const savedPIN = localStorage.getItem(PIN_KEY);
      if (!savedPIN) {
        currentMode = "set";
        formTitle.innerText = "Set PIN";
        loginBtn.innerText = "Save PIN";
        editPinBtn.style.display = "none";
      } else {
        currentMode = "login";
        formTitle.innerText = "Enter PIN";
        loginBtn.innerText = "Login";
        editPinBtn.style.display = "inline-block";
      }
    }

    // Handle form submit
    form.addEventListener("submit", function(e) {
      e.preventDefault();
      const enteredPIN = pinInput.value.trim();
      const savedPIN = localStorage.getItem(PIN_KEY);

      if (currentMode === "set") {
        localStorage.setItem(PIN_KEY, enteredPIN);
        alert("PIN set successfully!");
        init();
      }
      else if (currentMode === "login") {
        if (enteredPIN === savedPIN) {
          localStorage.setItem("isLoggedIn", "true");
          window.location.href = "../container.html";
        } else {
          alert("Wrong PIN!");
        }
      }
      else if (currentMode === "edit") {
        localStorage.setItem(PIN_KEY, enteredPIN);
        alert("PIN updated!");
        init();
      }
      pinInput.value = "";
    });

    // Edit PIN button
    editPinBtn.addEventListener("click", function() {
      currentMode = "edit";
      formTitle.innerText = "Edit PIN";
      loginBtn.innerText = "Save New PIN";
      pinInput.value = "";
    });

    init();