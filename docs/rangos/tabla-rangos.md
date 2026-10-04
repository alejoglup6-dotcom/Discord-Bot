# Tabla única de rangos: juego ↔ Discord

Hecha el 03/10/2026 comparando los 129 roles del servidor de Discord **SampCity | FASE BETA** (leídos con el bot)
con el gamemode (`snrp.pwn`, repo Backup) y la base de datos. Idea: **cada rango existe en los dos lados con el mismo
nombre**. Si falta en uno, se crea; si existe con otro nombre, se unifica.

**Leyenda:** ✅ ya existe · 🆕 hay que crearlo · ✏️ existe con otro nombre (se unifica) · ➖ no aplica en ese lado

**Sincroniza:**
- **Juego → Discord:** el dato vive en el juego; el bot pone o quita el rol a quien tenga la cuenta vinculada.
- **Discord → Juego:** el staff da el rol en Discord y el juego lo muestra (insignia, etiqueta o permiso).
- **Ambos:** se puede dar en cualquiera de los dos lados y se copia al otro.

## Estado (04/10/2026)

| Parte | Estado |
|---|---|
| Staff 0-9 (Soporte, Encargado, Co-Fundador, Fundador) | ✅ En el juego, el bot y la web. Los niveles viejos se pasan solos al arrancar. |
| Rangos nuevos de Policía, Militares y FBI | ✅ Con migración automática de los jugadores. |
| Facciones nuevas LSSD, Gobierno y CITYTV | ✅ Rangos, `/reclutar`, `/miembros`, `/fservicio`, radio, `/noticia` y `/gobierno`. El LSSD de servicio tiene los poderes de la policía (`/esposar`, `/multar`, `/arrestar`, `/nivel`, `/ref`, `/equiparse`, radio central…), con su rango pasado a la escala de la SAPD. |
| Vehículos por rango y colores | ✅ `/garaje` en el garaje de cada facción (se mueven con `/puntosmapa`). |
| `/rango`, chat y cabeza | ✅ |
| Sincronización con Discord | ✅ `RANGOS_SYNC` = dry/on en el bot. |
| Socio | ✅ El staff lo da con `/samp socio` o `/setvip <id> 3 <días>`. Venta pública y ventajas propias: aún no. |
| Sanciones (sección 8) | ✅ 🔇 MUTEADO (`player.mute`), ⛓️ JAIL OOC (solo `/jail` del staff, no la cárcel de la policía) y ⚠️ ADVERTENCIA 1-3: `/adv` o `/advertir` en el juego y `/samp advertir` en Discord; cuentan las de los últimos 30 días; `/quitaradv` en los dos lados. A la tercera se avisa al staff: **la sanción automática y el ban en Discord siguen sin decidir**. |
| Plataforma y país (sección 9) | ✅ 📱 ANDROID / 💻 PC se guardan al entrar al juego. País del personaje → su rol; si el juego no tiene país o plataforma, se queda lo que eligió en Discord. |
| Rol por banda | ✅ «🏴 Nombre» con el color de la banda; se renombra y se borra con la banda. |
| Insignias automáticas | ✅ 💸 DONADOR y 💎 USUARIO DIAMANTE salen solos de las compras viejas de Tebex (la tienda se quitó el 03/10/2026; las nuevas se dan a mano), 🏆 CAMPEÓN DE EVENTOS (`/ganadorevento` en el juego) y 🧪 BETA TESTER (cuenta creada entre `RANGOS_BETA_DESDE` y `RANGOS_BETA_HASTA`: **falta poner las fechas de la fase beta**). |
| Limpieza de Discord | ✅ La hace el bot con `RANGOS_SYNC=on`: pasa a los miembros de 📱 Android y de los 5 «📢 Avisos: …» al rol bueno y los borra, borra 💎 VIP, quita Administrador a 🥊 BETA y pone 🎖 SHERIFF encima de 🎖 ALGUACIL. Con `dry` solo lo muestra. |
| Pendiente de decidir | Vehículo propio del Gobernador; ventajas y venta del Socio; sanción automática a la 3.ª advertencia; ban en Discord al banear en el juego. |

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
| 🆕 Director de Contenido | 🆕 🎞️ DIRECTOR DE CONTENIDO | Crear en los dos lados. Encargado de los creadores de contenido: revisa las solicitudes y da o quita YouTuber, TikToker y Streamer | Ambos |
| 🆕 Scripter | ✅ 💻 SCRIPTER | Crear el cargo | Ambos |
| 🆕 Mapper | ✅ 🗺️ MAPPER | Crear el cargo (y permiso para `/puntosmapa`) | Ambos |

