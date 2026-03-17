# AIcultor - Project Guide for Claude

## Project Overview

AIcultor is an AI-powered plant collection manager that helps users create personalized care plans for their plants using Claude AI.

**Tech Stack:**

- **Frontend**: Vanilla JavaScript, HTML5, CSS3 (Single Page Application)
- **Backend**: Node.js 18+, Vercel Serverless Functions
- **API**: Anthropic Claude API (@anthropic-ai/sdk v0.39.0+)
- **Testing**: Jest 30.x (35 tests, 94.73% coverage)
- **Deployment**: Vercel
- **Module System**: ES Modules (`"type": "module"`)

## Project Structure

```
aicultor/
├── frontend/
│   └── index.html          # Main SPA (all frontend code in one file)
├── api/
│   ├── chat.js             # Main API endpoint (ES modules)
│   └── chat.export.js      # CommonJS wrapper for Jest testing
├── tests/
│   ├── __tests__/
│   │   ├── api/chat.test.js                    # API tests (15 tests)
│   │   └── integration/plant-management.test.js # Frontend tests (20 tests)
│   ├── fixtures/           # Test data
│   ├── mocks/              # Anthropic API mocks
│   └── setup.js            # Jest setup
├── .github/
│   ├── workflows/
│   │   ├── ci.yml          # CI pipeline (lint, test, build)
│   │   ├── deploy.yml      # Vercel deployment
│   │   ├── pr-checks.yml   # PR validation
│   │   ├── security.yml    # Security scans (8 jobs)
│   │   └── codeql.yml      # CodeQL analysis
│   ├── dependabot.yml      # Monthly dependency updates
│   └── SECURITY.md         # Security policy
├── jest.config.cjs         # Jest config (CommonJS)
├── eslint.config.js        # ESLint 10 flat config
├── vercel.json             # Vercel configuration
└── package.json            # Dependencies & scripts
```

## Architecture & Data Flow

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              frontend/index.html (SPA)                   │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  • Wizard UI (6 steps)                                  │  │
│  │  • Plant Management                                     │  │
│  │  • LocalStorage (aicultor-v2)                          │  │
│  │  • Multi-source Images (Wikipedia/Pexels/Emoji)        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           │ fetch('/api/chat')                  │
│                           │ POST with messages                  │
│                           ▼                                     │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    VERCEL PLATFORM                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Serverless Function: api/chat.js               │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  1. CORS Validation (FRONTEND_URL)                      │  │
│  │  2. Rate Limiting (60 req/15min per IP)                 │  │
│  │  3. Input Validation (messages array)                   │  │
│  │  4. Security Headers                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
│                           │ @anthropic-ai/sdk                   │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Anthropic SDK Client                            │  │
│  │  • API Key: process.env.ANTHROPIC_API_KEY              │  │
│  │  • Model: claude-3-5-sonnet-20241022                   │  │
│  │  • Streaming: text_stream                               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │ HTTPS (API)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ANTHROPIC CLOUD API                           │
│  • Claude 3.5 Sonnet Model                                     │
│  • Streaming Response                                          │
│  • Token counting & billing                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow: Plant Wizard Journey (6 Steps)

