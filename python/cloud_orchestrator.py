#!/usr/bin/env python3
"""
Lightweight cloud orchestration placeholder.
Provides simple sync and cost estimation hooks for the desktop UI.
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from datetime import datetime
from pathlib import Path

import yaml


def sync_results(source: Path, destination: Path) -> str:
    if not source.exists():
        return f"Source {source} does not exist."
    destination.mkdir(parents=True, exist_ok=True)
    for item in source.glob("**/*"):
        if item.is_file():
            relative = item.relative_to(source)
            target = destination / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(item, target)
    return f"Synced results from {source} to {destination}"


def estimate_cost(config_path: Path) -> dict:
    if not config_path.exists():
        return {"message": "Config not found"}
    with config_path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    gpu_type = data.get("cloud", {}).get("default_gpu", "RTX A6000")
    rate = {"RTX 4090": 0.8, "RTX A6000": 2.1}.get(gpu_type, 2.1)
    return {
        "gpu": gpu_type,
        "hourly_rate": rate,
        "estimate_hours": 4,
        "estimated_cost": round(rate * 4, 2),
    }


def main(argv=None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--action", choices=["sync", "estimate"], default="sync")
    parser.add_argument("--config", type=Path, default=Path("../configs/runpod.yml"))
    parser.add_argument("--source", type=Path, default=Path("../results"))
    parser.add_argument("--destination", type=Path, default=Path("../results/synced"))
    args = parser.parse_args(argv)

    if args.action == "sync":
        message = sync_results(args.source, args.destination)
        print(message)
    else:
        cost = estimate_cost(args.config)
        cost["timestamp"] = datetime.utcnow().isoformat()
        print(json.dumps(cost))
    return 0


if __name__ == "__main__":
    sys.exit(main())
