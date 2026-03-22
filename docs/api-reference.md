# RivoFlow API Reference

> Base URL: `https://{API_DOMAIN}`
> Autenticacao: Cookie-based (accessToken via httpOnly cookie)
> Todas as rotas privadas exigem o cookie de autenticacao

---

## Auth

### POST `/auth/exchange-code`
Troca o code do Google OAuth por tokens.

**Query Params:**
| Param | Tipo | Obrigatorio |
|-------|------|-------------|
| `code` | string | sim |
| `redirectUri` | string | sim |

**Response:** `200` — Seta cookies `accessToken` e `refreshToken`

### POST `/auth/refresh-token`
Renova o accessToken usando o refreshToken do cookie.

**Response:** `200` — Atualiza cookies

### POST `/auth/sign-out`
Limpa os cookies de autenticacao.

**Response:** `200`

---

## Account

### GET `/account/me`
Retorna os dados do usuario autenticado com saldo.

**Response:** `200`
```json
{
  "account": {
    "id": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "picture": "string",
    "isActive": true
  },
  "balance": {
    "credits": 0,
    "lifetimeDeposited": 0,
    "lifetimeSpent": 0
  }
}
```

---

## Flows

### GET `/flows`
Lista todos os flows do usuario.

**Response:** `200`
```json
{
  "flows": [{ "id": "", "title": "", "accountId": "", "createdAt": "", "updatedAt": "" }]
}
```

### POST `/flows`
Cria um novo flow.

**Body:**
```json
{ "title": "string (min 1)" }
```
**Response:** `201` — `{ "flow": { ... } }`

### GET `/flows/{flowId}`
Retorna o flow com todos os nodes, edges, CDN URLs das imagens/videos, e creditsRequired nos nodes de geracao.

**Response:** `200`
```json
{
  "flow": { "id": "", "title": "", "accountId": "" },
  "nodes": [{ "id": "", "nodeType": "", "position": {}, "data": {} }],
  "edges": [{ "id": "", "sourceNodeId": "", "targetNodeId": "" }]
}
```

### PATCH `/flows/{flowId}`
Atualiza o titulo do flow.

**Body:**
```json
{ "title": "string" }
```
**Response:** `204`

### DELETE `/flows/{flowId}`
Deleta o flow e todos nodes/edges (cascade).

**Response:** `200`

---

## Edges

### POST `/flows/{flowId}/edges`
Conecta dois nodes.

**Body:**
```json
{
  "sourceNodeId": "string",
  "targetNodeId": "string"
}
```
**Response:** `201` — `{ "edge": { ... } }`

### DELETE `/flows/{flowId}/edges/{edgeId}`
Remove uma conexao.

**Response:** `204`

---

## Node Types

O front precisa renderizar cada tipo de node de forma diferente:

| nodeType | Descricao | Inputs necessarios | Icone sugerido |
|----------|-----------|-------------------|----------------|
| `PROMPT` | Input de texto | — | Texto/Chat |
| `IMAGE` | Upload de imagem | — | Imagem |
| `VIDEO` | Upload de video | — | Video clip |
| `GENERATION_IMAGE` | Edicao de imagem (image-to-image) | 1 prompt (min 3 chars) + 1+ imagens | Pincel |
| `GENERATION_TEXT_TO_IMAGE` | Geracao de imagem a partir de texto | 1 prompt (min 3 chars) | Varinha |
| `GENERATION_UPSCALE` | Aumentar resolucao | 1 imagem | Lupa+ |
| `GENERATION_REMOVE_BG` | Remover fundo | 1 imagem | Tesoura |
| `GENERATION_IMAGE_TO_VIDEO` | Gerar video a partir de imagem | 1-2 imagens (prompt opcional). Com 2 imagens no tier premium: 1a = start frame, 2a = end frame | Video |
| `GENERATION_MOTION_CONTROL` | Transferir movimentos de video pra imagem | 1 imagem + 1 video (prompt opcional) | Boneco |
| `RESULT_IMAGE` | Resultado (imagem gerada) | — | Imagem com check |
| `RESULT_VIDEO` | Resultado (video gerado) | — | Video com check |