---

## 2. Facciones

Rangos y vehículos definidos por el dueño (04/10/2026). En cada facción todos llevan el **rol de la facción** y, además,
el de **su rango**; el rango más alto es el jefe. Entre paréntesis, el número de modelo del vehículo en GTA SA.

> **Cada rango puede usar también los vehículos de todos los rangos de abajo** (confirmado por el dueño).

### Policía (juego: SAPD, `FACTIONS_SAPD`) · color: el de policía de siempre

| Rango | Juego | Discord | Vehículos |
|---|---|---|---|
| Facción | ✅ SAPD | ✅ 👮 POLICIA | — |
| 1 | ✅ Cadete | 🆕 Cadete (Policía) | HPV1000 (523) |
| 2 | ✅ Oficial I | 🆕 Oficial I (Policía) | Unidades LS (596), SF (597) y LV (598) |
| 3 | ✅ Oficial II | 🆕 Oficial II (Policía) | Unidades LS, SF y LV |
| 4 | ✅ Oficial III | 🆕 Oficial III (Policía) | Unidades LS, SF y LV |
| 5 | 🆕 Oficial Mayor | 🆕 Oficial Mayor | Merit (551) |
| 6 | ✏️ Detective (antes Detective I y II) | 🆕 Detective | Premier gris (426) |
| 7 | ✅ Sargento | 🆕 Sargento (Policía) | Police Ranger (599) |
| 8 | 🆕 Teniente | 🆕 Teniente (Policía) | Enforcer (427) |
| 9 | ✅ Capitán | 🆕 Capitán (Policía) | Police Maverick (497) |
| 10 | 🆕 Comandante | 🆕 Comandante | Buffalo (402) |
| 11 | 🆕 Subjefe | 🆕 Subjefe (Policía) | Infernus (411) |
| 12 (jefe) | ✏️ Comisario (antes Jefe Policía) | ✅ 👮 COMISARIO | Todos los anteriores |

Paso de los rangos actuales: Cadete y Oficial I–III igual · Detective I y II → Detective · Sargento igual ·
Capitán → Capitán (9) · Jefe Policía → Comisario (12). Los permisos que hoy piden rango 8 (objetos policiales) y 9
(callsign) pasan a Capitán (9) y Comisario (12).

### Sheriff (🆕 facción nueva en el juego: LSSD) · color: amarillo

| Rango | Juego | Discord | Vehículos |
|---|---|---|---|
| Facción | 🆕 LSSD | ✏️ 🎖 ALGUACIL | — (hoy está por encima de SHERIFF: hay que invertirlos) |
| 1 | 🆕 Cadete | 🆕 Cadete (Sheriff) | Sanchez (468) |
| 2 | 🆕 Oficial I | 🆕 Oficial I (Sheriff) | Unidades LS (596), SF (597) y LV (598), en amarillo |
| 3 | 🆕 Oficial II | 🆕 Oficial II (Sheriff) | Unidades LS, SF y LV |
| 4 | 🆕 Oficial III | 🆕 Oficial III (Sheriff) | Unidades LS, SF y LV |
| 5 | 🆕 Sargento | 🆕 Sargento (Sheriff) | Police Ranger (599), Predator (430) |
| 6 | 🆕 Teniente | 🆕 Teniente (Sheriff) | Enforcer (427), Buffalo (402) |
| 7 | 🆕 Capitán | 🆕 Capitán (Sheriff) | FBI Rancher (490) |
| 8 | 🆕 Sub Sheriff | 🆕 Sub Sheriff | Police Maverick (497) |
| 9 (jefe) | 🆕 Sheriff | ✅ 🎖 SHERIFF | Todos los anteriores |

