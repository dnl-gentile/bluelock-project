'use client';

import { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useAuth } from '@lib/AuthContext';
import { db } from '@lib/firebase';
import { useBlueLockContentStore } from '@store/useBlueLockContentStore';
import { useAnriChatStore } from '@store/useAnriChatStore';
import { useEgoStore } from '@store/useEgoStore';
import { useAthleteProfileStore } from '@store/useAthleteProfileStore';

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
  pendingTrainingPlan: unknown;
  trainingPresets: unknown;
}) {
  return JSON.stringify(payload);
}

function serializeChatState(payload: {
  messages: unknown;
}) {
  return JSON.stringify(payload);
}

function serializeAthleteState(payload: {
  preferences: unknown;
  location: unknown;
  weather: unknown;
  dailyBriefing: unknown;
  notifications: unknown;
  lastDailyRoutineDate: unknown;
}) {
  return JSON.stringify(payload);
}

export default function FirestoreStateSync() {
  const { user, profile, loading } = useAuth();

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
  const pendingTrainingPlan = useBlueLockContentStore((state) => state.pendingTrainingPlan);
  const trainingPresets = useBlueLockContentStore((state) => state.trainingPresets);
  const bindContentOwner = useBlueLockContentStore((state) => state.bindOwner);
  const hydrateContentFromCloud = useBlueLockContentStore((state) => state.hydrateFromCloud);

  const chatOwnerUid = useAnriChatStore((state) => state.ownerUid);
  const chatMessages = useAnriChatStore((state) => state.messages);
  const bindChatOwner = useAnriChatStore((state) => state.bindOwner);
  const hydrateChatFromCloud = useAnriChatStore((state) => state.hydrateFromCloud);

  const athleteOwnerUid = useAthleteProfileStore((state) => state.ownerUid);
  const athletePreferences = useAthleteProfileStore((state) => state.preferences);
  const athleteLocation = useAthleteProfileStore((state) => state.location);
  const athleteWeather = useAthleteProfileStore((state) => state.weather);
  const athleteDailyBriefing = useAthleteProfileStore((state) => state.dailyBriefing);
  const athleteNotifications = useAthleteProfileStore((state) => state.notifications);
  const lastDailyRoutineDate = useAthleteProfileStore((state) => state.lastDailyRoutineDate);
  const bindAthleteOwner = useAthleteProfileStore((state) => state.bindOwner);
  const hydrateAthleteFromCloud = useAthleteProfileStore((state) => state.hydrateFromCloud);

  const [egoRemoteReady, setEgoRemoteReady] = useState(false);
  const [contentRemoteReady, setContentRemoteReady] = useState(false);
  const [chatRemoteReady, setChatRemoteReady] = useState(false);
  const [athleteRemoteReady, setAthleteRemoteReady] = useState(false);

  const skipNextEgoWriteRef = useRef(false);
  const skipNextContentWriteRef = useRef(false);
  const skipNextChatWriteRef = useRef(false);
  const skipNextAthleteWriteRef = useRef(false);
  const lastEgoSerializedRef = useRef<string | null>(null);
  const lastContentSerializedRef = useRef<string | null>(null);
  const lastChatSerializedRef = useRef<string | null>(null);
  const lastAthleteSerializedRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;

    const uid = user?.uid ?? null;
    setEgoRemoteReady(false);
    setContentRemoteReady(false);
    setChatRemoteReady(false);
    setAthleteRemoteReady(false);
    lastEgoSerializedRef.current = null;
    lastContentSerializedRef.current = null;
    lastChatSerializedRef.current = null;
    lastAthleteSerializedRef.current = null;
    skipNextEgoWriteRef.current = false;
    skipNextContentWriteRef.current = false;
    skipNextChatWriteRef.current = false;
    skipNextAthleteWriteRef.current = false;

    bindEgoOwner(uid);
    bindContentOwner(uid);
    bindChatOwner(uid);
    bindAthleteOwner(uid);

    // If role is coach, sync with the linked trainee instead of self
    const syncUid = (profile?.role === 'coach' && profile?.traineeId) ? profile.traineeId : uid;

    if (!syncUid || !db) return;

    const egoDocRef = doc(db, 'users', syncUid, 'appState', 'ego');
    const contentDocRef = doc(db, 'users', syncUid, 'appState', 'content');
    const chatDocRef = doc(db, 'users', syncUid, 'appState', 'chat');
    const athleteDocRef = doc(db, 'users', syncUid, 'appState', 'athlete');

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
          pendingTrainingPlan: data.pendingTrainingPlan ?? null,
          trainingPresets: data.trainingPresets ?? [],
        });

        lastContentSerializedRef.current = serialized;
        skipNextContentWriteRef.current = true;
        hydrateContentFromCloud(
          {
            wikiEntries: data.wikiEntries,
            trainingPlan: data.trainingPlan,
            pendingTrainingPlan: data.pendingTrainingPlan,
            trainingPresets: data.trainingPresets,
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

    const unsubscribeAthlete = onSnapshot(
      athleteDocRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setAthleteRemoteReady(true);
          return;
        }

        const data = snapshot.data();
        const serialized = serializeAthleteState({
          preferences: data.preferences ?? undefined,
          location: data.location ?? null,
          weather: data.weather ?? null,
          dailyBriefing: data.dailyBriefing ?? null,
          notifications: data.notifications ?? [],
          lastDailyRoutineDate: data.lastDailyRoutineDate ?? null,
        });

        lastAthleteSerializedRef.current = serialized;
        skipNextAthleteWriteRef.current = true;
        hydrateAthleteFromCloud(
          {
            preferences: data.preferences,
            location: data.location,
            weather: data.weather,
            dailyBriefing: data.dailyBriefing,
            notifications: data.notifications,
            lastDailyRoutineDate: data.lastDailyRoutineDate,
          },
          uid
        );
        setAthleteRemoteReady(true);
      },
      (error) => {
        console.error('Erro ao sincronizar perfil do atleta no Firestore', error);
        setAthleteRemoteReady(true);
      }
    );

    return () => {
      unsubscribeEgo();
      unsubscribeContent();
      unsubscribeChat();
      unsubscribeAthlete();
    };
  }, [
    user?.uid,
    profile?.role,
    profile?.traineeId,
    loading,
    bindEgoOwner,
    bindContentOwner,
    bindChatOwner,
    bindAthleteOwner,
    hydrateEgoFromCloud,
    hydrateContentFromCloud,
    hydrateChatFromCloud,
    hydrateAthleteFromCloud,
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
      pendingTrainingPlan,
      trainingPresets,
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
  }, [contentOwnerUid, contentRemoteReady, wikiEntries, trainingPlan, pendingTrainingPlan, trainingPresets]);

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

  useEffect(() => {
    if (!db || !athleteOwnerUid || !athleteRemoteReady) return;

    const payload = {
      preferences: athletePreferences,
      location: athleteLocation,
      weather: athleteWeather,
      dailyBriefing: athleteDailyBriefing,
      notifications: athleteNotifications,
      lastDailyRoutineDate,
    };
    const serialized = serializeAthleteState(payload);

    if (skipNextAthleteWriteRef.current) {
      skipNextAthleteWriteRef.current = false;
      return;
    }

    if (serialized === lastAthleteSerializedRef.current) {
      return;
    }

    lastAthleteSerializedRef.current = serialized;
    void setDoc(doc(db, 'users', athleteOwnerUid, 'appState', 'athlete'), payload).catch((error) => {
      console.error('Erro ao salvar perfil do atleta no Firestore', error);
      lastAthleteSerializedRef.current = null;
    });
  }, [
    athleteOwnerUid,
    athleteRemoteReady,
    athletePreferences,
    athleteLocation,
    athleteWeather,
    athleteDailyBriefing,
    athleteNotifications,
    lastDailyRoutineDate,
  ]);

  return null;
}