---

## Nodes — Criacao

Todos retornam `201` com `{ "node": { ...AllAttributes } }`.

### POST `/flows/{flowId}/nodes/prompt`
Cria um node de texto (prompt).

**Body:**
```json
{ "position": { "x": 0, "y": 0 } }
```

### POST `/flows/{flowId}/nodes/file`
Cria um node de imagem (upload).

**Body:**
```json
{ "position": { "x": 0, "y": 0 } }
```

### POST `/flows/{flowId}/nodes/video`
Cria um node de video (upload).

**Body:**
```json
{ "position": { "x": 0, "y": 0 } }
```

### POST `/flows/{flowId}/nodes/generation-image`
Cria um node de **edicao de imagem** (image-to-image).

**Body:**
```json
{ "position": { "x": 0, "y": 0 } }
```
**Defaults:** model=`fal-ai/nano-banana-2/edit`, quality=`1K`, aspectRatio=`1:1`

### POST `/flows/{flowId}/nodes/text-to-image`
Cria um node de **geracao de imagem** a partir de texto.

**Body:**
```json
{ "position": { "x": 0, "y": 0 } }
```
**Defaults:** model=`fal-ai/nano-banana-2`, quality=`1K`, aspectRatio=`1:1`

### POST `/flows/{flowId}/nodes/upscale`
Cria um node de **upscale** (aumentar resolucao).

**Body:**
```json
{ "position": { "x": 0, "y": 0 } }
```
**Defaults:** model=`fal-ai/seedvr/upscale/image`, scale=`2`

### POST `/flows/{flowId}/nodes/remove-bg`
Cria um node de **remocao de fundo**.

**Body:**
```json
{ "position": { "x": 0, "y": 0 } }
```
**Defaults:** model=`fal-ai/birefnet`

### POST `/flows/{flowId}/nodes/image-to-video`
Cria um node de **geracao de video** a partir de imagem.

**Body:**
```json
{ "position": { "x": 0, "y": 0 }, "tier": "standard" }
```

| Campo | Tipo | Valores | Descricao |
|-------|------|---------|-----------|
| `tier` | enum (opcional) | `standard`, `premium` | Standard = LTX-2.3 ($0.06/s), Premium = Kling v3 ($0.112/s) |

**Defaults:** tier=`standard`, duration=`5`, resolution=`1080p`, aspectRatio=`16:9`, generateAudio=`true`

### POST `/flows/{flowId}/nodes/motion-control`
Cria um node de **motion control** (transferir movimentos de um video pra uma imagem).

**Body:**
```json
{ "position": { "x": 0, "y": 0 } }
```
**Defaults:** model=`fal-ai/kling-video/v3/pro/motion-control`, characterOrientation=`video`, keepOriginalSound=`true`

**Nota:** O `characterOrientation` e sempre `video` — o modelo replica os movimentos do video de referencia na imagem. Video de referencia maximo de 30 segundos.

---

## Nodes — Update

Todos retornam `204` sem body.

### PUT `/flows/{flowId}/nodes/{nodeId}/prompt`
Atualiza o texto do prompt.

**Body:**
```json
{ "prompt": "string (min 1)" }
```

### PUT `/flows/{flowId}/nodes/{nodeId}/generation`
Atualiza parametros do node de edicao de imagem.

**Body (todos opcionais):**
```json
{
  "aspectRatio": "1:1",
  "quality": "1K"
}
```

### PUT `/flows/{flowId}/nodes/{nodeId}/text-to-image`
Atualiza parametros do node text-to-image.

**Body (todos opcionais):**
```json
{
  "aspectRatio": "1:1",
  "quality": "1K"
}
```

### PUT `/flows/{flowId}/nodes/{nodeId}/upscale`
Atualiza parametros do node de upscale.

**Body (todos opcionais):**
```json
{
  "scale": 4
}
```

### PUT `/flows/{flowId}/nodes/{nodeId}/image-to-video`
Atualiza parametros do node de video.

