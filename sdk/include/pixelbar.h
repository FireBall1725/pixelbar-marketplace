/* SPDX-License-Identifier: MIT
   Copyright (C) 2026 FireBall1725 */
/* PixelBar plugin API, version 2.
 *
 * A plugin is one C file compiled to WebAssembly (sdk/build.sh). It draws on the strip, W x 32 LEDs (W is 128 to 640),
 * and gets the drawing functions below and nothing else: no files, no network, no clock but t. Two kinds:
 *
 *   animation  takes the strip over while a notification plays it; every frame starts black
 *   theme      the scene behind the cards, like the built-in holiday themes; drawn every frame, looping forever
 *
 * Write:
 *   void frame(float t, int w, int h);        required: draws one frame, t in seconds since it started
 *   void init(int w, int h);                  optional: runs once before the first frame
 *   const char *manifest(void);               optional for an animation, required for a theme: JSON describing it
 *     {"api":2,"kind":"theme","title":"Spooky Christmas","colors":["#FF8C28","#C8E6F0"],
 *      "parts":{"moon":{"size":true,"colors":1,"description":"The moon behind the hill"}, ...}}
 *     Each part lists what it takes: "amount", "speed", "size" (true when it has them) and how many "colors".
 *     Home Assistant builds the part controls from this, and the Marketplace renders a preview per part.
 *
 * Rules: no C library (the helpers here cover the usual needs), 64 KB of memory in all including an 8 KB stack,
 * and keep a frame cheap. Colours are 0xRRGGBB; alpha is 0 to 255. Coordinates are LEDs; the float versions
 * floor to the LED like the display does, so sub-LED motion works the way it does in the built-in scenes.
 */
#pragma once
#include <stdint.h>

#ifdef __wasm__
#define PB_IMPORT(n) __attribute__((import_module("pb"), import_name(n)))
#define PB_EXPORT(n) __attribute__((export_name(n)))
#else
#define PB_IMPORT(n)
#define PB_EXPORT(n)
#endif

/* ---------- what you write ---------- */
PB_EXPORT("frame") void frame(float t, int w, int h);
PB_EXPORT("init") void init(int w, int h);
PB_EXPORT("manifest") const char *manifest(void);

/* ---------- what the display gives you ---------- */
/* One pixel, blended over what's there: alpha 255 covers it, 128 is half. Off the strip is ignored. */
PB_IMPORT("px") void pb_px(int x, int y, int rgb, int alpha);
/* A filled rectangle, blended the same way. */
PB_IMPORT("rect") void pb_rect(int x, int y, int w, int h, int rgb, int alpha);
/* Text in PixelBar's 5 x 7 font (accents, Cyrillic, Greek and symbols included), size 1 or 2, with a dark outline
   when outline is 1 so it reads over anything. Drawn as written. Gives back its width in LEDs. */
PB_IMPORT("text") int pb_text(const char *s, int len, int x, int y, int rgb, int size, int outline);
/* How wide that text would be, without drawing it. */
PB_IMPORT("text_width") int pb_text_width(const char *s, int len, int size);
/* The notification's words: key is "title", "message" or "detail". Copies up to cap bytes into buf and gives back
   the length, or -1 when the notification didn't send it. */
PB_IMPORT("param") int pb_param(const char *key, int key_len, char *buf, int cap);
/* The notification's colors[i] as 0xRRGGBB, or -1 past the end (or when it sent none). */
PB_IMPORT("color") int pb_color(int i);

/* ---------- version 2: drawing with LED positions as doubles, like the built-in scenes ---------- */
/* A pixel, and a pixel added (lights up on top of what's there, for sparkles and glows). */
PB_IMPORT("pxf") void pb_pxf(double x, double y, int rgb, int alpha);
PB_IMPORT("add") void pb_add(double x, double y, int rgb, int alpha);
PB_IMPORT("rectf") void pb_rectf(double x, double y, double w, double h, int rgb, int alpha);
/* A vertical gradient from rgb0 at the top to rgb1 at the bottom. */
PB_IMPORT("vgrad") void pb_vgrad(double x, double y, double w, double h, int rgb0, int rgb1, int alpha);
/* The outline of a rectangle, corners (x0, y0) and (x1, y1) inclusive. */
PB_IMPORT("frame_rect") void pb_frame(double x0, double y0, double x1, double y1, int rgb, int alpha);
PB_IMPORT("disc") void pb_disc(double cx, double cy, double r, int rgb, int alpha);
/* A ring of radius r and thickness w. */
PB_IMPORT("ring") void pb_ring(double cx, double cy, double r, double w, int rgb, int alpha);
/* A line, alpha0 at the start fading to alpha1 at the end. */
PB_IMPORT("line") void pb_line(double x0, double y0, double x1, double y1, int rgb, int alpha0, int alpha1);
/* A filled polygon: n points as x0, y0, x1, y1, ... */
PB_IMPORT("poly") void pb_poly(const double *xy, int n, int rgb, int alpha);
/* Drawing stays inside this box until pb_unclip (they nest). */
PB_IMPORT("clip") void pb_clip(double x, double y, double w, double h);
PB_IMPORT("unclip") void pb_unclip(void);
/* One of PixelBar's built-in icons (bell, tree, pumpkin, gift, snowflake ...) centred on cx, cy, 23 LEDs tall. */
PB_IMPORT("icon") void pb_icon(const char *name, int len, double cx, double cy, int rgb);

/* ---------- version 2: what a theme is told ---------- */
/* Whether a part is on, its amount/speed/size as a percentage (100 is as drawn), and its colours. name is the part's
   key from your manifest; key is "amount", "speed" or "size". Defaults come back when the user hasn't set one. */
