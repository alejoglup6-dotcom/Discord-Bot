#!/usr/bin/env python3
"""
PDF de permisos y comandos por rango y facción (juego + Discord) de SampCity.

Lee los datos de verdad: comandos y flags del gamemode (repo Backup), descripciones del menú de comandos
(command_menu_data.pwn), rangos y vehículos de las facciones (snrp.pwn, facciones.pwn), y del Discord los permisos de
cada rol y quién ve cada categoría/canal (API con el token del bot). Saca un HTML y lo pasa a PDF con Chromium.

Uso: python3 docs/permisos/generar.py <ruta repo Backup> <roles.json> <chans.json> <salida.pdf>
  (los JSON de Discord: GET /guilds/<id>/roles y /guilds/<id>/channels). Deja <salida>.html; el PDF lo hace pdf.js.
"""
import glob, html, json, os, re, subprocess, sys, datetime

BACKUP, ROLES_JSON, CHANS_JSON, OUT = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
HERE = os.path.dirname(os.path.abspath(__file__))
BRAND = os.path.join(HERE, "..", "..", "branding")
GUILD = "1547828378961317938"
e = html.escape


def noemoji(s):
    s = re.sub(r"[\U00010000-\U0010FFFF☀-➿️‍⭐⭕⌚-⏿←-⇿┆¦]", "", s)
    return s.strip()


# ------------------------------------------------------------------ datos del juego
FL = {"CMD_USER": 0, "CMD_HELPER": 2, "CMD_HELPER_MODERATOR": 3, "CMD_MODERATOR": 4, "CMD_ADMINISTRATOR": 5, "CMD_DEVELOPER": 7, "CMD_DISABLED": 100}
files = [os.path.join(BACKUP, "gamemodes/snrp.pwn")] + sorted(glob.glob(os.path.join(BACKUP, "gamemodes/src/*.pwn")))
flags, aliases, usage, bodies = {}, {}, {}, {}
for f in files:
    s = open(f, encoding="latin-1").read()
    for m in re.finditer(r"^flags:(\w+)\(([^)]*)\)", s, re.M):
        v = m.group(2).strip()
        flags[m.group(1)] = FL.get(v, int(v) if v.isdigit() else 100)
    for m in re.finditer(r"^alias:(\w+)\(([^)]*)\)", s, re.M):
        aliases[m.group(1)] = re.findall(r'"(\w+)"', m.group(2))
    for m in re.finditer(r"^CMD:(\w+)\(playerid[^)]*\)\s*\{(.*?)^\}", s, re.M | re.S):
        bodies[m.group(1)] = m.group(2)
        u = re.search(r'Modo de uso:?(?:~w~)?\s*([^"]+)"', m.group(2)) or re.search(r'Uso:\s*([^"]+)"', m.group(2))
        if u:
            usage[m.group(1)] = re.sub(r"~\w~", "", u.group(1)).strip()
for n, b in bodies.items():
    m = re.findall(r"pi_ADMIN_LEVEL\]\s*<\s*(\d+)\)\s*return", b)
    if m and n not in flags:
        flags[n] = int(m[0])

menu = {}
s = open(os.path.join(BACKUP, "gamemodes/src/command_menu_data.pwn"), encoding="utf-8", errors="replace").read()
for name, cat, desc in re.findall(r'\{"(\w+)",\s*(CATMENU_\w+),.*?"((?:[^"\\]|\\.)*)"\}', s):
    menu[name] = {"cat": cat, "desc": desc}

ADMIN_LEVELS = ["Ciudadano", "Soporte", "Ayudante", "Moderador", "Moderador Global", "Administrador", "Encargado de Staff", "Desarrollador", "Co-Fundador", "Fundador"]
STAFF_ROLE = ["", "SOPORTE", "AYUDANTE", "MODERADOR", "MODERADOR GLOBAL", "ADMINISTRADOR", "ENCARGADO STAFF", "DESARROLLADOR", "CO-FUNDADOR", "FUNDADOR"]


