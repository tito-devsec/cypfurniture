'use client';

import { useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { ApiError, apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/form';

export function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '', website: '' });
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setState('loading');
    setError(null);
    setErrors({});
    try {
      await apiFetch('/api/contact', { method: 'POST', body: JSON.stringify(form) });
      setState('done');
    } catch (err) {
      setState('idle');
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.details) setErrors(Object.fromEntries(err.details.map((d) => [d.path, d.message])));
      } else setError('Something went wrong. Please try again.');
    }
  };

  if (state === 'done') {
    return (
      <div className="bg-surface p-10 text-center">
        <p className="font-display text-2xl">Message received</p>
        <p className="mt-2 text-muted">Thank you - we will get back to you within one working day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2" noValidate>
      <Field label="Name" required error={errors.name}>
        <Input value={form.name} onChange={set('name')} autoComplete="name" required />
      </Field>
      <Field label="Email" required error={errors.email}>
        <Input type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
      </Field>
      <Field label="Phone" error={errors.phone}>
        <Input type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
      </Field>
      <Field label="Subject" error={errors.subject}>
        <Input value={form.subject} onChange={set('subject')} placeholder="Custom order, delivery, showroom visit ..." />
      </Field>
      <Field label="Message" required error={errors.message} className="sm:col-span-2">
        <Textarea value={form.message} onChange={set('message')} required />
      </Field>
      {/* Honeypot: hidden from humans, filled by bots */}
      <input type="text" name="website" value={form.website} onChange={set('website')} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {error && <p className="text-sm text-sale sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" loading={state === 'loading'} icon={<ArrowRight size={15} />}>
          Send message
        </Button>
      </div>
    </form>
  );
}
