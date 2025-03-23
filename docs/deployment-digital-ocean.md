# Deploying Craft Fusion to Digital Ocean

This guide provides step-by-step instructions for deploying the Craft Fusion project to a Digital Ocean Droplet running Fedora 40.

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
```

## Step 6: Set Up Firewall

```bash
# Install firewalld if it's not already installed
dnf install -y firewalld

# Start and enable firewalld
systemctl start firewalld
systemctl enable firewalld

# Configure firewall
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --permanent --add-port=4000/tcp
firewall-cmd --permanent --add-port=11434/tcp

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

# Create the env file
cat > .env << EOL
# Production environment variables
NODE_ENV=production
OLLAMA_API_URL=http://localhost:11434
MODELS_TO_LOAD=deepseek:latest,mistral:latest
DOMAIN=yourdomain.com
EOL
```

## Step 8: Configure Nginx as a Reverse Proxy

```bash
# Install Nginx
dnf install -y nginx

# Create Nginx configuration
cat > /etc/nginx/conf.d/craft-fusion.conf << EOL
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:4200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /api/go/ {
        proxy_pass http://localhost:4000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# Test Nginx configuration
nginx -t

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx
```

## Step 9: Set Up SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install certbot
dnf install -y certbot python3-certbot-nginx

# Obtain SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts to complete the setup
```

## Step 10: Deploy Ollama using Docker

```bash
cd /opt/craft-fusion

# Make scripts executable
chmod +x scripts/ollama-manager.sh

# Start Ollama container
./scripts/ollama-manager.sh start

# Pull AI models
./scripts/ollama-manager.sh pull
```

## Step 11: Build and Run the Applications

### Option 1: Build and Serve with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Install dependencies
npm ci

# Build all applications
npx nx run-many --target=build --all --prod

# Start NestJS backend with PM2
pm2 start dist/apps/craft-nest/main.js --name craft-nest

# Start Go backend with PM2
cd apps/craft-go
go build -o ../../dist/apps/craft-go/main .
cd ../..
pm2 start dist/apps/craft-go/main --name craft-go

# Serve Angular with PM2 and static files
npm install -g serve
pm2 start serve --name craft-web -- -s dist/apps/craft-web -l 4200

# Save PM2 configuration
pm2 save

# Set PM2 to start on system boot
pm2 startup
# Execute the command provided by the above output
```

### Option 2: Deploy with Docker Compose (Recommended)

```bash
# Use Docker Compose for deployment
docker compose up -d

# Check container status
docker compose ps
```

## Step 12: Monitor the Deployment

```bash
# Check application logs
docker compose logs -f

# Check individual services
docker compose logs -f craft-nest
docker compose logs -f craft-go
docker compose logs -f craft-web
docker compose logs -f ollama

# Monitor the server
htop
```

## Step 13: Set Up Automatic Updates and Maintenance

```bash
# Create a system update script
cat > /opt/update-system.sh << EOL
#!/bin/bash
# Update system packages
dnf update -y

# Restart services if needed
systemctl restart nginx
EOL

# Make it executable
chmod +x /opt/update-system.sh

# Create a cron job for weekly updates
(crontab -l 2>/dev/null; echo "0 2 * * 0 /opt/update-system.sh >> /var/log/system-update.log 2>&1") | crontab -

# Create a backup script (customize as needed)
cat > /opt/backup-craft-fusion.sh << EOL
#!/bin/bash
# Backup the Ollama models and application data
DATE=\$(date +%Y-%m-%d)
tar -czf /opt/backups/craft-fusion-\$DATE.tar.gz -C /opt/craft-fusion .
EOL

# Make it executable
chmod +x /opt/backup-craft-fusion.sh

# Create a cron job for daily backups
mkdir -p /opt/backups
(crontab -l 2>/dev/null; echo "0 1 * * * /opt/backup-craft-fusion.sh >> /var/log/backup.log 2>&1") | crontab -
```

## Step 14: Set Up Domain and DNS (Optional)

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
