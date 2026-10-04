/* SPDX-License-Identifier: MIT
   Copyright (C) 2026 FireBall1725 */
/* Wrexham dragon: the football card with a red dragon flying through it. Everything the football card does, picked by its
   "event" option, with the dragon crossing the strip behind the words, wings beating, tail whipping, breathing fire every
   few seconds; red and white when no colours are sent. The crest comes from the notification's first picture.
     goal          rays and confetti, the title striped in the team colours, the score and the minute beside it
     message       just the words, centred: HALF TIME, FULL TIME, KICK OFF
     substitution  the fourth official's board: the number coming off in red, the number going on in green, the names beside
     yellow_card   a yellow card flips in, with the player's name and the minute
     red_card      the same in red, with the strip flashing dark red first
     lineup        the names in the message, comma separated, scrolling across under the title */
#include "pixelbar.h"

#define WHITE 0xFFFFFF
#define GOLD 0xE8B53A
#define WREX_RED 0xE2001A
#define DRAGON 0xD41E2C
#define DRAGON_DARK 0x7A0E1C
#define YELLOW 0xFFD200
#define RED 0xE01A24
#define GREEN 0x28D45A

/* ---------- helpers ---------- */
static int ncolors(void) { int n = 0; while (n < 8 && pb_color(n) >= 0) n++; return n; }
static int pn(const char *part) { int n = 0; while (n < 8 && PB_COLOR(part, n, -1) >= 0) n++; return n; }
static int pcol(const char *part, int i, int dflt) { const int n = pn(part); return n ? PB_COLOR(part, i % n, dflt) : dflt; }
static float pct(const char *part, const char *key) { return PB_NUM(part, key, 100) / 100.f; }
static int al(float a) { return a <= 0 ? 0 : a >= 1 ? 255 : (int)(a * 255 + 0.5f); }
static float fmodp(float a, float b) { return a - b * pb_floor(a / b); }
static float fmax2(float a, float b) { return a > b ? a : b; }
static int imax(int a, int b) { return a > b ? a : b; }
static void upper(char *s) { for (; *s; s++) if (*s >= 'a' && *s <= 'z') *s -= 32; }
static void copy(char *d, const char *s) { while ((*d++ = *s++)) {} }
static int same(const char *a, const char *b) { while (*a && *a == *b) { a++; b++; } return *a == *b; }
static int tw(const char *s, int size) { return pb_text_width(s, pb_strlen(s), size); }
static void txt(const char *s, int x, int y, int rgb, int size) { pb_text(s, pb_strlen(s), x, y, rgb, size, 1); }
/* An option read as text, with a default. */
static void opt(const char *key, char *buf, int cap, const char *dflt) { if (pb_param(key, pb_strlen(key), buf, cap) < 0) copy(buf, dflt); }
static int opt_bool(const char *key, int dflt) { char b[8]; if (pb_param(key, pb_strlen(key), b, sizeof b) < 0) return dflt; return same(b, "true") || same(b, "1"); }

/* Where text sits in a room: left, centre or right, by the align option ("auto" takes the caller's choice). */
static int placed(const char *align, int auto_centre, int x, int room, int w) {
  if (same(align, "centre") || same(align, "center") || (same(align, "auto") && auto_centre)) return x + (room - w) / 2;
  if (same(align, "right")) return x + room - w;
  return x;
}
/* A line of text in a room, or a marquee when it's wider than the room (24 LEDs of gap, 16 LEDs a second, scaled). */
static void line(const char *s, int x, int y, int room, int size, int rgb, const char *align, int auto_centre, float t, float speed, int h) {
  const int w = tw(s, size);
  if (w <= room) { txt(s, placed(align, auto_centre, x, room, w), y, rgb, size); return; }
  const int gap = 24; const float off = fmodp(t * 16 * speed, (float)(w + gap));
  pb_clip(x, y - 1, room, size * 7 + 2);
  txt(s, x - (int)off, y, rgb, size); txt(s, x - (int)off + w + gap, y, rgb, size);
  pb_unclip();
  (void)h;
}
/* The title in two colours: drawn once in the first, then the other through moving stripes, like the goal screen. */
static void striped(const char *s, int x, int y, int size, int c0, int c1, float shift, int h) {
  const int len = pb_strlen(s), w = pb_text_width(s, len, size), band = 2 * size;
  pb_text(s, len, x, y, c0, size, 1);
  const int k0 = (int)pb_floor(shift) - 1, k1 = k0 + w / band + 4;
  for (int k = k0; k <= k1; k++) { if ((k & 1) == 0) continue; pb_clip(x + (k - shift) * band, 0, band, h); pb_text(s, len, x, y, c1, size, 0); pb_unclip(); }
}
/* The crest: the first picture, else the ball icon. Gives back where the words may start. */
static int crest(int w, float bob) {
  const int iw = pb_image(0, 2, 2 + bob, 255);
  if (iw > 0) return 2 + iw + 6;
  PB_ICON("football", 13, 16 + bob, WHITE);
  (void)w; return 30;
}
/* A shirt number at the front of "9 Antonio": the digits, and where the name starts. */
static int shirt(const char *s, char *num, int cap) {
  int i = 0, n = 0;
  while (s[i] == ' ') i++;
  while (s[i] >= '0' && s[i] <= '9' && n < cap - 1) num[n++] = s[i++];
  num[n] = 0;
  while (s[i] == ' ' || s[i] == '-' || s[i] == '.') i++;
  return n ? i : 0;
}

