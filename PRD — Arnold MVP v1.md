# Arnold — Product Requirements Document

**Producto:** Arnold  
**Versión:** MVP v1  
**Plataforma:** Progressive Web App  
**Framework:** Next.js App Router  
**Persistencia:** localStorage  
**Idioma inicial:** Español  
**Backend:** Ninguno

---

# 1. Visión del producto

Arnold es una aplicación sencilla para organizar rutinas de gimnasio, iniciar entrenamientos y registrar automáticamente el historial de actividad.

Debe sentirse como una aplicación móvil antes que como una página web.

El usuario podrá instalarla en su teléfono, abrirla sin conexión a Internet, consultar sus rutinas, iniciar un entrenamiento, controlar su duración y posteriormente consultar su progreso.

La primera versión debe priorizar:

- simplicidad;
- velocidad;
- navegación mobile-first;
- funcionamiento offline;
- persistencia local;
- código sencillo de entender;
- arquitectura preparada para crecer.

Arnold no necesita backend para su primer MVP.

---

# 2. Objetivo del MVP

Permitir que un usuario pueda:

1. Tener rutinas precargadas.
2. Crear nuevas rutinas.
3. Editar rutinas existentes.
4. Agregar ejercicios utilizando campos de texto.
5. Ordenar los ejercicios.
6. Comenzar un entrenamiento.
7. Pausar y reanudar el entrenamiento.
8. Finalizarlo.
9. Registrar su nivel de cansancio.
10. Consultar entrenamientos anteriores.
11. Consultar estadísticas básicas.
12. Utilizar la aplicación sin conexión.
13. Instalar Arnold como PWA en el teléfono.

---

# 3. Fuera del alcance del MVP

No implementar todavía:

- Supabase.
- Base de datos externa.
- Autenticación.
- Usuarios.
- Sincronización entre dispositivos.
- Subida de imágenes.
- Inteligencia artificial.
- Registro detallado de pesos.
- Series completadas.
- Repeticiones realizadas.
- Récords personales.
- Seguimiento corporal.
- Rutinas compartidas.
- Funciones sociales.
- Notificaciones.
- Cronómetro de descanso.
- Gráficos complejos.
- Exportación/importación.
- Cloud backup.

Estas funciones pueden agregarse posteriormente.

---

# 4. Stack

Usar:

- Next.js con App Router.
- JavaScript.
- React.
- CSS Modules y CSS global.
- `lucide-react`.
- localStorage.
- Web App Manifest.
- Service Worker.
- Cache Storage API.

No utilizar:

- TypeScript.
- Tailwind.
- Redux.
- Zustand.
- Supabase.
- Prisma.
- Firebase.
- IndexedDB.
- librerías de UI.
- librerías de animaciones.

Las animaciones deben resolverse principalmente con CSS.

---

# 5. Arquitectura general

La aplicación será deliberadamente sencilla.

Arnold funcionará principalmente como una aplicación cliente.

La navegación principal tendrá tres secciones:

**Home · Rutinas · Progreso**

Para simplificar el funcionamiento offline, el MVP puede utilizar un único App Shell de Next.js y cambiar las vistas internamente sin necesitar una navegación completa entre múltiples páginas del servidor.

Los modales y vistas secundarias pueden abrirse sobre este App Shell.

---

# 6. Navegación

La aplicación tendrá una Bottom Navigation fija.

## Home

Icono Lucide: `House`

## Rutinas

Icono Lucide: `Dumbbell`

## Progreso

Icono Lucide: `ChartNoAxesColumnIncreasing`

La sección activa debe distinguirse claramente.

La navegación debe estar siempre disponible salvo mientras se encuentra abierta la experiencia de entrenamiento.

---

# 7. Home

La pantalla principal debe ser sencilla y permitir comenzar rápidamente una acción.

## Header

Mostrar:

- logo Arnold;
- nombre Arnold;
- botón de instalación cuando corresponda.

## Entrenamiento activo

Si existe un entrenamiento actualmente activo o pausado, debe mostrarse en primer lugar.

Ejemplo:

**Entrenamiento en curso**

Pecho + tríceps  
00:42:18

Botón:

**Continuar**

Nunca deben existir dos entrenamientos simultáneamente.

