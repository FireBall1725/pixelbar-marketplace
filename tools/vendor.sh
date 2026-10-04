#!/bin/sh
# SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
# Copyright (C) 2026 FireBall1725
# Copies what the checks and previews borrow from the site: its simulator script and the v2 JSON schemas.
# Run it after the site changes, then commit tools/vendor. SITE defaults to ~/Repos/pixelbar-site.
set -e
cd "$(dirname "$0")"
SITE=${SITE:-$HOME/Repos/pixelbar-site}
cp "$SITE/src/scripts/pixelbar.js" "$SITE/src/scripts/v2schema.js" vendor/
cp "$SITE"/public/schema/v2/*.schema.json vendor/schema/v2/
git -C "$SITE" rev-parse --short HEAD > vendor/SITE_VERSION
echo "vendored site $(cat vendor/SITE_VERSION)"
