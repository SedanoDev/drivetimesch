# DriveTime - SaaS de Reservas de Clases de Conducir (Multi-Tenant)

DriveTime es una plataforma completa para la gestión de autoescuelas, construida con React (Frontend) y PHP/MySQL (Backend).

## 📋 Requisitos Previos

Necesitas un servidor o entorno local con la pila **LAMP** (Linux, Apache, MySQL, PHP) y **Node.js** para compilar el frontend.

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install apache2 mysql-server php php-mysql php-pdo nodejs npm git -y
```

Asegúrate de que el módulo `rewrite` de Apache esté activo:
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

---

## 🚀 Guía de Instalación Paso a Paso

### 1. Clonar el Repositorio

Recomendamos clonar el proyecto directamente en la raíz de tu servidor web (`/var/www/html`).

```bash
cd /var/www/html
sudo git clone https://github.com/tu-usuario/drivetime.git drivetime
cd drivetime
```

### 2. Configuración de la Base de Datos

1.  Entra en MySQL:
    ```bash
    sudo mysql -u root -p
    ```
2.  Crea la base de datos y usuario:
    ```sql
    CREATE DATABASE drivetime;
    CREATE USER 'drivetime_user'@'localhost' IDENTIFIED BY 'tu_password_segura';
    GRANT ALL PRIVILEGES ON drivetime.* TO 'drivetime_user'@'localhost';
    FLUSH PRIVILEGES;
    EXIT;
    ```
3.  Importa el esquema:
    ```bash
    mysql -u drivetime_user -p drivetime < database/schema_mysql.sql
    ```

### 3. Configuración del Backend (PHP)

El backend necesita saber cómo conectarse a la base de datos. Por seguridad, el archivo de configuración no se incluye y debes crearlo.

1.  Ve a la carpeta del backend:
    ```bash
    cd /var/www/html/drivetime/drivetime-backend
    ```
2.  Copia el ejemplo y edítalo:
    ```bash
    cp config.example.php config.php
    nano config.php
    ```
3.  Modifica las líneas con tus datos:
    ```php
    $username = 'drivetime_user';
    $password = 'tu_password_segura';
    $jwt_secret_key = 'cambia_esto_por_una_frase_larga_y_secreta';
    ```

### 4. Configuración del Frontend (React)

El frontend necesita saber dónde está la API del backend.

1.  Ve a la carpeta del frontend:
    ```bash
    cd /var/www/html/drivetime/drivetime-frontend
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  Copia el archivo de entorno y edítalo:
    ```bash
    cp .env.example .env
    nano .env
    ```
4.  Establece la URL de tu API (Backend). Si usas el VirtualHost recomendado abajo, será:
    ```env
    VITE_API_URL=http://tu-dominio.com/api
    ```
    *(Si pruebas en local sin dominio, usa `http://localhost/drivetime-backend/api`)*

5.  Compila el proyecto para producción:
    ```bash
    npm run build
    ```
    Esto creará una carpeta `dist/` con los archivos optimizados.

### 5. Despliegue en Apache (VirtualHost)

Para que la aplicación funcione correctamente (especialmente las rutas de React), crearemos un VirtualHost que sirva el frontend compilado y permita acceso a la API.

1.  Crea el archivo de configuración:
    ```bash
    sudo nano /etc/apache2/sites-available/drivetime.conf
    ```

2.  Pega el siguiente contenido (ajusta `ServerName` y las rutas si cambiaste la carpeta):

    ```apache
    <VirtualHost *:80>
        ServerName tu-dominio.com
        ServerAdmin webmaster@localhost

        # 1. Configurar el Backend en /api (PRIMERO para evitar conflictos con React)
        Alias /api /var/www/html/drivetime/drivetime-backend/api

        <Directory /var/www/html/drivetime/drivetime-backend/api>
            Options Indexes FollowSymLinks
            AllowOverride All
            Require all granted
            # Asegurar que no se apliquen las reglas de reescritura del frontend aquí
            RewriteEngine Off
        </Directory>

        # 2. Servir el Frontend compilado como raíz
        DocumentRoot /var/www/html/drivetime/drivetime-frontend/dist

        <Directory /var/www/html/drivetime/drivetime-frontend/dist>
            Options Indexes FollowSymLinks
            AllowOverride All
            Require all granted
            
            # Redirigir todas las rutas a index.html (necesario para React Router)
            RewriteEngine On
            RewriteCond %{REQUEST_URI} !^/api
            RewriteCond %{REQUEST_FILENAME} !-f
            RewriteCond %{REQUEST_FILENAME} !-d
            RewriteRule ^ index.html [QSA,L]
        </Directory>

        ErrorLog ${APACHE_LOG_DIR}/drivetime_error.log
        CustomLog ${APACHE_LOG_DIR}/drivetime_access.log combined
    </VirtualHost>
    ```

3.  Activa el sitio y recarga Apache:
    ```bash
    sudo a2ensite drivetime.conf
    sudo systemctl reload apache2
    ```

---

## 🔑 Acceso y Demo

Una vez desplegado, accede a tu dominio (ej: `http://tu-dominio.com`).

Para probar la plataforma, usa estas credenciales pre-generadas:

| Rol | Email | Contraseña |
| :--- | :--- | :--- |
| **SuperAdmin** | `superadmin@drivetime.com` | `123456` |
| **Admin Escuela** | `admin@demo.com` | `123456` |
| **Instructor** | `carlos@demo.com` | `123456` |
| **Alumno** | `alumno@demo.com` | `123456` |

> **Nota:** El flujo de login comienza buscando la autoescuela. Usa el buscador para encontrar "Autoescuela Demo" o ve directamente a `/login/demo`.
