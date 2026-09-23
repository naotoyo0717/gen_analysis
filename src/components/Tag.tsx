interface Props {
  kind: "domain" | "attack-type" | "attack-name";
  children: React.ReactNode;
}

export function Tag({ kind, children }: Props) {
  return <span className={`tag tag--${kind}`}>{children}</span>;
}
