# GUGO Reply Hub - Deployment Guide

## Unraid Deployment

### Option 1: Docker Compose (Recommended)

1. **Create app directory in Unraid:**
   ```bash
   mkdir -p /mnt/user/appdata/gugo-reply-hub
   cd /mnt/user/appdata/gugo-reply-hub
   ```

2. **Copy project files:**
   - Upload all project files to the directory
   - Ensure proper permissions: `chown -R 1001:1001 /mnt/user/appdata/gugo-reply-hub`

3. **Create environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

4. **Deploy with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

5. **Access the application:**
   Navigate to `http://[UNRAID_IP]:3000`

### Option 2: Unraid Docker Template

Create a new Docker template in Unraid Community Applications:

#### Template Configuration:
- **Name**: GUGO Reply Hub
- **Repository**: gugo-reply-hub:latest
- **Network Type**: Bridge
- **Web UI**: http://[IP]:[PORT:3000]
- **Icon URL**: https://raw.githubusercontent.com/example/icon.png

#### Port Mappings:
- **Container Port**: 3000
- **Host Port**: 3000
- **Protocol**: TCP

#### Volume Mappings:
- **Container Path**: `/app/storage`
- **Host Path**: `/mnt/user/appdata/gugo-reply-hub/storage`
- **Access Mode**: Read/Write

#### Environment Variables:
```
DATABASE_URL=postgresql://gugo:your_db_password@postgres:5432/gugo_reply_hub
NEXT_PUBLIC_APP_URL=http://[UNRAID_IP]:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
TEXT_PROVIDER=deepseek
IMAGE_PROVIDER=together
DEEPSEEK_API_KEY=your_deepseek_key
TOGETHER_API_KEY=your_together_key
DISCORD_BOT_TOKEN=your_discord_token
DISCORD_CHANNEL_IDS=123456789,987654321
CHECK_INTERVAL_MINUTES=5
UPLOAD_DIR=/app/storage
```

### PostgreSQL Setup

You have several options for the database:

#### Option A: Included PostgreSQL Container (Easiest)
The docker-compose.yml includes a PostgreSQL container. No additional setup needed.

#### Option B: Existing Unraid PostgreSQL
If you have PostgreSQL running on Unraid:
1. Create database: `gugo_reply_hub`
2. Create user: `gugo` with password
3. Update DATABASE_URL in environment variables

#### Option C: External PostgreSQL
Point DATABASE_URL to your external PostgreSQL instance.

### Configuration

#### Required API Keys:
1. **DeepSeek API Key** (for AI text generation)
   - Sign up at https://platform.deepseek.com
   - Cost: ~$0.14/million tokens (very affordable)

2. **Together.ai API Key** (for image generation)
   - Sign up at https://api.together.xyz
   - Cost: ~$0.001/image (cheapest option)

3. **Discord Bot Token** (for channel monitoring)
   - Create bot at https://discord.com/developers/applications
   - Get channel IDs from Discord (right-click channel → Copy ID)

4. **Twitter/X OAuth** (optional, for posting replies)
   - Create app at https://developer.twitter.com
   - Set up OAuth 1.0a credentials

#### Storage Configuration:
- **Base Images**: `/mnt/user/appdata/gugo-reply-hub/storage/base_images/`
- **Generated Images**: `/mnt/user/appdata/gugo-reply-hub/storage/generated_images/`
- **Database**: PostgreSQL volume or external database

### Resource Requirements

#### Minimum Requirements:
- **RAM**: 2GB
- **CPU**: 2 cores
- **Storage**: 10GB (for images and database)

#### Recommended:
- **RAM**: 4GB
- **CPU**: 4 cores
- **Storage**: 50GB

### Backup Strategy

#### Database Backup:
```bash
# Create backup
docker exec gugo-postgres pg_dump -U gugo gugo_reply_hub > backup.sql

# Restore backup
docker exec -i gugo-postgres psql -U gugo gugo_reply_hub < backup.sql
```

#### File Backup:
```bash
# Backup storage directory
tar -czf gugo-storage-backup.tar.gz /mnt/user/appdata/gugo-reply-hub/storage/

# Backup configuration
cp /mnt/user/appdata/gugo-reply-hub/.env /mnt/user/backups/gugo-env-backup
```

### Monitoring & Logs

#### View Application Logs:
```bash
docker logs gugo-reply-hub -f
```

#### View Database Logs:
```bash
docker logs gugo-postgres -f
```

#### Health Check:
Visit `http://[UNRAID_IP]:3000/api/health` to check application status.

### Troubleshooting

#### Common Issues:

1. **Database Connection Failed**
   - Check PostgreSQL container is running
   - Verify DATABASE_URL environment variable
   - Check firewall/network settings

2. **Discord Bot Not Working**
   - Verify DISCORD_BOT_TOKEN is correct
   - Check channel IDs are valid
   - Ensure bot has proper permissions in Discord

3. **AI Generation Failing**
   - Verify API keys are correct and have credits
   - Check API provider status/limits
   - Review logs for specific error messages

4. **Image Upload Issues**
   - Check storage directory permissions
   - Verify UPLOAD_DIR environment variable
   - Ensure sufficient disk space

### Performance Optimization

#### For High Volume:
1. Increase PostgreSQL connection pool size
2. Add Redis for caching (optional)
3. Increase container resource limits
4. Consider separate image processing worker

#### For Low Resource Systems:
1. Reduce Discord check frequency
2. Use smaller image generation models
3. Implement image cleanup policies
4. Consider using external image storage

### Updates

#### Updating the Application:
```bash
cd /mnt/user/appdata/gugo-reply-hub
docker-compose pull
docker-compose up -d
```

#### Database Migrations:
Database migrations run automatically on container startup.

### Security Considerations

1. **Environment Variables**: Keep API keys secure
2. **Network**: Use reverse proxy with SSL in production
3. **Database**: Use strong passwords
4. **File Permissions**: Ensure proper ownership/permissions
5. **Updates**: Keep containers updated regularly

### Support

For issues or questions:
1. Check logs first: `docker logs gugo-reply-hub`
2. Verify configuration in .env file
3. Test API endpoints manually
4. Check Discord bot permissions
5. Verify API key validity and credits

The application includes comprehensive logging and health checks to help diagnose issues quickly.