def desc(c):
    if c in menu:
        return menu[c]["desc"]
    return ""


def cmdline(c):
    a = aliases.get(c, [])
    al = f' <span class="al">({", ".join("/" + x for x in a)})</span>' if a else ""
    us = usage.get(c, "")
    us = f'<div class="us">{e(us)}</div>' if us else ""
    d = desc(c)
    return f'<tr><td class="c">/{e(c)}{al}</td><td>{e(d)}{us}</td></tr>'


# Facciones: rangos (snrp.pwn) y vehículos por rango (facciones.pwn)
def ranks(name):
    s = open(os.path.join(BACKUP, "gamemodes/snrp.pwn"), encoding="latin-1").read()
    m = re.search(r"new\s+" + name + r"\s*\[\]\s*\[[^\]]*\]\s*=\s*\{(.*?)\};", s, re.S)
    return re.findall(r'"([^"]*)"', m.group(1))[1:]


fac_src = open(os.path.join(BACKUP, "gamemodes/src/facciones.pwn"), encoding="latin-1").read()
vehicles = {}
for fact, rank, kind, name in re.findall(r"\{FACTIONS_(\w+),\s*(\d+),\s*\d+,\s*FG_(\w+),[^}]*\},?\s*//\s*([^\n]+)", fac_src):
    vehicles.setdefault(fact, []).append((int(rank), name.strip(), kind))
LSSD_AS_SAPD = [int(x) for x in re.search(r"LSSD_AS_SAPD\[\]\s*=\s*\{([^}]*)\}", fac_src).group(1).split(",")]

LAW = ["esposar", "placa", "revisar", "puntos", "requisar", "ref", "multar", "arrestar", "miranda", "m", "entregar", "abyc", "byc"]
FACTIONS = [
    {"id": 1, "key": "SAPD", "name": "LSPD · Policía de Los Santos", "ranks": ranks("POLICE_RANKS"), "duty": "/policia (uniforme y servicio)", "law": True},
    {"id": 2, "key": "FBI", "name": "FBI", "ranks": ranks("FBI_RANKS"), "duty": "/fbi (uniforme y servicio)", "law": False},
    {"id": 3, "key": "SAEM", "name": "SAEM · Ejército", "ranks": ranks("SAEM_RANKS"), "duty": "/militar (uniforme y servicio)", "law": False},
    {"id": 4, "key": "LSSD", "name": "LSSD · Sheriff", "ranks": ranks("LSSD_RANKS"), "duty": "/fservicio o /sheriff", "law": True},
    {"id": 5, "key": "CITYTV", "name": "CITYTV · Noticias", "ranks": ranks("CITYTV_RANKS"), "duty": "/fservicio o /citytv", "law": False},
    {"id": 6, "key": "GOB", "name": "Gobierno", "ranks": ranks("GOB_RANKS"), "duty": "/fservicio o /gobierno", "law": False},
]


def law_rank_needed(fac, sapd_level):
    """Primer rango de la facción que llega al nivel de la escala de la SAPD."""
    if fac["key"] == "SAPD":
        return sapd_level
    for r, lv in enumerate(LSSD_AS_SAPD):
        if r and lv >= sapd_level:
            return r
    return None


