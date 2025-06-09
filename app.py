from logging.handlers import WatchedFileHandler
from flask import Flask, render_template, request, url_for, redirect, jsonify
from flask_socketio import SocketIO, emit
import pandas as pd
import time
import copy

#TODO: vyhodnocování závodu

app = Flask(__name__)
app.config['SECRET_KEY'] = 'tajny_klic'
socketio = SocketIO(app, async_mode='eventlet')

# Pamatujeme si přihlášené uživatele a jejich připojení
usernames = {}       # jméno → sid (socket id)
sid_to_username = {} # sid → jméno

herni_stav = "nebezi"

a = [
    ['Monako', 80, []], ['Velká Británie', 76.5, []], ['Itálie', 73, []], ['Japonsko', 69.5, []], ['Saudská Arábie', 66, []], ['Belgie', 62.5, []], 
    ['Itálie', 59, []], ['Monako', 55.5, []], ['Japonsko', 52, []], ['Belgie', 48.5, []], ['Monako', 45, []], ['Velká Británie', 41.5, []], 
    ['Saudská Arábie', 38, []], ['Velká Británie', 34.5, []], ['Itálie', 31, []], ['Belgie', 27.5, []], ['Japonsko', 24, []], ['Saudská Arábie', 20.5, []], 
    ['Monako', 17, []], ['Belgie', 13.5, []], ['Itálie', 10, []], ['Velká Británie', 6.5, []], ['Japonsko', 3, []], ['Belgie', 0, []], 
    ['Japonsko', 0, []], ['Monako', 0, []], ['Saudská Arábie', 0, []], ['Velká Británie', 0, []], ['Itálie', 0, []]
]
b = [
    80, 76.5, 73, 69.5, 66, 62.5, 59, 55.5, 52, 48.5, 45, 41.5, 38, 34.5, 31, 27.5, 24, 20.5, 17, 13.5, 10, 6.5, 3, 0, 0, 0, 0, 0, 0
]

min = 1 # nastavení délky minut v sekundách - pracovní urychlení hry za zachování časů v minutách...

def ZpravaVsem(zprava, emit):
    for username, sid in usernames.items():
        socketio.emit(emit, {'zprava': zprava}, to=sid)

def NulujTabulku():
    df = pd.read_csv("tymy.csv")
    # Nechá jen záhlaví (první řádek = sloupce)
    df.iloc[0:0].to_csv("tymy.csv", index=False)
    PosliTabulkuEditorovi()