### Militares (juego: SAEM, `FACTIONS_SAEM`; canal: milicia) · color: verde oliva

| Rango | Juego | Discord | Vehículos |
|---|---|---|---|
| Facción | ✅ SAEM | ✅ 🪖 MILITAR | — |
| 1 | ✏️ Soldado (antes Cadete) | 🆕 Soldado | FCR-900 (521) |
| 2 | ✏️ Soldado de primera (antes Soldado) | 🆕 Soldado de primera | Sabre (475) |
| 3 | ✅ Cabo | 🆕 Cabo | Mesa (500) |
| 4 | 🆕 Cabo Primero | 🆕 Cabo Primero | Premier (426) |
| 5 | 🆕 Cabo Mayor | 🆕 Cabo Mayor | Huntley (579) |
| 6 | 🆕 Sargento | 🆕 Sargento (Militar) | Patriot (470), Predator (430) |
| 7 | 🆕 Sargento Primero | 🆕 Sargento Primero | Sultan (560) |
| 8 | 🆕 Subteniente | 🆕 Subteniente | Enforcer (427), Barracks (433) |
| 9 | ✅ Teniente | 🆕 Teniente (Militar) | Police Maverick (497) |
| 10 | ✅ Capitán | 🆕 Capitán (Militar) | Hunter (425) |
| 11 | 🆕 Teniente Coronel | 🆕 Teniente Coronel | Rhino (432) |
| 12 (jefe) | ✏️ General del ejército (antes Coronel) | ✅ 🪖 GENERAL | Hydra (520) y todos los anteriores |

Paso de los rangos actuales: Cadete → Soldado · Soldado → Soldado de primera · Cabo igual · Teniente → Teniente (9) ·
Capitán → Capitán (10) · General (sub jefe) → Teniente Coronel (11) · Coronel (jefe) → General del ejército (12).

### FBI (`FACTIONS_FBI`) · color: negro

| Rango | Juego | Discord | Vehículos |
|---|---|---|---|
| Facción | ✅ FBI | ✅ 🕵 FBI | — |
| 1 | 🆕 Agente aspirante | 🆕 Agente aspirante | PCJ-600 (461) |
| 2 | ✅ Agente | 🆕 Agente | Unidad Sentinel (405) |
| 3 | ✏️ Agente segundo (antes Agente al mando) | 🆕 Agente segundo | Unidad policial (596/597/598) |
| 4 | ✏️ Agente mayor (antes Asistente) | 🆕 Agente mayor | Huntley (579) |
| 5 | ✏️ Agente investigador (antes Asistente al mando) | 🆕 Agente investigador | Sultan civil negro (560) |
| 6 | ✏️ Agente supervisor (antes Ejecutivo) | 🆕 Agente supervisor | FBI Rancher (490), Predator (430) |
| 7 | ✅ Subdirector | 🆕 Subdirector (FBI) | Police Maverick (497) |
| 8 (jefe) | ✅ Director | ✅ 🕵 DIRECTOR | Cheetah (415) y todos los anteriores |

Paso de los rangos actuales: cada uno sube un número (Agente 1 → 2 … Director 7 → 8); el 1 nuevo es Agente aspirante.

### Gobierno (🆕 facción nueva en el juego: GOB)

| Rango | Juego | Discord | Vehículos |
|---|---|---|---|
| Facción | 🆕 GOB | ✅ 💼 GOBIERNO | — |
| 1 | 🆕 Abogado | 🆕 Abogado | Premier (426) |
| 2 | 🆕 Agente del Servicio Secreto | 🆕 Servicio Secreto | Huntley (579), Sultan (560), FBI Rancher (490), Police Maverick (497) |
| 3 | 🆕 Jefe del Servicio Secreto | 🆕 Jefe del Servicio Secreto | Los mismos que el Servicio Secreto |
| 4 (jefe) | 🆕 Gobernador | ✅ 🏛️ GOBERNADOR | Todos los anteriores (falta definir uno propio) |

