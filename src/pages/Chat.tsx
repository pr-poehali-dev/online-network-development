import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Icon from "@/components/ui/icon";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Message {
  id: string;
  sender_id: string;
  text: string;
  is_edited: boolean;
  is_pinned: boolean;
  reply_to?: {
    id: string;
    text: string;
    sender_name: string;
  };
  created_at: string;
}

interface ChatUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

export default function Chat() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = async () => {
    try {
      const data = await apiGet(`/messages/${userId}`);
      setMessages(data.messages || data || []);
      setChatUser(data.user || null);
      setPinnedMessages((data.messages || []).filter((m: Message) => m.is_pinned));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchMessages();

    // Mark as read
    apiPost("/messages/read", { user_id: userId }).catch(() => {});

    // Poll for new messages
    intervalRef.current = setInterval(fetchMessages, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      if (editingId) {
        await apiPost("/messages/edit", { message_id: editingId, content: text.trim() });
        setEditingId(null);
      } else {
        await apiPost("/messages/send", {
          receiver_id: userId,
          content: text.trim(),
          reply_to_id: replyTo?.id,
        });
      }
      setText("");
      setReplyTo(null);
      fetchMessages();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msgId: string) => {
    try {
      await apiPost("/messages/hide", { message_id: msgId });
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const handlePin = async (msgId: string) => {
    try {
      await apiPost(`/messages/${msgId}/pin`);
      fetchMessages();
      toast.success("Сообщение закреплено");
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleCopy = (msgText: string) => {
    navigator.clipboard.writeText(msgText);
    toast.success("Скопировано");
  };

  const startEdit = (msg: Message) => {
    setEditingId(msg.id);
    setText(msg.text);
    setReplyTo(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/messages")}>
            <Icon name="ArrowLeft" size={20} />
          </Button>
          {chatUser && (
            <div
              className="flex items-center gap-3 flex-1 cursor-pointer"
              onClick={() => navigate(`/profile/${chatUser.username}`)}
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={chatUser.avatar_url} alt={chatUser.username} />
                <AvatarFallback>{chatUser.display_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-semibold text-sm">{chatUser.display_name}</h1>
                <p className="text-xs text-muted-foreground">@{chatUser.username}</p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Pinned messages */}
      {pinnedMessages.length > 0 && (
        <div className="max-w-lg mx-auto w-full bg-card/50 border-b border-border/50 px-4 py-2">
          <div className="flex items-center gap-2 text-xs">
            <Icon name="Pin" size={12} className="text-primary" />
            <span className="text-muted-foreground truncate">{pinnedMessages[0].text}</span>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto max-w-lg mx-auto w-full">
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`animate-pulse flex ${i % 2 === 0 ? "justify-end" : ""}`}>
                  <div className="h-10 w-48 bg-muted rounded-xl" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Icon name="MessageCircle" size={40} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Нет сообщений</p>
              <p className="text-xs mt-1">Начните переписку!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2 cursor-pointer ${
                          isOwn
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-card border border-border/50 rounded-bl-md"
                        }`}
                      >
                        {msg.reply_to && (
                          <div className={`text-xs mb-1 pb-1 border-b ${isOwn ? "border-primary-foreground/20 opacity-75" : "border-border opacity-60"}`}>
                            <span className="font-medium">{msg.reply_to.sender_name}</span>
                            <p className="truncate">{msg.reply_to.text}</p>
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? "justify-end" : ""}`}>
                          <span className={`text-[10px] ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                            {formatDate(msg.created_at)}
                          </span>
                          {msg.is_edited && (
                            <span className={`text-[10px] ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                              (ред.)
                            </span>
                          )}
                        </div>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setReplyTo(msg)}>
                        <Icon name="Reply" size={14} className="mr-2" />
                        Ответить
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopy(msg.text)}>
                        <Icon name="Copy" size={14} className="mr-2" />
                        Копировать
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePin(msg.id)}>
                        <Icon name="Pin" size={14} className="mr-2" />
                        {msg.is_pinned ? "Открепить" : "Закрепить"}
                      </DropdownMenuItem>
                      {isOwn && (
                        <>
                          <DropdownMenuItem onClick={() => startEdit(msg)}>
                            <Icon name="Pencil" size={14} className="mr-2" />
                            Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(msg.id)} className="text-destructive">
                            <Icon name="Trash2" size={14} className="mr-2" />
                            Удалить
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Reply bar */}
      {replyTo && (
        <div className="max-w-lg mx-auto w-full bg-card border-t border-border/50 px-4 py-2 flex items-center gap-2">
          <Icon name="Reply" size={14} className="text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{replyTo.text}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setReplyTo(null)}>
            <Icon name="X" size={14} />
          </Button>
        </div>
      )}

      {/* Edit bar */}
      {editingId && (
        <div className="max-w-lg mx-auto w-full bg-card border-t border-border/50 px-4 py-2 flex items-center gap-2">
          <Icon name="Pencil" size={14} className="text-primary shrink-0" />
          <span className="text-xs text-muted-foreground">Редактирование</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-auto"
            onClick={() => {
              setEditingId(null);
              setText("");
            }}
          >
            <Icon name="X" size={14} />
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm border-t border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Сообщение..."
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={sending || !text.trim()}
          >
            <Icon name="Send" size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}