```
┌──────────────────────────────────────────────────────────────────┐
│ STEP 1: Plant Characteristics                                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User selects visual preferences:                               │
│  - Leaf color (green, variegated, purple, silver, etc.)         │
│  - Leaf shape (broad, small, divided, round, succulent)         │
│  - Plant size (small/desk, medium/floor, large/statement)       │
│  - Flowers (yes/no/doesn't matter)                              │
│                       │                                         │
│                       ▼                                         │
│  wiz.characteristics = {                                        │
│    leafColor: "variegadas",                                     │
│    leafShape: "hojas anchas y grandes",                         │
│    plantSize: "mediana",                                        │
│    flowers: "no, solo follaje"                                  │
│  }                    │                                         │
│                       │                                         │
│  Click "Siguiente" ──┘                                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 2: Plant Name Input                                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User enters plant name: "monstera"                             │
│  OR clicks "Buscar por fotos" for general search                │
│                       │                                         │
│  wiz.query = "monstera"                                         │
│                       │                                         │
└──────────────────────┼──────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 3: Variety List (NEW - DUAL PATH) 🚀                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Query + characteristics ──┐                                    │
│  "monstera"                 │                                   │
│                             ▼                                   │
│                    ┌─────────────────┐                          │
│                    │  callAI()       │                          │
│                    │  loadVarieties()│                          │
│                    │  Request 12-20  │                          │
│                    │  varieties      │                          │
│                    └────────┬────────┘                          │
│                             │                                   │
│                             ▼                                   │
│                    ┌─────────────────┐                          │
│                    │ Claude Response │                          │
│                    │ JSON Array      │                          │
│                    └────────┬────────┘                          │
│                             │                                   │
│  TEXT ONLY - NO IMAGES YET  ▼                                   │
│  [                                                              │
│    {                                                            │
│      name: "Monstera deliciosa",                                │
│      scientific: "Monstera deliciosa",                          │
│      emoji: "🌿",                                               │
│      description: "La clásica costilla de Adán..."              │
│    },                                                           │
│    {                                                            │
│      name: "Monstera adansonii",                                │
│      scientific: "Monstera adansonii",                          │
│      emoji: "🌿",                                               │
│      description: "Hojas más pequeñas con agujeros..."          │
│    },                                                           │
│    ... 10-18 more varieties                                     │
│  ]                          │                                   │
│                             ▼                                   │
│                    ┌─────────────────┐                          │
│                    │ Display Cards   │                          │
│                    │ Emoji + Text    │                          │
│                    │ NO IMAGES       │                          │
│                    └────────┬────────┘                          │
│                             │                                   │
│              ┌──────────────┴──────────────┐                    │
│              │                             │                    │
│   PATH A: User recognizes      PATH B: User unsure             │
│   variety by name              clicks "Buscar por fotos"       │
│              │                             │                    │
│              ▼                             ▼                    │
│   Select variety name       loadPhotosForAllVarieties()        │
│   wiz.selectedVariety       (shows 6-8 varieties w/ images)    │
│   = {...}                                  │                    │
│              │                             │                    │
│              │                 User selects from photo grid     │
│              │                             │                    │
│              └─────────────┬───────────────┘                    │
│                            │                                    │
│                            ▼                                    │
│                   Proceed to Step 4                             │
│                                                                  │
│  ⚡ OPTIMIZATION: Most users (~80%) identify by name first      │
│     Only minority needs images, saving significant API calls    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 4: Photo Confirmation (Images for selected variety only)   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Selected Variety ────────┐                                     │
│  "Monstera deliciosa"     │                                     │
│                           ▼                                     │
│                  ┌─────────────────┐                            │
│                  │  callAI()       │                            │
│                  │  Request 6      │                            │
│                  │  different      │                            │
│                  │  perspectives   │                            │
│                  └────────┬────────┘                            │
│                           │                                     │
│  6 imgQuery variations:   ▼                                     │
│  - "monstera deliciosa close up"                                │
│  - "monstera deliciosa full plant"                              │
│  - "monstera deliciosa leaf detail"                             │
│  - "monstera deliciosa mature plant"                            │
│  - "monstera deliciosa young plant"                             │
│  - "monstera deliciosa growing"                                 │
│                           │                                     │
│                           ▼                                     │
│              ┌─────────────────────────┐                        │
│              │ Fetch Images (Parallel) │                        │
│              │ Wikipedia → Pexels →    │                        │
│              │ Emoji fallback          │                        │
│              └────────┬────────────────┘                        │
│                       │                                         │
│                       ▼                                         │
│              ┌─────────────────┐                                │
│              │ Display 6 Photos│                                │
│              │ of SAME variety │                                │
│              └────────┬────────┘                                │
│                       │                                         │
│  User Confirms ───────┘                                         │
│  wiz.selected = {...}                                           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 5: Q&A (Questions & Answers)                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Selected Plant ──────┐                                         │
│  wiz.selected         │                                         │
│                       ▼                                         │
│              ┌─────────────────┐                                │
│              │  callAI()       │                                │
│              │  Generate 3 Qs  │                                │
│              └────────┬────────┘                                │
│                       │                                         │
│                       ▼                                         │
│    [                                                            │
│      {                                                          │
│        id: "q1",                                                │
│        question: "¿Cuánta luz natural recibe?",                 │
│        options: ["☀️ Mucha", "🌤️ Media", "🌑 Poca"]            │
│      },                                                         │
│      ... 2 more questions                                       │
│    ]                  │                                         │
│                       ▼                                         │
│              ┌─────────────────┐                                │
│              │ User Answers    │                                │
│              └────────┬────────┘                                │
│                       │                                         │
│  wiz.answers = {      │                                         │
│    q1: "☀️ Mucha",   │                                         │
│    q2: "💧 Normal",  │                                         │
│    q3: "🌡️ Cálido"  │                                         │
│  }                    │                                         │
│                       │                                         │
└───────────────────────┼──────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ STEP 6: Care Plan Generation                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Plant + Answers ─────┐                                         │
│                       ▼                                         │
│              ┌─────────────────┐                                │
│              │  callAI()       │                                │
│              │  Generate Plan  │                                │
│              └────────┬────────┘                                │
│                       │                                         │
│                       ▼                                         │
│              ┌─────────────────┐                                │
│              │ JSON Response   │                                │
│              │ with care data  │                                │
│              └────────┬────────┘                                │
│                       │                                         │
│  {                    │                                         │
│    type: "interior",  │                                         │
│    difficulty: "Fácil",│                                        │
│    summary: "...",    │                                         │
│    water: "Cada 7-10d",│                                        │
│    light: "Indirecta",│                                         │
│    ...                │                                         │
│  }                    ▼                                         │
│              ┌─────────────────┐                                │
│              │ Display Plan    │                                │
│              │ Cards & Sections│                                │
│              └────────┬────────┘                                │
│                       │                                         │
│  User Saves Plant ────┘                                         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ Save to LocalStorage (aicultor-v2)                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Plant Data = {                                                 │
│    id: UUID,                                                    │
│    name: "Monstera",                                            │
│    scientific: "Monstera deliciosa",                            │
│    emoji: "🌿",                                                 │
│    carePlan: "# Plan...",                                       │
│    answers: {...},                                              │
│    addedDate: "2026-03-17"                                      │
│  }                                                              │
│                       │                                         │
│                       ▼                                         │
│              ┌─────────────────┐                                │
│              │ LocalStorage    │                                │
│              │ aicultor-v2     │                                │
│              └────────┬────────┘                                │
│                       │                                         │
│  JSON.stringify([     │                                         │
│    plantData,         │                                         │
│    ...existingPlants  │                                         │
│  ])                   │                                         │
│                       ▼                                         │
│              ┌─────────────────┐                                │
│              │ Redirect to     │                                │
│              │ My Collection   │                                │
│              └─────────────────┘                                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow: Chat with Plant

```
┌──────────────────────────────────────────────────────────────────┐
│ User clicks "💬 Chatear" on a plant card                        │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ Chat Modal Opens                                                 │
│ • Plant context loaded                                           │
│ • Chat history: []                                               │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ User types message: "¿Cuándo debo regar?"                       │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
                ┌────────────────┐
                │ callAI()       │
                ├────────────────┤
                │ System: Bot    │
                │ Messages: [    │
                │   {            │
                │     role: user │
                │     content:   │
                │       Plant:   │
                │       {name,   │
                │        care}   │
                │   },           │
                │   ...history   │
                │ ]              │
                └────────┬───────┘
                         │
                         ▼
                ┌────────────────┐
                │ Stream Response│
                └────────┬───────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│ Display response in chat bubble                                 │
