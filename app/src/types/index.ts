export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

export interface ReviewLogEntry {
  id: string;
  cardId: string;
  timestamp: number;
  quality: ReviewQuality;
  interval: number;
  easeFactor: number;
}

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  image?: string;
  audio?: string;
  createdAt: number;
  updatedAt: number;
  due: number;
  interval: number;
  repetition: number;
  easeFactor: number;
  isNew: boolean;
  reviewHistory: ReviewLogEntry[];
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
}

export interface DeckSnapshot extends Deck {
  cards: Flashcard[];
}

export interface ReviewSettings {
  newCardsPerDay: number;
  maxInterval: number;
  defaultEaseFactor: number;
  learningSteps: number[];
}

export interface DeckState {
  decks: Deck[];
  cards: Flashcard[];
  settings: ReviewSettings;
  reviews: ReviewLogEntry[];
  activeDeckId?: string;
}
