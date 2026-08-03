import { FileQuestion } from 'lucide-react';
import { StatusPage } from './StatusPage';

export function NotFoundPage() {
  return (
    <StatusPage
      code="404"
      icon={<FileQuestion className="size-14" strokeWidth={1.25} />}
      title="This page doesn't exist"
      description="The page you're looking for was moved, renamed, or never existed."
      action={{ label: 'Go home', to: '/' }}
    />
  );
}
