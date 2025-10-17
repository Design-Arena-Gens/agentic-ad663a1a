'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Flashcard } from '@/types';
import { RichTextEditor } from './RichTextEditor';

interface CardEditorProps {
  deckId: string;
  card?: Flashcard;
  onSave: (card: Partial<Flashcard>) => void;
  onCancel?: () => void;
}

export function CardEditor({ deckId, card, onSave, onCancel }: CardEditorProps) {
  const [front, setFront] = useState(card?.front ?? '');
  const [back, setBack] = useState(card?.back ?? '');
  const [image, setImage] = useState<string | undefined>(card?.image);

  useEffect(() => {
    setFront(card?.front ?? '');
    setBack(card?.back ?? '');
    setImage(card?.image);
  }, [card]);

  const handleImageInserted = (dataUrl: string) => {
    setImage(dataUrl);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!front.trim() && !back.trim()) return;
    onSave({
      id: card?.id,
      deckId,
      front,
      back,
      image,
      createdAt: card?.createdAt,
      due: card?.due,
      interval: card?.interval,
      repetition: card?.repetition,
      easeFactor: card?.easeFactor,
      isNew: card?.isNew,
      reviewHistory: card?.reviewHistory,
    });
    if (!card) {
      setFront('');
      setBack('');
      setImage(undefined);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <RichTextEditor
        value={front}
        onChange={setFront}
        placeholder="Front of the card..."
        label="Front"
        onImageInserted={handleImageInserted}
      />
      <RichTextEditor
        value={back}
        onChange={setBack}
        placeholder="Back of the card..."
        label="Back"
        onImageInserted={handleImageInserted}
      />
      {image ? (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <Image
            src={image}
            alt="Card illustration"
            width={64}
            height={64}
            className="h-16 w-16 flex-shrink-0 rounded-md object-cover"
            unoptimized
          />
          <button
            type="button"
            onClick={() => setImage(undefined)}
            className="text-sm font-medium text-rose-600 hover:underline"
          >
            Remove thumbnail
          </button>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          aria-label={card ? 'Update card' : 'Create card'}
        >
          {card ? 'Update card' : 'Add card'}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
