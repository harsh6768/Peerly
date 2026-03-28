export function FooterWave() {
  return (
    <div aria-hidden="true" className="footer-wave">
      <svg
        className="footer-wave-cap-svg"
        preserveAspectRatio="none"
        viewBox="0 0 1440 140"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="footerWaveFill" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#5A52E0" />
            <stop offset="55%" stopColor="#6C63FF" />
            <stop offset="100%" stopColor="#8B85FF" />
          </linearGradient>
        </defs>
        <path
          d="M0 82C90 62 180 62 270 82C360 102 450 102 540 82C630 62 720 62 810 82C900 102 990 102 1080 82C1170 62 1260 62 1350 80C1390 88 1420 92 1440 94V140H0V82Z"
          fill="url(#footerWaveFill)"
        />
      </svg>

      <div className="footer-wave-track footer-wave-track-back">
        <AnimatedWaveSvg className="footer-wave-svg footer-wave-svg-back" />
        <AnimatedWaveSvg className="footer-wave-svg footer-wave-svg-back" />
      </div>

      <div className="footer-wave-track footer-wave-track-front">
        <AnimatedWaveSvg className="footer-wave-svg footer-wave-svg-front" />
        <AnimatedWaveSvg className="footer-wave-svg footer-wave-svg-front" />
      </div>
    </div>
  )
}

type AnimatedWaveSvgProps = {
  className: string
}

function AnimatedWaveSvg({ className }: AnimatedWaveSvgProps) {
  return (
    <svg
      className={className}
      preserveAspectRatio="none"
      viewBox="0 0 1440 120"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 62C90 42 180 42 270 62C360 82 450 82 540 62C630 42 720 42 810 62C900 82 990 82 1080 62C1170 42 1260 42 1350 60C1390 68 1420 72 1440 74" />
    </svg>
  )
}
