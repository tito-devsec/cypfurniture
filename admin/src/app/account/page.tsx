'use client';

import { useState, type FormEvent } from 'react';
import { adminApi, getStoredUser, setSession } from '@/lib/admin-api';
import type { AdminUser } from '@/lib/types';
import { useToast } from '@/components/admin/toast';
import { errorMessage } from '@/components/admin/use-admin-query';
import { AdminButton, Card, Field, Input, PageHeader } from '@/components/admin/ui';

export default function AdminAccountPage() {
  const toast = useToast();
  const stored = getStoredUser();
  const [profile, setProfile] = useState({ name: stored?.name ?? '', email: stored?.email ?? '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await adminApi.put<{ token: string; admin: AdminUser }>('/api/auth/profile', profile);
      setSession(res.token, res.admin);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    setSavingPw(true);
    try {
      await adminApi.post('/api/auth/change-password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success('Password changed');
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div>
      <PageHeader title="My account" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Profile">
          <form onSubmit={saveProfile} className="space-y-5">
            <Field label="Name" required>
              <Input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} required />
            </Field>
            <Field label="Email" required>
              <Input type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} required />
            </Field>
            <AdminButton type="submit" loading={savingProfile}>
              Save profile
            </AdminButton>
          </form>
        </Card>
        <Card title="Change password">
          <form onSubmit={savePassword} className="space-y-5">
            <Field label="Current password" required>
              <Input type="password" value={pw.currentPassword} onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))} autoComplete="current-password" required />
            </Field>
            <Field label="New password" required hint="At least 8 characters.">
              <Input type="password" value={pw.newPassword} onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} autoComplete="new-password" minLength={8} required />
            </Field>
            <Field label="Confirm new password" required>
              <Input type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} autoComplete="new-password" required />
            </Field>
            <AdminButton type="submit" loading={savingPw}>
              Change password
            </AdminButton>
          </form>
        </Card>
      </div>
    </div>
  );
}
