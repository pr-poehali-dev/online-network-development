import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import BottomNav from "@/components/BottomNav";
import { apiGet } from "@/lib/api";
import { formatShortDate } from "@/lib/format";

interface ChatPreview {
  id: string;
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  last_message: {
    text: string;
    created_at: string;
    is_own: boolean;
  };
  unread_count: number;
}

export default function Messages() {
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/messages/chats")
      .then((data) => {
        setChats(data.chats || data || []);
      })
      .catch(() => setChats([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <Icon name="ArrowLeft" size={20} />
          </Button>
          <h1 className="font-semibold flex-1">Сообщения</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-48 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Icon name="MessageCircle" size={40} className="mx-auto mb-3 opacity-50" />
            <p>Нет сообщений</p>
            <p className="text-sm mt-1">Начните переписку с кем-нибудь</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => navigate(`/messages/${chat.user.id}`)}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={chat.user.avatar_url} alt={chat.user.username} />
                  <AvatarFallback>{chat.user.display_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm truncate">{chat.user.display_name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {chat.last_message && formatShortDate(chat.last_message.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-sm text-muted-foreground truncate">
                      {chat.last_message?.is_own && <span className="text-foreground">Вы: </span>}
                      {chat.last_message?.text || "Нет сообщений"}
                    </p>
                    {chat.unread_count > 0 && (
                      <Badge className="ml-2 shrink-0 h-5 min-w-[20px] flex items-center justify-center text-[10px]">
                        {chat.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