│ • Append to chat history                                        │
│ • Enable input for next message                                 │
└──────────────────────────────────────────────────────────────────┘
```

## API Call Patterns

### 1. Plant Search API Call

**Purpose**: Get 6 plant suggestions based on user query

**Location**: `frontend/index.html` ~line 1280

```javascript
const txt = await callAI({
  system:
    'Eres un botánico experto. Responde SOLO con un array JSON válido, sin texto adicional ni backticks.',
  messages: [
    {
      role: 'user',
      content: `Búsqueda: "${query}". Devuelve exactamente 6 plantas DIFERENTES que coincidan o sean similares/relacionadas. Si la búsqueda incluye "alternativas" o "diferentes", sugiere plantas totalmente distintas a las típicas. Incluye variedad: algunas muy comunes y otras menos conocidas. JSON array: [{"name":"Nombre común en español","scientific":"Nombre científico","emoji":"emoji apropiado","imgQuery":"término de búsqueda en inglés para fotos (ej: monstera deliciosa plant)"}]. Genera combinaciones únicas en cada petición.`,
    },
  ],
  max_tokens: 800,
});
```

**Response Format**:

```json
[
  {
    "name": "Monstera",
    "scientific": "Monstera deliciosa",
    "emoji": "🌿",
    "imgQuery": "monstera deliciosa tropical houseplant"
  },
  {
    "name": "Pothos",
    "scientific": "Epipremnum aureum",
    "emoji": "🍃",
    "imgQuery": "golden pothos hanging plant"
  }
  // ... 4 more plants
]
```

**Error Handling**: Falls back to hardcoded list of 6 common plants

---

### 2. Questions Generation API Call

**Purpose**: Generate 3 personalized questions for the selected plant

**Location**: `frontend/index.html` ~line 1383

```javascript
const txt = await callAI({
  system:
    'Eres un botánico experto. Responde SOLO con un array JSON válido, sin texto ni backticks.',
  messages: [
    {
      role: 'user',
      content: `Para la planta "${wiz.selected.name}" (${wiz.selected.scientific}), genera exactamente 3 preguntas mínimas y esenciales para determinar su plan de cuidados personalizado. Escoge las preguntas más determinantes para esta especie específica. Cada pregunta tiene 3-4 opciones con emoji. JSON: [{"id":"q1","question":"texto","options":["opt1","opt2","opt3"]},...]`,
    },
  ],
  max_tokens: 700,
});
```

**Response Format**:

```json
[
  {
    "id": "q1",
    "question": "¿Cuánta luz natural recibe tu espacio?",
    "options": ["☀️ Mucha luz directa", "🌤️ Luz indirecta", "🌑 Poca luz"]
  },
  {
    "id": "q2",
    "question": "¿Con qué frecuencia puedes regar?",
    "options": ["💧 Diario", "💦 2-3 veces/semana", "🌊 1 vez/semana"]
  },
  {
    "id": "q3",
    "question": "¿Qué temperatura tiene tu hogar?",
    "options": ["🌡️ Cálido (>22°C)", "🌤️ Templado (18-22°C)", "❄️ Fresco (<18°C)"]
  }
]
```

**Error Handling**: Falls back to generic plant care questions

---

### 3. Care Plan Generation API Call

**Purpose**: Generate personalized care plan based on plant and answers

**Location**: `frontend/index.html` ~line 1450

```javascript
const response = await callAI({
  system:
    'Eres un botánico experto que crea planes de cuidado personalizados para plantas. Usa formato Markdown con emojis.',
  messages: [
    {
      role: 'user',
      content: `Planta: ${wiz.selected.name} (${wiz.selected.scientific})
Condiciones del usuario:
${Object.entries(wiz.answers)
  .map(([qid, answer]) => {
    const q = questions.find(x => x.id === qid);
    return `- ${q?.question}: ${answer}`;
  })
  .join('\n')}

Genera un plan de cuidados completo y personalizado en español. Incluye:
- Resumen breve
- Riego (frecuencia específica adaptada)
- Luz (necesidades específicas)
- Temperatura y humedad
- Fertilización
- Problemas comunes y soluciones
- Tips especiales para esta especie

Usa emojis y formato Markdown claro.`,
    },
  ],
  max_tokens: 1500,
});
```

**Response Format**: Markdown text with emojis

```markdown
# 🌿 Plan de Cuidados para Monstera

