# Deploying Craft Fusion to Digital Ocean

This guide provides step-by-step instructions for deploying the Craft Fusion project to a Digital Ocean Droplet using nginx for the frontend and PM2 for the backends.

## Prerequisites

- A Digital Ocean account ([Sign up here](https://www.digitalocean.com/))
- SSH key setup for Digital Ocean ([Guide](https://docs.digitalocean.com/products/droplets/how-to/add-ssh-keys/))
- Domain name (optional, but recommended)

## Step 0: Connect as root and Switch User

<span style="color:blue;">**Connect to your Fedora 40 Droplet**</span>:
```bash
ssh root@my-droplet-ip
```

<span style="color:red; font-weight:bold;">**Switch to a non-root user**</span> (for safer operations):
```bash
su - jeffrey
```
<span style="color:#177245;">Now you can proceed as a regular user and follow the installation scripts. Junior developers: make sure you have the right permissions!</span>

<!-- Vibrant Data Visualization Reminder -->
Here’s a quick <span style="color:#E64B4B;">infographic</span> approach for resource usage:
1. CPU & RAM → <span style="color:#3F51B5;">htop</span>
2. Disk I/O → <span style="color:#FFA500;">iostat</span>
3. Docker logs → <span style="color:#9C27B0;">docker-compose logs</span>

## Step 1: Create a Digital Ocean Droplet

1. Log in to your Digital Ocean account
2. Click "Create" and select "Droplets"
3. Choose the following configuration:
   - **Distribution**: Fedora 40 x64
   - **Plan**: 
     - Basic Shared CPU
     - At least 8GB RAM / 4 vCPUs ($40/month) recommended for AI features
     - At least 80GB SSD for AI models and application data
   - **Datacenter Region**: Choose the closest to your target audience
   - **VPC Network**: Default
   - **Authentication**: SSH keys (recommended)
   - **Hostname**: `craft-fusion-prod` (or your preference)
4. Click "Create Droplet"

## Step 2: Connect to Your Droplet

Once your droplet is created, note its IP address and connect via SSH:

```bash
ssh root@your_droplet_ip
```

## Step 3: Update the System

```bash
# Update packages
dnf update -y

# Install basic utilities
dnf install -y git curl wget nano htop tmux
```

## Step 4: Install Docker and Docker Compose

```bash
# Install Docker
dnf install -y dnf-plugins-core
dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Add your user to the docker group (if not using root)
usermod -aG docker $USER
```

## Step 5: Install Node.js and Go

```bash
# Install Node.js 20.x
dnf module install -y nodejs:20

# Install Go
wget https://go.dev/dl/go1.23.4.linux-amd64.tar.gz
rm -rf /usr/local/go && tar -C /usr/local -xzf go1.23.4.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# Install PM2 globally for process management
npm install -g pm2
```

## Step 6: Set Up Firewall

```bash
# Install firewalld if it's not already installed
dnf install -y firewalld

# Start and enable firewalld
systemctl start firewalld
systemctl enable firewalld

# Configure firewall for both HTTP/HTTPS and direct access to backends
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --permanent --add-port=4000/tcp

# Apply changes
firewall-cmd --reload
```

## Step 7: Clone the Repository

```bash
# Create directory for the application
mkdir -p /opt/craft-fusion
cd /opt/craft-fusion

# Clone the repository
git clone https://github.com/yourusername/craft-fusion.git .

# Create environment file with appropriate variables
cat > .env << EOL
# Production environment variables
NODE_ENV=production
DOMAIN=yourdomain.com
EOL
```

## Step 8: Configure Nginx as a Reverse Proxy

```bash
# Install Nginx
dnf install -y nginx

# Create Nginx configuration for serving Angular and proxying APIs
cat > /etc/nginx/conf.d/craft-fusion.conf << EOL
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Frontend - serve static Angular files
    root /opt/craft-fusion/dist/apps/craft-web;
    index index.html;
    
    # Handle Angular routes
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # Add caching for static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 30d;
            add_header Cache-Control "public, max-age=2592000";
        }
    }
    
    # NestJS backend API
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Go backend API
    location /api-go/ {
        proxy_pass http://localhost:4000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Nginx status for monitoring (optional, restrict access appropriately)
    location /nginx_status {
        stub_status on;
        allow 127.0.0.1;
        deny all;
    }
}
EOL

# Test Nginx configuration and start
nginx -t
systemctl enable nginx
systemctl start nginx
```

## Step 9: Set Up SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install certbot
dnf install -y certbot python3-certbot-nginx

# Obtain SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts to complete the setup
# This will automatically modify your nginx configuration
```

## Step 10: Build the Application

```bash
cd /opt/craft-fusion

# Install dependencies
npm ci

# Build all applications in production mode
npx nx run-many --target=build --all --prod

# Build the Go application
cd apps/craft-go
go build -o ../../dist/apps/craft-go/main .
cd ../..
```

## Step 11: Create PM2 Ecosystem File for Backends

Create an ecosystem.config.js file specifically designed to expose the backends properly in production:

```bash
cat > /opt/craft-fusion/ecosystem.config.js << EOL
module.exports = {
  apps: [
    {
      name: 'craft-nest',
      script: 'dist/apps/craft-nest/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0', // IMPORTANT: Bind to all interfaces, not just localhost
        EXPOSE_API: 'true', // Custom environment flag to ensure endpoints are exposed
        API_PREFIX: '/api'  // Ensure API prefix is set correctly
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'craft-go',
      script: 'dist/apps/craft-go/main',
      env: {
        PORT: 4000,
        GIN_MODE: 'release',
        HOST: '0.0.0.0', // IMPORTANT: Ensure Go binds to all interfaces
        API_BASE_PATH: '/'  // Important for correct API path handling
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false
    }
  ]
};
EOL
```

## Step 12: Start the Application with PM2

```bash
cd /opt/craft-fusion

# Start backends using the ecosystem file
pm2 start ecosystem.config.js

# Save PM2 process list to be restored on reboot
pm2 save

# Setup PM2 to start on system startup
pm2 startup
# Execute the command provided by the above output to complete setup
```

## Step 13: Monitor and Check the Deployment

```bash
# Check if backends are running properly
pm2 status
pm2 logs

# Check if nginx is running properly
systemctl status nginx

# Test backend access directly to ensure APIs are exposed properly
curl http://localhost:3000/api/health
curl http://localhost:4000/health

# View resource usage
htop
```

## Troubleshooting Backend API Exposure Issues

If your backend APIs are not properly exposed in production mode, check the following:

### 1. Verify Backend Binding:

For NestJS backend, check main.ts:

```typescript
// In apps/craft-nest/src/main.ts, ensure proper host binding:
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  
  // Most important part: Bind to 0.0.0.0, not localhost or 127.0.0.1
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}/api`);
}
```

For Go backend, check your main.go:

```go
// In apps/craft-go/main.go, ensure the server listens on all interfaces:
func main() {
  // ...
  r := setupRouter()
  port := os.Getenv("PORT")
  if port == "" {
    port = "4000"
  }
  r.Run("0.0.0.0:" + port) // Use 0.0.0.0 instead of localhost
}
```

### 2. Check Network Accessibility:

```bash
# Check if backends are accessible from other machines
# Substitute your-droplet-ip with your actual IP
curl http://your-droplet-ip:3000/api/health
curl http://your-droplet-ip:4000/health

# Check if ports are actually listening on all interfaces (not just localhost)
sudo ss -tulpn | grep -E ':(3000|4000)'
# Should show 0.0.0.0:3000 and 0.0.0.0:4000, not 127.0.0.1:3000
```

### 3. Verify Nginx Configuration:

```bash
# Test Nginx configuration
nginx -t

# Check Nginx error logs
tail -f /var/log/nginx/error.log

# Test proxy pass connections
curl -v http://localhost/api/health
curl -v http://localhost/api-go/health
```

### 4. Environment Variables:

For more persistent environment configuration, add these to your .env file:

```bash
echo "PORT=3000" >> /opt/craft-fusion/.env
echo "HOST=0.0.0.0" >> /opt/craft-fusion/.env
echo "EXPOSE_API=true" >> /opt/craft-fusion/.env
```

## Step 14: Set Up Automatic Updates

Create a script to pull updates and redeploy:

```bash
cat > /opt/craft-fusion/update.sh << EOL
#!/bin/bash
set -e

echo "Starting Craft Fusion update at \$(date)"
cd /opt/craft-fusion

echo "Pulling latest code from git repository"
git pull

echo "Installing dependencies"
npm ci

echo "Building all applications"
npx nx run-many --target=build --all --prod

echo "Building Go application"
cd apps/craft-go
go build -o ../../dist/apps/craft-go/main .
cd ../..

echo "Restarting backend services"
pm2 restart all

echo "Update completed successfully at \$(date)"
EOL

chmod +x /opt/craft-fusion/update.sh

# Set up a cron job for automatic updates (weekly at 2 AM on Sunday)
(crontab -l 2>/dev/null; echo "0 2 * * 0 /opt/craft-fusion/update.sh >> /var/log/craft-fusion-update.log 2>&1") | crontab -
```

## Step 15: Monitoring and Management

```bash
# View PM2 logs in real time
pm2 logs

# Monitor specific application
pm2 logs craft-nest
pm2 logs craft-go

# View resource usage
htop

# Restart a specific service
pm2 restart craft-nest

# View Nginx access logs
tail -f /var/log/nginx/access.log

# View system logs for systemd services
journalctl -u nginx -f
```

## Step 16: Backup Strategy

```bash
# Create backup script
cat > /opt/craft-fusion/backup.sh << EOL
#!/bin/bash
BACKUP_DIR="/opt/craft-fusion-backups"
TIMESTAMP=\$(date +"%Y%m%d-%H%M%S")

# Create backup directory if it doesn't exist
mkdir -p \$BACKUP_DIR

# Backup application code and built files
tar -czf \$BACKUP_DIR/craft-fusion-code-\$TIMESTAMP.tar.gz -C /opt/craft-fusion .

# Backup configuration files
mkdir -p \$BACKUP_DIR/configs-\$TIMESTAMP
cp /etc/nginx/conf.d/craft-fusion.conf \$BACKUP_DIR/configs-\$TIMESTAMP/
cp /opt/craft-fusion/ecosystem.config.js \$BACKUP_DIR/configs-\$TIMESTAMP/
cp /opt/craft-fusion/.env \$BACKUP_DIR/configs-\$TIMESTAMP/

# Maintain only the 10 most recent backups
ls -tp \$BACKUP_DIR/craft-fusion-code-* | grep -v '/$' | tail -n +11 | xargs -I {} rm -- {}
ls -tp \$BACKUP_DIR/ | grep configs | tail -n +11 | xargs -I {} rm -rf -- \$BACKUP_DIR/{}

echo "Backup completed at \$(date)"
EOL

chmod +x /opt/craft-fusion/backup.sh

# Set up daily backup at 1 AM
(crontab -l 2>/dev/null; echo "0 1 * * * /opt/craft-fusion/backup.sh >> /var/log/craft-fusion-backup.log 2>&1") | crontab -
```

## Step 17: Domain and DNS Setup (Optional)

1. Go to your domain registrar
2. Point your domain to Digital Ocean's nameservers
3. In Digital Ocean dashboard, go to "Networking" > "Domains"
4. Add your domain and create:
   - An A record pointing to your droplet's IP address
   - A CNAME record for 'www' pointing to '@'

## Quick Deployment
Simply run:
```
scripts/deploy-digitalocean.sh
```
This script handles system updates, firewall setup, Docker installation, Nginx, and Docker Compose launch.

## Environment Selection

When running the deployment script, you’ll be prompted to choose an environment (development, staging, or production).  
- **development**: Installs all dev tools, no SSL by default.  
- **staging**: Similar to production but with partial test config or staging domains.  
- **production**: Activates all production services and attempts to renew Let’s Encrypt certificates:
  ```
  certbot renew --nginx
  ```

You can rerun the script anytime to renew or update certificates if desired.

## Installation Options

When running the deployment script, you'll be prompted to choose which components to install:

1. **Required components only**:
   - Docker, Node.js, Go, Nginx, and other essential services
   - The minimum required to run the Craft Fusion applications

2. **Required + AI with Ollama**:
   - All required components
   - Ollama AI service and default models (deepseek, mistral)
   - AI capabilities for both NestJS and Go backends

3. **Required + AI + Training environment**:
   - All required components and AI services
   - Python environment with PyTorch, Transformers, and other ML libraries
   - Training scripts and utilities for fine-tuning AI models
   
4. **All components**:
   - Everything above plus monitoring tools
   - Prometheus and Grafana for system monitoring
   - ELK Stack (Elasticsearch, Logstash, Kibana) for log management

### Training Project Setup

If you choose to install the training environment (options 3 or 4), the following will be set up:

```bash
# Python environment at /opt/craft-fusion/training
# To activate:
source /opt/craft-fusion/training/venv/bin/activate

# Available training scripts:
cd /opt/craft-fusion/training

# Example: Fine-tune Mistral with LoRA
python finetune-mistral-lora.py --data your_data.json --output-dir ./models

# Example: Fine-tune DeepSeek with LoRA
python finetune-deepseek-lora.py --data your_data.json --output-dir ./models
```

The training environment includes all necessary libraries for model fine-tuning and evaluation.

## Design Pattern Checks
- Confirm environment variables are set
- Ensure logs are collected for debugging
- Watch memory usage: AI models can be large

## Troubleshooting Deployment Issues

### Application Not Accessible

Check if services are running:
```bash
docker compose ps
# or if using PM2
pm2 status
```

Check Nginx configuration:
```bash
nginx -t
systemctl status nginx
```

Check firewall status:
```bash
firewall-cmd --list-all
```

### AI Models Issues

Check Ollama status:
```bash
curl http://localhost:11434/api/health
```

View Ollama logs:
```bash
docker compose logs ollama
# or
./scripts/ollama-manager.sh logs
```

Pull models manually:
```bash
curl -X POST http://localhost:11434/api/pull -d '{"name":"deepseek:latest"}'
curl -X POST http://localhost:11434/api/pull -d '{"name":"mistral:latest"}'
```

### Resource Constraints

If you're experiencing performance issues:

1. Check system resources:
   ```bash
   htop
   ```

2. Check disk usage:
   ```bash
   df -h
   ```

3. Consider upgrading your droplet to a higher plan if you consistently hit resource limits.

## Updating the Application

To update the application to a new version:

```bash
# Stop all services
docker compose down
# or if using PM2
pm2 stop all

# Pull latest changes
git pull

# Rebuild and restart
docker compose up -d --build
# or if using PM2
npm ci
npx nx run-many --target=build --all --prod
pm2 restart all
```

## Monitoring

For a more robust monitoring solution, consider:

1. Installing Prometheus and Grafana
2. Setting up log aggregation with ELK Stack (Elasticsearch, Logstash, Kibana)
3. Using Digital Ocean's Monitoring service

## Load Balancing and Scaling (Advanced)

For high-traffic deployments, consider:

1. Setting up multiple droplets
2. Using Digital Ocean Load Balancers
3. Implementing container orchestration with Kubernetes

## Additional Fedora Software Setup
Besides the basic utilities (git, curl, wget, nano, htop, tmux, firewalld), ensure you install the following:
- Development tools (dnf groupinstall "Development Tools") if you plan to compile additional libraries
- Node.js, Go, Docker, and NGINX as outlined in prior steps

## Graph XL: Pros and Cons
While it offers large-scale graph capabilities, deploying Graph XL requires extra resources and specialized data store integration (e.g., AWS Neptune or an on-premises graph DB). Consider:
- Pros: Efficient large-graph queries, good for relationships across many entities
- Cons: Extra overhead, potential licensing or hosting costs, more dev complexity

## Strongly Typed Mongoose DTO
If using MongoDB, adopting Mongoose with TypeScript interfaces (DTO) encourages clear data models and reduces runtime errors. Mongoose can be integrated into the NestJS layer, ensuring consistent validation and type safety.

## Long-Term Blockchain Storage
For an immutable ledger of transactions or data states, you could integrate a blockchain layer. This is optional but can provide permanent, tamper-resistant records. Keep in mind:
- Potentially high storage costs or throughput limits
- Slower writes depending on the chain’s consensus mechanism

## In-Memory Mongo Note
Deployment to Digital Ocean still relies on ephemeral data in the in-memory Mongo server. 
If you need persistent data, switch to a dedicated MongoDB instance. 
In-memory mode is useful for proofs of concept or short-lived data scenarios.

# Patriotic MEGA Data Handling
<u style="color:red;">**MongoDB Integration**</u>  
In local or production environments, you can use an in-memory MongoDB for quick setups or switch to a full MongoDB instance for persistent data.  

<u style="color:blue;">**Blockchain Option**</u>  
Add an immutable blockchain layer to store critical records in a tamper-proof ledger. This is optional but can ensure highly secure transactions.  

## Vibrant Visual Approach
Below is a patriotic infographic illustrating data flow:

1. <span style="color:red;">App</span> → 
2. <span style="color:white; background-color:black;">In-Memory Mongo or Persistent DB</span> → 
3. <span style="color:blue;">Blockchain for Auditing</span>

```
   ┌─────────┐       ┌─────────────────┐         ┌────────────────┐
   │  App    │  -->  │ In-Mem / Mongo  │  -->    │  Blockchain    │
   └─────────┘       └─────────────────┘         └────────────────┘
         (Patriotic Data Flow)             
```

Use your favorite <span style="font-weight:bold; color:red;">patriotic chart</span> libraries or other <span style="font-weight:bold; color:blue;">data visualization</span> solutions to ensure real-time monitoring of these layers.
