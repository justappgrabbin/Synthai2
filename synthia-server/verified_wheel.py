"""
verified_wheel.py  (added 2026-10-19, branch fill/synthai2-20261019; same file as Synthia-server fill)

Verified gate wheel and Fagan-Bradley ayanamsa, added NEXT TO ephemeris.py.
ephemeris.py is not edited and server.py is not rewired. Whether to switch
ephemeris.py over is Alexis's decision.

Why this exists (flags, see FILL_NOTES_2026-10-19.md):
  1. ephemeris.py line 26-27 says "Each gate = 5.625 deg, starting from 0 deg
     Aries" and deg_to_gate() puts GATE_SEQUENCE[0] = 41 at 0 deg. The
     verified wheel has gate 41 starting at 302.0 deg (2 deg Aquarius).
     SOURCE: research/hd-math-verification.md s.1 (three published tables and
     human-design-py HD_START_DEGREE = 358.25 for gate 25; 0 mismatches).
     Her GATE_SEQUENCE ORDER is correct; only the starting point differs.
  2. ephemeris.py fagan_bradley_ayanamsa() uses 24.042 deg at J2000. 24.042
     is the Fagan-Bradley value for 1 Jan 1950 (24 deg 02'30.96"). At J2000 it
     is 24.740300 deg (mean). SOURCE: hd-math-verification.md s.5 (Swiss
     Ephemeris, SE_SIDM_FAGAN_BRADLEY; definition "24 deg 02'31.36" for
     1 Jan 1950", astro.com/swisseph/swisseph.htm s.2.8).
Her requirement is Fagan-Bradley; that is kept. Her "Body = Tropical,
Mind = Sidereal" rule in ephemeris.py is kept and not touched.
HD/Rave material is lore, not physics.
"""
from __future__ import annotations

GATE_SEQUENCE_FROM_41 = [
    41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3,
    27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
    31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50,
    28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60,
]  # same order as her ephemeris.py GATE_SEQUENCE

GATE_41_START = 302.0          # hd-math-verification.md s.1
GATE_ARC = 360.0 / 64          # 5.625
LINE_ARC = GATE_ARC / 6        # 0.9375
COLOR_ARC = LINE_ARC / 6       # 0.15625
TONE_ARC = COLOR_ARC / 6       # 93.75 arcsec
BASE_ARC = TONE_ARC / 5        # 18.75 arcsec
_EPS = 1e-12


def _norm(d: float) -> float:
    return d % 360.0


def address(d: float) -> dict:
    """Longitude (deg) -> gate.line.color.tone.base on the verified wheel."""
    x = _norm(_norm(d) - GATE_41_START)
    k = min(int(x / GATE_ARC + _EPS), 63)
    r = x - k * GATE_ARC
    line = min(int(r / LINE_ARC + _EPS) + 1, 6); r -= (line - 1) * LINE_ARC
    color = min(int(r / COLOR_ARC + _EPS) + 1, 6); r -= (color - 1) * COLOR_ARC
    tone = min(int(r / TONE_ARC + _EPS) + 1, 6); r -= (tone - 1) * TONE_ARC
    base = min(int(r / BASE_ARC + _EPS) + 1, 5)
    gate = GATE_SEQUENCE_FROM_41[k]
    return {"gate": gate, "line": line, "color": color, "tone": tone, "base": base,
            "address": f"{gate}.{line}.{color}.{tone}.{base}"}


def deg_to_gate_verified(d: float) -> int:
    return address(d)["gate"]


def deg_to_line_verified(d: float) -> int:
    return address(d)["line"]


def gate_start(gate: int) -> float:
    return (GATE_41_START + GATE_SEQUENCE_FROM_41.index(gate) * GATE_ARC) % 360.0


# ── Fagan-Bradley ayanamsa ────────────────────────────────────────────────
# Fixture values: Swiss Ephemeris, mean (no nutation), hd-math-verification.md s.5
FB_FIXTURES = [
    (2433282.5, 24 + 2 / 60 + 30.96 / 3600),   # 1 Jan 1950 0h UT
    (2451545.0, 24.740300),                     # J2000.0
    (2461041.5, 25.103512),                     # 1 Jan 2026 0h UT
]


def fagan_bradley_ayanamsa_verified(jd: float) -> dict:
    """Fagan-Bradley ayanamsa (deg, mean, no nutation).

    Uses pyswisseph (already in requirements.txt) when it imports:
    swe.set_sid_mode(SIDM_FAGAN_BRADLEY); swe.get_ayanamsa_ut(jd).
    Otherwise: the quadratic through the three Swiss Ephemeris fixtures above.
    filled in, no source: the quadratic fallback itself is my interpolation,
    not a published formula. It reproduces the three fixtures exactly; check
    against Swiss Ephemeris before relying on it far outside 1950-2026.
    """
    try:
        import swisseph as swe  # type: ignore
        swe.set_sid_mode(swe.SIDM_FAGAN_BRADLEY)
        return {"deg": float(swe.get_ayanamsa_ut(jd)), "method": "swisseph"}
    except Exception:
        pass
    (x0, y0), (x1, y1), (x2, y2) = FB_FIXTURES
    l0 = (jd - x1) * (jd - x2) / ((x0 - x1) * (x0 - x2))
    l1 = (jd - x0) * (jd - x2) / ((x1 - x0) * (x1 - x2))
    l2 = (jd - x0) * (jd - x1) / ((x2 - x0) * (x2 - x1))
    return {"deg": y0 * l0 + y1 * l1 + y2 * l2, "method": "quadratic-through-swisseph-fixtures"}


def sidereal_fb(tropical_deg: float, jd: float) -> float:
    """Tropical -> Fagan-Bradley sidereal longitude (her requirement)."""
    return _norm(tropical_deg - fagan_bradley_ayanamsa_verified(jd)["deg"])


def audit_ephemeris_module(ephemeris_module) -> dict:
    """Compare her ephemeris.py functions with the verified ones. Read-only."""
    mism = [g for g in range(1, 65)
            if ephemeris_module.deg_to_gate(gate_start(g) + GATE_ARC / 2) != g]
    jd = 2451545.0
    return {
        "gates_differing_at_gate_midpoints": len(mism),
        "ayanamsa_at_J2000_existing": ephemeris_module.fagan_bradley_ayanamsa(jd),
        "ayanamsa_at_J2000_verified": fagan_bradley_ayanamsa_verified(jd)["deg"],
    }
