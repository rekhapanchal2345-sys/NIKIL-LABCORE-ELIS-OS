"use client";

import React from "react";
import type { TubeGroup } from "./phlebotomy-draw-utils";

interface Props {
  groups: TubeGroup[];
  collected: Set<string>;
  onToggle: (key: string) => void;
}

export default function PhlebotomyTubeTable({ groups, collected, onToggle }: Props) {
  return (
    <section aria-label="Specimens to collect">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
          Specimens to collect (order of draw)
        </h4>
        <span className="text-[11px] text-slate-500">
          {collected.size} of {groups.length} confirmed
        </span>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
          No specimen container is defined for the tests on this requisition. Record the specimen in the remarks below.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-10 px-3 py-2">#</th>
                <th className="px-3 py-2">Container</th>
                <th className="px-3 py-2">Specimen</th>
                <th className="px-3 py-2">Tests</th>
                <th className="w-24 px-3 py-2 text-center">Collected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groups.map((group, index) => {
                const checked = collected.has(group.key);
                return (
                  <tr key={group.key} className={checked ? "bg-emerald-50/40" : "bg-white"}>
                    <td className="px-3 py-2.5 font-mono text-slate-500">{index + 1}</td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-2 font-medium text-slate-800">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full border border-black/10"
                          style={{ backgroundColor: group.cap }}
                          aria-hidden="true"
                        />
                        {group.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{group.sampleType}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600">{group.tests.join(", ")}</td>
                    <td className="px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(group.key)}
                        aria-label={`Confirm ${group.label} collected`}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