def ZahajZavod(trasa, start, konechry, index): # konechry - reálný čas konce hry v sekundách, start - čas startu závodu v minutách zbývajících do konce hry
    print(f'Závod {trasa} začíná za 10 min v čase: {start}')
    df = pd.read_csv("zavody.csv", encoding='utf-8')
    df.set_index('stat', inplace=True)
    jizda = int(df.loc[trasa, 'cas']) # čas jízdy v minutách
    motor = int(df.loc[trasa, 'motor'])
    brzda = int(df.loc[trasa, 'brzda'])
    Zacatek = konechry - start * min 
    while Zacatek > time.time():
        zbyva = Zacatek - time.time()
        h = zbyva // 3600
        m = (zbyva % 3600) // 60
        s = zbyva % 60
        for username, sid in usernames.items():
            if [username, "A"] in a[index][2]:
                socketio.emit('zavod', {'stav':'prihlaseno', 'cas': f'{int(h):02d}:{int(m):02d}:{int(s):02d}', 'trasa': trasa, 'start':start, 'jizda': jizda, 'brzda': brzda, 'motor':motor, 'formule': "A"}, to=sid)
            elif [username, 'B'] in a[index][2]:
                socketio.emit('zavod', {'stav':'prihlaseno', 'cas': f'{int(h):02d}:{int(m):02d}:{int(s):02d}', 'trasa': trasa, 'start':start, 'jizda': jizda, 'brzda': brzda, 'motor':motor, 'formule': "B"}, to=sid)
            else:
                socketio.emit('zavod', {'stav':'prihlasovani', 'cas': f'{int(h):02d}:{int(m):02d}:{int(s):02d}', 'trasa': trasa, 'start':start, 'jizda': jizda, 'brzda': brzda, 'motor':motor}, to=sid)
        socketio.sleep(1 - (time.time() % 1))
    for username, sid in usernames.items():
        socketio.emit('zavod', {'stav': 'start', 'cas': '00:00:00', 'trasa': trasa, 'start':start}, to=sid)
    dftymy = pd.read_csv("tymy.csv", encoding='utf-8')
    dftymy.set_index('tym', inplace=True)
    dataoformulich = {} # tym → [formule, motor, brzda]

    for zavodnik in a[index][2]:
        if zavodnik[0] in dftymy.index:
            formule = zavodnik[1]
            zmotor = int(dftymy.loc[zavodnik[0], f'{formule}_motor'])
            zbrzda = int(dftymy.loc[zavodnik[0], f'{formule}_brzda'])
            dataoformulich[zavodnik[0]] = [formule, zmotor, zbrzda]
    for prubeh in range(jizda*min):
        zbyva = jizda*min - prubeh
        h = zbyva // 3600
        m = (zbyva % 3600) // 60
        s = zbyva % 60
        for zavodnik in a[index][2]:
            sid = usernames.get(zavodnik[0])
            formule = zavodnik[1]
            socketio.emit('zavod', {'stav':'jizda', 'cas': f'{int(h):02d}:{int(m):02d}:{int(s):02d}', 'trasa': trasa, 'start':start, 'formule': formule}, to=sid)
        socketio.sleep(1 - (time.time() % 1))
    for zavodnik in a[index][2]:
        sid = usernames.get(zavodnik[0])
        socketio.emit('zavod', {'stav': 'cil', 'cas': '00:00:00', 'trasa': trasa, 'start':start}, to=sid)
    seznamkrazeni = []
    for tym in dataoformulich.keys():
        info = dataoformulich[tym]
        seznamkrazeni.append([tym, info[0], info[1]*motor+info[2]*brzda])
    seznamkrazeni = sorted(seznamkrazeni, key=lambda x: x[2])
    serazeno = []
    while len(seznamkrazeni) > 0:
        prvek = [seznamkrazeni.pop()]
        while seznamkrazeni and seznamkrazeni[-1][2] == prvek[0][2]:
                prvek.append(seznamkrazeni.pop())
        serazeno.append(prvek)
    maxzisk = jizda * 100 # maximální zisk za závod, 100% zisk
    misto = 1
    while misto >= 0.55 and serazeno != []:
        obodovat = serazeno.pop(0)
        for zavodnik in obodovat:
            socketio.emit('zavod', {'stav': 'hodnoceni', 'trasa': trasa, 'start': start, 'formule': zavodnik[1], 'zisk': int(misto * maxzisk)}, to=usernames.get(zavodnik[0]))
            tabulka(zavodnik[0], 'body', int(misto * maxzisk))
        misto -= 0.05 * len(obodovat)
    for misto in serazeno:
        for zavodnik in misto:
            socketio.emit('zavod', {'stav': 'hodnoceni', 'trasa': trasa, 'start': start, 'formule': zavodnik[1], 'zisk': int(0.5 * maxzisk)}, to=usernames.get(zavodnik[0]))
            tabulka(zavodnik[0], 'body', int(0.5 * maxzisk))
            #TODO: udělat příjem emit a  uložit do tabulky body



def ZavodNalezeni(cislo, data, konechry):
    for zavod in data[:]:
        if zavod[1] == cislo:
            trasa = zavod[0]
            data.pop(data.index(zavod))
            for i in range(len(a)):
                if a[i][0] == trasa and a[i][1] == cislo:
                    index = i
            socketio.start_background_task(ZahajZavod, trasa, cislo, konechry, index)
    return data

def casovac(tym, cas):
    NulujTabulku()
    global herni_stav
    global a
    for i in range(len(a)):
        a[i][2] = []
    data = copy.deepcopy(a)
    casy = copy.deepcopy(b)
    ZpravaVsem('Hra zacina', 'hra')
    herni_stav = 'bezi'
    konec = time.time() + cas
    while True:
        zbyva = int(konec - time.time())
        for cislo in casy[:]:
            if cislo >= zbyva/min-10:
                casy.pop(casy.index(cislo))
                data = ZavodNalezeni(cislo, data, konec)
                break
        if zbyva <= 0:
            socketio.emit('casovac', {'cas': '00:00:00'}, to=usernames.get(tym))
            ZpravaVsem('Hra konci', 'hra')
            herni_stav = 'nebezi'
            break
        h = zbyva // 3600
        m = (zbyva % 3600) // 60
        s = zbyva % 60
        socketio.emit('casovac', {'cas': f'{h:02d}:{m:02d}:{s:02d}'}, to=usernames.get(tym))
        socketio.sleep(1 - (time.time() % 1))

