'use client';

import { Flashcard } from '@/types';

interface CardListProps {
  cards: Flashcard[];
  onEdit: (card: Flashcard) => void;
  onDelete: (cardId: string) => void;
}

export function CardList({ cards, onEdit, onDelete }: CardListProps) {
  if (!cards.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
        No cards yet. Use the form to add your first one or import from a file.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow">
      <table className="min-w-full divide-y divide-slate-200 text-left">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3">
              Front
            </th>
            <th scope="col" className="px-4 py-3">
              Back
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {cards.map((card) => (
            <tr key={card.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 align-top">
                <div
                  className="max-w-none text-slate-800 [&_img]:max-h-24 [&_img]:rounded-lg [&_p]:mb-1 [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: card.front || '<em class="text-slate-400">Empty</em>' }}
                />
              </td>
              <td className="px-4 py-3 align-top">
                <div
                  className="max-w-none text-slate-800 [&_img]:max-h-24 [&_img]:rounded-lg [&_p]:mb-1 [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: card.back || '<em class="text-slate-400">Empty</em>' }}
                />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                    onClick={() => onEdit(card)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                    onClick={() => {
                      if (confirm('Delete this card?')) onDelete(card.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
