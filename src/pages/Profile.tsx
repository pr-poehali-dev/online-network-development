import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Icon from "@/components/ui/icon";
import VerificationBadge from "@/components/VerificationBadge";
import PostCard, { PostData } from "@/components/PostCard";
import AvatarGallery from "@/components/AvatarGallery";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPost, apiUpload } from "@/lib/api";
import { formatCount } from "@/lib/format";
import { toast } from "sonner";

interface ProfileUser {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  avatars: string[];
  is_private: boolean;
  verified: string;
  links: {
    telegram?: string;
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    website?: string;
  };
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_following: boolean;
  is_requested: boolean;
  is_own: boolean;
  created_at: string;
}

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("posts");
  const [showEdit, setShowEdit] = useState(false);
  const [showAvatarGallery, setShowAvatarGallery] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPrivate, setEditPrivate] = useState(false);
  const [editLinks, setEditLinks] = useState({
    telegram: "",
    instagram: "",
    tiktok: "",
    youtube: "",
    website: "",
  });
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    apiGet(`/users/${username}/profile`)
      .then((data) => {
        setProfile(data);
        setEditName(data.display_name || "");
        setEditBio(data.bio || "");
        setEditPrivate(data.is_private || false);
        setEditLinks({
          telegram: data.links?.telegram || "",
          instagram: data.links?.instagram || "",
          tiktok: data.links?.tiktok || "",
          youtube: data.links?.youtube || "",
          website: data.links?.website || "",
        });
      })
      .catch(() => {
        toast.error("Пользователь не найден");
      })
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    if (!username) return;
    const endpoint =
      tab === "likes" ? `/users/${username}/likes` :
      tab === "reposts" ? `/users/${username}/reposts` :
      tab === "releases" ? `/users/${username}/releases` :
      `/users/${username}/posts`;

    apiGet(endpoint)
      .then((data) => {
        setPosts(data.posts || data || []);
      })
      .catch(() => setPosts([]));
  }, [username, tab]);

  const handleFollow = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setFollowLoading(true);
    try {
      const res = await apiPost(`/users/${username}/follow`);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              is_following: res.following ?? false,
              is_requested: res.requested ?? false,
              followers_count: res.followers_count ?? prev.followers_count,
            }
          : prev
      );
    } catch {
      toast.error("Ошибка");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await apiPost("/users/me/update", {
        display_name: editName,
        bio: editBio,
        is_private: editPrivate,
        links: editLinks,
      });
      toast.success("Профиль обновлен");
      setShowEdit(false);
      refreshUser();
      // Refresh profile
      const data = await apiGet(`/users/${username}/profile`);
      setProfile(data);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await apiUpload("/users/me/avatar", formData);
      toast.success("Аватар обновлен");
      if (res.avatar_url && profile) {
        setProfile({ ...profile, avatar_url: res.avatar_url });
      }
      refreshUser();
    } catch {
      toast.error("Ошибка загрузки");
    }
    e.target.value = "";
  };

  const handleReport = async () => {
    try {
      await apiPost(`/users/${username}/report`, { reason: "Нарушение правил" });
      toast.success("Жалоба отправлена");
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleBlock = async () => {
    try {
      await apiPost(`/users/${username}/block`);
      toast.success("Пользователь заблокирован");
    } catch {
      toast.error("Ошибка");
    }
  };

  const copyProfileLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/profile/${username}`);
    toast.success("Ссылка скопирована");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <div className="max-w-lg mx-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            </div>
            <div className="h-16 bg-muted rounded" />
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background pb-16 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Icon name="UserX" size={48} className="mx-auto text-muted-foreground" />
          <p className="text-lg font-medium">Пользователь не найден</p>
          <Button variant="outline" onClick={() => navigate("/")}>
            На главную
          </Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  const canViewContent = !profile.is_private || profile.is_following || profile.is_own;

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <Icon name="ArrowLeft" size={20} />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-sm truncate">{profile.display_name}</h1>
            <p className="text-xs text-muted-foreground">{formatCount(profile.posts_count)} постов</p>
          </div>
          <Button variant="ghost" size="icon" onClick={copyProfileLink}>
            <Icon name="Share2" size={18} />
          </Button>
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        {/* Profile info */}
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar
                className="h-20 w-20 cursor-pointer"
                onClick={() => {
                  if (profile.avatars?.length > 0) {
                    setShowAvatarGallery(true);
                  }
                }}
              >
                <AvatarImage src={profile.avatar_url} alt={profile.username} />
                <AvatarFallback className="text-xl">{profile.display_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              {profile.is_own && (
                <label className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                  <Icon name="Camera" size={12} className="text-primary-foreground" />
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-lg font-bold">{profile.display_name}</h2>
                {profile.verified && profile.verified !== "none" && (
                  <VerificationBadge type={profile.verified} size={18} />
                )}
              </div>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>

              <div className="flex gap-4 mt-2">
                <div className="text-center">
                  <span className="text-sm font-semibold">{formatCount(profile.posts_count)}</span>
                  <p className="text-xs text-muted-foreground">постов</p>
                </div>
                <div className="text-center">
                  <span className="text-sm font-semibold">{formatCount(profile.followers_count)}</span>
                  <p className="text-xs text-muted-foreground">подписчиков</p>
                </div>
                <div className="text-center">
                  <span className="text-sm font-semibold">{formatCount(profile.following_count)}</span>
                  <p className="text-xs text-muted-foreground">подписок</p>
                </div>
              </div>
            </div>
          </div>

          {profile.bio && (
            <p className="text-sm whitespace-pre-wrap">{profile.bio}</p>
          )}

          {/* Links */}
          {profile.links && Object.values(profile.links).some(Boolean) && (
            <div className="flex flex-wrap gap-2">
              {profile.links.telegram && (
                <a href={`https://t.me/${profile.links.telegram}`} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Icon name="Send" size={12} /> {profile.links.telegram}
                </a>
              )}
              {profile.links.instagram && (
                <a href={`https://instagram.com/${profile.links.instagram}`} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Icon name="Instagram" size={12} /> {profile.links.instagram}
                </a>
              )}
              {profile.links.youtube && (
                <a href={profile.links.youtube} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Icon name="Youtube" size={12} /> YouTube
                </a>
              )}
              {profile.links.website && (
                <a href={profile.links.website} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Icon name="Globe" size={12} /> {profile.links.website}
                </a>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {profile.is_own ? (
              <>
                <Button variant="outline" className="flex-1" onClick={() => setShowEdit(true)}>
                  <Icon name="Pencil" size={16} />
                  Редактировать
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigate("/settings")}>
                  <Icon name="Settings" size={16} />
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="flex-1"
                  variant={profile.is_following ? "outline" : "default"}
                  onClick={handleFollow}
                  disabled={followLoading}
                >
                  {profile.is_requested
                    ? "Запрос отправлен"
                    : profile.is_following
                    ? "Отписаться"
                    : "Подписаться"}
                </Button>
                {user && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate(`/messages/${profile.id}`)}
                  >
                    <Icon name="MessageCircle" size={16} />
                  </Button>
                )}
                {user && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-10 w-10" onClick={handleReport} title="Пожаловаться">
                      <Icon name="Flag" size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10" onClick={handleBlock} title="Заблокировать">
                      <Icon name="Ban" size={16} />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {canViewContent ? (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full rounded-none border-b border-border/50 bg-transparent h-auto p-0">
              <TabsTrigger value="posts" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3">
                Посты
              </TabsTrigger>
              <TabsTrigger value="likes" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3">
                Лайки
              </TabsTrigger>
              <TabsTrigger value="reposts" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3">
                Репосты
              </TabsTrigger>
              {profile.verified === "artist" && (
                <TabsTrigger value="releases" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3">
                  Релизы
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value={tab} className="mt-0">
              <div className="divide-y divide-border/30">
                {posts.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>Пока ничего нет</p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <PostCard key={post.id} post={post} onUpdate={() => {
                      apiGet(`/users/${username}/posts`).then((data) => setPosts(data.posts || data || []));
                    }} />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="p-12 text-center space-y-3">
            <Icon name="Lock" size={48} className="mx-auto text-muted-foreground" />
            <h3 className="font-semibold">Закрытый профиль</h3>
            <p className="text-sm text-muted-foreground">
              Подпишитесь, чтобы видеть публикации
            </p>
          </div>
        )}
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать профиль</DialogTitle>
            <DialogDescription>Измените информацию о себе</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Имя</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">О себе</label>
              <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Приватный аккаунт</label>
              <Switch checked={editPrivate} onCheckedChange={setEditPrivate} />
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Ссылки</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon name="Send" size={16} className="text-muted-foreground shrink-0" />
                  <Input
                    placeholder="Telegram username"
                    value={editLinks.telegram}
                    onChange={(e) => setEditLinks((prev) => ({ ...prev, telegram: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Instagram" size={16} className="text-muted-foreground shrink-0" />
                  <Input
                    placeholder="Instagram username"
                    value={editLinks.instagram}
                    onChange={(e) => setEditLinks((prev) => ({ ...prev, instagram: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Music" size={16} className="text-muted-foreground shrink-0" />
                  <Input
                    placeholder="TikTok username"
                    value={editLinks.tiktok}
                    onChange={(e) => setEditLinks((prev) => ({ ...prev, tiktok: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Youtube" size={16} className="text-muted-foreground shrink-0" />
                  <Input
                    placeholder="YouTube ссылка"
                    value={editLinks.youtube}
                    onChange={(e) => setEditLinks((prev) => ({ ...prev, youtube: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Globe" size={16} className="text-muted-foreground shrink-0" />
                  <Input
                    placeholder="Веб-сайт"
                    value={editLinks.website}
                    onChange={(e) => setEditLinks((prev) => ({ ...prev, website: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Avatar Gallery */}
      {showAvatarGallery && profile.avatars?.length > 0 && (
        <AvatarGallery
          images={profile.avatars}
          onClose={() => setShowAvatarGallery(false)}
        />
      )}

      <BottomNav />
    </div>
  );
}
