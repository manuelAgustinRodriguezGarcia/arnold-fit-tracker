# ARNOLD — Integración Spotify Controller
## Especificación funcional + técnica para implementación en Cursor

**Objetivo:** integrar Spotify en Arnold como un **control remoto de la reproducción que ya ocurre en Spotify**, manteniendo Arnold simple, sin backend adicional, sin Web Playback SDK y sin convertir Arnold en un reproductor de audio.

> Esta funcionalidad debe respetar la arquitectura y el diseño existentes de Arnold. Antes de modificar código, inspeccionar la estructura actual del proyecto, componentes, estilos, convenciones, persistencia, PWA y navegación. No duplicar sistemas que ya existan.

---

# 1. Alcance de la funcionalidad

Agregar una integración con Spotify que permita:

- Conectar una cuenta de Spotify mediante OAuth 2.0 Authorization Code + PKCE.
- Detectar la reproducción actual del usuario.
- Mostrar:
  - portada del álbum;
  - nombre de la canción;
  - artista;
  - estado play/pause;
  - progreso actual;
  - duración total.
- Controlar:
  - canción anterior;
  - play;
  - pausa;
  - canción siguiente;
  - posición exacta dentro de la canción mediante una barra de progreso.
- Mostrar las playlists del usuario.
- Permitir tocar una playlist para comenzar a reproducirla en el dispositivo activo de Spotify.
- Mantener un mini reproductor flotante persistente dentro de Arnold.
- Expandir ese mini reproductor como un **bottom sheet / modal superpuesto**, sin desplazar el contenido de Arnold.

No reproducir audio dentro de Arnold.

---

# 2. Principio de arquitectura

La integración debe funcionar así:

```text
ARNOLD
   │
   │ Spotify Web API
   ▼
Cuenta Spotify del usuario
   │
   ▼
Dispositivo Spotify activo
```

Arnold funciona solamente como **Spotify Remote Controller**.

No utilizar:

- Spotify Web Playback SDK.
- iframe de Spotify.
- reproductor de audio propio.
- backend nuevo.
- base de datos nueva.
- Client Secret en frontend.
- Client Credentials Flow.
- librerías grandes de terceros si no son necesarias.

---

# 3. Restricciones del proyecto

Mantener Arnold simple.

Reglas:

1. No migrar el proyecto a TypeScript si actualmente está en JavaScript.
2. No introducir Redux, Zustand, React Query u otra capa de estado global salvo que el proyecto ya la use.
3. Reutilizar el sistema de estilos existente.
4. Si Arnold utiliza SCSS / CSS Modules, continuar con ese sistema.
5. Reutilizar variables de color y design tokens existentes.
6. No agregar backend solo para Spotify.
7. No guardar ningún `client_secret`.
8. No modificar la lógica existente de rutinas, entrenamientos, progreso ni LocalStorage salvo donde sea estrictamente necesario.
9. La funcionalidad debe ser mobile-first y funcionar correctamente como PWA instalada.
10. No romper el funcionamiento offline del resto de Arnold. Spotify puede aparecer como no disponible cuando no exista conexión.

---

# 4. Variables de entorno

Utilizar:

```env
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=xxxxxxxxxxxxxxxx
```

No agregar:

```env
NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET=
```

Tampoco es necesario:

```env
SPOTIFY_CLIENT_SECRET=
```

Esta integración utilizará Authorization Code + PKCE y **no necesita Client Secret**.

La Redirect URI puede construirse dinámicamente:

```js
const redirectUri = `${window.location.origin}/spotify/callback`;
```

Esto permite:

```text
http://127.0.0.1:3000/spotify/callback
```

en desarrollo y la URL HTTPS correspondiente en producción.

Ambas URLs deben existir previamente en la allowlist del Spotify Developer Dashboard.

---

# 5. OAuth — Authorization Code + PKCE

Implementar Spotify OAuth con PKCE.

## 5.1 Scopes

Scopes requeridos:

```text
user-read-playback-state
user-modify-playback-state
playlist-read-private
playlist-read-collaborative
```

### Nota

No es necesario pedir `user-read-currently-playing` si obtenemos la reproducción mediante:

```text
GET /v1/me/player
```

porque `user-read-playback-state` ya cubre ese endpoint.

Si durante la implementación se decide usar específicamente:

```text
GET /v1/me/player/currently-playing
```

entonces sí agregar:

```text
user-read-currently-playing
```

Preferir la opción con menos scopes.

---

# 6. Flujo de conexión

Desde Ajustes de Arnold:

```text
Spotify

No conectado

[ Conectar Spotify ]
```

Al tocar:

1. Generar `code_verifier`.
2. Generar SHA-256.
3. Convertir a Base64 URL-safe para obtener `code_challenge`.
4. Generar un `state` aleatorio.
5. Guardar temporalmente:
   - `code_verifier`;
   - `state`;
   - URL de Arnold desde la cual comenzó el login.
