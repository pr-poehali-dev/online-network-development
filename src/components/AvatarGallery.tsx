import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

interface AvatarGalleryProps {
  images: string[];
  onClose: () => void;
}

export default function AvatarGallery({ images, onClose }: AvatarGalleryProps) {
  const [current, setCurrent] = useState(0);

  if (!images.length) return null;

  const prev = () => setCurrent((c) => (c > 0 ? c - 1 : images.length - 1));
  const next = () => setCurrent((c) => (c < images.length - 1 ? c + 1 : 0));

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={onClose}>
      <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <img
          src={images[current]}
          alt="Avatar"
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
        />

        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
              onClick={prev}
            >
              <Icon name="ChevronLeft" size={24} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
              onClick={next}
            >
              <Icon name="ChevronRight" size={24} />
            </Button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === current ? "bg-white" : "bg-white/40"
                  }`}
                  onClick={() => setCurrent(i)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 text-white hover:bg-white/10"
        onClick={onClose}
      >
        <Icon name="X" size={24} />
      </Button>
    </div>
  );
}
