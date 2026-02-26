# DriveTime

Platform for driving schools (SaaS).

## Requirements

*   PHP 8.0+
*   MySQL 5.7+ or MariaDB 10+
*   Node.js 18+ & pnpm
*   Apache Web Server (recommended)

## Installation (Quick Start)

### 1. Database & Backend Setup

1.  **Clone the repo** into your web server directory (e.g., `/var/www/html/drivetime`).
2.  **Configure Database:**
    The project comes with a pre-configured `drivetime-backend/config.php` for development:
    *   User: `root`
    *   Password: `root` (also tries empty password)
    *   Database: `drivetime`

    Make sure your local MySQL server matches these credentials, or edit `drivetime-backend/config.php`.

3.  **Initialize Data:**
    Run the setup script to create the database, tables, and seed data:
    ```bash
    php setup_db.php
    ```
    *This creates a Demo Tenant with consistent users and instructors.*

### 2. Frontend Setup

1.  Navigate to frontend:
    ```bash
    cd drivetime-frontend
    ```
2.  Install dependencies:
    ```bash
    pnpm install
    ```
3.  Start development server:
    ```bash
    pnpm dev
    ```

## Default Credentials (Demo)

*   **Admin:** `admin@demo.com` / `123456`
*   **Student:** `alumno@demo.com` / `123456`
*   **Instructor:** `carlos@demo.com` / `123456`
*   **SuperAdmin:** `superadmin@drivetime.com` / `123456`

## Troubleshooting

*   **"Instructor not found in this organization"**: Run `php setup_db.php` to realign the tenant IDs.
*   **Database Connection Failed**: Check `drivetime-backend/config.php`.
