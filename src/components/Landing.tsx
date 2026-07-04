import { RECIPIENT_NAME, TAGLINE, START_LABEL } from "../config";

export default function Landing({
  leaving,
  onStart,
}: {
  leaving: boolean;
  onStart: () => void;
}) {
  return (
    <div className={`landing${leaving ? " leaving" : ""}`}>
      <div className="kicker">Happy Birthday</div>
      <h1>{RECIPIENT_NAME}</h1>
      <p className="tagline">{TAGLINE}</p>
      <button className="spin-btn" onClick={onStart}>
        {START_LABEL}
      </button>
    </div>
  );
}
