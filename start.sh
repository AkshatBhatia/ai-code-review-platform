#!/bin/bash

# AI Code Review Platform - Development Startup Script

set -e

echo "🚀 Starting AI Code Review Platform Development Environment"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local
    echo "⚠️  Please edit .env.local with your actual configuration values"
fi

echo "🐳 Starting Docker services..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
docker-compose exec -T postgres pg_isready -U postgres || {
    echo "❌ PostgreSQL failed to start"
    exit 1
}

docker-compose exec -T redis redis-cli ping || {
    echo "❌ Redis failed to start"
    exit 1
}

echo "✅ Services are ready!"
echo ""
echo "🔗 Service URLs:"
echo "  • PostgreSQL: localhost:5432"
echo "  • Redis: localhost:6379"
echo "  • PgAdmin: http://localhost:8080 (run with --profile tools)"
echo ""
echo "📊 To view database:"
echo "  docker-compose --profile tools up -d pgadmin"
echo "  Login: admin@example.com / admin123"
echo ""
echo "🧪 To test database connection:"
echo "  docker-compose exec postgres psql -U postgres -d ai_code_review -c 'SELECT * FROM health_check;'"