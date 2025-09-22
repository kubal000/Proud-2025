var socket = io.connect(window.location.protocol + '//' + window.location.host);

window.addEventListener("load", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get("username");
    if (username) {
        socket.emit("register_username", { username: username });
    }
});

socket.on('casovac', (data) => {
    
    if (data.cas === '00:00:00') {
        document.getElementById("casovac").textContent = "Čas vypršel";
        document.getElementById("bodyeditor").style.backgroundColor = "grey";
    } else {
        document.getElementById("casovac").textContent = data.cas;      
    }
});

socket.on('hra', function (data) {

    const stav = data.zprava;

    if (stav === 'Hra zacina') {
        document.getElementById("prihlasovani").innerHTML = "";
        document.getElementById("jizda").innerHTML = "";
        document.getElementById("probehle").innerHTML = "";
        document.getElementById("bodyeditor").style.backgroundColor = "rgb(255, 200, 0)";
    }
    if (stav === 'Vypni') {
        
    }
})

socket.on('chyba', (data) => {
    alert(data.zprava)
});

socket.on('zavod', (data) => {
    let idz = data.trasa + data.start
    if (data.stav === 'prihlasovani') {
        const kategorie = document.getElementById('prihlasovani')
        let zavod = document.getElementById(idz);
        if (!zavod) {
            zavod = document.createElement("li");
            zavod.id = idz;
            zavod.textContent = "Závod: " + data.trasa + ", start: " + data.start + " min, začíná za: " + data.cas
            kategorie.appendChild(zavod);           
        }
        else {
            let text = document.getElementById(idz)
            text.textContent = "Závod: " + data.trasa + ", start: " + data.start + " min, začíná za: " + data.cas
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
            zavod.textContent = "Závod: " + data.trasa + ", start: " + data.start + " min, poběží ještě: " + data.cas
            kategorie.appendChild(zavod);
        }
        else {
            let zavod = document.getElementById(idz)
            zavod.textContent = "Závod: " + data.trasa + ", start: " + data.start + " min, poběží ještě: " + data.cas
        }
    } else if (data.stav === 'cil') {
        idz = idz + 'j'
        let zavod = document.getElementById(idz);
        zavod.remove()
    }
})