'use client';

import { Download, Trash2 } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { formatDateTime } from '@/lib/utils';
import { useAdminQuery, errorMessage } from '@/components/admin/use-admin-query';
import { useToast } from '@/components/admin/toast';
import { AdminButton, EmptyState, LoadingBlock, PageHeader, Table } from '@/components/admin/ui';

type Subscriber = { id: number; email: string; createdAt: string };

export default function AdminSubscribersPage() {
  const toast = useToast();
  const { data, loading, error, refetch } = useAdminQuery<{ items: Subscriber[]; total: number }>('/api/newsletter');

  const remove = async (id: number) => {
    try {
      await adminApi.delete(`/api/newsletter/${id}`);
      refetch();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const exportCsv = () => {
    if (!data) return;
    const csv = ['email,subscribed_at', ...data.items.map((s) => `${s.email},${s.createdAt}`)].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscribers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Newsletter subscribers" description={data ? `${data.total} subscribers` : undefined} actions={<AdminButton variant="secondary" onClick={exportCsv} disabled={!data?.items.length} icon={<Download size={14} />}>Export CSV</AdminButton>} />
      {loading && !data ? (
        <LoadingBlock />
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : !data?.items.length ? (
        <div className="admin-card">
          <EmptyState title="No subscribers yet" text="Sign-ups from the newsletter box in the footer appear here." />
        </div>
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Subscribed</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((s) => (
              <tr key={s.id}>
                <td>{s.email}</td>
                <td className="text-muted">{formatDateTime(s.createdAt)}</td>
                <td className="text-right">
                  <button type="button" onClick={() => remove(s.id)} className="rounded-sm p-1.5 text-muted hover:text-danger" title="Remove">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
