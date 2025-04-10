function Login() {
    let data = {};
    document.querySelectorAll("input[type='number']").forEach(input => {
        data[input.name] = input.value;
    });
  location = "/login?username="+data.username
}
