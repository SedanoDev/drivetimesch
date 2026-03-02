# DriveTime Booking System

A robust, multi-tenant driving school management system built with PHP (Backend) and React (Frontend).

## 🌐 Demo en Vivo

Puedes probar la demo en vivo de la aplicación aquí: [http://18.201.99.184:5173/](http://18.201.99.184:5173/)

## 🚀 Quick Start (Docker)

The easiest way to run the project is using Docker. This ensures all dependencies (PHP, Apache, MySQL, Node) are correctly configured.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/SedanoDev/drivetimesch.git drivetime
    cd drivetime
    ```

2.  **Run the Setup Script:**
    ```bash
    ./setup_project.sh
    ```
    *This script builds the containers and starts the application.*

3.  **Access the App:**
    -   **Frontend:** [http://localhost:5173](http://localhost:5173)
    -   **API:** [http://localhost:8000/api](http://localhost:8000/api)

## 🏗️ Architecture

-   **Backend:** PHP 8.2 (Service-Oriented Architecture), Composer, JWT Auth.
-   **Frontend:** React, TypeScript, Vite, TailwindCSS.
-   **Database:** MySQL 8.0.

## 🔑 Default Credentials

-   **SuperAdmin:** `superadmin@drivetime.com` / `123456`
-   **Admin:** `admin@demo.com` / `123456`
-   **Instructor:** `carlos@demo.com` / `123456`
-   **Student:** `alumno@demo.com` / `123456`

## 🛠️ Troubleshooting

-   **"Database Connection Failed":** Ensure the Docker containers are running (`docker-compose ps`).
-   **Rebuilding:** If you change dependencies, run `docker-compose up --build -d`.

## 🖥️ Instalación en Ubuntu Server (con Docker)

A continuación se detallan los pasos para desplegar DriveTime en un servidor Ubuntu utilizando Docker, que es la forma recomendada y más sencilla de poner la aplicación en marcha.

### 1. Instalar Docker y Docker Compose

Si tu servidor Ubuntu aún no tiene Docker instalado, ejecuta los siguientes comandos:

```bash
# Actualizar los paquetes del sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias necesarias
sudo apt install ca-certificates curl gnupg lsb-release git unzip -y

# Añadir la clave GPG oficial de Docker
sudo mkdir -m 0755 -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Configurar el repositorio de Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker Engine, CLI y Docker Compose
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y

# Asegurarse de que el servicio de Docker esté corriendo
sudo systemctl enable docker
sudo systemctl start docker
```

*Nota: Para ejecutar comandos de docker sin `sudo`, puedes añadir tu usuario al grupo docker: `sudo usermod -aG docker $USER` y reiniciar sesión.*

### 2. Clonar el Repositorio

Clona el código fuente en tu servidor:

```bash
git clone https://github.com/SedanoDev/drivetimesch.git drivetime
cd drivetime
```

### 3. Ejecutar el Script de Configuración

El proyecto incluye un script automatizado que construye los contenedores, instala las dependencias (como Composer) e inicializa la base de datos.

```bash
# Dar permisos de ejecución al script si es necesario
chmod +x setup_project.sh

# Ejecutar el script
./setup_project.sh
```

El script se encargará de:
1. Generar variables de entorno (como `JWT_SECRET` y credenciales de BD).
2. Levantar los contenedores de Docker (Apache, PHP, MySQL, Frontend).
3. Instalar las dependencias de PHP usando Composer.
4. Inicializar la base de datos y cargar los datos de ejemplo.

### 4. Acceder a la Aplicación

Una vez que el script finalice correctamente, la aplicación estará disponible en la IP o dominio de tu servidor en los siguientes puertos:

-   **Frontend:** `http://<IP_DE_TU_SERVIDOR>:5173`
-   **API (Backend):** `http://<IP_DE_TU_SERVIDOR>:8000/api`

*(Asegúrate de que los puertos 5173 y 8000 estén abiertos en el firewall o grupo de seguridad de tu servidor)*
