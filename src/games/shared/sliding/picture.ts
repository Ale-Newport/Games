/** An original picture for picture tiles: a hillside at sunset, drawn as an SVG data URL. */
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2d6e"/><stop offset=".55" stop-color="#e86f68"/><stop offset="1" stop-color="#f7c873"/></linearGradient></defs>
<rect width="120" height="120" fill="url(#s)"/>
<circle cx="78" cy="58" r="17" fill="#ffe29a"/>
<circle cx="22" cy="18" r="1.2" fill="#fff"/><circle cx="48" cy="10" r="1" fill="#fff"/><circle cx="100" cy="22" r="1.3" fill="#fff"/>
<path d="M0 78 Q30 58 60 74 T120 66 V120 H0Z" fill="#7b4a8f"/>
<path d="M0 92 Q40 74 76 90 T120 84 V120 H0Z" fill="#4b3a78"/>
<path d="M0 104 Q36 94 70 104 T120 100 V120 H0Z" fill="#2c2752"/>
<path d="M18 104 l6 -16 l6 16 z M30 106 l5 -12 l5 12 z" fill="#1a1838"/>
<path d="M88 100 q4 -10 8 0 z" fill="#1a1838"/>
</svg>`;

export const PICTURE = `url("data:image/svg+xml,${encodeURIComponent(SVG)}")`;
