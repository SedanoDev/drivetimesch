# DriveTime Booking System

A robust, multi-tenant driving school management system built with PHP (Backend) and React (Frontend).

## 🌐 Live Demo

Check out the live demo of the application here: [http://18.201.99.184:5173/](http://18.201.99.184:5173/)

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

## 🖥️ Manual Setup (Ubuntu Server / LAMP Stack)

If you prefer not to use Docker, you can set up DriveTime on an Ubuntu server running a standard LAMP stack.

### 1. Install Prerequisites

Install Apache, MySQL, PHP, and required extensions:

```bash
sudo apt update
sudo apt install apache2 mysql-server php libapache2-mod-php php-mysql php-xml php-mbstring php-curl unzip git
```

Install Composer (PHP dependency manager):

```bash
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php --install-dir=/usr/local/bin --filename=composer
php -r "unlink('composer-setup.php');"
```

Install Node.js and pnpm (for the frontend):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm
```

### 2. Clone the Repository

Clone the project into your web directory:

```bash
cd /var/www/html
sudo git clone https://github.com/SedanoDev/drivetimesch.git drivetime
cd drivetime
```

### 3. Backend Setup

Install PHP dependencies using Composer:

```bash
cd drivetime-backend
composer install
```

Configure backend environment variables:

```bash
cp .env.example .env
# Edit .env to set your database credentials and generate a JWT_SECRET
nano .env
```

### 4. Database Setup

Create the database and run the setup script to initialize the schema and seed data. Update the script or run it from the command line:

```bash
# From the root directory or database folder:
php setup_db.php
```
*(Make sure to configure the database credentials in `setup_db.php` or your `.env` so the script can connect to MySQL)*

### 5. Frontend Setup

Install Node dependencies and build the frontend:

```bash
cd ../drivetime-frontend
cp .env.example .env
# Edit .env and ensure VITE_API_URL is set correctly (e.g., /api)
nano .env

pnpm install
pnpm run build
```

### 6. Apache Configuration

Configure an Apache VirtualHost. Crucially, define the Alias for the backend API **before** the DocumentRoot block for the frontend.

Create a new configuration file:

```bash
sudo nano /etc/apache2/sites-available/drivetime.conf
```

Add the following configuration (adjust paths and server names as needed):

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    # ServerAlias www.yourdomain.com

    # Backend API Alias (Must come before DocumentRoot)
    Alias /api /var/www/html/drivetime/drivetime-backend/api
    <Directory /var/www/html/drivetime/drivetime-backend/api>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Frontend DocumentRoot
    DocumentRoot /var/www/html/drivetime/drivetime-frontend/dist
    <Directory /var/www/html/drivetime/drivetime-frontend/dist>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted

        # Fallback routing for React Router
        RewriteEngine On
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^ index.html [QSA,L]
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/drivetime_error.log
    CustomLog ${APACHE_LOG_DIR}/drivetime_access.log combined
</VirtualHost>
```

Enable the site and required modules, then restart Apache:

```bash
sudo a2enmod rewrite
sudo a2ensite drivetime.conf
sudo systemctl restart apache2
```

Your DriveTime application should now be accessible at your configured domain!