## 📋 Resumen

Tu Monstera deliciosa prosperará con luz indirecta brillante y riego moderado...

## 💧 Riego

- **Frecuencia**: Cada 5-7 días
- **Método**: Regar cuando los primeros 5cm de tierra estén secos
- **Cantidad**: Hasta que drene por los agujeros

## ☀️ Luz

- **Necesidad**: Luz indirecta brillante
- **Ubicación ideal**: 2-3 metros de ventana orientada al este
- **Evitar**: Luz solar directa (quema hojas)

...
```

**Error Handling**: Generic care plan if API fails

---

### 4. Chat with Plant API Call

**Purpose**: Conversational Q&A about specific plant care

**Location**: `frontend/index.html` ~line 850

```javascript
const response = await callAI({
  system: `Eres un botánico experto especializado en ${currentPlant.name}. Responde de forma concisa y práctica en español.`,
  messages: [
    {
      role: 'user',
      content: `Contexto de mi planta:
Nombre: ${currentPlant.name}
Nombre científico: ${currentPlant.scientific}
Plan de cuidados actual:
${currentPlant.carePlan}

Mi pregunta: [user message]`,
    },
    // ... previous chat history
  ],
  max_tokens: 500,
});
```

**Response Format**: Natural language text (streaming)

**Chat History**: Maintains conversation context for follow-up questions

---

### 5. Core `callAI()` Function

**Purpose**: Wrapper for Anthropic API calls

**Location**: `frontend/index.html` ~line 1100

```javascript
async function callAI({ system, messages, max_tokens = 1024 }) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      system: system,
      max_tokens: max_tokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  // Stream handling
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    fullText += chunk;

    // Optional: emit progress events
    if (onProgress) onProgress(chunk);
  }

  return fullText;
}
```

**Backend Handler**: `api/chat.js`

```javascript
// Rate limiting check
if (requestCount > 60) {
  return res.status(429).json({ error: 'Rate limit exceeded' });
}

