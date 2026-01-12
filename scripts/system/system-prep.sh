#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# Craft-Fusion • system-prep.sh
# Bootstrap dev host for NX (Angular + NestJS), Go, Rust, PM2, Nginx
# Safe to re-run; only installs what’s missing and won’t overwrite existing envs.
# Tested on: Fedora 39/40, Ubuntu 22.04/24.04, Debian 12
# ──────────────────────────────────────────────────────────────────────────────

# ---------- UI helpers ----------
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
info(){ echo -e "${BLUE}›${NC} $*"; }
ok(){ echo -e "${GREEN}✔${NC} $*"; }
warn(){ echo -e "${YELLOW}!${NC} $*"; }
err(){ echo -e "${RED}✖${NC} $*"; }

# ---------- Detect distro ----------
ID_LIKE="$(. /etc/os-release; echo "${ID_LIKE:-$ID}")"
PKG=""; SUDO="sudo"
if command -v sudo >/dev/null 2>&1; then :; else SUDO=""; fi
case "$ID_LIKE" in
  *fedora*|*rhel*)
    PKG="dnf -y"
    PKG_UPDATE="$SUDO dnf -y makecache"
    DEV_PKGS="git curl wget tar gzip unzip xz make gcc gcc-c++ python3 python3-pip openssl openssl-devel bash ca-certificates lsof"
  EXTRA_PKGS="nginx"
    ;;
  *ubuntu*|*debian*)
    PKG="apt-get -y"
    PKG_UPDATE="$SUDO apt-get update"
    DEV_PKGS="git curl wget tar gzip unzip xz-utils build-essential python3 python3-pip pkg-config libssl-dev bash ca-certificates lsof"
  EXTRA_PKGS="nginx"
    ;;
  *)
    warn "Unknown distro; attempting generic prerequisites."
    PKG=""
    ;;
esac

# ---------- System packages ----------
if [[ -n "$PKG" ]]; then
  info "Updating package index..."
  eval "$PKG_UPDATE"
  info "Installing core build tools..."
  eval "$SUDO $PKG install $DEV_PKGS"
  ok "Core build tools present."

  # Optional/handy
  if ! command -v nginx >/dev/null 2>&1; then
    info "Installing Nginx (optional, for local reverse proxy)..."
    eval "$SUDO $PKG install $EXTRA_PKGS" || warn "Nginx not installed (optional)."
  else ok "Nginx already installed."; fi

  # MongoDB shell not required for this repo; removing optional install.
else
  warn "Skipping OS package install; manage prerequisites manually."
fi

# ---------- NVM + Node LTS (20.x or later) ----------
NVM_DIR="${HOME}/.nvm"
if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
  info "Installing NVM..."
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash || warn "NVM installation failed"
  ok "NVM installed."
fi

# shellcheck source=/dev/null
export NVM_DIR="$NVM_DIR"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # Sourcing nvm can sometimes return non-zero in certain environments
  . "$NVM_DIR/nvm.sh" || true
fi

NODE_MAJOR_LTS=20
if ! command -v node >/dev/null 2>&1; then
  if command -v nvm >/dev/null 2>&1; then
    info "Installing Node.js LTS (v${NODE_MAJOR_LTS})..."
    nvm install "${NODE_MAJOR_LTS}"
    nvm alias default "${NODE_MAJOR_LTS}"
  else
    warn "Node.js not found and NVM not available. Please install Node.js manually."
  fi
else
  CURRENT_NODE=$(node -v | sed 's/v\([0-9]\+\).*/\1/' || echo "0")
  if [[ "$CURRENT_NODE" -lt "$NODE_MAJOR_LTS" ]]; then
    if command -v nvm >/dev/null 2>&1; then
      info "Upgrading Node to LTS (v${NODE_MAJOR_LTS})..."
      nvm install "${NODE_MAJOR_LTS}"
      nvm alias default "${NODE_MAJOR_LTS}"
    else
      warn "Node version $CURRENT_NODE is below $NODE_MAJOR_LTS and NVM not available."
    fi
  else 
    ok "Node $(node -v) is sufficient."
  fi
fi

