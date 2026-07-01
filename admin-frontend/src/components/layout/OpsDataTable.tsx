import { Trash2 } from 'lucide-react';
import { opsTableClass, opsThClass, opsTdClass } from '@/lib/opsUi';
import {
  DesktopTablePanel,
  MobileEmptyState,
  MobileListShell,
  MobileRecordCard,
} from '@/components/layout/mobileAdmin';

export function OpsDataTable({
  headers,
  rows,
  onDelete,
  onAction,
  actionLabel,
  emptyMessage = 'No records yet.',
}: {
  headers: string[];
  rows: (string | number)[][];
  onDelete?: (id: string) => void;
  onAction?: (id: string) => void;
  actionLabel?: string;
  emptyMessage?: string;
}) {
  const dataHeaders = headers.filter((h) => h !== '');
  const idIndex = headers.length - 1;

  if (!rows.length) {
    return (
      <>
        <DesktopTablePanel>
          <p className="p-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        </DesktopTablePanel>
        <MobileListShell>
          <MobileEmptyState message={emptyMessage} />
        </MobileListShell>
      </>
    );
  }

  return (
    <>
      <DesktopTablePanel className="overflow-x-auto no-scrollbar">
        <table className={opsTableClass}>
          <thead className="bg-muted/30">
            <tr>
              {headers.map((h) => (
                <th key={h || 'actions'} className={opsThClass}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const rowId = String(row[idIndex] ?? '');
              const showAction =
                onAction && rowId.length > 10 && actionLabel && row[idIndex] !== '';

              return (
                <tr key={i}>
                  {row.slice(0, -1).map((cell, j) => (
                    <td key={j} className={opsTdClass}>
                      {cell}
                    </td>
                  ))}
                  <td className={opsTdClass}>
                    {showAction ? (
                      <button
                        type="button"
                        className="mr-2 text-xs font-medium text-primary"
                        onClick={() => onAction!(rowId)}
                      >
                        {actionLabel}
                      </button>
                    ) : null}
                    {onDelete ? (
                      <button type="button" aria-label="Delete" onClick={() => onDelete(rowId)}>
                        <Trash2 className="size-3.5 text-destructive" />
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DesktopTablePanel>

      <MobileListShell>
        {rows.map((row, i) => {
          const rowId = String(row[idIndex] ?? '');
          const showAction =
            onAction && rowId.length > 10 && actionLabel && row[idIndex] !== '';

          return (
            <MobileRecordCard
              key={i}
              title={String(row[0])}
              subtitle={dataHeaders
                .slice(1, -1)
                .map((header, j) => `${header}: ${row[j + 1]}`)
                .join(' · ')}
              actions={
                <>
                  {showAction ? (
                    <button
                      type="button"
                      className="rounded-none px-2 py-1 text-[11px] font-medium text-primary"
                      onClick={() => onAction!(rowId)}
                    >
                      {actionLabel}
                    </button>
                  ) : null}
                  {onDelete ? (
                    <button
                      type="button"
                      aria-label="Delete"
                      className="rounded-none p-1.5"
                      onClick={() => onDelete(rowId)}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </button>
                  ) : null}
                </>
              }
            />
          );
        })}
      </MobileListShell>
    </>
  );
}