**Body (todos opcionais):**
```json
{
  "tier": "premium",
  "duration": "8",
  "resolution": "1080p",
  "aspectRatio": "16:9",
  "generateAudio": true
}
```

### PUT `/flows/{flowId}/nodes/{nodeId}/motion-control`
Atualiza parametros do node de motion control.

**Body (todos opcionais):**
```json
{
  "keepOriginalSound": false
}
```

---

## Enums

### Imagem (generation e text-to-image)

| Campo | Valores |
|-------|---------|
| `aspectRatio` | `1:1`, `1:4`, `1:8`, `2:3`, `3:2`, `3:4`, `4:1`, `4:3`, `4:5`, `5:4`, `8:1`, `9:16`, `16:9`, `21:9` |
| `quality` | `0.5K`, `1K`, `2K`, `4K` |

### Upscale

| Campo | Valores |
|-------|---------|
| `scale` | 1 a 10 (fator de escala) |

### Video (image-to-video)

| Campo | Valores |
|-------|---------|
| `tier` | `standard` (LTX-2.3), `premium` (Kling v3) |
| `duration` | `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10` (segundos) |
| `resolution` | `1080p`, `1440p`, `2160p` |
| `aspectRatio` | `auto`, `16:9`, `9:16`, `1:1` |
| `generateAudio` | `true`/`false` |

### Motion Control

| Campo | Valores | Descricao |
|-------|---------|-----------|
| `keepOriginalSound` | `true`/`false` | manter audio do video de referencia |

**Nota:** `characterOrientation` e sempre `video` (fixo). Video de referencia maximo 30 segundos.

---

## Nodes — Acoes

### POST `/flows/{flowId}/nodes/{nodeId}/upload`
Gera uma URL pre-assinada pra upload de imagem ou video no S3. O `inputType` do node e definido automaticamente pelo `file.type` (`image/*` → `IMAGE`, `video/*` → `VIDEO`).

**Body (imagem):**
```json
{
  "file": {
    "type": "image/png",
    "size": 1024000
  }
}
```

**Body (video):**
```json
{
  "file": {
    "type": "video/mp4",
    "size": 5242880
  }
}
```

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| `file.type` | string | sim | MIME type do arquivo (ex: `image/png`, `video/mp4`) |
| `file.size` | number | sim | Tamanho em bytes |

**Response:** `200`
```json
{
  "uploadSignature": "base64...",
  "key": "accountId/flowId/ksuid.ext",
  "fileUrl": "https://cdn.domain/key"
}
```

**Breaking change:** campo `imageUrl` renomeado pra `fileUrl` na response.

#### Fluxo de upload de video

Quando o front faz upload de um video (`.mp4`, `.webm`, `.mov`), o backend processa automaticamente:

```
1. Front chama POST /upload com file.type = "video/mp4"
2. Backend gera presigned URL e seta inputType = "VIDEO" no node
3. Front faz upload direto pro S3 via presigned URL
4. S3 trigger dispara Lambda automaticamente
   → Baixa o video
   → Extrai a duracao real usando music-metadata
   → Atualiza o campo duration no banco
5. O front NAO precisa enviar a duracao — e extraida automaticamente
```

**Importante:** Apos o upload de um video, aguardar alguns segundos antes de chamar `calculate-credits` do motion control pra garantir que a Lambda de metadata ja processou e salvou a duracao no banco. Se a duracao ainda nao estiver disponivel, o endpoint retorna erro `"A reference video with known duration is required to calculate credits"`.

### PATCH `/flows/{flowId}/nodes/{nodeId}/position`
Move um node no canvas.

**Body:**
```json
{ "position": { "x": 100, "y": 200 } }
```
**Response:** `204`

### DELETE `/flows/{flowId}/nodes/{nodeId}`
Deleta um node e suas conexoes.

**Response:** `204`

### GET `/flows/{flowId}/nodes/{nodeId}/status`
Retorna o status atual de um node de geracao e, quando completado, os dados do node de resultado.