## Acciones rápidas

### Crear rutina

Icono:

`Plus`

Abre el formulario para crear una nueva rutina.

### Comenzar entrenamiento

Icono:

`Play`

Mostrar las rutinas disponibles.

Inicialmente habrá tres.

Seleccionar una debe comenzar inmediatamente el entrenamiento correspondiente.

## Resumen semanal

Mostrar información de lunes a domingo de la semana actual.

Indicadores:

**Ejercicios**

Cantidad total de ejercicios pertenecientes a entrenamientos finalizados durante la semana.

**Tiempo**

Tiempo total entrenado durante la semana.

También puede mostrarse:

**Entrenamientos**

Cantidad de sesiones finalizadas.

Ejemplo:

> Esta semana  
> 3 entrenamientos  
> 18 ejercicios  
> 3h 42min

---

# 8. Rutinas

La sección Rutinas muestra todas las rutinas disponibles.

Cada rutina debe mostrar:

- nombre;
- descripción corta;
- cantidad de ejercicios;
- botón comenzar;
- botón editar;
- menú de acciones.

## Acciones

Una rutina puede:

- crearse;
- editarse;
- eliminarse.

Antes de eliminar debe solicitarse confirmación.

Eliminar una rutina NO debe eliminar entrenamientos históricos asociados.

---

# 9. Crear rutina

Formulario sencillo.

## Nombre

String obligatorio.

Ejemplo:

`Pecho + tríceps`

## Descripción

String opcional.

Ejemplo:

`Rutina principal de pecho`

## Ejercicios

Cada ejercicio contiene:

- nombre;
- detalle;
- imagen opcional;
- posición.

Ejemplo:

**Press banca plano con barra olímpica**

Detalle:

`3 x 8-10`

Los ejercicios se agregan mediante un formulario simple.

Botón:

**Agregar ejercicio**

Icono:

`Plus`

---

# 10. Editar ejercicios

El usuario debe poder:

- cambiar el nombre;
- cambiar el detalle;
- eliminar el ejercicio;
- moverlo hacia arriba;
- moverlo hacia abajo.

Utilizar:

`ArrowUp`

`ArrowDown`

`Trash2`

No implementar drag and drop durante el MVP.

---

# 11. Imágenes de ejercicios

No habrá subida de archivos.

Las imágenes estarán almacenadas dentro de:

`/public/exercises/`

Cada ejercicio tendrá opcionalmente:

`imagePath`

Ejemplo:

`/exercises/bench-press.webp`

Si no existe una imagen configurada, mostrar un placeholder elegante utilizando `Dumbbell`.

Esto permite agregar posteriormente imágenes simplemente colocándolas dentro de `public` y asociando su ruta.

---

# 12. Entrenamiento

Al seleccionar una rutina comienza una sesión.

La pantalla de entrenamiento debe ocupar prácticamente toda la aplicación.

Mostrar:

- nombre de la rutina;
- cronómetro;
- estado;
- ejercicios;
- controles.

---

# 13. Cronómetro

Formato:

`HH:MM:SS`

Ejemplo:

`01:23:42`

El cronómetro NO debe calcular el tiempo simplemente incrementando una variable cada segundo.

Debe calcularse utilizando timestamps reales.

Esto evita perder precisión cuando:

- el teléfono bloquea la pantalla;
- la PWA queda en segundo plano;
- el navegador suspende JavaScript;
- se vuelve a abrir la aplicación.

---

# 14. Estado de entrenamiento

Persistir inmediatamente en localStorage.

Un entrenamiento activo tendrá conceptualmente:

`id`

`routineId`

`routineSnapshot`

`startedAt`

`pausedAt`

`accumulatedPausedMilliseconds`

`status`

Estados:

`running`

`paused`

---

# 15. Comenzar entrenamiento

Botón:

`Play`

Al comenzar:

1. Crear entrenamiento activo.
2. Guardar timestamp de inicio.
3. Guardar una copia de la rutina.
4. Persistir en localStorage.
5. Abrir pantalla de entrenamiento.

Guardar una copia de la rutina es fundamental.

Si posteriormente se modifica una rutina, los entrenamientos históricos deben conservar los ejercicios que tenía en aquel momento.

---

# 16. Pausar entrenamiento

