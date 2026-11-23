// "SA" monogram on a mandala, plus the two-line name, like the reference logo.
// Everything is inline SVG/CSS: no image download, sharp at every size.

const R = 100; // mandala drawn in a 200×200 box centred on 0,0

// A teardrop petal lying along the x axis, from radius r1 to r2.
const petal = (r1, r2, w) => {
  const m = r1 + (r2 - r1) * 0.45;
  return `M${r1},0 C${m},${w} ${r2 - (r2 - r1) * 0.15},${w * 0.45} ${r2},0 C${r2 - (r2 - r1) * 0.15},${-w * 0.45} ${m},${-w} ${r1},0Z`;
};

const ring = (count, offset = 0) => Array.from({ length: count }, (_, i) => offset + (360 / count) * i);

function Mandala() {
  return (
    <svg className="logo__mandala" viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
        {/* outer pointed petals */}
        {ring(16).map((a) => (
          <path key={`o${a}`} d={petal(58, 97, 15)} transform={`rotate(${a})`} />
        ))}
        {/* inner line inside each outer petal */}
        {ring(16).map((a) => (
          <path key={`oi${a}`} d={petal(66, 88, 7)} transform={`rotate(${a})`} />
        ))}
        {/* middle petals, offset between the outer ones */}
        {ring(12, 15).map((a) => (
          <path key={`m${a}`} d={petal(34, 66, 12)} transform={`rotate(${a})`} />
        ))}
        {/* inner petals */}
        {ring(8, 22.5).map((a) => (
          <path key={`i${a}`} d={petal(14, 38, 9)} transform={`rotate(${a})`} />
        ))}
        <circle r="56" />
        <circle r="32" />
        <circle r="12" />
      </g>
      <g fill="currentColor">
        {/* dotted rings, like the dots in the original */}
        {ring(48).map((a) => (
          <circle key={`d${a}`} r="1.8" transform={`rotate(${a}) translate(46 0)`} />
        ))}
        {ring(16, 11.25).map((a) => (
          <circle key={`e${a}`} r="2.4" transform={`rotate(${a}) translate(92 0)`} />
        ))}
        <circle r="4" />
      </g>
    </svg>
  );
}

export default function Logo() {
  return (
    <span className="logo">
      <span className="logo__mark" aria-hidden="true">
        <Mandala />
        {/* S and A overlap as one group, and the group is centred on the mandala */}
        <span className="logo__letters">
          <span className="logo__letter logo__letter--s">S</span>
          <span className="logo__letter logo__letter--a">A</span>
        </span>
      </span>
      <span className="logo__text">
        <span className="logo__name">Sakshi Anand</span>
        <span className="logo__tagline">Heena art</span>
      </span>
    </span>
  );
}
