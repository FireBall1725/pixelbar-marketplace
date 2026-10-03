#!/bin/sh
# SPDX-License-Identifier: MIT
# Copyright (C) 2026 FireBall1725
# Compiles one animation to WebAssembly: sdk/build.sh path/to/anim.c [out.wasm]
# Needs clang with the wasm32 target and wasm-ld (macOS: Xcode's clang plus `brew install lld`; Linux: apt install clang lld).
set -e
SRC=$1
OUT=${2:-${SRC%.c}.wasm}
[ -n "$SRC" ] || { echo "usage: sdk/build.sh anim.c [out.wasm]" >&2; exit 2; }
SDK=$(cd "$(dirname "$0")" && pwd)
WASM_LD=${WASM_LD:-$(command -v wasm-ld || ls /opt/homebrew/opt/lld/bin/wasm-ld /usr/local/opt/lld/bin/wasm-ld 2>/dev/null | head -1)}
[ -x "$WASM_LD" ] || { echo "wasm-ld not found: install lld, or set WASM_LD" >&2; exit 1; }
# No C library, one 64 KB page of memory with an 8 KB stack, and the same float maths on every target (-ffp-contract=off).
clang --target=wasm32 -O2 -ffp-contract=off -nostdlib -I"$SDK/include" -fuse-ld="$WASM_LD" \
  -Wl,--no-entry -Wl,--initial-memory=65536 -Wl,--max-memory=65536 -Wl,-z,stack-size=8192 -Wl,--strip-all \
  -o "$OUT" "$SRC"
echo "$OUT: $(wc -c < "$OUT" | tr -d ' ') bytes"
