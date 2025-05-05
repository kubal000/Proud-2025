function sendMessage() {
    targetUser = document.getElementById("target_user").value;
    const message = document.getElementById("message").value;

    socket.emit('send_message', {
        target_user: targetUser,
        message: message
    });
}

function StartTimer() {
    socket.emit('start_timer', {'cas': 90});
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

socket.on('chyba', (data) => {
    alert(data.zprava)
});

socket.on('receive_message', function (data) {
    const messages = document.getElementById("messages");
    const messageItem = document.createElement("li");
    messageItem.textContent = data.sender + ": " + data.message;
    messages.appendChild(messageItem);
});

socket.on('casovac', (data) => {
    document.getElementById("casovac").textContent = data.cas
    if (data.cas === '00:00:00') {
        document.getElementById("casovac").textContent = "Čas vypršel"
        document.getElementById("casovacb").style.display = "block"; // Zobraz tlačítko pro spuštění časovače
    }
});

socket.on('tabulka', function (data) {
    const table = document.getElementById("tabulka");
    const body = table.querySelector("tbody");
    const head = table.querySelector("thead");
    if (body) {
        body.remove();
    }
    if (head) {
        head.remove();
    }
    
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    

    data.columns.forEach(col => {
        const th = document.createElement("th");
        th.textContent = col;
        headerRow.appendChild(th);
    });
    const tbody = table.createTBody();
    data.rows.forEach(row => {
        const tr = tbody.insertRow();
        data.columns.forEach(col => {
            const td = tr.insertCell();
            td.textContent = row[col];
        });
    });

    document.body.appendChild(table);
});

socket.on('hra', function (data) {
    
    const stav = data.zprava;
    const prvky = document.querySelectorAll('.hra')
    const prvkynone = document.querySelectorAll('.hranone')
    if (stav === 'Hra zacina') {
        socket.emit('init')
        prvky.forEach(el => {
            el.style.display = 'block';
        })
        document.querySelector('.staty').style.display = 'flex';
        prvkynone.forEach(el => {
            el.style.display = 'none';
        })
    }
    if (stav === 'Hra konci') {
        prvky.forEach(el => {
            el.style.display = 'none';
        })
        prvkynone.forEach(el => {
            el.style.display = 'block';
        })
    }
})