def faction_section(f):
    max_r = len(f["ranks"])
    veh = {}
    for r, n, k in vehicles.get(f["key"], []):
        veh.setdefault(r, []).append(n + (" (aire)" if k == "AIR" else " (agua)" if k == "WATER" else ""))
    rows = "".join(
        f'<tr><td class="n">{i + 1}</td><td><b>{e(r)}</b>{" · jefe" if i + 1 == max_r else ""}</td><td>{e(", ".join(veh.get(i + 1, [])) or "-")}</td></tr>'
        for i, r in enumerate(f["ranks"])
    )
    cmds = [("Todos los rangos", f["duty"] + "; radio de la facción: escribir con ! (" + ("la policía usa la suya de servicio" if f["key"] == "SAPD" else "/fr") + "); /garaje en el garaje de la facción (vehículos de su rango y de los de abajo)")]
    if f["law"]:
        r1 = law_rank_needed(f, 1)
        cmds.append((f"Rango {r1}+ de servicio", "Poderes de policía: " + ", ".join("/" + c for c in LAW) + ", /cepo, /equiparse"))
        cmds.append((f"Rango {law_rank_needed(f, 2)}+ ({f['ranks'][law_rank_needed(f, 2) - 1]})", "/nivel (poner nivel de búsqueda)"))
        if f["key"] == "SAPD":
            cmds.append(("Rango 3+ (" + f["ranks"][2] + ")", "/allanar (forzar la puerta de una propiedad)"))
        cmds.append((f"Rango {law_rank_needed(f, 9)}+ ({f['ranks'][law_rank_needed(f, 9) - 1]})", "/control y /econtrol (controles de carretera)"))
        cmds.append((f"Rango {law_rank_needed(f, 12)} ({f['ranks'][law_rank_needed(f, 12) - 1]})", "/callsing, /dbyc"))
    if f["key"] in ("FBI", "SAEM"):
        cmds.append(("Todos los rangos", "/equiparse (armería de la facción)"))
    if f["key"] == "CITYTV":
        cmds.append(("Todos los rangos, de servicio", "/noticia <texto> (anuncio a todo el servidor, 1 por minuto)"))
    if f["key"] == "GOB":
        cmds.append(("Rango 3+ (" + f["ranks"][2] + ")", "/gob <anuncio> (anuncio del Gobierno a todo el servidor, 1 por minuto)"))
    cmds.append((f"Jefe (rango {max_r}: {f['ranks'][-1]})", "/reclutar <id> (entra con rango 1) y /miembros (subir, bajar o expulsar, conectado o no)"))
    crow = "".join(f'<tr><td class="c">{e(a)}</td><td>{e(b)}</td></tr>' for a, b in cmds)
    note = ""
    if f["key"] == "LSSD":
        note = '<p class="note">El Sheriff de servicio usa los comandos de policía con su rango pasado a la escala de la policía: ' + ", ".join(
            f"{f['ranks'][r - 1]} = {ranks('POLICE_RANKS')[LSSD_AS_SAPD[r] - 1]}" for r in range(1, len(LSSD_AS_SAPD))) + ". /allanar es solo de la LSPD.</p>"
    if f["key"] in ("FBI", "SAEM"):
        note = '<p class="note">No tienen los poderes de policía (/esposar, /multar, /arrestar...): esos son de la LSPD y del Sheriff de servicio.</p>'
    return f"""<section class="fac"><h3>{e(f['name'])} <span class="tag">facción {f['id']}</span></h3>
<table class="t"><tr><th>#</th><th>Rango</th><th>Vehículos que desbloquea en /garaje</th></tr>{rows}</table>
<table class="t cmd"><tr><th>Quién</th><th>Comandos</th></tr>{crow}</table>{note}
<p class="give">Dar: <code>/setfact &lt;id&gt; {f['id']} &lt;1-{max_r}&gt;</code> (staff, Administrador+) · Discord: <code>/juego faccion</code> (Fundador) · Quitar: <code>/delfact &lt;id&gt;</code></p></section>"""


# ------------------------------------------------------------------ datos de Discord
P = {"Administrador": 1 << 3, "Gestionar servidor": 1 << 5, "Gestionar roles": 1 << 28, "Gestionar canales": 1 << 4, "Expulsar": 1 << 1, "Banear": 1 << 2,
     "Aislar": 1 << 40, "Gestionar mensajes": 1 << 13, "Mencionar @everyone": 1 << 17, "Mover en voz": 1 << 24, "Silenciar en voz": 1 << 22,
     "Gestionar apodos": 1 << 27, "Registro de auditoría": 1 << 7}
