#!/bin/bash
for s in "$@"; do timeout 400 node /tmp/s.js $s > /tmp/sim$s.txt 2>&1 & done
wait
