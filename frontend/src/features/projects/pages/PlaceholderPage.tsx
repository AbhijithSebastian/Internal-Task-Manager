import { Card } from "@/components/ui/Card";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <Card className="flex flex-col items-center justify-center py-16 text-center">
      <Construction className="h-10 w-10 text-tertiary mb-3" />
      <h3 className="text-sm font-semibold text-primary mb-1">{title}</h3>
      <p className="text-xs text-tertiary max-w-xs">{description || `The ${title} module will be available soon.`}</p>
    </Card>
  );
}
