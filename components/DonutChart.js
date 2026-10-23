import { useRouter } from "next/router";

export default function DonutChart({ percentage, size = 220, strokeWidth = 46, detailHref = "/AbsensiDetail", showDetailButton = true }) {
  const router = useRouter();

  const safePercentage = Number.isFinite(Number(percentage)) ? Number(percentage) : 0;
  const clamped = Math.max(0, Math.min(100, safePercentage));

  const center = size / 2;
  const radius = Math.max(1, (size - strokeWidth) / 2);
  const circumference = 2 * Math.PI * radius;
  const hadirLength = (clamped / 100) * circumference;
  const holeRadius = Math.max(0, radius - strokeWidth / 2 - 4);
  const buttonSize = Math.max(0, holeRadius * 2 - 10);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#8B2A12" strokeWidth={strokeWidth} />
        {hadirLength > 0 && (
          <circle
            cx={center} cy={center} r={radius} fill="none" stroke="#129E90" strokeWidth={strokeWidth}
            strokeDasharray={`${hadirLength} ${circumference - hadirLength}`}
            strokeLinecap="butt" transform={`rotate(-90 ${center} ${center})`}
          />
        )}
        <circle cx={center} cy={center} r={holeRadius} fill="#f4f0e6" />
      </svg>

      {showDetailButton && buttonSize > 0 && (
        <button
          type="button"
          onClick={() => router.push(detailHref)}
          aria-label="Lihat detail absensi"
          style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            width: buttonSize, height: buttonSize, borderRadius: "50%", border: "none", background: "transparent",
            color: "#8B2A12", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "'Poppins', sans-serif",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(139,42,18,0.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          Details
        </button>
      )}
    </div>
  );
}