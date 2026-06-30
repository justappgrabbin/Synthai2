import { useState, useEffect, useRef } from 'react';

type SystemType = 'tropical' | 'sidereal' | 'fagan' | 'draconic-mean' | 'draconic-true';
type ZoneId = 'crown' | 'third-eye' | 'throat' | 'heart' | 'solar-plexus' | 'sacral' | 'root';
type AwarenessType = 'mind' | 'heart' | 'body';

interface Zone {
  id: ZoneId;
  name: string;
  awareness: AwarenessType;
  x: number; // percentage position
  y: number;
  size: number;
}

interface ZoneData {
  status: string;
  openness: number;
  frequency: number;
  gate: string;
  channel: string;
  note: string;
}

interface SystemData {
  name: string;
  color: string;
  zones: Record<ZoneId, ZoneData>;
}

const ZONES: Zone[] = [
  { id: 'crown', name: 'CROWN / MIND', awareness: 'mind', x: 50, y: 8, size: 24 },
  { id: 'third-eye', name: 'THIRD EYE', awareness: 'mind', x: 50, y: 18, size: 18 },
  { id: 'throat', name: 'THROAT', awareness: 'body', x: 50, y: 28, size: 18 },
  { id: 'heart', name: 'HEART CENTER', awareness: 'heart', x: 50, y: 38, size: 22 },
  { id: 'solar-plexus', name: 'SOLAR PLEXUS', awareness: 'body', x: 50, y: 50, size: 20 },
  { id: 'sacral', name: 'SACRAL', awareness: 'body', x: 50, y: 62, size: 18 },
  { id: 'root', name: 'ROOT / BASE', awareness: 'body', x: 50, y: 85, size: 20 },
];

