import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clapperboard } from "lucide-react";
import { registerUser } from "@/api/auth";
import { ApiError } from "@/api/apiError";
import { $tip } from "@/components/tip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  username: z.string().min(3, "用户名至少 3 位"),
  password: z.string().min(6, "密码至少 6 位"),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setLoading(true);
    try {
      await registerUser(values);
      $tip("注册成功，请登录", "success");
      void navigate(`/login?redirect=${encodeURIComponent("/")}`);
    } catch (error) {
      $tip(error instanceof ApiError ? error.message : "注册失败", "error");
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
          <h1 className="text-xl font-semibold">注册 gobili</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>创建账号</CardTitle>
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
              <Button className="w-full" disabled={loading} type="submit">
                {loading ? "提交中..." : "注册"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              已有账号？ <Link className="text-primary" to="/login">去登录</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