### Televisión (🆕 facción nueva en el juego: CITYTV)

| Rango | Juego | Discord | Vehículos |
|---|---|---|---|
| Facción | 🆕 CITYTV | ✏️ 📺 SATV | Unificar como **CITYTV** (así se llaman los canales) |
| 1 | 🆕 Reportero | 🆕 Reportero | Newsvan (582), News Chopper (488) |
| 2 | 🆕 Camarógrafo | 🆕 Camarógrafo | Newsvan (582), News Chopper (488) |
| 3 (jefe) | 🆕 Director de prensa | ✏️ 🎬 DIRECTOR SATV | Premier azul cielo (426). Unificar el rol como **DIRECTOR DE PRENSA** |

**Todas las facciones:** Juego → Discord. Entrar, subir de rango o salir en el juego cambia los roles solos.
Para los rangos que se renumeran hay que migrar `pfactions.level` en la misma subida del gamemode.

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
| ✅ VIP: membresía **mensual** (`vip = 2`, `vip_expire_date` + 30 días) | ✅ 👑 VIP | Borrar el duplicado 💎 VIP; el rol se quita solo cuando vence | Juego → Discord |
| 🆕 Socio: membresía **anual**, extensión del VIP (`vip = 3`, `vip_expire_date` + 365 días) | ✅ 🥇 SOCIO | **Solo se compra desde Discord**: ni en el juego ni en la tienda web. Al comprarla, el bot guarda `vip = 3` y la fecha de vencimiento en la cuenta vinculada, y el juego le da todas las ventajas del VIP. Lleva **los dos roles**, 👑 VIP y 🥇 SOCIO; al vencer se pierden los dos. **Aún no disponible:** ventajas propias del Socio y qué pasa con los días de VIP que le quedaban | Discord → Juego |
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

Los tres roles de creadores los da o los quita el **🎞️ Director de Contenido** (cargo de staff, sección 1). 🥇 SOCIO
no es de creadores: es la membresía anual (sección 3).

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
| ✅ Entra desde Android (se detecta al conectar) | ✅ 📱 ANDROID | Guardar la plataforma en la base de datos; borrar el duplicado 📱 Android | Juego → Discord |
| ✅ Entra desde PC | ✅ 💻 PC | Igual | Juego → Discord |
| ✅ País de origen (creador de personaje, `pcharacter.country`) | ✅ 23 roles de país + 🌍 Otro país | Dar el rol del país; si en el juego no hay país, se toma el de Discord | Ambos |

---

## 10. Solo Discord (➖ no tienen sentido en el juego)

| Discord | Motivo |
|---|---|
| 🔔 Anuncios, Actualizaciones, TikTok, Eventos, Sorteos, Encuestas, Ofertas, Fortuna, Directos, Postulaciones, Alianzas | Son para recibir menciones; los elige cada uno. Se borran los 5 duplicados «📢 Avisos: …» |
| 2021, 2022, 2023, 2024, 2025, 2026 | Roles de año: se quedan solo en Discord, sin conexión con el juego ni la web (decisión del dueño) |
| 🤖 BOTS, 🌇 SampCity, Tebex, DISBOARD.org | Bots e integraciones |
| 🥊 BETA | Rol de pruebas con permiso de Administrador: **quitarle ese permiso** |
| 🎈, 🎵 | Sin nombre ni uso conocido: revisar si se borran |

---

## 11. Jerarquía y cómo se muestran en el juego

Lista de **mayor a menor**: es la misma, con las mismas claves, en el juego (`gamemodes/src/rangos.pwn`) y en el bot
(`src/assets/data/rangos.js`).

- **Chat:** delante del nombre va **[VIP] o [SOCIO] siempre** (si lo tiene) y después **el rango más alto** que tenga.
  Con máscara no se ve nada.
- **Sobre la cabeza:** con **`/rango`** el jugador elige cuál se ve: solo puede elegir los que tiene. También puede
  elegir «Automático» (el más alto, por defecto) o «Ninguno». El VIP o Socio se ve siempre.