**Response:** `200`
```json
{
  "status": "PROCESSING",
  "result": null
}
```

Quando `COMPLETED`, o `result` contem os dados completos do node de resultado:
```json
{
  "status": "COMPLETED",
  "result": {
    "id": "ksuid",
    "nodeType": "RESULT_IMAGE",
    "flowId": "...",
    "position": { "x": 0, "y": 0 },
    "isExecuted": false,
    "data": {
      "key": "accountId/flowId/ksuid.png",
      "inputType": "IMAGE"
    },
    "createdAt": "2026-03-22T...",
    "updatedAt": "2026-03-22T..."
  }
}
```

Para `RESULT_VIDEO`:
```json
{
  "status": "COMPLETED",
  "result": {
    "id": "ksuid",
    "nodeType": "RESULT_VIDEO",
    "flowId": "...",
    "position": { "x": 0, "y": 0 },
    "isExecuted": false,
    "data": {
      "key": "accountId/flowId/ksuid.mp4",
      "duration": 5.2,
      "fps": 25
    },
    "createdAt": "2026-03-22T...",
    "updatedAt": "2026-03-22T..."
  }
}
```

Valores de status: `PENDING`, `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`

**Uso no front:** Fazer polling nesse endpoint a cada 2-3s depois de chamar `/generate`. Quando `status === "COMPLETED"`, o `result` ja contem os dados do node gerado — nao precisa mais buscar o flow completo so pra pegar o resultado.

### GET `/flows/{flowId}/nodes/{nodeId}/metadata`
Retorna se o video ja foi processado e tem a duracao disponivel. **Otimizado pra polling** apos upload de video.

**Response:** `200`
```json
{
  "ready": false,
  "duration": null
}
```

Quando a Lambda de metadata processar o video:
```json
{
  "ready": true,
  "duration": 5.2
}
```

**Uso no front:** Apos upload de video, fazer polling a cada 1-2s nesse endpoint. Quando `ready === true`, o `duration` esta disponivel e o front pode chamar `calculate-credits` no node de motion control.

### GET `/flows/{flowId}/nodes/{nodeId}/calculate-credits`
Calcula quantos creditos a geracao vai custar. Funciona pra todos os tipos de geracao.

**Response:** `200`
```json
{ "creditsRequired": 20 }
```

### POST `/flows/{flowId}/nodes/{nodeId}/generate`
**Dispara a geracao/processamento** do node. Funciona pra TODOS os tipos de geracao — o backend detecta o tipo automaticamente pelo nodeType.

| Node Type | Inputs necessarios (conectados via edge) |
|-----------|----------------------------------------|
| `GENERATION_IMAGE` | 1 prompt (min 3 chars) + 1 ou mais imagens |
| `GENERATION_TEXT_TO_IMAGE` | 1 prompt (min 3 chars) |
| `GENERATION_UPSCALE` | 1 imagem |
| `GENERATION_REMOVE_BG` | 1 imagem |
| `GENERATION_IMAGE_TO_VIDEO` | 1-2 imagens (prompt opcional). Premium com 2 imagens: 1a = start frame, 2a = end frame |
| `GENERATION_MOTION_CONTROL` | 1 imagem + 1 video de referencia (prompt opcional) |

**Response:** `201`

O processamento acontece em background:
1. Backend submete o request pro fal.ai via `fal.queue.submit()` (retorna imediatamente)
2. fal.ai processa em background (pode levar segundos a minutos)
3. Quando termina, fal.ai envia webhook pro backend (`POST /webhooks/fal-ai`)
4. Backend baixa o resultado, salva no S3, cria result node e debita creditos

O front deve fazer polling no `GET /flows/{flowId}/nodes/{nodeId}/status` (endpoint otimizado) e observar o campo `status`:

`PENDING` → `QUEUED` → `PROCESSING` → `COMPLETED` / `FAILED`

Quando `COMPLETED`, um novo node de resultado (`RESULT_IMAGE` ou `RESULT_VIDEO`) aparece conectado ao node de geracao.

