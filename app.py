from flask import Flask, render_template, request, url_for, redirect, jsonify
from flask_socketio import SocketIO, emit
import pandas as pd
app = Flask(__name__)
app.config['SECRET_KEY'] = 'tajny_klic'
socketio = SocketIO(app, async_mode='eventlet')

# Pamatujeme si přihlášené uživatele a jejich připojení
usernames = {}       # jméno → sid (socket id)
sid_to_username = {} # sid → jméno

def tabulka(tym, pole, cislo):
    df = pd.read_csv("tymy.csv")
    df.set_index('tym', inplace=True)
    df.loc[tym, pole] = int(df.loc[tym, pole]) + cislo
    if df.loc[tym, pole]<0:
        df.loc[tym, pole] = int(df.loc[tym, pole]) - cislo
        df.to_csv('tymy.csv', index=True)
        return False
    df.to_csv('tymy.csv', index=True)
    return str(df.loc[tym, pole])

def update_online_users():
    emit('online_users', list(usernames.keys()), broadcast=True)

@app.route('/')
def index():
    return render_template('login.html')

@app.route('/login', methods=['GET'])
def login():
    username = request.args.get('username')
    heslo = request.args.get('heslo')
    if heslo == 'Proud2025':
        return redirect(url_for('soutez', username=username))
    elif heslo == 'Proud2025e' and username == 'Editor':
        return redirect(url_for('editor', username=username))
    else:
        return redirect(url_for('index'))

@app.route('/soutez')
def soutez():
    username = request.args.get('username')
    if not username:
        return redirect(url_for('index'))
    return render_template('soutez.html', username=username)

@app.route('/editor')
def editor():
    username = request.args.get('username')
    if not username:
        return redirect(url_for('index'))
    return render_template('editor.html', username=username)

@socketio.on('connect')
def handle_connect():
    print('Uživatel připojen:', request.sid)

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    username = sid_to_username.pop(sid, None)
    if username and username in usernames:
        del usernames[username]
        print('Odpojeno:', sid)
        update_online_users()

@socketio.on('send_message')
def handle_send_message(data):
    sender_sid = request.sid
    sender_name = sid_to_username.get(sender_sid, "neznámý")
    target_user = data.get('target_user')
    message = data.get('message')

    target_sid = usernames.get(target_user)
    if target_sid:
        emit('receive_message', {'sender': sender_name, 'message': message}, to=target_sid)
    emit('receive_message', {'sender': sender_name, 'message': message}, to=sender_sid)

@socketio.on('register_username')
def handle_register_username(data):
    username = data.get('username')
    if username:
        usernames[username] = request.sid
        sid_to_username[request.sid] = username
        print(f'{username} přihlášen jako {request.sid}')
        update_online_users()

@socketio.on('uloha')
def uloha(data=None):   
    emit('penize', {'penize': tabulka(sid_to_username.get(request.sid), 'penize', 50)})

@socketio.on('zvedni')
def zvedni(data):
    # dokončit placení s ošetřením nevlastnění peněz
    faktor = data['faktor']
    tym = sid_to_username.get(request.sid)
    df = pd.read_csv("tymy.csv")
    df.set_index('tym', inplace=True)
    vec = df.loc[tym, faktor]
    penize = tabulka(tym, 'penize', -25*(vec+2))
    if penize == False:
        emit('faktory', {'faktor': faktor, 'cislo': False, 'dalsicena': False})
    else:
        emit('penize', {'penize': penize})
        emit('faktory', {'faktor': faktor, 'cislo': tabulka(tym, faktor, 1), 'dalsicena': str(25*(vec+3))})

@socketio.on('init')
def init():
    tym = sid_to_username.get(request.sid)
    df = pd.read_csv("tymy.csv")
    df.set_index('tym', inplace=True)
    if tym not in df.index:
        df.loc[tym] = [0, 0, 0, 0, 0, 0]           # nastavení základních hodnot
        df.to_csv('tymy.csv', index=True)
    emit('penize', {'penize': str(df.loc[tym, 'penize'])})
    for faktor in ['A_motor','A_brzda','B_motor','B_brzda']:
        emit('faktory', {'faktor': faktor, 'cislo': str(df.loc[tym, faktor]), 'dalsicena': str(25*(df.loc[tym, faktor]+2))})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=10000)
