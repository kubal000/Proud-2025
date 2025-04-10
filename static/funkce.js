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
var socket = io.connect('http://' + document.domain + ':' + location.port);

function sendMessage() {
    var targetUser = document.getElementById("target_user").value;
    var message = document.getElementById("message").value;
    
    socket.emit('send_message', { 'target_user': targetUser, 'message': message });
}

socket.on('receive_message', function(data) {
    var messages = document.getElementById("messages");
    var messageItem = document.createElement("li");
    messageItem.textContent = data.sender + ": " + data.message;
    messages.appendChild(messageItem);
});