**Nota tecnica:** O processamento e totalmente assincrono via webhooks do fal.ai. Nao ha timeout de Lambda — mesmo geracao de video de 15+ minutos funciona sem problemas.

---

## Payments

### POST `/payments/link-charge`
Gera um link de pagamento (PIX ou cartao).

**Body:**
```json
{ "amount": 20 }
```
**Response:** `201`
```json
{ "link": "https://pay.abacatepay.com/..." }
```

### GET `/payments/simulate-credits?amount=50`
Simula quantos creditos o usuario receberia por X reais.

**Query:** `amount` (number, em BRL)

**Response:** `200`
```json
{
  "credits": 150,
  "resultAmountInUsd": 6.0
}
```

---

## Node Data Types (retornados no GET /flows/{flowId})

Cada node tem um `data` com campos diferentes dependendo do `nodeType`. O front usa o `nodeType` pra discriminar.

### PROMPT
```json
{ "prompt": "texto do usuario" }
```

### IMAGE
```json
{ "key": "s3-key", "imageUrl": "https://cdn/..." }
```

### VIDEO
```json
{ "key": "s3-key", "duration": 5.2, "videoUrl": "https://cdn/..." }
```
**Nota:** O campo `duration` e preenchido automaticamente pelo backend apos o upload (via S3 trigger). Nao precisa ser enviado pelo front.

### RESULT_IMAGE
```json
{ "key": "s3-key", "inputType": "IMAGE", "imageUrl": "https://cdn/..." }
```

### RESULT_VIDEO
```json
{ "key": "s3-key", "duration": 5.2, "fps": 25, "videoUrl": "https://cdn/..." }
```

### GENERATION_IMAGE (edicao de imagem)
```json
{
  "status": "PENDING",
  "attempts": 0,
  "outputNodeId": null,
  "aspectRatio": "1:1",
  "quality": "1K",
  "consumedCredits": 20,
  "creditsRequired": 20
}
```

### GENERATION_TEXT_TO_IMAGE (geracao de imagem)
```json
{
  "status": "PENDING",
  "attempts": 0,
  "outputNodeId": null,
  "aspectRatio": "1:1",
  "quality": "1K",
  "consumedCredits": 20,
  "creditsRequired": 20
}
```

### GENERATION_UPSCALE
```json
{
  "status": "PENDING",
  "attempts": 0,
  "outputNodeId": null,
  "scale": 2,
  "consumedCredits": 3,
  "creditsRequired": 3
}
```

### GENERATION_REMOVE_BG
```json
{
  "status": "PENDING",
  "attempts": 0,
  "outputNodeId": null,
  "consumedCredits": 2,
  "creditsRequired": 2
}
```

### GENERATION_IMAGE_TO_VIDEO
```json
{
  "status": "PENDING",
  "attempts": 0,
  "outputNodeId": null,
  "tier": "standard",
  "duration": "5",
  "resolution": "1080p",
  "aspectRatio": "16:9",
  "generateAudio": true,
  "consumedCredits": 8,
  "creditsRequired": 8
}
```

### GENERATION_MOTION_CONTROL
```json
{
  "status": "PENDING",
  "attempts": 0,
  "outputNodeId": null,
  "characterOrientation": "video",
  "keepOriginalSound": true,
  "consumedCredits": 10,
  "creditsRequired": 10
}
```

---

## Modelos AI utilizados

| Funcionalidade | Modelo | Pricing |
|---------------|--------|---------|
| Edicao de imagem | `fal-ai/nano-banana-2/edit` | $0.08/img (1K), 0.5K=0.75x, 2K=1.5x, 4K=2x |
| Text-to-image | `fal-ai/nano-banana-2` | $0.08/img (1K), mesmos multipliers |
| Upscale | `fal-ai/seedvr/upscale/image` | por compute-second |
| Remove background | `fal-ai/birefnet` | por request |
| Video standard | `fal-ai/ltx-2.3/image-to-video` | $0.06/s (1080p), 1440p=2x, 2160p=4x |
| Video premium | `fal-ai/kling-video/v3/pro/image-to-video` | $0.112/s (sem audio), com audio=1.5x |
| Motion control | `fal-ai/kling-video/v3/pro/motion-control` | por segundo (baseado na duracao do video de referencia) × multiplicador de audio |

