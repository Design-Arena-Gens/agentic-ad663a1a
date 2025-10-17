'use client';

import { FormEvent, useState } from 'react';
import { useDeckContext } from '@/context/DeckContext';

export function DeckSidebar() {
  const { decks, activeDeckId, setActiveDeck, addDeck, deleteDeck, cards } = useDeckContext();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [expandedDeckId, setExpandedDeckId] = useState<string | null>(null);

  const handleCreateDeck = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    addDeck({ name, description });
    setName('');
    setDescription('');
  };

  const cardsPerDeck = decks.reduce<Record<string, number>>((acc, deck) => {
    acc[deck.id] = cards.filter((card) => card.deckId === deck.id).length;
    return acc;
  }, {});

  return (
    <aside className="flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/40">
      <div className="space-y-4">
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Decks</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {decks.length} total
          </span>
        </header>
        <ul className="flex flex-col gap-2" role="list">
          {decks.map((deck) => (
            <li key={deck.id}>
              <button
                type="button"
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                  activeDeckId === deck.id
                    ? 'border-sky-400 bg-sky-50 text-sky-700'
                    : 'border-transparent bg-slate-50 text-slate-700 hover:border-slate-200'
                }`}
                onClick={() => setActiveDeck(deck.id)}
                onMouseEnter={() => setExpandedDeckId(deck.id)}
                onMouseLeave={() => setExpandedDeckId(null)}
              >
                <div>
                  <p className="text-sm font-medium">{deck.name}</p>
                  {deck.description ? (
                    <p className="text-xs text-slate-500">{deck.description}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 shadow">
                    {cardsPerDeck[deck.id] ?? 0}
                  </span>
                  {expandedDeckId === deck.id ? (
                    <button
                      type="button"
                      className="rounded-full border border-rose-200 px-2 py-0.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (confirm(`Delete deck "${deck.name}"?`)) {
                          deleteDeck(deck.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </button>
            </li>
          ))}
          {decks.length === 0 ? (
            <li className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-500">
              Create your first deck to get started.
            </li>
          ) : null}
        </ul>
      </div>
      <form onSubmit={handleCreateDeck} className="mt-6 flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <h3 className="text-sm font-semibold text-slate-700">New deck</h3>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            placeholder="Biology 101"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            placeholder="Optional short description"
            rows={2}
          />
        </label>
        <button
          type="submit"
          className="mt-1 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        >
          Add deck
        </button>
      </form>
    </aside>
  );
}
