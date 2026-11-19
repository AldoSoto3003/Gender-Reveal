# Despliegue

Sin CI/CD: el repo se clona en el VPS, se compila ahí y Nginx sirve la carpeta `dist/`. Los datos viven en Supabase Cloud.

- **URL:** https://revelacion.aldosoto.dev
- **Repo en el VPS:** `/var/www/gender-reveal` (Nginx sirve `/var/www/gender-reveal/dist`)
- **Requisitos en el VPS:** Ubuntu con Nginx, git y Node 20 o más reciente

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

## 2. Clonar el repo (una sola vez)

Si el repo es privado, genera una llave en el VPS y agrégala en GitHub como *Deploy key* de solo lectura (*Settings → Deploy keys*):

```bash
ssh-keygen -t ed25519 -f ~/.ssh/gender_reveal -C "vps gender-reveal" -N ""
```

```bash
cat ~/.ssh/gender_reveal.pub
```

Clona usando esa llave:

```bash
sudo mkdir -p /var/www && sudo chown "$USER" /var/www
```

```bash
GIT_SSH_COMMAND="ssh -i ~/.ssh/gender_reveal" git clone git@github.com:AldoSoto3003/Gender-Reveal.git /var/www/gender-reveal
```

```bash
cd /var/www/gender-reveal && git config core.sshCommand "ssh -i ~/.ssh/gender_reveal"
```

Crea el archivo de variables (no se versiona) con los valores de Supabase:

```bash
cp .env.example .env.local && nano .env.local
```

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | `https://zfgauxphwnmqqnfbeyjh.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Llave `anon` (la misma de tu `.env.local` local) |
| `VITE_EVENT_ID` | `6f1c2a8e-0b7d-4c1e-9a55-2d3f7e8b1c01` |

Primer build:

```bash
./deploy/actualizar.sh
```

## 3. Nginx y HTTPS (una sola vez)

Los dominios `.dev` **solo funcionan con HTTPS**: sin certificado, el navegador ni siquiera abre la página.

1. Copia la configuración y el bloque de encabezados que trae comentado al final:

```bash
sudo cp deploy/nginx/revelacion.aldosoto.dev.conf /etc/nginx/sites-available/
```

```bash
sudo ln -s /etc/nginx/sites-available/revelacion.aldosoto.dev.conf /etc/nginx/sites-enabled/
```

2. Crea `/etc/nginx/snippets/revelacion-headers.conf` con las líneas comentadas al final de ese archivo, revisa y recarga:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

3. Saca el certificado con Let's Encrypt (también configura la redirección de HTTP a HTTPS):

```bash
sudo certbot --nginx -d revelacion.aldosoto.dev
```

El certificado se renueva solo con el temporizador de `certbot`.

## 4. Actualizar

Cada vez que subas cambios a GitHub, en el VPS:

```bash
cd /var/www/gender-reveal && ./deploy/actualizar.sh
```

El script hace `git pull`, `npm ci`, revisa tipos y compila en una carpeta aparte. Al terminar, la cambia por `dist/` de golpe, así nadie ve una versión a medio compilar. No hace falta recargar Nginx.

## 5. Volver a la versión anterior

El script guarda la versión previa en `.dist-anterior`:

```bash
cd /var/www/gender-reveal && rm -rf dist && mv .dist-anterior dist
```

## 6. Supabase

Proyecto actual: `zfgauxphwnmqqnfbeyjh` (región `us-west-2`), ya vinculado con la CLI.

1. Inicia sesión y vincula (solo la primera vez en cada computadora):

```bash
npx supabase login
```

```bash
npx supabase link --project-ref zfgauxphwnmqqnfbeyjh
```

2. Sube migraciones nuevas:

```bash
npx supabase db push --linked
```

3. Las URLs de login (*Site URL* y *Redirect URLs*) viven en [`supabase/config.toml`](../supabase/config.toml). Para aplicar cambios, revisa primero la comparación que muestra el comando y confirma solo lo que esperas:

```bash
npx supabase config push
```

4. Da de alta a los papás como admins (ver [03-modelo-de-datos.md](03-modelo-de-datos.md#alta-del-evento-y-los-admins)).

**Correos de login:** el servidor de correo incluido en Supabase solo envía a miembros del equipo de la organización y con un límite bajo por hora. Invita a los dos papás a la organización en Supabase, o configura un SMTP propio (por ejemplo, Resend) en *Authentication → Emails → SMTP*.

## 7. Evitar que Supabase pause el proyecto

El plan gratuito pausa proyectos sin actividad por 7 días. Agrega en el VPS un cron semanal (`crontab -e`):

```text
0 9 * * 1 curl -s "https://<proyecto>.supabase.co/rest/v1/eventos?select=id&limit=1" -H "apikey: <ANON_KEY>" > /dev/null
```

## 8. Monitoreo

Da de alta `https://revelacion.aldosoto.dev` en un monitor gratuito (por ejemplo, UptimeRobot) para recibir un aviso si el VPS se cae, sobre todo el día del evento.
