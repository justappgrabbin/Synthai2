/**
 * 7 CHART CALCULATORS FOR ERN CALIBRATION
 * 
 * Each chart type seeds a different consciousness layer:
 * 1. Natal Chart → BEING (physical/genetic foundation)
 * 2. Transit Chart → MOVEMENT (current temporal state)
 * 3. Progressed Chart → EVOLUTION (developmental arc)
 * 4. Solar Return → DESIGN (yearly intentions)
 * 5. Lunar Return → SPACE (monthly emotional cycles)
 * 6. Composite Chart → TRANSPERSONAL (relational field)
 * 7. Draconic Chart → VOID (soul purpose/karmic template)
 * 
 * These convert ephemeris data → Human Design gates → field activation seeds
 */

import { DateTime } from 'luxon';

// ============================================================================
// TYPES
// ============================================================================

export interface BirthData {
  datetime: Date;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface PlanetaryPosition {
  planet: string;
  longitude: number; // 0-360 degrees
  latitude: number;
  speed: number;
}

export interface GateActivation {
  gate: number; // 1-64
  line: number; // 1-6
  color: number; // 1-6
  tone: number; // 1-6
  base: number; // 1-5
}

export interface CenterActivation {
  center: string;
  phase: number; // 0-2π
  amplitude: number; // 0-1
  frequency: number; // multiplier
}

export interface ChartSeeds {
  layer: string;
  centers: Record<string, CenterActivation>;
  gates: GateActivation[];
  dominantElement: string;
  coherenceBias: number;
}

// ============================================================================
// PLANET TO GATE MAPPING (Human Design)
// ============================================================================

const PLANET_GATE_MAP = {
  // Personality (conscious) - calculated from birth time
  Sun: { design: true, personality: true },
  Earth: { design: true, personality: true },
  Moon: { design: true, personality: true },
  NorthNode: { design: true, personality: true },
  SouthNode: { design: true, personality: true },
  Mercury: { design: true, personality: true },
  Venus: { design: true, personality: true },
  Mars: { design: true, personality: true },
  Jupiter: { design: true, personality: true },
  Saturn: { design: true, personality: true },
  Uranus: { design: true, personality: true },
  Neptune: { design: true, personality: true },
  Pluto: { design: true, personality: true },
};

const GATE_TO_CENTER_MAP: Record<number, string> = {
  // Head Center
  64: 'Head', 61: 'Head', 63: 'Head',
  // Ajna Center
  47: 'Ajna', 24: 'Ajna', 4: 'Ajna', 17: 'Ajna', 43: 'Ajna', 11: 'Ajna',
  // Throat Center
  62: 'Throat', 23: 'Throat', 56: 'Throat', 35: 'Throat', 12: 'Throat',
  45: 'Throat', 33: 'Throat', 8: 'Throat', 31: 'Throat', 20: 'Throat', 16: 'Throat',
  // G Center
  7: 'G', 1: 'G', 13: 'G', 10: 'G', 15: 'G', 46: 'G', 25: 'G', 2: 'G',
  // Heart/Ego Center
  51: 'Heart/Ego', 21: 'Heart/Ego', 40: 'Heart/Ego', 26: 'Heart/Ego',
  // Solar Plexus Center
  6: 'Solar Plexus', 37: 'Solar Plexus', 22: 'Solar Plexus', 36: 'Solar Plexus',
  30: 'Solar Plexus', 55: 'Solar Plexus', 49: 'Solar Plexus',
  // Sacral Center
  5: 'Sacral', 14: 'Sacral', 29: 'Sacral', 59: 'Sacral', 9: 'Sacral',
  3: 'Sacral', 42: 'Sacral', 27: 'Sacral', 34: 'Sacral',
  // Spleen Center
  48: 'Spleen', 57: 'Spleen', 44: 'Spleen', 50: 'Spleen', 32: 'Spleen', 28: 'Spleen', 18: 'Spleen',
  // Root Center
  58: 'Root', 38: 'Root', 54: 'Root', 53: 'Root', 60: 'Root', 52: 'Root', 19: 'Root', 39: 'Root', 41: 'Root',
};

const CENTER_FREQUENCIES = {
  'Head': 1.33,
  'Ajna': 1.33,
  'Throat': 1.33,
  'G': 3.33,
  'Heart/Ego': 3.33,
  'Solar Plexus': 3.33,
  'Sacral': 1.0,
  'Spleen': 1.0,
  'Root': 1.0,
};

// ============================================================================
// BASE EPHEMERIS CALCULATOR (will use swisseph when available)
// ============================================================================

class EphemerisCalculator {
  /**
   * Calculate planetary positions at given time
   * NOTE: This is a STUB - will use actual swisseph library
   */
  static calculatePositions(datetime: Date, latitude: number, longitude: number): PlanetaryPosition[] {
    // TODO: Replace with actual swisseph calculations
    // For now, return placeholder positions
    const julianDay = this.dateToJulianDay(datetime);
    
    return [
      { planet: 'Sun', longitude: 0, latitude: 0, speed: 1.0 },
      { planet: 'Moon', longitude: 0, latitude: 0, speed: 13.0 },
      { planet: 'Mercury', longitude: 0, latitude: 0, speed: 1.0 },
      { planet: 'Venus', longitude: 0, latitude: 0, speed: 1.0 },
      { planet: 'Mars', longitude: 0, latitude: 0, speed: 0.5 },
      { planet: 'Jupiter', longitude: 0, latitude: 0, speed: 0.08 },
      { planet: 'Saturn', longitude: 0, latitude: 0, speed: 0.03 },
      { planet: 'Uranus', longitude: 0, latitude: 0, speed: 0.01 },
      { planet: 'Neptune', longitude: 0, latitude: 0, speed: 0.006 },
      { planet: 'Pluto', longitude: 0, latitude: 0, speed: 0.004 },
      { planet: 'NorthNode', longitude: 0, latitude: 0, speed: -0.05 },
      { planet: 'SouthNode', longitude: 180, latitude: 0, speed: -0.05 },
      { planet: 'Earth', longitude: 180, latitude: 0, speed: 1.0 },
    ];
  }

