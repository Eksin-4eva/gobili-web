import AppHeader from "@/components/layout/AppHeader";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-4 pb-20 md:pb-8">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-background/95 p-2 text-xs md:hidden">
        <a className="rounded-lg py-2 text-center hover:bg-muted" href="/">推荐</a>
        <a className="rounded-lg py-2 text-center hover:bg-muted" href="/popular">热门</a>
        <a className="rounded-lg py-2 text-center hover:bg-muted" href="/publish">投稿</a>
        <a className="rounded-lg py-2 text-center hover:bg-muted" href="/me">我的</a>
      </nav>
    </div>
  );
}