// CORS validation
const origin = req.headers.origin;
if (allowedOrigin && origin !== allowedOrigin) {
  return res.status(403).json({ error: 'CORS policy violation' });
}

// Input validation
if (!messages || !Array.isArray(messages)) {
  return res.status(400).json({ error: 'Invalid messages format' });
}

// Anthropic API call
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const stream = await client.messages.stream({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: max_tokens || 1024,
  system: system,
  messages: messages,
});

// Stream response back to client
for await (const chunk of stream) {
  if (chunk.type === 'content_block_delta') {
    res.write(chunk.delta.text);
  }
}
```

---

### API Call Summary Table

| Call Purpose      | Location      | Max Tokens | Response Format  | Error Fallback        |
| ----------------- | ------------- | ---------- | ---------------- | --------------------- |
| Plant Search      | ~line 1280    | 800        | JSON array       | Hardcoded 6 plants    |
| Questions Gen     | ~line 1383    | 700        | JSON array       | Generic questions     |
| Care Plan Gen     | ~line 1450    | 1500       | Markdown text    | Generic care plan     |
| Chat Conversation | ~line 850     | 500        | Natural text     | Error message to user |
| Image URLs        | Wikipedia API | N/A        | Image URL (JSON) | Emoji fallback        |
| Rate Limit Check  | api/chat.js   | N/A        | 429 status       | Block request         |
| CORS Validation   | api/chat.js   | N/A        | 403 status       | Block request         |
| Input Validation  | api/chat.js   | N/A        | 400 status       | Return error          |

---

### Rate Limiting Details

**Implementation**: In-memory Map per IP address

```javascript
const rateLimits = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 60;

