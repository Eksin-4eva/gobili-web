import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clapperboard } from "lucide-react";
import { loginUser } from "@/api/auth";
import { $tip } from "@/components/tip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ApiError } from "@/api/apiError";

const schema = z.object({
  username: z.string().min(1, "请输入用户名"),
  password: z.string().min(1, "请输入密码"),
  code: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { setUser, refresh } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "", code: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setLoading(true);
    try {
      const user = await loginUser({
        username: values.username,
        password: values.password,
        code: values.code || undefined,
      });
      setUser(user);
      await refresh();
      $tip("登录成功", "success");
      const redirect = params.get("redirect") || "/";
      void navigate(redirect);
    } catch (error) {
      $tip(error instanceof ApiError ? error.message : "登录失败", "error");
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Clapperboard className="size-6" />
          </div>
          <h1 className="text-xl font-semibold">登录 gobili</h1>
          <p className="text-sm text-muted-foreground">双 Token 会话，支持 MFA 二次验证</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>账号登录</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input id="username" {...form.register("username")} />
                <p className="text-xs text-destructive">{form.formState.errors.username?.message}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input id="password" type="password" {...form.register("password")} />
                <p className="text-xs text-destructive">{form.formState.errors.password?.message}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">MFA 验证码（未开启可留空）</Label>
                <Input id="code" inputMode="numeric" {...form.register("code")} />
              </div>
              <Button className="w-full" disabled={loading} type="submit">
                {loading ? "登录中..." : "登录"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              还没有账号？ <Link className="text-primary" to="/register">去注册</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
