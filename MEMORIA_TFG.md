# MEMORIA DEL PROYECTO: DriveTime SaaS

## 1. ABREVIATURAS

*   **API**: Application Programming Interface (Interfaz de Programación de Aplicaciones).
*   **CSS**: Cascading Style Sheets (Hojas de Estilo en Cascada).
*   **HTML**: HyperText Markup Language (Lenguaje de Marcado de Hipertexto).
*   **HTTP**: Hypertext Transfer Protocol (Protocolo de Transferencia de Hipertexto).
*   **JWT**: JSON Web Token (Token Web JSON).
*   **LAMP**: Linux, Apache, MySQL, PHP (Pila de software).
*   **MVC**: Model-View-Controller (Modelo-Vista-Controlador).
*   **PDO**: PHP Data Objects (Objetos de Datos de PHP).
*   **REST**: Representational State Transfer (Transferencia de Estado Representacional).
*   **SaaS**: Software as a Service (Software como Servicio).
*   **SPA**: Single Page Application (Aplicación de Página Única).
*   **SQL**: Structured Query Language (Lenguaje de Consulta Estructurado).
*   **UI**: User Interface (Interfaz de Usuario).
*   **UX**: User Experience (Experiencia de Usuario).

## 2. INTRODUCCIÓN

El proyecto **DriveTime** nace de la necesidad de modernizar la gestión administrativa y operativa de las autoescuelas. Tradicionalmente, este sector ha dependido de procesos manuales, agendas en papel y hojas de cálculo desconectadas, lo que resulta en ineficiencias, conflictos de horarios y una experiencia de usuario pobre para los alumnos digitales de hoy en día.

DriveTime se presenta como una solución **SaaS (Software as a Service) Multi-Tenant**, permitiendo que múltiples autoescuelas utilicen la misma plataforma de manera aislada y segura. La aplicación ofrece un ecosistema completo que conecta a administradores, instructores y alumnos en tiempo real, facilitando la reserva de clases, la gestión de flotas y el seguimiento del progreso educativo.

## 3. OBJETIVOS

### 3.1 Generales

*   Desarrollar una plataforma web integral para la gestión de autoescuelas.
*   Implementar una arquitectura escalable que permita dar servicio a múltiples clientes (autoescuelas) simultáneamente.
*   Mejorar la experiencia de usuario de los alumnos mediante un sistema de reservas intuitivo y accesible desde dispositivos móviles.

### 3.2 Específicos

*   **Gestión Multi-Tenant**: Crear un sistema donde cada autoescuela (tenant) tenga sus propios datos, configuración y usuarios, aislados de los demás.
*   **Roles y Permisos**: Implementar un control de acceso basado en roles (SuperAdmin, Admin, Instructor, Alumno).
*   **Reservas en Tiempo Real**: Desarrollar un motor de reservas que verifique la disponibilidad real de los instructores y evite conflictos.
*   **Gestión de Recursos**: Permitir la administración de vehículos y la asignación de estos a instructores.
*   **Facturación y Bonos**: Implementar un sistema de "Packs de Clases" para gestionar los pagos y saldos de los alumnos.
*   **Interfaz Responsiva**: Asegurar que la aplicación sea totalmente funcional en dispositivos móviles, tablets y escritorio.

## 4. DESCRIPCIÓN TÉCNICA

### 4.1 Requisitos Necesarios para su implantación

*   **Servidor**: VPS o servidor dedicado con sistema operativo Linux (preferiblemente Ubuntu 20.04+).
*   **Dominio**: Nombre de dominio para acceder a la aplicación.
*   **Certificado SSL**: Para garantizar la seguridad de las transacciones (HTTPS).

### 4.2 Instalación

La instalación se basa en el despliegue de una pila LAMP estándar:

1.  **Backend**: Se despliega el código PHP en el servidor web Apache. Se configura `config.php` con las credenciales de base de datos y claves secretas.
2.  **Base de Datos**: Se importa el esquema `schema_mysql.sql` en un servidor MySQL/MariaDB.
3.  **Frontend**: Se compila la aplicación React (`npm run build`) y se sirven los archivos estáticos desde Apache, configurando reglas de reescritura (`mod_rewrite`) para manejar el enrutamiento de la SPA.

### 4.3 Herramientas de desarrollo utilizadas

*   **Frontend**:
    *   **React**: Librería principal para la interfaz de usuario.
    *   **TypeScript**: Para añadir tipado estático y mejorar la calidad del código.
    *   **Vite**: Empaquetador y entorno de desarrollo rápido.
    *   **Tailwind CSS**: Framework de utilidades para el diseño y estilizado.
    *   **Lucide React**: Librería de iconos.
    *   **React Router**: Para la navegación en la SPA.
*   **Backend**:
    *   **PHP 8+**: Lenguaje de servidor.
    *   **MySQL 8**: Sistema de gestión de bases de datos relacional.
    *   **PDO**: Capa de abstracción para acceso a datos.
    *   **JWT**: Para la autenticación sin estado (stateless).
*   **Control de Versiones**: Git y GitHub.

### 4.4 Aspectos de seguridad

*   **Autenticación JWT**: Los tokens se firman con un algoritmo seguro (HS256) y tienen tiempo de expiración.
*   **Hashing de Contraseñas**: Se utiliza `password_hash()` con Bcrypt, el estándar actual de la industria en PHP.
*   **Inyección SQL**: Uso estricto de sentencias preparadas (Prepared Statements) en todas las consultas a la base de datos.
*   **Aislamiento de Datos**: Todas las consultas SQL incluyen una cláusula `WHERE tenant_id = ?` obligatoria, derivada del token del usuario, para evitar fugas de datos entre autoescuelas.
*   **CORS**: Configuración controlada de Cross-Origin Resource Sharing.