  static dateToJulianDay(date: Date): number {
    const time = date.getTime();
    return (time / 86400000) + 2440587.5;
  }

  static longitudeToGate(longitude: number): GateActivation {
    // Convert 360° zodiac to 64 gates (each gate = 5.625°)
    const gateNumber = Math.floor(longitude / 5.625) + 1;
    const gatePosition = (longitude % 5.625) / 5.625;
    
    // Line (1-6)
    const line = Math.floor(gatePosition * 6) + 1;
    const linePosition = (gatePosition * 6) % 1;
    
    // Color (1-6)
    const color = Math.floor(linePosition * 6) + 1;
    const colorPosition = (linePosition * 6) % 1;
    
    // Tone (1-6)
    const tone = Math.floor(colorPosition * 6) + 1;
    const tonePosition = (colorPosition * 6) % 1;
    
    // Base (1-5)
    const base = Math.floor(tonePosition * 5) + 1;
    
    return {
      gate: gateNumber,
      line,
      color,
      tone,
      base,
    };
  }
}

// ============================================================================
// 1. NATAL CHART CALCULATOR → BEING LAYER
// ============================================================================

export class NatalChartCalculator {
  /**
   * Calculate natal chart and convert to BEING layer seeds
   * This is the genetic/physical foundation
   */
  static calculate(birthData: BirthData): ChartSeeds {
    const positions = EphemerisCalculator.calculatePositions(
      birthData.datetime,
      birthData.latitude,
      birthData.longitude
    );

    const gates: GateActivation[] = [];
    const centerActivations: Record<string, CenterActivation> = {};

    // Initialize all centers
    Object.keys(CENTER_FREQUENCIES).forEach(center => {
      centerActivations[center] = {
        center,
        phase: 0,
        amplitude: 0.3, // default baseline
        frequency: CENTER_FREQUENCIES[center as keyof typeof CENTER_FREQUENCIES],
      };
    });

    // Process planetary positions
    positions.forEach(pos => {
      const gateActivation = EphemerisCalculator.longitudeToGate(pos.longitude);
      gates.push(gateActivation);

      // Activate corresponding center
      const center = GATE_TO_CENTER_MAP[gateActivation.gate];
      if (center && centerActivations[center]) {
        centerActivations[center].amplitude = Math.min(1.0, centerActivations[center].amplitude + 0.15);
        centerActivations[center].phase = (pos.longitude * Math.PI) / 180;
      }
    });

    return {
      layer: 'BEING',
      centers: centerActivations,
      gates,
      dominantElement: 'C', // Carbon (physical structure)
      coherenceBias: 0.5,
    };
  }
}

// ============================================================================
// 2. TRANSIT CHART CALCULATOR → MOVEMENT LAYER
// ============================================================================

export class TransitChartCalculator {
  /**
   * Calculate current transits → MOVEMENT layer
   * This is the current temporal state
   */
  static calculate(currentTime: Date, natalData: BirthData): ChartSeeds {
    const positions = EphemerisCalculator.calculatePositions(
      currentTime,
      natalData.latitude,
      natalData.longitude
    );

    const gates: GateActivation[] = [];
    const centerActivations: Record<string, CenterActivation> = {};

    Object.keys(CENTER_FREQUENCIES).forEach(center => {
      centerActivations[center] = {
        center,
        phase: 0,
        amplitude: 0.2,
        frequency: CENTER_FREQUENCIES[center as keyof typeof CENTER_FREQUENCIES],
      };
    });

    positions.forEach(pos => {
      const gateActivation = EphemerisCalculator.longitudeToGate(pos.longitude);
      gates.push(gateActivation);

      const center = GATE_TO_CENTER_MAP[gateActivation.gate];
      if (center && centerActivations[center]) {
        centerActivations[center].amplitude = Math.min(1.0, centerActivations[center].amplitude + 0.1);
        centerActivations[center].phase = (pos.longitude * Math.PI) / 180;
      }
    });

    return {
      layer: 'MOVEMENT',
      centers: centerActivations,
      gates,
      dominantElement: 'H', // Hydrogen (movement/energy)
      coherenceBias: 0.4,
    };
  }
}

// ============================================================================
// 3. PROGRESSED CHART CALCULATOR → EVOLUTION LAYER
// ============================================================================

export class ProgressedChartCalculator {
  /**
   * Calculate progressed chart (1 day = 1 year) → EVOLUTION layer
   * This is the developmental arc
   */
  static calculate(birthData: BirthData, currentAge: number): ChartSeeds {
    // Progress birth time by 1 day per year of life
    const progressedDate = new Date(birthData.datetime);
    progressedDate.setDate(progressedDate.getDate() + currentAge);

    const positions = EphemerisCalculator.calculatePositions(
      progressedDate,
      birthData.latitude,
      birthData.longitude
    );

    const gates: GateActivation[] = [];
    const centerActivations: Record<string, CenterActivation> = {};

    Object.keys(CENTER_FREQUENCIES).forEach(center => {
      centerActivations[center] = {
        center,
        phase: 0,
        amplitude: 0.25,
        frequency: CENTER_FREQUENCIES[center as keyof typeof CENTER_FREQUENCIES],
      };
    });

    positions.forEach(pos => {
      const gateActivation = EphemerisCalculator.longitudeToGate(pos.longitude);
      gates.push(gateActivation);

      const center = GATE_TO_CENTER_MAP[gateActivation.gate];
      if (center && centerActivations[center]) {
        centerActivations[center].amplitude = Math.min(1.0, centerActivations[center].amplitude + 0.12);
        centerActivations[center].phase = (pos.longitude * Math.PI) / 180;
      }
    });

    return {
      layer: 'EVOLUTION',
      centers: centerActivations,
      gates,
      dominantElement: 'N', // Nitrogen (transformation/breath)
      coherenceBias: 0.6,
    };
  }
}

// ============================================================================
// 4. SOLAR RETURN CALCULATOR → DESIGN LAYER
// ============================================================================

export class SolarReturnCalculator {
  /**
   * Calculate solar return (Sun returns to natal position) → DESIGN layer
   * This is yearly intentions/themes
   */
  static calculate(birthData: BirthData, year: number): ChartSeeds {
    // Calculate when Sun returns to natal position in given year
    // TODO: Use actual solar return calculation with swisseph
    const solarReturnDate = new Date(year, birthData.datetime.getMonth(), birthData.datetime.getDate());

    const positions = EphemerisCalculator.calculatePositions(
      solarReturnDate,
      birthData.latitude,
      birthData.longitude
    );

    const gates: GateActivation[] = [];
    const centerActivations: Record<string, CenterActivation> = {};

    Object.keys(CENTER_FREQUENCIES).forEach(center => {
      centerActivations[center] = {
        center,
        phase: 0,
        amplitude: 0.35,
        frequency: CENTER_FREQUENCIES[center as keyof typeof CENTER_FREQUENCIES],
      };
    });

    positions.forEach(pos => {
      const gateActivation = EphemerisCalculator.longitudeToGate(pos.longitude);
      gates.push(gateActivation);

      const center = GATE_TO_CENTER_MAP[gateActivation.gate];
      if (center && centerActivations[center]) {
        centerActivations[center].amplitude = Math.min(1.0, centerActivations[center].amplitude + 0.13);
        centerActivations[center].phase = (pos.longitude * Math.PI) / 180;
      }
    });

    return {
      layer: 'DESIGN',
      centers: centerActivations,
      gates,
      dominantElement: 'O', // Oxygen (breath/intention)
      coherenceBias: 0.7,
    };
  }
}

// ============================================================================
// 5. LUNAR RETURN CALCULATOR → SPACE LAYER
// ============================================================================

export class LunarReturnCalculator {
  /**
   * Calculate lunar return (Moon returns to natal position) → SPACE layer
   * This is monthly emotional cycles
   */
  static calculate(birthData: BirthData, date: Date): ChartSeeds {
    // Calculate when Moon returns to natal position
    // TODO: Use actual lunar return calculation with swisseph
    const lunarReturnDate = date;

    const positions = EphemerisCalculator.calculatePositions(
      lunarReturnDate,
      birthData.latitude,
      birthData.longitude
    );

    const gates: GateActivation[] = [];
    const centerActivations: Record<string, CenterActivation> = {};

    Object.keys(CENTER_FREQUENCIES).forEach(center => {
      centerActivations[center] = {
        center,
        phase: 0,
        amplitude: 0.3,
        frequency: CENTER_FREQUENCIES[center as keyof typeof CENTER_FREQUENCIES],
      };
    });

    positions.forEach(pos => {
      const gateActivation = EphemerisCalculator.longitudeToGate(pos.longitude);
      gates.push(gateActivation);

      const center = GATE_TO_CENTER_MAP[gateActivation.gate];
      if (center && centerActivations[center]) {
        centerActivations[center].amplitude = Math.min(1.0, centerActivations[center].amplitude + 0.14);
        centerActivations[center].phase = (pos.longitude * Math.PI) / 180;
      }
    });

    return {
      layer: 'SPACE',
      centers: centerActivations,
      gates,
      dominantElement: 'O', // Oxygen (emotional waves)
      coherenceBias: 0.55,
    };
  }
}

// ============================================================================
// 6. COMPOSITE CHART CALCULATOR → TRANSPERSONAL LAYER
// ============================================================================

export class CompositeChartCalculator {
  /**
   * Calculate composite chart (midpoint between two charts) → TRANSPERSONAL layer
   * This is relational field/connection
   */
  static calculate(person1: BirthData, person2: BirthData): ChartSeeds {
    const positions1 = EphemerisCalculator.calculatePositions(
      person1.datetime,
      person1.latitude,
      person1.longitude
    );

    const positions2 = EphemerisCalculator.calculatePositions(
      person2.datetime,
      person2.latitude,
      person2.longitude
    );

    // Calculate midpoints
    const compositePositions: PlanetaryPosition[] = [];
    for (let i = 0; i < positions1.length; i++) {
      const midLongitude = (positions1[i].longitude + positions2[i].longitude) / 2;
      compositePositions.push({
        planet: positions1[i].planet,
        longitude: midLongitude,
        latitude: 0,
        speed: (positions1[i].speed + positions2[i].speed) / 2,
      });
    }

    const gates: GateActivation[] = [];
    const centerActivations: Record<string, CenterActivation> = {};

    Object.keys(CENTER_FREQUENCIES).forEach(center => {
      centerActivations[center] = {
        center,
        phase: 0,
        amplitude: 0.4,
        frequency: CENTER_FREQUENCIES[center as keyof typeof CENTER_FREQUENCIES],
      };
    });

    compositePositions.forEach(pos => {
      const gateActivation = EphemerisCalculator.longitudeToGate(pos.longitude);
      gates.push(gateActivation);

      const center = GATE_TO_CENTER_MAP[gateActivation.gate];
      if (center && centerActivations[center]) {
        centerActivations[center].amplitude = Math.min(1.0, centerActivations[center].amplitude + 0.15);
        centerActivations[center].phase = (pos.longitude * Math.PI) / 180;
      }
    });

    return {
      layer: 'TRANSPERSONAL',
      centers: centerActivations,
      gates,
      dominantElement: 'S', // Sulfur (connection/bridge)
      coherenceBias: 0.8,
    };
  }
}

// ============================================================================
// 7. DRACONIC CHART CALCULATOR → VOID LAYER
// ============================================================================

export class DraconicChartCalculator {
  /**
   * Calculate draconic chart (North Node at 0° Aries) → VOID layer
   * This is soul purpose/karmic template
   */
  static calculate(birthData: BirthData): ChartSeeds {
    const positions = EphemerisCalculator.calculatePositions(
      birthData.datetime,
      birthData.latitude,
      birthData.longitude
    );

    // Find North Node position
    const northNode = positions.find(p => p.planet === 'NorthNode');
    const nodeOffset = northNode ? northNode.longitude : 0;

    // Rotate all positions so North Node is at 0°
    const draconicPositions = positions.map(pos => ({
      ...pos,
      longitude: (pos.longitude - nodeOffset + 360) % 360,
    }));

    const gates: GateActivation[] = [];
    const centerActivations: Record<string, CenterActivation> = {};

    Object.keys(CENTER_FREQUENCIES).forEach(center => {
      centerActivations[center] = {
        center,
        phase: 0,
        amplitude: 0.2,
        frequency: CENTER_FREQUENCIES[center as keyof typeof CENTER_FREQUENCIES],
      };
    });

    draconicPositions.forEach(pos => {
      const gateActivation = EphemerisCalculator.longitudeToGate(pos.longitude);
      gates.push(gateActivation);

      const center = GATE_TO_CENTER_MAP[gateActivation.gate];
      if (center && centerActivations[center]) {
        centerActivations[center].amplitude = Math.min(1.0, centerActivations[center].amplitude + 0.1);
        centerActivations[center].phase = (pos.longitude * Math.PI) / 180;
      }
    });

    return {
      layer: 'VOID',
      centers: centerActivations,
      gates,
      dominantElement: 'H', // Hydrogen (primordial essence)
      coherenceBias: 0.3,
    };
  }
}

// ============================================================================
// MASTER CALIBRATOR
// ============================================================================

export class ConsciousnessCalibrator {
  /**
   * Calculate all 7 charts and merge into complete field seeding matrix
   */
  static calibrateAll(birthData: BirthData, currentTime?: Date): Record<string, ChartSeeds> {
    const now = currentTime || new Date();
    const age = this.calculateAge(birthData.datetime, now);
    const currentYear = now.getFullYear();

    return {
      BEING: NatalChartCalculator.calculate(birthData),
      MOVEMENT: TransitChartCalculator.calculate(now, birthData),
      EVOLUTION: ProgressedChartCalculator.calculate(birthData, age),
      DESIGN: SolarReturnCalculator.calculate(birthData, currentYear),
      SPACE: LunarReturnCalculator.calculate(birthData, now),
      TRANSPERSONAL: CompositeChartCalculator.calculate(birthData, birthData), // self-composite for now
      VOID: DraconicChartCalculator.calculate(birthData),
    };
  }

