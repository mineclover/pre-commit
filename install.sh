#!/bin/bash

# Pre-commit Folder Enforcer - Installation Script
# This script automates the installation process for the pre-commit system

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project info
REPO_URL="https://github.com/mineclover/pre-commit.git"
INSTALL_DIR="${1:-pre-commit}"

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}=================================================${NC}"
    echo -e "${BLUE}  Pre-commit Folder Enforcer - Installation${NC}"
    echo -e "${BLUE}=================================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed"
        return 1
    fi
    print_success "$1 is installed"
    return 0
}

# Main installation
print_header

# Step 1: Check prerequisites
echo "Checking prerequisites..."
echo ""

if ! check_command node; then
    print_error "Node.js is required. Please install Node.js (v18 or higher) from https://nodejs.org/"
    exit 1
fi

if ! check_command npm; then
    print_error "npm is required. Please install npm (comes with Node.js)"
    exit 1
fi

if ! check_command git; then
    print_error "git is required. Please install git from https://git-scm.com/"
    exit 1
fi

echo ""
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_info "Node.js version: $NODE_VERSION"
print_info "npm version: $NPM_VERSION"
echo ""

# Step 2: Check if target directory exists
if [ -d "$INSTALL_DIR" ]; then
    print_warning "Directory '$INSTALL_DIR' already exists"
    read -p "Do you want to remove it and continue? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Installation cancelled"
        exit 0
    fi
    rm -rf "$INSTALL_DIR"
    print_success "Removed existing directory"
fi

# Step 3: Clone repository
echo ""
echo "Cloning repository..."
if git clone "$REPO_URL" "$INSTALL_DIR" 2>&1 | grep -v "^Cloning"; then
    print_success "Repository cloned successfully"
else
    print_error "Failed to clone repository"
    exit 1
fi

# Step 4: Navigate to directory
cd "$INSTALL_DIR"

# Step 5: Install dependencies
echo ""
echo "Installing dependencies..."
if npm install --silent; then
    print_success "Dependencies installed"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 6: Build project
echo ""
echo "Building project..."
if npm run build --silent; then
    print_success "Project built successfully"
else
    print_error "Failed to build project"
    exit 1
fi

# Step 7: Create config file if it doesn't exist
echo ""
if [ ! -f ".precommitrc.json" ]; then
    echo "Creating default configuration..."
    cat > .precommitrc.json << 'EOF'
{
  "preset": "folder-based",
  "depth": 3,
  "logFile": ".commit-logs/violations.log",
  "enabled": true,
  "ignorePaths": [
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    ".gitignore",
    "README.md"
  ],
  "maxFiles": 100,
  "verbose": false,
  "language": "en",
  "logMaxAgeHours": 24
}
EOF
    print_success "Configuration file created (.precommitrc.json)"
else
    print_info "Configuration file already exists"
fi

# Step 8: Setup Git hooks
echo ""
echo "Setting up Git hooks..."
if npm run prepare --silent 2>&1; then
    print_success "Git hooks configured"
else
    print_warning "Git hooks setup skipped (not a git repository or already configured)"
fi

# Step 9: Success message
echo ""
echo -e "${GREEN}=================================================${NC}"
echo -e "${GREEN}  Installation completed successfully!${NC}"
echo -e "${GREEN}=================================================${NC}"
echo ""
print_info "Installation directory: $(pwd)"
echo ""
echo "Next steps:"
echo "  1. cd $INSTALL_DIR"
echo "  2. Edit .precommitrc.json to customize settings"
echo "  3. Start making commits!"
echo ""
echo "Useful commands:"
echo "  npm run precommit check    - Validate staged files"
echo "  npm run precommit status   - Show current status"
echo "  npm run precommit stats    - Show commit statistics"
echo "  npm run precommit help     - Show all commands"
echo ""
print_info "For more information, see: https://github.com/mineclover/pre-commit"
echo ""
