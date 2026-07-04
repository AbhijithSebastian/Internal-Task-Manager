#!/usr/bin/env bash
# =============================================================================
# Internal Task Manager — Production Deployment Script
# =============================================================================
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# Assumptions:
#   - Run from project root
#   - .env is already configured with production values
#   - PostgreSQL 15+ is running and accessible
#   - Redis is running and accessible
#   - PHP 8.3+, Composer, Node.js 20+, npm are installed
#   - Supervisor manages Horizon (see supervisor-horizon.conf)
#   - Cron is configured for the scheduler (see deploy checklist)
# =============================================================================

set -euo pipefail

# ─── Color helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'
BOLD='\033[1m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $*"; exit 1; }

# ─── Pre-flight checks ────────────────────────────────────────────────────────
info "Running pre-flight checks..."

command -v php      >/dev/null 2>&1 || fail "PHP is not installed"
command -v composer >/dev/null 2>&1 || fail "Composer is not installed"
command -v node     >/dev/null 2>&1 || fail "Node.js is not installed"
command -v npm      >/dev/null 2>&1 || fail "npm is not installed"

PHP_VER=$(php -r "echo PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION;")
info "PHP version:   $PHP_VER"
info "Composer:      $(composer --version 2>/dev/null | head -1)"
info "Node.js:       $(node --version)"
info "npm:           $(npm --version)"

[ -f .env ] || fail ".env file not found. Copy .env.production to .env and configure it first."
[ -f artisan ] || fail "Not in project root (artisan not found). Run this script from the project root."

# ─── Maintenance mode ON ──────────────────────────────────────────────────────
info "Enabling maintenance mode..."
php artisan down --retry=30

# ─── Git pull (optional — uncomment if using git-based deployment) ────────────
# info "Pulling latest code..."
# git pull origin main

# ─── PHP dependencies ─────────────────────────────────────────────────────────
info "Installing PHP dependencies (production, no dev)..."
composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist
ok "Composer dependencies installed."

# ─── JS dependencies & build ──────────────────────────────────────────────────
info "Installing JS dependencies..."
npm install --legacy-peer-deps --no-audit --no-fund
ok "npm dependencies installed."

info "Building frontend assets..."
npm run build
ok "Frontend assets built."

# ─── Storage ──────────────────────────────────────────────────────────────────
info "Setting up storage..."

# Create required directories
mkdir -p storage/app/private
mkdir -p storage/app/attachments
mkdir -p storage/app/backups
mkdir -p storage/framework/cache
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/logs

# Set permissions (web server needs write access)
chmod -R 775 storage
chmod -R 775 bootstrap/cache

# Create public/storage symlink (safe to run repeatedly — no-op if exists)
php artisan storage:link --force
ok "Storage directories and permissions configured."

# ─── Cache ────────────────────────────────────────────────────────────────────
info "Caching config, routes, views, and events..."

php artisan config:cache
ok "Config cached."

php artisan route:cache
ok "Routes cached."

php artisan view:cache
ok "Views cached."

php artisan event:cache
ok "Events cached."

# ─── Database ─────────────────────────────────────────────────────────────────
info "Running database migrations..."
php artisan migrate --force
ok "Migrations complete."

# ─── Horizon restart ──────────────────────────────────────────────────────────
info "Restarting Horizon..."
php artisan horizon:terminate
ok "Horizon will restart gracefully on next process."

# ─── Queue restart ────────────────────────────────────────────────────────────
# Fallback: if Horizon is not in use, uncomment this:
# php artisan queue:restart

# ─── Maintenance mode OFF ─────────────────────────────────────────────────────
info "Disabling maintenance mode..."
php artisan up

# ─── Post-deploy verification ─────────────────────────────────────────────────
info "Running post-deploy health check..."
php artisan monitor:health --format=table --fail-on-error && ok "Health check passed" || warn "Health check reported issues (non-fatal)"

info "Verifying queue status..."
php artisan queue:check-failed && ok "No failed jobs" || warn "Failed jobs detected"

info "Verifying Horizon..."
php artisan horizon:status && ok "Horizon is running" || warn "Horizon is not running (start with: php artisan horizon)"

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}✓ Deployment complete!${NC}"
echo ""
php artisan about --only=environment
