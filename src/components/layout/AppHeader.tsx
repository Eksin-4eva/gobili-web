import { Link, NavLink, useNavigate } from "react-router";
import { Clapperboard, MessageCircle, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-lg px-3 py-1.5 text-sm transition-colors",
    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );

export default function AppHeader() {
  const { user, logout } = useCurrentUser();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Clapperboard className="size-4" />
          </span>
          <span className="hidden sm:inline">gobili</span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={navClass}>
            推荐
          </NavLink>
          <NavLink to="/popular" className={navClass}>
            热门
          </NavLink>
          <NavLink to="/search" className={navClass}>
            搜索
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => void navigate("/search")}>
            <Search className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => void navigate("/publish")}>
            <Upload className="size-4" />
            <span className="hidden sm:inline">投稿</span>
          </Button>
          {user ? (
            <>
              <Button variant="ghost" size="icon" onClick={() => void navigate("/messages")}>
                <MessageCircle className="size-4" />
              </Button>
              <Link to="/me" className="flex items-center gap-2">
                <Avatar src={user.avatar_url} alt={user.username} />
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout();
                  void navigate("/");
                }}
              >
                退出
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => void navigate("/login")}>
                登录
              </Button>
              <Button size="sm" onClick={() => void navigate("/register")}>
                注册
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