/* A shirt number as two 7-segment cells: "9" becomes " 9", nothing becomes two unlit cells, three digits keep their first two. */
static void two_cells(char *num) {
  const int n = pb_strlen(num);
  if (n == 0) { num[0] = ' '; num[1] = ' '; num[2] = 0; }
  else if (n == 1) { num[2] = 0; num[1] = num[0]; num[0] = ' '; }
  else num[2] = 0;
}

/* The digital disruption a cell goes through before it settles: a new random glyph every 1/20 s until the cell's lock time,
   0.35 s plus 0.18 s per cell from the left, so the board resolves in a sweep. */
static void scramble(const char *num, char *out, float t, int first_cell) {
  static const char POOL[] = "0123456789ABCDEFHJLNPUY-_=";
  for (int i = 0; i < 2; i++) {
    const float lock = 0.35f + 0.18f * (first_cell + i);
    if (t >= lock) out[i] = num[i];
    else { const int step = (int)(t * 20); out[i] = POOL[(int)(pb_hash(step * 7 + (first_cell + i) * 131 + 3) * (sizeof POOL - 1))]; }
  }
  out[2] = 0;
}

/* ---------- the dragon ---------- */
/* A filled, soft-edged triangle: the wing membranes. */
static void tri(double x0, double y0, double x1, double y1, double x2, double y2, int c, int a) { const double P[6] = { x0, y0, x1, y1, x2, y2 }; pb_poly(P, 3, c, a); }
/* One dragon flying right, centred on cx, cy, s LEDs per unit (1.3 fills the strip), with its own clock t. The back wing goes
   behind the body, the front wing over it; the mouth opens and breathes fire for a second every five. */
