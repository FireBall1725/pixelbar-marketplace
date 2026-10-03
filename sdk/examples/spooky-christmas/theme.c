/* SPDX-License-Identifier: MIT
   Copyright (C) 2026 FireBall1725 */
/* Spooky Christmas: a teal-to-purple night sky, a huge moon behind a hill whose crest curls into a spiral, bats, crooked
   gravestones, a bent fence, jack-o'-lanterns in Santa hats, striped gifts and falling snow. A port of the built-in theme,
   LED for LED, and the SDK's example of a theme plugin: it reads its parts from the theme message and draws every frame. */
#include "pixelbar.h"

/* ---------- the maths the built-in scenes do in JavaScript, kept in double so every LED lands where theirs does ---------- */
static double js_trunc(double x) { return (double)(long long)x; }
static double js_floor(double x) { const double i = js_trunc(x); return i > x ? i - 1 : i; }
static double js_ceil(double x) { const double i = js_trunc(x); return i < x ? i + 1 : i; }
static double js_round(double x) { return js_floor(x + 0.5); }
static double js_max(double a, double b) { return a > b ? a : b; }
static double js_abs(double x) { return x < 0 ? -x : x; }
/* JavaScript's %: the remainder keeps the sign of the dividend. */
static double js_mod(double a, double b) {
  double r = a - b * js_trunc(a / b);
  if (a >= 0 && r < 0) r += b; else if (a < 0 && r > 0) r -= b;
  return r;
}
#define PI 3.141592653589793

/* An alpha from 0 to 1 as the API's 0 to 255. */
static int al(double a) { return a <= 0 ? 0 : a >= 1 ? 255 : (int)(a * 255 + 0.5); }
static int rgb(double r, double g, double b) { return pb_rgb((int)js_round(r), (int)js_round(g), (int)js_round(b)); }
/* Between colours a and b, k from 0 to 1. */
static int mixc(int a, int b, double k) {
  const int ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  return rgb(ar + (((b >> 16) & 255) - ar) * k, ag + (((b >> 8) & 255) - ag) * k, ab + ((b & 255) - ab) * k);
}

/* ---------- parts: on, amount/speed/size as 1.0 for "as drawn", and colours ---------- */
static double num(const char *part, const char *key) { return PB_NUM(part, key, 100) / 100.0; }
/* How many colours the user set on a part; any set replaces the whole default list, as the built-in themes do. */
static int ncols(const char *part) { int n = 0; while (n < 8 && PB_COLOR(part, n, -1) >= 0) n++; return n; }
static int colour(const char *part, int i, const int *dflt, int ndflt) {
  const int n = ncols(part);
  return n ? PB_COLOR(part, i % n, 0) : dflt[i % ndflt];
}
static int count(const char *part, int ndflt) { const int n = ncols(part); return n ? n : ndflt; }

/* ---------- the pieces ---------- */
/* Stars that twinkle, each at its own pace. */
static void sparkles(double t, int W, int H, double k, int n, const char *part, const int *dflt, int ndflt) {
  const int nc = count(part, ndflt);
  for (int i = 0; i < n; i++) {
    const double v = 0.5 + 0.5 * pb_sind(t * (2 + pb_hashd(i * 1.7) * 2) + i * 2.3);
    pb_pxf(pb_hashd(i * 7.3 + 0) * W, pb_hashd(i * 3.1 + 0 + 9) * H, colour(part, i % nc, dflt, ndflt), al(k * (v * v)));
  }
}

/* The hill, a long rise, then its crest rolling up into a curl. */
static void spiralHill(double cx, double by, int c, double s) {
  const double top = by - 14 * s;
  for (double x = -34 * s; x <= 8 * s; x++) {
    const double u = x / (34 * s), h = x <= 0 ? (14 * s) * (1 - u * u) : 14 * s - pb_powd(x / (8 * s), 2) * 6 * s;
    pb_rectf(cx + x, by - h, 1, h + 1, c, 255);
  }
  for (double a = 0; a < PI * 3.2; a += 0.05) {
    const double r = (1 + a * 1.15) * s, x = cx + 8 * s - 1 + pb_cosd(a + PI) * r * 0.9, y = top - 1 + pb_sind(a + PI) * r * 0.75;
    pb_rectf(x, y, s > 1 ? 2 : 1.4, s > 1 ? 2 : 1.4, c, 255);
  }
}

