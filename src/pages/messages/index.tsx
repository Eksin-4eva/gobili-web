import AuthGuard from "@/components/AuthGuard";
import EmptyState from "@/components/EmptyState";

function MessagesHome() {
  return (
    <EmptyState
      title="私信"
      description="从用户主页点击「发私信」开始会话"
    />
  );
}

export default function MessagesPage() {
  return (
    <AuthGuard>
      <MessagesHome />
    </AuthGuard>
  );
}
