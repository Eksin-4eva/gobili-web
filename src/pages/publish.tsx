import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthGuard from "@/components/AuthGuard";
import { publishVideo } from "@/api/video";
import { ApiError } from "@/api/apiError";
import { $tip } from "@/components/tip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  title: z.string().min(1, "请输入标题").max(64, "标题过长"),
  description: z.string().max(500, "简介过长").optional(),
});

type FormValues = z.infer<typeof schema>;

function PublishForm() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!file) {
      $tip("请选择视频文件", "warning");
      return;
    }
    setLoading(true);
    try {
      await publishVideo({
        file,
        title: values.title,
        description: values.description ?? "",
        cover,
      });
      $tip(cover ? "投稿成功" : "投稿成功，封面将异步生成", "success");
      void navigate("/me");
    } catch (error) {
      $tip(error instanceof ApiError ? error.message : "投稿失败", "error");
    } finally {
      setLoading(false);
    }
  });

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>投稿</CardTitle>
        <CardDescription>封面可选；不传时由后端 worker 异步抽帧生成</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="title">标题</Label>
            <Input id="title" {...form.register("title")} />
            <p className="text-xs text-destructive">{form.formState.errors.title?.message}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">简介</Label>
            <Textarea id="description" {...form.register("description")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">视频文件</Label>
            <Input
              id="file"
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cover">封面（可选）</Label>
            <Input
              id="cover"
              type="file"
              accept="image/*"
              onChange={(e) => setCover(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "上传中..." : "发布"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function PublishPage() {
  return (
    <AuthGuard>
      <PublishForm />
    </AuthGuard>
  );
}
