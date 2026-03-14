import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AnriChatMessage } from '@lib/anri/types';

function getWelcomeMessage(): AnriChatMessage {
  return {
    id: 'welcome',
    sender: 'ai',
    text: 'Olá. Eu sou a Anri, assistente do Ego. Posso ajustar seu treino, criar entradas na Bluelockpedia, encaixar novas técnicas na Árvore do Ego e orientar sua evolução no futebol.',
  };
}

interface AnriChatState {
  ownerUid: string | null;
  messages: AnriChatMessage[];
  bindOwner: (uid: string | null) => void;
  hydrateFromCloud: (payload: { messages?: AnriChatMessage[] }, uid: string) => void;
  appendMessage: (message: AnriChatMessage) => void;
  appendMessages: (messages: AnriChatMessage[]) => void;
  resetChat: () => void;
}

export const useAnriChatStore = create<AnriChatState>()(
  persist(
    (set) => ({
      ownerUid: null,
      messages: [getWelcomeMessage()],

      bindOwner: (uid) => {
        set((state) => {
          if (state.ownerUid === uid) {
            return state;
          }

          return {
            ownerUid: uid,
            messages: [getWelcomeMessage()],
          };
        });
      },

      hydrateFromCloud: (payload, uid) => {
        set({
          ownerUid: uid,
          messages: payload.messages?.length ? payload.messages : [getWelcomeMessage()],
        });
      },

      appendMessage: (message) => {
        set((state) => ({
          messages: [...state.messages, message],
        }));
      },

      appendMessages: (messages) => {
        set((state) => ({
          messages: [...state.messages, ...messages],
        }));
      },

      resetChat: () => {
        set({
          ownerUid: null,
          messages: [getWelcomeMessage()],
        });
      },
    }),
    {
      name: 'bluelock-anri-chat-v1',
    }
  )
);