---

## Fluxos de uso tipicos

### Gerar imagem do zero (text-to-image)
```
1. POST /flows/{id}/nodes/prompt             → cria node de texto
2. PUT  /flows/{id}/nodes/{nId}/prompt       → escreve o prompt
3. POST /flows/{id}/nodes/text-to-image      → cria node de geracao
4. POST /flows/{id}/edges                    → conecta prompt → text-to-image
5. POST /flows/{id}/nodes/{nId}/generate     → dispara geracao
6. GET  /flows/{id}/nodes/{nId}/status        → polling ate status=COMPLETED
7. GET  /flows/{id}                          → buscar flow completo com result node
```

### Editar imagem existente (image-to-image)
```
1. POST /flows/{id}/nodes/prompt             → cria node de texto
2. PUT  /flows/{id}/nodes/{nId}/prompt       → escreve instrucao de edicao
3. POST /flows/{id}/nodes/file               → cria node de imagem
4. POST /flows/{id}/nodes/{nId}/upload       → faz upload da imagem
5. POST /flows/{id}/nodes/generation-image   → cria node de edicao
6. POST /flows/{id}/edges                    → conecta prompt → generation
7. POST /flows/{id}/edges                    → conecta imagem → generation
8. POST /flows/{id}/nodes/{nId}/generate     → dispara edicao
9. GET  /flows/{id}/nodes/{nId}/status        → polling ate status=COMPLETED
10. GET  /flows/{id}                         → buscar flow completo com result node
```

### Upscale de resultado
```
1. (apos ter um RESULT_IMAGE de uma geracao anterior)
2. POST /flows/{id}/nodes/upscale            → cria node de upscale
3. POST /flows/{id}/edges                    → conecta result_image → upscale
4. POST /flows/{id}/nodes/{nId}/generate     → dispara upscale
5. GET  /flows/{id}/nodes/{nId}/status        → polling ate status=COMPLETED
6. GET  /flows/{id}                          → buscar flow completo com result node
```

### Remover fundo
```
1. POST /flows/{id}/nodes/remove-bg          → cria node de remove-bg
2. POST /flows/{id}/edges                    → conecta imagem → remove-bg
3. POST /flows/{id}/nodes/{nId}/generate     → dispara remocao
4. GET  /flows/{id}                          → polling ate status=COMPLETED
```

### Gerar video a partir de imagem
```
1. (apos ter um RESULT_IMAGE ou IMAGE com upload)
2. POST /flows/{id}/nodes/image-to-video     → cria node de video (tier: standard ou premium)
3. POST /flows/{id}/edges                    → conecta imagem (start frame) → image-to-video
4. (premium, opcional) POST /flows/{id}/edges → conecta 2a imagem (end frame) → image-to-video
5. (opcional) conecta prompt pra guiar a animacao
6. POST /flows/{id}/nodes/{nId}/generate     → dispara geracao de video
7. GET  /flows/{id}/nodes/{nId}/status        → polling ate status=COMPLETED
8. GET  /flows/{id}                          → buscar flow completo com RESULT_VIDEO
```

**Nota:** No tier premium (Kling v3), se 2 imagens forem conectadas, o modelo anima a transicao entre elas (start → end frame). Maximo de 2 imagens.

### Motion control (transferir movimentos)

**Opcao A: usar RESULT_VIDEO gerado pelo sistema**
```
1. (precisa de um RESULT_VIDEO de uma geracao anterior + uma IMAGE)
2. POST /flows/{id}/nodes/motion-control     → cria node de motion control
3. POST /flows/{id}/edges                    → conecta imagem → motion-control
4. POST /flows/{id}/edges                    → conecta RESULT_VIDEO → motion-control
5. (opcional) conecta prompt
6. POST /flows/{id}/nodes/{nId}/generate     → dispara motion control
7. GET  /flows/{id}/nodes/{nId}/status        → polling ate status=COMPLETED
8. GET  /flows/{id}                          → buscar flow completo com RESULT_VIDEO
```