/* A bat with its wings up or down. */
static void bat(double x, double y, double t, int i, int c) {
  static const int BODY[4][2] = { { 0, 0 }, { 0, 1 }, { -1, 0 }, { 1, 0 } };
  static const int UP[4][2] = { { -2, -1 }, { 2, -1 }, { -3, -2 }, { 3, -2 } }, DOWN[4][2] = { { -2, 1 }, { 2, 1 }, { -3, 1 }, { 3, 1 } };
  const int up = pb_sind(t * 16 + i * 1.3) > 0;
  for (int j = 0; j < 4; j++) pb_pxf(x + BODY[j][0], y + BODY[j][1], c, 255);
  for (int j = 0; j < 4; j++) pb_pxf(x + (up ? UP : DOWN)[j][0], y + (up ? UP : DOWN)[j][1], c, 255);
}

/* A gravestone leaning left or right, with a dark chip near the top. */
static void gravestone(double x, double by, int i, int c) {
  const int h = 5 + (i % 3), w = 4 + (i % 2), lean = i % 2 ? 1 : -1;
  for (int j = 0; j < h; j++) pb_rectf(x + js_round(lean * j / 4.0), by - j, w, 1, c, 255);
  pb_pxf(x + js_round(lean * h / 4.0) + 1, by - h, c, 255);
  pb_pxf(x + js_round(lean * (h - 2) / 4.0) + 1, by - h + 3, pb_rgb(20, 20, 26), 255);
}

/* A jack-o'-lantern: two dark lobes, a lit face that flickers, a green stalk. */
static void jackO(double cx, double cy, double t, double s) {
  static const int FACE[13][2] = { { -2, -1 }, { -3, 0 }, { -2, 0 }, { 2, -1 }, { 2, 0 }, { 3, 0 }, { -3, 2 }, { -2, 3 }, { -1, 3 }, { 0, 2 }, { 1, 3 }, { 2, 3 }, { 3, 2 } };
  const int o = pb_rgb(225, 100, 12), d = pb_rgb(150, 55, 8), g = pb_rgb(255, 240, 140);
  pb_disc(cx - 2.2 * s, cy, 3.6 * s, d, 255);
  pb_disc(cx + 2.2 * s, cy, 3.6 * s, d, 255);
  pb_disc(cx, cy, 4.2 * s, o, 255);
  pb_rectf(cx - 0.5 * s, cy - 5.4 * s, js_max(1, 1.6 * s), 2 * s, pb_rgb(90, 150, 50), 255);
  const double f = 0.8 + 0.2 * pb_sind(t * 11 + cx) * pb_sind(t * 7.3 + cx * 0.3), off = s > 1 ? s / 2 : 0;
  for (int j = 0; j < 13; j++) pb_rectf(cx + FACE[j][0] * s - off, cy + FACE[j][1] * s - off, js_ceil(s), js_ceil(s), g, al(f));
}

/* A Santa hat: red cone, white brim, a bobble. */
static void santaHat(double cx, double top, double s) {
  const double P[8] = { cx - 3 * s, top + 3 * s, cx + 3 * s, top + 3 * s, cx + 2 * s, top - 1 * s, cx + 5 * s, top + 1 * s };
  pb_poly(P, 4, pb_rgb(210, 40, 50), 255);
  pb_rectf(cx - 3 * s, top + 3 * s, 6 * s + 1, 1, pb_rgb(240, 240, 245), 255);
  pb_disc(cx + 5 * s, top + 1 * s, 0.9 * s, pb_rgb(240, 240, 245), 255);
}

/* A gift in diagonal stripes with a ribbon and a crooked bow on top. */
static void stripedGift(double x, double by, int w, int h, const char *part, const int *dflt, int ndflt, int bow) {
  const int nc = count(part, ndflt);
  for (int j = 0; j < h; j++)
    for (int i = 0; i < w; i++) pb_pxf(x + i, by - j, colour(part, ((i + j) >> 1) % nc, dflt, ndflt), 255);
  pb_rectf(x + (w >> 1), by - h + 1, 1, h, bow, 255);
  pb_rectf(x, by - (h >> 1), w, 1, bow, 255);
  pb_pxf(x + (w >> 1) - 2, by - h - 1, bow, 255);
  pb_pxf(x + (w >> 1) - 1, by - h, bow, 255);
  pb_pxf(x + (w >> 1) + 1, by - h - 2, bow, 255);
  pb_pxf(x + (w >> 1) + 2, by - h - 1, bow, 255);
}

