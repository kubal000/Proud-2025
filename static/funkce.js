function sendMessage() {
    const targetUser = document.getElementById("target_user").textContent;
    const message = document.getElementById("message").value;

    socket.emit('send_message', {
        target_user: targetUser,
        message: message
    });
}

function Uloha() {
    socket.emit('uloha');
}

function Zvedni(faktor) {
    socket.emit('zvedni', { 'faktor': faktor });
}

function Init() {
    socket.emit('init');
}

var socket = io.connect(window.location.protocol + '//' + window.location.host);

window.addEventListener("load", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get("username");
    if (username) {
        socket.emit("register_username", { username: username });
    }
});

socket.on('online_users', function(userList) {
    const onlineBox = document.getElementById("online_users");
    onlineBox.innerHTML = ""; // Vyčistit

    userList.forEach(username => {
        const li = document.createElement("li");
        li.textContent = username;
        onlineBox.appendChild(li);
    });
});

socket.on('penize', (data) => {
    document.getElementById("penize").textContent = data.penize + " $"
})

socket.on('faktory', (data) => {
    if (data.cislo == False) {
        alert("Nemáš dostatek peněz na vylepšení")
    }
    else {
        document.getElementById(data.faktor).textContent = "Level: " + data.cislo
        document.getElementById(data.faktor + "b").textContent = "Vylepši za: " + data.dalsicena + "$"
    }
    
})

socket.on('receive_message', function (data) {
    const messages = document.getElementById("messages");
    const messageItem = document.createElement("li");
    messageItem.textContent = data.sender + ": " + data.message;
    messages.appendChild(messageItem);
})
