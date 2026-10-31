#!/bin/bash
# Chạy toàn bộ test suite 5 vòng. Vòng nào fail → exit 1.
set -e
HERE="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$HERE"
echo "=== Chạy test suite 5 vòng ($(date +%H:%M:%S)) ==="
for V in 1 2 3 4 5; do
  echo
  echo "--- Vòng $V/5 ---"
  echo "[1/2] cc_test (152 bài, VN_SHEET=1)"
  cd cham-cong
  python3 build_dist.py > /dev/null
  cat cc_env.js cc_test.js > /tmp/cc_run.js
  OUT=$(VN_SHEET=1 node /tmp/cc_run.js 2>&1 | tail -1)
  cd ..
  echo "  $OUT"
  echo "$OUT" | grep -q "0 lỗi" || { echo "FAIL vòng $V cc_test"; exit 1; }
  echo "[2/2] d1.test.js (17 bài, caidat + d1)"
  OUT2=$(node cloudflare/chamcong-a/d1.test.js 2>&1 | tail -1)
  echo "  $OUT2"
  echo "$OUT2" | grep -q "0 lỗi" || { echo "FAIL vòng $V d1.test"; exit 1; }
done
echo
echo "=== 5 vòng ĐẠT ($(date +%H:%M:%S)) ==="
