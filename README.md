# DriveTime - SaaS de Reservas de Clases de Conducir

Este proyecto es una solución moderna para la gestión de reservas de clases de conducir, diseñada para ofrecer una experiencia de usuario (UX) fluida y profesional.

Está compuesto por un **Frontend en React + TypeScript + Tailwind CSS** que simula un proceso de reserva paso a paso, y un esquema de base de datos **PostgreSQL** listo para integrarse con **PostgREST**.

---

## 📋 Requisitos Previos

Para ejecutar este proyecto necesitarás tener instalado:

*   **Node.js** (v18 o superior): Para ejecutar el frontend.
*   **PostgreSQL** (v13 o superior): Base de datos relacional.
*   **PostgREST** (Opcional, para producción): Para exponer tu base de datos como una API REST automáticamente.

---

## 🚀 Instalación y Ejecución

### 1. Frontend (Interfaz de Usuario)

El frontend está construido con Vite, lo que lo hace muy rápido y ligero.

1.  Navega al directorio del frontend:
    ```bash
    cd drivetime-frontend
    ```

2.  Instala las dependencias:
    ```bash
    npm install
    ```

3.  Inicia el servidor de desarrollo:
    ```bash
    npm run dev
    ```

4.  Abre tu navegador en `http://localhost:5173` para ver la aplicación funcionando con datos de prueba (Mocks).

### 2. Base de Datos (Backend)

Hemos incluido un archivo SQL con el esquema completo de la base de datos, optimizado para trabajar con PostgREST.

1.  Asegúrate de tener un servidor PostgreSQL corriendo.
2.  Ejecuta el script `database/schema.sql` en tu base de datos. Puedes hacerlo desde la línea de comandos:

    ```bash
    psql -U tu_usuario -d tu_base_de_datos -f database/schema.sql
    ```

    **Este script creará:**
    *   Tabla `instructors` (Profesores)
    *   Tabla `bookings` (Reservas)
    *   Extensiones necesarias (UUID)
    *   Políticas de seguridad (RLS - Row Level Security)
    *   Datos de ejemplo iniciales

### 3. Integración con PostgREST (Futuro)

Actualmente, el frontend utiliza datos simulados (`src/data/mock-data.ts`) para demostración. Para conectar con tu base de datos real a través de PostgREST:

1.  Instala y ejecuta PostgREST apuntando a tu base de datos.
2.  En el frontend, reemplaza las llamadas a `mock-data.ts` por llamadas `fetch` a tu API de PostgREST (ej: `http://localhost:3000/instructors`).

---

## 📂 Estructura del Proyecto

*   `/drivetime-frontend`: Código fuente de la aplicación React.
    *   `src/components/booking`: Componentes del flujo de reserva (Calendario, Horarios, Profesores).
    *   `src/layouts`: Diseño principal de la página.
    *   `src/data`: Datos de prueba.
*   `/database`: Scripts SQL para la creación de la base de datos.

---

## ✨ Características

*   **Diseño Responsivo**: Funciona en móviles y escritorio.
*   **Flujo de 4 Pasos**: Selección de Fecha -> Hora -> Profesor -> Confirmación.
*   **Validaciones**: Evita seleccionar horarios pasados o profesores no disponibles.
*   **UI Moderna**: Uso de Tailwind CSS para una apariencia limpia y profesional.
