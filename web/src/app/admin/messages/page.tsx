'use client';

import { useMemo, useState } from 'react';
import { Mail, MailOpen, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import type { ContactMessage } from '@/lib/types';
import { cn, formatDateTime, whatsappLink } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/icons';
import { useAdminQuery, errorMessage } from '@/components/admin/use-admin-query';
import { useToast } from '@/components/admin/toast';
import { Collapsible } from '@/components/ui/collapsible';
import { AdminButton, Checkbox, ConfirmDialog, EmptyState, LoadingBlock, PageHeader, PaginationControls } from '@/components/admin/ui';

type Response = { items: ContactMessage[]; total: number; page: number; pages: number; unread: number };

export default function AdminMessagesPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<ContactMessage | null>(null);
  const path = useMemo(() => `/api/contact?page=${page}&limit=20${unreadOnly ? '&unread=1' : ''}`, [page, unreadOnly]);
  const { data, loading, error, refetch } = useAdminQuery<Response>(path);

  const markRead = async (m: ContactMessage, isRead: boolean) => {
    try {
      await adminApi.patch(`/api/contact/${m.id}`, { isRead });
      refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const toggleOpen = (m: ContactMessage) => {
    const next = open === m.id ? null : m.id;
    setOpen(next);
    if (next && !m.isRead) markRead(m, true);
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await adminApi.delete(`/api/contact/${deleting.id}`);
      toast.success('Message deleted');
      setDeleting(null);
      refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader title="Messages" description={data ? `${data.unread} unread of ${data.total}` : undefined} actions={<Checkbox checked={unreadOnly} onChange={setUnreadOnly} label="Unread only" />} />
      {loading && !data ? (
        <LoadingBlock />
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : !data?.items.length ? (
        <div className="admin-card">
          <EmptyState title="No messages" text="Enquiries sent from the contact page will appear here." />
        </div>
      ) : (
        <ul className="admin-card divide-y divide-line">
          {data.items.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => toggleOpen(m)} className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-cream/60">
                {m.isRead ? <MailOpen size={16} className="shrink-0 text-muted" /> : <Mail size={16} className="shrink-0 text-accent" />}
                <div className="min-w-0 flex-1">
                  <p className={cn('truncate text-sm', !m.isRead && 'font-medium')}>
                    {m.name} <span className="font-normal text-muted">· {m.email}</span>
                  </p>
                  <p className="truncate text-xs text-muted">{m.subject || m.message}</p>
                </div>
                <span className="shrink-0 text-xs text-muted">{formatDateTime(m.createdAt)}</span>
              </button>
              <Collapsible open={open === m.id}>
                <div className="border-t border-line bg-cream/40 px-5 py-5">
                  {m.subject && <p className="mb-2 font-medium">{m.subject}</p>}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{m.message}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <AdminButton variant="secondary" size="sm" href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || 'your enquiry'}`)}`} icon={<Mail size={13} />}>
                      Reply by email
                    </AdminButton>
                    {m.phone && (
                      <a href={whatsappLink(m.phone, `Hello ${m.name}, thank you for contacting us.`)} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-2 rounded-sm bg-whatsapp px-3 text-xs font-medium text-white hover:opacity-90">
                        <WhatsAppIcon size={13} /> WhatsApp {m.phone}
                      </a>
                    )}
                    <AdminButton variant="secondary" size="sm" onClick={() => markRead(m, !m.isRead)}>
                      Mark as {m.isRead ? 'unread' : 'read'}
                    </AdminButton>
                    <AdminButton variant="danger" size="sm" onClick={() => setDeleting(m)} icon={<Trash2 size={13} />}>
                      Delete
                    </AdminButton>
                  </div>
                </div>
              </Collapsible>
            </li>
          ))}
        </ul>
      )}
      {data && <PaginationControls page={data.page} pages={data.pages} total={data.total} onChange={setPage} />}
      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={remove} title="Delete this message?" />
    </div>
  );
}