const SYSTEMS: Record<SystemType, SystemData> = {
  tropical: {
    name: 'TROPICAL',
    color: '#10d474',
    zones: {
      'crown': { status: 'OPEN', openness: 78, frequency: 528, gate: '64', channel: 'HEAD→AJNA', note: 'Mental pressure to make sense of the past. Inspiration flows when you stop trying to resolve everything.' },
      'third-eye': { status: 'DEFINED', openness: 92, frequency: 852, gate: '61', channel: 'INNER TRUTH', note: 'Mystical awareness active. Trust the knowings that arrive without logic.' },
      'throat': { status: 'OPEN', openness: 45, frequency: 741, gate: '56', channel: 'STIMULATION', note: 'Expression is your playground. You speak what others are thinking.' },
      'heart': { status: 'DEFINED', openness: 88, frequency: 639, gate: '21', channel: 'WILLPOWER', note: 'Ego strength present. You have consistent access to willpower and self-worth.' },
      'solar-plexus': { status: 'OPEN', openness: 34, frequency: 417, gate: '36', channel: 'CRISIS', note: 'Emotional wave absorption. You feel the room. Wait for clarity before deciding.' },
      'sacral': { status: 'DEFINED', openness: 95, frequency: 396, gate: '34', channel: 'POWER', note: 'Life force generator. Respond with your gut hum. If it is not a yes, it is a no.' },
      'root': { status: 'OPEN', openness: 22, frequency: 194, gate: '53', channel: 'BEGINNINGS', note: 'Adrenaline pressure from environment. You are not meant to rush. Breathe.' },
    },
  },
  sidereal: {
    name: 'SIDEREAL',
    color: '#bd00ff',
    zones: {
      'crown': { status: 'DEFINED', openness: 85, frequency: 963, gate: '63', channel: 'DOUBT→TRUTH', note: 'Actual constellation alignment reveals your true doubt-processing center is active.' },
      'third-eye': { status: 'OPEN', openness: 40, frequency: 720, gate: '24', channel: 'RATIONALIZATION', note: 'Vedic perspective: mental processing is receptive, not fixed. Adapt your thinking.' },
      'throat': { status: 'DEFINED', openness: 76, frequency: 660, gate: '20', channel: 'NOW', note: 'The vernal equinox shift places expression in the now-channel. Speak only what is present.' },
      'heart': { status: 'OPEN', openness: 28, frequency: 594, gate: '26', channel: 'TRANSITOR', note: 'Heart center absorbs ego energy from others. You are a mirror for collective will.' },
      'solar-plexus': { status: 'DEFINED', openness: 81, frequency: 528, gate: '49', channel: 'PRINCIPLE', note: 'Emotional clarity cycles every 28 days. Track your lunar emotional wave.' },
      'sacral': { status: 'OPEN', openness: 15, frequency: 480, gate: '9', channel: 'FOCUS', note: 'Sacral energy responds to focused attention. Do one thing completely.' },
      'root': { status: 'DEFINED', openness: 90, frequency: 360, gate: '38', channel: 'FIGHTER', note: 'Root pressure drives purpose-finding. Your struggle is your compass.' },
    },
  },
  fagan: {
    name: 'FAGAN',
    color: '#e8921a',
    zones: {
      'crown': { status: 'OPEN', openness: 12, frequency: 888, gate: '4', channel: 'FORMULA', note: 'Fagan-Bradley alignment: mental answers are not your own. Question received wisdom.' },
      'third-eye': { status: 'DEFINED', openness: 73, frequency: 777, gate: '47', channel: 'REALIZATION', note: 'The oppressive realization is temporary. Abstraction resolves into epiphany.' },
      'throat': { status: 'OPEN', openness: 56, frequency: 666, gate: '23', channel: 'ASSIMILATION', note: 'Fagan throat absorbs communication styles. Your voice shifts to match the listener.' },
      'heart': { status: 'DEFINED', openness: 67, frequency: 555, gate: '51', channel: 'SHOCK', note: 'The shock of initiation awakens your heart. You thrive on leaps of faith.' },
      'solar-plexus': { status: 'OPEN', openness: 19, frequency: 444, gate: '30', channel: 'FIRE', note: 'Emotional intensity is a visitor, not a resident. Let the fire pass through.' },
      'sacral': { status: 'DEFINED', openness: 82, frequency: 333, gate: '5', channel: 'PATTERN', note: 'Fixed rhythmic energy. Your body knows its cycle. Honor the pattern.' },
      'root': { status: 'OPEN', openness: 31, frequency: 222, gate: '19', channel: 'WANTING', note: 'Root pressure to meet needs. You are driven by the pulse of collective desire.' },
    },
  },
  'draconic-mean': {
    name: 'DRACONIC MEAN',
    color: '#ff6b00',
    zones: {
      'crown': { status: 'DEFINED', openness: 96, frequency: 111, gate: '1', channel: 'CREATION', note: 'Soul-level self-expression. The draconic mean reveals your original imprint: you came here to create.' },
      'third-eye': { status: 'DEFINED', openness: 88, frequency: 222, gate: '2', channel: 'DIRECTION', note: 'Higher knowing about direction. Your soul knows the way even when the mind is lost.' },
      'throat': { status: 'OPEN', openness: 7, frequency: 333, gate: '8', channel: 'CONTRIBUTION', note: 'Soul voice is receptive. You contribute most when you are being shaped by others.' },
      'heart': { status: 'DEFINED', openness: 94, frequency: 444, gate: '10', channel: 'BEHAVIOR', note: 'Karmic heart: love is your behavior, not your feeling. You are here to love through action.' },
      'solar-plexus': { status: 'DEFINED', openness: 77, frequency: 555, gate: '3', channel: 'MUTATION', note: 'Soul emotions drive mutation. Your feelings are meant to innovate, not conform.' },
      'sacral': { status: 'OPEN', openness: 4, frequency: 666, gate: '14', channel: 'POSSESSION', note: 'Sacral power is borrowed in this life. Work with resources that flow through you.' },
      'root': { status: 'DEFINED', openness: 91, frequency: 777, gate: '42', channel: 'GROWTH', note: 'Root pressure is your soul engine. You are driven to grow and expand continuously.' },
    },
  },
  'draconic-true': {
    name: 'DRACONIC TRUE',
    color: '#ff1744',
    zones: {
      'crown': { status: 'OPEN', openness: 9, frequency: 999, gate: '28', channel: 'STRUGGLE', note: 'True node alignment: the soul fights for meaning. Your deepest purpose emerges from resistance.' },
      'third-eye': { status: 'OPEN', openness: 23, frequency: 888, gate: '55', channel: 'SPIRIT', note: 'Mental awareness of spirit abundance. You see the unseen wealth in every moment.' },
      'throat': { status: 'DEFINED', openness: 86, frequency: 777, gate: '12', channel: 'STANDSTILL', note: 'The true node places your soul voice in contemplation. Silence is your power.' },
      'heart': { status: 'OPEN', openness: 17, frequency: 666, gate: '25', channel: 'INNOCENCE', note: 'Heart is a mirror for universal love. You teach others how to love without condition.' },
      'solar-plexus': { status: 'DEFINED', openness: 69, frequency: 555, gate: '36', channel: 'CRISIS', note: 'Soul-level emotional crisis is your teacher. Every intensity holds a key.' },
      'sacral': { status: 'DEFINED', openness: 83, frequency: 444, gate: '18', channel: 'CORRECTION', note: 'True sacral power is in the correction of patterns. You fix what is broken.' },
      'root': { status: 'OPEN', openness: 14, frequency: 333, gate: '54', channel: 'AMBITION', note: 'Root ambition is collective, not personal. You rise when others rise with you.' },
    },
  },
};

