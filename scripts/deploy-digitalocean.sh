#!/bin/bash
set -e

# This script shows a basic, junior-friendly approach to prepping a Fedora 40 Droplet on Digital Ocean.
# It automates common tasks like system updates, Docker + Nginx installs, and environment setup.

echo "Updating system packages..."
dnf update -y

echo "Installing basic utilities..."
dnf install -y git curl wget nano htop tmux firewalld

# Required components prompt
echo "Select components to install:"
echo "1) Required components only (Docker, Node.js, Go, Nginx)"
echo "2) Required + AI with Ollama"
echo "3) Required + AI + Training environment (Python, PyTorch)"
echo "4) All components (required, AI, training, monitoring tools)"
read -r COMPONENTS_CHOICE
echo "You selected: $COMPONENTS_CHOICE"

# Install required components
echo "Installing Docker..."
dnf install -y dnf-plugins-core
dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "Starting and enabling Docker..."
systemctl start docker
systemctl enable docker

echo "Setting up Docker group..."
usermod -aG docker $USER

echo "Installing Node.js and Go..."
# Install Node.js 20.x
dnf module install -y nodejs:20

# Install Go
wget https://go.dev/dl/go1.23.4.linux-amd64.tar.gz
rm -rf /usr/local/go && tar -C /usr/local -xzf go1.23.4.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

echo "Setting up firewall rules for common Craft Fusion ports..."
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --permanent --add-port=4000/tcp
firewall-cmd --permanent --reload

echo "Installing and configuring Nginx..."
dnf install -y nginx
# ... existing Nginx configuration code ...

echo "Skipping external MongoDB installation, since Craft Fusion uses an in-memory Mongo server."

# Install optional components based on user choice
if [[ "$COMPONENTS_CHOICE" == "2" || "$COMPONENTS_CHOICE" == "3" || "$COMPONENTS_CHOICE" == "4" ]]; then
  echo "Setting up Ollama for AI capabilities..."
  # Make Ollama scripts executable
  chmod +x scripts/ollama-manager.sh
  # Start Ollama container
  ./scripts/ollama-manager.sh start
  # Pull default models
  ./scripts/ollama-manager.sh pull
fi

if [[ "$COMPONENTS_CHOICE" == "3" || "$COMPONENTS_CHOICE" == "4" ]]; then
  echo "Installing Python and dependencies for training environment..."
  # Install Python 3.11 and development tools
  dnf install -y python3.11 python3.11-devel python3-pip
  
  # Create a virtual environment for training
  mkdir -p /opt/craft-fusion/training
  python3 -m venv /opt/craft-fusion/training/venv
  
  # Install training dependencies
  source /opt/craft-fusion/training/venv/bin/activate
  pip install --upgrade pip
  pip install torch torchvision torchaudio transformers datasets accelerate peft tqdm
  
  echo "Training environment set up at /opt/craft-fusion/training"
  echo "To activate: source /opt/craft-fusion/training/venv/bin/activate"
  
  # Copy training scripts and data
  if [[ -d "apps/training" ]]; then
    cp -r apps/training/* /opt/craft-fusion/training/
    echo "Training scripts copied to /opt/craft-fusion/training/"
  else
    echo "Warning: Training directory not found. Clone the repository first."
  fi
fi

if [[ "$COMPONENTS_CHOICE" == "4" ]]; then
  echo "Installing monitoring tools..."
  dnf install -y prometheus grafana
  systemctl enable prometheus
  systemctl start prometheus
  systemctl enable grafana-server
  systemctl start grafana-server
  echo "Prometheus and Grafana installed and running"
  
  # Set up basic logging with ELK Stack
  docker compose -f docker-compose.elk.yml up -d
  echo "ELK Stack (Elasticsearch, Logstash, Kibana) installed via Docker"
fi

# Environment selection
echo "Select environment (development, staging, production):"
read -r ENV_CHOICE
echo "You selected: $ENV_CHOICE"

case "$ENV_CHOICE" in
  development)
    echo "Setting up Development environment..."
    # ...existing code for dev...
    ;;
  staging)
    echo "Setting up Staging environment..."
    # ...existing code for staging...
    ;;
  production)
    echo "Setting up Production environment..."
    # ...existing code for production...
    # Renew Let's Encrypt as needed
    echo "Updating Let's Encrypt certificates..."
    certbot renew --nginx
    ;;
  *)
    echo "Invalid environment choice, please run again."
    exit 1
    ;;
esac

echo "Script completed! The server is now ready for Craft Fusion deployment."
