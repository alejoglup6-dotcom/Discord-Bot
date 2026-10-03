# Tabla única de rangos: juego ↔ Discord

Hecha el 03/10/2026 comparando los 129 roles del servidor de Discord **SampCity | FASE BETA** (leídos con el bot)
con el gamemode (`snrp.pwn`, repo Backup) y la base de datos. Idea: **cada rango existe en los dos lados con el mismo
nombre**. Si falta en uno, se crea; si existe con otro nombre, se unifica.

**Leyenda:** ✅ ya existe · 🆕 hay que crearlo · ✏️ existe con otro nombre (se unifica) · ➖ no aplica en ese lado

**Sincroniza:**
- **Juego → Discord:** el dato vive en el juego; el bot pone o quita el rol a quien tenga la cuenta vinculada.
- **Discord → Juego:** el staff da el rol en Discord y el juego lo muestra (insignia, etiqueta o permiso).
- **Ambos:** se puede dar en cualquiera de los dos lados y se copia al otro.

---

## 1. Dirección y staff (`player.admin_level`)

Hoy el juego tiene 6 niveles (0–5) y Discord tiene 8 roles de mando. Escala unificada:

| Nivel | Juego | Discord | Qué hay que hacer | Sincroniza |
|---|---|---|---|---|
| 0 | ✅ Ciudadano | ✅ 👤 USUARIO | Se da al vincular la cuenta (verificado) | Juego → Discord |
| 1 | 🆕 Soporte | ✅ 🎫 SOPORTE | Crear el nivel en el juego (solo canal de dudas y `/tickets`) | Juego → Discord |
| 2 | ✅ Ayudante | ✅ 🙋 AYUDANTE | — | Juego → Discord |
| 3 | ✅ Moderador | ✅ 🧑‍💻 MODERADOR | — | Juego → Discord |
| 4 | ✏️ Operador | ✏️ 👨‍💻 MODERADOR GLOBAL | Unificar como **Moderador Global** | Juego → Discord |
| 5 | ✅ Administrador | ✅ 🛡️ ADMINISTRADOR | — | Juego → Discord |
| 6 | 🆕 Encargado de Staff | ✅ ⭕ ENCARGADO STAFF | Crear el nivel en el juego | Juego → Discord |
| 7 | ✅ Desarrollador | 🆕 🛠️ DESARROLLADOR | Crear el rol en Discord | Juego → Discord |
| 8 | 🆕 Co-Fundador | ✅ ⚜️ CO-FUNDADOR | Crear el nivel en el juego | Juego → Discord |
| 9 | 🆕 Fundador | ✅ 🔱 FUNDADOR | Crear el nivel en el juego | Juego → Discord |

> Los niveles cambian de número: hay que migrar `admin_level` (1→2, 2→3, 3→4, 4→5, 5→7) en la misma subida que el
> gamemode, el bot y la web. Los permisos de cada comando se mantienen para el mismo rango.

### Cargos del staff (además del nivel; una persona puede tener varios)

| Juego | Discord | Qué hay que hacer | Sincroniza |
|---|---|---|---|
| 🆕 Evaluador de facciones | ✅ 📝 EVALUADOR DE FACCIONES | Crear cargos en el juego (tabla `staff_roles`, se ven en `/admins`) | Ambos |
| 🆕 Staff RPG | ✅ 🎮 STAFF RPG | Crear el cargo | Ambos |
| 🆕 Staff CV | ✅ 🎙️ STAFF CV | Crear el cargo | Ambos |
| 🆕 Organizador de eventos | ✅ 🎪 ORGANIZADOR DE EVENTOS | Crear el cargo (y permiso para `eventos.pwn`) | Ambos |
| 🆕 Scripter | ✅ 💻 SCRIPTER | Crear el cargo | Ambos |
| 🆕 Mapper | ✅ 🗺️ MAPPER | Crear el cargo (y permiso para `/puntosmapa`) | Ambos |

---

## 2. Facciones

En cada facción, todos llevan el **rol de la facción** y, además, el de **su rango**. El rango más alto es el jefe.

### Policía (juego: SAPD, `FACTIONS_SAPD`)

