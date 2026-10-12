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
