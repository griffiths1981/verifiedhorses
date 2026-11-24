export function SellProgress({ id, step }: { id?: string; step: number }) {
  const steps = [
    ["You", "/account/verification"],
    ["Video", id ? `/sell/${id}/video` : "/sell"],
    ["Horse", id ? `/sell/${id}/facts` : "/sell"],
    ["Papers", id ? `/sell/${id}/documents` : "/sell"],
    ["Preview", id ? `/sell/${id}/preview` : "/sell"],
  ];
  return (
    <nav className="progress" aria-label="Sell progress">
      {steps.map(([label, href], index) =>
        index === step ? <span key={label} className="on">{index + 1}. {label}</span> : <a key={label} href={href}>{index + 1}. {label}</a>,
      )}
    </nav>
  );
}
