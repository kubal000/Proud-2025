function sendMessage() {
    const elem = document.getElementById("target_user");
    if (elem.tagName === "INPUT") {
        targetUser = elem.value;
    } else {
        targetUser = elem.textContent;
    }
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

function StartTimer() {
    socket.emit('start_timer');
    document.getElementById("casovacb").style.display = "none"; // Skryj tlačítko pro spuštění časovače 
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
    if (data.cislo === false) {
        alert("Nemáš dostatek peněz na vylepšení")
    }
    else {
        document.getElementById(data.faktor).textContent = "level " + data.cislo + " "
        document.getElementById(data.faktor + "b").textContent = "Vylepši za: " + data.dalsicena + "$"
    }
    
})

socket.on('receive_message', function (data) {
    const messages = document.getElementById("messages");
    const messageItem = document.createElement("li");
    messageItem.textContent = data.sender + ": " + data.message;
    messages.appendChild(messageItem);
})

socket.on('casovac', (data) => {
    document.getElementById("casovac").textContent = data.cas
    if (data.cas === '00:00:00') {
        document.getElementById("casovac").textContent = "Čas vypršel"
        document.getElementById("casovacb").style.display = "block"; // Zobraz tlačítko pro spuštění časovače
    }
})