| Rango | Juego | Discord | Qué hay que hacer |
|---|---|---|---|
| Facción | ✅ SAPD | ✅ 👮 POLICIA | — |
| 1 | ✅ Cadete | 🆕 Cadete (Policía) | Crear el rol |
| 2 | ✅ Oficial I | 🆕 Oficial I | Crear el rol |
| 3 | ✅ Oficial II | 🆕 Oficial II | Crear el rol |
| 4 | ✅ Oficial III | 🆕 Oficial III | Crear el rol |
| 5 | ✅ Detective I | 🆕 Detective I | Crear el rol |
| 6 | ✅ Detective II | 🆕 Detective II | Crear el rol |
| 7 | ✅ Sargento | 🆕 Sargento (Policía) | Crear el rol |
| 8 | ✅ Capitán | 🆕 Capitán (Policía) | Crear el rol |
| 9 (jefe) | ✏️ Jefe Policía | ✏️ 👮 COMISARIO | Unificar como **Comisario** |

### FBI (`FACTIONS_FBI`)

| Rango | Juego | Discord | Qué hay que hacer |
|---|---|---|---|
| Facción | ✅ FBI | ✅ 🕵 FBI | — |
| 1 | ✅ Agente | 🆕 Agente | Crear el rol |
| 2 | ✅ Agente al mando | 🆕 Agente al mando | Crear el rol |
| 3 | ✅ Asistente | 🆕 Asistente | Crear el rol |
| 4 | ✅ Asistente al mando | 🆕 Asistente al mando | Crear el rol |
| 5 | ✅ Ejecutivo | 🆕 Ejecutivo | Crear el rol |
| 6 | ✅ Sub director | 🆕 Sub director | Crear el rol |
| 7 (jefe) | ✅ Director | ✅ 🕵 DIRECTOR | — |

### Militares (juego: SAEM, `FACTIONS_SAEM`; canal: milicia)

| Rango | Juego | Discord | Qué hay que hacer |
|---|---|---|---|
| Facción | ✅ SAEM | ✅ 🪖 MILITAR | — |
| 1 | ✅ Cadete | 🆕 Cadete (Militar) | Crear el rol |
| 2 | ✅ Soldado | 🆕 Soldado | Crear el rol |
| 3 | ✅ Cabo | 🆕 Cabo | Crear el rol |
| 4 | ✅ Teniente | 🆕 Teniente (Militar) | Crear el rol |
| 5 | ✅ Capitán | 🆕 Capitán (Militar) | Crear el rol |
| 6 | ✏️ General (sub jefe) | 🆕 Coronel | En el juego pasa a llamarse **Coronel** (sub jefe) |
| 7 (jefe) | ✏️ Coronel (jefe) | ✅ 🪖 GENERAL | En el juego pasa a llamarse **General** (jefe), igual que en Discord y como en un ejército real |

### Sheriff (🆕 facción nueva en el juego: LSSD)

| Rango | Juego | Discord | Qué hay que hacer |
|---|---|---|---|
| Facción | 🆕 LSSD | ✏️ 🎖 ALGUACIL | El rol de facción pasa a ser **ALGUACIL**; hoy está por encima de SHERIFF y hay que invertirlos |
| 1 | 🆕 Cadete | 🆕 Cadete (Sheriff) | Crear en los dos lados |
| 2 | 🆕 Alguacil I | 🆕 Alguacil I | Crear en los dos lados |
| 3 | 🆕 Alguacil II | 🆕 Alguacil II | Crear en los dos lados |
| 4 | 🆕 Sargento | 🆕 Sargento (Sheriff) | Crear en los dos lados |
| 5 | 🆕 Teniente | 🆕 Teniente (Sheriff) | Crear en los dos lados |
| 6 | 🆕 Sub Sheriff | 🆕 Sub Sheriff | Crear en los dos lados |
| 7 (jefe) | 🆕 Sheriff | ✅ 🎖 SHERIFF | Crear en el juego |

### Gobierno (🆕 facción nueva en el juego: GOB)

