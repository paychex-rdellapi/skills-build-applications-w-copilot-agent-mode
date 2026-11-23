import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  loading?: boolean;
  error?: string | null;
  emptyText?: string;
  isEmpty?: boolean;
  children?: ReactNode;
};

export function CapabilityCard({ title, description, loading, error, emptyText, isEmpty, children }: Props) {
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {loading && <p role="status">Loading...</p>}
        {error && <p role="alert">Unable to load: {error}</p>}
        {!loading && !error && isEmpty && <p>{emptyText}</p>}
        {!loading && !error && !isEmpty && children}
      </div>
    </section>
  );
}
