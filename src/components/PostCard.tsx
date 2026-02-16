import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import VerificationBadge from "@/components/VerificationBadge";
import { formatDate, formatCount } from "@/lib/format";
import { apiPost } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostData {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  verified: string;
  content: string;
  media: string[];
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  views_count: number;
  is_liked: boolean;
  is_reposted: boolean;
  repost_of?: {
    username: string;
    display_name: string;
  };
  created_at: string;
}

interface PostCardProps {
  post: PostData;
  onUpdate?: () => void;
}

export default function PostCard({ post, onUpdate }: PostCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [reposted, setReposted] = useState(post.is_reposted);
  const [repostsCount, setRepostsCount] = useState(post.reposts_count);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      const res = await apiPost(`/posts/${post.id}/like`);
      setLiked(res.liked);
      setLikesCount(res.likes_count);
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      const res = await apiPost(`/posts/${post.id}/repost`);
      setReposted(res.reposted);
      setRepostsCount(res.reposts_count);
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleDelete = async () => {
    try {
      await apiPost(`/posts/${post.id}/delete`);
      toast.success("Пост удален");
      onUpdate?.();
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  const handleReport = async () => {
    try {
      await apiPost(`/posts/${post.id}/report`, { reason: "Нарушение правил" });
      toast.success("Жалоба отправлена");
    } catch {
      toast.error("Ошибка");
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    toast.success("Ссылка скопирована");
  };

  return (
    <Card
      className="p-4 cursor-pointer hover:bg-muted/30 transition-colors border-border/50"
      onClick={() => navigate(`/post/${post.id}`)}
    >
      {post.repost_of && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2 pl-10">
          <Icon name="Repeat2" size={14} />
          <span>{post.repost_of.display_name} сделал(а) репост</span>
        </div>
      )}

      <div className="flex gap-3">
        <Avatar
          className="h-10 w-10 cursor-pointer shrink-0"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            navigate(`/profile/${post.username}`);
          }}
        >
          <AvatarImage src={post.avatar_url} alt={post.username} />
          <AvatarFallback>{post.display_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="font-semibold text-sm hover:underline cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${post.username}`);
              }}
            >
              {post.display_name}
            </span>
            {post.verified && post.verified !== "none" && (
              <VerificationBadge type={post.verified} size={14} />
            )}
            <span className="text-xs text-muted-foreground">@{post.username}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{formatDate(post.created_at)}</span>

            <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Icon name="MoreHorizontal" size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={copyLink}>
                    <Icon name="Link" size={14} className="mr-2" />
                    Копировать ссылку
                  </DropdownMenuItem>
                  {user && user.id === post.user_id && (
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      <Icon name="Trash2" size={14} className="mr-2" />
                      Удалить
                    </DropdownMenuItem>
                  )}
                  {user && user.id !== post.user_id && (
                    <DropdownMenuItem onClick={handleReport} className="text-destructive">
                      <Icon name="Flag" size={14} className="mr-2" />
                      Пожаловаться
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {post.content && (
            <p className="text-sm mt-1.5 whitespace-pre-wrap break-words">{post.content}</p>
          )}

          {post.media && post.media.length > 0 && (
            <div className={`mt-3 grid gap-1 rounded-lg overflow-hidden ${
              post.media.length === 1 ? "grid-cols-1" :
              post.media.length === 2 ? "grid-cols-2" :
              post.media.length === 3 ? "grid-cols-2" : "grid-cols-2"
            }`}>
              {post.media.map((url, i) => (
                <div key={i} className={`relative ${post.media.length === 3 && i === 0 ? "row-span-2" : ""}`}>
                  {url.match(/\.(mp4|webm|mov)$/i) ? (
                    <video
                      src={url}
                      controls
                      className="w-full h-full object-cover rounded-lg max-h-[400px]"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover rounded-lg max-h-[400px]"
                      loading="lazy"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1 mt-3 -ml-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-2 gap-1.5 text-xs ${liked ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500"}`}
              onClick={handleLike}
            >
              <Icon name={liked ? "Heart" : "Heart"} size={16} className={liked ? "fill-current" : ""} />
              {likesCount > 0 && formatCount(likesCount)}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 gap-1.5 text-xs text-muted-foreground hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/post/${post.id}`);
              }}
            >
              <Icon name="MessageCircle" size={16} />
              {post.comments_count > 0 && formatCount(post.comments_count)}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={`h-8 px-2 gap-1.5 text-xs ${reposted ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
              onClick={handleRepost}
            >
              <Icon name="Repeat2" size={16} />
              {repostsCount > 0 && formatCount(repostsCount)}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 gap-1.5 text-xs text-muted-foreground"
              disabled
            >
              <Icon name="Eye" size={16} />
              {post.views_count > 0 && formatCount(post.views_count)}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export type { PostData };
