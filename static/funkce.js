function Login() {
    let data = {};
    document.querySelectorAll("input[type='text']").forEach(input => {
        data[input.name] = input.value;
    });
    if (data.heslo == "Proud2025") {
        //location = "/login?username="+data.username
        alert("Přihlásil ses. Super!!!")
    }
    else {
        document.GetElementByID("upozorneni").style.display="block";
    } 
}