static void dragon(float t, float cx, float cy, float s, int body, int fire, int force_fire) {
  const float flap = pb_sin(t * 7);
  const int shade = pb_mix(body, 0x000000, 0.42f), light = pb_mix(body, WHITE, 0.18f);
  const float breath = force_fire ? 4.2f : fmodp(t, 5.f), blowing = breath > 3.6f && breath < 4.8f ? 1 : 0;
  /* back wing: root on the body's back, tip sweeping up or down with the flap, a scalloped trailing edge */
  const float wy = cy - 3 * s, tipY = wy - flap * 9 * s, tipX = cx - 7 * s;
  tri(cx - 1 * s, wy, cx + 2.5f * s, wy, tipX - 1 * s, tipY, shade, 230);
  tri(cx - 1 * s, wy, tipX - 1 * s, tipY, cx - 8 * s, wy - flap * 4 * s + 1 * s, shade, 200);
  /* tail: tapering, whipping behind */
  for (int i = 0; i < 12; i++) {
    const float u = i / 11.f, x = cx - 5 * s - u * 12 * s, y = cy + 1 * s + pb_sin(t * 4 - u * 4) * (1 + u * 3) * s * 0.6f;
    pb_disc(x, y, (1.5f - u * 1.1f) * s, i % 3 ? body : shade, 255);
  }
  { const float tx = cx - 17 * s, ty = cy + 1 * s + pb_sin(t * 4 - 4) * 4 * s * 0.6f; tri(tx + 1.2f * s, ty - 1.4f * s, tx + 1.2f * s, ty + 1.4f * s, tx - 1.6f * s, ty, shade, 255); }
  /* body */
  pb_disc(cx - 3 * s, cy + 0.5f * s, 3.4f * s, body, 255);
  pb_disc(cx, cy, 4.2f * s, body, 255);
  pb_disc(cx + 3 * s, cy - 0.6f * s, 3.6f * s, body, 255);
  pb_disc(cx + 0.5f * s, cy + 1.8f * s, 2.4f * s, light, 170);
  pb_disc(cx + 2 * s, cy - 2.6f * s, 1.6f * s, light, 150);
  /* legs tucked under */
  pb_rectf(cx - 1 * s, cy + 3.6f * s, 1.2f * s, 2.2f * s, shade, 255); pb_rectf(cx + 2.5f * s, cy + 3.2f * s, 1.2f * s, 2.2f * s, shade, 255);
  /* neck and head */
  for (int i = 0; i < 6; i++) { const float u = i / 5.f; pb_disc(cx + 5 * s + u * 6.5f * s, cy - 1.5f * s - u * 5.5f * s, (1.9f - u * 0.5f) * s, body, 255); }
  const float hx = cx + 12.2f * s, hy = cy - 7.4f * s;
  pb_disc(hx, hy, 2.3f * s, body, 255);
  pb_rectf(hx + 1.2f * s, hy - 1.0f * s, 4.2f * s, 1.6f * s, body, 255);                       /* upper jaw */
  pb_rectf(hx + 1.2f * s, hy + 0.6f * s + blowing * 1.4f * s, 3.4f * s, 1.1f * s, shade, 255); /* lower jaw, dropped when it breathes */
  pb_line(hx - 1.6f * s, hy - 1.8f * s, hx - 3.4f * s, hy - 4.2f * s, shade, 255, 255);       /* horns */
  pb_line(hx - 0.4f * s, hy - 2.1f * s, hx - 1.6f * s, hy - 4.6f * s, shade, 255, 255);
  pb_disc(hx + 0.8f * s, hy - 0.9f * s, 0.7f * s, 0xFFE040, 255);                             /* eye */
  /* front wing */
  tri(cx + 0.5f * s, wy + 0.5f * s, cx + 3.5f * s, wy + 0.5f * s, tipX + 2 * s, tipY - 1.5f * s, light, 235);
  tri(cx + 0.5f * s, wy + 0.5f * s, tipX + 2 * s, tipY - 1.5f * s, cx - 6 * s, wy - flap * 4 * s + 1.5f * s, body, 215);
  /* fire: a cone of hot sparks out of the open mouth */
  if (blowing) {
    const float q = (breath - 3.6f) / 1.2f, k = q < 0.15f ? q / 0.15f : q > 0.8f ? (1 - q) / 0.2f : 1;
    for (int i = 0; i < 26; i++) {
      const float u = fmodp(pb_hash(i * 13 + 5) + t * 2.2f, 1.f), spread = (pb_hash(i * 7 + 9) - 0.5f) * (1 + u * 6) * s;
      const float x = hx + 5 * s + u * 13 * s, y = hy + spread;
      const int c = u < 0.3f ? 0xFFF4A0 : u < 0.65f ? pb_mix(fire, 0xFFF4A0, 0.3f) : pb_mix(fire, 0xA01000, (u - 0.65f) / 0.35f);
      pb_add(x, y, c, al(k * (1 - u * 0.7f)));
      if (u < 0.5f) pb_add(x, y + (spread > 0 ? 1 : -1), c, al(k * 0.5f));
    }
  }
}
/* The dragons part: one (or more, by amount) crossing left to right behind the words, bobbing as it flies, round again from the left. */
static void dragons(float t, int w, int h) {
  if (!PB_ON("dragon")) return;
  int n = (int)pb_floor(pct("dragon", "amount") + 0.5f); if (n < 1) n = 1; if (n > 4) n = 4;
  const float sp = pct("dragon", "speed"), s = 1.6f * pct("dragon", "size");
  const int body = pcol("dragon", 0, DRAGON), fire = pcol("dragon", 1, 0xFF7A1A);
  for (int i = 0; i < n; i++) {
    /* Across the strip in about four and a half seconds whatever its width, each extra dragon a touch quicker. */
    const float span = w + 44 * s, v = span / 4.5f * (1 + i * 0.15f) * sp, x = fmodp(t * v + pb_hash(i * 31 + 2) * span, span) - 22 * s;
    const float y = h * 0.58f + pb_sin(t * 1.6f + i * 2) * 1.6f * s;
    dragon(t + i * 1.7f, x, y, s, body, fire, 0);
  }
}