Icono:

`Pause`

Al pulsarlo:

- guardar el instante de pausa;
- cambiar estado a `paused`;
- detener visualmente el contador.

Durante la pausa el tiempo no debe acumularse.

---

# 17. Reanudar

Cuando el entrenamiento esté pausado, reemplazar `Pause` por:

`Play`

Al reanudar:

- calcular cuánto tiempo estuvo pausado;
- acumularlo;
- volver a estado `running`.

---

# 18. Finalizar entrenamiento

Icono:

`Square`

Texto:

**Finalizar**

Debe abrirse un modal de confirmación.

Luego preguntar:

## ¿Cómo terminaste?

Opciones:

### Muy cansado

Valor:

`very_tired`

### Cansado

Valor:

`tired`

### Regular

Valor:

`regular`

Usar cards grandes y fáciles de tocar.

No utilizar emojis.

Utilizar iconos Lucide.

---

# 19. Guardado de entrenamiento

Después de seleccionar cansancio:

Guardar:

- ID;
- rutina;
- snapshot de ejercicios;
- fecha/hora inicial;
- fecha/hora final;
- duración;
- cantidad de ejercicios;
- cansancio.

Eliminar posteriormente el entrenamiento activo.

Volver al Home y mostrar una confirmación visual discreta.

---

# 20. Persistencia ante cierre

Si el usuario:

- cierra Arnold;
- recarga;
- cambia de aplicación;
- bloquea el celular;

el entrenamiento debe conservarse.

Cuando vuelva a abrir Arnold:

- detectar entrenamiento activo;
- reconstruir correctamente el cronómetro;
- mostrar botón **Continuar entrenamiento**.

---

# 21. Progreso

Mostrar cronológicamente todos los entrenamientos realizados.

Orden:

más reciente primero.

Cada card muestra:

- título automático;
- rutina;
- fecha;
- horario;
- duración;
- cantidad de ejercicios;
- cansancio.

---

# 22. Naming automático

Generar automáticamente nombres como:

`Training Lunes a la mañana`

`Training Jueves por la tarde`

`Training Domingo por la noche`

Reglas aproximadas:

- 05:00–11:59 → `a la mañana`
- 12:00–18:59 → `por la tarde`
- 19:00–04:59 → `por la noche`

Utilizar locale:

`es-AR`

---

# 23. Detalle de entrenamiento

Al pulsar una card de Progreso abrir un detalle.

Mostrar:

## Duración

Ejemplo:

`01:14:37`

## Rutina

`Pecho + tríceps`

## Comenzó

`20 ago 2026 · 18:32`

## Finalizó

`20 ago 2026 · 19:47`

## Ejercicios

`6`

## Cansancio

`Cansado`

Debajo mostrar todos los ejercicios contenidos en el snapshot de la rutina.

No hace falta utilizar gráficos durante el MVP.

---

# 24. localStorage

Utilizar una única capa para acceder a localStorage.

No permitir que los componentes escriban directamente en `window.localStorage`.

Crear algo equivalente a:

`lib/storage.js`

Clave principal:

`arnold:v1`

Estructura conceptual:

```text
{
  version: 1,
  routines: [],
  sessions: [],
  activeWorkout: null,
  settings: {}
}
```

---

# 25. Versionado

La información debe incluir:

`version: 1`

La capa de storage debe contemplar una futura función:

`migrateStorage()`

Aunque inicialmente solamente exista la versión 1.

Esto será importante si en futuras versiones cambia el modelo de datos.

---

# 26. Migración futura a Supabase

La UI nunca debe depender directamente de localStorage.

Arquitectura:

UI  
↓  
Arnold Context / hooks  
↓  
Storage service  
↓  
localStorage

En el futuro:

UI  
↓  
Arnold Context / hooks  
↓  
Repository  
↓  
Supabase

De esta manera la migración podrá hacerse sin reescribir toda la interfaz.

---

# 27. Datos iniciales

Los datos iniciales solamente deben insertarse cuando Arnold no encuentre almacenamiento previo.

Nunca volver a ejecutar el seed sobre información existente.

Crear:

`lib/seedData.js`

Esto permitirá modificar fácilmente las rutinas iniciales.

---

# 28. Rutinas seed iniciales

