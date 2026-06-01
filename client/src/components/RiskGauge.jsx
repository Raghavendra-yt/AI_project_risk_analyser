import React, { useEffect, useState } from "react";

// Utility color helpers
export const riskColor = (score) => {
  if (score <= 30) return "#10B981"; // Vibrant Emerald Green
  if (score <= 70) return "#F59E0B"; // Warm Amber Yellow
  return "#EF4444"; // Sleek Red
};

export const riskBg = (score) => {
  if (score <= 30) return "rgba(16, 185, 129, 0.12)";
  if (score <= 70) return "rgba(245, 158, 11, 0.12)";
  return "rgba(239, 68, 68, 0.12)";
};

export const riskLevel = (score) => {
  if (score <= 30) return "Low";
  if (score <= 70) return "Medium";
  return "High";
};

export default function RiskGauge({ score }) {
  const r = 80;
  const cx = 110;
  const cy = 110;
  const circumference = Math.PI * r;
  
  // Set up animation state
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Quick micro-animation counting up
    const duration = 800; // ms
    const startTime = performance.now();
    
    let frameId;
    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing out quad
      const easedProgress = progress * (2 - progress);
      setAnimatedScore(Math.round(easedProgress * score));

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };
    
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [score]);

  const dashoffset = circumference * (1 - animatedScore / 100);
  const color = riskColor(score);

  const angle = (animatedScore / 100) * 180 - 90;
  const rad = (angle * Math.PI) / 180;
  const needleX = cx + r * 0.72 * Math.cos(rad);
  const needleY = cy + r * 0.72 * Math.sin(rad);

  return (
    <div className="risk-gauge-container">
      <svg width="220" height="135" viewBox="0 0 220 135" className="risk-gauge-svg">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="14"
          strokeLinecap="round"
        />
        
        {/* Fill */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          style={{ transition: "stroke-dashoffset 0.1s linear" }}
        />
        
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0px 2px 4px ${color}80)` }}
        />
        <circle cx={cx} cy={cy} r="6.5" fill={color} stroke="#FFFFFF" strokeWidth="1.5" />
        
        {/* Labels */}
        <text x={cx - r - 6} y={cy + 18} fill="#64748B" fontSize="10.5" fontWeight="600" textAnchor="middle">0</text>
        <text x={cx} y={cy - r - 8} fill="#64748B" fontSize="10.5" fontWeight="600" textAnchor="middle">50</text>
        <text x={cx + r + 6} y={cy + 18} fill="#64748B" fontSize="10.5" fontWeight="600" textAnchor="middle">100</text>
        
        {/* Animated Score */}
        <text
          x={cx}
          y={cy + 18}
          fill={color}
          fontSize="30"
          fontWeight="800"
          textAnchor="middle"
          className="mono-font"
          style={{ filter: `drop-shadow(0 0 10px ${color}40)` }}
        >
          {animatedScore}
        </text>
        <text x={cx} y={cy + 31} fill="#64748B" fontSize="9.5" fontWeight="700" textAnchor="middle" letterSpacing="0.5">/ 100</text>
      </svg>
      
      <span
        className="risk-badge"
        style={{
          background: riskBg(score),
          color: color,
          border: `1px solid ${color}30`
        }}
      >
        {riskLevel(score).toUpperCase()} RISK
      </span>
    </div>
  );
}