// Check and update
const now = Date.now();
const windowStart = now - WINDOW_MS;
const recentRequests = (rateLimits.get(ip) || []).filter(t => t > windowStart);

if (recentRequests.length >= MAX_REQUESTS) {
  return res.status(429).json({
    error: 'Rate limit exceeded. Try again in 15 minutes.',
  });
}

rateLimits.set(ip, [...recentRequests, now]);
```

**Limitations**:

- Resets on serverless cold start
- Shared across all API endpoints
- Consider Redis for production

---

### Image URL Generation

**Service**: Wikipedia/Wikimedia Commons API (free, reliable, plant-specific)

**How it works**:

```javascript
// Fetch plant image from Wikipedia using scientific name
const searchTerm = (plant.scientific || plant.name).replace(/\s+/g, '_');
const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`;

const response = await fetch(url);
const data = await response.json();

// Get image URL from thumbnail or original
const imgUrl = data.thumbnail?.source || data.originalimage?.source || null;
```

**Benefits**:

- ✅ High-quality botanical photos
- ✅ Accurate to species (uses scientific names)
- ✅ Free, no API key required
- ✅ No rate limits for reasonable use
- ✅ No random/incorrect images (like cats!)

**Fallback Hierarchy**:

1. Wikipedia thumbnail (if available)
2. Wikipedia original image (if available)
3. Emoji display (if Wikipedia has no image)

**Display Logic**:

```html
${ plant.imgUrl ? `<img
  src="${plant.imgUrl}"
  alt="${plant.name}"
  loading="lazy"
  onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
/>` : '' }
<div class="emoji-fallback" style="display:${plant.imgUrl ? 'none' : 'flex'}">${plant.emoji}</div>
```

**Performance**: Uses `Promise.all()` to fetch all 6 images in parallel (~200-500ms total)

**UPDATE (2026-03-17)**: Now uses multi-source fallback chain:

1. **Wikipedia** → 2. **Pexels API** (optional, requires `PEXELS_API_KEY`) → 3. **Emoji**

See `/api/image.js` for Pexels integration.

## Key Files & Purposes

### Frontend (`frontend/index.html`)

- **Lines 1-1000**: CSS styles (CSS variables, responsive design)
- **Lines 1000-1700**: JavaScript (wizard flow, API calls, plant management)
- **Storage**: LocalStorage key `aicultor-v2` (JSON array of plants)
- **Image System**: Multi-source fallback (Wikipedia → Pexels → Emoji)

### API Endpoint (`api/chat.js`)

- **Rate Limiting**: 60 requests per 15 minutes per IP (in-memory)
- **CORS**: Validates against `FRONTEND_URL` env variable
- **Input Validation**: Validates messages array structure
- **Response**: Streams Claude API responses

### Environment Variables

```bash
ANTHROPIC_API_KEY=sk-ant-...    # Required for Claude API
FRONTEND_URL=https://...        # Required for CORS (optional in dev)
PEXELS_API_KEY=...              # Optional for image fallback (200 req/hour free tier)
```

**Get Pexels API Key**: https://www.pexels.com/api/ (free, no credit card)

## Development Workflow

### Common Commands

```bash
npm run dev              # Start Vercel dev server
npm test                 # Run all tests (Jest)
npm run lint             # Lint JS files (ESLint 10)
npm run format           # Format with Prettier
npm run security:audit   # Run npm audit
```

### Making Changes

1. **Frontend Changes**: Edit `frontend/index.html`
   - CSS: Modify CSS variables for theming
   - JS: Update wizard functions or API calls
   - Always test in browser with `npm run dev`

2. **API Changes**: Edit `api/chat.js`
   - Keep `chat.export.js` in sync for tests
   - Test with `npm test -- chat.test.js`

