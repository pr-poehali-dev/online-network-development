import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Icon from "@/components/ui/icon";
import BottomNav from "@/components/BottomNav";
import { apiGet, apiPost } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  from_user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  post_id?: string;
  text?: string;
  is_read: boolean;
  created_at: string;
}

interface FollowRequest {
  id: string;
  from_user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  created_at: string;
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGet("/notifications").catch(() => ({ notifications: [] })),
      apiGet("/follow-requests").catch(() => ({ requests: [] })),
    ]).then(([notifData, reqData]) => {
      setNotifications(notifData.notifications || notifData || []);
      setRequests(reqData.requests || reqData || []);
    }).finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    try {
      await apiPost("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("Все прочитано");
    } catch {
      toast.error("Ошибка");
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      await apiPost(`/follow-requests/${requestId}/accept`);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast.success("Запрос принят");
    } catch {
      toast.error("Ошибка");
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      await apiPost(`/follow-requests/${requestId}/reject`);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch {
      toast.error("Ошибка");
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "like": return "Heart";
      case "comment": return "MessageCircle";
      case "follow": return "UserPlus";
      case "repost": return "Repeat2";
      case "message": return "Mail";
      default: return "Bell";
    }
  };

  const getNotifText = (n: Notification) => {
    switch (n.type) {
      case "like": return "понравился ваш пост";
      case "comment": return "прокомментировал(а) ваш пост";
      case "follow": return "подписался(ась) на вас";
      case "repost": return "сделал(а) репост";
      case "message": return "отправил(а) вам сообщение";
      default: return n.text || "уведомление";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <Icon name="ArrowLeft" size={20} />
            </Button>
            <h1 className="font-semibold">Уведомления</h1>
          </div>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead}>
              <Icon name="CheckCheck" size={16} />
              Прочитать все
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Follow requests */}
            {requests.length > 0 && (
              <div className="border-b border-border/50">
                <div className="px-4 py-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">Запросы на подписку</h3>
                </div>
                {requests.map((req) => (
                  <div key={req.id} className="px-4 py-3 flex items-center gap-3 border-b border-border/30">
                    <Avatar
                      className="h-10 w-10 cursor-pointer"
                      onClick={() => navigate(`/profile/${req.from_user.username}`)}
                    >
                      <AvatarImage src={req.from_user.avatar_url} />
                      <AvatarFallback>{req.from_user.display_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{req.from_user.display_name}</span>
                      <p className="text-xs text-muted-foreground">@{req.from_user.username}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" onClick={() => acceptRequest(req.id)}>
                        Принять
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => rejectRequest(req.id)}>
                        Отклонить
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notifications */}
            {notifications.length === 0 && requests.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Icon name="BellOff" size={40} className="mx-auto mb-3 opacity-50" />
                <p>Пока нет уведомлений</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-muted/30 transition-colors ${
                      !n.is_read ? "bg-primary/5" : ""
                    }`}
                    onClick={() => {
                      if (n.post_id) navigate(`/post/${n.post_id}`);
                      else navigate(`/profile/${n.from_user.username}`);
                    }}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={n.from_user.avatar_url} />
                        <AvatarFallback>{n.from_user.display_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card flex items-center justify-center">
                        <Icon name={getNotifIcon(n.type)} size={12} className="text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-semibold">{n.from_user.display_name}</span>{" "}
                        <span className="text-muted-foreground">{getNotifText(n)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(n.created_at)}</p>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