| Rango | Juego | Discord | Qué hay que hacer |
|---|---|---|---|
| Facción | 🆕 GOB | ✅ 💼 GOBIERNO | Crear la facción en el juego |
| 1 | 🆕 Escolta | 🆕 Escolta | Crear en los dos lados |
| 2 | 🆕 Funcionario | 🆕 Funcionario | Crear en los dos lados |
| 3 | 🆕 Asesor | 🆕 Asesor | Crear en los dos lados |
| 4 | 🆕 Secretario | 🆕 Secretario | Crear en los dos lados |
| 5 | 🆕 Ministro | 🆕 Ministro | Crear en los dos lados |
| 6 | 🆕 Vicegobernador | 🆕 Vicegobernador | Crear en los dos lados |
| 7 (jefe) | 🆕 Gobernador | ✅ 🏛️ GOBERNADOR | Crear en el juego |

### Televisión (🆕 facción nueva en el juego: CITYTV)

| Rango | Juego | Discord | Qué hay que hacer |
|---|---|---|---|
| Facción | 🆕 CITYTV | ✏️ 📺 SATV | Unificar como **CITYTV** (así se llaman los canales) |
| 1 | 🆕 Becario | 🆕 Becario | Crear en los dos lados |
| 2 | 🆕 Camarógrafo | 🆕 Camarógrafo | Crear en los dos lados |
| 3 | 🆕 Reportero | 🆕 Reportero | Crear en los dos lados |
| 4 | 🆕 Presentador | 🆕 Presentador | Crear en los dos lados |
| 5 | 🆕 Productor | 🆕 Productor | Crear en los dos lados |
| 6 | 🆕 Subdirector | 🆕 Subdirector CITYTV | Crear en los dos lados |
| 7 (jefe) | 🆕 Director | ✏️ 🎬 DIRECTOR SATV | Unificar como **DIRECTOR CITYTV** |

**Todas las facciones:** Juego → Discord. Entrar, subir de rango o salir en el juego cambia los roles solos.

### Bandas (`crews` y `crew_ranks`; cada banda inventa sus rangos)

| Juego | Discord | Qué hay que hacer | Sincroniza |
|---|---|---|---|
| ✅ Miembro de cualquier banda | ✅ 💀 MIEMBRO DE BANDA | — | Juego → Discord |
| ✅ Rango más alto de la banda | ✅ 🏴‍☠️ LIDER | — | Juego → Discord |
| ✅ Cada banda (nombre y color) | 🆕 Un rol por banda | El bot crea el rol con el nombre y el color de la banda, y lo borra si la banda desaparece | Juego → Discord |

---

## 3. VIP y beneficios

| Juego | Discord | Qué hay que hacer | Sincroniza |
|---|---|---|---|
| ✅ VIP activo (`vip`, `vip_expire_date`) | ✅ 👑 VIP | Borrar el duplicado 💎 VIP; el rol se quita solo cuando vence | Juego → Discord |
| 🆕 Donador (compró en la tienda Tebex) | ✅ 💸 DONADOR | Marcarlo en el juego al entregar una compra (`tebex_commands`) | Juego → Discord |
| 🆕 Usuario Diamante (compras acumuladas ≥ 100 CityCoins, ajustable) | ✅ 💎 USUARIO DIAMANTE | Crear la insignia en el juego | Juego → Discord |
| 🆕 Booster (insignia) | ✅ 🎉 CityBooster | Discord lo da solo al mejorar el servidor; el juego muestra la insignia | Discord → Juego |

---

## 4. Niveles del jugador (`player.level`)

Los 14 roles de nivel ya existen en Discord, pero hoy nadie los tiene. Se crean como **títulos de nivel** en el juego
(en `/stats` y en el perfil de la web). Rangos propuestos, ajustables:

| Niveles | Juego | Discord |
|---|---|---|
| 1–2 | 🆕 α Arena | ✅ 🌴·USUARIO α ARENA |
| 3–4 | 🆕 β Barro | ✅ 🗻·USUARIO β BARRO |
| 5–6 | 🆕 γ Tierra | ✅ 🌍·USUARIO γ TIERRA |
| 7–8 | 🆕 δ Terremoto | ✅ 🌀·USUARIO δ TERREMOTO |
| 9–10 | 🆕 ε Piedra | ✅ 🌕·USUARIO ε PIEDRA |
| 11–12 | 🆕 ζ Roca | ✅ 🗿·USUARIO ζ ROCA |
| 13–14 | 🆕 η Hierro | ✅ ⚔️·USUARIO η HIERRO |
| 15–16 | 🆕 θ Plata | ✅ ♦️·USUARIO θ PLATA |
| 17–18 | 🆕 ξ Planta | ✅ 🌱·USUARIO ξ PLANTA |
| 19–20 | 🆕 ρ Árbol | ✅ 🌻·USUARIO ρ ARBOL |
| 21–23 | 🆕 φ Furia | ✅ 💥·USUARIO φ FURIA |
| 24–26 | 🆕 Φ Tsunami | ✅ 🌊·USUARIO Φ TSUNAMI |
| 27–29 | 🆕 λ Relámpago | ✅ ⚡·USUARIO λ RELAMPAGO |
| 30+ | 🆕 Γ Cashe | ✅ 🐙·USUARIO Γ CASHE |

**Sincroniza:** Juego → Discord. Solo se tiene el rol del nivel actual.

---

## 5. Economía

| Juego | Discord | Qué hay que hacer | Sincroniza |
|---|---|---|---|
| ✅ Logro «Millonario» ($1.000.000 en el banco) | ✅ 💵 MILLONARIO | Usar el mismo criterio que el logro | Juego → Discord |
| ✅ Logro «Propietario» o tener un negocio | ✅ 💰 EMPRESARIO | Dueño de al menos un negocio o propiedad | Juego → Discord |
| 🆕 Magnate de la semana (insignia) | ✅ 💰 Magnate de la semana | El bot ya lo da con la Fortuna; el juego muestra la insignia esa semana | Discord → Juego |

---

## 6. Comunidad e insignias

Se crea en el juego una tabla de **insignias** (`player_badges`) que se ven en `/stats`, sobre la cabeza (opcional) y en
el perfil de la web.

| Juego | Discord | Sincroniza |
|---|---|---|
| 🆕 Miembro destacado | ✅ 🌟 MIEMBRO DESTACADO | Ambos |
| 🆕 Campeón de eventos | ✅ 🏆 CAMPEÓN DE EVENTOS | Ambos (y lo da `eventos.pwn` al ganador) |
| 🆕 Artista | ✅ 🎨 ARTISTA | Ambos |
| 🆕 Beta tester | ✅ 🧪 BETA TESTER | Ambos (o automático: cuenta creada durante la fase beta) |
| 🆕 Bug hunter | ✅ 🐛 BUG HUNTER | Ambos |
| 🆕 YouTuber | ✅ 🔴 YOUTUBER | Ambos |
| 🆕 TikToker | ✅ 🟣 TIKTOKER | Ambos |
| 🆕 Streamer | ✅ 🎥 STREAMER | Ambos |
| 🆕 Socio | ✅ 🥇 SOCIO | Ambos |

### Logros del juego (`logros.pwn`) que hoy no tienen rol

| Juego | Discord | Qué hay que hacer |
|---|---|---|
| ✅ Leyenda (nivel 30) | ✅ Lo cubre 🐙 USUARIO Γ CASHE | — |
| ✅ Vida en la ciudad (300 h jugadas) | 🆕 🏙️ VIDA EN LA CIUDAD | Crear el rol |
| ✅ Profesional (1000 de experiencia en trabajos) | 🆕 🧰 PROFESIONAL | Crear el rol |
| ✅ Coleccionista (3 vehículos) | 🆕 🚗 COLECCIONISTA | Crear el rol |
| ✅ Sheriff (100 arrestos) | ✏️ Choca con el rol de facción 🎖 SHERIFF | Renombrar el logro a **Placa de honor** y crear 🆕 🎖️ PLACA DE HONOR |
| ✅ Constancia (temporada del calendario) | 🆕 📅 CONSTANCIA | Crear el rol |

Los logros más fáciles (Primeros pasos, Vecino, Recién llegado, etc.) no llevan rol, para no llenar Discord.

---

## 7. Invitaciones y referidos

Hoy son dos sistemas separados: invitaciones de Discord (bot) y códigos de referido del juego (`referral_uses`). Se
suman las dos cifras y se usa la misma escala en los dos lados:

| Personas traídas | Juego | Discord |
|---|---|---|
| 3 | 🆕 Reclutador | ✅ 📨 Reclutador |
| 5 | 🆕 Embajador Bronce | ✅ 🥉 Embajador Bronce |
| 10 | 🆕 Embajador Plata | ✅ 🥈 Embajador Plata |
| 25 | 🆕 Embajador Oro | ✅ 🥇 Embajador Oro |
| 50 | 🆕 Embajador Diamante | ✅ 💎 Embajador Diamante |
| 100 | 🆕 Leyenda del Servidor | ✅ 👑 Leyenda del Servidor |

**Sincroniza:** Ambos (la cifra es la suma de los dos).

---

## 8. Sanciones

| Juego | Discord | Qué hay que hacer | Sincroniza |
|---|---|---|---|
| ✅ Muteo (`mute`) | ✅ 🔇 MUTEADO | Mientras dure el muteo | Ambos |
| ✅ Cárcel administrativa (`/jail`) | ✅ ⛓️ JAIL OOC | Mientras esté en la cárcel | Ambos |
| 🆕 Advertencia 1 | ✅ ⚠️ ADVERTENCIA 1 | Crear `/advertir` en el juego (se guarda en `bad_history`) | Ambos |
| 🆕 Advertencia 2 | ✅ ⚠️ ADVERTENCIA 2 | Igual | Ambos |
| 🆕 Advertencia 3 | ✅ ⚠️ ADVERTENCIA 3 | Igual; a la tercera, sanción automática (a definir) | Ambos |
| ✅ Ban (`bans`) | 🆕 Ban en Discord (opcional) | Si se banea en el juego, ¿también en Discord? A decidir | Juego → Discord |

---

## 9. Datos de la cuenta

| Juego | Discord | Qué hay que hacer | Sincroniza |
|---|---|---|---|
| ✅ Año de registro (`reg_date`) | ✅ 2021 … 2026 | Rol del año en que se creó la cuenta del juego | Juego → Discord |
| ✅ Entra desde Android (se detecta al conectar) | ✅ 📱 ANDROID | Guardar la plataforma en la base de datos; borrar el duplicado 📱 Android | Juego → Discord |
| ✅ Entra desde PC | ✅ 💻 PC | Igual | Juego → Discord |
| ✅ País de origen (creador de personaje, `pcharacter.country`) | ✅ 23 roles de país + 🌍 Otro país | Dar el rol del país; si en el juego no hay país, se toma el de Discord | Ambos |

---

## 10. Solo Discord (➖ no tienen sentido en el juego)

| Discord | Motivo |
|---|---|
| 🔔 Anuncios, Actualizaciones, TikTok, Eventos, Sorteos, Encuestas, Ofertas, Fortuna, Directos, Postulaciones, Alianzas | Son para recibir menciones; los elige cada uno. Se borran los 5 duplicados «📢 Avisos: …» |
| 🤖 BOTS, 🌇 SampCity, Tebex, DISBOARD.org | Bots e integraciones |
| 🥊 BETA | Rol de pruebas con permiso de Administrador: **quitarle ese permiso** |
| 🎈, 🎵 | Sin nombre ni uso conocido: revisar si se borran |

---

## Resumen de trabajo

| Dónde | Qué se crea o cambia |
|---|---|
| **Discord** | 44 roles nuevos (38 de rangos de facciones, Desarrollador y 5 de logros) más uno automático por cada banda. Unificar nombres: MODERADOR GLOBAL, COMISARIO, SATV → CITYTV y ALGUACIL ↔ SHERIFF. Borrar duplicados: 💎 VIP, 📱 Android y «📢 Avisos: …». Quitar el permiso de Administrador a 🥊 BETA. |
| **Juego** | 4 niveles de staff nuevos y migración de `admin_level`. Cargos de staff. 3 facciones nuevas (LSSD, GOB, CITYTV) con sus rangos. Renombrar 3 rangos (Jefe Policía, General y Coronel). Títulos de nivel, insignias, `/advertir`, plataforma guardada y escala de referidos. |
| **Bot** | Sincronización: al vincular, cuando el juego avisa de un cambio (`discord_actions`) y cada pocos minutos. Crea los roles que falten y no toca los roles «solo Discord». |
| **Web** | Muestra los mismos nombres en el perfil, en Staff y en el Resumen. |
