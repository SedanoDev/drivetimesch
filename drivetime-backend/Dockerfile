FROM php:8.2-apache

# 1. Install System Dependencies & PHP Extensions
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    && docker-php-ext-install pdo_mysql zip mbstring exif pcntl bcmath gd \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 2. Install Composer Globally
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files and install dependencies (caching layer)
COPY composer.* ./
RUN composer install --no-dev --optimize-autoloader --no-scripts

# 3. Copy application code & Set Permissions
COPY . .
RUN chown -R www-data:www-data /var/www/html \
    && a2enmod rewrite \
    && echo '<Directory /var/www/html/api>\nAllowOverride All\n</Directory>' >> /etc/apache2/sites-available/000-default.conf

EXPOSE 80

# Setup Entrypoint
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["apache2-foreground"]