6. Redirigir a:

```text
https://accounts.spotify.com/authorize
```

con:

```text
response_type=code
client_id=...
scope=...
redirect_uri=...
code_challenge_method=S256
code_challenge=...
state=...
```

Spotify vuelve a:

```text
/spotify/callback
```

En callback:

1. Leer `code`.
2. Validar `state`.
3. Recuperar `code_verifier`.
4. Intercambiar `code` por tokens mediante:

```text
POST https://accounts.spotify.com/api/token
```

5. Guardar:
   - access token;
   - refresh token;
   - expiry timestamp.
6. Borrar:
   - verifier;
   - state.
7. Volver a la pantalla de Arnold desde donde se inició la conexión.

---

# 7. Persistencia de tokens

Dado que Arnold es una PWA cliente sin backend, almacenar los tokens localmente.

Crear claves claramente namespaced, por ejemplo:

```text
arnold_spotify_access_token
arnold_spotify_refresh_token
arnold_spotify_expires_at
arnold_spotify_pkce_verifier
arnold_spotify_oauth_state
arnold_spotify_return_url
```

No mezclar estas claves con la información de las rutinas.

Crear helpers específicos.

Ejemplo de estructura conceptual:

```text
/lib/spotify/
  auth.js
  api.js
  storage.js
  constants.js
```

Adaptar nombres y ubicación a la estructura real del proyecto.

---

# 8. Refresh del access token

Antes de cada request importante:

```text
si expires_at - now < 60 segundos
    refrescar token
```

También:

```text
request
  ↓
401
  ↓
refresh token una vez
  ↓
retry una vez
```

Nunca entrar en un loop infinito de refresh.

Si el refresh falla:

- borrar tokens;
- marcar Spotify como desconectado;
- mostrar una notificación discreta:
  - `Volvé a conectar Spotify`.

---

# 9. Servicio Spotify API

Crear una única capa para llamadas a Spotify.

Base:

```text
https://api.spotify.com/v1
```

Crear una función genérica similar a:

```js
spotifyFetch(path, options)
```

Responsabilidades:

- recuperar access token;
- refrescar si hace falta;
- agregar Authorization Bearer;
- manejar respuestas 204;
- manejar JSON;
- manejar 401;
- detectar 403;
- detectar 429;
- no duplicar lógica en componentes.

---

# 10. Endpoints requeridos

## Obtener estado actual

```http
GET /me/player
```

Utilizar para obtener:

- dispositivo activo;
- canción/episodio;
- `is_playing`;
- `progress_ms`;
- duración;
- album;
- artistas;
- restricciones de acciones.

---

## Pausa

```http
PUT /me/player/pause
```

---

## Play / Resume

```http
PUT /me/player/play
```

Sin body para reanudar la reproducción actual.

---

## Siguiente

```http
POST /me/player/next
```

---

## Anterior

```http
POST /me/player/previous
```

---

## Cambiar posición exacta

```http
PUT /me/player/seek?position_ms=XXXXX
```

---

## Playlists del usuario

```http
GET /me/playlists?limit=50
```

Soportar paginación si hay más playlists.

Para la primera versión puede:

- pedir 50;
- mostrar las primeras 50;
- implementar `next` posteriormente;

pero si la implementación de paginación es sencilla, dejarla resuelta desde el principio.

---

## Reproducir una playlist

```http
PUT /me/player/play
Content-Type: application/json

{
  "context_uri": "spotify:playlist:PLAYLIST_ID"
}
```

Usar preferentemente el campo `uri` devuelto por Spotify:

```js
{
  context_uri: playlist.uri
}
```

No reconstruir URIs manualmente si Spotify ya las devuelve.

---

# 11. Estado de React

Crear un hook específico, por ejemplo:

```text
useSpotify()
```

o:

```text
useSpotifyPlayer()
```

No mezclar toda la lógica de Spotify dentro del componente visual.

Estado mínimo:

```js
{
  isConnected,
  isLoading,
  playback,
  playlists,
  playlistsLoading,
  isExpanded,
  error
}
```

Playback debería normalizarse para evitar que los componentes dependan directamente de la respuesta cruda de Spotify.

Ejemplo conceptual:

```js
{
  trackId,
  title,
  artist,
  album,
  imageUrl,
  durationMs,
  progressMs,
  isPlaying,
  device,
  canSeek,
  canSkipNext,
  canSkipPrevious
}
```

---

# 12. Sincronización del playback

No consultar Spotify cada segundo.

Eso sería innecesario y aumentaría las llamadas a la API.

## Estrategia

1. Obtener `progress_ms` desde Spotify.
2. Mientras `is_playing === true`, incrementar el progreso localmente en el navegador.
3. Sincronizar periódicamente contra Spotify.

Cadencia sugerida:

### Pill compacto

```text
poll cada ~10 segundos
```

### Player expandido

```text
poll cada ~5 segundos
```

### Inmediatamente después de:

