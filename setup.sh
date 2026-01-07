#!/bin/bash

set -euo pipefail

echo "⚡ Setting up CloudForge..."

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python3 is required."
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required."
  exit 1
fi

python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:3])))')
node_version=$(node --version | sed 's/v//')

echo "Python: $python_version"
echo "Node: $node_version"

echo "📁 Creating project structure..."
mkdir -p data/{schemas,datasets,context_corpora}
mkdir -p results/{models,metrics,insights}
mkdir -p configs/training_templates

echo "🐍 Installing Python dependencies..."
cd python
python3 -m pip install -r requirements.txt

echo "📦 Installing Node dependencies..."
cd ../electron
npm install

echo "✅ Setup complete. Run the app with: npm start"
