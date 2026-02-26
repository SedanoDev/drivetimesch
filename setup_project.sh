#!/bin/bash

# setup_project.sh
# Automates the setup of the DriveTime development environment using Docker.

echo "🚀 Starting DriveTime Setup..."

# 1. Check for Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed. Please install Docker Desktop first."
    exit 1
fi

# 2. Setup Environment Variables
echo "🔧 Configuring Environment..."
if [ ! -f .env ]; then
    echo "JWT_SECRET=$(openssl rand -hex 32)" > .env
    echo "DB_ROOT_PASSWORD=rootpassword" >> .env
    echo "DB_USER=drivetime_user" >> .env
    echo "DB_PASSWORD=drivetime_password" >> .env
fi

# 3. Build and Start Containers
echo "🐳 Building Docker Containers..."
docker-compose up --build -d

# 4. Install Backend Dependencies
echo "📦 Installing Backend Dependencies..."
docker-compose exec -T backend composer install --no-interaction --prefer-dist

echo "⏳ Waiting for Database to Initialize..."
sleep 15

echo "✅ Setup Complete!"
echo "🌍 Frontend: http://localhost:5173"
echo "🔌 Backend API: http://localhost:8000/api"
echo "🗄️ Database: localhost:3306 (user: drivetime_user, pass: drivetime_password)"