/* The fire sweep: every eight seconds a dragon crosses low and fast, breathing flame; everything behind it burns to black
   with embers, and the card redraws fresh behind that. The words it burns come back whole as the loop starts again. */
static void burn(float t, int w, int h, int body, int fire) {
  const float ft = fmodp(t, 8.f); if (ft < 6.0f) return;
  const float q = (ft - 6.0f) / 2.0f, s = 1.6f * pct("dragon", "size");
  const float x = -26 * s + q * (w + 56 * s), y = h * 0.56f + pb_sin(t * 9) * 1.2f, front = x + 16 * s;
  /* burnt: black behind the flame front, a glowing edge of embers just behind it */
  if (front > 0) pb_rectf(0, 0, front, h, 0x000000, 255);
  for (int i = 0; i < 40; i++) {
    const float ex = front - pb_hash(i * 5 + 1) * 10 * s, ey = pb_hash(i * 9 + 2) * h, fl = 0.5f + 0.5f * pb_sin(t * 20 + i);
    if (ex < 0) continue;
    pb_add(ex, ey, pb_mix(fire, 0xFFF4A0, pb_hash(i * 3) * 0.6f), al(fl * (1 - pb_hash(i * 5 + 1) * 0.8f)));
  }
  /* smoke: a few grey wisps rising where it just burned */
  for (int i = 0; i < 10; i++) { const float sx = front - 12 * s - pb_hash(i * 7 + 4) * 30 * s, sy = h * 0.3f + pb_sin(t * 3 + i) * 4 - pb_hash(i * 11) * h * 0.3f; if (sx > 0) pb_disc(sx, sy, 1.5f + pb_hash(i) * 1.5f, 0x3A3236, al(0.35f)); }
  dragon(t, x, y, s, body, fire, 1);
}

/* ---------- the events ---------- */
static void confetti(float ft, int w, int h, int c0, int c1) {
  if (!PB_ON("confetti")) return;
  const int n = (int)(w * h / 40 * pct("confetti", "amount")); const float sp = pct("confetti", "speed");
  const int d0 = pcol("confetti", 0, c1), d1 = pcol("confetti", 1, c0), d2 = pcol("confetti", 2, pb_mix(c0, WHITE, 0.5f));
  for (int i = 0; i < n; i++) {
    const float r1 = pb_hash(i * 3 + 1), r2 = pb_hash(i * 5 + 2), r3 = pb_hash(i * 9 + 3), v = (10 + r2 * 18) * sp;
    const float y = fmodp(ft * v + r1 * 40, h + 10) - 5, x = r3 * w + pb_sin(ft * 3 + i) * 2;
    const int c = i % 3 == 0 ? d0 : i % 3 == 1 ? d1 : d2, a = al(ft < 0.3f ? ft / 0.3f : 0.9f);
    pb_pxf(x, y, c, a); if (i % 4 == 0) pb_pxf(x + 1, y, c, a / 2);
  }
}
static void rays(float ft, float cx, float cy, int c0, int c1) {
  if (ft >= 2.2f || !PB_ON("rays")) return;
  const float k = 1 - ft / 2.2f; const int r0 = pcol("rays", 0, c0), r1 = pcol("rays", 1, c1);
  for (int r = 0; r < 16; r++) {
    const float a = r * 0.3927f + ft * 0.8f, L0 = 6 + ft * 40, L1 = L0 + 10 + ft * 30;
    pb_line(cx + pb_cos(a) * L0, cy + pb_sin(a) * L0 * 0.6f, cx + pb_cos(a) * L1, cy + pb_sin(a) * L1 * 0.6f, (r & 1) ? r1 : r0, al(0.8f * k), al(0.1f * k));
  }
}

