// Fixed grid lines behind the canvas. Pure CSS, never moves, never repaints on scroll.
export default function GridBackground() {
  return <div className="grid-bg" aria-hidden="true" />;
}