roles = sorted(json.load(open(ROLES_JSON)), key=lambda r: -r["position"])
rname = {r["id"]: noemoji(r["name"]) for r in roles}
chans = json.load(open(CHANS_JSON))
by = {c["id"]: c for c in chans}


def perms_of(r):
    p = int(r["permissions"])
    l = [k for k, v in P.items() if p & v]
    return ["Administrador (todo)"] if "Administrador" in l else l


def who(c, bit):
    return [rname.get(o["id"], o["id"]) for o in c.get("permission_overwrites", []) if int(o["allow"]) & bit and o["id"] != GUILD]


def hidden(c):
    return any(o["id"] == GUILD and int(o["deny"]) & 1024 for o in c.get("permission_overwrites", []))


STAFF_ORDER = ["FUNDADOR", "CO-FUNDADOR", "DESARROLLADOR", "ENCARGADO STAFF", "ADMINISTRADOR", "MODERADOR GLOBAL", "MODERADOR", "AYUDANTE", "SOPORTE"]
STAFF_NAMES = set(STAFF_ORDER)


def short(lst):
    st = [x for x in STAFF_ORDER if x in lst]
    other = sorted(x for x in lst if x not in STAFF_NAMES)
    out = []
    if st:
        out.append("staff (" + ", ".join(st) + ")")
    out += other
    return "; ".join(out) or "-"


# ------------------------------------------------------------------ HTML
today = datetime.date.today().strftime("%d/%m/%Y")
font = lambda n: "file://" + os.path.abspath(os.path.join(BRAND, "fonts", n))
logo = "file://" + os.path.abspath(os.path.join(BRAND, "marca", "logo-principal.png"))

# 1) staff por nivel
staff_rows = []
for lv in range(1, 10):
    cmds = sorted(c for c, v in flags.items() if v == lv)
    extra = {
        1: "Entra a 🎫 TICKETS y atiende tickets. /duty (servicio de staff: teletransporte con el mapa).",
        6: "Sin comandos nuevos en el juego: los de Administrador. En Discord: categoría DIRECCIÓN.",
        8: "Sin comandos nuevos en el juego: los de Desarrollador. En Discord: Administrador (todo).",
        9: "Sin comandos nuevos en el juego: los de Desarrollador. Discord: Administrador (todo) y /juego (comandos del juego desde Discord). En el juego, /dameadmin con RCON da este nivel.",
    }.get(lv, "")
    table = "".join(cmdline(c) for c in cmds)
    staff_rows.append(
        f"""<section class="lvl"><h3><span class="num">{lv}</span> {e(ADMIN_LEVELS[lv])} <span class="tag">rol {e(STAFF_ROLE[lv])}</span></h3>
<p class="sub">{len(cmds)} comando(s) nuevo(s) en este nivel; además tiene todos los de los niveles de abajo. {e(noemoji(extra))}</p>
{('<table class="t cmd"><tr><th>Comando</th><th>Para qué sirve / uso</th></tr>' + table + '</table>') if cmds else ''}</section>"""
    )

# 2) comandos de todos los jugadores, por categoría
CATS = {"CATMENU_AYUDA_SISTEMA_CUENTA": "Ayuda y cuenta", "CATMENU_COMUNICACION_SOCIAL": "Comunicación", "CATMENU_ECONOMIA_TRABAJO": "Economía y trabajo",
        "CATMENU_VEHICULOS": "Vehículos", "CATMENU_PROPIEDADES_NEGOCIOS": "Propiedades y negocios", "CATMENU_INVENTARIO_OBJETOS": "Inventario",
        "CATMENU_ESTADOS_ROLEPLAY": "Rol y estados", "CATMENU_ANIMACIONES": "Animaciones", "CATMENU_GPS_MAPA": "GPS y mapa",
        "CATMENU_FACCIONES_BANDAS": "Facciones y bandas", "CATMENU_VIP": "VIP", "CATMENU_EVENTOS": "Eventos"}
