import React from 'react';

export default function ArtPieceRenderer({ styleKey, imageUrl, title, className = 'w-full h-full' }) {
  if (imageUrl && imageUrl.trim() !== '') {
    return (
      <img
        src={imageUrl}
        alt={title}
        className={`${className} object-cover`}
        draggable={false}
      />
    );
  }

  switch (styleKey) {
    case 'portrait-sketching':
      return (
        <svg viewBox="0 0 400 500" className={className} preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="ks-paper" cx="48%" cy="40%" r="72%">
              <stop offset="0%" stopColor="#F8F4EC" />
              <stop offset="70%" stopColor="#EBE2D5" />
              <stop offset="100%" stopColor="#DDD0BE" />
            </radialGradient>
            <linearGradient id="ks-charcoal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1C1917" stopOpacity="0.88" />
              <stop offset="55%" stopColor="#3B3532" stopOpacity="0.52" />
              <stop offset="100%" stopColor="#1C1917" stopOpacity="0.08" />
            </linearGradient>
          </defs>
          <rect width="400" height="500" fill="url(#ks-paper)" />
          <rect x="24" y="24" width="352" height="452" fill="none" stroke="#1C1917" strokeOpacity="0.08" strokeWidth="1" />
          <ellipse cx="205" cy="215" rx="125" ry="155" fill="url(#ks-charcoal)" opacity="0.11" />
          <path d="M126 196 C112 124, 158 78, 214 86 C268 94, 304 148, 294 236 C288 286, 266 324, 248 352" fill="none" stroke="#1C1917" strokeWidth="3.2" strokeLinecap="round" opacity="0.85" />
          <path d="M138 176 C140 118, 184 94, 228 104 C266 114, 286 158, 276 226" fill="none" stroke="#2D2826" strokeWidth="1.5" strokeDasharray="16 4 6 3" opacity="0.65" />
          <g stroke="#1C1917" strokeOpacity="0.28" strokeWidth="1">
            {[0, 6, 12, 18, 24, 30, 36].map((d) => (
              <line key={d} x1={230 + d * 0.4} y1={210 + d} x2={256 + d * 0.2} y2={232 + d} />
            ))}
            {[0, 7, 14, 21, 28].map((d) => (
              <line key={`n-${d}`} x1={165 + d} y1={308} x2={155 + d} y2={342} />
            ))}
          </g>
          <path d="M150 186 C150 238, 174 282, 204 286 C234 282, 256 238, 256 188" fill="none" stroke="#1C1917" strokeWidth="2.3" strokeLinecap="round" />
          <path d="M164 178 Q179 170 193 178" fill="none" stroke="#1C1917" strokeWidth="2.1" strokeLinecap="round" />
          <path d="M214 178 Q228 170 242 178" fill="none" stroke="#1C1917" strokeWidth="2.1" strokeLinecap="round" />
          <ellipse cx="179" cy="189" rx="7.5" ry="3.8" fill="#1C1917" />
          <ellipse cx="227" cy="189" rx="7.5" ry="3.8" fill="#1C1917" />
          <circle cx="181" cy="188" r="1.2" fill="#F8F4EC" />
          <circle cx="229" cy="188" r="1.2" fill="#F8F4EC" />
          <circle cx="203" cy="169" r="3" fill="#B54534" />
          <path d="M203 190 L199 221 Q203 225 208 222" fill="none" stroke="#1C1917" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M187 244 Q203 238 219 244 Q203 252 187 244 Z" fill="#B87D76" opacity="0.45" stroke="#1C1917" strokeWidth="1.4" />
          <path d="M104 405 Q186 335 304 415" fill="none" stroke="#1C1917" strokeWidth="2.2" />
          <path d="M90 428 Q188 356 318 438" fill="none" stroke="#4D4540" strokeWidth="1.3" />
          <text x="278" y="460" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontSize="14" fill="#6D645B">M. Sen · 26</text>
        </svg>
      );

    case 'jamini-roy':
      return (
        <svg viewBox="0 0 400 500" className={className} preserveAspectRatio="xMidYMid slice">
          <rect width="400" height="500" fill="#EFE4CE" />
          <rect x="16" y="16" width="368" height="468" fill="none" stroke="#B54534" strokeWidth="7" />
          <rect x="28" y="28" width="344" height="444" fill="none" stroke="#1C1917" strokeWidth="2.5" />
          <path d="M52 456 L52 190 A148 148 0 0 1 348 190 L348 456 Z" fill="#C28B37" stroke="#1C1917" strokeWidth="5" />
          <circle cx="200" cy="200" r="108" fill="#B54534" stroke="#1C1917" strokeWidth="4.5" />
          <path d="M144 196 C144 138, 256 138, 256 196 C256 254, 226 286, 200 290 C174 286, 144 254, 144 196 Z" fill="#E7C284" stroke="#1C1917" strokeWidth="6.5" />
          <path d="M153 190 Q175 173 195 191 Q175 204 153 190 Z" fill="#FBF9F4" stroke="#1C1917" strokeWidth="4.5" />
          <circle cx="176" cy="190" r="6.5" fill="#1C1917" />
          <path d="M205 191 Q225 173 247 190 Q225 204 205 191 Z" fill="#FBF9F4" stroke="#1C1917" strokeWidth="4.5" />
          <circle cx="224" cy="190" r="6.5" fill="#1C1917" />
          <path d="M148 176 Q175 157 198 179 L195 222 Q201 228 208 222" fill="none" stroke="#1C1917" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M202 179 Q225 157 252 176" fill="none" stroke="#1C1917" strokeWidth="5.5" strokeLinecap="round" />
          <circle cx="200" cy="161" r="6" fill="#B54534" />
          <path d="M88 456 C102 340, 142 300, 200 300 C258 300, 298 340, 312 456 Z" fill="#293B4D" stroke="#1C1917" strokeWidth="6" />
          <path d="M122 456 C138 362, 174 326, 232 308" fill="none" stroke="#F6F2EB" strokeWidth="5.5" />
          <path d="M152 456 C168 380, 202 344, 256 326" fill="none" stroke="#C28B37" strokeWidth="4" />
          {[[62, 62], [338, 62], [62, 438], [338, 438]].map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="14" fill="#F6F2EB" stroke="#1C1917" strokeWidth="3" />
              <circle cx={cx} cy={cy} r="5.5" fill="#B54534" />
            </g>
          ))}
        </svg>
      );

    case 'abstract-drawing':
      return (
        <svg viewBox="0 0 400 500" className={className} preserveAspectRatio="xMidYMid slice">
          <rect width="400" height="500" fill="#F4EFE6" />
          <rect x="44" y="64" width="160" height="230" fill="#ECE4D6" />
          <path d="M70 420 C70 250, 210 190, 320 265 C355 290, 360 390, 360 445 L70 445 Z" fill="#B87D76" opacity="0.62" />
          <circle cx="255" cy="170" r="84" fill="#293B4D" opacity="0.86" />
          <path d="M68 122 C160 112, 224 196, 178 308 C154 368, 120 404, 134 442" fill="none" stroke="#1C1917" strokeWidth="10" strokeLinecap="round" opacity="0.88" />
          <path d="M208 355 Q268 300 338 345" fill="none" stroke="#1C1917" strokeWidth="2.8" />
          <rect x="194" y="218" width="54" height="54" fill="#C28B37" opacity="0.9" />
          <line x1="60" y1="322" x2="342" y2="128" stroke="#C28B37" strokeWidth="2" />
          <circle cx="136" cy="216" r="32" fill="none" stroke="#1C1917" strokeWidth="1.5" />
        </svg>
      );

    case 'indian-art':
      return (
        <svg viewBox="0 0 400 500" className={className} preserveAspectRatio="xMidYMid slice">
          <rect width="400" height="500" fill="#F4ECDC" />
          <rect x="18" y="18" width="364" height="464" fill="none" stroke="#1C1917" strokeWidth="2.5" />
          <rect x="28" y="28" width="344" height="444" fill="none" stroke="#B54534" strokeWidth="3.5" strokeDasharray="8 5" />
          <path d="M66 446 L66 196 Q66 122 200 76 Q334 122 334 196 L334 446 Z" fill="#293B4D" stroke="#1C1917" strokeWidth="3" />
          <path d="M84 446 L84 204 Q84 140 200 100 Q316 140 316 204 L316 446 Z" fill="#F4ECDC" stroke="#C28B37" strokeWidth="2.5" />
          <circle cx="200" cy="182" r="44" fill="#C28B37" stroke="#1C1917" strokeWidth="2.5" />
          <circle cx="200" cy="182" r="24" fill="#B54534" stroke="#1C1917" strokeWidth="2" />
          <line x1="200" y1="438" x2="200" y2="226" stroke="#1C1917" strokeWidth="3.5" />
          <path d="M200 350 Q138 320 116 268" fill="none" stroke="#1C1917" strokeWidth="2.5" />
          <path d="M200 350 Q262 320 284 268" fill="none" stroke="#1C1917" strokeWidth="2.5" />
          <path d="M200 296 Q148 265 136 226" fill="none" stroke="#1C1917" strokeWidth="2" />
          <path d="M200 296 Q252 265 264 226" fill="none" stroke="#1C1917" strokeWidth="2" />
          {[[116, 268, '#B54534'], [284, 268, '#B54534'], [136, 226, '#293B4D'], [264, 226, '#293B4D']].map(([cx, cy, c], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="18" fill={c} stroke="#1C1917" strokeWidth="2" />
              <circle cx={cx} cy={cy} r="6" fill="#F4ECDC" />
            </g>
          ))}
          <path d="M108 446 Q200 384 292 446 Z" fill="#B54534" stroke="#1C1917" strokeWidth="2.5" />
        </svg>
      );

    case 'muffler':
      return (
        <svg viewBox="0 0 400 500" className={className} preserveAspectRatio="xMidYMid slice">
          <rect width="400" height="500" fill="#ECE6DB" />
          <ellipse cx="204" cy="442" rx="112" ry="14" fill="#1C1917" opacity="0.09" />
          <path d="M122 86 C122 54, 278 54, 278 86 L286 368 L216 368 L212 164 L188 164 L184 396 L114 396 Z" fill="#B87D76" stroke="#8E5B55" strokeWidth="2.2" />
          <g stroke="#F6F2EB" strokeWidth="2.8" fill="none" strokeLinecap="round" opacity="0.72">
            {[104, 134, 164, 194, 224, 254, 284, 314, 344].map((y, i) => (
              <React.Fragment key={i}>
                <path d={`M134 ${y} Q150 ${y + 12} 166 ${y}`} />
                <path d={`M234 ${y - 8} Q250 ${y + 4} 266 ${y - 8}`} />
              </React.Fragment>
            ))}
          </g>
          <rect x="115" y="344" width="68" height="14" fill="#F6F2EB" />
          <rect x="115" y="364" width="68" height="7" fill="#293B4D" />
          <rect x="217" y="318" width="68" height="14" fill="#F6F2EB" />
          <rect x="217" y="338" width="68" height="7" fill="#293B4D" />
          <g stroke="#9D655F" strokeWidth="3.2" strokeLinecap="round">
            {[120, 132, 144, 156, 168, 179].map((x, i) => <line key={i} x1={x} y1="396" x2={x - 2} y2="434" />)}
            {[222, 234, 246, 258, 270, 281].map((x, i) => <line key={i} x1={x} y1="368" x2={x + 2} y2="404" />)}
          </g>
        </svg>
      );

    case 'flower-bouquet':
      return (
        <svg viewBox="0 0 400 500" className={className} preserveAspectRatio="xMidYMid slice">
          <rect width="400" height="500" fill="#F0EAE0" />
          <polygon points="112,246 288,246 218,452 182,452" fill="#D9C3AA" stroke="#B69D82" strokeWidth="2" />
          <polygon points="112,246 200,278 182,452" fill="#C9B093" opacity="0.65" />
          <path d="M164 338 Q134 316 150 352 Q174 348 200 338 Q226 348 250 352 Q266 316 236 338 Z" fill="#B54534" />
          <circle cx="200" cy="339" r="7" fill="#8C3123" />
          <ellipse cx="132" cy="204" rx="20" ry="38" transform="rotate(-28 132 204)" fill="#5E6E5F" />
          <ellipse cx="268" cy="204" rx="20" ry="38" transform="rotate(28 268 204)" fill="#5E6E5F" />
          <ellipse cx="200" cy="136" rx="18" ry="36" fill="#4E5D4F" />
          {[
            { cx: 162, cy: 194, r: 34, main: '#B87D76', inner: '#E4C3BF' },
            { cx: 238, cy: 194, r: 34, main: '#B54534', inner: '#E2A39A' },
            { cx: 200, cy: 162, r: 36, main: '#C28B37', inner: '#EBD1A0' },
            { cx: 148, cy: 234, r: 27, main: '#FBF9F4', inner: '#C28B37' },
            { cx: 252, cy: 234, r: 27, main: '#FBF9F4', inner: '#C28B37' },
            { cx: 200, cy: 224, r: 32, main: '#B87D76', inner: '#FBF9F4' },
          ].map((fl, i) => (
            <g key={i}>
              <circle cx={fl.cx} cy={fl.cy} r={fl.r} fill={fl.main} stroke="#FBF9F4" strokeWidth="1.5" strokeDasharray="4 2" />
              <circle cx={fl.cx} cy={fl.cy} r={fl.r * 0.6} fill={fl.inner} stroke={fl.main} strokeWidth="2" strokeDasharray="3 2" />
              <circle cx={fl.cx} cy={fl.cy} r={fl.r * 0.25} fill={fl.main} />
            </g>
          ))}
        </svg>
      );

    case 'key-rings':
    default:
      return (
        <svg viewBox="0 0 400 500" className={className} preserveAspectRatio="xMidYMid slice">
          <rect width="400" height="500" fill="#EFE9DF" />
          <circle cx="200" cy="112" r="34" fill="none" stroke="#B68B40" strokeWidth="7" />
          <rect x="191" y="146" width="18" height="28" rx="4" fill="#B68B40" />
          <line x1="200" y1="174" x2="200" y2="215" stroke="#6D645B" strokeWidth="5" strokeDasharray="4 3" />
          <g transform="translate(200, 290)">
            {Array.from({ length: 12 }).map((_, idx) => (
              <ellipse key={idx} cx="0" cy="-62" rx="15" ry="30" fill={idx % 2 === 0 ? '#C28B37' : '#D5A252'} stroke="#FBF9F4" strokeWidth="1.4" transform={`rotate(${idx * 30})`} />
            ))}
            <circle cx="0" cy="0" r="42" fill="#293B4D" stroke="#FBF9F4" strokeWidth="2" strokeDasharray="4 3" />
            <circle cx="0" cy="0" r="24" fill="#B54534" />
            <circle cx="0" cy="0" r="9" fill="#FBF9F4" />
          </g>
          <ellipse cx="242" cy="196" rx="22" ry="10" transform="rotate(-24 242 196)" fill="#5E6E5F" />
        </svg>
      );
  }
}