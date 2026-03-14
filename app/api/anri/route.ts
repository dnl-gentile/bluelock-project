import { NextResponse } from 'next/server';
import {
  DEFAULT_TRAINING_DRILLS,
  DEFAULT_WIKI_ENTRIES,
  flattenWikiEntries,
} from '@lib/bluelock-content';
import {
  groupWikiEntries,
  materializeSkillTreeEntries,
  materializeTrainingPlan,
  materializeWikiEntries,
  mergeSkillCollections,
  mergeWikiEntryRecords,
} from '@lib/anri/apply';
import type {
  AnriAthleteSkillContext,
  AnriChatMessage,
  AnriExecutionPlan,
  AnriRequest,
  AnriResponsePayload,
  AnriVoiceLayer,
} from '@lib/anri/types';
import { cloneSkills, createSkillId, DEFAULT_SKILLS, type Skill } from '@lib/ego-domain';
import { getFirebaseAdminAuth, getFirebaseAdminDb } from '@lib/firebase-admin';

export const runtime = 'nodejs';

const GEMINI_FRONTIER_STRUCTURING_MODEL =
  process.env.GEMINI_ANRI_FRONTIER_MODEL ||
  process.env.GEMINI_ANRI_STRUCTURING_MODEL ||
  process.env.GEMINI_ANRI_PLANNING_MODEL ||
  process.env.GEMINI_ANRI_MODEL ||
  'gemini-2.5-pro';
const GEMINI_SIMPLE_STRUCTURING_MODEL =
  process.env.GEMINI_ANRI_SIMPLE_STRUCTURING_MODEL ||
  'gemini-2.5-flash';
const GEMINI_RESPONSE_MODEL =
  process.env.GEMINI_ANRI_RESPONSE_MODEL ||
  'gemini-2.5-flash';

function getGeminiEndpoint(model: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

const ANRI_PLAN_SCHEMA = {
  type: 'object',
  required: ['intent', 'rationale', 'responseBrief', 'priorities', 'trainingPlan', 'wikiEntries', 'skillTreeEntries'],
  propertyOrdering: ['intent', 'rationale', 'responseBrief', 'priorities', 'trainingPlan', 'wikiEntries', 'skillTreeEntries'],
  properties: {
    intent: {
      type: 'string',
      enum: ['general_guidance', 'training_adjustment', 'wiki_creation', 'hybrid'],
    },
    rationale: { type: 'string' },
    responseBrief: { type: 'string' },
    priorities: {
      type: 'array',
      items: { type: 'string' },
    },
    trainingPlan: {
      type: ['object', 'null'],
      required: ['title', 'focus', 'rationale', 'appliesToToday', 'drills'],
      properties: {
        title: { type: 'string' },
        focus: { type: 'string' },
        rationale: { type: 'string' },
        appliesToToday: { type: 'boolean' },
        drills: {
          type: 'array',
          items: {
            type: 'object',
            required: ['title', 'type', 'description', 'topics', 'sourceWikiTitles', 'isNew'],
            properties: {
              title: { type: 'string' },
              type: {
                type: 'string',
                enum: ['chute', 'drible', 'velocidade', 'mentalidade', 'passe', 'resistencia'],
              },
              description: { type: 'string' },
              topics: {
                type: 'array',
                items: { type: 'string' },
              },
              sourceWikiTitles: {
                type: 'array',
                items: { type: 'string' },
              },
              isNew: { type: 'boolean' },
            },
          },
        },
      },
    },
    wikiEntries: {
      type: 'array',
      items: {
        type: 'object',
        required: ['category', 'title', 'text', 'reason', 'relatedDrillTitle'],
        properties: {
          category: {
            type: 'string',
            enum: ['chute', 'velocidade', 'drible', 'tatica', 'passe', 'resistencia'],
          },
          title: { type: 'string' },
          text: { type: 'string' },
          reason: { type: 'string' },
          relatedDrillTitle: { type: ['string', 'null'] },
        },
      },
    },
    skillTreeEntries: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'description', 'type', 'tier', 'requiredXp', 'wikiTitle', 'dependencyTitles', 'reason', 'isPrerequisite'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          type: {
            type: 'string',
            enum: ['chute', 'drible', 'velocidade', 'mentalidade', 'passe', 'resistencia'],
          },
          tier: { type: 'integer', enum: [1, 2, 3, 4, 5] },
          requiredXp: { type: 'integer' },
          wikiTitle: { type: 'string' },
          dependencyTitles: {
            type: 'array',
            items: { type: 'string' },
          },
          reason: { type: 'string' },
          isPrerequisite: { type: 'boolean' },
        },
      },
    },
  },
};