const AWARENESS_COLORS: Record<AwarenessType, string> = {
  mind: '#c084fc',
  heart: '#ff5959',
  body: '#10d474',
};

export default function BodyGraphWidget() {
  const [system, setSystem] = useState<SystemType>('tropical');
  const [selectedZone, setSelectedZone] = useState<ZoneId | null>(null);
  const [hoveredZone, setHoveredZone] = useState<ZoneId | null>(null);
  const [pulsePhase, setPulsePhase] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Animate the pulse rings
  useEffect(() => {
    let frame: number;
    const animate = () => {
      setPulsePhase((prev) => (prev + 0.02) % (Math.PI * 2));
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const currentSystem = SYSTEMS[system];
  const currentZone = selectedZone ? ZONES.find((z) => z.id === selectedZone) : null;
  const currentData = selectedZone ? currentSystem.zones[selectedZone] : null;

  const getZoneColor = (zone: Zone) => {
    if (selectedZone === zone.id) return currentSystem.color;
    if (hoveredZone === zone.id) return AWARENESS_COLORS[zone.awareness];
    return 'rgba(255,255,255,0.15)';
  };

  const getZoneGlow = (zone: Zone) => {
    if (selectedZone === zone.id) {
      return `0 0 20px ${currentSystem.color}80, 0 0 40px ${currentSystem.color}40`;
    }
    if (hoveredZone === zone.id) {
      return `0 0 15px ${AWARENESS_COLORS[zone.awareness]}60`;
    }
    return 'none';
  };

  // Calculate awareness totals
  const awarenessTotals = {
    mind: Object.values(currentSystem.zones)
      .filter((_, i) => ZONES[i]?.awareness === 'mind')
      .reduce((sum, z) => sum + z.openness, 0) / 2,
    heart: Object.values(currentSystem.zones)
      .filter((_, i) => ZONES[i]?.awareness === 'heart')
      .reduce((sum, z) => sum + z.openness, 0),
    body: Object.values(currentSystem.zones)
      .filter((_, i) => ZONES[i]?.awareness === 'body')
      .reduce((sum, z) => sum + z.openness, 0) / 4,
  };

  return (
    <div className="h-full flex flex-col gap-3" ref={containerRef}>
      {/* System Toggle */}
      <div className="flex gap-1.5 flex-wrap">
        {(Object.keys(SYSTEMS) as SystemType[]).map((sys) => (
          <button
            key={sys}
            onClick={() => {
              setSystem(sys);
              setSelectedZone(null);
            }}
            className={`px-3 py-1.5 rounded-full text-[9px] font-mono-data tracking-wider uppercase transition-all duration-300 ${
              system === sys
                ? 'text-black font-semibold shadow-lg'
                : 'bg-white/[0.03] text-[var(--text-secondary)] border border-white/5 hover:border-white/15'
            }`}
            style={
              system === sys
                ? { backgroundColor: SYSTEMS[sys].color, boxShadow: `0 0 15px ${SYSTEMS[sys].color}40` }
                : undefined
            }
          >
            {SYSTEMS[sys].name}
          </button>
        ))}
      </div>

      {/* Body visualization + Stats */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Body Image with interactive overlay */}
        <div className="relative flex-1 min-h-0 flex items-center justify-center">
          <div className="relative h-full max-h-[380px] aspect-[2/3]">
            {/* Body image */}
            <img
              src="/body-hologram.jpg"
              alt="Astral Body"
              className="h-full w-auto object-contain opacity-80"
              draggable={false}
            />

            {/* Interactive SVG overlay */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              style={{ pointerEvents: 'all' }}
            >
              {/* Connection lines between zones */}
              {ZONES.map((zone, i) =>
                ZONES.slice(i + 1).map((other) => {
                  const data1 = currentSystem.zones[zone.id];
                  const data2 = currentSystem.zones[other.id];
                  const avgOpenness = (data1.openness + data2.openness) / 2;
                  const alpha = (avgOpenness / 100) * 0.3;
                  return (
                    <line
                      key={`${zone.id}-${other.id}`}
                      x1={zone.x}
                      y1={zone.y}
                      x2={other.x}
                      y2={other.y}
                      stroke={currentSystem.color}
                      strokeWidth={0.3}
                      opacity={alpha}
                    />
                  );
                })
              )}

              {/* Pulse rings on zones */}
              {ZONES.map((zone) => {
                const pulseSize = 1 + Math.sin(pulsePhase + zone.y * 0.1) * 0.3;
                const isActive = selectedZone === zone.id || hoveredZone === zone.id;
                return (
                  <g key={`pulse-${zone.id}`}>
                    <circle
                      cx={zone.x}
                      cy={zone.y}
                      r={(zone.size / 2) * pulseSize}
                      fill="none"
                      stroke={getZoneColor(zone)}
                      strokeWidth={isActive ? 1 : 0.3}
                      opacity={isActive ? 0.6 : 0.2}
                      style={{
                        filter: isActive ? `drop-shadow(0 0 4px ${getZoneColor(zone)})` : 'none',
                      }}
                    />
                  </g>
                );
              })}

              {/* Zone hotspots */}
              {ZONES.map((zone) => (
                <g
                  key={zone.id}
                  onMouseEnter={() => setHoveredZone(zone.id)}
                  onMouseLeave={() => setHoveredZone(null)}
                  onClick={() => setSelectedZone(zone.id === selectedZone ? null : zone.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    cx={zone.x}
                    cy={zone.y}
                    r={zone.size / 2}
                    fill={
                      selectedZone === zone.id
                        ? `${currentSystem.color}30`
                        : hoveredZone === zone.id
                        ? `${AWARENESS_COLORS[zone.awareness]}20`
                        : 'transparent'
                    }
                    stroke={getZoneColor(zone)}
                    strokeWidth={selectedZone === zone.id ? 1.5 : 0.5}
                    style={{
                      transition: 'all 0.3s ease',
                      filter: getZoneGlow(zone),
                    }}
                  />
                  {/* Label dot */}
                  <circle
                    cx={zone.x}
                    cy={zone.y}
                    r={3}
                    fill={
                      selectedZone === zone.id
                        ? currentSystem.color
                        : AWARENESS_COLORS[zone.awareness]
                    }
                    opacity={hoveredZone === zone.id || selectedZone === zone.id ? 1 : 0.5}
                    style={{ transition: 'all 0.3s ease' }}
                  />
                </g>
              ))}

              {/* Awareness zone labels (floating next to body) */}
              <text x={82} y={15} fill={AWARENESS_COLORS.mind} fontSize="4" fontFamily="JetBrains Mono" opacity="0.6">MIND</text>
              <text x={82} y={40} fill={AWARENESS_COLORS.heart} fontSize="4" fontFamily="JetBrains Mono" opacity="0.6">HEART</text>
              <text x={82} y={65} fill={AWARENESS_COLORS.body} fontSize="4" fontFamily="JetBrains Mono" opacity="0.6">BODY</text>
            </svg>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="w-48 flex-shrink-0 flex flex-col gap-2">
          {/* Awareness Triad */}
          <div className="bg-black/30 rounded p-2.5 space-y-2">
            <div className="text-[9px] text-[var(--text-secondary)] font-mono-data tracking-wider mb-1">
              AWARENESS TRIAD
            </div>
            {( ['mind', 'heart', 'body'] as AwarenessType[] ).map((a) => (
              <div key={a} className="space-y-0.5">
                <div className="flex justify-between text-[9px]">
                  <span style={{ color: AWARENESS_COLORS[a] }} className="uppercase font-mono-data">
                    {a}
                  </span>
                  <span className="text-[var(--text-secondary)] font-mono-data">
                    {Math.round(awarenessTotals[a])}%
                  </span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${awarenessTotals[a]}%`,
                      backgroundColor: AWARENESS_COLORS[a],
                      boxShadow: `0 0 6px ${AWARENESS_COLORS[a]}60`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Zone Detail */}
          {currentZone && currentData ? (
            <div className="flex-1 bg-black/30 rounded p-2.5 overflow-y-auto scrollbar-dark">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: AWARENESS_COLORS[currentZone.awareness] }}
                />
                <span className="text-[10px] text-[var(--text-primary)] font-mono-data">
                  {currentZone.name}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px]">
                  <span className="text-[var(--text-secondary)]">STATUS</span>
                  <span
                    className="font-mono-data"
                    style={{ color: currentData.status === 'DEFINED' ? '#10d474' : '#e8921a' }}
                  >
                    {currentData.status}
                  </span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-[var(--text-secondary)]">OPENNESS</span>
                  <span className="font-mono-data" style={{ color: "#10d474" }}>
                    {currentData.openness}%
                  </span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-[var(--text-secondary)]">FREQUENCY</span>
                  <span className="text-[var(--accent-lilac)] font-mono-data">
                    {currentData.frequency}Hz
                  </span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-[var(--text-secondary)]">GATE</span>
                  <span className="text-[var(--text-primary)] font-mono-data">
                    {currentData.gate}
                  </span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-[var(--text-secondary)]">CHANNEL</span>
                  <span className="text-[var(--text-primary)] font-mono-data">
                    {currentData.channel}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-white/5">
                <p className="text-[9px] text-[var(--text-secondary)] leading-relaxed">
                  {currentData.note}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-black/30 rounded p-2.5 flex items-center justify-center">
              <p className="text-[9px] text-[var(--text-secondary)] text-center leading-relaxed">
                Touch a body zone
                <br />
                to reveal HD stats
              </p>
            </div>
          )}
        </div>
      </div>

      {/* System Description */}
      <div className="text-[9px] text-[var(--text-secondary)] font-mono-data tracking-wider text-center">
        SYSTEM: {currentSystem.name} — {system === 'tropical' && 'Seasonal zodiac. Conscious personality imprint.'}
        {system === 'sidereal' && 'Constellation-aligned. True stellar positions.'}
        {system === 'fagan' && 'Fagan-Bradley ayanamsa. Corrected sidereal alignment.'}
        {system === 'draconic-mean' && 'Soul body via mean lunar node. Karmic blueprint.'}
        {system === 'draconic-true' && 'Soul body via true node. Precise karmic geometry.'}
      </div>
    </div>
  );
}
