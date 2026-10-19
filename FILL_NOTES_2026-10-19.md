# Fill notes, 2026-10-19 (branch fill/synthai2-20261019, local only, not pushed)

Additions only: shared/verified-wheel.ts, tests/verified-wheel.test.ts,
synthia-server/verified_wheel.py, synthia-server/tests/test_verified_wheel.py.
Nothing existing was edited or rewired.

Flags for Alexis (your call):
- Server gate math disagrees with your own client. client/src/lib/humanDesignEngine.ts uses the verified wheel (358.25, gate 25 first). shared/transit-system.ts longitudeToGate (used by EphemerisService.ts) and server/services/chart-calculators.ts longitudeToGate number gates 1..64 in order from 0 deg; they differ at 64/64 gate midpoints.
- synthia-server/ephemeris.py starts gate 41 at 0 deg Aries (verified: 302 deg) and uses 24.042 for Fagan-Bradley at J2000 (verified 24.7403).
- shared/transit-system.ts PROJECTION_OFFSETS.Sidereal = -23.4 (fixed); Fagan-Bradley changes about 50.3" a year and is 25.10 deg in 2026.

filled in, no source: the quadratic Fagan-Bradley fallback (interpolation of Swiss Ephemeris values).
investigating: tropical vs Fagan-Bradley for reading gates.

Run: `npx -y tsx --test tests/verified-wheel.test.ts`; `cd synthia-server && python3 -m unittest tests.test_verified_wheel`.