def PosliTabulkuEditorovi():
    Editor = usernames.get('Editor')
    if Editor:
        df = pd.read_csv("tymy.csv")
        columns = ['tym'] + [col for col in df.columns if col != 'tym']
        data = df[columns].to_dict(orient='records')
        
        socketio.emit('tabulka', {'columns': columns, 'rows': data}, to=Editor)

def tabulka(tym, pole, cislo):
    df = pd.read_csv("tymy.csv")
    df.set_index('tym', inplace=True)
    df.loc[tym, pole] = int(df.loc[tym, pole]) + cislo
    if df.loc[tym, pole]<0:
        return False
    df.to_csv('tymy.csv', index=True)
    PosliTabulkuEditorovi()
    
    return str(df.loc[tym, pole])



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
    if heslo == 'Proud2025' and username != 'Editor':
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
        df.loc[tym] = [0, 0, 0, 0, 0, 0, 0]           # nastavení základních hodnot
        df.to_csv('tymy.csv', index=True)
    emit('penize', {'penize': str(df.loc[tym, 'penize'])})
    emit('pocetuloh', {'pocetuloh': str(df.loc[tym, 'ulohy'])})
    for faktor in ['A_motor','A_brzda','B_motor','B_brzda']:
        emit('faktory', {'faktor': faktor, 'cislo': str(df.loc[tym, faktor]), 'dalsicena': str(25*(df.loc[tym, faktor]+2))})
    PosliTabulkuEditorovi()

#@socketio.on('connect') # automaticky zavoláno při připojení - pokud nereaguji, není třeba mít.
#def handle_connect():
    #print('Připojen:', request.sid)

@socketio.on('register_username')
def handle_register_username(data):
    username = data.get('username')
    if username:
        usernames[username] = request.sid
        sid_to_username[request.sid] = username
        print(f'{username} přihlášen jako {request.sid}')
        update_online_users()
        df = pd.read_csv("tymy.csv")
        if herni_stav == 'bezi' and username in df['tym'].values:
            emit('hra', {'zprava':'Hra zacina'})

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    username = sid_to_username.pop(sid, None)
    if username and username in usernames:
        del usernames[username]
        print('Odpojeno:', sid, "tedy:", username)
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
    else:
        emit('chyba', {'zprava':"Cíl zprávy není přihlášený."})

@socketio.on('uloha')
def uloha(data=None):
    username = sid_to_username.get(request.sid)
    tabulka(username, 'body', 50) # body za úlohu
    emit('penize', {'penize': tabulka(username, 'penize', 50)})
    emit('pocetuloh', {'pocetuloh': tabulka(username, 'ulohy', 1)})

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



#   ZAVODU

@socketio.on('prihlaszavod')
def prihlaszavod(data):
    tym = sid_to_username.get(request.sid)
    trasa = data['trasa']
    start = float(data['start'])
    formule = data['formule']
    df = pd.read_csv("zavody.csv", encoding='utf-8')
    df.set_index('stat', inplace=True)
    cas = int(df.loc[trasa, 'cas']) # čas jízdy v minutách
    global a
    for i in range(len(a)):
        if a[i][0]== trasa and a[i][1] == start:
            if [tym,formule] not in a[i][2]:
                s = True
                for j in range(len(a)):
                    if not(start + cas < a[j][1] or start > a[j][1] + df.loc[a[j][0], 'cas']) and [tym,formule] in a[j][2]:
                        s = False
                        break
                if s:
                    a[i][2].append([tym,formule])
                    emit('zavod', {'stav': 'start', 'cas': '00:00:00', 'trasa': trasa, 'start':start})
                    #emit('chyba', {'zprava': f'Úspěšně přihlášeno do závodu! {trasa}, {cas}'})
                else:
                    emit('chyba', {'zprava': 'Závod se překrývá s jiným závodem ve kterém máš formuli!'})
            else:
                emit('chyba', {'zprava': 'Již přihlášeno do závodu!'})
            index = i
            break

#   CASOMIRY

@socketio.on('start_timer')
def start_timer(data):
    socketio.start_background_task(casovac, sid_to_username.get(request.sid), data['cas'] * min)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=10000)
