import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ImagePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
  title?: string;
}

export default function ImagePreviewDialog({ open, onOpenChange, imageUrl, title = "عرض المرفق" }: ImagePreviewDialogProps) {
  if (!imageUrl) return null;

  // Check if it's likely an image by extension
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(imageUrl) || imageUrl.startsWith('data:image');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-black/95 border-none">
        <DialogHeader className="p-4 bg-background/10 absolute top-0 w-full z-10 flex flex-row items-center justify-between">
          <DialogTitle className="text-white">{title}</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => {
              const a = document.createElement('a');
              a.href = imageUrl;
              a.download = imageUrl.split('/').pop() || 'attachment';
              a.click();
            }}
          >
            <Download className="h-5 w-5" />
          </Button>
        </DialogHeader>
        <div className="flex items-center justify-center p-4 min-h-[50vh] max-h-[85vh]">
          {isImage ? (
            <img 
              src={imageUrl} 
              alt="Attachment Preview" 
              className="max-w-full max-h-[80vh] object-contain rounded-md"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-white space-y-4">
              <p>هذا الملف ليس صورة. يرجى تنزيله لعرضه.</p>
              <Button onClick={() => window.open(imageUrl, '_blank')}>
                فتح الملف في نافذة جديدة
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
