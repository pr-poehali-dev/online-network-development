import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/lib/auth";
import CreatePostDialog from "@/components/CreatePostDialog";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const tabs = [
    { icon: "Home", path: "/", label: "Лента" },
    { icon: "Search", path: "/search", label: "Поиск" },
    { icon: "PlusCircle", path: "create", label: "Пост" },
    { icon: "MessageCircle", path: "/messages", label: "Чаты" },
    { icon: "User", path: user ? `/profile/${user.username}` : "/login", label: "Профиль" },
  ];

  const handleClick = (path: string) => {
    if (path === "create") {
      if (!user) {
        navigate("/login");
        return;
      }
      setShowCreate(true);
      return;
    }
    if ((path === "/search" || path === "/messages") && !user) {
      navigate("/login");
      return;
    }
    navigate(path);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border/50 safe-area-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto h-14">
          {tabs.map((tab) => {
            const active = tab.path !== "create" && isActive(tab.path);
            return (
              <button
                key={tab.label}
                onClick={() => handleClick(tab.path)}
                className={`flex flex-col items-center justify-center gap-0.5 h-full px-3 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon name={tab.icon} size={22} />
                <span className="text-[10px]">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <CreatePostDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={() => {
          if (location.pathname === "/") {
            window.location.reload();
          }
        }}
      />
    </>
  );
}
