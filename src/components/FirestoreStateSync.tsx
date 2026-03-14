'use client';

import { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useAuth } from '@lib/AuthContext';
import { db } from '@lib/firebase';
import { useBlueLockContentStore } from '@store/useBlueLockContentStore';
import { useAnriChatStore } from '@store/useAnriChatStore';
import { useEgoStore } from '@store/useEgoStore';

function serializeEgoState(payload: {
  xp: number;
  rank: string;
  skills: unknown;
  history: unknown;
}) {
  return JSON.stringify(payload);
}

function serializeContentState(payload: {
  wikiEntries: unknown;
  trainingPlan: unknown;
}) {
  return JSON.stringify(payload);
}

function serializeChatState(payload: {
  messages: unknown;
}) {
  return JSON.stringify(payload);
}

export default function FirestoreStateSync() {
  const { user, loading } = useAuth();

  const egoOwnerUid = useEgoStore((state) => state.ownerUid);
  const xp = useEgoStore((state) => state.xp);
  const rank = useEgoStore((state) => state.rank);
  const skills = useEgoStore((state) => state.skills);
  const history = useEgoStore((state) => state.history);
  const bindEgoOwner = useEgoStore((state) => state.bindOwner);
  const hydrateEgoFromCloud = useEgoStore((state) => state.hydrateFromCloud);

  const contentOwnerUid = useBlueLockContentStore((state) => state.ownerUid);
  const wikiEntries = useBlueLockContentStore((state) => state.wikiEntries);
  const trainingPlan = useBlueLockContentStore((state) => state.trainingPlan);
  const bindContentOwner = useBlueLockContentStore((state) => state.bindOwner);
  const hydrateContentFromCloud = useBlueLockContentStore((state) => state.hydrateFromCloud);

  const chatOwnerUid = useAnriChatStore((state) => state.ownerUid);
  const chatMessages = useAnriChatStore((state) => state.messages);
  const bindChatOwner = useAnriChatStore((state) => state.bindOwner);
  const hydrateChatFromCloud = useAnriChatStore((state) => state.hydrateFromCloud);

  const [egoRemoteReady, setEgoRemoteReady] = useState(false);
  const [contentRemoteReady, setContentRemoteReady] = useState(false);
  const [chatRemoteReady, setChatRemoteReady] = useState(false);

  const skipNextEgoWriteRef = useRef(false);
  const skipNextContentWriteRef = useRef(false);
  const skipNextChatWriteRef = useRef(false);
  const lastEgoSerializedRef = useRef<string | null>(null);
  const lastContentSerializedRef = useRef<string | null>(null);
  const lastChatSerializedRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;

    const uid = user?.uid ?? null;
    setEgoRemoteReady(false);
    setContentRemoteReady(false);
    setChatRemoteReady(false);
    lastEgoSerializedRef.current = null;
    lastContentSerializedRef.current = null;
    lastChatSerializedRef.current = null;
    skipNextEgoWriteRef.current = false;
    skipNextContentWriteRef.current = false;
    skipNextChatWriteRef.current = false;

    bindEgoOwner(uid);
    bindContentOwner(uid);
    bindChatOwner(uid);

    if (!uid || !db) return;

    const egoDocRef = doc(db, 'users', uid, 'appState', 'ego');
    const contentDocRef = doc(db, 'users', uid, 'appState', 'content');
    const chatDocRef = doc(db, 'users', uid, 'appState', 'chat');

    const unsubscribeEgo = onSnapshot(
      egoDocRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setEgoRemoteReady(true);
          return;
        }

        const data = snapshot.data();
        const serialized = serializeEgoState({
          xp: data.xp ?? 0,
          rank: data.rank ?? 'Z',
          skills: data.skills ?? [],
          history: data.history ?? [],
        });

        lastEgoSerializedRef.current = serialized;
        skipNextEgoWriteRef.current = true;
        hydrateEgoFromCloud(
          {
            xp: data.xp ?? 0,
            rank: data.rank ?? 'Z',
            skills: data.skills ?? [],
            history: data.history ?? [],
          },
          uid
        );
        setEgoRemoteReady(true);
      },
      (error) => {
        console.error('Erro ao sincronizar Ego do Firestore', error);
        setEgoRemoteReady(true);
      }
    );

    const unsubscribeContent = onSnapshot(
      contentDocRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setContentRemoteReady(true);
          return;
        }

        const data = snapshot.data();
        const serialized = serializeContentState({
          wikiEntries: data.wikiEntries ?? undefined,
          trainingPlan: data.trainingPlan ?? undefined,
        });

        lastContentSerializedRef.current = serialized;
        skipNextContentWriteRef.current = true;
        hydrateContentFromCloud(
          {
            wikiEntries: data.wikiEntries,
            trainingPlan: data.trainingPlan,
          },
          uid
        );
        setContentRemoteReady(true);
      },
      (error) => {
        console.error('Erro ao sincronizar conteúdo do Firestore', error);
        setContentRemoteReady(true);
      }
    );

    const unsubscribeChat = onSnapshot(
      chatDocRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setChatRemoteReady(true);
          return;
        }

        const data = snapshot.data();
        const serialized = serializeChatState({
          messages: data.messages ?? [],
        });

        lastChatSerializedRef.current = serialized;
        skipNextChatWriteRef.current = true;
        hydrateChatFromCloud(
          {
            messages: data.messages ?? [],
          },
          uid
        );
        setChatRemoteReady(true);
      },
      (error) => {
        console.error('Erro ao sincronizar chat da Anri no Firestore', error);
        setChatRemoteReady(true);
      }
    );

    return () => {
      unsubscribeEgo();
      unsubscribeContent();
      unsubscribeChat();
    };
  }, [
    user?.uid,
    loading,
    bindEgoOwner,
    bindContentOwner,
    bindChatOwner,
    hydrateEgoFromCloud,
    hydrateContentFromCloud,
    hydrateChatFromCloud,
  ]);

  useEffect(() => {
    if (!db || !egoOwnerUid || !egoRemoteReady) return;

    const payload = {
      xp,
      rank,
      skills,
      history,
    };
    const serialized = serializeEgoState(payload);

    if (skipNextEgoWriteRef.current) {
      skipNextEgoWriteRef.current = false;
      return;
    }

    if (serialized === lastEgoSerializedRef.current) {
      return;
    }

    lastEgoSerializedRef.current = serialized;
    void setDoc(doc(db, 'users', egoOwnerUid, 'appState', 'ego'), payload).catch((error) => {
      console.error('Erro ao salvar Ego no Firestore', error);
      lastEgoSerializedRef.current = null;
    });
  }, [egoOwnerUid, egoRemoteReady, xp, rank, skills, history]);

  useEffect(() => {
    if (!db || !contentOwnerUid || !contentRemoteReady) return;

    const payload = {
      wikiEntries,
      trainingPlan,
    };
    const serialized = serializeContentState(payload);

    if (skipNextContentWriteRef.current) {
      skipNextContentWriteRef.current = false;
      return;
    }

    if (serialized === lastContentSerializedRef.current) {
      return;
    }

    lastContentSerializedRef.current = serialized;
    void setDoc(doc(db, 'users', contentOwnerUid, 'appState', 'content'), payload).catch((error) => {
      console.error('Erro ao salvar conteúdo do Firestore', error);
      lastContentSerializedRef.current = null;
    });
  }, [contentOwnerUid, contentRemoteReady, wikiEntries, trainingPlan]);

  useEffect(() => {
    if (!db || !chatOwnerUid || !chatRemoteReady) return;

    const payload = {
      messages: chatMessages,
    };
    const serialized = serializeChatState(payload);

    if (skipNextChatWriteRef.current) {
      skipNextChatWriteRef.current = false;
      return;
    }

    if (serialized === lastChatSerializedRef.current) {
      return;
    }

    lastChatSerializedRef.current = serialized;
    void setDoc(doc(db, 'users', chatOwnerUid, 'appState', 'chat'), payload).catch((error) => {
      console.error('Erro ao salvar chat da Anri no Firestore', error);
      lastChatSerializedRef.current = null;
    });
  }, [chatOwnerUid, chatRemoteReady, chatMessages]);

  return null;
}
