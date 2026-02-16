import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface StoryCircleProps {
  avatarUrl?: string;
  name: string;
  hasStory?: boolean;
  size?: number;
  onClick?: () => void;
}

export default function StoryCircle({ avatarUrl, name, hasStory = false, size = 56, onClick }: StoryCircleProps) {
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 min-w-[68px]">
      <div
        className={`rounded-full p-[2px] ${hasStory ? "story-ring" : "bg-border"}`}
        style={{ width: size + 6, height: size + 6 }}
      >
        <div className="rounded-full bg-background p-[2px] w-full h-full">
          <Avatar className="w-full h-full" style={{ width: size - 2, height: size - 2 }}>
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <span className="text-xs text-muted-foreground truncate w-[64px] text-center">{name}</span>
    </button>
  );
}
