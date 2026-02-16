import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Icon from "@/components/ui/icon";
import PostCard, { PostData } from "@/components/PostCard";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPost, apiUpload } from "@/lib/api";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const LOGO_URL = "https://cdn.poehali.dev/files/e55b3f68-edb3-4e23-991f-a41fe217fb1d.png";

export default function Feed() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [newMedia, setNewMedia] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = useCallback(async (pageNum: number, append = false) => {
    try {
      const data = await apiGet(`/posts/feed?page=${pageNum}&limit=20`);
      const postsList = data.posts || data || [];
      if (append) {
        setPosts((prev) => [...prev, ...postsList]);
      } else {
        setPosts(postsList);
      }
      setHasMore(postsList.length === 20);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = page + 1;
    setPage(next);
    fetchPosts(next, true);
  };

  const handlePost = async () => {
    if (!newContent.trim() && newMedia.length === 0) return;
    setPosting(true);
    try {
      await apiPost("/posts/create", { content: newContent.trim(), media: newMedia });
      toast.success("Пост опубликован");
      setNewContent("");
      setNewMedia([]);
      setPage(1);
      fetchPosts(1);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setPosting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append("file", files[i]);
      try {
        const res = await apiUpload("/upload", formData);
        if (res.url) {
          setNewMedia((prev) => [...prev, res.url]);
        }
      } catch {
        toast.error("Ошибка загрузки");
      }
    }
    e.target.value = "";
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Buzzy" className="w-8 h-8" />
            <h1 className="text-xl font-bold">Buzzy</h1>
          </div>
          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/notifications")}
            >
              <Icon name="Bell" size={22} />
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        {/* Auth prompt for guests */}
        {!user && (
          <div className="p-4 border-b border-border/50">
            <div className="text-center space-y-3 py-4">
              <h2 className="text-lg font-semibold">Добро пожаловать в Buzzy</h2>
              <p className="text-sm text-muted-foreground">
                Присоединяйтесь к сообществу, делитесь мыслями и общайтесь
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => navigate("/login")}>Войти</Button>
                <Button variant="outline" onClick={() => navigate("/register")}>
                  Регистрация
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create post area */}
        {user && (
          <div className="p-4 border-b border-border/50">
            <div className="flex gap-3">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={user.avatar_url} alt={user.username} />
                <AvatarFallback>{user.display_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Что у вас нового?"
                  rows={2}
                  className="resize-none min-h-[60px]"
                />
                {newMedia.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {newMedia.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} alt="" className="w-16 h-16 object-cover rounded-md" />
                        <button
                          className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setNewMedia((prev) => prev.filter((_, idx) => idx !== i))}
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <div className="p-2 hover:bg-muted rounded-md transition-colors">
                      <Icon name="Image" size={20} className="text-primary" />
                    </div>
                  </label>
                  <Button
                    size="sm"
                    onClick={handlePost}
                    disabled={posting || (!newContent.trim() && newMedia.length === 0)}
                  >
                    {posting ? "..." : "Опубликовать"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Posts */}
        <div className="divide-y divide-border/30">
          {loading ? (
            <div className="space-y-4 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse space-y-3">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-muted rounded" />
                      <div className="h-3 w-full bg-muted rounded" />
                      <div className="h-3 w-2/3 bg-muted rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Icon name="FileText" size={40} className="mx-auto mb-3 opacity-50" />
              <p>Пока нет постов</p>
              {user && <p className="text-sm mt-1">Будьте первым, кто напишет!</p>}
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onUpdate={() => {
                    setPage(1);
                    fetchPosts(1);
                  }}
                />
              ))}
              {hasMore && (
                <div className="p-4 text-center">
                  <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? "Загрузка..." : "Загрузить еще"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