const ANRI_PLAN_PROMPT = `
Voce e o nucleo de planejamento tecnico da Anri Teieri no projeto Blue Lock.

Seu papel:
- analisar o pedido do atleta
- decidir qual e a melhor resposta estrutural
- montar treino, wiki e arvore do ego quando necessario
- inferir pre-requisitos tecnicos ausentes para habilidades complexas
- devolver um plano interno consistente para outra camada redigir a resposta final

Regras:
- seja especifica, objetiva e util
- nao invente que algo ja existe se nao estiver no contexto
- se criar uma entrada de wiki, mantenha titulo curto e descricao clara, em tom tecnico
- skillTreeEntries deve cobrir toda nova tecnica criada e qualquer pre-requisito novo inferido
- cada item de skillTreeEntries deve apontar para wikiTitle e dependencyTitles por nome
- use a branch mentalidade para leitura de jogo, visao, scanning e decisao
- dependencias sao consultivas: servem para alerta e coerencia tecnica, nao como trava dura
- prefira reutilizar skills e entradas existentes; nao duplique por variacao minima de nome
- requiredXp deve crescer de forma coerente com o tier e com a complexidade da tecnica
- se criar treino, use 3 a 5 drills no maximo
- cada drill deve ter objetivo e pontos-chave acionaveis
- se o usuario trouxer dor, cansaco ou sinal de excesso, reduza carga e priorize controle
- responseBrief deve resumir em 1 ou 2 frases o que a resposta final precisa comunicar ao atleta
- priorities deve trazer 2 a 4 focos acionaveis
- responda sempre no JSON pedido
`.trim();

const ANRI_VOICE_SCHEMA = {
  type: 'object',
  required: ['reply', 'suggestedNextPrompts'],
  propertyOrdering: ['reply', 'suggestedNextPrompts'],
  properties: {
    reply: { type: 'string' },
    suggestedNextPrompts: {
      type: 'array',
      items: { type: 'string' },
    },
  },
};

const ANRI_VOICE_PROMPT = `
Voce e Anri Teieri, assistente tecnica do projeto Blue Lock.

Sua voz:
- portugues do Brasil
- humana, direta, tecnica, firme e motivadora
- focada em futebol, evolucao individual e clareza pratica
- sem falar como IA

Seu trabalho:
- receber um plano tecnico ja decidido
- responder ao atleta em voz natural, mantendo exatamente a estrutura do plano
- nao alterar treino, wiki ou arvore; apenas comunicar bem
- reply deve ser util, objetivo e em tom de Anri
- suggestedNextPrompts deve trazer 2 a 4 proximos prompts curtos e relevantes
`.trim();

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function getGeminiText(data: any): string {
  return data?.candidates?.[0]?.content?.parts?.map((part: any) => part?.text ?? '').join('') ?? '';
}

async function getAuthenticatedUid(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.slice('Bearer '.length);
    const decoded = await getFirebaseAdminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch (error) {
    console.warn('Nao foi possivel verificar o token da Anri no servidor.', error);
    return null;
  }
}

