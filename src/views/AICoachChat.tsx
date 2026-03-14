import { useEffect, useEffectEvent, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, Brain, BookOpen, Send, Sparkles, User } from 'lucide-react';
import { useEgoStore } from '../store/useEgoStore';
import { flattenWikiEntries } from '@lib/bluelock-content';
import type { AnriChatMessage, AnriMessage, AnriResponsePayload } from '@lib/anri/types';
import { materializeSkillTreeEntries, materializeTrainingPlan, materializeWikiEntries } from '@lib/anri/apply';
import { useBlueLockContentStore } from '@store/useBlueLockContentStore';
import { useAnriChatStore } from '@store/useAnriChatStore';
import { useAuth } from '@lib/AuthContext';
import { useAthleteProfileStore } from '@store/useAthleteProfileStore';

const anriAvatarImageClass = 'h-full w-full rounded-full object-cover object-[center_18%] scale-[0.9] transform-gpu';
const userAvatarImageClass = 'h-full w-full rounded-full object-cover object-center scale-[0.9] transform-gpu';
const avatarFrameClass = 'w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden border border-[#1d4ed8]/50 bg-[#151922] p-[1.5px]';

function createMessageId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function AICoachChat() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q');
  const hasBootstrappedInitialQuery = useRef(false);
  const { user, profile } = useAuth();
  const { xp, rank, skills, history, upsertSkills } = useEgoStore();
  const weather = useAthleteProfileStore((state) => state.weather);
  const preferences = useAthleteProfileStore((state) => state.preferences);
  const {
    wikiEntries,
    trainingPlan,
    trainingPresets,
    addWikiEntries,
    setTrainingPlan,
    suggestTrainingPlan,
    saveTrainingPreset,
    activateTrainingPreset,
  } = useBlueLockContentStore();
  const messages = useAnriChatStore((state) => state.messages);
  const appendMessage = useAnriChatStore((state) => state.appendMessage);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const sendMessage = useEffectEvent(async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isSending) return;

    const userMessage: AnriChatMessage = {
      id: createMessageId(),
      sender: 'user',
      text,
    };
    const pendingAiMessageId = createMessageId();
    const chatMessages = [...messages, userMessage];

    const conversation: AnriMessage[] = chatMessages.map((message) => ({
      sender: message.sender,
      text: message.text,
    }));

    const athlete = {
      xp,
      rank,
      unlockedSkills: skills
        .filter((skill) => skill.unlocked)
        .map((skill) => ({
          id: skill.id,
          name: skill.name,
          type: skill.type,
          tier: skill.tier,
          requiredXp: skill.requiredXp,
          unlocked: skill.unlocked,
          dependencyNames: skill.dependencies
            .map((dependencyId) => skills.find((candidate) => candidate.id === dependencyId)?.name)
            .filter((dependencyName): dependencyName is string => Boolean(dependencyName)),
        })),
      lockedSkillCount: skills.filter((skill) => !skill.unlocked).length,
      recentHistory: history.slice(0, 5).map((entry) => ({
        type: entry.type,
        xpEarned: entry.xpEarned,
        date: entry.date,
      })),
    };

    appendMessage(userMessage);
    setInput('');
    setError(null);
    setIsSending(true);

    try {
      const idToken = user ? await user.getIdToken() : null;
      const response = await fetch('/api/anri', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          messages: conversation,
          chatMessages,
          pendingAiMessageId,
          channel: 'chat',
          athlete,
          wikiEntries: flattenWikiEntries(wikiEntries),
          currentTraining: trainingPlan.drills,
          currentTrainingPlan: trainingPlan,
          environment: weather
            ? {
                weatherCondition: weather.condition,
                weatherDescription: weather.description,
                temperatureC: weather.temp,
                locationLabel: weather.locationLabel,
              }
            : undefined,
          preferences,
          trainingPresets: trainingPresets.map((preset) => ({
            id: preset.id,
            name: preset.name,
            focus: preset.plan.focus,
            rationale: preset.plan.rationale,
            savedAt: preset.savedAt,
          })),
          skillTree: skills.map((skill) => ({
            id: skill.id,
            name: skill.name,
            type: skill.type,
            tier: skill.tier,
            requiredXp: skill.requiredXp,
            description: skill.description,
            createdBy: skill.createdBy,
            linkedWikiEntryTitle: skill.linkedWikiEntryTitle,
            unlocked: skill.unlocked,
            dependencyIds: skill.dependencies,
            dependencyNames: skill.dependencies
              .map((dependencyId) => skills.find((candidate) => candidate.id === dependencyId)?.name)
              .filter((dependencyName): dependencyName is string => Boolean(dependencyName)),
          })),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Falha ao consultar a Anri.');
      }

      const aiMessage: AnriChatMessage = {
        id: pendingAiMessageId,
        sender: 'ai',
        text: payload.reply,
        response: payload,
      };

      if (payload.wikiEntries?.length) {
        addWikiEntries(materializeWikiEntries(payload.wikiEntries));
      }

      if (payload.trainingDirective?.action === 'activate_preset' && payload.trainingDirective.presetName) {
        const normalizedPresetName = payload.trainingDirective.presetName.trim().toLocaleLowerCase('pt-BR');
        const matchingPreset = trainingPresets.find(
          (preset) => preset.name.trim().toLocaleLowerCase('pt-BR') === normalizedPresetName
        );

        if (matchingPreset) {
          activateTrainingPreset(matchingPreset.id);
        }
      }

      if (payload.trainingPlan) {
        const nextPlan = materializeTrainingPlan(payload.trainingPlan, trainingPlan.drills);

        if (
          payload.trainingDirective?.action === 'save_preset' ||
          payload.trainingDirective?.action === 'save_preset_and_confirm_swap'
        ) {
          saveTrainingPreset(
            payload.trainingDirective.presetName || payload.trainingPlan.title,
            {
              ...nextPlan,
              source: 'anri',
              updatedAt: new Date().toISOString(),
            },
            'anri'
          );
        }

        if (
          !payload.trainingDirective ||
          payload.trainingDirective.action === 'confirm_swap' ||
          payload.trainingDirective.action === 'save_preset_and_confirm_swap' ||
          payload.trainingDirective.action === 'none'
        ) {
          suggestTrainingPlan(nextPlan, {
            suggestedBy: 'anri',
            presetName: payload.trainingDirective?.presetName ?? null,
          });
        }
      }

      if (payload.skillTreeEntries?.length) {
        upsertSkills(materializeSkillTreeEntries(payload.skillTreeEntries, skills));
      }

      appendMessage(aiMessage);
    } catch (sendError) {
      const message =
        sendError instanceof Error ? sendError.message : 'A Anri não conseguiu responder agora.';

      setError(message);
      appendMessage({
        id: createMessageId(),
        sender: 'ai',
        text: 'Não consegui acessar meus dados agora. Se a chave do Gemini ainda não estiver configurada, essa é a primeira coisa para ligar.',
      });
    } finally {
      setIsSending(false);
    }
  });

  useEffect(() => {
    if (!initialQuery || hasBootstrappedInitialQuery.current) return;
    hasBootstrappedInitialQuery.current = true;
    void sendMessage(initialQuery);
  }, [initialQuery, sendMessage]);

  // ── Voice recording via MediaRecorder → Whisper ──────────────────────
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    if (isRecording || isTranscribing) return;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        setIsTranscribing(true);

        try {
          const blob = new Blob(audioChunksRef.current, { type: mimeType });
          const form = new FormData();
          form.append('audio', blob, 'audio.webm');

          const resp = await fetch('/api/transcribe', { method: 'POST', body: form });
          const data = await resp.json();

          if (!resp.ok || !data.text) throw new Error(data.error || 'Transcrição vazia.');

          void sendMessage(data.text.trim());
        } catch (err: any) {
          setError(err?.message || 'Erro ao transcrever áudio.');
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      setError('Permissão de microfone negada ou dispositivo indisponível.');
    }
  }, [isRecording, isTranscribing, sendMessage]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      setIsTranscribing(true);
      mediaRecorderRef.current.stop();
    }
  }, []);
  // ────────────────────────────────────────────────────────────────────

  const latestAiResponse = [...messages].reverse().find((message) => message.sender === 'ai' && message.response)?.response;
  const suggestedPrompts = latestAiResponse?.suggestedNextPrompts?.length
    ? latestAiResponse.suggestedNextPrompts
    : [
        'Ajuste meu treino para foco em passes.',
        'Explique o que é metavisão.',
        'Estou cansado, monte um treino mais leve.',
      ];

  return (
    <div className="flex h-full min-h-0 w-full max-w-3xl mx-auto flex-col overflow-hidden">
      <div className="flex items-center gap-3 py-4 border-b border-white/5 shrink-0">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-[#1d4ed8] bg-[#151922] p-[2px]">
          <img src="/anri.jpg" alt="Anri" className={anriAvatarImageClass} />
        </div>
        <div>
          <h1 className="text-xl font-bold font-display uppercase tracking-wider text-white">Anri</h1>
          <p className="flex items-center gap-2 text-xs font-mono text-slate-500 uppercase">
            <span className={`w-2 h-2 rounded-full ${isSending ? 'bg-amber-300' : 'bg-emerald-400'} shadow-[0_0_10px_rgba(52,211,153,0.9)]`} />
            <span>{isSending ? 'Analisando Contexto' : 'Status: Online'}</span>
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto py-6 space-y-6 scroll-smooth px-2 no-scrollbar">
        {messages.map((msg) => {
          const isAI = msg.sender === 'ai';
          const responseTrainingPlan = msg.response?.trainingPlan;
          const trainingDirective = msg.response?.trainingDirective;
          const wikiEntries = msg.response?.wikiEntries ?? [];
          const skillTreeEntries = msg.response?.skillTreeEntries ?? [];
          const actionablePlan = responseTrainingPlan
            ? materializeTrainingPlan(responseTrainingPlan, trainingPlan.drills)
            : null;

          return (
            <div key={msg.id} className={`flex gap-3 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
              <div className={isAI ? avatarFrameClass : avatarFrameClass}>
                {isAI ? (
                  <img src="/anri.jpg" alt="Anri" className={anriAvatarImageClass} />
                ) : profile?.photoURL ? (
                  <img src={profile.photoURL} alt={profile.name || 'Jogador'} className={userAvatarImageClass} />
                ) : (
                  <User className="w-4 h-4 text-slate-300" />
                )}
              </div>

              <div className={`flex flex-col ${isAI ? 'items-start' : 'items-end'} max-w-[86%]`}>
                <div className={`p-4 rounded-2xl text-sm ${
                  isAI
                    ? 'bg-[#162032] border border-white/5 text-slate-300 rounded-tl-none'
                    : 'bg-[#1d4ed8] text-white rounded-tr-none'
                }`}>
                  {msg.text}
                </div>

                {responseTrainingPlan && (
                  <div className="mt-3 w-full rounded-2xl border border-[#1d4ed8]/30 bg-[#0a0e17] p-4 box-shadow-neon">
                    <div className="flex items-center gap-2 text-[#1d4ed8] mb-2">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-[11px] font-mono uppercase tracking-[0.24em]">Plano Sugerido</span>
                    </div>
                    <h3 className="text-white font-bold">{responseTrainingPlan.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{responseTrainingPlan.rationale}</p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-amber-300/90">
                      {trainingDirective?.action === 'save_preset'
                        ? 'Preset salvo. O treino atual só muda se você mandar.'
                        : trainingDirective?.action === 'activate_preset'
                        ? 'Preset ativado pela Anri.'
                        : 'Troca pendente de confirmação.'}
                    </p>
                    <div className="mt-3 space-y-3">
                      {responseTrainingPlan.drills.map((drill) => (
                        <div key={`${msg.id}-${drill.title}`} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-bold text-white uppercase tracking-wide">{drill.title}</span>
                            <span className="text-[10px] rounded-full bg-[#1d4ed8]/15 px-2 py-1 font-mono uppercase text-[#60a5fa]">
                              {drill.type}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-slate-400">{drill.description}</p>
                          <ul className="mt-3 space-y-1.5">
                            {drill.topics.map((topic) => (
                              <li key={topic} className="text-xs text-slate-300">
                                • {topic}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    {actionablePlan && trainingDirective?.action !== 'activate_preset' && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => setTrainingPlan(actionablePlan)}
                          className="rounded-full bg-[#1d4ed8] px-3 py-2 text-[11px] font-mono uppercase tracking-[0.18em] text-white"
                        >
                          Trocar treino atual
                        </button>
                        <button
                          onClick={() =>
                            saveTrainingPreset(
                              trainingDirective?.presetName || actionablePlan.title,
                              {
                                ...actionablePlan,
                                source: 'anri',
                                updatedAt: new Date().toISOString(),
                              },
                              'anri'
                            )
                          }
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-mono uppercase tracking-[0.18em] text-slate-300"
                        >
                          Salvar preset
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {wikiEntries.length > 0 && (
                  <div className="mt-3 w-full rounded-2xl border border-white/10 bg-[#0a0e17] p-4">
                    <div className="flex items-center gap-2 text-[#c084fc] mb-2">
                      <BookOpen className="w-4 h-4" />
                      <span className="text-[11px] font-mono uppercase tracking-[0.24em]">Entradas de Wiki</span>
                    </div>
                    <div className="space-y-3">
                      {wikiEntries.map((entry) => (
                        <div key={`${msg.id}-${entry.title}`} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="text-sm font-bold text-white">{entry.title}</h3>
                            <span className="text-[10px] rounded-full bg-white/5 px-2 py-1 font-mono uppercase text-slate-400">
                              {entry.category}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-slate-300 leading-relaxed">{entry.text}</p>
                          <p className="mt-2 text-[11px] text-slate-500">{entry.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {skillTreeEntries.length > 0 && (
                  <div className="mt-3 w-full rounded-2xl border border-[#1d4ed8]/20 bg-[#0a0e17] p-4">
                    <div className="flex items-center gap-2 text-[#1d4ed8] mb-2">
                      <Brain className="w-4 h-4" />
                      <span className="text-[11px] font-mono uppercase tracking-[0.24em]">Árvore do Ego</span>
                    </div>
                    <div className="space-y-3">
                      {skillTreeEntries.map((entry) => (
                        <div key={`${msg.id}-${entry.name}`} className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-white">{entry.name}</h3>
                            <span className="text-[10px] rounded-full bg-[#1d4ed8]/15 px-2 py-1 font-mono uppercase text-[#60a5fa]">
                              Tier {entry.tier}
                            </span>
                            <span className="text-[10px] rounded-full bg-white/5 px-2 py-1 font-mono uppercase text-slate-400">
                              {entry.type}
                            </span>
                            {entry.isPrerequisite && (
                              <span className="text-[10px] rounded-full bg-amber-400/10 px-2 py-1 font-mono uppercase text-amber-300">
                                Pré-requisito inferido
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-xs text-slate-300 leading-relaxed">{entry.description}</p>
                          {entry.dependencyTitles.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {entry.dependencyTitles.map((dependencyTitle) => (
                                <span
                                  key={`${entry.name}-${dependencyTitle}`}
                                  className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] uppercase tracking-wide text-slate-400"
                                >
                                  {dependencyTitle}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-400/15 bg-amber-400/5 px-3 py-2 text-[11px] text-amber-100/80">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
                            <span>{entry.reason}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex gap-3">
            <div className={avatarFrameClass}>
              <img src="/anri.jpg" alt="Anri" className={anriAvatarImageClass} />
            </div>
            <div className="rounded-2xl rounded-tl-none border border-white/5 bg-[#162032] px-4 py-3 text-sm text-slate-400">
              Anri está montando sua resposta com base no seu contexto...
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 pb-2 shrink-0">
        {error && (
          <div className="mb-3 rounded-xl border border-red-500/30 bg-red-950/30 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="mb-2 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => void sendMessage(prompt)}
              disabled={isSending}
              className="bg-white/5 whitespace-nowrap px-3 py-1.5 rounded-full text-[10px] uppercase font-mono text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
          <button
            onClick={() => void sendMessage('Explique meu próximo gargalo técnico com base no meu ego atual.')}
            disabled={isSending}
            className="bg-white/5 whitespace-nowrap px-3 py-1.5 rounded-full text-[10px] uppercase font-mono text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <Brain className="inline-block w-3 h-3 mr-1" />
            Gargalo Atual
          </button>
        </div>

        <div className="p-2 bg-[#0a0e17] border border-white/10 rounded-2xl flex items-center gap-2">
          <input
            type="text"
            className="flex-1 bg-transparent px-3 py-2 text-white placeholder-slate-600 focus:outline-none font-mono text-sm"
            placeholder={isRecording ? '🎙 Gravando...' : isTranscribing ? '⏳ Transcrevendo...' : 'Mude meu treino ou faça uma pergunta...'}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                void sendMessage(input);
              }
            }}
            disabled={isSending || isRecording || isTranscribing}
          />

          {/* Mic button — hold to record, release to auto-send */}
          <button
            type="button"
            onPointerDown={startRecording}
            onPointerUp={stopRecording}
            onPointerLeave={stopRecording}
            disabled={isSending || isTranscribing}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all select-none touch-none ${
              isRecording
                ? 'bg-[#ff003c] shadow-[0_0_20px_rgba(255,0,60,0.7)] scale-110'
                : isTranscribing
                ? 'bg-amber-400/20 border border-amber-400/40'
                : 'bg-white/10 hover:bg-white/20'
            } disabled:opacity-40`}
            title="Segure para gravar"
          >
            {isTranscribing ? (
              <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                className={`w-4 h-4 ${isRecording ? 'text-white' : 'text-slate-400'}`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 1a4 4 0 0 1 4 4v7a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-7 11a7 7 0 0 0 13.9 1.3l.1-.3H21a9 9 0 0 1-8 8.94V23h-2v-2.06A9 9 0 0 1 3 13h2z"/>
              </svg>
            )}
          </button>

          <button
            onClick={() => void sendMessage(input)}
            className="w-10 h-10 bg-[#1d4ed8] rounded-xl flex items-center justify-center text-white hover:brightness-110 transition-colors disabled:opacity-50"
            disabled={isSending || !input.trim()}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
