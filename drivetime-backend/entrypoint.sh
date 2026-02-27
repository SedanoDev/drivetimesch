#!/bin/bash
set -e

# Check if vendor directory exists, if not install dependencies
if [ ! -f "vendor/autoload.php" ]; then
    echo "📦 Vendor directory missing. Installing Composer dependencies..."
    composer install --no-interaction --prefer-dist --optimize-autoloader
else
    echo "✅ Vendor directory exists."
fi

# Ensure permissions are correct for Apache
# We use '|| true' to avoid failing if permissions can't be changed (e.g. some bind mounts)
chown -R www-data:www-data /var/www/html || true

# Start Apache
echo "🚀 Starting Apache..."
exec apache2-foreground