- **`/darrango <jugador>`:** da o quita los rangos manuales. Un Administrador o más puede darlos todos; el
  Director de Contenido, solo los de creadores.
- «Aún no» = existe en la lista, pero en el juego todavía no hay cómo tenerlo (nivel de staff o facción por crear).

| # | Rango | Grupo | Cómo se obtiene |
|---|---|---|---|
| 1 | 🔱 FUNDADOR | Staff | Aún no |
| 2 | ⚜️ CO-FUNDADOR | Staff | Aún no |
| 3 | 🛠️ DESARROLLADOR | Staff | Automático |
| 4 | ⭕ ENCARGADO STAFF | Staff | Aún no |
| 5 | 🛡️ ADMINISTRADOR | Staff | Automático |
| 6 | 👨‍💻 MODERADOR GLOBAL | Staff | Automático |
| 7 | 🧑‍💻 MODERADOR | Staff | Automático |
| 8 | 🙋 AYUDANTE | Staff | Automático |
| 9 | 🎫 SOPORTE | Staff | Aún no |
| 10 | 🎞️ DIRECTOR DE CONTENIDO | Cargos del staff | A mano (/darrango o rol en Discord) |
| 11 | 🎪 ORGANIZADOR DE EVENTOS | Cargos del staff | A mano (/darrango o rol en Discord) |
| 12 | 📝 EVALUADOR DE FACCIONES | Cargos del staff | A mano (/darrango o rol en Discord) |
| 13 | 🎮 STAFF RPG | Cargos del staff | A mano (/darrango o rol en Discord) |
| 14 | 🎙️ STAFF CV | Cargos del staff | A mano (/darrango o rol en Discord) |
| 15 | 💻 SCRIPTER | Cargos del staff | A mano (/darrango o rol en Discord) |
| 16 | 🗺️ MAPPER | Cargos del staff | A mano (/darrango o rol en Discord) |
| 17 | 👮 COMISARIO | Facciones (del jefe hacia abajo) | Automático |
| 18 | 👮 Subjefe | Facciones (del jefe hacia abajo) | Automático |
| 19 | 👮 Comandante | Facciones (del jefe hacia abajo) | Automático |
| 20 | 👮 Capitán (Policía) | Facciones (del jefe hacia abajo) | Automático |
| 21 | 👮 Teniente (Policía) | Facciones (del jefe hacia abajo) | Automático |
| 22 | 👮 Sargento (Policía) | Facciones (del jefe hacia abajo) | Automático |
| 23 | 👮 Detective | Facciones (del jefe hacia abajo) | Automático |
| 24 | 👮 Oficial Mayor | Facciones (del jefe hacia abajo) | Automático |
| 25 | 👮 Oficial III (Policía) | Facciones (del jefe hacia abajo) | Automático |
| 26 | 👮 Oficial II (Policía) | Facciones (del jefe hacia abajo) | Automático |
| 27 | 👮 Oficial I (Policía) | Facciones (del jefe hacia abajo) | Automático |
| 28 | 👮 Cadete (Policía) | Facciones (del jefe hacia abajo) | Automático |
| 29 | 🎖 SHERIFF | Facciones (del jefe hacia abajo) | Aún no |
| 30 | 🎖 Sub Sheriff | Facciones (del jefe hacia abajo) | Aún no |
| 31 | 🎖 Capitán (Sheriff) | Facciones (del jefe hacia abajo) | Aún no |
| 32 | 🎖 Teniente (Sheriff) | Facciones (del jefe hacia abajo) | Aún no |
| 33 | 🎖 Sargento (Sheriff) | Facciones (del jefe hacia abajo) | Aún no |
| 34 | 🎖 Oficial III (Sheriff) | Facciones (del jefe hacia abajo) | Aún no |
| 35 | 🎖 Oficial II (Sheriff) | Facciones (del jefe hacia abajo) | Aún no |
| 36 | 🎖 Oficial I (Sheriff) | Facciones (del jefe hacia abajo) | Aún no |
| 37 | 🎖 Cadete (Sheriff) | Facciones (del jefe hacia abajo) | Aún no |
| 38 | 🪖 GENERAL | Facciones (del jefe hacia abajo) | Automático |
| 39 | 🪖 Teniente Coronel | Facciones (del jefe hacia abajo) | Automático |
| 40 | 🪖 Capitán (Militar) | Facciones (del jefe hacia abajo) | Automático |
| 41 | 🪖 Teniente (Militar) | Facciones (del jefe hacia abajo) | Automático |
| 42 | 🪖 Subteniente | Facciones (del jefe hacia abajo) | Automático |
| 43 | 🪖 Sargento Primero | Facciones (del jefe hacia abajo) | Automático |
| 44 | 🪖 Sargento (Militar) | Facciones (del jefe hacia abajo) | Automático |
| 45 | 🪖 Cabo Mayor | Facciones (del jefe hacia abajo) | Automático |
| 46 | 🪖 Cabo Primero | Facciones (del jefe hacia abajo) | Automático |
| 47 | 🪖 Cabo | Facciones (del jefe hacia abajo) | Automático |
| 48 | 🪖 Soldado de primera | Facciones (del jefe hacia abajo) | Automático |
| 49 | 🪖 Soldado | Facciones (del jefe hacia abajo) | Automático |
| 50 | 🕵 DIRECTOR | Facciones (del jefe hacia abajo) | Automático |
| 51 | 🕵 Subdirector | Facciones (del jefe hacia abajo) | Automático |
| 52 | 🕵 Agente supervisor | Facciones (del jefe hacia abajo) | Automático |
| 53 | 🕵 Agente investigador | Facciones (del jefe hacia abajo) | Automático |
| 54 | 🕵 Agente mayor | Facciones (del jefe hacia abajo) | Automático |
| 55 | 🕵 Agente segundo | Facciones (del jefe hacia abajo) | Automático |
| 56 | 🕵 Agente | Facciones (del jefe hacia abajo) | Automático |
| 57 | 🕵 Agente aspirante | Facciones (del jefe hacia abajo) | Automático |
| 58 | 🏛️ GOBERNADOR | Facciones (del jefe hacia abajo) | Aún no |
| 59 | 💼 Jefe del Servicio Secreto | Facciones (del jefe hacia abajo) | Aún no |
| 60 | 💼 Servicio Secreto | Facciones (del jefe hacia abajo) | Aún no |
| 61 | 💼 Abogado | Facciones (del jefe hacia abajo) | Aún no |
| 62 | 🎬 DIRECTOR DE PRENSA | Facciones (del jefe hacia abajo) | Aún no |
| 63 | 📺 Camarógrafo | Facciones (del jefe hacia abajo) | Aún no |
| 64 | 📺 Reportero | Facciones (del jefe hacia abajo) | Aún no |
| 65 | 🏴‍☠️ LIDER | Bandas | Automático |
| 66 | 💀 MIEMBRO DE BANDA | Bandas | Automático |
| 67 | 🎥 STREAMER | Creadores de contenido | A mano (/darrango o rol en Discord) |
| 68 | 🔴 YOUTUBER | Creadores de contenido | A mano (/darrango o rol en Discord) |
| 69 | 🟣 TIKTOKER | Creadores de contenido | A mano (/darrango o rol en Discord) |
| 70 | 👑 Leyenda del Servidor | Reconocimientos | Automático (invitados) |
| 71 | 🏆 CAMPEÓN DE EVENTOS | Reconocimientos | A mano (/darrango o rol en Discord) |
| 72 | 🌟 MIEMBRO DESTACADO | Reconocimientos | A mano (/darrango o rol en Discord) |
| 73 | 💰 Magnate de la semana | Reconocimientos | A mano (/darrango o rol en Discord) |
| 74 | 💎 Embajador Diamante | Reconocimientos | Automático (invitados) |
| 75 | 🥇 Embajador Oro | Reconocimientos | Automático (invitados) |
| 76 | 🥈 Embajador Plata | Reconocimientos | Automático (invitados) |
| 77 | 🥉 Embajador Bronce | Reconocimientos | Automático (invitados) |
| 78 | 📨 Reclutador | Reconocimientos | Automático (invitados) |
| 79 | 💎 USUARIO DIAMANTE | Reconocimientos | A mano (/darrango o rol en Discord) |
| 80 | 💸 DONADOR | Reconocimientos | A mano (/darrango o rol en Discord) |
| 81 | 🎉 CityBooster | Reconocimientos | A mano (/darrango o rol en Discord) |
| 82 | 🎨 ARTISTA | Reconocimientos | A mano (/darrango o rol en Discord) |
| 83 | 🐛 BUG HUNTER | Reconocimientos | A mano (/darrango o rol en Discord) |
| 84 | 🧪 BETA TESTER | Reconocimientos | A mano (/darrango o rol en Discord) |
| 85 | 💰 EMPRESARIO | Economía | Automático |
| 86 | 💵 MILLONARIO | Economía | Automático |
| 87 | 🎖️ PLACA DE HONOR | Logros | Automático |
| 88 | 🏙️ VIDA EN LA CIUDAD | Logros | Automático |
| 89 | 🧰 PROFESIONAL | Logros | Automático |
| 90 | 🚗 COLECCIONISTA | Logros | Automático |
| 91 | 📅 CONSTANCIA | Logros | Automático |
| 92 | 🐙·USUARIO Γ CASHE | Títulos de nivel | Automático |
| 93 | ⚡·USUARIO λ RELAMPAGO | Títulos de nivel | Automático |
| 94 | 🌊·USUARIO Φ TSUNAMI | Títulos de nivel | Automático |
| 95 | 💥·USUARIO φ FURIA | Títulos de nivel | Automático |
| 96 | 🌻·USUARIO ρ ARBOL | Títulos de nivel | Automático |
| 97 | 🌱·USUARIO ξ PLANTA | Títulos de nivel | Automático |
| 98 | ♦️·USUARIO θ PLATA | Títulos de nivel | Automático |
| 99 | ⚔️·USUARIO η HIERRO | Títulos de nivel | Automático |
| 100 | 🗿·USUARIO ζ ROCA | Títulos de nivel | Automático |
| 101 | 🌕·USUARIO ε PIEDRA | Títulos de nivel | Automático |
| 102 | 🌀·USUARIO δ TERREMOTO | Títulos de nivel | Automático |
| 103 | 🌍·USUARIO γ TIERRA | Títulos de nivel | Automático |
| 104 | 🗻·USUARIO β BARRO | Títulos de nivel | Automático |
| 105 | 🌴·USUARIO α ARENA | Títulos de nivel | Automático |

