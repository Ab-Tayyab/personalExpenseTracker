document.getElementById('form').addEventListener(('submit'), function (e) {
    e.preventDefault();
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;


    if (username === "abtayyab" && password === "22385524") {
        localStorage.setItem("isLoggedIn", "true");
        window.location.href = "../dashboard/index.html";
    }
    else {
        alert("Wrong password or username")
    }
})