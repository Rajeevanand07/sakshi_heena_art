// Text that slides up into view from behind an invisible line (mask), like
// the page-open animation from the portfolio. Plays once when it mounts.
//
//   <Rise delay={120}>Bridal Mehndi</Rise>
//
// block: use for text that may wrap onto several lines (paragraphs, titles).
export default function Rise({ children, delay = 0, block = false }) {
  return (
    <span className={block ? 'rise rise--block' : 'rise'}>
      <span className="rise__in" style={{ '--rise-delay': `${delay}ms` }}>
        {children}
      </span>
    </span>
  );
}
