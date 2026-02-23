# DriveTime - SaaS de Reservas de Clases de Conducir

Este proyecto es una solución completa para la gestión de reservas, construida con una arquitectura moderna **Frontend-Backend**.

*   **Frontend**: React (Vite) + TypeScript + Tailwind CSS.
*   **Backend**: PHP + MySQL + Apache.

---

## 📋 Guía de Instalación en Ubuntu (Paso a Paso)

Sigue estos comandos para configurar un servidor Ubuntu limpio con todo lo necesario.

### 1. Instalar el Stack LAMP (Linux, Apache, MySQL, PHP)

Actualiza los repositorios e instala los paquetes necesarios:

```bash
sudo apt update
sudo apt install apache2 mysql-server php php-mysql php-pdo nodejs npm -y
```

Verifica las versiones instaladas:
```bash
php -v
mysql --version
node -v
```

### 2. Configurar la Base de Datos (MySQL)

1.  Inicia la configuración segura de MySQL (opcional pero recomendado):
    ```bash
    sudo mysql_secure_installation
    ```

2.  Entra a la consola de MySQL:
    ```bash
    sudo mysql
    ```

3.  Ejecuta los siguientes comandos SQL para crear la base de datos y el usuario:

    ```sql
    -- Crear base de datos
    CREATE DATABASE drivetime;

    -- Crear usuario (cambia 'tu_password_segura' por una real)
    CREATE USER 'drivetime_user'@'localhost' IDENTIFIED BY 'tu_password_segura';

    -- Dar permisos
    GRANT ALL PRIVILEGES ON drivetime.* TO 'drivetime_user'@'localhost';
    FLUSH PRIVILEGES;
    EXIT;
    ```

4.  Importa el esquema de la base de datos:
    Assuming you have cloned the repo to `~/drivetime`:
    ```bash
    sudo mysql -u drivetime_user -p drivetime < ~/drivetime/database/schema_mysql.sql
    ```

### 3. Configurar el Backend (PHP)

1.  Copia los archivos del backend al directorio web de Apache:
    ```bash
    sudo mkdir -p /var/www/html/api
    sudo cp -r ~/drivetime/drivetime-backend/* /var/www/html/
    ```

2.  Configura la conexión a la base de datos:
    Edita el archivo `config.php`:
    ```bash
    sudo nano /var/www/html/config.php
    ```
    Actualiza con los datos que creaste en el paso 2:
    ```php
    $host = 'localhost';
    $db_name = 'drivetime';
    $username = 'drivetime_user';
    $password = 'tu_password_segura';
    ```

3.  Asegura los permisos correctos:
    ```bash
    sudo chown -R www-data:www-data /var/www/html
    sudo chmod -R 755 /var/www/html
    ```

### 4. Configurar Apache

1.  Habilita el módulo `rewrite` para que funcionen las rutas amigables:
    ```bash
    sudo a2enmod rewrite
    ```

2.  Edita la configuración del sitio por defecto para permitir `.htaccess`:
    ```bash
    sudo nano /etc/apache2/sites-available/000-default.conf
    ```
    Añade el bloque `<Directory>` dentro de `<VirtualHost>`:
    ```apache
    <VirtualHost *:80>
        ServerAdmin webmaster@localhost
        DocumentRoot /var/www/html

        <Directory /var/www/html>
            Options Indexes FollowSymLinks
            AllowOverride All
            Require all granted
        </Directory>

        ErrorLog ${APACHE_LOG_DIR}/error.log
        CustomLog ${APACHE_LOG_DIR}/access.log combined
    </VirtualHost>
    ```

3.  Reinicia Apache:
    ```bash
    sudo systemctl restart apache2
    ```

### 5. Compilar y Desplegar el Frontend (React)

1.  Ve al directorio del frontend e instala las dependencias:
    ```bash
    cd ~/drivetime/drivetime-frontend
    npm install
    ```

2.  Configura la URL de la API para producción:
    Crea un archivo `.env.production`:
    ```bash
    nano .env.production
    ```
    Añade:
    ```env
    VITE_API_URL=http://tu_dominio_o_ip/api
    ```

3.  Compila la aplicación:
    ```bash
    npm run build
    ```

4.  Despliega los archivos compilados:
    Copia el contenido de la carpeta `dist` a la raíz de tu servidor web:
    ```bash
    sudo cp -r dist/* /var/www/html/
    ```
    *(Nota: Esto sobrescribirá el `index.html` por defecto de Apache)*

---

## ✅ Verificación Final

1.  Abre tu navegador y ve a `http://tu_dominio_o_ip/`.
    *   Deberías ver la aplicación de DriveTime cargando.
2.  Intenta hacer una reserva.
    *   Si todo está bien, la aplicación se comunicará con `http://tu_dominio_o_ip/api/bookings.php` y guardará la reserva en MySQL.

---

## 📂 Estructura en el Servidor (/var/www/html)

```text
/var/www/html/
├── api/                 # API PHP
│   ├── instructors.php
│   ├── bookings.php
│   └── ...
├── assets/              # Archivos JS/CSS del Frontend compilado
├── config.php           # Configuración de BD
├── index.html           # Punto de entrada de React
└── .htaccess            # Reglas de enrutamiento
```
