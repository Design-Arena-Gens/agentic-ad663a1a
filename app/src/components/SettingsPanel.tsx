'use client';

import { FormEvent, useState } from 'react';
import { useDeckContext } from '@/context/DeckContext';

export function SettingsPanel() {
  const { settings, updateSettings } = useDeckContext();
  const [newCardsPerDay, setNewCardsPerDay] = useState(settings.newCardsPerDay);
  const [maxInterval, setMaxInterval] = useState(settings.maxInterval);
  const [defaultEaseFactor, setDefaultEaseFactor] = useState(settings.defaultEaseFactor);
  const [learningSteps, setLearningSteps] = useState(settings.learningSteps.join(', '));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const steps = learningSteps
      .split(',')
      .map((step) => Number.parseInt(step.trim(), 10))
      .filter((value) => Number.isFinite(value) && value > 0);

    updateSettings({
      newCardsPerDay: Math.max(1, Math.min(100, newCardsPerDay)),
      maxInterval: Math.max(1, Math.min(365, maxInterval)),
      defaultEaseFactor: Math.max(1.3, Math.min(3.0, Number(defaultEaseFactor.toFixed(2)))),
      learningSteps: steps.length ? steps : settings.learningSteps,
    });
  };

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow">
      <header>
        <h3 className="text-base font-semibold text-slate-800">Review settings</h3>
        <p className="text-sm text-slate-600">
          Tune the spaced repetition engine to match your learning pace.
        </p>
      </header>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          New cards per day
          <input
            type="number"
            min={1}
            max={100}
            value={newCardsPerDay}
            onChange={(event) => setNewCardsPerDay(Number(event.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          />
          <span className="text-xs font-normal text-slate-500">
            Limits how many unseen cards are introduced each day.
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Maximum interval (days)
          <input
            type="number"
            min={1}
            max={365}
            value={maxInterval}
            onChange={(event) => setMaxInterval(Number(event.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          />
          <span className="text-xs font-normal text-slate-500">
            Caps the spacing between reviews even for &ldquo;easy&rdquo; cards.
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Default ease factor
          <input
            type="number"
            step="0.1"
            min={1.3}
            max={3}
            value={defaultEaseFactor}
            onChange={(event) => setDefaultEaseFactor(Number(event.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          />
          <span className="text-xs font-normal text-slate-500">
            Higher ease values lengthen future intervals more quickly.
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Learning steps (minutes, comma separated)
          <input
            type="text"
            value={learningSteps}
            onChange={(event) => setLearningSteps(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          />
          <span className="text-xs font-normal text-slate-500">
            Used when relearning or failing a card (e.g. &ldquo;10, 1440&rdquo; for 10 minutes and 1 day).
          </span>
        </label>

        <button
          type="submit"
          className="mt-2 inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 md:col-span-2"
        >
          Save settings
        </button>
      </form>
    </section>
  );
}
