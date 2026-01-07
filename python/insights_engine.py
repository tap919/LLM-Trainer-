#!/usr/bin/env python3
"""
Reads training outputs and emits lightweight insights for the UI.
"""

from __future__ import annotations

import argparse
import json
import sys
import re
from pathlib import Path
from statistics import mean
from typing import Any, Dict


def load_training_results(experiment_id: str) -> Dict[str, Any]:
    path = Path("../results") / experiment_id / "training_results.json"
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def generate_insights(experiment_id: str) -> Dict[str, Any]:
    if not re.fullmatch(r"[A-Za-z0-9_-]+", experiment_id or ""):
        return {"experiment_id": experiment_id, "message": "Invalid experiment id."}
    data = load_training_results(experiment_id)
    metrics = data.get("metrics", [])
    losses = [m.get("loss") for m in metrics if "loss" in m]

    if not metrics or not losses:
        return {"experiment_id": experiment_id, "message": "No metrics found."}

    insight = {
        "experiment_id": experiment_id,
        "points": len(metrics),
        "loss_min": min(losses),
        "loss_max": max(losses),
        "loss_mean": mean(losses),
        "recommendation": "Experiment looks healthy; consider increasing epochs for more stability."
        if losses and losses[-1] < losses[0]
        else "Loss is not improving; try a lower learning rate or new dataset.",
    }

    out_dir = Path("../results/insights")
    out_dir.mkdir(parents=True, exist_ok=True)
    with (out_dir / f"{experiment_id}_insights.json").open("w", encoding="utf-8") as f:
        json.dump(insight, f, indent=2)
    return insight


def main(argv=None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--experiment-id", required=True)
    args = parser.parse_args(argv)

    insights = generate_insights(args.experiment_id)
    print(json.dumps(insights))
    return 0


if __name__ == "__main__":
    sys.exit(main())
