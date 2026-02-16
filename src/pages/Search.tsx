import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import VerificationBadge from "@/components/VerificationBadge";
import BottomNav from "@/components/BottomNav";
import { apiGet } from "@/lib/api";

interface SearchUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  verified: string;
  bio: string;
}

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const data = await apiGet(`/users/search?q=${encodeURIComponent(q.trim())}`);
      setResults(data.users || data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="relative">
            <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Поиск пользователей..."
              className="pl-10"
              autoFocus
            />
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        {loading && (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <Icon name="UserX" size={40} className="mx-auto mb-3 opacity-50" />
            <p>Пользователи не найдены</p>
          </div>
        )}

        {!loading && !searched && (
          <div className="p-8 text-center text-muted-foreground">
            <Icon name="Search" size={40} className="mx-auto mb-3 opacity-50" />
            <p>Начните вводить имя для поиска</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="p-2 space-y-1">
            {results.map((u) => (
              <Card
                key={u.id}
                className="p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => navigate(`/profile/${u.username}`)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={u.avatar_url} alt={u.username} />
                    <AvatarFallback>{u.display_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm truncate">{u.display_name}</span>
                      {u.verified && u.verified !== "none" && (
                        <VerificationBadge type={u.verified} size={14} />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                    {u.bio && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{u.bio}</p>
                    )}
                  </div>
                  <Icon name="ChevronRight" size={18} className="text-muted-foreground" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