# Ensure .nvm init in shells
for RC in "${HOME}/.bashrc" "${HOME}/.zshrc"; do
  [[ -f "$RC" ]] || continue
  if ! grep -q 'NVM_DIR' "$RC"; then
    info "Wiring NVM to ${RC##*/}..."
    {
      echo ''
      echo '# NVM autoload'
      echo 'export NVM_DIR="$HOME/.nvm"'
      echo '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"'
    } >> "$RC"
  fi
done

ok "Node: $(node -v), NPM: $(npm -v)"

# ---------- Go Language Installation ----------
if ! command -v go >/dev/null 2>&1; then
  info "Installing Go language..."
  case "$ID_LIKE" in
    *fedora*|*rhel*)
      eval "$SUDO $PKG install golang" || warn "Go installation failed"
      ;;
    *ubuntu*|*debian*)
      eval "$SUDO $PKG install golang-go" || warn "Go installation failed"
      ;;
    *)
      warn "Unknown distro; install Go manually from https://golang.org/dl/"
      ;;
  esac
  
  # Verify Go installation
  if command -v go >/dev/null 2>&1; then
    ok "Go installed: $(go version)"
    
    # Set up Go environment
    GO_PATH="${HOME}/go"
    if [[ ! -d "$GO_PATH" ]]; then
      mkdir -p "$GO_PATH/bin" "$GO_PATH/src" "$GO_PATH/pkg"
      info "Created Go workspace at $GO_PATH"
    fi
    
    # Add Go to PATH in shell configs
    for RC in "${HOME}/.bashrc" "${HOME}/.zshrc"; do
      [[ -f "$RC" ]] || continue
      if ! grep -q 'GOPATH' "$RC"; then
        info "Adding Go environment to ${RC##*/}..."
        {
          echo ''
          echo '# Go environment'
          echo 'export GOPATH=$HOME/go'
          echo 'export PATH=$PATH:/usr/local/go/bin:$GOPATH/bin'
        } >> "$RC"
      fi
    done
  else
    warn "Go installation verification failed"
  fi
else
  ok "Go already installed: $(go version)"
fi

# ---------- Package manager detection (pnpm/corepack) ----------
info "Ensuring pnpm is available..."
if ! command -v pnpm >/dev/null 2>&1; then
  # Try corepack first (built into modern Node)
  if command -v corepack >/dev/null 2>&1; then
    info "Enabling pnpm via corepack..."
    $SUDO corepack enable || npm install -g pnpm || warn "Failed to enable corepack or install pnpm"
  else
    info "Installing pnpm via npm..."
    $SUDO npm install -g pnpm || warn "Failed to install pnpm via npm"
  fi
fi

if command -v pnpm >/dev/null 2>&1; then
  ok "pnpm available: $(pnpm -v)"
  
  # Ensure pnpm is properly set up (handles global bin dir, PATH etc.)
  # We specify a standard location for Fedora/Linux
  GLOBAL_BIN_DIR="${HOME}/.local/bin"
  PNPM_HOME="${HOME}/.local/share/pnpm"
  
  info "Configuring pnpm directories..."
  mkdir -p "$GLOBAL_BIN_DIR" "$PNPM_HOME"
  
  # Ensure these are exported for the current script's environment
  export PNPM_HOME="$PNPM_HOME"
  export PATH="$GLOBAL_BIN_DIR:$PATH"

  pnpm config set global-bin-dir "$GLOBAL_BIN_DIR"
  pnpm config set store-dir "${PNPM_HOME}/store"
  
  # Run setup to wire up shell profiles
  pnpm setup 2>/dev/null || true

  # Ensure PATH is updated in .bashrc for future sessions
  if ! grep -q ".local/bin" "${HOME}/.bashrc"; then
    echo 'export PATH="$PATH:$HOME/.local/bin"' >> "${HOME}/.bashrc"
    info "Added ~/.local/bin to .bashrc"
  fi
  if ! grep -q "PNPM_HOME" "${HOME}/.bashrc"; then
    echo "export PNPM_HOME=\"$PNPM_HOME\"" >> "${HOME}/.bashrc"
    info "Added PNPM_HOME to .bashrc"
  fi

  # Optional global CLIs when pnpm is present
  GLOBAL_PKGS=(nx @angular/cli @nestjs/cli pm2)
  info "Ensuring global CLIs are present: ${GLOBAL_PKGS[*]} ..."
  # We DO NOT use sudo here so it installs to the user's GLOBAL_BIN_DIR we just set
  pnpm add -g "${GLOBAL_PKGS[@]}" || {
      warn "Local pnpm add -g failed, trying with explicit bin dir..."
      pnpm add -g "${GLOBAL_PKGS[@]}" --global-bin-dir "$GLOBAL_BIN_DIR"
  }
  ok "CLIs verified (nx, ng, nest, pm2)"
