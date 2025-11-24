# Deployment Guide

## Prerequisites

- Web server with PHP 7.4+ (Apache or Nginx)
- MySQL 5.7+ database
- SSL certificate (Let's Encrypt recommended)
- Google Maps API key with production restrictions

## Pre-Deployment Checklist

- [ ] Update `.env` with production values
- [ ] Set `APP_ENV=production` and `DEBUG=false`
- [ ] Configure production database credentials
- [ ] Add production Google Maps API key
- [ ] Review and restrict API key to production domain
- [ ] Set correct `SITE_URL` in `.env`
- [ ] Verify all sensitive data in `.gitignore`
- [ ] Run security audit on codebase
- [ ] Test all API endpoints
- [ ] Run data quality checks
- [ ] Backup database before deployment

## Deployment Steps

### 1. Server Setup

```bash
# SSH into production server
ssh user@yourdomain.com

# Navigate to web root
cd /var/www/html

# Clone repository
git clone https://github.com/abandini/ohiobeerpath.git
cd ohiobeerpath
```

### 2. Environment Configuration

```bash
# Copy environment file
cp .env.example .env

# Edit with production values
nano .env
```

Update these values:
```
DB_HOST=localhost
DB_NAME=ohiobrewpath_prod
DB_USER=your_db_user
DB_PASS=your_secure_password
GOOGLE_MAPS_API_KEY=your_production_api_key
SITE_URL=https://ohiobeerpath.com
APP_ENV=production
DEBUG=false
```

### 3. Database Setup

```bash
# Create production database
mysql -u root -p -e "CREATE DATABASE ohiobrewpath_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Create database user
mysql -u root -p -e "CREATE USER 'ohiobeer_user'@'localhost' IDENTIFIED BY 'secure_password';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON ohiobrewpath_prod.* TO 'ohiobeer_user'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"

# Run database setup
php setup-database.php
```

### 4. File Permissions

```bash
# Set ownership
sudo chown -R www-data:www-data /var/www/html/ohiobeerpath

# Set directory permissions
find /var/www/html/ohiobeerpath -type d -exec chmod 755 {} \;

# Set file permissions
find /var/www/html/ohiobeerpath -type f -exec chmod 644 {} \;

# Protect .env file
chmod 600 .env
```

### 5. Apache Configuration

Create: `/etc/apache2/sites-available/ohiobeerpath.conf`

```apache
<VirtualHost *:80>
    ServerName ohiobeerpath.com
    ServerAlias www.ohiobeerpath.com
    DocumentRoot /var/www/html/ohiobeerpath

    <Directory /var/www/html/ohiobeerpath>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/ohiobeerpath_error.log
    CustomLog ${APACHE_LOG_DIR}/ohiobeerpath_access.log combined
</VirtualHost>
```

Enable site:
```bash
sudo a2ensite ohiobeerpath.conf
sudo a2enmod rewrite headers deflate
sudo systemctl restart apache2
```

### 6. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-apache

# Get certificate
sudo certbot --apache -d ohiobeerpath.com -d www.ohiobeerpath.com

# Auto-renewal is configured automatically
```

### 7. Verify Deployment

```bash
# Test PHP syntax
php -l index.php

# Test database connection
php -r "require 'includes/config.php'; require 'includes/db.php'; \$db = getDB(); echo 'DB OK';"

# Test API endpoints
curl https://ohiobeerpath.com/api/breweries.php
curl https://ohiobeerpath.com/api/search.php?q=columbus
```

## Post-Deployment

### DNS Configuration

Point domain to server IP:
- A Record: `@` → `your_server_ip`
- A Record: `www` → `your_server_ip`

### Google Maps API Key Restrictions

In Google Cloud Console:
1. Application restrictions: HTTP referrers
2. Add: `https://ohiobeerpath.com/*`
3. API restrictions: Enable only required APIs
   - Maps JavaScript API
   - Geocoding API
   - Directions API

### Monitoring

Set up monitoring for:
- Uptime monitoring
- SSL certificate expiration
- Database backups
- Error logs
- Analytics tracking

### Backups

Configure automated backups:

```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u ohiobeer_user -p ohiobrewpath_prod > /backups/db_$DATE.sql
gzip /backups/db_$DATE.sql

# Keep last 30 days
find /backups -name "db_*.sql.gz" -mtime +30 -delete
```

Add to crontab:
```
0 2 * * * /usr/local/bin/backup-db.sh
```

## Troubleshooting

### Issue: "Database connection failed"
- Check database credentials in `.env`
- Verify MySQL service is running: `sudo systemctl status mysql`
- Check database user permissions

### Issue: "Google Maps not loading"
- Verify API key in `.env`
- Check API key restrictions in Google Cloud Console
- Check browser console for error messages

### Issue: "500 Internal Server Error"
- Check error logs: `tail -f /var/log/apache2/ohiobeerpath_error.log`
- Verify file permissions
- Check PHP error logs

### Issue: "Images not loading"
- Verify file permissions on `/assets/images/`
- Check `.htaccess` configuration
- Verify correct paths in HTML/PHP files

## Rollback Plan

```bash
# If deployment fails, rollback to previous version
cd /var/www/html/ohiobeerpath
git log --oneline -10  # Find previous commit
git reset --hard <previous-commit-hash>
sudo systemctl restart apache2
```

## Performance Optimization

### Enable OPcache (PHP)

Edit `/etc/php/7.4/apache2/php.ini`:
```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
opcache.revalidate_freq=60
```

### MySQL Optimization

Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:
```ini
[mysqld]
innodb_buffer_pool_size = 256M
query_cache_type = 1
query_cache_size = 32M
```

### Content Delivery Network (CDN)

Consider using Cloudflare for:
- DDoS protection
- Global CDN
- SSL/TLS
- Caching
- Analytics

## Security Hardening

- [ ] Change default database port
- [ ] Implement rate limiting
- [ ] Configure fail2ban
- [ ] Regular security updates: `sudo apt update && sudo apt upgrade`
- [ ] Review and audit access logs weekly
- [ ] Implement CSP (Content Security Policy) headers
- [ ] Enable MySQL audit logging
- [ ] Regular penetration testing

## Updates & Maintenance

```bash
# Pull latest changes
cd /var/www/html/ohiobeerpath
git pull origin main

# Run any database migrations (if needed)
php migrations/run.php

# Clear any application cache
php clear-cache.php

# Restart services
sudo systemctl restart apache2
```