user_cats = {}
for c, m in sorted(menu.items()):
    if c in flags or m["cat"] in ("CATMENU_ADMINISTRACION", "CATMENU_TRABAJOS_POLICIA", "CATMENU_DUAL_REF") or c not in bodies:
        continue
    cat = CATS.get(m["cat"], "Trabajos" if m["cat"].startswith("CATMENU_TRABAJOS") else "Otros")
    user_cats.setdefault(cat, []).append(c)
users_html = "".join(
    f'<section class="ucat"><h4>{e(cat)}</h4><table class="t cmd small">' + "".join(cmdline(c) for c in cs) + "</table></section>"
    for cat, cs in user_cats.items()
)

# 3) Discord
role_rows = "".join(
    f'<tr><td><b>{e(noemoji(r["name"]))}</b></td><td>{e(", ".join(perms_of(r)))}</td></tr>'
    for r in roles if not r.get("managed") and r["name"] != "@everyone" and perms_of(r)
)
cat_rows = ""
for c in sorted([c for c in chans if c["type"] == 4], key=lambda c: c["position"]):
    if not hidden(c):
        cat_rows += f'<tr><td><b>{e(noemoji(c["name"]))}</b></td><td>Todos (sin verificar también)</td></tr>'
    else:
        cat_rows += f'<tr><td><b>{e(noemoji(c["name"]))}</b></td><td>{e(short(who(c, 1024)))}</td></tr>'
fac_chan_rows = ""
for catname in ["LSPD", "SASD", "FBI", "MILICIA", "CITYTV", "GOB", "LÍDERES"]:
    for c in sorted([c for c in chans if noemoji(by.get(c.get("parent_id"), {}).get("name", "")) == catname and c["type"] != 4], key=lambda c: c["position"]):
        fac_chan_rows += f'<tr><td>{e(catname)}</td><td><b>{e(noemoji(c["name"]))}</b></td><td>{e(short(who(c, 1024)))}</td><td>{e(short(who(c, 2048))) if who(c, 2048) else ("hablar en voz" if c["type"] == 2 else "los que lo ven")}</td></tr>'

disc_cmds = [
    ("Todos (cuenta vinculada)", "/samp link, unlink, profile, online, top · abrir tickets en el canal de soporte"),
    ("Ayudante (2+) en el juego", "/samp mute, /samp unmute"),
    ("Moderador (3+)", "/samp jail, unjail, advertir, quitaradv · /whitelist agregar, quitar, lista, estado"),
    ("Moderador Global (4+)", "/samp tempban, unban · /whitelist activar, desactivar, mensaje"),
    ("Administrador (5+)", "/samp ban"),
    ("Encargado de Staff (6+)", "/samp socio (membresía Socio)"),
    ("Fundador (9)", "/juego: dinero, banco, coins, nivel, staff, skin, nombre, clave, facción, VIP, vida, chaleco, revivir, congelar, arma, dinero negro, expulsar, anuncio"),
    ("Rol SOPORTE o Gestionar mensajes", "Atender tickets: atender, prioridad, cerrar con motivo, transcripción, /tickets add/remove/rename... Reportes avisan a Moderador+, apelaciones a Moderador Global+ y tienda a Administrador+"),
    ("Permiso de Discord", "Moderación del bot: /moderation ban, tempban, softban, unban, banlist (Banear) · kick (Expulsar) · timeout (Aislar) · clear, warn, warnings, unwarn (Gestionar mensajes) · lock, unlock, lockdown, nuke (Gestionar canales)"),
    ("Gestionar servidor", "/tiktok add, remove, list (creadores de TikTok) y la configuración del bot (/setup, /config...)"),
    ("Dueño del servidor", "/reorganizar · /backup (y los de BACKUP_OWNERS)"),
]
disc_cmd_rows = "".join(f'<tr><td class="c">{e(a)}</td><td>{e(b)}</td></tr>' for a, b in disc_cmds)