**Opcao B: upload de video externo de referencia**
```
1. POST /flows/{id}/nodes/video              → cria node de video
2. POST /flows/{id}/nodes/{nId}/upload       → faz upload do video (type: "video/mp4")
3. GET  /flows/{id}/nodes/{nId}/metadata     → polling ate ready=true (duracao extraida)
4. POST /flows/{id}/nodes/file               → cria node de imagem
5. POST /flows/{id}/nodes/{nId}/upload       → faz upload da imagem
6. POST /flows/{id}/nodes/motion-control     → cria node de motion control
7. POST /flows/{id}/edges                    → conecta imagem → motion-control
8. POST /flows/{id}/edges                    → conecta video → motion-control
9. POST /flows/{id}/nodes/{nId}/generate     → dispara motion control
10. GET  /flows/{id}/nodes/{nId}/status       → polling ate status=COMPLETED
```

**Importante:** Apos o upload do video, usar `GET /metadata` pra saber quando a duracao esta disponivel. So depois chamar `calculate-credits` ou `generate`.

### Polling de status (recomendado)
```
1. POST /flows/{id}/nodes/{nId}/generate      → dispara geracao
2. GET  /flows/{id}/nodes/{nId}/status         → polling a cada 2-3s
   → { "status": "QUEUED", "result": null }
   → { "status": "PROCESSING", "result": null }
   → { "status": "COMPLETED", "result": { ... } }  ← parar polling, resultado ja disponivel
```

O `result` ja vem no proprio endpoint de status — nao precisa mais chamar `GET /flows/{id}` so pra pegar o resultado.

### Pipeline completo
```
Prompt → [Text-to-Image] → RESULT_IMAGE → [Remove BG] → RESULT_IMAGE → [Upscale] → RESULT_IMAGE
                                        ↓
                                  [Image-to-Video] → RESULT_VIDEO
                                                          ↓
                              Image + RESULT_VIDEO → [Motion Control] → RESULT_VIDEO
```

---

## Arquitetura de processamento

O processamento de AI e totalmente assincrono:

```
Front                          Backend                         fal.ai
  |                              |                               |
  |-- POST /generate ---------->|                               |
  |<---- 201 (imediato) --------|                               |
  |                              |-- SQS message --------------->|
  |                              |                               |
  |                              |<-- fal.queue.submit() --------|
  |                              |    (retorna request_id)       |
  |                              |                               |
  |-- GET /status (polling) --->|                               |
  |<---- { "PROCESSING" } ------|                               |
  |                              |                               |
  |                              |    ... fal.ai processa ...    |
  |                              |                               |
  |                              |<-- POST /webhooks/fal-ai -----|
  |                              |    (resultado pronto)         |
  |                              |                               |
  |                              |-- download resultado          |
  |                              |-- upload pro S3               |
  |                              |-- cria RESULT node            |
  |                              |-- debita creditos             |
  |                              |                               |
  |-- GET /status (polling) --->|                               |
  |<---- { "COMPLETED",        |                               |
  |        "result": {...} } ---|                               |
  |                              |                               |
  |  (resultado ja disponivel no polling, sem request extra)     |
```

### Webhook interno (nao chamar do front)

`POST /webhooks/fal-ai?secret={FAL_WEBHOOK_SECRET}` — Endpoint publico chamado pelo fal.ai quando o processamento termina. O front **nunca** chama esse endpoint.

---

## Cookies (autenticacao)

Todos os cookies sao `SameSite=None; Secure; HttpOnly; Path=/`.

| Cookie | Descricao | Max-Age |
|--------|-----------|---------|
| `accessToken` | JWT do Cognito com `internalAccountId` | 7 horas |
| `refreshToken` | Token pra renovar o accessToken | Session |

O front precisa usar `credentials: 'include'` (fetch) ou `withCredentials: true` (axios) em todas as requests.