  static calculateAge(birthDate: Date, currentDate: Date): number {
    const diff = currentDate.getTime() - birthDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }

  /**
   * Merge all layer seeds into unified oscillator initialization
   */
  static mergeSeeds(allSeeds: Record<string, ChartSeeds>): Record<string, CenterActivation> {
    const merged: Record<string, CenterActivation> = {};

    // Initialize
    Object.keys(CENTER_FREQUENCIES).forEach(center => {
      merged[center] = {
        center,
        phase: 0,
        amplitude: 0,
        frequency: CENTER_FREQUENCIES[center as keyof typeof CENTER_FREQUENCIES],
      };
    });

    // Weight different layers
    const weights = {
      BEING: 0.3,       // 30% from natal
      MOVEMENT: 0.2,    // 20% from transits
      EVOLUTION: 0.15,  // 15% from progressed
      DESIGN: 0.15,     // 15% from solar return
      SPACE: 0.1,       // 10% from lunar return
      TRANSPERSONAL: 0.05, // 5% from composite
      VOID: 0.05,       // 5% from draconic
    };

    // Merge weighted contributions
    Object.entries(allSeeds).forEach(([layer, seeds]) => {
      const weight = weights[layer as keyof typeof weights];
      Object.entries(seeds.centers).forEach(([centerName, activation]) => {
        if (merged[centerName]) {
          merged[centerName].amplitude += activation.amplitude * weight;
          merged[centerName].phase += activation.phase * weight;
        }
      });
    });

    // Normalize amplitudes to [0, 1]
    Object.values(merged).forEach(center => {
      center.amplitude = Math.min(1.0, center.amplitude);
      center.phase = center.phase % (2 * Math.PI);
    });

    return merged;
  }
}
