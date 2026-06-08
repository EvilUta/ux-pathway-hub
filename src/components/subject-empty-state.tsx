import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SubjectEmptyStateProps = {
  title: string;
  disciplineName: string;
  description: string;
};

export function SubjectEmptyState({ title, disciplineName, description }: SubjectEmptyStateProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">Disciplina: {disciplineName}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
