import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import VerificationBadge from "@/components/VerificationBadge";
import PostCard, { PostData } from "@/components/PostCard";
import BottomNav from "@/components/BottomNav";
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

interface Comment {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  verified: string;
  text: string;
  likes_count: number;
  is_liked: boolean;
  is_author_liked: boolean;
  is_pinned: boolean;
  reply_to_id?: string;
  replies?: Comment[];
  created_at: string;
}

export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<PostData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [posting, setPosting] = useState(false);

  const fetchPost = async () => {
    try {
      const data = await apiGet(`/posts/${id}`);
      setPost(data.post || data);
      setComments(data.comments || []);
    } catch {
      toast.error("Пост не найден");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchPost();
  }, [id]);

  const handleComment = async () => {
    if (!commentText.trim() || !user) return;
    setPosting(true);
    try {
      await apiPost(`/posts/${id}/comment`, {
        text: commentText.trim(),
        reply_to_id: replyTo?.id,
      });
      setCommentText("");
      setReplyTo(null);
      fetchPost();
      toast.success("Комментарий добавлен");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setPosting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const res = await apiPost(`/comments/${commentId}/like`);
      setComments((prev) =>
        updateCommentsTree(prev, commentId, (c) => ({
          ...c,
          is_liked: res.liked,
          likes_count: res.likes_count,
        }))
      );
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await apiPost(`/comments/${commentId}/delete`);
      fetchPost();
      toast.success("Комментарий удален");
    } catch {
      toast.error("Ошибка");
    }
  };

  const handlePinComment = async (commentId: string) => {
    try {
      await apiPost(`/comments/${commentId}/pin`);
      fetchPost();
    } catch {
      toast.error("Ошибка");
    }
  };

  function updateCommentsTree(comments: Comment[], id: string, updater: (c: Comment) => Comment): Comment[] {
    return comments.map((c) => {
      if (c.id === id) return updater(c);
      if (c.replies) return { ...c, replies: updateCommentsTree(c.replies, id, updater) };
      return c;
    });
  }

  const renderComment = (comment: Comment, depth = 0) => (
    <div key={comment.id} className={`${depth > 0 ? "ml-8 border-l border-border/30 pl-3" : ""}`}>
      <div className={`py-3 ${comment.is_pinned ? "bg-primary/5 -mx-2 px-2 rounded-lg" : ""}`}>
        {comment.is_pinned && (
          <div className="flex items-center gap-1 text-xs text-primary mb-1">
            <Icon name="Pin" size={10} />
            <span>Закрепленный</span>
          </div>
        )}
        <div className="flex gap-2.5">
          <Avatar
            className="h-8 w-8 cursor-pointer shrink-0"
            onClick={() => navigate(`/profile/${comment.username}`)}
          >
            <AvatarImage src={comment.avatar_url} alt={comment.username} />
            <AvatarFallback className="text-xs">{comment.display_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <span
                className="font-semibold text-xs hover:underline cursor-pointer"
                onClick={() => navigate(`/profile/${comment.username}`)}
              >
                {comment.display_name}
              </span>
              {comment.verified && comment.verified !== "none" && (
                <VerificationBadge type={comment.verified} size={12} />
              )}
              <span className="text-[10px] text-muted-foreground">{formatDate(comment.created_at)}</span>
              {comment.is_author_liked && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1">
                  <Icon name="Heart" size={8} className="mr-0.5 fill-red-500 text-red-500" />
                  автор
                </Badge>
              )}
            </div>
            <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">{comment.text}</p>
            <div className="flex items-center gap-2 mt-1">
              <button
                className={`flex items-center gap-1 text-xs transition-colors ${
                  comment.is_liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                }`}
                onClick={() => handleLikeComment(comment.id)}
              >
                <Icon name="Heart" size={12} className={comment.is_liked ? "fill-current" : ""} />
                {comment.likes_count > 0 && comment.likes_count}
              </button>
              {user && (
                <button
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setReplyTo(comment)}
                >
                  Ответить
                </button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <Icon name="MoreHorizontal" size={14} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {user && post && user.id === post.user_id && (
                    <DropdownMenuItem onClick={() => handlePinComment(comment.id)}>
                      <Icon name="Pin" size={14} className="mr-2" />
                      {comment.is_pinned ? "Открепить" : "Закрепить"}
                    </DropdownMenuItem>
                  )}
                  {user && (user.id === comment.user_id || (post && user.id === post.user_id)) && (
                    <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)} className="text-destructive">
                      <Icon name="Trash2" size={14} className="mr-2" />
                      Удалить
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
      {comment.replies?.map((reply) => renderComment(reply, depth + 1))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <div className="max-w-lg mx-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
                <div className="h-3 w-2/3 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background pb-16 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Icon name="FileX" size={48} className="mx-auto text-muted-foreground" />
          <p className="text-lg font-medium">Пост не найден</p>
          <Button variant="outline" onClick={() => navigate("/")}>
            На главную
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <Icon name="ArrowLeft" size={20} />
          </Button>
          <h1 className="font-semibold">Пост</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        {/* Post */}
        <PostCard post={post} onUpdate={fetchPost} />

        {/* Comment input */}
        {user && (
          <div className="p-4 border-t border-border/50">
            {replyTo && (
              <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                <Icon name="Reply" size={12} />
                <span>Ответ для {replyTo.display_name}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto" onClick={() => setReplyTo(null)}>
                  <Icon name="X" size={12} />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={user.avatar_url} alt={user.username} />
                <AvatarFallback className="text-xs">{user.display_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={replyTo ? `Ответ @${replyTo.username}...` : "Написать комментарий..."}
                rows={2}
                className="resize-none min-h-[40px] flex-1"
              />
              <Button
                size="icon"
                onClick={handleComment}
                disabled={posting || !commentText.trim()}
              >
                <Icon name="Send" size={16} />
              </Button>
            </div>
          </div>
        )}

        {!user && (
          <div className="p-4 text-center border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-2">Войдите, чтобы оставлять комментарии</p>
            <Button size="sm" onClick={() => navigate("/login")}>Войти</Button>
          </div>
        )}

        {/* Comments */}
        <div className="px-4 pb-4">
          <h3 className="text-sm font-semibold py-3 border-b border-border/30">
            Комментарии ({comments.length})
          </h3>
          {comments.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p className="text-sm">Пока нет комментариев</p>
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {comments.map((c) => renderComment(c))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
