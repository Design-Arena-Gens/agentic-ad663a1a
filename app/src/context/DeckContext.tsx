'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { DeckState, Deck, Flashcard, ReviewLogEntry, ReviewQuality, ReviewSettings } from '@/types';
import { v4 as uuid } from 'uuid';

const STORAGE_KEY = 'agentic-spaced-repetition-state';

const defaultSettings: ReviewSettings = {
  newCardsPerDay: 20,
  maxInterval: 90,
  defaultEaseFactor: 2.5,
  learningSteps: [10, 1440], // minutes: 10 minutes, 1 day
};

export const defaultState: DeckState = {
  decks: [],
  cards: [],
  settings: defaultSettings,
  reviews: [],
};

type Action =
  | { type: 'INIT'; payload: DeckState }
  | { type: 'ADD_DECK'; payload: { deck: Deck } }
  | { type: 'UPDATE_DECK'; payload: { deckId: string; data: Partial<Omit<Deck, 'id'>> } }
  | { type: 'DELETE_DECK'; payload: { deckId: string } }
  | { type: 'SET_ACTIVE_DECK'; payload: { deckId?: string } }
  | { type: 'UPSERT_CARD'; payload: { card: Flashcard } }
  | { type: 'DELETE_CARD'; payload: { cardId: string } }
  | { type: 'BULK_ADD_CARDS'; payload: { cards: Flashcard[] } }
  | { type: 'UPDATE_SETTINGS'; payload: { settings: Partial<ReviewSettings> } }
  | { type: 'LOG_REVIEW'; payload: { log: ReviewLogEntry } };

function deckReducer(state: DeckState, action: Action): DeckState {
  switch (action.type) {
    case 'INIT':
      return { ...state, ...action.payload };
    case 'ADD_DECK': {
      const decks = [...state.decks, action.payload.deck];
      return { ...state, decks, activeDeckId: action.payload.deck.id };
    }
    case 'UPDATE_DECK': {
      const decks = state.decks.map((deck) =>
        deck.id === action.payload.deckId ? { ...deck, ...action.payload.data } : deck,
      );
      return { ...state, decks };
    }
    case 'DELETE_DECK': {
      const decks = state.decks.filter((deck) => deck.id !== action.payload.deckId);
      const cards = state.cards.filter((card) => card.deckId !== action.payload.deckId);
      const activeDeckId =
        state.activeDeckId === action.payload.deckId ? decks.at(0)?.id : state.activeDeckId;
      return { ...state, decks, cards, activeDeckId };
    }
    case 'SET_ACTIVE_DECK':
      return { ...state, activeDeckId: action.payload.deckId };
    case 'UPSERT_CARD': {
      const existing = state.cards.some((card) => card.id === action.payload.card.id);
      const cards = existing
        ? state.cards.map((card) => (card.id === action.payload.card.id ? action.payload.card : card))
        : [...state.cards, action.payload.card];
      return { ...state, cards };
    }
    case 'DELETE_CARD': {
      const cards = state.cards.filter((card) => card.id !== action.payload.cardId);
      return { ...state, cards };
    }
    case 'BULK_ADD_CARDS': {
      const cards = [...state.cards, ...action.payload.cards];
      return { ...state, cards };
    }
    case 'UPDATE_SETTINGS': {
      const settings = { ...state.settings, ...action.payload.settings };
      return { ...state, settings };
    }
    case 'LOG_REVIEW': {
      const reviews = [action.payload.log, ...state.reviews].slice(0, 1000);
      const cards = state.cards.map((card) =>
        card.id === action.payload.log.cardId
          ? { ...card, reviewHistory: [action.payload.log, ...card.reviewHistory] }
          : card,
      );
      return { ...state, reviews, cards };
    }
    default:
      return state;
  }
}

interface DeckContextValue extends DeckState {
  addDeck: (data: Pick<Deck, 'name' | 'description'>) => Deck;
  updateDeck: (deckId: string, data: Partial<Omit<Deck, 'id'>>) => void;
  deleteDeck: (deckId: string) => void;
  setActiveDeck: (deckId?: string) => void;
  upsertCard: (card: Partial<Flashcard> & { deckId: string; id?: string }) => Flashcard;
  deleteCard: (cardId: string) => void;
  bulkAddCards: (cards: Array<Partial<Flashcard> & { deckId: string }>) => Flashcard[];
  updateSettings: (settings: Partial<ReviewSettings>) => void;
  logReview: (cardId: string, quality: ReviewQuality, updates: Partial<Flashcard>) => void;
}