## Rutina 1 — Pecho + tríceps

1. Press banca plano con barra olímpica — `3 x 8-10`
2. Press de pecho — `3 x 10-12`
3. Aperturas — `3 x 10-12`
4. Tríceps en polea — `3 x 10-12`
5. Extensión de tríceps — `3 x 10-12`
6. Correr — `Al finalizar`

## Rutina 2 — Espalda + bíceps

1. Jalón al pecho — `3 x 10-12`
2. Remo sentado — `3 x 10-12`
3. Remo en máquina — `3 x 10-12`
4. Curl de bíceps — `3 x 10-12`
5. Curl martillo — `3 x 10-12`
6. Correr — `Al finalizar`

## Rutina 3 — Piernas + hombros

1. Prensa — `3 x 10-12`
2. Extensión de cuádriceps — `3 x 10-12`
3. Curl femoral — `3 x 10-12`
4. Press de hombros — `3 x 10-12`
5. Elevaciones laterales — `3 x 12`
6. Pantorrillas — `3 x 12-15`
7. Correr — `Al finalizar`

Todas deben ser editables desde la aplicación.

---

# 29. PWA

Arnold debe ser instalable.

Configurar:

- Web App Manifest;
- nombre `Arnold`;
- short name `Arnold`;
- `display: standalone`;
- orientación portrait;
- theme color;
- background color;
- icono;
- start URL `/`.

Utilizar `app/manifest.js`.

---

# 30. Instalación

Al abrir Arnold desde el navegador y no estar instalada, mostrar inmediatamente después del splash:

**Instalar Arnold**

Icono:

`Download`

En Chromium:

capturar `beforeinstallprompt`.

El prompt nativo solamente debe abrirse después de pulsar el botón.

Si Arnold ya está instalada, no mostrarlo.

Para iPhone/iPad mostrar instrucciones específicas para Safari:

**Compartir → Agregar a pantalla de inicio**

---

# 31. Funcionamiento offline

Después de haber cargado correctamente Arnold al menos una vez, las funciones del MVP deben estar disponibles sin Internet.

Debe poder:

- abrir Arnold;
- navegar Home;
- consultar rutinas;
- crear rutinas;
- editar rutinas;
- empezar entrenamiento;
- pausar;
- finalizar;
- consultar progreso.

Utilizar Service Worker y Cache Storage.

Cachear:

- App Shell;
- CSS;
- JavaScript necesario;
- logo;
- iconos propios;
- imágenes locales utilizadas.

Los datos continuarán viniendo de localStorage.

---

# 32. Logo

Centralizar el uso del logo.

Ruta inicial:

`/branding/arnold-logo.svg`

Crear inicialmente un placeholder sencillo.

Cuando esté disponible el logo definitivo, debe bastar con reemplazar los assets correspondientes.

Utilizarlo en:

- header;
- splash;
- metadata;
- PWA;
- pantalla instalada;
- loading states.

---

# 33. Splash screen

Al abrir Arnold mostrar:

- logo centrado;
- fondo de la aplicación;
- blur;
- animación suave.

El splash debe permanecer mientras se hidratan los datos provenientes de localStorage.

Después:

- fade out;
- ligero scale;
- revelar aplicación.

No agregar delays artificiales largos.

---

# 34. Animaciones

Arnold debe sentirse fluida.

Utilizar principalmente:

- opacity;
- transform;
- scale;
- translateY.

Duraciones generales:

`180ms–300ms`

Evitar animaciones pesadas.

No instalar Framer Motion.

Respetar:

`prefers-reduced-motion`

---

# 35. Diseño

Mobile-first.

Estética:

- moderna;
- limpia;
- deportiva;
- minimalista;
- alto contraste;
- pocos colores;
- cards grandes;
- bordes suaves;
- espacios generosos.

No saturar la interfaz.

Los controles principales deben poder utilizarse cómodamente con una mano.

Touch targets mínimos aproximados:

`44px`

---

# 36. Iconografía

Utilizar exclusivamente `lucide-react` para iconos funcionales.

No utilizar emojis.

Ejemplos:

