# Despliegue

La página se compila en GitHub Actions y se sube a tu VPS (Ubuntu + Nginx). Los datos viven en Supabase Cloud.

- **URL:** https://revelacion.aldosoto.dev
- **Carpeta en el VPS:** `/var/www/revelacion`
  - `releases/<commit>/`: cada versión publicada
  - `current`: enlace a la versión activa (Nginx sirve esta)

## 1. DNS

En el proveedor de `aldosoto.dev`:

| Tipo | Nombre | Valor |
|---|---|---|
| A | `revelacion` | IP del VPS |
| AAAA | `revelacion` | IPv6 del VPS (si tiene) |

Comprueba con:

```bash
dig +short revelacion.aldosoto.dev
```

## 2. Preparar el VPS (una sola vez)

Usuario para desplegar, sin contraseña:

```bash
sudo adduser --disabled-password --gecos "" deploy
```

```bash
sudo mkdir -p /var/www/revelacion/releases && sudo chown -R deploy:deploy /var/www/revelacion
```

Genera en tu computadora una llave solo para el despliegue:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/revelacion_deploy -C "deploy revelacion" -N ""
```

Copia la llave pública (`~/.ssh/revelacion_deploy.pub`) a `/home/deploy/.ssh/authorized_keys` en el VPS. La llave privada va como secreto en GitHub (paso 4).

## 3. Nginx y HTTPS

Los dominios `.dev` **solo funcionan con HTTPS**: sin certificado, el navegador ni siquiera abre la página.

1. Copia [`deploy/nginx/revelacion.aldosoto.dev.conf`](../deploy/nginx/revelacion.aldosoto.dev.conf) a `/etc/nginx/sites-available/`.
2. Actívalo y recarga Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/revelacion.aldosoto.dev.conf /etc/nginx/sites-enabled/
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

3. Saca el certificado con Let's Encrypt (también configura la redirección de HTTP a HTTPS):

```bash
sudo certbot --nginx -d revelacion.aldosoto.dev
```

El certificado se renueva solo con el temporizador de `certbot`.

## 4. GitHub Actions

El flujo [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) corre en cada push a `main`: instala, revisa tipos, compila y sube `dist/` con `rsync`. Luego cambia el enlace `current` y conserva las últimas 5 versiones.

Secretos del repositorio (*Settings → Secrets and variables → Actions*):

| Secreto | Valor |
|---|---|
| `VPS_HOST` | IP o dominio del VPS |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | Contenido de `~/.ssh/revelacion_deploy` (llave privada) |
| `VITE_SUPABASE_URL` | URL del proyecto de Supabase |
| `VITE_SUPABASE_ANON_KEY` | Llave `anon` de Supabase |
| `VITE_EVENT_ID` | ID del evento (ver modelo de datos) |

## 5. Volver a una versión anterior

```bash
ls -1t /var/www/revelacion/releases
```

```bash
ln -sfn /var/www/revelacion/releases/<commit-anterior> /var/www/revelacion/current
```

No hace falta recargar Nginx.

## 6. Supabase

1. Crea el proyecto en https://supabase.com (región `us-east-1` o la más cercana).
2. Corre la migración de [`supabase/migrations`](../supabase/migrations) en el SQL Editor, o con la CLI:

```bash
npx supabase db push
```

3. En *Authentication → URL Configuration*:
   - **Site URL:** `https://revelacion.aldosoto.dev`
   - **Redirect URLs:** `https://revelacion.aldosoto.dev/panel` y `http://localhost:5173/panel`
4. Crea el evento y da de alta a los papás como admins (ver [03-modelo-de-datos.md](03-modelo-de-datos.md#alta-del-evento-y-los-admins)).

## 7. Evitar que Supabase pause el proyecto

El plan gratuito pausa proyectos sin actividad por 7 días. Agrega en el VPS un cron semanal (`crontab -e` con el usuario `deploy`):

```text
0 9 * * 1 curl -s "https://<proyecto>.supabase.co/rest/v1/eventos?select=id&limit=1" -H "apikey: <ANON_KEY>" > /dev/null
```

## 8. Monitoreo

Da de alta `https://revelacion.aldosoto.dev` en un monitor gratuito (por ejemplo, UptimeRobot) para recibir un aviso si el VPS se cae, sobre todo el día del evento.