- play;
- pause;
- anterior;
- siguiente;
- seek;
- selección de playlist;

volver a consultar el playback después de un pequeño delay aproximado de 400–700 ms.

Cuando:

```js
document.visibilityState === "hidden"
```

detener el polling.

Al volver a:

```text
visible
```

hacer un refresh inmediato.

Limpiar todos los timers al desmontar.

---

# 13. Pill compacto — diseño

Debe ser un componente flotante.

Ubicación:

- parte inferior de la pantalla;
- inmediatamente por encima del Bottom Navigation;
- centrado;
- con margen lateral consistente con Arnold.

Concepto visual:

```text
┌─────────────────────────────────────────────┐
│ [cover] Canción                   ◀  ❚❚  ▶ ⌄│
│         Artista                             │
└─────────────────────────────────────────────┘
```

El icono final debe ser un chevron / flecha que indique expansión.

## Contenido

Izquierda:

- portada cuadrada.

Centro:

- título;
- artista.

Derecha:

- anterior;
- play/pause;
- siguiente;
- expandir.

## Comportamiento

El pill:

- debe estar flotando;
- no debe ocupar espacio dentro del layout;
- no debe mover cards;
- debe permanecer visible al navegar entre secciones principales de Arnold cuando Spotify esté conectado y haya playback disponible.

Usar un z-index superior al contenido normal pero inferior al player expandido.

---

# 14. Posicionamiento del pill

No hardcodear una posición que choque con el Bottom Navigation.

Preferir una variable CSS compartida para la altura de navegación.

Conceptualmente:

```css
.spotifyPill {
  position: fixed;
  left: var(--page-gutter);
  right: var(--page-gutter);
  bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + 12px);
}
```

Adaptar tokens a los ya existentes.

Considerar:

```css
env(safe-area-inset-bottom)
```

para iPhone / PWA.

---

# 15. Player expandido — comportamiento obligatorio

Al tocar expandir:

**NO modificar el flujo del documento.**

No:

```text
contenido
player
```

No hacer que la pantalla se desplace hacia arriba.

Debe funcionar como un modal/bottom sheet:

```text
pantalla existente
      +
backdrop
      +
SpotifyPlayerSheet
```

La pantalla de Arnold debe quedar exactamente en la posición en la que estaba.

---

# 16. Backdrop

Cuando el player está expandido:

Agregar un backdrop entre Arnold y el player.

Ejemplo conceptual:

```css
.spotifyBackdrop {
  position: fixed;
  inset: 0;
}
```

Características:

- oscuro muy sutil o neutral;
- transparencia moderada;
- puede utilizar un blur muy ligero si encaja con el diseño;
- nunca debe convertir la UI en una estética negra/neón;
- debe mantenerse dentro de la identidad Arnold Stone / escultórica existente.

Al tocar el backdrop:

```text
cerrar / contraer player
```

---

# 17. Scroll lock obligatorio

Mientras el modal esté abierto:

- el contenido que está detrás no puede scrollear;
- Bottom Navigation no puede recibir interacción;
- tarjetas de Arnold no pueden recibir interacción.

Implementar correctamente el bloqueo de scroll.

Importante para iOS/PWA:

No confiar exclusivamente en:

```css
overflow: hidden
```

si genera problemas.

Preservar la posición de scroll:

1. almacenar scrollY;
2. bloquear body;
3. al cerrar, restaurar exactamente scrollY.

No debe ocurrir ningún salto visual.

---

# 18. Z-index

Definir una jerarquía clara.

Ejemplo:

```text
contenido Arnold          1
bottom navigation        20
pill compacto            30
backdrop                 80
player expandido         90
toast/error             100
```

Adaptarlo al sistema actual.

El bottom nav debe quedar **debajo** del backdrop cuando el player esté expandido.

---

# 19. Diseño del player expandido

Visualmente debe seguir el mockup ya aprobado.

Estructura:

```text
┌────────────────────────────────────┐
│             ─────                  │
│                                    │
│          [ PORTADA ]               │
│                                    │
│        Nombre canción              │
│           Artista                  │
│                                    │
│  1:24 ━━━━━━━●━━━━━━━━━━ 3:24      │
│                                    │
│          ◀    ❚❚    ▶              │
│                                    │
│ Tus playlists                      │
│                                    │
│ [img] Gym                          │
│       42 canciones             >   │
│                                    │
│ [img] Rock                         │
│       56 canciones             >   │
│                                    │
│ [img] Entrenamiento                │
│       38 canciones             >   │
└────────────────────────────────────┘
```

---

# 20. Tamaño del bottom sheet

Mobile-first.

El panel debe subir desde abajo y cubrir gran parte de la pantalla, pero seguir sintiéndose como un bottom sheet.

Sugerencia:

```text
max-height: 85–92%
```

No depender de un número rígido si genera problemas con diferentes pantallas.

El sheet:

