import { Card } from "@/components/ui/card";

interface AdPlaceholderProps {
  size: "banner" | "rectangle" | "sidebar";
  className?: string;
}

export function AdPlaceholder({ size, className = "" }: AdPlaceholderProps) {
  const dimensions = {
    banner: "w-full h-24",
    rectangle: "w-80 h-64",
    sidebar: "w-48 h-96"
  };

  const labels = {
    banner: "728x90 Banner Ad",
    rectangle: "300x250 Rectangle Ad", 
    sidebar: "160x600 Sidebar Ad"
  };

  return (
    <Card className={`${dimensions[size]} ${className} border-2 border-dashed border-border/50 bg-muted/20 flex items-center justify-center`}>
      <div className="text-center space-y-2">
        <div className="text-2xl opacity-50">📢</div>
        <div className="text-sm text-muted-foreground font-medium">
          Google AdSense
        </div>
        <div className="text-xs text-muted-foreground">
          {labels[size]}
        </div>
      </div>
    </Card>
  );
}