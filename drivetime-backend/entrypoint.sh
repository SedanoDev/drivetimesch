#!/bin/bash
set -e

echo "🚀 Starting backend container entrypoint..."

# Ensure we are in the correct directory
cd /var/www/html

# Check if vendor/autoload.php exists, if not, force install
if [ ! -f "vendor/autoload.php" ]; then
    echo "📦 Vendor autoload missing. Running composer install..."
    # We use --no-interaction to avoid prompts, --verbose to see output in docker logs
    composer install --no-interaction --prefer-dist --optimize-autoloader --verbose
else
    echo "✅ Vendor directory (autoload.php) found."
    # Optional: Run dump-autoload to ensure everything is fresh
    # composer dump-autoload --optimize
fi

# Set permissions for Apache (www-data)
# We make sure the files are readable/writable by the web server user
echo "🔧 Setting permissions..."
chown -R www-data:www-data /var/www/html || true
chmod -R 775 /var/www/html || true

# Start Apache in foreground
echo "🚀 Starting Apache..."
exec apache2-foreground