- posición fija;
- `left: 0`;
- `right: 0`;
- `bottom: 0`;
- border radius solamente arriba;
- incluir safe-area inferior.

No debe modificar el layout de Arnold.

---

# 21. Scroll interno

Si las playlists no entran:

- scrollear el contenido del sheet;
- nunca el documento de atrás.

La parte de reproducción puede quedar fija dentro del sheet si resulta natural, mientras la sección playlists scrollea.

Evitar nested scrolling innecesario.

---

# 22. Portada

Mostrar la mejor imagen disponible del álbum.

Fallback si no existe:

- superficie Arnold;
- icono musical simple;
- no usar imágenes aleatorias externas.

Mantener:

```css
object-fit: cover;
```

La portada del pill debe ser pequeña.

La portada del modal debe ser mayor y protagonista, sin ocupar toda la pantalla.

---

# 23. Título y artista

Truncar textos largos.

Pill:

```text
1 línea título
1 línea artista
```

Modal:

```text
máximo 2 líneas título
1–2 líneas artista
```

No permitir que títulos extremos rompan los controles.

---

# 24. Barra de reproducción / Seek

Esta parte es obligatoria.

Mostrar:

```text
tiempo actual        duración
```

Ejemplo:

```text
1:24  ━━━━━━━●━━━━━━━━━━━━  3:24
```

Utilizar:

```html
<input type="range">
```

por accesibilidad y compatibilidad táctil.

Valores:

```text
min = 0
max = durationMs
value = displayedProgressMs
```

---

# 25. Comportamiento del seek

Durante drag:

- actualizar UI local;
- actualizar texto del tiempo;
- no disparar una request por cada pixel.

Al terminar la interacción:

```http
PUT /me/player/seek?position_ms=...
```

Soportar:

- mouse;
- touch;
- teclado.

Evitar decenas de requests mientras se arrastra.

Después del seek:

1. actualizar optimisticamente;
2. enviar request;
3. sincronizar nuevamente con Spotify.

Si Spotify informa que seeking está restringido:

- desactivar slider;
- mostrar visualmente que no puede modificarse.

Usar la información de `actions` cuando esté disponible.

---

# 26. Play / Pause

Botón central.

Si:

```js
isPlaying === true
```

mostrar Pause.

Si:

```js
isPlaying === false
```

mostrar Play.

Al presionar:

1. actualizar interfaz rápidamente;
2. enviar request correspondiente;
3. revalidar estado.

Si request falla, revertir estado optimistic y mostrar feedback discreto.

---

# 27. Previous / Next

Endpoints:

```text
POST /me/player/previous
POST /me/player/next
```

Después de ejecutar:

- desactivar temporalmente el botón para evitar doble tap accidental;
- refrescar playback después de ~500 ms;
- actualizar portada/título/artista.

No encadenar múltiples endpoints al mismo tiempo innecesariamente.

---

# 28. Playlists

Cargar playlists **solamente cuando el usuario expande el player**, salvo que ya estén cacheadas durante la sesión.

Esto evita requests innecesarios.

Primera apertura:

```text
expanded = true
    ↓
GET /me/playlists
```

Durante esa misma sesión:

- mantener playlists en memoria;
- no volver a pedirlas en cada apertura.

Puede agregarse un refresh manual en el futuro, pero no es necesario ahora.

---

# 29. Diseño de cada playlist

Fila:

```text
[cover]  Nombre
         XX canciones                 >
```

Debe ser una fila táctil completa.

No poner un botón diminuto solamente sobre el chevron.

Target táctil mínimo aproximado:

```text
44px
```

Al tocar fila:

```text
playPlaylist(playlist.uri)
```

---

# 30. Seleccionar una playlist

Request:

```http
PUT /me/player/play
```

body:

```json
{
  "context_uri": "spotify:playlist:..."
}
```

Después:

1. mostrar loading breve en la playlist tocada;
2. ejecutar Spotify;
3. esperar ~500–700 ms;
4. refrescar playback;
5. la nueva canción debe aparecer en el player.

No es necesario cerrar automáticamente el modal.

Preferencia UX:

**mantener abierto el player** para que el usuario vea que la playlist comenzó a reproducirse.

---

# 31. Estados de Spotify

Contemplar explícitamente:

## No conectado

No mostrar pill.

En Ajustes:

```text
Spotify
[ Conectar Spotify ]
```

---

## Conectado + reproduciendo

Mostrar pill normal.

---

## Conectado + pausado

Mostrar canción actual + icono Play.

---

## Conectado + sin reproducción activa

Mostrar pill reducido:

```text
Spotify
Abrí Spotify y reproducí una canción
```

No intentar inventar un dispositivo.

---

## Conectado + sin dispositivo activo

Al intentar Play / Playlist:

```text
No hay un dispositivo Spotify activo.
Abrí Spotify en tu celular y reproducí algo primero.
```

No abrir Web Playback SDK.

---

## Offline

No desconectar al usuario.

Mostrar:

```text
Spotify no disponible sin conexión
```

El resto de Arnold debe seguir funcionando.

---

## Token vencido

Refrescar automáticamente.

---

## Token inválido / refresh fallido

Desconectar solamente Spotify.

No afectar los datos de Arnold.

---

## 429 Rate Limit

Leer `Retry-After`.

No seguir haciendo requests durante ese tiempo.

No disparar polling agresivo.

---

# 32. Ajustes

Agregar una sección Spotify dentro de Ajustes.

## Desconectado

```text
SPOTIFY

Controlá tu música durante el entrenamiento.

[ Conectar Spotify ]
```

---

## Conectado

```text
SPOTIFY

● Conectado

[ Desconectar Spotify ]
```

Opcional si el perfil ya se obtiene sin complicar:

```text
Conectado como Nombre
```

No agregar scopes adicionales solamente para mostrar nombre de usuario.

---

# 33. Desconectar Spotify

Al tocar:

```text
Desconectar Spotify
```

Borrar únicamente:

```text
arnold_spotify_*
```

No limpiar todo LocalStorage.

No hacer:

```js
localStorage.clear()
```

porque borraría datos de Arnold.

Esto es crítico.

---

# 34. Ubicación global del player

El pill debería vivir en un nivel suficientemente alto del árbol para persistir durante la navegación.

Ejemplo conceptual:

```jsx
<AppLayout>
  <Page />
  <SpotifyController />
  <BottomNav />
</AppLayout>
```

No duplicar `<SpotifyController />` en cada página.

Si la arquitectura actual posee un layout global adecuado, integrarlo allí.

---

# 35. Páginas donde debe mostrarse

Mostrar:

- Inicio;
- Rutinas;
- Progreso;
- pantallas de entrenamiento;
- otras pantallas principales donde no interfiera.

Evaluar si conviene ocultarlo temporalmente en:

- splash;
- callback Spotify;
- pantallas modales críticas existentes.

Nunca mostrar Spotify encima de `/spotify/callback`.

---

# 36. Interacción con otros modales

Arnold ya puede tener modales propios.

Definir:

- Spotify sheet es un modal global.
- No permitir abrir dos overlays grandes simultáneamente si provoca conflictos.
- Si hay un modal crítico abierto, mantener el pill por debajo o esconderlo según la arquitectura existente.
- No permitir que un backdrop de Spotify quede detrás de otro modal.

Revisar el sistema existente antes de fijar z-index.

---

# 37. Animaciones

Mantener animaciones suaves y cortas.

Expandir:

```text
translateY(100%) → translateY(0)
```

Backdrop:

```text
opacity 0 → 1
```

Duración sugerida:

```text
200–300ms
```

Cerrar:

animación inversa.

Respetar:

```css
@media (prefers-reduced-motion: reduce)
```

No utilizar rebotes excesivos.

---

# 38. Identidad visual

Spotify debe verse integrado a Arnold.

No convertir el componente en una copia negra/verde de Spotify.

No utilizar verde Spotify como color dominante.

Usar:

- fondo claro Arnold;
- superficies piedra/mármol;
- grafito;
- charcoal;
- bordes piedra;
- tipografías existentes;
- radios y sombras ya utilizados.

La portada del álbum aporta suficiente color.

El reproductor debe parecer:

> una funcionalidad de Arnold conectada a Spotify

y no:

> Spotify embebido dentro de Arnold.

---

# 39. Accesibilidad

Agregar:

```text
aria-label="Canción anterior"
aria-label="Pausar"
aria-label="Reproducir"
aria-label="Canción siguiente"
aria-label="Expandir reproductor"
aria-label="Contraer reproductor"
```

Slider:

```text
aria-label="Posición de reproducción"
```

Backdrop no debe romper navegación por teclado.

Al abrir modal:

- gestionar foco correctamente;
- Escape debería cerrar en desktop;
- al cerrar devolver foco al botón que lo abrió si es razonable.

---

# 40. Performance

No cargar Spotify SDK.

No cargar librerías de reproducción.

No consultar playlists hasta expandir.

No polling en background.

No poll por segundo.

No descargar imágenes manualmente.

Usar las URLs provistas por Spotify directamente como `src`.

Manejar errores de imágenes.

---

# 41. Comportamiento cuando cambia la canción desde Spotify

Caso:

1. usuario cambia canción directamente desde Spotify;
2. Arnold está abierto.

Arnold debe detectarlo en el próximo refresh de playback.

Actualizar:

- portada;
- canción;
- artista;
- duración;
- progreso;
- play state.

No conservar `progressMs` de la canción anterior.

Detectar cambio mediante `trackId`.

---

# 42. Playlist count

Spotify devuelve metadata simplificada de playlist.

Si existe información del total de tracks/items utilizable en el objeto recibido, mostrarla.

Ejemplo:

```text
42 canciones
```

Si Spotify no devuelve un total utilizable debido a cambios de API/versiones:

