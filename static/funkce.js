function Login() {
    let data = {};
    document.querySelectorAll("input[type='text']").forEach(input => {
        data[input.name] = input.value;
    });
    if (data.heslo == "Proud2025") {
        location = "/login?username="+data.username
    }
    else {
        document.getElementById("upozorneni").style.display = "block";
    } 
}
