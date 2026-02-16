import Icon from "@/components/ui/icon";

interface VerificationBadgeProps {
  type: string;
  size?: number;
}

export default function VerificationBadge({ type, size = 16 }: VerificationBadgeProps) {
  if (type === "standard") {
    return (
      <span className="inline-flex items-center badge-glow-blue" title="Подтвержденный аккаунт">
        <span className="inline-flex items-center justify-center rounded-full bg-blue-500 text-white" style={{ width: size, height: size }}>
          <Icon name="Check" size={size * 0.65} strokeWidth={3} />
        </span>
      </span>
    );
  }

  if (type === "artist") {
    return (
      <span className="inline-flex items-center badge-glow-primary" title="Подтвержденный артист">
        <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground" style={{ width: size, height: size }}>
          <Icon name="Music" size={size * 0.6} strokeWidth={2.5} />
        </span>
      </span>
    );
  }

  return null;
}
