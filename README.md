# Catálogo Fácil

Plataforma web para pequeños comercios de Venezuela con catálogos públicos, administración del negocio y pagos manuales por parte del administrador.

## Tecnologías

- React
- Vite
- TypeScript
- Tailwind CSS
- Supabase
- Lucide React
- QRCode React

## Requisitos

- Node.js 20+ recomendado
- npm o pnpm
- Cuenta de Supabase

## Ejecutar localmente

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Configura variables de entorno:

   ```bash
   cp .env.example .env
   ```

3. Edita `.env` con tus credenciales de Supabase.

4. Ejecuta la app:

   ```bash
   npm run dev -- --host 0.0.0.0
   ```

## Compilar

```bash
npm run build
```

## Despliegue

Para Vercel:

1. En `Settings > Environment Variables`, configura la URL de Supabase y una clave pública `anon`/`publishable`.
2. El build de Vite acepta `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`, además de `SUPABASE_URL` y `SUPABASE_ANON_KEY` usados por algunas integraciones de Vercel. También acepta `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `SUPABASE_PUBLISHABLE_KEY`.
3. Selecciona el entorno `Production` y crea un nuevo deployment después de guardar las variables; Vite las incorpora durante el build.
4. Usa `npm run build` como comando de build y `dist` como directorio de salida.

No configures `service_role`, `sb_secret` ni otras claves secretas con prefijo `VITE_`, `NEXT_PUBLIC_` o equivalente de cliente. Esas variables se incluirían en el bundle público.

Para Cloudflare Pages:

1. Conecta el repositorio.
2. Usa el comando de build: `npm run build`.
3. El directorio de salida debe ser `dist`.
4. Asegúrate de definir las variables de entorno en el panel del proyecto.

## Supabase

### Crear proyecto

1. Entra a `supabase.com` y crea un proyecto.
2. Guarda la URL del proyecto y la clave anónima pública.
3. Copia esos valores a `.env`.

### Migraciones SQL

Ejecuta los archivos de la carpeta `supabase/migrations` en el SQL editor de Supabase.

### Seguridad

- No se usa service_role en frontend.
- Las operaciones privilegiadas deben ejecutarse en servidor o Edge Functions.
- Las políticas RLS deben limitar acceso por usuario y negocio.

## Primera cuenta maestra

1. Crea un usuario autenticado en Supabase.
2. Registra su correo en `profiles` con rol `admin`.
3. No permitas que comerciantes se creen roles administrativos.
4. La validación real debe hacerse en servidor.

## Nota importante

La interfaz está preparada para conectar con Supabase, pero no se inventan credenciales ni claves. Debes asignarlas por tu cuenta antes de activar la autenticación real.
