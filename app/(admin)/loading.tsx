import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="w-full h-[80vh] flex flex-col items-center justify-center space-y-4">
      <div className="p-4 rounded-2xl bg-primary/10 text-primary">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
      <p className="text-muted-foreground animate-pulse text-sm font-medium">
        Carregando...
      </p>
    </div>
  );
}
