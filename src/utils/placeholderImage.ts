/**
 * Generates an SVG Data URI as a fallback or placeholder keyframe
 * with cinematic gradients and scene styling.
 */
export function generatePlaceholderImage(
  title: string,
  sceneNumber: number,
  style: string,
  aspectRatio: '16:9' | '9:16' | '1:1' = '16:9'
): string {
  const width = aspectRatio === '9:16' ? 720 : aspectRatio === '1:1' ? 1080 : 1280;
  const height = aspectRatio === '9:16' ? 1280 : aspectRatio === '1:1' ? 1080 : 720;

  // Gradients based on scene number
  const gradients = [
    { start: '#1e1b4b', mid: '#4338ca', end: '#06b6d4', accent: '#38bdf8' }, // Blue Cyber
    { start: '#311042', mid: '#701a75', end: '#f43f5e', accent: '#fb7185' }, // Neon Violet
    { start: '#064e3b', mid: '#047857', end: '#10b981', accent: '#34d399' }, // Emerald Glow
    { start: '#451a03', mid: '#9a3412', end: '#f59e0b', accent: '#fbbf24' }, // Amber Cinema
    { start: '#172554', mid: '#1e40af', end: '#6366f1', accent: '#818cf8' }, // Deep Space
  ];

  const palette = gradients[(sceneNumber - 1) % gradients.length];

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.start}" />
      <stop offset="50%" stop-color="${palette.mid}" />
      <stop offset="100%" stop-color="${palette.end}" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.8" />
    </radialGradient>
    <filter id="blurFilter" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="30" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
  <rect width="${width}" height="${height}" fill="url(#glow)" />

  <!-- Atmospheric Glow Circles -->
  <circle cx="${width * 0.3}" cy="${height * 0.35}" r="${width * 0.25}" fill="${palette.accent}" opacity="0.25" filter="url(#blurFilter)" />
  <circle cx="${width * 0.7}" cy="${height * 0.6}" r="${width * 0.2}" fill="${palette.mid}" opacity="0.3" filter="url(#blurFilter)" />

  <!-- Cinematic Framing Elements -->
  <rect x="30" y="30" width="${width - 60}" height="${height - 60}" fill="none" stroke="${palette.accent}" stroke-width="1.5" stroke-opacity="0.3" rx="8" />
  
  <!-- Corner Crosshairs -->
  <path d="M 40 55 L 40 40 L 55 40" fill="none" stroke="${palette.accent}" stroke-width="2.5" />
  <path d="M ${width - 40} 55 L ${width - 40} 40 L ${width - 55} 40" fill="none" stroke="${palette.accent}" stroke-width="2.5" />
  <path d="M 40 ${height - 55} L 40 ${height - 40} L 55 ${height - 40}" fill="none" stroke="${palette.accent}" stroke-width="2.5" />
  <path d="M ${width - 40} ${height - 55} L ${width - 40} ${height - 40} L ${width - 55} ${height - 40}" fill="none" stroke="${palette.accent}" stroke-width="2.5" />

  <!-- Scene Badge -->
  <g transform="translate(${width / 2}, ${height * 0.25})">
    <rect x="-100" y="-22" width="200" height="44" rx="22" fill="#000000" fill-opacity="0.6" stroke="${palette.accent}" stroke-width="1.5" />
    <text x="0" y="7" font-family="sans-serif" font-weight="700" font-size="16" fill="${palette.accent}" text-anchor="middle" letter-spacing="2">GOOGLE FLOW SCENE ${sceneNumber}</text>
  </g>

  <!-- Title Center -->
  <text x="${width / 2}" y="${height * 0.48}" font-family="sans-serif" font-weight="800" font-size="${aspectRatio === '9:16' ? 32 : 40}" fill="#ffffff" text-anchor="middle" letter-spacing="-0.5">
    ${escapeXml(title)}
  </text>

  <!-- Style Badge -->
  <text x="${width / 2}" y="${height * 0.58}" font-family="sans-serif" font-weight="500" font-size="18" fill="#94a3b8" text-anchor="middle">
    Visual Style: ${escapeXml(style)}
  </text>

  <!-- Bottom Visual Prompt Guide -->
  <g transform="translate(${width / 2}, ${height - 80})">
    <text x="0" y="0" font-family="sans-serif" font-weight="600" font-size="13" fill="#cbd5e1" text-anchor="middle" opacity="0.8">
      AI Keyframe Generation Preview
    </text>
  </g>
</svg>
`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