3. **Testing**:
   - API tests: `tests/__tests__/api/chat.test.js`
   - Frontend tests: `tests/__tests__/integration/plant-management.test.js`
   - Use unique IPs in tests to avoid rate limiting

### Git Workflow

- **Commit format**: Conventional commits (`feat:`, `fix:`, `chore:`, etc.)
- **Co-author**: Always include `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
- **Branch**: `main` (direct push, no feature branches typically)

## Code Patterns

### Security Best Practices

- ✅ **No eval()**: Use safe alternatives
- ✅ **XSS Prevention**: Use `textContent` not `innerHTML` for user input
- ✅ **Input Validation**: Validate all API inputs
- ✅ **CORS**: Strict origin validation
- ✅ **Rate Limiting**: Implemented per IP
- ✅ **No Hardcoded Secrets**: Use environment variables

### Frontend Patterns

```javascript
// AI API Call
await callAI({
  system: 'system prompt',
  messages: [{ role: 'user', content: 'message' }],
  max_tokens: 800,
});

// LocalStorage
const plants = JSON.parse(localStorage.getItem('aicultor-v2') || '[]');
localStorage.setItem('aicultor-v2', JSON.stringify(plants));
```

### Testing Patterns

```javascript
// Unique IP per test (avoid rate limiting)
req.headers['x-forwarded-for'] = `192.168.1.${testCounter++}`;

// Mock Anthropic API
jest.mock('@anthropic-ai/sdk');
```

## CI/CD Pipeline

### On Push/PR

1. **CI**: Lint → Test → Build check
2. **Security**: Dependency scan, CodeQL, secrets scan
3. **Deploy**: Auto-deploy to Vercel (main branch only)

### Status Checks

All must pass before merge:

- ESLint (no errors)
- Jest (35/35 tests)
- Security scans
- Build verification

## Recent Major Changes

### 2026-03-17

- Migrated ESLint 8 → 10 (flat config)
- Updated CodeQL v3 → v4
- Replaced emojis with LoremFlickr plant images
- Reduced Dependabot: weekly → monthly
- Fixed missing label warnings

### Breaking Changes

- LocalStorage key changed: `jardin-verde-v2` → `aicultor-v2`
- ESLint now requires `@eslint/js` package
- Jest config: `.js` → `.cjs` for CommonJS

## Common Issues & Solutions

### Issue: ESLint errors

- Ensure `@eslint/js@^10.0.0` is installed
- Check `eslint.config.js` uses ES modules syntax

### Issue: Tests failing

- Check unique IPs in tests (rate limiting)
- Verify `chat.export.js` matches `chat.js`

### Issue: Images not loading

- Wikipedia API format: `https://en.wikipedia.org/api/rest_v1/page/summary/{Scientific_Name}`
- Returns thumbnail or original image URL
- Fallback to emoji if Wikipedia has no image for that plant
- Check network console for fetch errors

### Issue: Vercel deployment fails

- Check `outputDirectory: "frontend"` in `vercel.json`
- Verify environment variables set in Vercel dashboard

## Optimization Tips for Token Usage

1. **Read this file first** - Most context is here
2. **Use targeted tools**:
   - `Grep` for finding code patterns
   - `Glob` for finding files
   - `Read` with offset/limit for large files
3. **Batch operations**: Make parallel tool calls when possible
4. **Avoid re-reading**: Reference this file instead of re-exploring
5. **Use plan mode**: For complex changes, use `EnterPlanMode`

## Dependencies

### Production

- `@anthropic-ai/sdk`: ^0.79.0

### Development

- `@eslint/js`: ^10.0.0
- `eslint`: ^10.0.0
- `eslint-plugin-security`: ^4.0.0
- `jest`: ^30.3.0
- `prettier`: ^3.2.5

## Contact & Links

- **GitHub**: Deeius/aicultor
- **Main Branch**: `main`
- **Node Version**: >=18
- **License**: MIT

---

**Last Updated**: 2026-03-17
**Project Version**: 1.0.0