- no realizar decenas de requests para calcularlo;
- simplemente ocultar el contador.

El nombre y portada son prioritarios.

---

# 43. Podcasts / episodios

`GET /me/player` puede devolver track o episode.

Primera versión:

- permitir mostrar el episodio;
- mostrar imagen/título/show si los datos existen;
- play/pause/seek pueden seguir funcionando si Spotify lo permite.

No asumir que siempre existe:

```js
item.album
```

Crear normalización defensiva.

No permitir que un episodio genere errores en render.

---

# 44. Ads / contenido no controlable

Spotify puede informar:

```text
currently_playing_type = ad
```

o restricciones en `actions`.

En esos casos:

- mostrar estado de reproducción;
- desactivar controles no permitidos;
- no lanzar errores al usuario por una acción que Spotify explícitamente restringe.

---

# 45. Respuestas HTTP

Manejar al menos:

```text
200 → JSON
204 → éxito sin body
401 → intentar refresh
403 → acción no permitida / Premium / restricciones
404 → tratar como estado no disponible cuando corresponda
429 → rate limit
```

No hacer:

```js
await response.json()
```

sobre una respuesta `204`.

---

# 46. Seguridad básica

PKCE obligatorio.

`state` OAuth obligatorio en nuestra implementación.

No Client Secret.

No loggear tokens.

No imprimir:

```js
console.log(accessToken)
console.log(refreshToken)
```

No incluir tokens en query params internos de Arnold.

No incluir tokens en errores visibles.

---

# 47. Componentes sugeridos

La estructura exacta debe adaptarse al proyecto, pero conceptualmente:

```text
components/
  spotify/
    SpotifyController
    SpotifyPill
    SpotifyPlayerSheet
    SpotifyPlaybackControls
    SpotifyProgress
    SpotifyPlaylists
    SpotifyPlaylistItem

hooks/
  useSpotifyPlayer

lib/
  spotify/
    auth
    api
    storage
    normalize
    constants

app/
  spotify/
    callback/
```

No crear archivos de más si el proyecto utiliza otra organización.

---

# 48. Responsabilidad de componentes

## SpotifyController

- decide si mostrar pill/sheet;
- conecta hook de estado;
- gestiona expanded.

## SpotifyPill

Solo UI + callbacks.

No realiza fetch directo.

## SpotifyPlayerSheet

Modal/bottom sheet.

## SpotifyPlaybackControls

Play/pause/previous/next.

## SpotifyProgress

Progreso + seek.

## SpotifyPlaylists

Loading/error/lista.

## SpotifyPlaylistItem

Fila individual.

## spotify/api

Toda comunicación HTTP con Spotify.

## spotify/auth

PKCE, login, callback, refresh.

---

# 49. Loading states

No llenar la interfaz de spinners.

Pill:

- mantener último estado conocido mientras refresh ocurre.

Playlist:

Primera carga:

```text
Tus playlists

[cards skeleton]
[cards skeleton]
[cards skeleton]
```

Al seleccionar una:

- pequeño indicador solo en esa fila.

---

# 50. Errores visuales

Usar feedback discreto consistente con Arnold.

Ejemplos:

```text
No pudimos conectar con Spotify.
```

```text
Abrí Spotify en tu dispositivo primero.
```

```text
No pudimos cambiar de canción.
```

```text
Spotify está limitando temporalmente las solicitudes.
```

No mostrar:

```text
403 Forbidden
```

al usuario.

Mantener el detalle técnico solamente en desarrollo si es útil.

---

# 51. Reintentos

No reintentar automáticamente todas las acciones.

Regla:

- 401 → refresh + 1 retry.
- 429 → esperar Retry-After.
- network error → no loop.
- 403 → no retry automático.

---

# 52. Diseño responsive

Principal: mobile.

Debe funcionar desde aproximadamente:

```text
320px
```

en adelante.

En desktop/tablet:

- pill con ancho máximo;
- modal bottom sheet con ancho máximo razonable o panel centrado;
- no estirar portada a tamaños absurdos.

---

# 53. Bottom navigation

El pill compacto debe ubicarse arriba del bottom nav.

Modal expandido:

- debe quedar por encima del bottom nav;
- backdrop cubre también bottom nav;
- bottom nav deja de ser interactuable;
- no mover nav;
- no desmontarla innecesariamente.

---

# 54. Safe areas de PWA

Considerar:

```css
env(safe-area-inset-bottom)
```

especialmente:

- Bottom Navigation;
- pill;
- sheet expandido.

El control inferior nunca debe quedar detrás de la home indicator de iOS.

---

# 55. No hacer layout shift

Al aparecer/desaparecer el pill:

- no modificar padding del contenido de Arnold salvo que sea estrictamente necesario para evitar tapar información crítica;
- preferir que flote.

Al expandirse:

**cero reflow del contenido detrás.**

Esta regla es obligatoria.

---

# 56. Comportamiento exacto esperado

