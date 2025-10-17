'use client';

import { useMemo, useState } from 'react';
import { useDeckContext } from '@/context/DeckContext';
import { Flashcard, ReviewQuality } from '@/types';
import { isCardDue, sortCardsByDue, scheduleSM2 } from '@/lib/scheduler';

interface ReviewPanelProps {
  deckId: string;
}

const ratingOptions: Array<{ label: string; quality: ReviewQuality; description: string; tone: string }> = [
  { label: 'Again', quality: 1, description: 'Repeat soon', tone: 'bg-rose-600 hover:bg-rose-500 focus-visible:outline-rose-500' },
  { label: 'Hard', quality: 3, description: 'Short interval', tone: 'bg-amber-500 hover:bg-amber-400 focus-visible:outline-amber-500' },
  { label: 'Good', quality: 4, description: 'Recommended', tone: 'bg-sky-600 hover:bg-sky-500 focus-visible:outline-sky-500' },
  { label: 'Easy', quality: 5, description: 'Longer interval', tone: 'bg-emerald-600 hover:bg-emerald-500 focus-visible:outline-emerald-500' },
];

function getCardQueue(cards: Flashcard[], deckId: string, newLimit: number) {
  const deckCards = cards.filter((card) => card.deckId === deckId);
  const learningOrDue = sortCardsByDue(deckCards.filter((card) => !card.isNew || isCardDue(card)));
  const freshCards = deckCards
    .filter((card) => card.isNew && (isCardDue(card) || card.reviewHistory.length === 0))
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, newLimit);

  const queueMap = new Map<string, Flashcard>();
  [...learningOrDue, ...freshCards].forEach((card) => queueMap.set(card.id, card));
  return Array.from(queueMap.values());
}

export function ReviewPanel({ deckId }: ReviewPanelProps) {
  const { cards, settings, logReview } = useDeckContext();
  const [showAnswer, setShowAnswer] = useState(false);

  const queue = useMemo(() => {
    return getCardQueue(cards, deckId, settings.newCardsPerDay);
  }, [cards, deckId, settings.newCardsPerDay]);

  const currentCard = queue[0];

  const handleRating = (quality: ReviewQuality) => {
    if (!currentCard) return;
    const nextCard = scheduleSM2(currentCard, quality, settings);
    logReview(currentCard.id, quality, nextCard);
    setShowAnswer(false);
  };

  if (!currentCard) {
    return (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
        <p>No cards are due right now. Add more cards or adjust your settings.</p>
      </div>
    );
  }

  return (
    <section className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Review</h3>
          <p className="text-xs text-slate-500">Cards remaining: {queue.length}</p>
        </div>
        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-600">
          Interval: {currentCard.interval} day{currentCard.interval === 1 ? '' : 's'}
        </span>
      </header>

      <article className="flex flex-1 flex-col gap-4">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-inner">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Front</h4>
          <div
            className="mt-3 min-h-[120px] text-base leading-relaxed text-slate-800 [&_img]:max-h-60 [&_img]:rounded-xl [&_p]:mb-2 [&_strong]:font-semibold"
            dangerouslySetInnerHTML={{ __html: currentCard.front || '<em class="text-slate-400">Empty</em>' }}
          />
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="self-start rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
            onClick={() => setShowAnswer((prev) => !prev)}
          >
            {showAnswer ? 'Hide answer' : 'Show answer'}
          </button>
          {showAnswer ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-inner">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Back</h4>
              <div
                className="mt-3 min-h-[120px] text-base leading-relaxed text-slate-800 [&_audio]:mt-3 [&_audio]:w-full [&_img]:max-h-60 [&_img]:rounded-xl [&_p]:mb-2 [&_strong]:font-semibold"
                dangerouslySetInnerHTML={{ __html: currentCard.back || '<em class="text-slate-400">Empty</em>' }}
              />
              {currentCard.audio ? (
                <audio controls className="mt-4 w-full">
                  <source src={currentCard.audio} />
                  Audio playback is not supported on this device.
                </audio>
              ) : null}
            </div>
          ) : null}
        </div>
      </article>

      <div className="flex flex-wrap justify-between gap-3">
        {ratingOptions.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => handleRating(option.quality)}
            className={`flex flex-1 min-w-[120px] flex-col items-center justify-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${option.tone}`}
          >
            <span>{option.label}</span>
            <span className="text-[11px] uppercase tracking-wider text-white/80">{option.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
