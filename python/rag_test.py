#!/usr/bin/env python3
"""
Simple RAG evaluation stub.
"""

import argparse
import json
from pathlib import Path
from typing import List


def load_queries(path: Path) -> List[str]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    return [q.get("query", "") for q in data]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=Path, required=True)
    parser.add_argument("--experiment-id", type=str, default="rag-exp")
    parser.add_argument("--data-path", type=Path, required=False)
    parser.add_argument("--queries-path", type=Path, required=False)
    args = parser.parse_args()

    queries = load_queries(args.queries_path) if args.queries_path else []
    print(f"[rag] Loaded {len(queries)} queries for experiment {args.experiment_id}")
    print(json.dumps({"experiment_id": args.experiment_id, "queries": queries}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