Fuera de la jerarquía: **👑 VIP** (`vip = 2`, mensual) y **🥇 SOCIO** (`vip = 3`, anual, aún no se vende),
que se muestran siempre; **👤 USUARIO** (cuenta vinculada).

---

## Resumen de trabajo

| Dónde | Qué se crea o cambia |
|---|---|
| **Discord** | 49 roles nuevos (42 de rangos de facciones, Desarrollador, Director de Contenido y 5 de logros) más uno automático por cada banda. Unificar nombres: MODERADOR GLOBAL, SATV → CITYTV, DIRECTOR SATV → DIRECTOR DE PRENSA y ALGUACIL ↔ SHERIFF. Borrar duplicados: 💎 VIP, 📱 Android y «📢 Avisos: …». Quitar el permiso de Administrador a 🥊 BETA. |
| **Juego** | 4 niveles de staff nuevos y migración de `admin_level`. Cargos de staff. 3 facciones nuevas (LSSD, GOB, CITYTV) con sus rangos, vehículos y colores. Nuevos rangos de Policía (12), Militares (12) y FBI (8), con migración de `pfactions.level` y vehículos por rango. Títulos de nivel, insignias, `/advertir`, plataforma guardada y escala de referidos. |
| **Bot** | Sincronización: al vincular, cuando el juego avisa de un cambio (`discord_actions`) y cada pocos minutos. Crea los roles que falten y no toca los roles «solo Discord». |
| **Web** | Muestra los mismos nombres en el perfil, en Staff y en el Resumen. |
