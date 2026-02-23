# DriveTime - SaaS de Reservas de Clases de Conducir

Este proyecto es una solución completa para la gestión de reservas, construida con una arquitectura moderna **Frontend-Backend**.

*   **Frontend**: React (Vite) + TypeScript + Tailwind CSS.
*   **Backend**: PHP + MySQL + Apache.

---

## 📋 Requisitos Previos

Para ejecutar este proyecto necesitarás:

1.  **Node.js** (v18+): Para compilar el frontend.
2.  **Servidor Web (Apache/Nginx)**: Recomendado XAMPP, MAMP, o un servidor LAMP estándar.
3.  **PHP** (v7.4+): Con extensión `pdo_mysql` habilitada.
4.  **MySQL/MariaDB**: Base de datos.

---

## 🚀 Instalación y Despliegue

### 1. Configuración de la Base de Datos (MySQL)

1.  Abre tu herramienta de gestión de base de datos (phpMyAdmin, MySQL Workbench, DBeaver).
2.  Crea una base de datos llamada `drivetime`.
3.  Ejecuta el script SQL ubicado en `database/schema_mysql.sql`.
    *   Esto creará las tablas `instructors` y `bookings` e insertará datos de ejemplo.

### 2. Configuración del Backend (PHP)

1.  Copia la carpeta `drivetime-backend` a tu directorio raíz del servidor web (ej: `htdocs` en XAMPP o `/var/www/html` en Linux).
2.  Edita el archivo `drivetime-backend/config.php` y actualiza las credenciales de la base de datos:
    ```php
    $host = 'localhost';
    $db_name = 'drivetime';
    $username = 'root'; // Tu usuario
    $password = '';     // Tu contraseña
    ```
3.  Verifica que la API funciona accediendo a: `http://localhost/drivetime-backend/api/instructors.php`. Deberías ver un JSON con los instructores.

### 3. Configuración del Frontend (React)

1.  Navega al directorio del frontend:
    ```bash
    cd drivetime-frontend
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    ```
3.  Crea un archivo `.env` en la raíz de `drivetime-frontend` para apuntar a tu API PHP local:
    ```env
    VITE_API_URL=http://localhost/drivetime-backend/api
    ```
4.  Para desarrollo local (con Hot Reload):
    ```bash
    npm run dev
    ```
5.  Para **Producción** (Despliegue en Apache):
    *   Ejecuta `npm run build`. Esto creará una carpeta `dist`.
    *   Copia el contenido de la carpeta `dist` al directorio raíz de tu servidor web (ej: `htdocs/drivetime`).
    *   Asegúrate de copiar también el archivo `.htaccess` del frontend para que el enrutamiento funcione correctamente.

---

## 📂 Estructura del Proyecto Final

```text
/var/www/html/ (o htdocs)
├── drivetime-backend/       # API PHP
│   ├── api/
│   │   ├── instructors.php
│   │   ├── bookings.php
│   │   └── availability.php
│   └── config.php
│
└── drivetime/               # Frontend React Compilado (carpeta dist)
    ├── index.html
    ├── assets/
    └── .htaccess
```

---

## ✨ Características

*   **Arquitectura Headless**: El frontend React consume una API REST en PHP.
*   **Base de Datos Relacional**: MySQL gestiona la integridad de los datos.
*   **Seguridad**: Uso de sentencias preparadas (PDO) para evitar Inyecciones SQL.
*   **UX Moderna**: Interfaz reactiva y rápida gracias a React y Tailwind.
