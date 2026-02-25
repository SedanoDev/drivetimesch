# DriveTime - SaaS de Reservas de Clases de Conducir (Multi-Tenant)

Este proyecto es una solución completa para la gestión de reservas de múltiples autoescuelas (SaaS), construida con una arquitectura moderna **Frontend-Backend**.

*   **Frontend**: React (Vite) + TypeScript + Tailwind CSS.
*   **Backend**: PHP + MySQL + Apache.

---

## 🔑 Usuarios de Prueba (Demo)

Hemos creado usuarios con diferentes roles para que puedas probar todas las funcionalidades.

> **Contraseña para TODOS los usuarios:** `123456`

| Rol | Email | Permisos |
| :--- | :--- | :--- |
| **SuperAdmin** | `superadmin@drivetime.com` | Gestión de la plataforma y todos los tenants. |
| **Administrador** | `admin@demo.com` | Acceso total a la autoescuela "Demo" (Dashboard, Reservas, Profesores). |
| **Instructor 1** | `carlos@demo.com` | Gestión de clases y horario (Coche Manual). |
| **Instructor 2** | `ana@demo.com` | Gestión de clases y horario (Coche Automático). |
| **Alumno** | `alumno@demo.com` | Realizar nuevas reservas y cancelar las propias. |

---

## 📋 Características Principales

*   **Multi-Tenant**: Soporta múltiples autoescuelas en una sola instalación. Cada usuario pertenece a una organización (Tenant).
*   **Roles y Permisos**:
    *   **SuperAdmin**: Gestiona todas las autoescuelas.
    *   **Admin**: Gestiona su propia autoescuela.
    *   **Instructor**: Gestiona sus clases y horarios.
    *   **Alumno**: Reserva clases y ve su historial.
*   **Autenticación Segura**: Login mediante JWT (JSON Web Tokens).

---

## 🚀 Instalación y Despliegue (Ubuntu/Linux)

### 1. Requisitos Previos (LAMP Stack)

```bash
sudo apt update
sudo apt install apache2 mysql-server php php-mysql php-pdo nodejs npm -y
```

### 2. Configuración de la Base de Datos (MySQL)

1.  Crea la base de datos y usuario:
    ```sql
    CREATE DATABASE drivetime;
    CREATE USER 'drivetime_user'@'localhost' IDENTIFIED BY 'tu_password_segura';
    GRANT ALL PRIVILEGES ON drivetime.* TO 'drivetime_user'@'localhost';
    FLUSH PRIVILEGES;
    ```

2.  Importa el esquema actualizado (con soporte Multi-Tenant):
    ```bash
    mysql -u drivetime_user -p drivetime < database/schema_mysql.sql
    ```

### 3. Configuración del Backend (PHP)

1.  Copia la carpeta `drivetime-backend` a `/var/www/html/drivetime-backend`.
2.  Renombra `config.example.php` a `config.php` y edítalo con las credenciales de tu base de datos y una clave secreta para JWT.
    ```bash
    mv drivetime-backend/config.example.php drivetime-backend/config.php
    nano drivetime-backend/config.php
    ```
3.  Asegúrate de que Apache tenga habilitado `mod_rewrite` y permita `.htaccess`.
    ```bash
    sudo a2enmod rewrite
    sudo systemctl restart apache2
    ```

### 4. Configuración de Apache (VirtualHost)

Para que el frontend y el backend funcionen correctamente (especialmente con React Router y la API), configura un VirtualHost.

Crea el archivo `/etc/apache2/sites-available/drivetime.conf`:

```apache
<VirtualHost *:80>
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/html

    # Configuración para el Backend (API)
    Alias /drivetime-backend /var/www/html/drivetime-backend

    <Directory /var/www/html/drivetime-backend>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # (Opcional) Si despliegas el frontend compilado en la raíz
    # <Directory /var/www/html>
    #     Options Indexes FollowSymLinks
    #     AllowOverride All
    #     Require all granted
    #     # Redirigir todo al index.html de React (SPA)
    #     RewriteEngine On
    #     RewriteCond %{REQUEST_FILENAME} !-f
    #     RewriteCond %{REQUEST_FILENAME} !-d
    #     RewriteRule ^ index.html [QSA,L]
    # </Directory>

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
```

Activa el sitio:
```bash
sudo a2ensite drivetime.conf
sudo systemctl reload apache2
```

### 5. Ejecutar Frontend (Desarrollo)

Si estás probando en local sin compilar:

1.  Asegúrate de que el backend esté accesible en `http://localhost/drivetime-backend/api`.
2.  En `drivetime-frontend`:
    ```bash
    npm install
    npm run dev
    ```
3.  Accede a `http://localhost:5173`.

---

## 🔒 Seguridad

*   **JWT**: Todas las peticiones a la API requieren un token válido en el header `Authorization: Bearer <token>`.
*   **Aislamiento de Datos**: El backend filtra automáticamente todas las consultas por `tenant_id` extraído del token JWT, asegurando que una autoescuela nunca vea datos de otra.
