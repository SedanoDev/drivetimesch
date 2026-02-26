# DriveTime Booking System

A robust, multi-tenant driving school management system built with PHP (Backend) and React (Frontend).

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
