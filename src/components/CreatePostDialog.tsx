import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Icon from "@/components/ui/icon";
import { apiPost, apiUpload } from "@/lib/api";
import { toast } from "sonner";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export default function CreatePostDialog({ open, onOpenChange, onCreated }: CreatePostDialogProps) {
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);
        const res = await apiUpload("/upload", formData);
        if (res.url) {
          setMedia((prev) => [...prev, res.url]);
        }
      }
    } catch {
      toast.error("Ошибка загрузки файла");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && media.length === 0) return;
    setPosting(true);
    try {
      await apiPost("/posts/create", { content: content.trim(), media });
      toast.success("Пост опубликован");
      setContent("");
      setMedia([]);
      onOpenChange(false);
      onCreated?.();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Ошибка публикации");
    } finally {
      setPosting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Новый пост</DialogTitle>
          <DialogDescription>Поделитесь чем-нибудь с миром</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Что у вас нового?"
              rows={4}
              maxLength={5000}
              className="resize-none"
            />
            <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {content.length}/5000
            </span>
          </div>

          {media.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {media.map((url, i) => (
                <div key={i} className="relative group rounded-lg overflow-hidden">
                  <img src={url} alt="" className="w-full h-24 object-cover" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeMedia(i)}
                  >
                    <Icon name="X" size={12} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                <Icon name="Image" size={20} className="text-primary" />
              </Button>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={posting || uploading || (!content.trim() && media.length === 0)}
            >
              {posting ? "Публикация..." : "Опубликовать"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
