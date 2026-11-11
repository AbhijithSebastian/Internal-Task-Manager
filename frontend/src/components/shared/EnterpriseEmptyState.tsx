import { Button } from "@/design-system";
import { HelpCircle } from "lucide-react";

interface EmptyAction {
  label: string;
  onClick: () => void;
}

interface EnterpriseEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  primaryAction?: EmptyAction;
  secondaryAction?: EmptyAction;
  helpLink?: { label: string; href: string };
}

export function EnterpriseEmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  helpLink,
}: EnterpriseEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-5 text-tertiary">{icon}</div>
      <h3 className="text-base font-semibold text-primary">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-tertiary">{description}</p>}
      {(primaryAction || secondaryAction) && (
        <div className="mt-5 flex items-center gap-2">
          {primaryAction && (
            <Button size="sm" onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button size="sm" variant="secondary" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
      {helpLink && (
        <a
          href={helpLink.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-xs text-link hover:underline"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          {helpLink.label}
        </a>
      )}
    </div>
  );
}
