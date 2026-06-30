import React from 'react';

export const MotivationGate42 = ({ coherence = 0.7 }) => {
  return (
    <div className="gate-42-container">
      <div className="gate-header">
        <h3>Gate 42: The Completion Gene</h3>
        <span className="coherence-badge">{(coherence * 100).toFixed(0)}%</span>
      </div>
      <div className="gate-visualization">
        <svg viewBox="0 0 100 100" className="gate-mandala">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" opacity={coherence} />
          <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1" opacity={coherence * 0.7} />
          <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" opacity={coherence * 0.5} />
        </svg>
      </div>
      <p className="gate-message">
        Motivation through rest. Honor your completion cycles.
      </p>
    </div>
  );
};
