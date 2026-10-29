#!/usr/bin/env python3
"""Recompute headline public-case-study statistics from de-identified evidence.

Standard library only. This script is independent portfolio verification tooling;
it is not TeachScribe application source code.
"""
from __future__ import annotations

import csv
import json
import math
import statistics
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"


def read_csv(name: str):
    with (DATA / name).open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def percentile_linear(values, q: float) -> float:
    xs = sorted(float(x) for x in values)
    if not xs:
        raise ValueError("empty series")
    if len(xs) == 1:
        return xs[0]
    pos = (len(xs) - 1) * q
    lo, hi = math.floor(pos), math.ceil(pos)
    if lo == hi:
        return xs[lo]
    return xs[lo] + (xs[hi] - xs[lo]) * (pos - lo)


def wilson(hits: int, n: int, z: float = 1.959963984540054):
    p = hits / n
    den = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / den
    margin = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / den
    return centre - margin, centre + margin


def exact_mcnemar(b: int, c: int) -> float:
    n = b + c
    if n == 0:
        return 1.0
    k = min(b, c)
    tail = sum(math.comb(n, i) for i in range(k + 1)) / (2**n)
    return min(1.0, 2 * tail)


def close(a, b, tol=5e-4):
    return abs(float(a) - float(b)) <= tol


def check(ok: bool, label: str):
    if not ok:
        raise AssertionError(label)
    print(f"PASS  {label}")


def main():
    sustained = read_csv("sustained_search_108_runs.csv")
    times = [float(r["total_ms"]) for r in sustained]
    stats = json.loads((DATA / "recomputed_statistics.json").read_text(encoding="utf-8"))
    check(len(times) == 108 == stats["count"], "108 sustained cached searches")
    check(close(statistics.median(times), stats["median_ms"], 1e-9), "median = 441.067 ms")
    check(close(percentile_linear(times, 0.95), stats["p95_ms"], 1e-9), "P95 = 459.27785 ms")
    first20 = statistics.median(times[:20])
    last20 = statistics.median(times[-20:])
    drift = (last20 / first20 - 1) * 100
    check(close(drift, stats["first_last_drift_percent"], 1e-9), "first/last-20 median drift = 1.82058%")

    eng = json.loads((DATA / "engineering_summary.json").read_text(encoding="utf-8"))
    fp32 = eng["text_model_bytes"]["FP32"]
    int8 = eng["text_model_bytes"]["INT8"]
    reduction = (1 - int8 / fp32) * 100
    check(close(reduction, 74.77, 0.01), "text encoder size reduction = 74.77%")

    deployed = read_csv("deployed_int8_quality.csv")
    total_rows = [r for r in deployed if r["set"] == "All sets (descriptive sum)"]
    hit1 = next(r for r in total_rows if r["metric"] == "hit1")
    hit5 = next(r for r in total_rows if r["metric"] == "hit5")
    check((int(hit1["fp32_hits"]), int(hit1["int8_hits"])) == (85, 83), "descriptive Hit@1 total = FP32 85 / INT8 83")
    check((int(hit5["fp32_hits"]), int(hit5["int8_hits"])) == (103, 102), "descriptive Hit@5 total = FP32 103 / INT8 102")
    check(int(hit1["same_top1_image"]) == 97, "same top-1 image = 97/110")

    for row in deployed:
        if row["exact_mcnemar_p"]:
            b, c = int(row["only_fp32"]), int(row["only_int8"])
            check(close(exact_mcnemar(b, c), row["exact_mcnemar_p"]), f"INT8/FP32 McNemar: {row['set']} {row['metric']}")

    intervals = read_csv("hit_rate_intervals.csv")
    for row in intervals:
        hits, n = int(row["hits"]), int(row["queries"])
        low, high = wilson(hits, n)
        check(close(low, row["wilson95_low"]), f"Wilson low: {row['set']} / {row['model']} / {row['metric']}")
        check(close(high, row["wilson95_high"]), f"Wilson high: {row['set']} / {row['model']} / {row['metric']}")

    paired = read_csv("paired_model_comparison.csv")
    for row in paired:
        b = int(row["only_tinyclip39"])
        c = int(row["only_mobileclip_s0"])
        check(close(exact_mcnemar(b, c), row["exact_mcnemar_p"]), f"model-selection McNemar: {row['set']} {row['metric']}")

    print("\nAll public evidence checks passed.")


if __name__ == "__main__":
    main()
