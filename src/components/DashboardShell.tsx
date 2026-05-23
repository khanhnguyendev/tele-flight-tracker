'use client';

import React from 'react';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full">
      {children}
    </div>
  );
}
