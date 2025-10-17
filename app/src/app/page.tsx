'use client';

import { useEffect, useMemo, useState } from 'react';
import { DeckProvider, useDeckContext } from '@/context/DeckContext';
import { DeckSidebar } from '@/components/DeckSidebar';
import { CardEditor } from '@/components/CardEditor';
import { CardList } from '@/components/CardList';
import { ReviewPanel } from '@/components/ReviewPanel';
import { ImportExportPanel } from '@/components/ImportExportPanel';
import { SettingsPanel } from '@/components/SettingsPanel';
import { Flashcard } from '@/types';

function Dashboard() {
  const { decks, cards, activeDeckId, setActiveDeck, upsertCard, deleteCard } = useDeckContext();
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);

  useEffect(() => {
    if (!activeDeckId && decks.length) {
      setActiveDeck(decks[0].id);
    }
  }, [activeDeckId, decks, setActiveDeck]);

  const activeDeck = useMemo(
    () => decks.find((deck) => deck.id === activeDeckId),
    [decks, activeDeckId],
  );

  const deckCards = useMemo(
    () => cards.filter((card) => card.deckId === activeDeckId),
    [cards, activeDeckId],
  );

  if (!decks.length) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50 p-6">
        <div className="max-w-md rounded-3xl border border-dashed border-sky-200 bg-white/80 p-8 text-center shadow-2xl shadow-sky-100/40 backdrop-blur">
          <h1 className="text-2xl font-semibold text-slate-800">Create your first deck</h1>
          <p className="mt-3 text-sm text-slate-600">
            Build focused study decks with rich text, images, audio, and a responsive review flow.
            Use the panel on the left to add your first deck.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
      <DeckSidebar />
      {activeDeck ? (
        <main className="flex flex-col gap-6 rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-sky-50 p-6 shadow-xl shadow-slate-200/60">
          <header className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/70 p-5 shadow">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">{activeDeck.name}</h1>
                {activeDeck.description ? (
                  <p className="text-sm text-slate-600">{activeDeck.description}</p>
                ) : (
                  <p className="text-sm text-slate-500">No description provided yet.</p>
                )}
              </div>
              <span className="rounded-full bg-sky-100 px-4 py-1 text-sm font-semibold text-sky-700">
                {deckCards.length} card{deckCards.length === 1 ? '' : 's'}
              </span>
            </div>
          </header>

          <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
            <div className="space-y-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-800">
                    {editingCard ? 'Edit card' : 'Create a new card'}
                  </h2>
                  {editingCard ? (
                    <button
                      type="button"
                      onClick={() => setEditingCard(null)}
                      className="text-sm font-medium text-sky-600 hover:underline"
                    >
                      New card instead
                    </button>
                  ) : null}
                </div>
                <p className="mb-4 text-sm text-slate-600">
                  Rich formatting, keyboard shortcuts, and drag-and-drop images are supported inside the editor.
                </p>
                <CardEditor
                  deckId={activeDeck.id}
                  card={editingCard ?? undefined}
                  onSave={(card) => {
                    const saved = upsertCard({ ...card, deckId: activeDeck.id });
                    setEditingCard(null);
                    return saved;
                  }}
                  onCancel={() => setEditingCard(null)}
                />
              </section>

              <section>
                <h2 className="sr-only">Cards in this deck</h2>
                <CardList
                  cards={deckCards}
                  onEdit={(card) => setEditingCard(card)}
                  onDelete={deleteCard}
                />
              </section>
            </div>

            <div className="space-y-6">
              <ReviewPanel deckId={activeDeck.id} />
              <ImportExportPanel deckId={activeDeck.id} />
              <SettingsPanel />
            </div>
          </section>
        </main>
      ) : (
        <div className="flex min-h-[60vh] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white/60 p-6 text-sm text-slate-600">
          Select a deck from the sidebar to see its cards.
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <DeckProvider>
      <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <header className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-200">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-600">
              Agentic Study
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">Spaced repetition flashcards</h1>
            <p className="max-w-3xl text-sm text-slate-600">
              Craft responsive decks, embed multimedia, and review with an SM-2 based scheduler. Built for
              keyboard and touch with accessible interactions throughout.
            </p>
          </header>
          <Dashboard />
        </div>
      </div>
    </DeckProvider>
  );
}