async function loadAuthoritativeState(uid: string) {
  try {
    const adminDb = getFirebaseAdminDb();
    const [contentSnapshot, egoSnapshot, chatSnapshot] = await Promise.all([
      adminDb.doc(`users/${uid}/appState/content`).get(),
      adminDb.doc(`users/${uid}/appState/ego`).get(),
      adminDb.doc(`users/${uid}/appState/chat`).get(),
    ]);

    return {
      content: contentSnapshot.exists ? contentSnapshot.data() : null,
      ego: egoSnapshot.exists ? egoSnapshot.data() : null,
      chat: chatSnapshot.exists ? chatSnapshot.data() : null,
    };
  } catch (error) {
    console.warn('Nao foi possivel carregar o estado autoritativo da Anri no Firestore.', error);
    return null;
  }
}

function mapSkillTreeContextToSkills(skillTree: AnriAthleteSkillContext[] | undefined, athleteXp: number): Skill[] {
  if (!skillTree?.length) {
    return cloneSkills(DEFAULT_SKILLS);
  }

  const idsByName = new Map<string, string>();
  for (const item of skillTree) {
    idsByName.set(
      item.name.trim().toLocaleLowerCase('pt-BR'),
      item.id || createSkillId(item.type, item.name)
    );
  }

  return skillTree.map((item) => ({
    id: item.id || createSkillId(item.type, item.name),
    name: item.name,
    description: item.description ?? item.name,
    requiredXp: item.requiredXp ?? 0,
    unlocked: item.unlocked || athleteXp >= (item.requiredXp ?? 0),
    type: item.type,
    tier: item.tier ?? 1,
    dependencies: (item.dependencyIds?.length
      ? item.dependencyIds
      : (item.dependencyNames ?? [])
          .map((dependencyName) => idsByName.get(dependencyName.trim().toLocaleLowerCase('pt-BR')) ?? null)
          .filter((dependencyId): dependencyId is string => Boolean(dependencyId))),
    createdBy: item.createdBy ?? 'system',
    linkedWikiEntryTitle: item.linkedWikiEntryTitle ?? null,
  }));
}

async function persistAuthoritativeState(
  uid: string,
  body: AnriRequest,
  responsePayload: AnriResponsePayload,
  authoritativeState?: { content: any; ego: any; chat: any } | null
) {
  const adminDb = getFirebaseAdminDb();
  const contentRef = adminDb.doc(`users/${uid}/appState/content`);
  const egoRef = adminDb.doc(`users/${uid}/appState/ego`);
  const chatRef = adminDb.doc(`users/${uid}/appState/chat`);

  const existingContent = authoritativeState?.content ?? null;
  const existingEgo = authoritativeState?.ego ?? null;
  const existingChat = authoritativeState?.chat ?? null;

  const baseWikiEntries =
    existingContent?.wikiEntries ??
    groupWikiEntries(body.wikiEntries?.length ? body.wikiEntries : flattenWikiEntries(DEFAULT_WIKI_ENTRIES));
  const nextWikiEntries = responsePayload.wikiEntries.length
    ? mergeWikiEntryRecords(baseWikiEntries, materializeWikiEntries(responsePayload.wikiEntries))
    : baseWikiEntries;

  const baseTrainingPlan =
    existingContent?.trainingPlan ??
    body.currentTrainingPlan ?? {
      title: 'Treino do Dia',
      focus: 'Explosão & Ataque',
      rationale: 'Protocolo base do dia para manter o Ego em progresso constante.',
      appliesToToday: true,
      drills: body.currentTraining?.length ? body.currentTraining : DEFAULT_TRAINING_DRILLS,
      source: 'default',
      updatedAt: new Date().toISOString(),
    };
  const nextTrainingPlan = responsePayload.trainingPlan
    ? {
        ...materializeTrainingPlan(responsePayload.trainingPlan, baseTrainingPlan.drills),
        source: 'anri',
        updatedAt: new Date().toISOString(),
      }
    : baseTrainingPlan;

  const athleteXp = existingEgo?.xp ?? body.athlete.xp;
  const baseSkills = existingEgo?.skills?.length
    ? existingEgo.skills
    : mapSkillTreeContextToSkills(body.skillTree, athleteXp);
  const nextGeneratedSkills = responsePayload.skillTreeEntries.length
    ? materializeSkillTreeEntries(responsePayload.skillTreeEntries, baseSkills)
    : [];
  const nextSkills = nextGeneratedSkills.length
    ? mergeSkillCollections(baseSkills, nextGeneratedSkills, athleteXp)
    : baseSkills;

  const baseChatMessages = Array.isArray(existingChat?.messages) ? existingChat.messages : [];
  const nextAiMessage: AnriChatMessage = {
    id: body.pendingAiMessageId ?? `server-ai-${Date.now()}`,
    sender: 'ai',
    text: responsePayload.reply,
    response: responsePayload,
  };
  const nextChatMessages = mergeChatMessages(baseChatMessages, body.chatMessages ?? [], [nextAiMessage]);

  await Promise.all([
    contentRef.set(
      {
        wikiEntries: nextWikiEntries,
        trainingPlan: nextTrainingPlan,
      },
      { merge: true }
    ),
    egoRef.set(
      {
        xp: athleteXp,
        rank: existingEgo?.rank ?? body.athlete.rank,
        history: existingEgo?.history ?? [],
        skills: nextSkills,
      },
      { merge: true }
    ),
    chatRef.set(
      {
        messages: nextChatMessages,
      },
      { merge: true }
    ),
  ]);
}