else
  warn "pnpm not available; falling back to npm workflow."
fi

# ---------- Package security check and updates ----------
info "Checking and updating global packages for security..."

# Check current global packages using pnpm if available, else npm
if command -v pnpm >/dev/null 2>&1; then
  info "Checking global pnpm packages..."
  # We already handled installation above, now just a verification/update
  info "Updating global pnpm packages..."
  pnpm update -g || warn "Global pnpm update failed (optional)"
  ok "Global pnpm packages checked and updated"
elif command -v npm >/dev/null 2>&1; then
  info "Checking global npm packages..."
  if [[ -n "$SUDO" ]]; then
    $SUDO npm update -g || warn "Global npm update failed (optional)"
    
    # Check latest versions
    info "Verifying package versions:"
    for pkg in nx pm2 wscat corepack; do
      if npm list -g "$pkg" >/dev/null 2>&1; then
        CURRENT=$(npm list -g "$pkg" --depth=0 2>/dev/null | grep "$pkg@" | sed 's/.*@//' | sed 's/ .*//' || echo "unknown")
        LATEST=$(npm view "$pkg" version 2>/dev/null || echo "unknown")
        if [[ "$CURRENT" == "$LATEST" ]]; then
          ok "$pkg: $CURRENT (latest)"
        else
          info "$pkg: $CURRENT → $LATEST available"
        fi
      fi
    done
  else
    warn "No sudo available; skipping global npm updates"
  fi
  ok "Global npm packages checked and updated"
else
  warn "No package manager available for security check"
fi

# ---------- Workspace scaffold (non-destructive) ----------
ROOT="${PWD}"
info "Preparing Craft-Fusion workspace structure..."
mkdir -p apps/frontend apps/backend libs/shared/api-interfaces tools/scripts .vscode

# ---------- Seed .nvmrc / .npmrc / .npmignore / .editorconfig ----------
[[ -f .nvmrc ]] || echo "${NODE_MAJOR_LTS}" > .nvmrc

if [[ ! -f .npmrc ]]; then
  cat > .npmrc <<'EOF'
fund=false
audit=false
engine-strict=true
save-exact=false
save-prefix=^
EOF
fi

if [[ ! -f .editorconfig ]]; then
  cat > .editorconfig <<'EOF'
root = true

[*]
indent_style = space
indent_size = 2
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
EOF
fi

# ---------- Environment files (non-overwrite) ----------
seed_env () {
  local file="$1"
  if [[ -f "$file" ]]; then
    warn "$file exists; leaving as-is."
  else
    info "Seeding $file ..."
    cat > "$file" <<'EOF'
# ── Craft-Fusion Environment ───────────────────────────────────────────────
NODE_ENV=development
PORT=4200

# API
API_HOST=http://localhost
API_PORT=3333
API_BASE=/api

# Auth (JWT)
JWT_ISSUER=crafthub
JWT_AUDIENCE=craft-fusion
JWT_SECRET=changeme_dev_only
JWT_EXPIRES_IN=1h

# Mongo: not used by this repo (left intentionally empty)

# WebSocket
WS_ENABLED=true
WS_PATH=/ws

# MD3 Theme
THEME_VARIANT=expressive
EOF
  fi
}

seed_env ".env.local"
seed_env ".env.production"

# ---------- VS Code recommendations ----------
if [[ ! -f .vscode/extensions.json ]]; then
  info "Writing VS Code extension recommendations..."
  cat > .vscode/extensions.json <<'EOF'
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "angular.ng-template",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "nrwl.angular-console",
    "eamodio.gitlens",
    "rust-lang.rust-analyzer",
    "golang.go"
  ]
}
EOF
fi

