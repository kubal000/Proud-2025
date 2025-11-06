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
    document.body.classList.add("plavcik-mode");
}

function ToHrac() {
    document.body.classList.remove("plavcik-mode");
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
        let zavod = document.getElementById(idz);
        if (!zavod) {
            const kategorie = document.getElementById('prihlasovani')
            zavod = document.createElement("tr");
            zavod.id = idz;
            zavod.innerHTML = "<td class='l'>" + data.trasa + "</td><td class='r'>" + data.printstart + "</td><td id='" + idz + "cas' class='r'>" + data.cas + "</td><td class='r'><button class='hrac' onclick = 'Prihlas(" + '"' + data.trasa + '"' + ", " + data.start + ", " + '"A"' + ")'>Formuli A</button><button class='hrac' onclick = 'Prihlas(" + '"' + data.trasa + '"' + ", "+data.start+", "+'"B"'+")'>Formuli B</button></td>"
            kategorie.appendChild(zavod);
        }
        else {
            let text = document.getElementById(idz + 'cas')
            text.innerHTML = data.cas
        }
    } else if (data.stav === 'prihlaseno') {
        let zavod = document.getElementById(idz);
        if (!zavod) {
            const kategorie = document.getElementById('prihlaseno')
            zavod = document.createElement("tr");
            zavod.id = idz;
            zavod.innerHTML = "<td class='l'>" + data.trasa + "</td><td class='r'>" + data.printstart + "</td><td id='" + idz + "cas' class='r'>" + data.cas + "</td><td class='r'>" + data.formule + "</td><td class='r'><button class='plavcik' onclick = 'Odhlas(" + '"' + data.trasa + '"' + ", " + data.start + ")'>Odhlásit</button></td>";
            kategorie.appendChild(zavod);
        }
        else {
            let text = document.getElementById(idz + 'cas')
            text.innerHTML = data.cas
        }
    } else if (data.stav === 'start') {
        let zavod = document.getElementById(idz);
        zavod.remove()
    } else if (data.stav === 'jizda') {
        const kategorie = document.getElementById('jizda')
        let zavod = document.getElementById(idz);
        if (!zavod) {
            zavod = document.createElement("tr");
            zavod.id = idz;
            zavod.innerHTML = "<td class='l'>" + data.trasa + "</td><td class='r'>" + data.printstart + "</td><td id='" + idz + "cas' class='r'>" + data.cas + "</td><td class='r'>" + data.formule + "</td><td class='r  '><button class='plavcik' onclick = 'Odhlas(" + '"' + data.trasa + '"' + ", " + data.start + ")'>Odhlásit</button></td>";
            kategorie.appendChild(zavod);
        }
        else {
            let text = document.getElementById(idz + 'cas')
            text.innerHTML = data.cas
        }
    } else if (data.stav === 'cil') {
        let zavod = document.getElementById(idz);
        if (zavod) zavod.remove()
    } else if (data.stav === 'hodnoceni') {
        const kategorie = document.getElementById('probehle');
        let zavod = document.createElement('tr');
        zavod.id = idz;
        zavod.innerHTML = "<td class='l'>" + data.trasa + "</td><td class='r  '>" + data.printstart + "</td><td class='r'>" + data.zisk + "</td><td class='r '>" + data.formule + "</td>";
        kategorie.appendChild(zavod);
    }
})


socket.on('hra', function (data) {

    const stav = data.zprava;
    const prvky = document.querySelectorAll('.hra')
    const prvkynone = document.querySelectorAll('.hranone')
    if (stav === 'Hra zacina') {
        document.body.classList.remove("end-mode");
        document.body.classList.remove("ending-mode");
        document.body.classList.remove("plavcik-mode");
        socket.emit('init')
        document.getElementById("prihlasovani").innerHTML = "<tr><th class='l ctvrtka'>Trasa</th><th class='r petina'>Start</th><th class='r petina'>Začíná za</th><th class='r velky'><span class='hrac'>Přihlaš</span></th></tr>";
        document.getElementById("jizda").innerHTML = "<tr><th class='l ctvrtka'>Trasa</th><th class='r maly'>Start</th><th class='r maly'>Končí za</th><th class='r maly'>Formule</th><th class='r' style='width: 18.75 %; '><span class='plavcik'>Odhlaš</span></th></tr>";
        document.getElementById("prihlaseno").innerHTML = "<tr><th class='l ctvrtka'>Trasa</th><th class='r maly'>Start</th><th class='r maly'>Začíná za</th><th class='r maly'>Formule</th><th class='r maly'><span class='plavcik'>Odhlaš</span></th></tr>"
        document.getElementById("probehle").innerHTML = "<tr><th class='l ctvrtka'>Trasa</th><th class='r ctvrtka'>Start</th><th class='r ctvrtka'>Body</th><th class='r ctvrtka'>Formule</th></tr>"
        prvky.forEach(el => {
            el.style.display = 'block';
        })
        document.querySelector('.staty').style.display = 'flex';
        prvkynone.forEach(el => {
            el.style.display = 'none';
        })
    }
    if (stav === 'Hra konci') {
        document.body.classList.remove("ending-mode");
        document.body.classList.add("end-mode");
    }
    if (stav === 'Vypni') {
        prvky.forEach(el => {
            el.style.display = 'none';
        })
        document.body.classList.remove("end-mode");
        prvkynone.forEach(el => {
            el.style.display = 'block';
        })
    }
});

socket.on('hra', function (data) {
    if (data.beep)
        document.body.classList.add("ending-mode");
});