/* Snow: near flakes bright and quick, far ones dim, and a drift along the ground. */
static void snowFlakes(double t, int W, int H, double k, double dens) {
  const int N = (int)js_floor(W * H / dens), nc = ncols("snow");
  const int near_c = nc ? PB_COLOR("snow", 0, 0) : pb_rgb(238, 244, 255);
  const int far_c = nc > 1 ? PB_COLOR("snow", 1, 0) : nc ? mixc(near_c, 0, 0.3) : pb_rgb(165, 180, 212);
  for (int i = 0; i < N; i++) {
    const double r1 = pb_hashd(i * 2.9 + 1), r2 = pb_hashd(i * 6.3 + 2), r3 = pb_hashd(i * 4.1 + 3);
    const int near = r3 > 0.72;
    const double sp = (4 + r2 * 6) * (near ? 1.6 : 1) * 1;
    const double y = js_mod(t * sp + r1 * 97, H + 4) - 2;
    const double xx = js_mod(js_mod(js_mod(r1 * 977, 1) * W + pb_sind(t * (0.6 + r3) + i) * (near ? 3 : 1.6) + t * 1.5 * (near ? 1.3 : 1), W) + W, W);
    const int c = near ? near_c : far_c;
    pb_pxf(xx, y, c, al(k * (near ? 1 : 0.65)));
    if (near) { pb_pxf(xx + 1, y, c, al(k * 0.35)); pb_pxf(xx, y + 1, c, al(k * 0.35)); }
  }
  const int ground = pb_rgb(205, 218, 242);
  for (int x = 0; x < W; x++) {
    const double g = 1.6 + 0.8 * pb_sind(x * 0.2) + 0.5 * pb_sind(x * 0.07 + 1);
    for (int j = 0; j < g; j++) pb_pxf(x, H - 1 - j, ground, al(k * (j + 1 > g ? g - j : 1) * 0.9));
  }
}

