import "./SurpriseFab.css";
import { CircleHelp, Sparkles, Trophy, X } from "lucide-react";
import { useState, type CSSProperties } from "react";

const confettiPieces = Array.from({ length: 48 }, (_, index) => ({
  left: `${(index * 41) % 100}%`,
  delay: `${0.08 + (index % 12) * 0.045}s`,
  duration: `${1.35 + (index % 6) * 0.14}s`,
  drift: `${-48 + (index * 29) % 96}px`,
  rotation: `${240 + (index % 5) * 108}deg`
}));

export function SurpriseFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="surprise-fab"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open cycle tracking information"
      >
        <CircleHelp size={22} />
        <span className="surprise-sr-only">Cycle tracking information</span>
      </button>

      {open && (
        <div
          className="surprise-dialog-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="surprise-confetti" aria-hidden="true">
            {confettiPieces.map((piece, index) => (
              <span
                key={index}
                style={{
                  left: piece.left,
                  animationDelay: piece.delay,
                  animationDuration: piece.duration,
                  "--confetti-drift": piece.drift,
                  "--confetti-rotation": piece.rotation
                } as CSSProperties}
              />
            ))}
          </div>
          <section
            className="surprise-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="surprise-dialog-title"
          >
            <div className="surprise-celebration-badge" aria-hidden="true">
              <Sparkles className="surprise-sparkle" size={22} />
              <Trophy size={34} strokeWidth={1.8} />
              <Sparkles className="surprise-sparkle" size={22} />
            </div>
            <button
              className="surprise-dialog-close"
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close dialog"
            >
              <X size={19} />
            </button>
            <p className="surprise-dialog-description" id="surprise-dialog-title">
              Congratulations to my gorgeous gaaal for 9.33 CGPA...🥳
            </p>
            <div className="surprise-dialog-actions">
              <button className="surprise-dialog-action" type="button" onClick={() => setOpen(false)}>
                Yeii...!
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