static void goal(float t, int w, int h, int c0, int c1, char *title, const char *message, const char *detail, int has_msg, int has_det, const char *align) {
  const float ft = fmodp(t, 8); const int wide = w >= 256, show = opt_bool("show_title", 1), stripes = opt_bool("stripes", 1);
  const int tx = crest(w, pb_sin(ft * 5) * 1.5f * fmax2(0, 1 - ft / 3));
  const int tl = pb_strlen(title);
  const int tsize = !show ? 0 : wide && pb_text_width(title, tl, 3) <= w / 2 ? 3 : pb_text_width(title, tl, 2) <= (wide ? w / 2 : w - tx - 4) ? 2 : 1;
  const int ttw = show ? pb_text_width(title, tl, tsize) : 0, ty = wide ? (tsize == 3 ? 5 : tsize == 2 ? 9 : 12) : 2;
  rays(ft, show ? tx + ttw / 2.f : w / 2.f, 15, c0, c1);
  confetti(ft, w, h, c0, c1);
  const int right = w >= 384 && pb_image_size(1, 0) > 0 ? w - 2 - pb_image_size(1, 0) - 4 : w - 4;
  if (w >= 384) pb_image(1, w - 2 - pb_image_size(1, 0), 2, al(ft > 1.1f ? pb_clamp((ft - 1.1f) / 0.5f, 0, 1) * 0.9f : 0));
  if (show) {
    const float drop = ft < 0.7f ? pb_bounce(ft / 0.7f) : 1; const int y = ty - (int)((1 - drop) * 30);
    if (stripes) striped(title, tx, y, tsize, c0, c1, ft * 6, h); else txt(title, tx, y, c0, tsize);
  }
  if (ft <= 1.1f) return;
  if (wide) {
    const int sx = show ? tx + ttw + 12 : tx, room = right - sx;
    if (has_msg) { const int big = tw(message, 2) <= room ? 2 : 1; line(message, sx, has_det ? (big == 2 ? 3 : 6) : (big == 2 ? 9 : 12), room, big, WHITE, align, !show, t, 1, h); }
    if (has_det) line(detail, sx, 21, room, 1, 0xC8C8D2, align, !show, t, 1, h);
  } else if (show) {
    if (has_msg) line(message, tx, tsize == 2 ? 20 : 14, w - tx - 4, 1, 0xE6E6F0, align, 0, t, 1, h);
  } else {
    const int room = w - tx - 4;
    if (has_msg) { const int big = tw(message, 2) <= room ? 2 : 1; line(message, tx, has_det ? 3 : (big == 2 ? 9 : 12), room, big, WHITE, align, 1, t, 1, h); }
    if (has_det) line(detail, tx, 21, room, 1, 0xC8C8D2, align, 1, t, 1, h);
  }
}

static void message_event(float t, int w, int h, const char *message, const char *detail, int has_msg, int has_det, const char *title, const char *align) {
  const int tx = pb_image_size(0, 0) > 0 ? crest(w, 0) : 4, room = w - tx - 4;
  const char *m = has_msg ? message : title;
  const int big = tw(m, 2) <= room ? 2 : 1;
  line(m, tx, has_det ? (big == 2 ? 3 : 6) : (big == 2 ? 9 : 12), room, big, WHITE, align, 1, t, 1, h);
  if (has_det) line(detail, tx, 21, room, 1, 0xC8C8D2, align, 1, t, 1, h);
}

static void substitution(float t, int w, int h, int c0, int c1, const char *message, const char *detail, int has_msg, int has_det, const char *title) {
  const float ft = fmodp(t, 8); const int wide = w >= 256;
  const int tx = crest(w, 0);
  char in_no[8] = "", out_no[8] = ""; const char *in_name = "", *out_name = "";
  if (has_msg) { const int i = shirt(message, in_no, sizeof in_no); in_name = message + i; }
  if (has_det) { const int i = shirt(detail, out_no, sizeof out_no); out_name = detail + i; }
  /* The board always has two cells a side, like the real one: a single digit sits in the right cell with the left one unlit. */
  two_cells(out_no); two_cells(in_no);
  /* The board scrambles in: every cell cycles through random segments like a display finding its signal, then locks onto
     its digit, the red cells first, the green ones after. */
  const int by = 8;
  int x = tx;
  char o2[3], i2[3]; scramble(out_no, o2, ft, 0); scramble(in_no, i2, ft, 2);
  const int ow = PB_TEXT_WIDTH_FONT("segment", o2, 1), iw = PB_TEXT_WIDTH_FONT("segment", i2, 1);
  pb_rectf(x - 2, by - 2, ow + iw + 8 + 4, 20, 0x14161C, 255);
  PB_TEXT_FONT("segment", o2, x, by, RED, 1, 0); x += ow + 8;
  PB_TEXT_FONT("segment", i2, x, by, GREEN, 1, 0); x += iw;
  x += 8;
  const int room = w - x - 4;
  if (room < 24) return;
  if (wide) {
    char l1[112], l2[112]; copy(l1, "IN  "); copy(l1 + 4, in_name); copy(l2, "OUT "); copy(l2 + 4, out_name);
    line(l1, x, 4, room, 1, GREEN, "left", 0, t, 1, h);
    line(l2, x, 14, room, 1, RED, "left", 0, t, 1, h);
    txt(title, x, 24, 0x9AA2B2, 1);
  } else {
    pb_text_font("small", 5, in_name, pb_strlen(in_name), x, 6, GREEN, 1, 1);
    pb_text_font("small", 5, out_name, pb_strlen(out_name), x, 18, RED, 1, 1);
  }
  (void)c0; (void)c1;
}

