/** Original geometric illustrations; decorative, not official festival insignia. */
export function MorionMask({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 80 96"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M17 34C17 14 27 5 40 5s23 9 23 29M25 28V17M34 25V10M45 25V10M54 28V17"
        stroke="currentColor"
        strokeWidth="5"
      />
      <path
        d="M11 35 40 25l29 10-8 12v24L40 91 19 71V47Z"
        fill="var(--sun, #ffce32)"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="m22 46 13 3-7 8Zm36 0-13 3 7 8ZM40 49l-5 17h10M28 72l12-3 12 3-12 9Z"
        fill="currentColor"
      />
      <path
        d="M13 35h54M20 61l9 4m31-4-9 4"
        stroke="currentColor"
        strokeWidth="3"
      />
    </svg>
  );
}
export function Butterfly({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 32"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M19 16C14 2 1 0 2 10c0 6 5 9 11 9-9 1-8 11-2 11 4 0 7-5 9-10 2 5 5 10 9 10 6 0 7-10-2-11 6 0 11-3 11-9C39 0 26 2 21 16l-1-6-1 6Z" />
    </svg>
  );
}
export function WaveDivider() {
  return (
    <svg
      className="wave-divider"
      viewBox="0 0 1000 48"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M0 9C190 56 270-20 490 10s310 36 510-8v46H0Z"
        fill="var(--aqua)"
      />
      <path
        d="M0 32C210-9 350 60 590 28S870 3 1000 23v25H0Z"
        fill="var(--cyan)"
      />
    </svg>
  );
}
export function IslandMosaic() {
  return (
    <div className="island-mosaic" aria-hidden="true">
      <div className="mosaic-tile mosaic-sea">
        <svg viewBox="0 0 200 200">
          <path fill="#00b4de" d="M0 0h200v200H0z" />
          <circle cx="150" cy="43" r="25" fill="#ffce32" />
          <path
            d="M-30 150C10 15 150 17 175 100 100 52 63 108 84 152c24 33 81 21 116 2v46H0Z"
            fill="#0869bd"
          />
          <path d="M0 171c63-49 104 39 200-25v54H0Z" fill="#303080" />
          <path
            d="M22 72c22-15 41-18 61-15"
            fill="none"
            stroke="#fff8e8"
            strokeWidth="7"
          />
        </svg>
        <span>ISLAND WATERS</span>
      </div>
      <div className="mosaic-tile mosaic-mask">
        <MorionMask />
        <span>MORIONES</span>
      </div>
      <div className="mosaic-tile mosaic-cathedral">
        <svg viewBox="0 0 200 200">
          <path fill="#ffce32" d="M0 0h200v200H0z" />
          <path fill="#ed6623" d="M35 173V90h25V64l40-29 40 29v26h25v83Z" />
          <path
            fill="#b43d2d"
            d="M60 173V94h80v79ZM28 91l19-24 20 24Zm105 0 20-24 19 24Z"
          />
          <path d="M85 173v-34a15 15 0 0 1 30 0v34" fill="#ffce32" />
          <circle cx="100" cy="78" r="11" fill="#fff8e8" />
          <path stroke="#303080" strokeWidth="5" d="M100 17v22m-8-15h16" />
          <path
            stroke="#fff8e8"
            strokeWidth="5"
            d="M77 108h46M44 111v17m112-17v17"
          />
        </svg>
        <span>BOAC HERITAGE</span>
      </div>
      <div className="mosaic-tile mosaic-nature">
        <Butterfly />
        <span>LET WONDER WANDER</span>
      </div>
    </div>
  );
}
