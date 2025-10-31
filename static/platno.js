function Resize() {
    const cas = document.getElementById('casovac');
    const nad = document.querySelectorAll('.oknostabem h2')[0];
    const okna = document.querySelectorAll('.oknostabem .okenko');
    if (!cas || okna.length === 0) return;

    // height of the header element including vertical margins
    const casRect = cas.getBoundingClientRect();
    const casStyles = getComputedStyle(cas);
    const casMarginTop = parseFloat(casStyles.marginTop) || 0;
    const casMarginBottom = parseFloat(casStyles.marginBottom) || 0;
    const casHeight = Math.ceil(casRect.height + casMarginTop + casMarginBottom);

    const nadRect = nad.getBoundingClientRect();
    const nadStyles = getComputedStyle(nad);
    const nadMarginTop = parseFloat(nadStyles.marginTop) || 0;
    const nadMarginBottom = parseFloat(nadStyles.marginBottom) || 0;
    const nadHeight = Math.ceil(nadRect.height + nadMarginTop + nadMarginBottom);

    // available height for oknostabem divs
    const gap = -30; // small gap between header and the boxes
    const available = Math.max(0, window.innerHeight - casHeight - nadHeight - gap);

    okna.forEach(el => {
        el.style.height = available + 'px';
        el.style.overflow = 'auto'; // allow scrolling when content exceeds
    });
}
window.addEventListener('resize', Resize)
var socket = io.connect(window.location.protocol + '//' + window.location.host);


window.addEventListener("load", () => {
    Resize();
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
        document.getElementById("bodyeditor").style.backgroundColor = "rgb(255, 200, 0)";
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
            zavod.innerHTML = data.trasa + "<br/> start: " + data.start + " min, začíná za: " + data.cas
            kategorie.appendChild(zavod);           
        }
        else {
            let text = document.getElementById(idz)
            text.innerHTML = data.trasa + "<br/> start: " + data.start + " min, začíná za: " + data.cas
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
            zavod.innerHTML = data.trasa + "<br/> start: " + data.start + " min, končí za: " + data.cas
            kategorie.appendChild(zavod);
        }
        else {
            let zavod = document.getElementById(idz)
            zavod.innerHTML = data.trasa + "<br/> start: " + data.start + " min, končí za: " + data.cas
        }
    } else if (data.stav === 'cil') {
        idz = idz + 'j'
        let zavod = document.getElementById(idz);
        zavod.remove()
    }
})