function sendMessage() {
    targetUser = document.getElementById("target_user").textContent;
    const message = document.getElementById("message").value;

    socket.emit('send_message', {
        target_user: targetUser,
        message: message
    });
}

function Uloha() {
    socket.emit('uloha');
}

function Prihlas() {
    alert("Přihlásil jsi se do závodu. Doprogramovat");
}

function Zvedni(faktor) {
    socket.emit('zvedni', { 'faktor': faktor });
}

function Init() {
    socket.emit('init');
}

function Uloz() {  
    socket.emit('uloz', { 'suma': document.getElementById('ulozeni').value});
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
});

socket.on('chyba', (data) => {
    alert(data.zprava)
});

socket.on('faktory', (data) => {
    if (data.cislo === false) {
        alert("Nemáš dostatek peněz na vylepšení")
    }
    else {
        document.getElementById(data.faktor).textContent = "level " + data.cislo + " "
        document.getElementById(data.faktor + "b").textContent = "Vylepši za: " + data.dalsicena + "$"
    }

});

socket.on('receive_message', function (data) {
    const messages = document.getElementById("messages");
    const messageItem = document.createElement("li");
    messageItem.textContent = data.sender + ": " + data.message;
    messages.appendChild(messageItem);
});

socket.on('banka', (data) => {
    const banka = document.getElementById("dluhy");
    let dluh = document.getElementById(data.idb);
    if (!dluh) {
        dluh = document.createElement("li");
        dluh.id = data.idb;
        banka.appendChild(dluh);
    }
    dluh.textContent = "Uloženo: " + data.suma + "$, ještě: " + data.cas;
    if (data.cas === '00:00:00') {
        dluh.remove()
    }
});

socket.on('zavod', (data) => {
    let idz = data.trasa + data.start
    if (data.stav === 'prihlasovani') {
        const kategorie = document.getElementById('prihlasovani')
        let zavod = document.getElementById(idz);
        if (!zavod) {
            zavod = document.createElement("li");
            zavod.id = idz;
            kategorie.appendChild(zavod);
            let text = document.createElement('label')
            text.id = idz + 'label'
            text.textContent = "Závod v: " + data.trasa + ", se startem: " + data.start + " min, začíná za: " + data.cas
            zavod.appendChild(text);
            let button = document.createElement('button')
            button.textContent = "Přihlásit se."
            button.onclick = () => Prihlas()
            zavod.appendChild(button);
        }
        else {
            let text = document.getElementById(idz + 'label')
            text.textContent = "Závod v: " + data.trasa + ", se startem: " + data.start + " min, začíná za: " + data.cas
        }
    } else if (data.stav === 'start') {
        let zavod = document.getElementById(idz);
        zavod.remove()
    } else if (data.stav === 'jizda') {
        idz = idz + 'j'
        const kategorie = document.getElementById('jizda')
        let zavod = document.getElementById(idz);
        if (!zavod) {
            zavod = document.createElement("li");
            zavod.id = idz;
            zavod.textContent = "Závod v: " + data.trasa + ", se startem: " + data.start + " min, poběží ještě: " + data.cas
            kategorie.appendChild(zavod);
        }
        else {
            let zavod = document.getElementById(idz)
            zavod.textContent = "Závod v: " + data.trasa + ", se startem: " + data.start + " min, poběží ještě: " + data.cas
        }
    } else if (data.stav === 'cil') {
        idz = idz + 'j'
        let zavod = document.getElementById(idz);
        zavod.remove()
    }
})


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