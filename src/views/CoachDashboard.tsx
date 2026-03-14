'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useAuth } from '@lib/AuthContext';
import { useEgoStore } from '@store/useEgoStore';
import { useBlueLockContentStore } from '@store/useBlueLockContentStore';
import { useAnriChatStore } from '@store/useAnriChatStore';
import { useAthleteProfileStore } from '@store/useAthleteProfileStore';
import { flattenWikiEntries } from '@lib/bluelock-content';
import { materializeSkillTreeEntries, materializeWikiEntries, materializeTrainingPlan } from '@lib/anri/apply';
import type { AnriChatMessage, AnriMessage, AnriResponsePayload } from '@lib/anri/types';
import {
  Shield, Users, TrendingUp, Zap, MessageSquare, Settings, CheckCircle2,
  BookOpen, GitBranch, Dumbbell, Send, AtSign, PlusCircle, Pencil,
  Trash2, Save, X, ChevronDown, ChevronUp, Calendar, BarChart2, Eye,
  LogOut
} from 'lucide-react';
import Link from 'next/link';

type DashboardTab = 'overview' | 'chat' | 'training' | 'wiki';

function createMessageId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function CoachDashboard() {
  const { user, profile, logout } = useAuth();
  const { xp, rank, skills, history, upsertSkills } = useEgoStore();
  const {
    wikiEntries, trainingPlan, trainingPresets,
    addWikiEntries, setTrainingPlan, suggestTrainingPlan,
    saveTrainingPreset, activateTrainingPreset,
  } = useBlueLockContentStore();
  const dailyBriefing = useAthleteProfileStore((state) => state.dailyBriefing);
  const weather = useAthleteProfileStore((state) => state.weather);
  const preferences = useAthleteProfileStore((state) => state.preferences);
  const messages = useAnriChatStore((state) => state.messages);
  const appendMessage = useAnriChatStore((state) => state.appendMessage);

  const [tab, setTab] = useState<DashboardTab>('overview');
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [editingTraining, setEditingTraining] = useState(false);
  const [expandedWikiCategory, setExpandedWikiCategory] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const allWikiEntries = flattenWikiEntries(wikiEntries);
  const unlockedSkills = skills.filter((s) => s.unlocked);
  const totalTrainingDays = history.filter((h) => h.type !== 'unlock').length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useEffectEvent(async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isSending) return;
    setChatError(null);

    const userMsg: AnriChatMessage = { id: createMessageId(), sender: 'user', text };
    const pendingAiId = createMessageId();
    const chatMessages = [...messages, userMsg];
    const conversation: AnriMessage[] = chatMessages.map((m) => ({ sender: m.sender, text: m.text }));

    const athlete = {
      xp, rank,
      unlockedSkills: unlockedSkills.map((s) => ({
        id: s.id, name: s.name, type: s.type, tier: s.tier,
        requiredXp: s.requiredXp, unlocked: s.unlocked,
        dependencyNames: s.dependencies
          .map((depId) => skills.find((c) => c.id === depId)?.name)
          .filter((n): n is string => Boolean(n)),
      })),
      lockedSkillCount: skills.filter((s) => !s.unlocked).length,
      recentHistory: history.slice(0, 5).map((e) => ({ type: e.type, xpEarned: e.xpEarned, date: e.date })),
    };

    appendMessage(userMsg);
    appendMessage({ id: pendingAiId, sender: 'ai', text: '...' });
    setIsSending(true);

    try {
      const idToken = user ? await (await import('firebase/auth')).getIdToken(user as any) : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['authorization'] = `Bearer ${idToken}`;

      const resp = await fetch('/api/anri', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: conversation,
          chatMessages: chatMessages,
          pendingAiMessageId: pendingAiId,
          channel: 'chat',
          athlete,
          wikiEntries: allWikiEntries,
          currentTraining: trainingPlan.drills,
          currentTrainingPlan: trainingPlan,
          skillTree: skills.map((s) => ({
            id: s.id, name: s.name, type: s.type, tier: s.tier,
            requiredXp: s.requiredXp, unlocked: s.unlocked,
            dependencyIds: s.dependencies,
          })),
          environment: weather ? {
            weatherCondition: weather.condition, weatherDescription: weather.description,
            temperatureC: weather.temp ?? null, locationLabel: weather.locationLabel,
          } : null,
          preferences,
          trainingPresets: trainingPresets.map((p) => ({
            id: p.id, name: p.name, focus: p.plan.focus,
            rationale: p.plan.rationale, savedAt: p.savedAt,
          })),
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => null);
        throw new Error(err?.error || `Status ${resp.status}`);
      }

      const payload: AnriResponsePayload = await resp.json();

      // Apply changes from coach-initiated Anri response
      if (payload.wikiEntries?.length) {
        const newEntries = materializeWikiEntries(payload.wikiEntries);
        addWikiEntries(newEntries);
      }
      if (payload.skillTreeEntries?.length) {
        const newSkills = materializeSkillTreeEntries(payload.skillTreeEntries, skills);
        upsertSkills(newSkills);
      }
      if (payload.trainingPlan) {
        const newPlan = materializeTrainingPlan(payload.trainingPlan, trainingPlan.drills);
        suggestTrainingPlan(newPlan);
      }

      appendMessage({
        id: pendingAiId,
        sender: 'ai',
        text: payload.reply,
        response: payload,
      });
    } catch (err: any) {
      setChatError(err?.message || 'Erro desconhecido.');
      appendMessage({ id: pendingAiId, sender: 'ai', text: '⚠️ Falha na comunicação com a Anri.' });
    } finally {
      setIsSending(false);
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const TABS: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Visão Geral', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'training', label: 'Treino', icon: <Dumbbell className="w-4 h-4" /> },
    { id: 'wiki', label: 'Wiki / Árvore', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'chat', label: 'Chat com Anri', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col space-y-6 max-w-5xl mx-auto py-6 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-2">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500 uppercase tracking-tighter">
            Painel Mestre
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-400 font-mono text-sm">
              Treinador: <span className="text-orange-500 font-bold">{profile?.name || 'Mestre'}</span>
            </p>
            <button 
              onClick={() => logout()}
              className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-red-500/70 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-3 h-3" /> [Sair]
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-orange-500" />
          <span className="text-sm text-orange-500 font-mono font-bold uppercase tracking-widest">Acesso Mestre</span>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
              tab === t.id
                ? 'bg-orange-500 text-black'
                : 'border border-white/10 bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="space-y-6 px-2">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#162032] p-5 rounded-2xl border border-white/5 flex flex-col gap-1">
              <TrendingUp className="w-5 h-5 text-[#1d4ed8]" />
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mt-1">Rank / XP</p>
              <p className="font-black text-white text-lg">Rank {rank}</p>
              <p className="text-xs text-[#1d4ed8] font-mono">{xp} XP</p>
            </div>
            <div className="bg-gradient-to-b from-orange-500/10 to-transparent p-5 rounded-2xl border border-orange-500/20 flex flex-col gap-1">
              <Zap className="w-5 h-5 text-orange-500" />
              <p className="text-[10px] font-mono uppercase tracking-widest text-orange-500 mt-1">Treinos</p>
              <p className="font-black text-white text-lg">{totalTrainingDays}</p>
              <p className="text-xs text-slate-500 font-mono">Dias totais</p>
            </div>
            <div className="bg-[#162032] p-5 rounded-2xl border border-white/5 flex flex-col gap-1">
              <GitBranch className="w-5 h-5 text-[#3b82f6]" />
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mt-1">Habilidades</p>
              <p className="font-black text-white text-lg">{unlockedSkills.length}</p>
              <p className="text-xs text-slate-500 font-mono">Desbloqueadas</p>
            </div>
            <div className="bg-[#162032] p-5 rounded-2xl border border-white/5 flex flex-col gap-1">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mt-1">Wiki</p>
              <p className="font-black text-white text-lg">{allWikiEntries.length}</p>
              <p className="text-xs text-slate-500 font-mono">Entradas</p>
            </div>
          </div>

          {/* Recent History */}
          <div className="bg-[#0a0e17] rounded-3xl border border-white/10 p-6">
            <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-500" /> Histórico Recente
            </h2>
            {history.length === 0 ? (
              <p className="text-slate-600 text-sm">Nenhum histórico ainda.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {history.slice(0, 10).map((entry, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/[0.03] px-3 py-2 rounded-xl">
                    <span className="text-xs text-slate-400 font-mono uppercase">{entry.type}</span>
                    <span className="text-xs text-[#1d4ed8] font-mono">+{entry.xpEarned} XP</span>
                    <span className="text-[10px] text-slate-600 font-mono">{entry.date?.slice(0, 10)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unlocked Skills */}
          <div className="bg-[#0a0e17] rounded-3xl border border-white/10 p-6">
            <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-[#3b82f6]" /> Árvore de Habilidades
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className={`px-3 py-2 rounded-xl border text-xs ${
                    skill.unlocked
                      ? 'border-[#1d4ed8]/40 bg-[#1d4ed8]/10 text-[#60a5fa]'
                      : 'border-white/5 bg-black/20 text-slate-600'
                  }`}
                >
                  <p className="font-bold truncate">{skill.name}</p>
                  <p className="font-mono text-[10px] mt-0.5 text-slate-500">{skill.type} · T{skill.tier}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TRAINING TAB */}
      {tab === 'training' && (
        <div className="space-y-4 px-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">{trainingPlan.title}</h2>
            <button
              onClick={() => setEditingTraining(!editingTraining)}
              className="flex items-center gap-2 bg-[#162032] border border-white/10 px-4 py-2 rounded-xl text-sm font-bold uppercase transition-all hover:bg-white/5 text-white"
            >
              {editingTraining ? <><Save className="w-4 h-4" /> Concluir</> : <><Pencil className="w-4 h-4" /> Editar Treino</>}
            </button>
          </div>

          <p className="text-sm text-slate-400 px-1">{trainingPlan.rationale}</p>

          <div className="flex flex-col gap-3">
            {trainingPlan.drills.map((drill) => (
              <div key={drill.id} className="bg-[#0a0e17] border border-white/5 p-4 rounded-2xl flex items-center justify-between group transition-colors hover:bg-[#162032]">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{drill.emoji}</span>
                  <div>
                    <h3 className="font-bold text-white uppercase">{drill.title}</h3>
                    <p className="text-xs font-mono text-slate-500 uppercase">{drill.type}</p>
                  </div>
                </div>
                {editingTraining && (
                  <button className="text-xs font-bold uppercase text-red-400 bg-red-400/10 px-3 py-1.5 rounded-full border border-red-400/20 hover:bg-red-400/20 flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Remover
                  </button>
                )}
              </div>
            ))}
            {editingTraining && (
              <button className="w-full mt-2 border-2 border-dashed border-white/10 p-4 rounded-2xl text-slate-400 font-bold uppercase tracking-wider text-sm hover:border-orange-500/50 hover:text-orange-500 transition-colors flex items-center justify-center gap-2">
                <PlusCircle className="w-4 h-4" /> Adicionar Exercício via Anri
              </button>
            )}
          </div>

          {/* Presets */}
          {trainingPresets.length > 0 && (
            <div className="bg-[#0a0e17] rounded-3xl border border-white/10 p-6 mt-4">
              <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-slate-400 mb-4">Presets Salvos</h3>
              <div className="space-y-2">
                {trainingPresets.map((preset) => (
                  <div key={preset.id} className="bg-white/[0.03] border border-white/5 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-sm">{preset.name}</p>
                      <p className="text-[10px] font-mono text-slate-500 uppercase mt-0.5">{preset.plan.focus}</p>
                    </div>
                    <button
                      onClick={() => activateTrainingPreset(preset.id)}
                      className="text-[10px] font-mono uppercase tracking-widest text-[#60a5fa] bg-[#1d4ed8]/10 px-3 py-1.5 rounded-full border border-[#1d4ed8]/20"
                    >
                      Ativar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* WIKI TAB */}
      {tab === 'wiki' && (
        <div className="space-y-4 px-2">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Bluelockpedia</h2>
            <button
              onClick={() => { setTab('chat'); setInput('@anri Crie uma nova entrada na wiki: '); }}
              className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 px-4 py-2 rounded-xl text-sm font-bold uppercase text-orange-400 hover:bg-orange-500/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" /> Nova entrada
            </button>
          </div>

          {Object.entries(wikiEntries).map(([category, entries]) => (
            <div key={category} className="bg-[#0a0e17] rounded-2xl border border-white/5 overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-5 py-4 text-left"
                onClick={() => setExpandedWikiCategory(expandedWikiCategory === category ? null : category)}
              >
                <span className="font-bold text-white uppercase font-mono text-sm tracking-widest">{category} <span className="text-slate-500 font-normal">({entries.length})</span></span>
                {expandedWikiCategory === category ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {expandedWikiCategory === category && (
                <div className="border-t border-white/5 px-5 py-4 space-y-3">
                  {entries.map((entry) => (
                    <div key={entry.id} className="bg-white/5 px-4 py-3 rounded-xl">
                      <p className="font-bold text-sm text-white">{entry.title}</p>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{entry.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CHAT TAB */}
      {tab === 'chat' && (
        <div className="flex flex-col px-2 gap-4 min-h-[60vh]">
          <div className="flex items-center gap-3 mb-1">
            <MessageSquare className="w-5 h-5 text-orange-500" />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Chat do Treinador</h2>
              <p className="text-[11px] text-slate-500 font-mono">Use <span className="text-orange-400">@anri</span> para criar novas entradas na Wiki, novas habilidades e alterar treinos.</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[50vh] min-h-[200px] pr-1 no-scrollbar">
            {messages.length === 0 && (
              <div className="text-center py-8 text-slate-600 font-mono text-xs">
                Nenhuma mensagem ainda. Digite @anri para começar.
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                  msg.sender === 'user'
                    ? 'bg-orange-500/20 border border-orange-500/30 text-white ml-auto'
                    : 'bg-[#162032] border border-white/5 text-slate-200'
                }`}>
                  {msg.sender === 'ai' && (
                    <p className="text-[10px] font-mono uppercase tracking-widest text-orange-400 mb-1">Anri</p>
                  )}
                  <p className="leading-relaxed">{msg.text}</p>
                  {msg.response?.wikiEntries?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {msg.response.wikiEntries.map((w, i) => (
                        <span key={i} className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                          📖 {w.title}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {msg.response?.skillTreeEntries?.length ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {msg.response.skillTreeEntries.map((s, i) => (
                        <span key={i} className="text-[10px] bg-[#1d4ed8]/10 border border-[#1d4ed8]/30 text-[#60a5fa] px-2 py-0.5 rounded-full font-mono">
                          ⚡ {s.name}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {chatError && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400 text-xs font-mono px-4 py-3 rounded-xl">
              {chatError}
            </div>
          )}

          {/* Suggested prompts */}
          <div className="flex flex-wrap gap-2">
            {[
              '@anri Crie uma nova técnica de drible para a wiki',
              '@anri Sugira um treino mais intenso para hoje',
              '@anri Adicione um pré-requisito de velocidade ao sprint',
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInput(suggestion)}
                className="text-[10px] font-mono border border-white/10 bg-white/5 text-slate-400 hover:text-white px-3 py-1.5 rounded-full truncate max-w-[220px] transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as any); }
                }}
                rows={2}
                placeholder="@anri Crie uma nova técnica de chute esquerda..."
                className="w-full bg-[#0a0e17] border border-white/10 rounded-2xl px-4 py-3 pr-12 text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 font-mono text-sm resize-none"
              />
              <AtSign className="absolute right-3 bottom-3 w-4 h-4 text-slate-600" />
            </div>
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="bg-orange-500 text-black p-3 rounded-2xl hover:bg-orange-400 transition-colors disabled:opacity-40 shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
