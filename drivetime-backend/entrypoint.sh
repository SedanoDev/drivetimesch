#!/bin/bash
set -e

echo "🚀 Starting backend container entrypoint..."

# Ensure we are in the correct directory
cd /var/www/html

# Check if vendor autoload exists to skip redundant install
if [ -f vendor/autoload.php ]; then
    echo "✅ Vendor OK (autoload.php found), skipping composer install."
else
    echo "📦 Vendor missing. Installing composer dependencies..."
    composer install --no-dev --optimize-autoloader --no-scripts
fi

# Set permissions for Apache (www-data)
echo "🔧 Setting permissions..."
chown -R www-data:www-data /var/www/html || true
chmod -R 775 /var/www/html || true

# Start Apache in foreground
echo "🚀 Starting Apache..."
exec apache2-foreground
