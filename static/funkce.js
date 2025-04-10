function Login() {
    let data = {};
    document.querySelectorAll("input[type='text']").forEach(input => {
        data[input.name] = input.value;
    });

    if (data.heslo === "Proud2025") {
        location.href = "/login?username=" + encodeURIComponent(data.username);
    } else {
        document.getElementById("upozorneni").style.display = "block";
    }
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

function sendMessage() {
    const targetUser = document.getElementById("target_user").value;
    const message = document.getElementById("message").value;

    socket.emit('send_message', {
        target_user: targetUser,
        message: message
    });
}

socket.on('receive_message', function(data) {
    const messages = document.getElementById("messages");
    const messageItem = document.createElement("li");
    messageItem.textContent = data.sender + ": " + data.message;
    messages.appendChild(messageItem);
});