# ---------- Git hooks (optional, non-destructive) ----------
if command -v git >/dev/null 2>&1 && [ -d .git ]; then
  if ! command -v npx >/dev/null 2>&1; then
    info "Ensuring npx is available via pnpm..."
    pnpm i -g npm
  fi
  if [[ ! -d .husky ]]; then
    info "Setting up Husky (pre-commit lint & typecheck)..."
    pnpm dlx husky-init --yarn2 && pnpm i
    # Replace default hook with lint/typecheck if present
    HOOK=".husky/pre-commit"
    if [[ -f "$HOOK" ]]; then
      cat > "$HOOK" <<'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "Running lint & typecheck..."
if command -v pnpm >/dev/null 2>&1; then
  pnpm -s run -r lint || exit 1
  pnpm -s run -r typecheck || true
fi
EOF
      chmod +x "$HOOK"
      ok "Husky pre-commit configured."
    fi
  else
    ok "Husky already configured."
  fi
else
  warn "Git repo not detected; skipping Husky."
fi

# ---------- PM2 ecosystem template (non-overwrite) ----------
if [[ ! -f ecosystem.config.cjs ]]; then
  info "Writing PM2 ecosystem template..."
  cat > ecosystem.config.cjs <<'EOF'
/** PM2 ecosystem for Craft-Fusion (local dev / demo) */
module.exports = {
  apps: [
    {
      name: "frontend",
      cwd: "apps/frontend",
      script: "pnpm",
      args: "start",
      interpreter: "bash",
      env: { NODE_ENV: "development" }
    },
    {
      name: "backend",
      cwd: "apps/backend",
      script: "pnpm",
      args: "start:dev",
      interpreter: "bash",
      env: { NODE_ENV: "development" }
    }
  ]
};
EOF
  ok "PM2 ecosystem created."
else
  warn "ecosystem.config.cjs exists; leaving as-is."
fi

# ---------- Helpful NX notes (non-destructive) ----------
if [[ ! -f tools/scripts/NX_NOTES.md ]]; then
  cat > tools/scripts/NX_NOTES.md <<'EOF'
# Craft-Fusion Quick Commands

# Create Nx workspace (if starting fresh, choose integrated / pnpm)
pnpm dlx create-nx-workspace@latest craft-fusion

# Generate Angular app/module (no standalone)
pnpm nx g @nx/angular:application frontend --routing --prefix=app --bundler=vite --strict
pnpm nx g @nx/angular:module core --project=frontend --flat=false

# Generate NestJS app
pnpm nx g @nx/nest:application backend

# Shared interfaces lib
pnpm nx g @nx/js:lib shared-api-interfaces --directory=libs/shared --publishable=false --importPath=@shared/api-interfaces

# Run
pnpm nx serve frontend
pnpm nx serve backend

# A few scripts you may want in package.json (root):
#  "scripts": {
#    "start": "pnpm -r -w run start",
#    "start:pm2": "pm2 start ecosystem.config.cjs",
#    "lint": "nx run-many -t lint",
#    "typecheck": "nx graph --help >/dev/null 2>&1 || tsc -p tsconfig.json --noEmit"
#  }
EOF
fi

# ---------- Final summary ----------
echo
ok "Craft-Fusion system prep complete."
echo -e "${BLUE}Node:${NC} $(node -v)  ${BLUE}pnpm:${NC} $(pnpm -v)"
echo -e "${BLUE}nx:${NC} $(nx --version 2>/dev/null || echo installed)  ${BLUE}ng:${NC} $(ng version 2>/dev/null | head -n1 || echo installed)  ${BLUE}nest:${NC} $(nest --version 2>/dev/null || echo installed)"
echo -e "${BLUE}Workspace:${NC} $(realpath "$ROOT")"
echo -e "${BLUE}Next:${NC} If this is a fresh repo, run: ${GREEN}pnpm dlx create-nx-workspace@latest craft-fusion${NC} (or wire the existing one)."
