import "./SurpriseFab.css";
import { CircleHelp, X } from "lucide-react";
import { useState } from "react";

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
          <section
            className="surprise-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="surprise-dialog-title"
          >
            <div className="surprise-dialog-heading">
              <h2 id="surprise-dialog-title">Congratulations!</h2>
              <button
                className="surprise-dialog-close"
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close dialog"
              >
                <X size={19} />
              </button>
            </div>
            <p className="surprise-dialog-description">
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
