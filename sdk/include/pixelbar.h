/* SPDX-License-Identifier: MIT
   Copyright (C) 2026 FireBall1725 */
/* PixelBar animation API, version 1.
 *
 * An animation is one C file compiled to WebAssembly (sdk/build.sh). The display runs it full strip: the strip is
 * W x 32 LEDs (W is 128 to 640), every frame starts black, and frame() is called with the seconds since it started.
 * It gets the drawing functions below and nothing else: no files, no network, no clock but t.
 *
 * Write:
 *   void frame(float t, int w, int h);  required, draws one frame
 *   void init(int w, int h);            optional, runs once before the first frame
 *
 * Rules: no C library (the helpers here cover the usual needs), 64 KB of memory in all including an 8 KB stack,
 * and keep a frame cheap: aim for well under 2 ms on the display at the widest strip. Colours are 0xRRGGBB.
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