## Escenario A

Usuario ya escucha Spotify.

Abre Arnold.

Resultado:

```text
pill aparece
portada correcta
título correcto
artista correcto
pause visible
```

---

## Escenario B

Usuario toca Pause en Arnold.

Resultado:

```text
Spotify del celular se pausa
icono pasa a Play
```

---

## Escenario C

Usuario toca Next.

Resultado:

```text
Spotify cambia canción
Arnold actualiza portada/título/artista
```

---

## Escenario D

Usuario abre player.

Resultado:

```text
contenido Arnold NO se mueve
backdrop aparece
sheet sube sobre la pantalla
body queda bloqueado
```

---

## Escenario E

Usuario arrastra barra a 2:15.

Resultado:

```text
UI muestra 2:15
al soltar → seek Spotify
Spotify continúa desde ~2:15
```

---

## Escenario F

Usuario abre playlists.

Resultado:

```text
GET /me/playlists
lista visible
```

---

## Escenario G

Usuario toca "Gym".

Resultado:

```text
Spotify comienza playlist Gym
player refleja nueva canción
modal permanece abierto
```

---

## Escenario H

Usuario toca backdrop.

Resultado:

```text
sheet se contrae
scroll detrás vuelve exactamente a posición anterior
pill permanece
```

---

# 57. Criterios de aceptación

La tarea no se considera terminada hasta que se cumplan todos.

## Auth

- [ ] Conectar Spotify funciona.
- [ ] PKCE funciona.
- [ ] Se valida OAuth `state`.
- [ ] No existe Client Secret en frontend.
- [ ] Refresh token funciona.
- [ ] Recargar Arnold mantiene conexión.
- [ ] Desconectar borra solo datos Spotify.

## Playback

- [ ] Se muestra canción actual.
- [ ] Se muestra portada.
- [ ] Se muestra artista.
- [ ] Play funciona.
- [ ] Pause funciona.
- [ ] Previous funciona.
- [ ] Next funciona.
- [ ] Cambio realizado desde Spotify se refleja en Arnold.
- [ ] No existe polling excesivo.

## Seek

- [ ] Barra muestra progreso correcto.
- [ ] Tiempo actual se actualiza suavemente.
- [ ] Duración correcta.
- [ ] Drag no dispara request en cada pixel.
- [ ] Al soltar realiza seek.
- [ ] Funciona táctil.
- [ ] Funciona mouse.
- [ ] Funciona teclado.

## Modal

- [ ] Al expandir no hay layout shift.
- [ ] Contenido de atrás no se mueve.
- [ ] Backdrop cubre Arnold.
- [ ] Bottom nav queda detrás.
- [ ] Body queda sin scroll.
- [ ] Sheet puede tener scroll interno.
- [ ] Al cerrar se restaura posición exacta.
- [ ] Backdrop puede cerrar.
- [ ] Animación es suave.

## Playlists

- [ ] Se cargan al expandir, no al iniciar Arnold.
- [ ] Se muestra imagen.
- [ ] Se muestra nombre.
- [ ] Se muestra cantidad si está disponible.
- [ ] Tocar una playlist inicia reproducción.
- [ ] Se actualiza canción después.
- [ ] No se recalculan playlists innecesariamente.

## Robustez

- [ ] No active device no rompe UI.
- [ ] Offline no rompe Arnold.
- [ ] 401 se recupera.
- [ ] 403 se maneja.
- [ ] 429 se maneja.
- [ ] Episode/podcast no rompe el componente.
- [ ] Response 204 no intenta parsear JSON.

---

# 58. Plan de implementación recomendado

Implementar por etapas para facilitar debugging.

## Fase 1 — Auth

- PKCE.
- callback.
- token storage.
- refresh.
- conectar/desconectar desde Ajustes.

No avanzar hasta que sobreviva correctamente un reload.

---

## Fase 2 — Read Playback

- GET `/me/player`.
- normalización.
- mostrar un bloque temporal de debug si hace falta.
- eliminar debug al terminar.

---

## Fase 3 — Pill

- UI compacta.
- portada.
- canción.
- artista.
- play/pause.
- previous/next.
- posición fija.

---

## Fase 4 — Modal

- backdrop.
- bottom sheet.
- scroll lock.
- animaciones.
- portal si la arquitectura lo requiere.

---

## Fase 5 — Progress / Seek

- interpolación local.
- range.
- seek commit.
- sincronización.

---

## Fase 6 — Playlists

- GET `/me/playlists`.
- lista.
- selección.
- PUT `/me/player/play` con context URI.

---

## Fase 7 — Estados de error

- sin dispositivo;
- offline;
- token;
- 401;
- 403;
- 429.

---

## Fase 8 — QA PWA

Probar:

- navegador mobile;
- PWA instalada;
- reload;
- volver desde Spotify OAuth;
- scroll largo;
- abrir/cerrar modal muchas veces;
- cambiar canciones desde app Spotify;
- conexión lenta.

