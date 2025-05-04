from flask import Flask, render_template, request, url_for, redirect, jsonify
from flask_socketio import SocketIO, emit
import pandas as pd
import time
import copy

app = Flask(__name__)
app.config['SECRET_KEY'] = 'tajny_klic'
socketio = SocketIO(app, async_mode='eventlet')

# Pamatujeme si přihlášené uživatele a jejich připojení
usernames = {}       # jméno → sid (socket id)
sid_to_username = {} # sid → jméno

a = [
    ['Monako', 80], ['Velká Británie', 76.5], ['Itálie', 73], ['Japonsko', 69.5], ['Saudská Arábie', 66], ['Belgie', 62.5], 
    ['Itálie', 59], ['Monako', 55.5], ['Japonsko', 52], ['Belgie', 48.5], ['Monako', 45], ['Velká Británie', 41.5], 
    ['Saudská Arábie', 38], ['Velká Británie', 34.5], ['Itálie', 31], ['Belgie', 27.5], ['Japonsko', 24], ['Saudská Arábie', 20.5], 
    ['Monako', 17], ['Belgie', 13.5], ['Itálie', 10], ['Velká Británie', 6.5], ['Japonsko', 3], ['Belgie', 0], 
    ['Japonsko', 0], ['Monako', 0], ['Saudská Arábie', 0], ['Velká Británie', 0], ['Itálie', 0]
]
b = [
    80, 76.5, 73, 69.5, 66, 62.5, 59, 55.5, 52, 48.5, 45, 41.5, 38, 34.5, 31, 27.5, 24, 20.5, 17, 13.5, 10, 6.5, 3, 0, 0, 0, 0, 0, 0
]

min = 2 # nastavení délky minut v sekundách - pracovní urychlení hry za zachování časů v minutách...

def ZpravaVsem(zprava, emit):
    for username, sid in usernames.items():
        socketio.emit(emit, {'zprava': zprava}, to=sid)

def NulujTabulku():
    df = pd.read_csv("tymy.csv")
    # Nechá jen záhlaví (první řádek = sloupce)
    df.iloc[0:0].to_csv("tymy.csv", index=False)

def ZahajZavod(trasa, start):
    # Sem je třeba doplnit kód pro průběh závodu TODO
    print(f'Závod {trasa} začíná za 10 min v čase: {start}')

def ZavodNalezeni(cislo, data):
    for zavod in data[:]:
        if zavod[1] == cislo:
            trasa = zavod[0]
            data.pop(data.index(zavod))
            socketio.start_background_task(ZahajZavod, trasa, cislo)
    return data

def casovac(sid, cas):
    NulujTabulku()
    data = copy.deepcopy(a)
    casy = copy.deepcopy(b)
    ZpravaVsem('Hra zacina', 'hra')
    konec = time.time() + cas
    while True:
        zbyva = int(konec - time.time())
        for cislo in casy[:]:
            if cislo >= zbyva/min-10:
                casy.pop(casy.index(cislo))
                data = ZavodNalezeni(cislo, data)
                break
        if zbyva <= 0:
            socketio.emit('casovac', {'cas': '00:00:00'}, to=sid)
            ZpravaVsem('Hra konci', 'hra')
            break
        h = zbyva // 3600
        m = (zbyva % 3600) // 60
        s = zbyva % 60
        socketio.emit('casovac', {'cas': f'{h:02d}:{m:02d}:{s:02d}'}, to=sid)
        socketio.sleep(1 - (time.time() % 1))

def tabulka(tym, pole, cislo):
    df = pd.read_csv("tymy.csv")
    df.set_index('tym', inplace=True)
    df.loc[tym, pole] = int(df.loc[tym, pole]) + cislo
    if df.loc[tym, pole]<0:
        df.loc[tym, pole] = int(df.loc[tym, pole]) - cislo
        df.to_csv('tymy.csv', index=True)
        return False
    df.to_csv('tymy.csv', index=True)
    Editor = usernames.get('Editor')
    if Editor:
        df['tym'] = df.index
        columns = ['tym'] + [col for col in df.columns if col != 'tym']
        data = df[columns].to_dict(orient='records')
        
        socketio.emit('tabulka', {'columns': columns, 'rows': data}, to=Editor)
    
    return str(df.loc[tym, pole])

def ulozeni(sid, suma):
    konec = time.time() + 20 * min
    idb = time.time()
    while True:
        zbyva = int(konec - time.time())
        if zbyva <= 0:
            socketio.emit('banka', {'cas': '00:00:00', 'idb': idb, 'suma': suma}, to=sid)
            socketio.emit('penize', {'penize': tabulka(sid_to_username.get(sid), 'penize', int(suma*1.1))}, to=sid)
            break
        h = zbyva // 3600
        m = (zbyva % 3600) // 60
        s = zbyva % 60
        socketio.emit('banka', {'cas': f'{h:02d}:{m:02d}:{s:02d}', 'idb': idb, 'suma': suma}, to=sid)
        socketio.sleep(1)

def update_online_users():
    emit('online_users', list(usernames.keys()), broadcast=True)

#   SPUSTENI
@app.route('/')
def index():
    return render_template('login.html')

#   LOGIN

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

@socketio.on('connect')
def handle_connect():
    print('Uživatel připojen:', request.sid)

@socketio.on('register_username')
def handle_register_username(data):
    username = data.get('username')
    if username:
        usernames[username] = request.sid
        sid_to_username[request.sid] = username
        print(f'{username} přihlášen jako {request.sid}')
        update_online_users()

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    username = sid_to_username.pop(sid, None)
    if username and username in usernames:
        del usernames[username]
        print('Odpojeno:', sid)
        update_online_users()

# AKCE

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

@socketio.on('uloz')
def Uloz(data):
    suma = int(data['suma'])
    penize = tabulka(sid_to_username.get(request.sid), 'penize', -suma)
    if penize == False:
        emit('chyba', {'zprava': 'Nemůžeš uložit peníze které nemáš!!!'})
    else:
        emit('penize', {'penize': penize})
        socketio.start_background_task(ulozeni, request.sid, suma)

#   CASOMIRY

@socketio.on('start_timer')
def start_timer(data):
    socketio.start_background_task(casovac, request.sid, data['cas'] * min)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=10000)
