export function Bar({
  value,
  max,
  tone = "accent",
}: {
  value: number;
  max: number;
  tone?: "accent" | "blood";
}) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="bar" aria-hidden="true">
      <span className={tone === "blood" ? "bar-blood" : "bar-accent"} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function outlook(power: number, threat: number): string {
  const ratio = power / Math.max(1, threat);
  if (ratio < 0.45) return "Letal";
  if (ratio < 0.75) return "Arriscado";
  if (ratio < 1.15) return "Equilibrado";
  return "Você é a ameaça";
}
