/* SPDX-License-Identifier: MIT
   Copyright (C) 2026 FireBall1725 */
/* Bubbles: the goal celebration for a club that blows them. A burst of rays, confetti falling in the team's colours,
   the title striped in both colours dropping in with a bounce, the score and the minute beside it, the ball bobbing on
   the left, and bubbles floating up that pop near the top. Each part has its own amount, speed, size and colours. */
#include "pixelbar.h"

#define CLARET 0x7A263A
#define SKY 0x1BB1E7

static int ncolors(void) { int n = 0; while (n < 8 && pb_color(n) >= 0) n++; return n; }
/* The team colours: the notification's first two, else claret and blue. */
static void team(int *c0, int *c1) {
  const int n = ncolors();
  *c0 = n > 0 ? pb_color(0) : CLARET;
  *c1 = n > 1 ? pb_color(1) : n > 0 ? pb_color(0) : SKY;
}
/* How many colours the user set on a part; any set replaces the defaults, as the built-in themes do. */
static int pn(const char *part) { int n = 0; while (n < 8 && PB_COLOR(part, n, -1) >= 0) n++; return n; }
static int pcol(const char *part, int i, int dflt) { const int n = pn(part); return n ? PB_COLOR(part, i % n, dflt) : dflt; }
static float pct(const char *part, const char *key) { return PB_NUM(part, key, 100) / 100.f; }
static int al(float a) { return a <= 0 ? 0 : a >= 1 ? 255 : (int)(a * 255 + 0.5f); }
static float fmodp(float a, float b) { return a - b * pb_floor(a / b); }
static float fmax2(float a, float b) { return a > b ? a : b; }
static void upper(char *s) { for (; *s; s++) if (*s >= 'a' && *s <= 'z') *s -= 32; }
static void copy(char *d, const char *s) { while ((*d++ = *s++)) {} }

/* A bubble: a faint fill, a ring, and a highlight up and to the left. The smallest are a pixel and a half. */
static void bubble(float x, float y, float r, int c, float a) {
  if (r < 1.2f) { pb_pxf(x, y, c, al(a)); pb_pxf(x + 1, y, c, al(a * 0.45f)); return; }
  pb_disc(x, y, r, c, al(a * 0.12f));
  pb_ring(x, y, r, 1, c, al(a * 0.75f));
  pb_pxf(x - r * 0.45f, y - r * 0.45f, 0xFFFFFF, al(a));
}
/* A pop: the ring swells and fades while four droplets fly out. q runs 0 to 1. */
static void pop(float x, float y, float r, int c, float q) {
  const float a = 1 - q, d = r * (1 + q * 2.2f);
  pb_ring(x, y, r * (1 + q * 0.9f), 1, c, al(a * 0.6f));
  for (int k = 0; k < 4; k++) { const float an = k * 1.5708f + 0.7854f; pb_pxf(x + pb_cos(an) * d, y + pb_sin(an) * d, 0xFFFFFF, al(a * 0.9f)); }
}

/* The title in two colours: drawn once in the first, then the other colour through moving stripes, the way the goal
   screen does it. */
static void striped(const char *s, int x, int y, int size, int c0, int c1, float shift, int h) {
  const int len = pb_strlen(s), tw = pb_text_width(s, len, size), band = 2 * size;
  pb_text(s, len, x, y, c0, size, 1);
  const int k0 = (int)pb_floor(shift) - 1, k1 = k0 + tw / band + 4;
  for (int k = k0; k <= k1; k++) {
    if ((k & 1) == 0) continue;
    pb_clip(x + (k - shift) * band, 0, band, h);
    pb_text(s, len, x, y, c1, size, 0);
    pb_unclip();
  }
}