static void card_event(float t, int w, int h, int red, const char *message, const char *detail, int has_msg, int has_det, const char *title) {
  const float ft = fmodp(t, 8); const int wide = w >= 256, col = red ? RED : YELLOW;
  if (red && ft < 1.2f) { const float k = 0.5f + 0.5f * pb_sin(ft * 18); pb_rectf(0, 0, w, h, 0x400008, al(k * (1 - ft / 1.2f))); }
  const int tx = crest(w, 0);
  /* The card flips in: its width follows the cosine of the turn, then it settles with a small shake. */
  const float turn = ft < 0.6f ? ft / 0.6f : 1, cw = 10 * (turn < 1 ? (pb_cos(turn * 3.1416f * 1.5f) < 0 ? -pb_cos(turn * 3.1416f * 1.5f) : pb_cos(turn * 3.1416f * 1.5f)) : 1);
  const float shake = ft > 0.6f && ft < 1.0f ? pb_sin(ft * 60) * 1.2f : 0;
  const float cx = tx + 6 + shake, cy = 16;
  pb_rectf(cx - cw / 2, cy - 7, cw, 14, col, 255);
  if (cw > 4) pb_rectf(cx - cw / 2 + 1, cy - 6, cw - 2, 1, pb_mix(col, WHITE, 0.35f), 255);
  const int x = tx + 18, room = w - x - 4;
  if (room < 20) return;
  if (wide) {
    txt(title, x, 2, col, 1);
    if (has_det) txt(detail, w - 4 - tw(detail, 1), 2, 0xC8C8D2, 1);
    if (has_msg) { const int big = tw(message, 2) <= room ? 2 : 1; line(message, x, big == 2 ? 12 : 16, room, big, WHITE, "left", 0, t, 1, h); }
  } else {
    txt(title, x, 3, col, 1);
    if (has_msg) line(message, x, 14, room, 1, WHITE, "left", 0, t, 1, h);
    if (has_det) pb_text_font("small", 5, detail, pb_strlen(detail), x, 25, 0xC8C8D2, 1, 1);
  }
}

static void lineup(float t, int w, int h, int c0, int c1, const char *message, const char *detail, int has_msg, int has_det, const char *title) {
  const int tx = crest(w, 0), room = w - tx - 4;
  txt(title, tx, 2, c1, 1);
  if (has_det) txt(detail, tx + tw(title, 1) + 8, 2, 0x9AA2B2, 1);
  if (!has_msg) return;
  /* Commas become gaps between the names; the whole line scrolls round and round. */
  char s[512]; int n = 0;
  for (int i = 0; message[i] && n < 500; i++) { if (message[i] == ',' || message[i] == ';') { copy(s + n, "   -   "); n += 7; while (message[i + 1] == ' ') i++; } else s[n++] = message[i]; }
  s[n] = 0;
  const int big = tw(s, 2) <= room ? 2 : 1;
  line(s, tx, big == 2 ? 12 : 16, room, 2, WHITE, "left", 0, t, pct("ticker", "speed"), h);
  (void)c0; (void)big;
}

