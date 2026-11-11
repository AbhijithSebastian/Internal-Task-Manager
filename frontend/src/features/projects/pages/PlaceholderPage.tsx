import { Card } from "@/design-system";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <Card className="flex flex-col items-center justify-center py-16 text-center">
      <Construction className="mb-3 h-10 w-10 text-tertiary" />
      <h3 className="mb-1 text-sm font-semibold text-primary">{title}</h3>
      <p className="max-w-xs text-xs text-tertiary">
        {description || `The ${title} module will be available soon.`}
      </p>
    </Card>
  );
}