---

# 59. Pruebas manuales mínimas

Realizar estas pruebas antes de dar la tarea por terminada.

### Auth

```text
conectar
reload
cerrar PWA
abrir PWA
desconectar
reconectar
```

### Playback

```text
play
pause
next
previous
seek 25%
seek 75%
```

### Externo

Cambiar canción directamente desde Spotify y verificar Arnold.

### Playlist

```text
abrir sheet
seleccionar playlist
comprobar inicio de playlist
cerrar
abrir de nuevo
```

### Scroll

1. scrollear Arnold a mitad de pantalla;
2. abrir Spotify;
3. intentar scrollear fondo;
4. cerrar;
5. verificar que Arnold sigue exactamente en el mismo punto.

### Offline

1. abrir Arnold;
2. desconectar internet;
3. comprobar que rutinas siguen funcionando;
4. Spotify muestra estado offline;
5. recuperar internet;
6. Spotify vuelve a sincronizar.

---

# 60. Fuera de alcance por ahora

NO implementar todavía:

- búsqueda global de Spotify;
- queue editable;
- letras;
- likes;
- favoritos;
- crear playlists;
- editar playlists;
- canciones dentro de cada playlist;
- selector de dispositivo Spotify;
- volumen;
- shuffle;
- repeat;
- Spotify Web Playback SDK;
- reproducción de audio dentro de Arnold.

Pueden ser iteraciones futuras.

Mantener el MVP enfocado.

---

# 61. Posibles mejoras futuras

Después de validar el MVP:

1. Selector de dispositivo Spotify Connect.
2. Shuffle.
3. Repeat.
4. Control de volumen.
5. Queue.
6. Mostrar playlist/contexto que está sonando.
7. Favoritos.
8. Recientes.
9. Integración con entrenamiento:
   - recordar playlist utilizada por rutina;
   - sugerir última playlist usada para ese día.

No implementar sin pedido explícito.

---

# 62. Definición visual final

El resultado debe sentirse como:

```text
ARNOLD
fitness + entrenamiento
          +
herramienta de música flotante
```

No debe sentirse como dos aplicaciones pegadas.

Pill compacto:

```text
[cover] Título
        Artista          ◀  ❚❚  ▶ ⌄
```

Expandido:

```text
       ─────

    [ portada ]

      título
      artista

0:58 ━━━━━●━━━━━━━━ 3:42

     ◀   ❚❚   ▶

Tus playlists

[img] Gym            >
      42 canciones

[img] Rock           >
      56 canciones
```

Mientras está expandido:

```text
ARNOLD DETRÁS
   ↓
NO SE MUEVE
NO SCROLLEA
NO RECIBE CLICKS
```

---

# 63. Instrucción final para Cursor

Implementá esta funcionalidad completa sobre el proyecto Arnold existente.

Antes de escribir código:

1. inspeccioná toda la estructura relevante;
2. identificá layout global, Bottom Navigation, sistema de estilos, modales existentes y LocalStorage;
3. definí qué archivos realmente deben modificarse;
4. evitá duplicar utilidades existentes.

Luego implementá por fases.

Prioridades:

```text
1. no romper Arnold;
2. auth robusta;
3. controles confiables;
4. modal sin layout shift;
5. UX mobile/PWA;
6. código sencillo y explicable.
```

No hagas refactors generales que no estén relacionados con Spotify.

No cambies la paleta, tipografía ni identidad de Arnold.

No agregues nuevas dependencias salvo que sean imprescindibles y, antes de hacerlo, justificá claramente por qué no puede resolverse con APIs nativas.

Al finalizar:

1. ejecutá lint/build;
2. corregí errores;
3. listá archivos modificados;
4. explicá la arquitectura implementada;
5. explicá dónde está cada parte importante;
6. indicá cualquier paso manual que todavía deba realizar el desarrollador;
7. no declares la tarea terminada si hay errores de build.

---

# Referencias oficiales de Spotify

- Authorization: https://developer.spotify.com/documentation/web-api/concepts/authorization
- Authorization Code with PKCE: https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
- Scopes: https://developer.spotify.com/documentation/web-api/concepts/scopes
- Get Playback State: https://developer.spotify.com/documentation/web-api/reference/get-information-about-the-users-current-playback
- Start / Resume Playback: https://developer.spotify.com/documentation/web-api/reference/start-a-users-playback
- Pause Playback: https://developer.spotify.com/documentation/web-api/reference/pause-a-users-playback
- Skip Next: https://developer.spotify.com/documentation/web-api/reference/skip-users-playback-to-next-track
- Skip Previous: https://developer.spotify.com/documentation/web-api/reference/skip-users-playback-to-previous-track
- Get Current User's Playlists: https://developer.spotify.com/documentation/web-api/reference/get-a-list-of-current-users-playlists
- February 2026 Web API changes: https://developer.spotify.com/documentation/web-api/references/changes/february-2026
