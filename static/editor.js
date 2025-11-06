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
    document.getElementById("vypnib").style.display = "block";
    document.body.classList.remove("end-mode");
    document.body.classList.remove("ending-mode");
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function Vypni() {
    if (confirm("Opravdu chcete ukončit hru?")) {
        document.getElementById("vypnib").style.display = "none";
        document.getElementById("casovacb").style.display = "block"; // Zobraz tlačítko pro spuštění časovače
        document.body.classList.remove("ending-mode");
        document.body.classList.remove("end-mode");
        socket.emit('vypni');
    }
}

var socket = io.connect(window.location.protocol + '//' + window.location.host);
let audioCtx;


window.addEventListener("load", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get("username");
    if (username) {
        socket.emit("register_username", { username: username });
        socket.emit("initeditor");
    }
});

socket.on('herni_stav', function (data) {
    if (data.herni_stav === 'bezi') {
        document.getElementById("casovacb").style.display = "none";
        document.getElementById("vypnib").style.display = "block";
    } else if (data.herni_stav === 'nebezi') {
        document.getElementById("casovacb").style.display = "block";
        document.getElementById("vypnib").style.display = "none";
    } else if (data.herni_stav === 'konci') {
        document.getElementById("casovacb").style.display = "none";
        document.getElementById("vypnib").style.display = "block";
        document.body.classList.add("end-mode");
    }
}
)

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
        document.getElementById("casovac").textContent = "Čas vypršel";
        document.body.classList.add("end-mode");
        document.body.classList.remove("ending-mode");
        const oscillator = audioCtx.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = 900;
        oscillator.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 1);
    }
    if (data.beep) {
        document.body.classList.remove("end-mode");
        document.body.classList.add("ending-mode");;
        const oscillator = audioCtx.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = 442;
        oscillator.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
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


});

