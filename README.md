# DriveTime - SaaS de Reservas de Clases de Conducir (Multi-Tenant)

DriveTime es una plataforma completa para la gestión de autoescuelas, construida con React (Frontend) y PHP/MySQL (Backend).

## 📋 Requisitos Previos

Esta guía asume que estás utilizando un servidor con **Ubuntu** (20.04 o superior) limpio.

Necesitarás permisos de `sudo` para realizar la instalación.

---

## 🚀 Guía de Instalación Paso a Paso (Ubuntu)

### 1. Actualización del Sistema e Instalación de Dependencias

Primero, actualizamos los repositorios e instalamos la pila LAMP (Linux, Apache, MySQL, PHP) junto con Node.js y las herramientas necesarias.

```bash
# 1. Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Apache, MySQL, PHP y extensiones comunes
sudo apt install apache2 mysql-server php php-mysql php-pdo php-mbstring php-xml php-curl php-zip unzip git curl -y

# 3. Habilitar el módulo rewrite de Apache (Crucial para la API y React)
sudo a2enmod rewrite
sudo systemctl restart apache2

# 4. Instalar Node.js (Versión LTS recomendada)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 5. Instalar pnpm (Gestor de paquetes eficiente)
sudo npm install -g pnpm
```

### 2. Clonar el Repositorio

Clonaremos el proyecto en una carpeta llamada `drivetime` dentro del directorio web.

```bash
cd /var/www/html
# Clonamos el repositorio
sudo git clone https://github.com/SedanoDev/drivetimesch.git drivetime

# Entramos al directorio
cd drivetime
```

### 3. Configuración de la Base de Datos (MySQL)

Configuraremos la base de datos y el usuario.

1.  Accede a la consola de MySQL:
    ```bash
    sudo mysql
    ```

2.  Ejecuta los siguientes comandos SQL (cambia `'tu_password_segura'` por una contraseña real):
    ```sql
    -- Crear base de datos
    CREATE DATABASE drivetime CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

    -- Crear usuario (ajusta la contraseña)
    CREATE USER 'drivetime_user'@'localhost' IDENTIFIED BY 'tu_password_segura';

    -- Dar permisos
    GRANT ALL PRIVILEGES ON drivetime.* TO 'drivetime_user'@'localhost';
    FLUSH PRIVILEGES;

    -- Salir
    EXIT;
    ```

3.  Importa el esquema inicial:
    ```bash
    # Asumiendo que estás en /var/www/html/drivetime
    mysql -u drivetime_user -p drivetime < database/schema_mysql.sql
    # (Te pedirá la contraseña que acabas de configurar)
    ```

### 4. Configuración del Backend (PHP)

El backend necesita las credenciales para conectarse a la base de datos.

1.  Ve al directorio del backend:
    ```bash
    cd drivetime-backend
    ```

2.  Crea el archivo de configuración a partir del ejemplo:
    ```bash
    sudo cp config.example.php config.php
    ```

3.  Edita el archivo `config.php`:
    ```bash
    sudo nano config.php
    ```

4.  **IMPORTANTE:** Modifica las siguientes variables con tus datos reales:
    -   `$username`: 'drivetime_user'
    -   `$password`: 'tu_password_segura' (la que pusiste en MySQL)
    -   `$jwt_secret_key`: Cambia esto por una cadena larga y aleatoria para la seguridad de los tokens.
    -   (Opcional) Revisa `$allowed_origins` si vas a usar un dominio específico.

    Guarda con `Ctrl+O`, `Enter` y sal con `Ctrl+X`.

### 5. Configuración del Frontend (React con pnpm)

Prepararemos el frontend para producción.

1.  Ve al directorio del frontend:
    ```bash
    cd ../drivetime-frontend
    ```

2.  **Limpieza y Dependencias:**
    Como vamos a usar `pnpm`, eliminaremos `package-lock.json` para evitar conflictos y luego instalaremos las dependencias.

    ```bash
    # Eliminar lockfile de npm si existe
    sudo rm -f package-lock.json

    # Instalar dependencias con pnpm
    sudo pnpm install
    ```

