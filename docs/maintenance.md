# NDISuite Report Generator Maintenance Procedures

## Table of Contents

1. [Routine Maintenance](#routine-maintenance)
2. [Database Maintenance](#database-maintenance)
3. [Performance Optimization](#performance-optimization)
4. [Security Updates](#security-updates)
5. [Backup Procedures](#backup-procedures)
6. [Monitoring and Alerts](#monitoring-and-alerts)
7. [Troubleshooting Guide](#troubleshooting-guide)
8. [Version Upgrades](#version-upgrades)

## Routine Maintenance

### Daily Tasks

- Check monitoring dashboards for errors or performance issues
- Verify that all services are running correctly
- Review system logs for warnings or errors
- Check Celery task queue for any stuck or failed tasks

### Weekly Tasks

- Review user feedback and issue reports
- Check disk space usage and clean up temporary files
- Review database query performance 
- Test WebSocket connections for audio transcription
- Verify AI service connectivity

### Monthly Tasks

- Apply security updates to all system components
- Perform database maintenance operations
- Review and optimize API endpoints performance
- Check SSL certificate expiration dates
- Review user activity logs for unusual patterns
- Test backup and restore procedures

## Database Maintenance

### PostgreSQL Maintenance

1. **Vacuum the Database**:
   ```bash
   # Connect to the PostgreSQL server
   sudo -u postgres psql
   
   # Run vacuum on the ndisuite database
   VACUUM ANALYZE;
   ```

2. **Update Statistics**:
   ```sql
   ANALYZE;
   ```

3. **Check for Slow Queries**:
   ```sql
   SELECT * FROM pg_stat_activity WHERE state = 'active' ORDER BY duration DESC;
   ```

4. **Optimize Indexes**:
   ```sql
   -- Check for unused indexes
   SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;
   
   -- Check for missing indexes (where there are many sequential scans)
   SELECT relname, seq_scan, seq_tup_read, idx_scan, idx_tup_fetch 
   FROM pg_stat_user_tables 
   WHERE seq_scan > 0 
   ORDER BY seq_scan DESC;
   ```

### MongoDB Maintenance (if used)

1. **Compact the Database**:
   ```javascript
   use ndisuite
   db.runCommand({ compact: 'collection_name' })
   ```

2. **Check Index Usage**:
   ```javascript
   db.collection_name.aggregate([
     { $indexStats: { } }
   ])
   ```

3. **Update MongoDB Version** when needed:
   - Follow MongoDB's recommended upgrade path
   - Always back up data before upgrading

## Performance Optimization

### Backend Optimization

1. **Django Query Optimization**:
   - Use the Django Debug Toolbar to identify slow queries
   - Add database indexes for frequently queried fields
   - Implement query optimization using `select_related()` and `prefetch_related()`

2. **Celery Task Optimization**:
   - Configure proper concurrency settings
   - Set appropriate task timeouts
   - Use task prioritization for critical operations

3. **API Response Time Improvement**:
   - Implement caching for frequently accessed data
   - Use pagination for large result sets
   - Optimize serialization process

### Frontend Optimization

1. **React Component Optimization**:
   - Use React.memo for expensive components
   - Implement proper dependency arrays in useEffect hooks
   - Optimize state management to prevent unnecessary renders

2. **Asset Optimization**:
   - Enable compression for static assets
   - Implement code splitting for large JavaScript bundles
   - Use WebP image format where supported

3. **Network Performance**:
   - Minimize API requests by batching operations
   - Implement proper caching strategies
   - Use HTTP/2 for improved connection efficiency

## Security Updates

### Django Security Updates

1. Check for security updates regularly:
   ```bash
   pip list --outdated
   ```

2. Apply security patches:
   ```bash
   pip install --upgrade django djangorestframework
   ```

3. Review Django Security Release notifications:
   - Subscribe to [django-announce](https://groups.google.com/forum/#!forum/django-announce)
   - Check the [Django security page](https://www.djangoproject.com/weblog/security/)

### Node.js and Dependency Updates

1. Check for vulnerable dependencies:
   ```bash
   cd frontend
   npm audit
   ```

2. Apply security fixes:
   ```bash
   npm audit fix
   # For major version updates that might break compatibility
   npm audit fix --force
   ```

3. Keep Next.js and React updated:
   ```bash
   npm update next react react-dom
   ```

### System Security

1. Update server operating system:
   ```bash
   sudo apt update
   sudo apt upgrade
   ```

2. Check for Docker security vulnerabilities:
   ```bash
   docker scan backend:latest
   docker scan frontend:latest
   ```

## Backup Procedures

### Database Backup

1. **Automated PostgreSQL Backup Script**:

   Create a file named `backup-postgres.sh`:
   ```bash
   #!/bin/bash
   
   # Set variables
   BACKUP_DIR="/path/to/backups"
   TIMESTAMP=$(date +%Y%m%d_%H%M%S)
   DB_NAME="ndisuite"
   DB_USER="postgres"
   
   # Create backup directory if it doesn't exist
   mkdir -p $BACKUP_DIR
   
   # Create the backup
   pg_dump -U $DB_USER -d $DB_NAME -F c -f $BACKUP_DIR/backup_$TIMESTAMP.dump
   
   # Remove backups older than 30 days
   find $BACKUP_DIR -name "backup_*.dump" -mtime +30 -delete
   
   # Log the backup
   echo "Backup completed: backup_$TIMESTAMP.dump" >> $BACKUP_DIR/backup_log.txt
   ```

2. **Schedule the backup with cron**:
   ```bash
   # Edit crontab
   crontab -e
   
   # Add this line to run the backup daily at 2 AM
   0 2 * * * /path/to/backup-postgres.sh
   ```

3. **Verify backup integrity**:
   ```bash
   # Test restore to a temporary database
   pg_restore -U postgres -d test_restore /path/to/backups/backup_file.dump
   ```

### File System Backup

1. **Media and Document Backup**:
   ```bash
   rsync -avz --delete /path/to/media/files /path/to/backup/media
   ```

2. **Vector Store Backup** (for RAG system):
   ```bash
   rsync -avz --delete /path/to/vector_db /path/to/backup/vector_db
   ```

3. **Configuration Backup**:
   ```bash
   # Backup environment files and configurations
   tar -czvf /path/to/backup/config_$(date +%Y%m%d).tar.gz /path/to/app/.env /path/to/app/kubernetes/
   ```

## Monitoring and Alerts

### Setting Up Prometheus and Grafana

1. **Prometheus Configuration**:

   Create a `prometheus.yml` file:
   ```yaml
   global:
     scrape_interval: 15s
   
   scrape_configs:
     - job_name: 'ndisuite-backend'
       metrics_path: '/metrics'
       static_configs:
         - targets: ['backend:8000']
     
     - job_name: 'ndisuite-frontend'
       metrics_path: '/api/metrics'
       static_configs:
         - targets: ['frontend:3000']
     
     - job_name: 'node-exporter'
       static_configs:
         - targets: ['node-exporter:9100']
   ```

2. **Grafana Dashboard Setup**:
   - Import the Django dashboard template (ID: 9528)
   - Import the Node.js dashboard template (ID: 11159)
   - Create custom dashboards for application-specific metrics

3. **Alert Configuration**:

   Create an `alerts.yml` file:
   ```yaml
   groups:
   - name: ndisuite-alerts
     rules:
     - alert: HighCPUUsage
       expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
       for: 5m
       labels:
         severity: warning
       annotations:
         summary: "High CPU usage detected"
         description: "CPU usage is above 80% for more than 5 minutes on {{ $labels.instance }}"
     
     - alert: HighMemoryUsage
       expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
       for: 5m
       labels:
         severity: warning
       annotations:
         summary: "High memory usage detected"
         description: "Memory usage is above 85% for more than 5 minutes on {{ $labels.instance }}"
     
     - alert: APIHighLatency
       expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route)) > 1
       for: 5m
       labels:
         severity: warning
       annotations:
         summary: "API endpoint high latency"
         description: "95th percentile of request duration is above 1s for endpoint {{ $labels.route }}"
   ```

### Sentry Integration

1. **Configure Sentry in Django**:
   ```python
   # settings.py
   import sentry_sdk
   from sentry_sdk.integrations.django import DjangoIntegration
   
   sentry_sdk.init(
       dsn="your-sentry-dsn",
       integrations=[DjangoIntegration()],
       traces_sample_rate=0.2,
   )
   ```

2. **Configure Sentry in Next.js**:
   ```javascript
   // _app.js or _app.tsx
   import * as Sentry from '@sentry/nextjs';
   
   Sentry.init({
     dsn: "your-sentry-dsn",
     tracesSampleRate: 0.2,
   });
   ```

## Troubleshooting Guide

### Common Backend Issues

1. **Celery Tasks Not Processing**:
   - Check if Redis is running: `redis-cli ping`
   - Verify Celery worker is running: `ps aux | grep celery`
   - Check Celery logs for errors
   - Restart Celery worker: `celery -A ndisuite worker -l INFO`

2. **Database Connection Issues**:
   - Verify PostgreSQL is running: `pg_isready`
   - Check connection settings in `.env` file
   - Look for connection errors in Django logs
   - Verify network connectivity between services

3. **API Response Errors**:
   - Check Django logs for exceptions
   - Verify the API endpoint URL is correct
   - Check authentication token validity
   - Test API endpoint with curl or Postman

### Common Frontend Issues

1. **WebSocket Connection Failures**:
   - Check browser console for WebSocket errors
   - Verify the WebSocket URL is correct
   - Ensure CORS settings allow WebSocket connections
   - Test WebSocket connectivity with a simple client

2. **Slow Page Loading**:
   - Use browser developer tools to identify slow resources
   - Check for large JavaScript bundles
   - Verify API response times
   - Look for blocking resources

3. **Authentication Issues**:
   - Clear browser cookies and local storage
   - Verify JWT token expiration
   - Check for CORS issues in browser console
   - Test login flow with a different browser

### AI Integration Issues

1. **Transcription Service Failures**:
   - Check OpenAI API key validity
   - Verify OpenAI service status
   - Check for rate limiting or quota issues
   - Ensure audio format is compatible with Whisper API

2. **Content Generation Issues**:
   - Check for prompt formatting errors
   - Verify LangChain configuration
   - Ensure vector database is properly initialized
   - Check for token limit exceeded errors

## Version Upgrades

### Major Version Upgrade Procedure

1. **Pre-upgrade Preparations**:
   - Create a full backup of all data
   - Review release notes for breaking changes
   - Update the upgrade plan based on changes
   - Test the upgrade in a staging environment

2. **Backend Upgrade Steps**:
   ```bash
   # Create a backup
   pg_dump -U postgres -d ndisuite -F c -f pre_upgrade_backup.dump
   
   # Update code
   git fetch
   git checkout v2.0.0
   
   # Update dependencies
   pip install -r requirements.txt
   
   # Apply migrations
   python manage.py migrate
   
   # Collect static files
   python manage.py collectstatic --noinput
   
   # Restart services
   sudo systemctl restart gunicorn
   sudo systemctl restart celery
   ```

3. **Frontend Upgrade Steps**:
   ```bash
   # Update code
   git fetch
   git checkout v2.0.0
   
   # Update dependencies
   npm install
   
   # Build the application
   npm run build
   
   # Restart the service
   sudo systemctl restart nextjs
   ```

4. **Post-upgrade Verification**:
   - Run test suite to verify functionality
   - Check critical workflows manually
   - Monitor logs for any new errors
   - Verify performance metrics

---

For additional support, please contact the NDISuite technical team at support@ndisuite.app.

© 2025 NDISuite. All rights reserved.