/* ---------- the scene ---------- */
void frame(float tf, int W, int H) {
  const double t = tf;
  const int sx = pb_hero_x();

  /* The sky: top and bottom colours, one colour for a flat sky. */
  if (PB_ON("sky")) {
    int c0 = PB_COLOR("sky", 0, -1), c1 = PB_COLOR("sky", 1, -1);
    if (c0 < 0) { c0 = pb_rgb(6, 26, 42); c1 = pb_rgb(70, 34, 92); } else if (c1 < 0) c1 = c0;
    pb_vgrad(0, 0, W, H, c0, c1, 255);
  }

  if (PB_ON("stars")) {
    static const int STAR[1] = { 0xC8E6F0 };
    const double n = num("stars", "amount"), v = num("stars", "speed");
    sparkles(v == 1 ? t : t * v, W, H, 0.6, (int)js_floor(js_floor(W * H / 200.0) * n), "stars", STAR, 1);
  }

  /* The moon sits behind the hill's curl, so the curl shows black against it. */
  const double mx = sx + 10;
  if (PB_ON("moon")) {
    static const int MOON[1] = { 0xECECD6 };
    const double mz = num("moon", "size");
    const int c = colour("moon", 0, MOON, 1), crater = mixc(c, pb_rgb(150, 150, 140), 0.3);
    static const double CRATERS[3][3] = { { -5, -3, 1.8 }, { 4, 4, 1.4 }, { -2, 6, 1.1 } };
    pb_disc(mx, 12, 16 * mz, c, al(0.09));
    pb_disc(mx, 12, 12 * mz, c, al(0.95));
    for (int i = 0; i < 3; i++) pb_disc(mx + CRATERS[i][0] * mz, 12 + CRATERS[i][1] * mz, CRATERS[i][2] * mz, crater, 255);
  }

  if (PB_ON("hill")) {
    static const int HILL[1] = { 0x030306 };
    spiralHill(sx + 4, H - 1, colour("hill", 0, HILL, 1), num("hill", "size") >= 1.5 ? 1.5 : 1);
  }

  if (PB_ON("bats")) {
    static const int BAT[1] = { 0x46285A };
    const double n = num("bats", "amount"), v = num("bats", "speed"), tb = t * v;
    const int nb = (int)js_floor(js_max(3, js_round(W / 60.0)) * n), nc = count("bats", 1);
    for (int i = 0; i < nb; i++) {
      const double sp = 9 + pb_hashd(i) * 9, x = js_mod(pb_hashd(i * 2.3) * W + tb * sp, W + 20) - 10;
      const double y = 4 + pb_hashd(i * 4.1) * 12 + pb_sind(tb * 2.1 + i) * 3;
      bat(x, y, tb, i, colour("bats", i % nc, BAT, 1));
    }
  }

  /* Gravestones spread along the ground, keeping clear of the hill. */
  if (PB_ON("graves")) {
    static const int GRAVE[1] = { 0x767A8A };
    const int n = (int)js_floor((W >= 256 ? 6 : 3) * num("graves", "amount")), nc = count("graves", 1);
    for (int i = 0; i < n; i++) {
      const double gx = js_round((i + 0.5) * W / n + (pb_hashd(i * 7.7) - 0.5) * 14);
      if (js_abs(gx - sx) > 26) gravestone(gx, H - 2, i, colour("graves", i % nc, GRAVE, 1));
    }
  }

  /* A bent iron fence along the ground. */
  if (PB_ON("fence")) {
    static const int FENCE[1] = { 0x16141E };
    const int c = colour("fence", 0, FENCE, 1);
    pb_rectf(0, H - 6, W, 1, c, al(0.9));
    for (int x = 1; x < W; x += 4) {
      const double lean = js_round(pb_sind(x * 0.7) * 1);
      pb_rectf(x + lean, H - 9, 1, 8, c, al(0.9));
      pb_pxf(x + lean, H - 10, c, al(0.9));
    }
  }

  /* Jack-o'-lanterns in Santa hats, away from the hill. */
  if (PB_ON("pumpkins")) {
    static const double WIDE[3] = { 0.16, 0.62, 0.9 }, NARROW[2] = { 0.15, 0.85 };
    const double s = num("pumpkins", "size");
    const int np = W >= 256 ? 3 : 2;
    for (int i = 0; i < np; i++) {
      const double px = js_round(W * (W >= 256 ? WIDE : NARROW)[i]);
      if (js_abs(px - sx) < 20) continue;
      jackO(px, H - 6, t, s);
      santaHat(px, H - 15 - js_round(3 * (s - 1)), s >= 1.5 ? 1.5 : 1);
    }
  }

  if (PB_ON("gifts")) {
    static const int GIFT[2] = { 0xEBEBF0, 0x101014 };
    static const double WIDE[2][3] = { { 0.3, 7, 6 }, { 0.75, 6, 5 } }, NARROW[1][3] = { { 0.32, 6, 5 } };
    const int ng = W >= 256 ? 2 : 1;
    for (int i = 0; i < ng; i++) {
      const double *g = W >= 256 ? WIDE[i] : NARROW[i], gx = js_round(W * g[0]);
      if (js_abs(gx - sx) > 20) stripedGift(gx, H - 2, (int)g[1], (int)g[2], "gifts", GIFT, 2, pb_rgb(200, 40, 60));
    }
  }

  if (PB_ON("snow")) {
    const double n = num("snow", "amount"), v = num("snow", "speed");
    if (n > 0) snowFlakes(v == 1 ? t : t * v, W, H, 0.85, 70 / n);
  }
}

const char *manifest(void) {
  return "{\"api\":2,\"kind\":\"theme\",\"title\":\"Spooky Christmas\",\"banner\":\"MERRY SPOOKY CHRISTMAS\",\"colors\":[\"#FF8C28\",\"#C8E6F0\"],"
    "\"parts\":{"
    "\"sky\":{\"colors\":2,\"description\":\"The sky behind everything, top colour then bottom: teal to purple. One colour for a flat sky; off for black.\"},"
    "\"stars\":{\"amount\":true,\"speed\":true,\"colors\":1,\"description\":\"Stars.\"},"
    "\"moon\":{\"size\":true,\"colors\":1,\"description\":\"The huge pale moon behind the hill's curl.\"},"
    "\"hill\":{\"size\":true,\"colors\":1,\"description\":\"The hill whose crest curls into a spiral, black against the moon.\"},"
    "\"bats\":{\"amount\":true,\"speed\":true,\"colors\":1,\"description\":\"Bats flitting across.\"},"
    "\"graves\":{\"amount\":true,\"colors\":1,\"description\":\"Crooked gravestones.\"},"
    "\"fence\":{\"colors\":1,\"description\":\"A bent iron fence along the ground.\"},"
    "\"pumpkins\":{\"size\":true,\"description\":\"Jack-o'-lanterns in Santa hats.\"},"
    "\"gifts\":{\"colors\":2,\"description\":\"Gifts wrapped in stripes (these colours in turn) with lopsided bows.\"},"
    "\"snow\":{\"amount\":true,\"speed\":true,\"colors\":2,\"description\":\"Snow falling.\"}"
    "}}";
}
