# CloudForge Desktop (LLM Trainer)

CloudForge is a lightweight desktop + cloud proof of concept for orchestrating LLM training experiments. The Electron UI talks to small Python utilities to simulate training runs, sync results, and generate basic insights.

## Project Layout

- `electron/` – Desktop shell (Electron) with renderer UI, preload bridge, and IPC wiring.
- `python/` – Backend utilities invoked from the UI (simulated training, syncing, insights).
- `configs/` – Example experiment and cloud configuration.
- `data/` – Placeholder dataset folders.
- `results/` – Output directory for generated artifacts.

## Prerequisites

- Node.js 18+
- Python 3.10+

## Quick Start

```bash
# Install dependencies
cd electron
npm install

# Run the desktop app
npm start
```

The desktop app will spawn the Python helpers automatically when launching an experiment.

## Python helpers (optional direct use)

```bash
cd python
python experiment_manager.py --config ../configs/experiments.json
python insights_engine.py --experiment-id demo-run
python cloud_orchestrator.py --action sync --local ./results --remote s3://bucket/path
```

## Setup Script

You can also run `./setup.sh` from the repo root to install both Node and Python dependencies and create the expected folders.

