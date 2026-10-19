"""Run from repo root: python3 -m unittest tests.test_verified_wheel -v"""
import ctypes, os, sys, unittest
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import verified_wheel as vw

TABLE = "/workspace/research/calc/gate_table.md"
LIBSWE = "/workspace/research/src/swe/libswe.so"


class Wheel(unittest.TestCase):
    def test_anchors(self):
        self.assertEqual(vw.address(302.0)["address"], "41.1.1.1.1")
        self.assertEqual(vw.deg_to_gate_verified(358.25), 25)
        self.assertEqual(vw.deg_to_gate_verified(3.8751), 17)
        self.assertEqual(vw.deg_to_gate_verified(10.0), 21)
        self.assertEqual(vw.deg_to_gate_verified(301.999), 60)

    @unittest.skipUnless(os.path.exists(TABLE), "verified table not on this computer")
    def test_all_64_starts(self):
        with open(TABLE) as fh:
            rows = [l for l in fh if l.startswith("| ") and "**" in l]
        self.assertEqual(len(rows), 64)
        for r in rows:
            c = [s.strip() for s in r.split("|")]
            g, start = int(c[2].strip("*")), float(c[3])
            self.assertAlmostEqual(vw.gate_start(g), start, places=9)
            self.assertEqual(vw.address(start + 1e-6)["gate"], g)
            self.assertEqual(vw.address(start + 1e-6)["line"], 1)


class Ayanamsa(unittest.TestCase):
    def test_fixtures(self):
        for jd, v in vw.FB_FIXTURES:
            self.assertAlmostEqual(vw.fagan_bradley_ayanamsa_verified(jd)["deg"], v, places=6)

    @unittest.skipUnless(os.path.exists(LIBSWE), "local Swiss Ephemeris build not present")
    def test_against_swiss_ephemeris_between_fixtures(self):
        L = ctypes.CDLL(LIBSWE)
        L.swe_set_sid_mode.argtypes = [ctypes.c_int, ctypes.c_double, ctypes.c_double]
        L.swe_get_ayanamsa_ut.restype = ctypes.c_double
        L.swe_get_ayanamsa_ut.argtypes = [ctypes.c_double]
        L.swe_set_sid_mode(0, 0, 0)  # SE_SIDM_FAGAN_BRADLEY
        worst = 0.0
        for jd in range(2433282, 2461042, 365):
            worst = max(worst, abs(L.swe_get_ayanamsa_ut(float(jd)) - vw.fagan_bradley_ayanamsa_verified(jd)["deg"]))
        print(f"\n  worst |fallback - swisseph| 1950-2026: {worst*3600:.3f} arcsec")
        self.assertLess(worst * 3600, 2.0)

    def test_sidereal(self):
        self.assertAlmostEqual(vw.sidereal_fb(24.7403, 2451545.0), 0.0, places=4)


class AuditExisting(unittest.TestCase):
    def test_audit_her_ephemeris(self):
        try:
            import ephemeris
        except Exception as e:
            self.skipTest(f"ephemeris.py needs 'ephem': {e}")
        a = vw.audit_ephemeris_module(ephemeris)
        print("\n  audit:", a)
        self.assertEqual(a["gates_differing_at_gate_midpoints"], 64)  # documents the flag
        self.assertAlmostEqual(a["ayanamsa_at_J2000_existing"], 24.042, places=6)


if __name__ == "__main__":
    unittest.main()
