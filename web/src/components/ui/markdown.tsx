import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

/** Renders admin-authored Markdown (blog posts, pages, product descriptions). */
export function Markdown({ content, className, small }: { content: string; className?: string; small?: boolean }) {
  if (!content) return null;
  return (
    <div className={cn('prose-cyp', small && 'prose-cyp-sm', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
