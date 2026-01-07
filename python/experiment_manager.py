#!/usr/bin/env python3
"""
Minimal experiment manager that simulates a training loop.
The Electron app spawns this script and streams stdout for live logs.
"""

from __future__ import annotations

import argparse
import json
import random
import sys
import time
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path

from rich.progress import Progress


@dataclass
class TrainingConfig:
    base_model: str = "microsoft/phi-2"
    peft_method: str = "qlora"
    max_seq_length: int = 32768
    learning_rate: float = 2e-4
    num_epochs: int = 1
    batch_size: int = 1


LOSS_MIN = 0.05
LOSS_START = 1.2
LOSS_DECAY = 0.09
LOSS_NOISE = 0.05


def load_config(path: Path) -> dict:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def simulate_training(config: TrainingConfig, datasets: list[str], experiment_id: str) -> dict:
    results_dir = Path("../results") / experiment_id
    results_dir.mkdir(parents=True, exist_ok=True)

    print(f"🚀 Launching experiment {experiment_id}", flush=True)
    print(f"🧠 Base model: {config.base_model}", flush=True)
    if datasets:
        print(f"📁 Using {len(datasets)} dataset(s)", flush=True)
    else:
        print("⚠️ No datasets provided, running dry simulation", flush=True)

    metrics = []
    with Progress() as progress:
        task = progress.add_task("[cyan]Training...", total=100)
        for step in range(10):
            time.sleep(0.4)
            loss = max(LOSS_MIN, LOSS_START - step * LOSS_DECAY + random.random() * LOSS_NOISE)
            lr = config.learning_rate * (1 - step / 10)
            metrics.append({"step": step, "loss": round(loss, 4), "lr": round(lr, 6)})
            print(f"step={step} loss={loss:.4f} lr={lr:.6f}", flush=True)
            progress.update(task, advance=10)

    summary = {
        "experiment_id": experiment_id,
        "timestamp": datetime.utcnow().isoformat(),
        "config": asdict(config),
        "datasets": datasets,
        "metrics": metrics,
    }

    output_path = results_dir / "training_results.json"
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(f"✅ Training simulation finished. Results saved to {output_path}", flush=True)
    return summary


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=Path, default=Path("../configs/experiments.json"))
    parser.add_argument("--experiment-id", type=str, default=None)
    args = parser.parse_args(argv)

    raw_cfg = load_config(args.config)
    cfg = TrainingConfig(**raw_cfg.get("training", {}))
    datasets = raw_cfg.get("datasets", [])
    experiment_id = args.experiment_id or f"exp-{int(time.time())}"

    simulate_training(cfg, datasets, experiment_id)
    return 0


if __name__ == "__main__":
    sys.exit(main())
