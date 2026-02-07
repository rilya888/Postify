"use client";

import { Component, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  title: string;
  description: string;
  retryLabel: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary for project-related components.
 * Catches JS errors in the tree and shows a fallback UI instead of crashing.
 */
class ProjectErrorBoundaryImpl extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ProjectErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{this.props.title}</AlertTitle>
            <AlertDescription>
              {typeof process !== "undefined" && process.env.NODE_ENV === "development" && this.state.error?.message
                ? this.state.error.message
                : this.props.description}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => this.setState({ hasError: false })}>{this.props.retryLabel}</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ProjectErrorBoundary({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const t = useTranslations("projectErrors");

  return (
    <ProjectErrorBoundaryImpl
      fallback={fallback}
      title={t("title")}
      description={t("description")}
      retryLabel={t("retry")}
    >
      {children}
    </ProjectErrorBoundaryImpl>
  );
}
