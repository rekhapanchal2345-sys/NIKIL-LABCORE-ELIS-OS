"use client";
import React from "react";

export function SkeletonLoader({ rows = 5 }: any) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-100 rounded-lg" />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: any) {
  return <SkeletonLoader rows={rows} />;
}

export default SkeletonLoader;