## 5. APLICACIÓN Y COSTES

### 5.1 Estimación inicial

El proyecto se estimó para ser desarrollado en un periodo de 4 semanas por un desarrollador Full Stack, cubriendo las fases de análisis, diseño, implementación y pruebas.

### 5.2 Seguimientos del proyecto y coste final

Debido al uso de tecnologías open-source, el coste de licencias es cero. Los costes principales se derivan de:
*   **Desarrollo**: Horas de ingeniería.
*   **Infraestructura**: Servidor VPS (~5-10€/mes) y dominio (~12€/año).

### 5.3 Manual de usuario

*   **Administrador**: Accede a `/admin/dashboard` para ver estadísticas, gestionar altas de usuarios, configurar la escuela y ver reservas.
*   **Instructor**: Accede a `/instructor/dashboard` para ver su agenda diaria y a `/instructor/availability` para definir sus horarios.
*   **Alumno**: Accede a `/student/dashboard` para reservar nuevas clases seleccionando instructor, fecha y hora. En `/student/bookings` puede consultar su historial.

### 5.4 Licencias

El software desarrollado es propiedad intelectual del autor. Las librerías utilizadas (React, PHP, etc.) se distribuyen bajo licencias permisivas como MIT o Apache 2.0.

### 5.5 Recursos

#### 5.5.1 Hardware
*   Ordenador de desarrollo (8GB+ RAM, SSD).
*   Servidor de producción (1 vCPU, 2GB RAM, 20GB SSD mínimo).

#### 5.5.2 Software
*   Editor de código (VS Code).
*   Cliente MySQL (DBeaver o terminal).
*   Navegador Web (Chrome/Firefox).

## 6. DISEÑO

### 6.1 Esquema de Bases de Datos

El modelo de datos relacional incluye las siguientes entidades principales:

*   **tenants**: Almacena la configuración de cada autoescuela (colores, contacto, reglas).
*   **users**: Usuarios del sistema con roles y credenciales hash.
*   **instructors**: Perfiles extendidos de instructores, vinculados a usuarios.
*   **students**: Perfiles de alumnos (gestionados vía tabla users y metadatos).
*   **vehicles**: Flota de coches, asignables a instructores.
*   **bookings**: Reservas de clases, vinculando alumno, instructor y tenant.
*   **availabilities**: Horarios definidos por los instructores.
*   **class_packs**: Tipos de bonos disponibles para la venta.

### 6.2 Diagrama de Clases

*   **Frontend**: Estructura de componentes modulares (`components/admin`, `components/booking`, `layouts`). Uso de Custom Hooks (`useAuth`) para lógica compartida.
*   **Backend**: Arquitectura de Endpoints RESTful (`api/bookings.php`, `api/users.php`, etc.) que actúan como controladores, interactuando directamente con la base de datos vía PDO.

## 7. VERSIONES DE SOFTWARE

### 7.1 Prototipos

*   **v0.1**: Estructura básica y conexión a base de datos.
*   **v0.5**: Implementación de login y roles básicos.
*   **v1.0 (Actual)**: Sistema completo con gestión multi-tenant, reservas en tiempo real, panel de administración avanzado y diseño responsivo.

## 8. PRESENTACIÓN DE SOFTWARE

### 8.1 Presentación de SOFTWARE

La aplicación final presenta una interfaz limpia y moderna.
*   **Landing Page**: Página pública con buscador de autoescuelas.
*   **Dashboard Admin**: Gráficos de ingresos y ocupación.
*   **Wizard de Reservas**: Proceso paso a paso para que el alumno reserve (Instructor -> Fecha -> Hora).
*   **Gestión Móvil**: Menú lateral adaptable para uso en smartphones.

## 9. CONCLUSIÓN

El proyecto DriveTime ha cumplido con los objetivos establecidos, proporcionando una herramienta robusta para la digitalización de autoescuelas. La arquitectura elegida permite un despliegue económico y un mantenimiento sencillo.

### 9.1 Mejores propuestas

*   **App Nativa**: Desarrollar una versión en React Native reutilizando la API existente.
*   **Pagos Online**: Integración con pasarela de pago (Stripe/Redsys) para cobro automático de bonos.
*   **Notificaciones Push**: Implementar WebPush para recordatorios de clases.
*   **Geolocalización**: Seguimiento en tiempo real de las clases prácticas.

## 10. BIBLIOGRAFÍA

1.  React Documentation. https://react.dev/
2.  PHP Manual. https://www.php.net/manual/en/
3.  MySQL 8.0 Reference Manual. https://dev.mysql.com/doc/refman/8.0/en/
4.  Tailwind CSS Documentation. https://tailwindcss.com/docs

## 11. REFERENCIAS

### 11.1 REFERENCIAS

*   Vite: https://vitejs.dev/
*   Lucide Icons: https://lucide.dev/
*   Date-fns: https://date-fns.org/

## 12. ANEXOS

### 12.1 ANEXOS

*   **Anexo A**: Script de Base de Datos (`database/schema_mysql.sql`).
*   **Anexo B**: Ejemplo de configuración de VirtualHost Apache.
*   **Anexo C**: Credenciales de usuario Demo.
