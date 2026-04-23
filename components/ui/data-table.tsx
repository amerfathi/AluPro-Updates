import React from "react";

import { cn } from "@/lib/utils/cn";

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Array<Array<string | number | React.ReactNode>>;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)]">
      <table className="min-w-full text-sm">
        <thead className="bg-[var(--surface-soft)] text-[var(--text-secondary)]">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 text-start font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className={cn("border-t border-[var(--border-soft)]", index % 2 === 0 ? "bg-transparent" : "bg-[var(--surface-soft)]/40")}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-[var(--text-primary)]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