- Home → `House`
- Rutinas → `Dumbbell`
- Progreso → `ChartNoAxesColumnIncreasing`
- Comenzar → `Play`
- Pausar → `Pause`
- Finalizar → `Square`
- Crear → `Plus`
- Editar → `Pencil`
- Eliminar → `Trash2`
- Volver → `ChevronLeft`
- Instalar → `Download`
- Tiempo → `Timer`
- Calendario → `CalendarDays`

---

# 37. Responsive

Prioridad:

smartphones.

También debe funcionar correctamente:

- tablet;
- desktop.

En desktop colocar el contenido dentro de un ancho máximo razonable para que continúe sintiéndose como una aplicación.

---

# 38. Accesibilidad

Requisitos mínimos:

- buttons semánticos;
- labels;
- estados focus;
- contraste suficiente;
- `aria-label` en botones únicamente representados mediante iconos;
- soporte de teclado;
- reducir movimiento cuando corresponda.

---

# 39. Rendimiento

Evitar dependencias innecesarias.

No cargar gráficos.

No cargar frameworks visuales.

No guardar el cronómetro en localStorage cada segundo.

Persistir únicamente cuando exista un cambio de estado relevante.

La interfaz puede actualizar visualmente el contador cada segundo.

---

# 40. Estructura sugerida

```text
app/
  layout.js
  page.js
  manifest.js
  globals.css

components/
  AppShell/
  BottomNavigation/
  Home/
  Routines/
  Progress/
  Workout/
  InstallPWA/
  SplashScreen/
  Modal/
  ExerciseCard/

context/
  ArnoldContext.js

hooks/
  useArnold.js
  useWorkoutTimer.js
  usePWAInstall.js

lib/
  storage.js
  seedData.js
  dates.js
  workout.js

public/
  branding/
    arnold-logo.svg
  exercises/
  sw.js
```

No crear abstracciones que todavía no tengan una finalidad clara.

---

# 41. Estados vacíos

Rutinas:

**Todavía no tenés rutinas**

Botón:

**Crear rutina**

Progreso:

**Todavía no hay entrenamientos**

Texto:

`Cuando termines tu primera rutina aparecerá acá.`

---

# 42. Errores

Arnold no debe romperse ante datos dañados en localStorage.

La capa de storage debe:

- utilizar try/catch;
- validar estructuras mínimas;
- utilizar seed solamente cuando corresponda;
- evitar crashes.

Registrar errores útiles en consola durante desarrollo.

---

# 43. Criterios de aceptación

El MVP se considera terminado cuando:

- Arnold abre correctamente en mobile y desktop.
- Existen Home, Rutinas y Progreso.
- Las tres rutinas aparecen en primera ejecución.
- Se pueden crear nuevas rutinas.
- Se pueden editar.
- Se pueden eliminar.
- Se pueden agregar y ordenar ejercicios.
- La información persiste después de recargar.
- Puede iniciarse un entrenamiento.
- El cronómetro muestra HH:MM:SS.
- Puede pausarse.
- Puede reanudarse.
- El tiempo pausado no se contabiliza.
- El cronómetro sobrevive a recargas.
- No pueden iniciarse dos entrenamientos simultáneamente.
- Finalizar solicita nivel de cansancio.
- El entrenamiento queda registrado.
- Progreso muestra los entrenamientos.
- Pulsar una sesión muestra estadísticas.
- Home calcula resumen semanal.
- La PWA tiene manifest.
- Existe Service Worker.
- Arnold funciona offline después de su primera carga completa.
- Existe UI de instalación.
- El logo aparece en splash y aplicación.
- No existen errores de hidratación.
- `npm run lint` funciona.
- `npm run build` finaliza correctamente.

---

# 44. Preparación para futuras versiones

La arquitectura debe admitir en el futuro:

- Supabase;
- autenticación;
- sincronización multidispositivo;
- ejercicios con pesos;
- series;
- repeticiones;
- históricos por ejercicio;
- récords personales;
- estadísticas gráficas;
- cronómetros de descanso;
- planes semanales;
- calendario;
- objetivos;
- fotos;
- backup;
- exportación;
- notificaciones;
- widgets;
- Apple/Google Health;
- rutinas compartidas.

Ninguna de estas funcionalidades debe implementarse todavía.

El objetivo de Arnold v1 es hacer pocas cosas, pero hacerlas bien.