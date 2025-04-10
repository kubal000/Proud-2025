from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'tajny_klic'
socketio = SocketIO(app, async_mode='eventlet')

@app.route('/')
def index():
    return render_template('login.html')

@app.route('/login', methods=['GET'])
def login():
    username = request.get('username')
    session['username'] = username  # Uložení jména do session
    return render_template('soutez.html')

@app.route('/chat')
def chat():
    if 'username' not in session:
        return redirect(url_for('login'))  # Pokud není uživatel přihlášen, přesměruj na login
    return render_template('chat.html', username=session['username'])


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=10000)
