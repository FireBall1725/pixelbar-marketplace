/* SPDX-License-Identifier: MIT
   Copyright (C) 2026 FireBall1725 */
/* Hearts: hearts float up from the bottom in the notification's colours and sway as they rise, the title drops in
   with a bounce, and the message fades in under it. A starting point for your own animation. */
#include "pixelbar.h"

/* A heart five LEDs wide, row by row. */
static const char *const HEART[5] = { ".#.#.", "#####", "#####", ".###.", "..#.." };

static void heart(int x, int y, int rgb, int alpha) {
  for (int r = 0; r < 5; r++)
    for (int c = 0; c < 5; c++)
      if (HEART[r][c] == '#') pb_px(x + c, y + r, rgb, alpha);
}

static void copy(char *d, const char *s) { while ((*d++ = *s++)) {} }

/* The notification's colours, or pinks and reds when it sent none. */
static int colour(int i) {
  static const int DEFAULTS[3] = { 0xFF5078, 0xFF96BE, 0xE12850 };
  int n = 0;
  while (n < 8 && pb_color(n) >= 0) n++;
  return n ? pb_color(i % n) : DEFAULTS[i % 3];
}

void frame(float t, int w, int h) {
  /* About one heart for every 12 columns, each with its own speed, sway and start. */
  const int count = w / 12;
  for (int i = 0; i < count; i++) {
    const float speed = 5 + pb_hash(i * 3) * 6, start = pb_hash(i * 7) * (h + 8);
    const float y = h - pb_fract((t * speed + start) / (h + 8)) * (h + 8);
    const float x = pb_hash(i * 11) * (w - 5) + pb_sin(t * 1.5f + i) * 3;
    /* Hearts fade out over the top eight rows. */
    const int alpha = (int)(pb_clamp((y + 5) / 8, 0, 1) * 230);
    heart((int)x, (int)y, colour(i), alpha);
  }

  char title[64], message[96];
  if (PB_PARAM("title", title) < 0) copy(title, "LOVE");
  const int has_message = PB_PARAM("message", message) > 0;

  /* Big title on wide strips, small on narrow ones; it drops in over the first 0.7 seconds. */
  const int size = w >= 256 && pb_text_width(title, pb_strlen(title), 2) <= w - 8 ? 2 : 1;
  const int tw = pb_text_width(title, pb_strlen(title), size);
  const float drop = t < 0.7f ? pb_bounce(t / 0.7f) : 1;
  const int ty = (size == 2 ? (has_message ? 3 : 9) : (has_message ? 5 : 12)) - (int)((1 - drop) * 30);
  pb_text(title, pb_strlen(title), (w - tw) / 2, ty, 0xFFFFFF, size, 1);

  if (has_message && t > 0.9f) {
    const int mw = pb_text_width(message, pb_strlen(message), 1);
    const int alpha = (int)(pb_clamp((t - 0.9f) / 0.4f, 0, 1) * 255);
    pb_text(message, pb_strlen(message), (w - mw) / 2, size == 2 ? 21 : 16, pb_mix(0x000000, 0xFFE6F0, alpha / 255.f), 1, 1);
  }
}
