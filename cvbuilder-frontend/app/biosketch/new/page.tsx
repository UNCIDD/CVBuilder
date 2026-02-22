'use client';

import { Suspense } from 'react';
import { BiosketchForm } from '@/components/biosketch-form';

export default function BiosketechPage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense>
        <BiosketchForm />
      </Suspense>
    </main>
  );
}