const DeckContext = createContext<DeckContextValue | undefined>(undefined);

function prepareCard(input: Partial<Flashcard> & { deckId: string; id?: string }): Flashcard {
  const now = Date.now();
  const reviewHistory = input.reviewHistory ? [...input.reviewHistory] : [];
  return {
    id: input.id ?? uuid(),
    deckId: input.deckId,
    front: input.front ?? '',
    back: input.back ?? '',
    image: input.image,
    audio: input.audio,
    createdAt: input.createdAt ?? now,
    updatedAt: now,
    due: input.due ?? now,
    interval: input.interval ?? 1,
    repetition: input.repetition ?? 0,
    easeFactor: input.easeFactor ?? defaultSettings.defaultEaseFactor,
    isNew: input.isNew ?? true,
    reviewHistory,
  };
}

export function DeckProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(deckReducer, defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DeckState;
        dispatch({ type: 'INIT', payload: { ...defaultState, ...parsed } });
      }
      setHydrated(true);
    } catch (error) {
      console.warn('Failed to restore state', error);
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const addDeck = useCallback(
    (data: Pick<Deck, 'name' | 'description'>) => {
      const deck: Deck = { id: uuid(), name: data.name, description: data.description };
      dispatch({ type: 'ADD_DECK', payload: { deck } });
      return deck;
    },
    [dispatch],
  );

  const updateDeck = useCallback(
    (deckId: string, data: Partial<Omit<Deck, 'id'>>) => {
      dispatch({ type: 'UPDATE_DECK', payload: { deckId, data } });
    },
    [dispatch],
  );

  const deleteDeck = useCallback(
    (deckId: string) => dispatch({ type: 'DELETE_DECK', payload: { deckId } }),
    [dispatch],
  );

  const setActiveDeck = useCallback(
    (deckId?: string) => dispatch({ type: 'SET_ACTIVE_DECK', payload: { deckId } }),
    [dispatch],
  );

  const upsertCard = useCallback(
    (card: Partial<Flashcard> & { deckId: string; id?: string }) => {
      const prepared = prepareCard(card);
      dispatch({ type: 'UPSERT_CARD', payload: { card: prepared } });
      return prepared;
    },
    [dispatch],
  );

  const deleteCard = useCallback(
    (cardId: string) => dispatch({ type: 'DELETE_CARD', payload: { cardId } }),
    [dispatch],
  );

  const bulkAddCards = useCallback(
    (cards: Array<Partial<Flashcard> & { deckId: string }>) => {
      const prepared = cards.map(prepareCard);
      dispatch({ type: 'BULK_ADD_CARDS', payload: { cards: prepared } });
      return prepared;
    },
    [dispatch],
  );

  const updateSettings = useCallback(
    (settings: Partial<ReviewSettings>) =>
      dispatch({ type: 'UPDATE_SETTINGS', payload: { settings } }),
    [dispatch],
  );

  const logReview = useCallback(
    (cardId: string, quality: ReviewQuality, updates: Partial<Flashcard>) => {
      const now = Date.now();
      const log: ReviewLogEntry = {
        id: uuid(),
        cardId,
        timestamp: now,
        quality,
        interval: updates.interval ?? 1,
        easeFactor: updates.easeFactor ?? defaultSettings.defaultEaseFactor,
      };
      dispatch({ type: 'LOG_REVIEW', payload: { log } });
      const existing = state.cards.find((card) => card.id === cardId);
      if (!existing) return;
      const merged: Flashcard = {
        ...existing,
        ...updates,
        updatedAt: now,
        reviewHistory: [log, ...existing.reviewHistory],
      };
      dispatch({ type: 'UPSERT_CARD', payload: { card: merged } });
    },
    [dispatch, state.cards],
  );

  const value = useMemo(
    () => ({
      ...state,
      addDeck,
      updateDeck,
      deleteDeck,
      setActiveDeck,
      upsertCard,
      deleteCard,
      bulkAddCards,
      updateSettings,
      logReview,
    }),
    [state, addDeck, updateDeck, deleteDeck, setActiveDeck, upsertCard, deleteCard, bulkAddCards, updateSettings, logReview],
  );

  return <DeckContext.Provider value={value}>{children}</DeckContext.Provider>;
}

export function useDeckContext() {
  const ctx = useContext(DeckContext);
  if (!ctx) {
    throw new Error('useDeckContext must be used within DeckProvider');
  }
  return ctx;
}