3.  **Configurar Variables de Entorno:**
    ```bash
    sudo cp .env.example .env
    sudo nano .env
    ```

    Asegúrate de que la URL apunte a tu dominio o IP. Para la configuración estándar con Apache (ver paso 6), debe ser relativa (`/api`) o completa.

    ```env
    # Opción A (Recomendada para producción con el VirtualHost de abajo):
    VITE_API_URL=/api

    # Opción B (Si usas dominio completo):
    # VITE_API_URL=http://tu-dominio.com/api
    ```

4.  **Compilar el proyecto:**
    ```bash
    sudo pnpm run build
    ```
    Esto generará una carpeta `dist/` con la aplicación optimizada.

### 6. Configuración de Apache (VirtualHost)

Configuraremos Apache para servir el frontend y el backend correctamente.

1.  Crea un nuevo archivo de configuración para el sitio:
    ```bash
    sudo nano /etc/apache2/sites-available/drivetime.conf
    ```

2.  Pega el siguiente contenido (reemplaza `tu-dominio.com` por tu dominio real o tu IP pública):

    ```apache
    <VirtualHost *:80>
        # Cambia esto por tu dominio o IP
        ServerName tu-dominio.com
        # ServerAlias www.tu-dominio.com

        ServerAdmin webmaster@localhost
        DocumentRoot /var/www/html/drivetime/drivetime-frontend/dist

        # 1. Configuración del Backend (API)
        # Es crucial definir el Alias antes de las reglas del frontend
        Alias /api /var/www/html/drivetime/drivetime-backend/api

        <Directory /var/www/html/drivetime/drivetime-backend/api>
            Options Indexes FollowSymLinks
            AllowOverride All
            Require all granted

            # Desactivar el motor de reescritura aquí para que la API maneje sus propias rutas
            # o para evitar que las reglas del frontend interfieran.
            RewriteEngine Off
        </Directory>

        # 2. Configuración del Frontend (React SPA)
        <Directory /var/www/html/drivetime/drivetime-frontend/dist>
            Options Indexes FollowSymLinks
            AllowOverride All
            Require all granted

            # Reglas para Single Page Application (SPA)
            RewriteEngine On

            # Si la petición no es a /api y el archivo no existe, servir index.html
            RewriteCond %{REQUEST_URI} !^/api
            RewriteCond %{REQUEST_FILENAME} !-f
            RewriteCond %{REQUEST_FILENAME} !-d
            RewriteRule ^ index.html [QSA,L]
        </Directory>

        ErrorLog ${APACHE_LOG_DIR}/drivetime_error.log
        CustomLog ${APACHE_LOG_DIR}/drivetime_access.log combined
    </VirtualHost>
    ```

3.  Habilita el sitio y deshabilita el default (opcional):
    ```bash
    sudo a2ensite drivetime.conf
    sudo a2dissite 000-default.conf # Opcional, si solo vas a tener este sitio
    sudo systemctl reload apache2
    ```

### 7. Permisos Finales

Asegúrate de que Apache tenga permisos sobre los archivos.

```bash
sudo chown -R www-data:www-data /var/www/html/drivetime
sudo chmod -R 755 /var/www/html/drivetime
```

---

## 🔑 Acceso y Demo

Una vez completado, abre tu navegador y visita tu dominio o IP (ej: `http://tu-dominio.com` o `http://192.168.x.x`).

Deberías ver la Landing Page de DriveTime.

### Credenciales por Defecto (Base de Datos Demo)

| Rol | Email | Contraseña |
| :--- | :--- | :--- |
| **SuperAdmin** | `superadmin@drivetime.com` | `123456` |
| **Admin Escuela** | `admin@demo.com` | `123456` |
| **Instructor** | `carlos@demo.com` | `123456` |
| **Alumno** | `alumno@demo.com` | `123456` |

> **Nota:** Para loguearte, primero usa el buscador de escuelas ("Autoescuela Demo") o ve a `/login/demo`.