void frame(float t, int w, int h) {
  int c0, c1;
  team(&c0, &c1);
  /* The burst, the drop and the words repeat every 8 seconds, like the goal screen; the bubbles keep their own time. */
  const float ft = fmodp(t, 8);
  const int wide = w >= 256;

  if (PB_ON("sky")) pb_vgrad(0, 0, w, h, pcol("sky", 0, pb_mix(c0, 0x000000, 0.72f)), pcol("sky", 1, pb_mix(c1, 0x000000, 0.86f)), 255);

  char title[64], message[96], detail[64];
  if (PB_PARAM("title", title) < 0) copy(title, "GOAL!");
  const int has_msg = PB_PARAM("message", message) > 0, has_det = PB_PARAM("detail", detail) > 0;
  upper(title);
  if (has_msg) upper(message);
  if (has_det) upper(detail);
  /* The title at size 3 on a wide strip when it fits in the left half, like the goal screen; smaller when it has to be. */
  const int tl = pb_strlen(title);
  const int tsize = wide && pb_text_width(title, tl, 3) <= w / 2 ? 3 : pb_text_width(title, tl, 2) <= (wide ? w / 2 : w - 32) ? 2 : 1;
  const int tw = pb_text_width(title, tl, tsize), tx = 28, ty = wide ? (tsize == 3 ? 5 : tsize == 2 ? 9 : 12) : 2;
  const float cx = tx + tw / 2.f, cy = 15;

  /* Rays out from the title for the first 2.2 seconds. */
  if (ft < 2.2f && PB_ON("rays")) {
    const float k = 1 - ft / 2.2f;
    const int r0 = pcol("rays", 0, c0), r1 = pcol("rays", 1, c1);
    for (int r = 0; r < 16; r++) {
      const float a = r * 0.3927f + ft * 0.8f, L0 = 6 + ft * 40, L1 = L0 + 10 + ft * 30;
      pb_line(cx + pb_cos(a) * L0, cy + pb_sin(a) * L0 * 0.6f, cx + pb_cos(a) * L1, cy + pb_sin(a) * L1 * 0.6f, (r & 1) ? r1 : r0, al(0.8f * k), al(0.1f * k));
    }
  }

  /* Confetti falling in the team colours, every third piece a pale mix. */
  if (PB_ON("confetti")) {
    const int n = (int)(w * h / 40 * pct("confetti", "amount"));
    const float sp = pct("confetti", "speed");
    const int d0 = pcol("confetti", 0, c1), d1 = pcol("confetti", 1, c0), d2 = pcol("confetti", 2, pb_mix(c0, 0xFFFFFF, 0.5f));
    for (int i = 0; i < n; i++) {
      const float r1 = pb_hash(i * 3 + 1), r2 = pb_hash(i * 5 + 2), r3 = pb_hash(i * 9 + 3), v = (10 + r2 * 18) * sp;
      const float y = fmodp(ft * v + r1 * 40, h + 10) - 5, x = r3 * w + pb_sin(ft * 3 + i) * 2;
      const int c = i % 3 == 0 ? d0 : i % 3 == 1 ? d1 : d2, a = al(ft < 0.3f ? ft / 0.3f : 0.9f);
      pb_pxf(x, y, c, a);
      if (i % 4 == 0) pb_pxf(x + 1, y, c, a / 2);
    }
  }

  /* Bubbles: each has its own size, pace, start and the height it pops at, then comes round again from the bottom. */
  if (PB_ON("bubbles")) {
    int n = (int)(fmax2(3, w / 14.f) * pct("bubbles", "amount"));
    if (n > 160) n = 160;
    const float sp = pct("bubbles", "speed"), sz = pct("bubbles", "size");
    const int b0 = pcol("bubbles", 0, 0xDCF4FF), b1 = pcol("bubbles", 1, 0x9ADCFF);
    for (int i = 0; i < n; i++) {
      const float r = (1.2f + pb_hash(i * 5 + 7) * 2.4f) * sz, v = (5 + pb_hash(i * 3 + 11) * 6) * sp;
      const float x0 = pb_hash(i * 11 + 13) * (w + 8) - 4, yp = 1 + r + pb_hash(i * 13 + 17) * 8, y0 = h + r + 1;
      const float life = (y0 - yp) / v, cyc = life + 0.35f, u = fmodp(t + pb_hash(i * 17 + 19) * cyc, cyc);
      const float x = x0 + pb_sin(t * 1.3f + i * 1.7f) * (1 + r * 0.4f);
      const int c = (i & 1) ? b1 : b0;
      if (u < life) bubble(x, y0 - u * v, r, c, 0.9f * pb_clamp(u / 0.4f, 0, 1));
      else pop(x, yp, r, c, (u - life) / 0.35f);
    }
  }

  /* The ball on the left, bobbing while the rays burst. */
  if (PB_ON("ball")) PB_ICON("football", 13, 16 + pb_sin(ft * 5) * 1.5f * fmax2(0, 1 - ft / 3), pcol("ball", 0, 0xFFFFFF));

  /* The title drops in with a bounce, striped in both colours. */
  const float drop = ft < 0.7f ? pb_bounce(ft / 0.7f) : 1;
  striped(title, tx, ty - (int)((1 - drop) * 30), tsize, c0, c1, ft * 6, h);

  /* The score and the minute, beside the title on a wide strip, under it on a narrow one. */
  if (ft > 1.1f) {
    if (wide) {
      const int sx = tx + tw + 12, room = w - sx - 4;
      if (has_msg) {
        const int ml = pb_strlen(message), big = pb_text_width(message, ml, 2) <= room ? 2 : 1;
        pb_text(message, ml, sx, big == 2 ? 3 : 6, 0xFFFFFF, big, 1);
      }
      if (has_det) pb_text(detail, pb_strlen(detail), sx, 21, 0xC8C8D2, 1, 1);
    } else if (has_msg) pb_text(message, pb_strlen(message), tx, tsize == 2 ? 20 : 14, 0xE6E6F0, 1, 1);
  }
}

const char *manifest(void) {
  return "{\"api\":2,\"kind\":\"animation\",\"title\":\"Bubbles\",\"colors\":[\"#7A263A\",\"#1BB1E7\"],"
    "\"parts\":{"
    "\"bubbles\":{\"amount\":true,\"speed\":true,\"size\":true,\"colors\":2,\"description\":\"Bubbles floating up, popping near the top\"},"
    "\"confetti\":{\"amount\":true,\"speed\":true,\"colors\":3,\"description\":\"Confetti falling in the team colours\"},"
    "\"rays\":{\"colors\":2,\"description\":\"The burst of rays as it starts\"},"
    "\"ball\":{\"colors\":1,\"description\":\"The football on the left\"},"
    "\"sky\":{\"colors\":2,\"description\":\"The gradient behind everything, top colour then bottom\"}}}";
}
