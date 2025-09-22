function sendMessage() {
    targetUser = document.getElementById("target_user").textContent;
    const message = document.getElementById("message").value;

    socket.emit('send_message', {
        target_user: targetUser,
        message: message
    });
}

function Uloha(pocet) {
    socket.emit('uloha', { 'pocet': pocet });
}

function Prihlas(trasa, start, formule) {
    socket.emit('prihlaszavod', { 'trasa': trasa, 'start': start, 'formule':formule})
}

function Odhlas(trasa, start) {
    socket.emit('odhlaszavod', { 'trasa': trasa, 'start': start })
}

function Zvedni(faktor, pocet) {
    socket.emit('zvedni', { 'faktor': faktor, 'pocet':pocet});
}

function Init() {
    socket.emit('init');
}

function ToPlavcik() {
    document.getElementById("bodyhrac").classList.add("plavcik-mode");
    document.getElementById("bodyhrac").style.backgroundColor = "aqua";
}

function ToHrac() {
    document.getElementById("bodyhrac").classList.remove("plavcik-mode");
    document.getElementById("bodyhrac").style.backgroundColor = "rgb(255, 200, 0)";
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

socket.on('pocetuloh', (data) => {
    document.getElementById("pocetuloh").textContent = data.pocetuloh
})
socket.on('chyba', (data) => {
    alert(data.zprava)
});

socket.on('faktory', (data) => {
    document.getElementById(data.faktor).textContent = "level " + data.cislo + " ";
    document.getElementById(data.faktor + "b").textContent = "Vylepši za: " + data.dalsicena + "$";
});

socket.on('receive_message', function (data) {
    const messages = document.getElementById("messages");
    const messageItem = document.createElement("li");
    messageItem.textContent = data.sender + ": " + data.message;
    messages.appendChild(messageItem);
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
            text.textContent = "Závod: " + data.trasa + ", start: " + data.start + " min, začíná za: " + data.cas
            zavod.appendChild(text);
            let buttonA = document.createElement('button')
            buttonA.textContent = "Přihlásit formuli A"
            buttonA.classList = "hrac"
            buttonA.onclick = () => Prihlas(data.trasa, data.start, "A")
            zavod.appendChild(buttonA);
            let buttonB = document.createElement('button')
            buttonB.textContent = "Přihlásit formuli B"
            buttonB.classList = "hrac"
            buttonB.onclick = () => Prihlas(data.trasa, data.start, "B")
            zavod.appendChild(buttonB);
        }
        else {
            let text = document.getElementById(idz + 'label')
            text.textContent = "Závod: " + data.trasa + ", start: " + data.start + " min, začíná za: " + data.cas
        }
    } else if (data.stav === 'prihlaseno') {
        let zavod = document.getElementById(idz);
        if (!zavod) {
            const kategorie = document.getElementById('prihlaseno')
            zavod = document.createElement("li");
            zavod.id = idz;
            kategorie.appendChild(zavod);
            let text = document.createElement('label')
            text.id = idz + 'label'
            text.textContent = "Závod: " + data.trasa + ", start: " + data.start + " min, začíná za: " + data.cas + " Přihlášena formule " + data.formule;
            zavod.appendChild(text);
            let button = document.createElement('button')
            button.textContent = "Odhlásit"
            button.classList = "plavcik"
            button.onclick = () => Odhlas(data.trasa, data.start)
            zavod.appendChild(button);
        }
        else {
            let text = document.getElementById(idz + 'label')
            text.textContent = "Závod: " + data.trasa + ", start: " + data.start + " min, začíná za: " + data.cas + " Přihlášena formule " + data.formule;
        }
    } else if (data.stav === 'start') {
        let zavod = document.getElementById(idz);
        zavod.remove()
    } else if (data.stav === 'jizda') {
        idz = idz
        const kategorie = document.getElementById('jizda')
        let zavod = document.getElementById(idz);
        if (!zavod) {
            zavod = document.createElement("li");
            zavod.id = idz;
            kategorie.appendChild(zavod);
            let text = document.createElement('label')
            text.id = idz + 'label'
            text.textContent = "Závod: " + data.trasa + ", start: " + data.start + " min, formule " + data.formule + ", poběží ještě: " + data.cas;
            zavod.appendChild(text);
            let button = document.createElement('button')
            button.textContent = "Odhlásit"
            button.classList = "plavcik"
            button.onclick = () => Odhlas(data.trasa, data.start)
            zavod.appendChild(button);
        }
        else {
            let text = document.getElementById(idz + 'label')
            text.textContent = "Závod: " + data.trasa + ", start: " + data.start + " min, formule " + data.formule + ", poběží ještě: " + data.cas;
        }
    } else if (data.stav === 'cil') {
        idz = idz
        let zavod = document.getElementById(idz);
        zavod.remove()
    } else if (data.stav === 'hodnoceni') {
        const kategorie = document.getElementById('probehle');
        let zavod = document.createElement('li');
        zavod.id = idz
        zavod.textContent = "Závod: " + data.trasa + ", start: " + data.start + " min, skončil. Formule " + data.formule + " ti přinesla: " + data.zisk + " bodů.";
        kategorie.appendChild(zavod);
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
        document.getElementById("bodyhrac").style.backgroundColor = "grey";
    }
    if (stav === 'Vypni') {
        prvky.forEach(el => {
            el.style.display = 'none';
        })
        prvkynone.forEach(el => {
            el.style.display = 'block';
        })
    }
})