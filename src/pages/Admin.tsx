import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/lib/auth";
import { apiGet, apiPost, apiUpload } from "@/lib/api";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";

interface AdminStats {
  total_users: number;
  total_posts: number;
  pending_reports: number;
  pending_verifications: number;
  pending_appeals: number;
}

interface Report {
  id: string;
  type: string;
  target_id: string;
  reason: string;
  from_username: string;
  target_username?: string;
  created_at: string;
}

interface Verification {
  id: string;
  username: string;
  type: string;
  reason: string;
  created_at: string;
}

interface Appeal {
  id: string;
  username: string;
  text: string;
  created_at: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [tab, setTab] = useState("stats");

  // Block user form
  const [blockUsername, setBlockUsername] = useState("");
  const [blockReason, setBlockReason] = useState("");

  // Add release form
  const [releaseUsername, setReleaseUsername] = useState("");
  const [releaseTitle, setReleaseTitle] = useState("");
  const [releaseArtist, setReleaseArtist] = useState("");
  const [releaseCoverUrl, setReleaseCoverUrl] = useState("");

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    loadData();
  }, [isAdmin, navigate]);

  const loadData = async () => {
    try {
      const [statsData, reportsData, verifData, appealsData] = await Promise.all([
        apiGet("/admin/stats").catch(() => null),
        apiGet("/admin/reports").catch(() => ({ reports: [] })),
        apiGet("/admin/verifications").catch(() => ({ verifications: [] })),
        apiGet("/admin/appeals").catch(() => ({ appeals: [] })),
      ]);
      if (statsData) setStats(statsData);
      setReports(reportsData.reports || reportsData || []);
      setVerifications(verifData.verifications || verifData || []);
      setAppeals(appealsData.appeals || appealsData || []);
    } catch {
      // silent
    }
  };

  const handleBlockUser = async () => {
    if (!blockUsername.trim()) return;
    try {
      await apiPost("/admin/block-user", {
        username: blockUsername.trim(),
        reason: blockReason.trim(),
      });
      toast.success(`Пользователь ${blockUsername} заблокирован`);
      setBlockUsername("");
      setBlockReason("");
      loadData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    }
  };

  const handleReportAction = async (reportId: string, action: "accept" | "reject") => {
    try {
      await apiPost(`/admin/reports/${reportId}/${action}`);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      toast.success(action === "accept" ? "Жалоба принята" : "Жалоба отклонена");
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleVerificationAction = async (verifId: string, action: "accept" | "reject") => {
    try {
      await apiPost(`/admin/verifications/${verifId}/${action}`);
      setVerifications((prev) => prev.filter((v) => v.id !== verifId));
      toast.success(action === "accept" ? "Верификация одобрена" : "Верификация отклонена");
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleAppealAction = async (appealId: string, action: "accept" | "reject") => {
    try {
      await apiPost(`/admin/appeals/${appealId}/${action}`);
      setAppeals((prev) => prev.filter((a) => a.id !== appealId));
      toast.success(action === "accept" ? "Апелляция принята" : "Апелляция отклонена");
    } catch {
      toast.error("Ошибка");
    }
  };

  const handleAddRelease = async () => {
    if (!releaseUsername.trim() || !releaseTitle.trim()) return;
    try {
      await apiPost("/admin/releases/add", {
        username: releaseUsername.trim(),
        title: releaseTitle.trim(),
        artist: releaseArtist.trim(),
        cover_url: releaseCoverUrl.trim(),
      });
      toast.success("Релиз добавлен");
      setReleaseUsername("");
      setReleaseTitle("");
      setReleaseArtist("");
      setReleaseCoverUrl("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await apiUpload("/upload", formData);
      if (res.url) setReleaseCoverUrl(res.url);
    } catch {
      toast.error("Ошибка загрузки");
    }
    e.target.value = "";
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <Icon name="ArrowLeft" size={20} />
          </Button>
          <h1 className="font-semibold">Панель администратора</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full overflow-x-auto flex flex-nowrap">
            <TabsTrigger value="stats" className="flex-1">
              <Icon name="BarChart3" size={14} className="mr-1" />
              Статистика
            </TabsTrigger>
            <TabsTrigger value="block" className="flex-1">
              <Icon name="Ban" size={14} className="mr-1" />
              Блокировка
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-1">
              <Icon name="Flag" size={14} className="mr-1" />
              Жалобы
              {reports.length > 0 && <Badge className="ml-1 h-4 text-[10px]">{reports.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="verifications" className="flex-1">
              <Icon name="BadgeCheck" size={14} className="mr-1" />
              Верификации
            </TabsTrigger>
            <TabsTrigger value="appeals" className="flex-1">
              <Icon name="FileText" size={14} className="mr-1" />
              Апелляции
            </TabsTrigger>
            <TabsTrigger value="releases" className="flex-1">
              <Icon name="Music" size={14} className="mr-1" />
              Релизы
            </TabsTrigger>
          </TabsList>

          {/* Stats */}
          <TabsContent value="stats">
            {stats && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                {[
                  { label: "Пользователей", value: stats.total_users, icon: "Users" },
                  { label: "Постов", value: stats.total_posts, icon: "FileText" },
                  { label: "Жалоб", value: stats.pending_reports, icon: "Flag" },
                  { label: "Верификаций", value: stats.pending_verifications, icon: "BadgeCheck" },
                  { label: "Апелляций", value: stats.pending_appeals, icon: "FileText" },
                ].map((s) => (
                  <Card key={s.label}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon name={s.icon} size={20} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Block user */}
          <TabsContent value="block">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Заблокировать пользователя</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  value={blockUsername}
                  onChange={(e) => setBlockUsername(e.target.value)}
                  placeholder="Имя пользователя"
                />
                <Textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Причина блокировки"
                  rows={3}
                />
                <Button onClick={handleBlockUser} variant="destructive" disabled={!blockUsername.trim()}>
                  <Icon name="Ban" size={16} />
                  Заблокировать
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports">
            <div className="mt-4 space-y-3">
              {reports.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Нет жалоб</p>
              ) : (
                reports.map((r) => (
                  <Card key={r.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm">
                            <span className="font-semibold">{r.from_username}</span>{" "}
                            <span className="text-muted-foreground">жалуется на</span>{" "}
                            <span className="font-semibold">{r.target_username || r.target_id}</span>
                          </p>
                          <p className="text-sm mt-1">{r.reason}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatDate(r.created_at)}</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <Button size="sm" onClick={() => handleReportAction(r.id, "accept")}>
                            Принять
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleReportAction(r.id, "reject")}>
                            Отклонить
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Verifications */}
          <TabsContent value="verifications">
            <div className="mt-4 space-y-3">
              {verifications.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Нет заявок</p>
              ) : (
                verifications.map((v) => (
                  <Card key={v.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{v.username}</span>
                            <Badge variant="secondary" className="text-xs">
                              {v.type === "artist" ? "Артист" : "Стандартная"}
                            </Badge>
                          </div>
                          <p className="text-sm mt-1 text-muted-foreground">{v.reason}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatDate(v.created_at)}</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <Button size="sm" onClick={() => handleVerificationAction(v.id, "accept")}>
                            Одобрить
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleVerificationAction(v.id, "reject")}>
                            Отклонить
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Appeals */}
          <TabsContent value="appeals">
            <div className="mt-4 space-y-3">
              {appeals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Нет апелляций</p>
              ) : (
                appeals.map((a) => (
                  <Card key={a.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-semibold text-sm">{a.username}</span>
                          <p className="text-sm mt-1">{a.text}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatDate(a.created_at)}</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <Button size="sm" onClick={() => handleAppealAction(a.id, "accept")}>
                            Принять
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleAppealAction(a.id, "reject")}>
                            Отклонить
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Releases */}
          <TabsContent value="releases">
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Добавить релиз</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  value={releaseUsername}
                  onChange={(e) => setReleaseUsername(e.target.value)}
                  placeholder="Имя пользователя артиста"
                />
                <Input
                  value={releaseTitle}
                  onChange={(e) => setReleaseTitle(e.target.value)}
                  placeholder="Название релиза"
                />
                <Input
                  value={releaseArtist}
                  onChange={(e) => setReleaseArtist(e.target.value)}
                  placeholder="Имя артиста"
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium">Обложка</label>
                  {releaseCoverUrl && (
                    <img src={releaseCoverUrl} alt="cover" className="w-24 h-24 object-cover rounded-lg" />
                  )}
                  <Input type="file" accept="image/*" onChange={handleCoverUpload} />
                </div>
                <Button
                  onClick={handleAddRelease}
                  disabled={!releaseUsername.trim() || !releaseTitle.trim()}
                >
                  <Icon name="Plus" size={16} />
                  Добавить релиз
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