warn = []
for r in roles:
    n = noemoji(r["name"])
    if n == "DESARROLLADOR" and not perms_of(r):
        warn.append("El rol DESARROLLADOR no tiene permisos ni acceso a STAFF, DIRECCIÓN, LOGS ni DESARROLLO (lo creó el bot en blanco): conviene darle lo mismo que a ENCARGADO STAFF.")
    if n == "BETA" and perms_of(r) and "Gestionar servidor" in perms_of(r):
        warn.append("El rol BETA tiene permisos de administración (gestionar servidor, roles, canales, banear...). Si es solo para beta testers, conviene quitárselos.")
warn_html = "".join(f"<li>{e(w)}</li>" for w in warn)

staff_table = "".join(
    f'<tr><td class="n">{i}</td><td><b>{e(ADMIN_LEVELS[i])}</b></td><td>{e(STAFF_ROLE[i] or "-")}</td></tr>' for i in range(10)
)

htmldoc = f"""<!doctype html><html lang="es"><head><meta charset="utf-8"><title>SampCity · Permisos y comandos</title><style>
@font-face{{font-family:P;src:url('{font("Poppins-ExtraBold.ttf")}')}}
@font-face{{font-family:PB;src:url('{font("Poppins-Black.ttf")}')}}
@page{{size:A4;margin:14mm 12mm 16mm}}
body{{font-family:'DejaVu Sans',Arial,sans-serif;font-size:9.2pt;color:#1a0612;margin:0}}
h1,h2,h3,h4{{font-family:PB,Arial;margin:0}}
h2{{font-size:17pt;color:#fff;background:#1a0612;padding:7px 12px;border-left:8px solid #E8392F;margin:0 0 10px;break-after:avoid}}
h3{{font-size:12pt;margin:12px 0 4px;color:#1a0612;break-after:avoid}}
h4{{font-size:10pt;margin:8px 0 3px;color:#b02a22}}
.tag{{font-family:P,Arial;font-size:8pt;background:#E8392F;color:#fff;border-radius:3px;padding:1px 6px;vertical-align:middle}}
.num{{display:inline-block;background:#1a0612;color:#fff;border-radius:50%;width:22px;height:22px;text-align:center;line-height:22px;font-size:10pt}}
table.t{{width:100%;border-collapse:collapse;margin:4px 0 8px}}
.t th{{background:#3a0d18;color:#fff;text-align:left;font-family:P,Arial;font-size:8.5pt;padding:4px 6px}}
.t td{{border-bottom:1px solid #ecd9dc;padding:3px 6px;vertical-align:top}}
.t tr:nth-child(even) td{{background:#fbf3f4}}
.t td.c{{font-family:'DejaVu Sans Mono',monospace;font-size:8.6pt;white-space:nowrap;width:28%;color:#7a1a14}}
.t td.n{{width:22px;text-align:center;font-weight:bold}}
.small td{{font-size:8.2pt;padding:2px 5px}}
.us{{font-family:'DejaVu Sans Mono',monospace;font-size:7.6pt;color:#6b5a5d}}
.al{{color:#9a7c80;font-size:7.6pt}}
.sub,.note,.give{{margin:2px 0 6px;color:#4b3a3d}}
.note{{background:#fff6e5;border-left:4px solid #FFB35C;padding:4px 8px}}
.give code,code{{font-family:'DejaVu Sans Mono',monospace;background:#f3e6e8;padding:0 3px;border-radius:2px}}
section.lvl,section.fac{{break-inside:avoid-page}}
.ucat{{break-inside:avoid-page}}
.cover{{height:265mm;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;
 background:linear-gradient(180deg,#1A0612 0%,#5A0F1F 55%,#D9442F 85%,#FFB35C 100%);color:#fff;break-after:page;margin:-14mm -12mm 0;padding:0 18mm}}
.cover img{{width:120mm}} .cover h1{{font-size:30pt;margin-top:8mm;text-shadow:0 3px 0 #000}} .cover p{{font-family:P,Arial;font-size:12pt;max-width:150mm}}
.toc{{margin-top:10mm;text-align:left;font-family:P,Arial;font-size:11pt;background:rgba(0,0,0,.35);padding:8px 18px;border-radius:8px}}
.page{{break-before:page}}
ul.warn li{{margin:3px 0}}
</style></head><body>
<div class="cover"><img src="{logo}"><h1>PERMISOS Y COMANDOS</h1><p>Qué puede hacer cada rango del staff y cada rango de facción, en el juego y en Discord.</p>
<div class="toc">1. Rangos del staff<br>2. Comandos del staff por nivel (juego)<br>3. Facciones: rangos, vehículos y comandos<br>4. Discord: roles, permisos y canales<br>5. Comandos del bot y quién los usa<br>6. Comandos de todos los jugadores<br>7. Avisos</div>
<p style="font-size:9pt;margin-top:8mm">Generado el {today} con los datos del gamemode y del Discord de ese día · sampcity.app</p></div>

<h2>1. Rangos del staff</h2>
<p class="sub">El nivel se guarda en la cuenta del juego (<code>admin_level</code>) y el rol de Discord se pone solo en segundos (cuentas vinculadas). Cada nivel puede todo lo de los niveles de abajo.
Se da en el juego con <code>/givemod &lt;id&gt; &lt;nivel&gt;</code> (o <code>/staff</code>, Administrador+, nunca uno mayor que el propio) o desde Discord con <code>/juego staff</code> (Fundador).</p>
<table class="t" style="width:60%"><tr><th>#</th><th>Nivel</th><th>Rol de Discord</th></tr>{staff_table}</table>

<h2 class="page">2. Comandos del staff por nivel (juego)</h2>
<p class="sub">Solo los que se desbloquean en cada nivel. Los que no dicen el uso se usan sin datos o abren un menú.</p>
{''.join(staff_rows)}

<h2 class="page">3. Facciones: rangos, vehículos y comandos</h2>
<p class="sub">Una persona solo puede estar en una facción. El número de facción y de rango es el que se usa en los comandos. Los roles de Discord (uno por rango y uno de grupo) se ponen solos a las cuentas vinculadas.</p>
{''.join(faction_section(f) for f in FACTIONS)}

<h2 class="page">4. Discord: roles, permisos y canales</h2>
<h3>Roles con permisos de moderación</h3>
<table class="t"><tr><th>Rol</th><th>Permisos de Discord</th></tr>{role_rows}</table>
<h3>Quién ve cada categoría</h3>
<p class="sub">Sin verificar (sin cuenta del juego vinculada) solo se ven las categorías abiertas. USUARIO = cuenta vinculada.</p>
<table class="t"><tr><th>Categoría</th><th>La ven</th></tr>{cat_rows}</table>
<h3>Canales de las facciones</h3>
<table class="t small"><tr><th>Facción</th><th>Canal</th><th>Lo ven</th><th>Escriben</th></tr>{fac_chan_rows}</table>

<h2 class="page">5. Comandos del bot y quién los usa</h2>
<p class="sub">Los comandos ligados al juego miran el nivel de staff de la cuenta vinculada (no el rol de Discord). Los demás, el permiso de Discord.</p>
<table class="t cmd"><tr><th>Quién</th><th>Comandos</th></tr>{disc_cmd_rows}</table>

<h2 class="page">6. Comandos de todos los jugadores</h2>
<p class="sub">Del menú de comandos del juego. Algunos piden además un trabajo, una propiedad o estar en un sitio.</p>
<div class="ucats">{users_html}</div>

<h2 class="page">7. Avisos</h2>
<ul class="warn">{warn_html or '<li>Nada que avisar.</li>'}</ul>
</body></html>"""
tmp = OUT.replace(".pdf", ".html")
open(tmp, "w").write(htmldoc)
print("html", tmp, len(htmldoc))
