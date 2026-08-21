# Arnold

PWA mobile-first para organizar rutinas de gimnasio, entrenar y ver el progreso.

Los datos viven en el dispositivo. No hay backend ni cuenta.

## Stack

- Next.js (App Router) + React + JavaScript
- CSS Modules y tokens en `app/globals.css`
- `lucide-react`
- `localStorage` (`arnold:v1`)
- Web App Manifest + Service Worker

## Cómo ejecutar

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

```bash
npm run lint
npm run build
```

## Datos iniciales

Las 3 rutinas precargadas están en `lib/seedData.js`.

Se cargan **solo** la primera vez, cuando todavía no existe `arnold:v1` en `localStorage`. Recargar o actualizar no las vuelve a pisar.

## Imágenes de ejercicios

Colocá archivos en `public/exercises/`.

En cada ejercicio usá un path como `/exercises/bench-press.webp`.

Si no hay imagen o falla la carga, se muestra un placeholder.

## Logo e iconos PWA

- Wordmark del header: `public/logo-arnold.svg`
- Icono / splash / PWA: `public/logo-square-arnold.svg`

## localStorage

`lib/storage.js` es la única capa que lee y escribe `window.localStorage`.

`lib/arnoldStore.js` guarda el estado en memoria y llama a esa capa.

Los componentes hablan con `ArnoldContext` / `useArnold`, no con `localStorage` directo. Esa separación queda lista para reemplazar el storage por Supabase más adelante.

## Service Worker

`public/sw.js`, registrado desde `components/app/ServiceWorkerRegister.js`.

- Navegación: network first, con fallback al shell cacheado
- Assets estáticos e imágenes locales: cache first
- Al activar una versión nueva, borra caches viejos `arnold-*`

## Cómo probar offline

1. Abrí Arnold online al menos una vez.
2. En DevTools → Application → Service Workers, confirmá que está activo.
3. Activá Offline o cortá la red.
4. Recargá: Home, Rutinas, Progreso, crear/editar/entrenar deben seguir funcionando.

## Cómo probar la instalación PWA

- **Chrome / Edge:** el banner *Instalar Arnold* aparece cuando el navegador dispara `beforeinstallprompt`. Tocá el botón (no se abre el prompt solo).
- **iPhone:** si no está en modo standalone, el mismo botón explica cómo usar *Agregar a pantalla de inicio* desde Safari.
- Si ya está instalada, el banner no se muestra.

Para probar en local, serví el build (`npm run build` + `npm start`) o usá un túnel HTTPS. Chrome puede limitar la instalación en `localhost` según la versión.

## Preparado para Supabase

No está integrado. Cuando toque migrar, el cambio debería quedar en:

- `lib/storage.js` (reemplazar persistencia)
- `context/ArnoldContext.js` (seguir exponiendo la misma API)

Los componentes de UI no deberían enterarse del backend.
