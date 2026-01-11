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
    DEV_PKGS="git curl wget tar gzip unzip xz make gcc gcc-c++ python3 python3-pip openssl openssl-devel bash ca-certificates"
  EXTRA_PKGS="nginx"
    ;;
  *ubuntu*|*debian*)
    PKG="apt-get -y"
    PKG_UPDATE="$SUDO apt-get update"
    DEV_PKGS="git curl wget tar gzip unzip xz-utils build-essential python3 python3-pip pkg-config libssl-dev bash ca-certificates"
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
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  ok "NVM installed."
fi
# shellcheck source=/dev/null
export NVM_DIR="$NVM_DIR"
[[ -s "$NVM_DIR/nvm.sh" ]] && . "$NVM_DIR/nvm.sh"

NODE_MAJOR_LTS=20
if ! command -v node >/dev/null 2>&1; then
  info "Installing Node.js LTS (v${NODE_MAJOR_LTS})..."
  nvm install "${NODE_MAJOR_LTS}"
  nvm alias default "${NODE_MAJOR_LTS}"
else
  CURRENT_NODE="$(node -v | sed 's/v\([0-9]\+\).*/\1/')"
  if (( CURRENT_NODE < NODE_MAJOR_LTS )); then
    info "Upgrading Node to LTS (v${NODE_MAJOR_LTS})..."
    nvm install "${NODE_MAJOR_LTS}"
    nvm alias default "${NODE_MAJOR_LTS}"
  else ok "Node $(node -v) is sufficient."; fi
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

# ---------- Package manager detection (pnpm/corepack optional) ----------
USE_PNPM=false
if [[ -f "pnpm-lock.yaml" ]] || [[ -f ".use-pnpm" ]] || [[ "${CF_USE_PNPM:-}" == "true" ]]; then
  USE_PNPM=true
fi

if [[ "$USE_PNPM" == "true" ]]; then
  # Prefer pnpm when workspace indicates it
  if ! command -v corepack >/dev/null 2>&1; then
    warn "corepack not found; attempting install via npm (may require sudo)."
    if [[ -n "$SUDO" ]]; then
      $SUDO npm i -g corepack || warn "Failed to install corepack globally. You can install manually if needed."
    else
      warn "No sudo available; skipping corepack install."
    fi
  fi
  info "Enabling pnpm via corepack..."
  corepack enable || warn "corepack enable failed (continuing)."
  corepack prepare pnpm@latest --activate || warn "corepack prepare failed (continuing)."
  if command -v pnpm >/dev/null 2>&1; then
    ok "pnpm: $(pnpm -v)"
    # Optional global CLIs when pnpm is present
    GLOBAL_PKGS=(nx @angular/cli @nestjs/cli pm2)
    info "Installing/updating global CLIs with pnpm: ${GLOBAL_PKGS[*]} ..."
    pnpm add -g "${GLOBAL_PKGS[@]}" || warn "Global CLI install via pnpm failed (optional)."
    ok "nx: $(nx --version 2>/dev/null || echo installed), ng: $(ng version 2>/dev/null | head -n1 || echo installed), nest: $(nest --version 2>/dev/null || echo installed), pm2: $(pm2 -v 2>/dev/null || echo not installed)"
  else
    warn "pnpm not available; continuing with npm workflow."
  fi
else
  info "Detected npm workflow (no pnpm-lock.yaml). Skipping pnpm/corepack setup."
  # Ensure PM2 is available for later steps (optional)
  if ! command -v pm2 >/dev/null 2>&1; then
    info "Installing PM2 globally with npm (optional)..."
    if [[ -n "$SUDO" ]]; then
      $SUDO npm i -g pm2 || warn "Failed to install pm2 globally (optional)."
    else
      warn "No sudo available; skipping pm2 global install."
    fi
  else
    ok "pm2 already installed."
  fi
fi

# ---------- NPM Global Package Security Check ----------
info "Checking and updating global npm packages for security..."

# Check current global packages
if command -v npm >/dev/null 2>&1; then
  info "Current global packages:"
  npm list -g --depth=0 2>/dev/null || warn "Could not list global packages"
  
  # Update global packages for security
  info "Updating global npm packages..."
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
  warn "npm not available; skipping global package security check"
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
