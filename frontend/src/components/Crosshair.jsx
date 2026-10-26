// Renders the player's crosshair from settings. Pixel-snapped SVG keeps lines crisp at any size.

export default function Crosshair({ config, scale = 1, className, style }) {
  const { color, length, thickness, gap, dot, outline, lines } = config;
  const L = length * scale;
  const T = Math.max(1, thickness * scale);
  const G = gap * scale;
  const pad = 2 * scale + 2;
  const half = Math.ceil(G + L + pad);
  const size = half * 2;
  const c = half;

  const rects = [];
  if (lines && L > 0) {
    rects.push([c - T / 2, c - G - L, T, L]); // top
    rects.push([c - T / 2, c + G, T, L]); // bottom
    rects.push([c - G - L, c - T / 2, L, T]); // left
    rects.push([c + G, c - T / 2, L, T]); // right
  }
  if (dot) rects.push([c - T / 2, c - T / 2, T, T]);

  const o = Math.max(1, scale);
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {outline &&
        rects.map(([x, y, w, h], i) => (
          <rect key={`o${i}`} x={x - o} y={y - o} width={w + o * 2} height={h + o * 2} fill="rgba(0,0,0,0.85)" />
        ))}
      {rects.map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={color} />
      ))}
    </svg>
  );
}