void frame(float t, int w, int h) {
  const int n = ncolors(), c0 = n > 0 ? pb_color(0) : WREX_RED, c1 = n > 1 ? pb_color(1) : n > 0 ? pb_color(0) : WHITE;
  char event[24], align[12]; opt("event", event, sizeof event, "goal"); opt("align", align, sizeof align, "auto");
  if (PB_ON("sky")) pb_vgrad(0, 0, w, h, pcol("sky", 0, pb_mix(c0, 0x000000, 0.86f)), pcol("sky", 1, pb_mix(c1, 0x000000, 0.9f)), 255);
  dragons(t, w, h);

  char title[64], message[192], detail[96];
  const int has_title = PB_PARAM("title", title) > 0, has_msg = PB_PARAM("message", message) > 0, has_det = PB_PARAM("detail", detail) > 0;
  if (!has_title) copy(title, same(event, "yellow_card") ? "YELLOW CARD" : same(event, "red_card") ? "RED CARD" : same(event, "substitution") ? "SUBSTITUTION" : same(event, "lineup") ? "LINE-UP" : "GOAL!");
  upper(title); if (has_msg) upper(message); if (has_det) upper(detail);

  if (same(event, "message")) message_event(t, w, h, message, detail, has_msg, has_det, title, align);
  else if (same(event, "substitution")) substitution(t, w, h, c0, c1, message, detail, has_msg, has_det, title);
  else if (same(event, "yellow_card")) card_event(t, w, h, 0, message, detail, has_msg, has_det, title);
  else if (same(event, "red_card")) card_event(t, w, h, 1, message, detail, has_msg, has_det, title);
  else if (same(event, "lineup")) lineup(t, w, h, c0, c1, message, detail, has_msg, has_det, title);
  else goal(t, w, h, c0, c1, title, message, detail, has_msg, has_det, align);
  if (opt_bool("burn", 1) && PB_ON("dragon")) burn(t, w, h, pcol("dragon", 0, DRAGON), pcol("dragon", 1, 0xFF7A1A));
}

const char *manifest(void) {
  return "{\"api\":2,\"kind\":\"animation\",\"title\":\"Wrexham dragon\",\"colors\":[\"#E2001A\",\"#FFFFFF\"],"
    "\"options\":{"
    "\"event\":{\"values\":[\"goal\",\"message\",\"substitution\",\"yellow_card\",\"red_card\",\"lineup\"],\"default\":\"goal\",\"description\":\"What happened: a goal, a plain message, a substitution, a yellow or red card, or the line-up scrolling by\","
    "\"examples\":{\"message\":{\"title\":\"\",\"message\":\"Half time\",\"detail\":\"WRX 1-0 STK\"},\"substitution\":{\"title\":\"\",\"message\":\"10 Mullin\",\"detail\":\"9 Palmer\"},"
    "\"yellow_card\":{\"title\":\"\",\"message\":\"McClean\",\"detail\":\"71'\"},\"red_card\":{\"title\":\"\",\"message\":\"Brunt\",\"detail\":\"88'\"},"
    "\"lineup\":{\"title\":\"\",\"message\":\"Okonkwo, Barnett, O'Connor, Brunt, Cannon, Dobson, Lee, James, McClean, Mullin, Palmer\",\"detail\":\"3-5-2\"}}},"
    "\"align\":{\"values\":[\"auto\",\"left\",\"centre\",\"right\"],\"default\":\"auto\",\"description\":\"Where the words sit in their room; auto centres a message and keeps a goal's score beside its title\"},"
    "\"show_title\":{\"type\":\"boolean\",\"default\":true,\"description\":\"The big title on a goal; off, the message takes its space\"},"
    "\"stripes\":{\"type\":\"boolean\",\"default\":true,\"description\":\"The goal title in moving stripes of both colours; off, it's the first colour alone\"},"
    "\"burn\":{\"type\":\"boolean\",\"default\":true,\"description\":\"Every eight seconds the dragon sweeps across breathing fire and burns the card clear; it comes back fresh behind it\"}},"
    "\"parts\":{"
    "\"dragon\":{\"amount\":true,\"speed\":true,\"size\":true,\"colors\":2,\"description\":\"The red dragon flying through, wings beating and breathing fire: body colour, then the fire; amount 200 brings a second one\"},"
    "\"sky\":{\"colors\":2,\"description\":\"The gradient behind everything, top colour then bottom\"},"
    "\"rays\":{\"colors\":2,\"description\":\"The burst of rays as a goal starts\"},"
    "\"confetti\":{\"amount\":true,\"speed\":true,\"colors\":3,\"description\":\"Confetti falling in the team colours on a goal\"},"
    "\"ticker\":{\"speed\":true,\"description\":\"How fast a line-up, or any line too long for its room, scrolls\"}}}";
}