PB_IMPORT("part_on") int pb_part_on(const char *name, int len);
PB_IMPORT("part_num") int pb_part_num(const char *name, int len, const char *key, int key_len, int dflt);
PB_IMPORT("part_color") int pb_part_color(const char *name, int len, int i, int dflt);
/* Where the theme's centrepiece goes: the host keeps it clear of a notification's words. */
PB_IMPORT("hero_x") int pb_hero_x(void);
/* The theme message's "night" number (Hanukkah sends 1 to 8), 0 when it sent none. */
PB_IMPORT("night") int pb_night(void);
/* The host's own double-precision maths: the same pseudo-random and trig the built-in scenes use, so a port lands every
   particle where the original does. The float helpers further down are cheaper when that doesn't matter. */
PB_IMPORT("hashd") double pb_hashd(double n);
PB_IMPORT("sind") double pb_sind(double a);
PB_IMPORT("cosd") double pb_cosd(double a);
PB_IMPORT("powd") double pb_powd(double a, double b);

#define PB_ON(part) pb_part_on((part), pb_strlen(part))
#define PB_NUM(part, key, dflt) pb_part_num((part), pb_strlen(part), (key), pb_strlen(key), (dflt))
#define PB_COLOR(part, i, dflt) pb_part_color((part), pb_strlen(part), (i), (dflt))
#define PB_ICON(name, cx, cy, rgb) pb_icon((name), pb_strlen(name), (cx), (cy), (rgb))

/* ---------- the three library functions the compiler may call on its own ---------- */
/* Clang turns some loops and copies into strlen, memcpy and memset calls; with no C library, these stand in. */
#ifdef __wasm__
__attribute__((weak)) unsigned long strlen(const char *s) { unsigned long n = 0; while (s[n]) n++; return n; }
__attribute__((weak)) void *memcpy(void *d, const void *s, unsigned long n) { char *a = d; const char *b = s; while (n--) *a++ = *b++; return d; }
__attribute__((weak)) void *memset(void *d, int c, unsigned long n) { char *a = d; while (n--) *a++ = (char)c; return d; }
#endif

/* ---------- helpers ---------- */
static inline int pb_strlen(const char *s) { int n = 0; while (s[n]) n++; return n; }
#define PB_TEXT(s, x, y, rgb, size, outline) pb_text((s), pb_strlen(s), (x), (y), (rgb), (size), (outline))
#define PB_PARAM(key, buf) pb_param((key), pb_strlen(key), (buf), (int)sizeof(buf))

static inline float pb_floor(float x) { int i = (int)x; return (float)(i - (x < (float)i)); }
static inline float pb_fract(float x) { return x - pb_floor(x); }
static inline float pb_clamp(float v, float lo, float hi) { return v < lo ? lo : v > hi ? hi : v; }
/* Sine and cosine in radians, good to about 0.001, with no library. */
static inline float pb_sin(float x) {
  const float TAU = 6.2831853f, PI = 3.1415927f;
  x -= TAU * pb_floor(x / TAU + 0.5f);
  if (x > PI / 2) x = PI - x; else if (x < -PI / 2) x = -PI - x;
  const float x2 = x * x;
  return x * (1 - x2 / 6 * (1 - x2 / 20 * (1 - x2 / 42)));
}
static inline float pb_cos(float x) { return pb_sin(x + 1.5707963f); }
/* The same number every time for the same n, from 0 up to 1: for placing things that shouldn't jump about. */
static inline float pb_hash(int n) { uint32_t x = (uint32_t)n * 0x9E3779B1u; x ^= x >> 15; x *= 0x85EBCA77u; x ^= x >> 13; return (float)(x & 0xFFFFFF) / 16777216.f; }
/* A small random generator you seed yourself. */
static inline float pb_rand(uint32_t *s) { *s ^= *s << 13; *s ^= *s >> 17; *s ^= *s << 5; return (float)(*s & 0xFFFFFF) / 16777216.f; }
static inline int pb_rgb(int r, int g, int b) { return ((r & 255) << 16) | ((g & 255) << 8) | (b & 255); }
/* Hue in degrees, saturation and value 0 to 1. */
static inline int pb_hsv(float h, float s, float v) {
  h = pb_fract(h / 360.f) * 6; const int i = (int)h; const float f = h - i, p = v * (1 - s), q = v * (1 - s * f), u = v * (1 - s * (1 - f));
  float r, g, b;
  switch (i) { case 0: r = v; g = u; b = p; break; case 1: r = q; g = v; b = p; break; case 2: r = p; g = v; b = u; break;
    case 3: r = p; g = q; b = v; break; case 4: r = u; g = p; b = v; break; default: r = v; g = p; b = q; }
  return pb_rgb((int)(r * 255), (int)(g * 255), (int)(b * 255));
}
/* Between colours a and b, k from 0 (all a) to 1 (all b). */
static inline int pb_mix(int a, int b, float k) {
  k = pb_clamp(k, 0, 1);
  const int r = (a >> 16) & 255, g = (a >> 8) & 255, bl = a & 255;
  return pb_rgb(r + (int)((((b >> 16) & 255) - r) * k), g + (int)((((b >> 8) & 255) - g) * k), bl + (int)(((b & 255) - bl) * k));
}
/* The bounce the built-in animations drop their titles in with: p from 0 to 1. */
static inline float pb_bounce(float p) {
  const float n = 7.5625f, d = 2.75f;
  if (p < 1 / d) return n * p * p;
  if (p < 2 / d) { p -= 1.5f / d; return n * p * p + 0.75f; }
  if (p < 2.5f / d) { p -= 2.25f / d; return n * p * p + 0.9375f; }
  p -= 2.625f / d; return n * p * p + 0.984375f;
}