function mergeChatMessages(...sources: AnriChatMessage[][]) {
  const byId = new Map<string, AnriChatMessage>();
  const orderedIds: string[] = [];

  for (const source of sources) {
    for (const message of source) {
      if (!message?.id) continue;
      if (!byId.has(message.id)) {
        orderedIds.push(message.id);
      }
      byId.set(message.id, message);
    }
  }

  return orderedIds
    .map((id) => byId.get(id))
    .filter((message): message is AnriChatMessage => Boolean(message))
    .slice(-40);
}

function toConversationMessages(messages: Array<Pick<AnriChatMessage, 'sender' | 'text'>>) {
  return messages.slice(-20).map((message) => ({
    role: message.sender === 'ai' ? 'model' : 'user',
    parts: [{ text: message.text }],
  }));
}

async function callGeminiJson<T>({
  apiKey,
  model,
  systemPrompt,
  contents,
  schema,
  temperature,
  maxOutputTokens,
}: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
  schema: unknown;
  temperature: number;
  maxOutputTokens: number;
}) {
  const response = await fetch(getGeminiEndpoint(model), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature,
        topP: 0.9,
        maxOutputTokens,
        responseMimeType: 'application/json',
        responseJsonSchema: schema,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao consultar Gemini (${model}): ${errorText}`);
  }

  const raw = await response.json();
  const text = getGeminiText(raw);
  const parsed = safeJsonParse<T>(text);

  if (!parsed) {
    throw new Error(`Gemini respondeu fora do formato esperado (${model}). Raw: ${text}`);
  }

  return parsed;
}

function buildVoiceFallback(plan: AnriExecutionPlan): AnriVoiceLayer {
  const segments = [plan.responseBrief];

  if (plan.trainingPlan) {
    segments.push(`Montei um ajuste com foco em ${plan.trainingPlan.focus.toLowerCase()}.`);
  }

  if (plan.wikiEntries.length > 0) {
    segments.push(
      plan.wikiEntries.length === 1
        ? `Também registrei 1 técnica nova na Bluelockpedia para sustentar esse avanço.`
        : `Também registrei ${plan.wikiEntries.length} técnicas novas na Bluelockpedia para sustentar esse avanço.`
    );
  }

  if (plan.skillTreeEntries.length > 0) {
    segments.push(
      plan.skillTreeEntries.some((entry) => entry.isPrerequisite)
        ? 'Estruturei a árvore com os pré-requisitos que faltavam para esse salto técnico.'
        : 'Encaixei a técnica na Árvore do Ego com suas dependências consultivas.'
    );
  }

  const suggestedNextPrompts =
    plan.priorities.slice(0, 3).map((priority) => `Aprofunde ${priority.toLowerCase()}.`) ||
    ['Ajuste meu treino de amanhã.', 'Mostre meu próximo gargalo.', 'Crie uma técnica complementar.'];

  return {
    reply: segments.join(' '),
    suggestedNextPrompts,
  };
}

function normalizeHeuristicText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getLatestUserText(messages: Array<Pick<AnriChatMessage, 'sender' | 'text'>>) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.sender === 'user') {
      return messages[index].text;
    }
  }
  return '';
}

function chooseStructuringModel(params: {
  latestUserText: string;
  currentSkillTree: unknown[];
  wikiEntries: unknown[];
  currentTraining: unknown[];
}) {
  const normalized = normalizeHeuristicText(params.latestUserText);
  const strongSignals = [
    'nova tecnica',
    'novo fundamento',
    'nova habilidade',
    'adicionar tecnica',
    'criar tecnica',
    'crie tecnica',
    'wiki',
    'bluelockpedia',
    'arvore',
    'encaixa',
    'dependen',
    'prerequis',
    'pre requis',
    'arma',
    'habilidade',
    'combo',
    'combinacao',
    'evolucao',
    'descreva a tecnica',
    'estrutura',
    'estruture',
  ];
  const mediumSignals = [
    'monte um treino',
    'monta um treino',
    'ajuste meu treino',
    'ajuste o treino',
    'crie um treino',
    'criar treino',
    'gargalo',
    'plano',
    'progressao',
    'progresso',
    'como melhorar',
  ];

  let score = 0;

  for (const signal of strongSignals) {
    if (normalized.includes(signal)) {
      score += 3;
    }
  }

  for (const signal of mediumSignals) {
    if (normalized.includes(signal)) {
      score += 1;
    }
  }

  if (normalized.length > 180) {
    score += 1;
  }

  if (params.currentSkillTree.length > 24) {
    score += 1;
  }

  const useFrontier = score >= 3;

  return {
    useFrontier,
    score,
    reason: useFrontier
      ? 'Pedido com sinais de estrutura tecnica, arvore ou dependencias.'
      : 'Pedido simples de ajuste/orientacao sem necessidade forte de frontier.',
    model: useFrontier ? GEMINI_FRONTIER_STRUCTURING_MODEL : GEMINI_SIMPLE_STRUCTURING_MODEL,
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY nao configurada no servidor.' },
      { status: 500 }
    );
  }

  let body: AnriRequest;

  try {
    body = (await request.json()) as AnriRequest;
  } catch {
    return NextResponse.json({ error: 'Payload invalido.' }, { status: 400 });
  }

  if (!body.messages?.length) {
    return NextResponse.json({ error: 'Nenhuma mensagem recebida.' }, { status: 400 });
  }

  const authenticatedUid = await getAuthenticatedUid(request);
  const authoritativeState = authenticatedUid ? await loadAuthoritativeState(authenticatedUid) : null;

  const wikiEntries = authoritativeState?.content?.wikiEntries
    ? flattenWikiEntries(authoritativeState.content.wikiEntries)
    : (body.wikiEntries?.length ? body.wikiEntries : flattenWikiEntries(DEFAULT_WIKI_ENTRIES));
  const currentTraining = authoritativeState?.content?.trainingPlan?.drills?.length
    ? authoritativeState.content.trainingPlan.drills
    : (body.currentTraining?.length ? body.currentTraining : DEFAULT_TRAINING_DRILLS);
  const currentSkillTree = authoritativeState?.ego?.skills?.length
    ? authoritativeState.ego.skills
    : (body.skillTree?.length ? body.skillTree : body.athlete.unlockedSkills);
  const persistedChatMessages = Array.isArray(authoritativeState?.chat?.messages)
    ? authoritativeState.chat.messages
    : [];
  const mergedChatMessages = body.chatMessages?.length
    ? mergeChatMessages(persistedChatMessages, body.chatMessages)
    : persistedChatMessages;
  const conversationSource = mergedChatMessages.length
    ? mergedChatMessages
    : body.messages;
  const latestUserText = getLatestUserText(conversationSource);
  const structuringSelection = chooseStructuringModel({
    latestUserText,
    currentSkillTree: Array.isArray(currentSkillTree) ? currentSkillTree : [],
    wikiEntries,
    currentTraining,
  });

  const contextBlock = [
    'CONTEXTO DO ATLETA',
    JSON.stringify(body.athlete),
    '',
    'ARVORE DO EGO ATUAL',
    JSON.stringify(currentSkillTree),
    '',
    'WIKI ATUAL DISPONIVEL',
    JSON.stringify(wikiEntries),
    '',
    'TREINO ATUAL DISPONIVEL',
    JSON.stringify(currentTraining),
    '',
    'INSTRUCAO DE NEGOCIO',
    [
      '1. Se o pedido for sobre treino, sugira um trainingPlan quando fizer sentido.',
      '2. Se faltar fundamento para explicar ou montar treino, crie uma ou mais wikiEntries.',
      '3. Sempre que criar wikiEntries, devolva skillTreeEntries correspondentes.',
      '4. Se a tecnica nova for complexa, infira dependencias e, se necessario, crie as tecnicas base faltantes em wikiEntries e skillTreeEntries.',
      '5. Se for so conselho, trainingPlan pode ser null e wikiEntries pode ficar vazio.',
      '6. skillTreeEntries pode ficar vazio apenas quando nenhuma nova tecnica precisar ser adicionada.',
      '7. suggestedNextPrompts deve trazer 2 a 4 proximos prompts curtos e uteis.',
      '8. rationale deve explicar seu raciocinio de forma breve para a app, nao para o usuario final.',
      `9. Complexidade detectada no pedido: ${structuringSelection.reason}`,
    ].join('\n'),
  ].join('\n');

  const contents = [
    {
      role: 'user',
      parts: [{ text: contextBlock }],
    },
    ...toConversationMessages(conversationSource),
  ];

  let plan: AnriExecutionPlan;

  try {
    plan = await callGeminiJson<AnriExecutionPlan>({
      apiKey,
      model: structuringSelection.model,
      systemPrompt: ANRI_PLAN_PROMPT,
      contents,
      schema: ANRI_PLAN_SCHEMA,
      temperature: structuringSelection.useFrontier ? 0.3 : 0.45,
      maxOutputTokens: structuringSelection.useFrontier ? 3072 : 2048,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Falha ao estruturar a resposta da Anri.',
        details: error instanceof Error ? error.message : 'Erro desconhecido.',
      },
      { status: 502 }
    );
  }

  let voiceLayer: AnriVoiceLayer;

  try {
    voiceLayer = await callGeminiJson<AnriVoiceLayer>({
      apiKey,
      model: GEMINI_RESPONSE_MODEL,
      systemPrompt: ANRI_VOICE_PROMPT,
      contents: [
        {
          role: 'user',
          parts: [{ text: contextBlock }],
        },
        ...toConversationMessages(conversationSource),
        {
          role: 'user',
          parts: [
            {
              text: `PLANO TECNICO DEFINIDO\n${JSON.stringify(plan)}`,
            },
          ],
        },
      ],
      schema: ANRI_VOICE_SCHEMA,
      temperature: 0.75,
      maxOutputTokens: 1024,
    });
  } catch (error) {
    console.warn('Falha na camada de voz da Anri. Usando fallback local.', error);
    voiceLayer = buildVoiceFallback(plan);
  }

  const parsed: AnriResponsePayload = {
    intent: plan.intent,
    rationale: plan.rationale,
    reply: voiceLayer.reply,
    suggestedNextPrompts: voiceLayer.suggestedNextPrompts,
    trainingPlan: plan.trainingPlan,
    wikiEntries: plan.wikiEntries,
    skillTreeEntries: plan.skillTreeEntries,
  };

  if (authenticatedUid) {
    try {
      await persistAuthoritativeState(authenticatedUid, body, parsed, authoritativeState);
    } catch (error) {
      console.error('Falha ao persistir as alteracoes da Anri no Firestore.', error);
    }
  }

  return NextResponse.json(parsed);
}
