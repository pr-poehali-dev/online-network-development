import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/auth";
import { apiPost } from "@/lib/api";
import { themes, getStoredTheme, setStoredTheme, ThemeKey } from "@/lib/theme";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>(getStoredTheme());
  const [showVerify, setShowVerify] = useState(false);
  const [verifyType, setVerifyType] = useState("standard");
  const [verifyReason, setVerifyReason] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  // Privacy settings
  const [privacy, setPrivacy] = useState(user?.privacy || {
    who_sees_likes: "everyone",
    who_sees_reposts: "everyone",
    who_sees_followers: "everyone",
    who_sees_following: "everyone",
    who_sees_friends: "everyone",
    who_can_message: "everyone",
  });

  const handleThemeChange = (theme: ThemeKey) => {
    setCurrentTheme(theme);
    setStoredTheme(theme);
    // Save to backend
    apiPost("/users/me/theme", { theme }).catch(() => {});
  };

  const handlePrivacyChange = async (key: string, value: string) => {
    const updated = { ...privacy, [key]: value };
    setPrivacy(updated);
    try {
      await apiPost("/users/me/privacy", updated);
    } catch {
      toast.error("Ошибка сохранения");
    }
  };

  const handleRequestVerify = async () => {
    try {
      await apiPost("/verification/request", {
        type: verifyType,
        reason: verifyReason,
      });
      toast.success("Запрос на верификацию отправлен");
      setShowVerify(false);
      setVerifyReason("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await apiPost("/users/me/delete");
      toast.success("Аккаунт удален");
      logout();
      navigate("/");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const privacyOptions = [
    { value: "everyone", label: "Все" },
    { value: "followers", label: "Подписчики" },
    { value: "nobody", label: "Никто" },
  ];

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <Icon name="ArrowLeft" size={20} />
          </Button>
          <h1 className="font-semibold">Настройки</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Theme */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Icon name="Palette" size={18} />
              Тема оформления
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.key}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    currentTheme === theme.key
                      ? "border-primary"
                      : "border-border hover:border-border/80"
                  }`}
                  onClick={() => handleThemeChange(theme.key)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.bg }} />
                    <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: theme.card }} />
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.primary }} />
                  </div>
                  <p className="text-xs font-medium text-left">{theme.name}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Icon name="Shield" size={18} />
              Конфиденциальность
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "who_sees_likes", label: "Кто видит лайки" },
              { key: "who_sees_reposts", label: "Кто видит репосты" },
              { key: "who_sees_followers", label: "Кто видит подписчиков" },
              { key: "who_sees_following", label: "Кто видит подписки" },
              { key: "who_sees_friends", label: "Кто видит друзей" },
              { key: "who_can_message", label: "Кто может писать" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm">{label}</span>
                <Select
                  value={(privacy as Record<string, string>)[key] || "everyone"}
                  onValueChange={(v) => handlePrivacyChange(key, v)}
                >
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {privacyOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Verification */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Icon name="BadgeCheck" size={18} />
              Верификация
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Получите значок подтверждения для вашего аккаунта
            </p>
            <Button variant="outline" onClick={() => setShowVerify(true)} className="w-full">
              Запросить верификацию
            </Button>
          </CardContent>
        </Card>

        {/* Account actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Icon name="Settings" size={18} />
              Аккаунт
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
              <Icon name="LogOut" size={16} />
              Выйти из аккаунта
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={() => setShowDelete(true)}
            >
              <Icon name="Trash2" size={16} />
              Удалить аккаунт
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Verification dialog */}
      <Dialog open={showVerify} onOpenChange={setShowVerify}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Запрос верификации</DialogTitle>
            <DialogDescription>Выберите тип и опишите причину</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={verifyType} onValueChange={setVerifyType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Стандартная верификация</SelectItem>
                <SelectItem value="artist">Верификация артиста</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              value={verifyReason}
              onChange={(e) => setVerifyReason(e.target.value)}
              placeholder="Почему вы хотите верификацию?"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerify(false)}>
              Отмена
            </Button>
            <Button onClick={handleRequestVerify} disabled={!verifyReason.trim()}>
              Отправить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete account dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить аккаунт</DialogTitle>
            <DialogDescription>
              Это действие необратимо. Все ваши данные будут удалены навсегда.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Удалить навсегда
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
