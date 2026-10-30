#!/usr/bin/env bash
set -euo pipefail
cd /workspace/DALUYAN
node --version
npm ci --no-audit --no-fund
npm run build
