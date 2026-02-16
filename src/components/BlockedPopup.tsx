import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/lib/auth";
import { apiPost } from "@/lib/api";
import { toast } from "sonner";

export default function BlockedPopup() {
  const { blockReason, logout } = useAuth();
  const [showAppeal, setShowAppeal] = useState(false);
  const [appealText, setAppealText] = useState("");
  const [sending, setSending] = useState(false);

  const handleAppeal = async () => {
    if (!appealText.trim()) return;
    setSending(true);
    try {
      await apiPost("/appeal", { text: appealText });
      toast.success("Апелляция отправлена");
      setShowAppeal(false);
      setAppealText("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка отправки");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10">
          <Icon name="ShieldAlert" size={40} className="text-destructive" />
        </div>

        <h1 className="text-xl font-semibold">Вы были удалены из платформы Buzzy</h1>

        {blockReason && (
          <div className="p-4 rounded-lg bg-card border">
            <p className="text-sm text-muted-foreground">Причина:</p>
            <p className="mt-1 font-medium">{blockReason}</p>
          </div>
        )}

        {!showAppeal ? (
          <div className="space-y-3">
            <Button onClick={() => setShowAppeal(true)} variant="outline" className="w-full">
              <Icon name="FileText" size={18} />
              Подать апелляцию
            </Button>
            <Button onClick={logout} variant="destructive" className="w-full">
              <Icon name="LogOut" size={18} />
              Выйти
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea
              value={appealText}
              onChange={(e) => setAppealText(e.target.value)}
              placeholder="Опишите, почему вы считаете блокировку ошибочной..."
              rows={4}
            />
            <div className="flex gap-2">
              <Button onClick={() => setShowAppeal(false)} variant="outline" className="flex-1">
                Отмена
              </Button>
              <Button onClick={handleAppeal} disabled={sending || !appealText.trim()} className="flex-1">
                {sending ? "Отправка..." : "Отправить"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
