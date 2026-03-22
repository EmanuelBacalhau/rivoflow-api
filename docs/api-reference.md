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

| nodeType | Descricao | Icone sugerido |
|----------|-----------|----------------|
| `PROMPT` | Input de texto | Texto/Chat |
| `IMAGE` | Upload de imagem | Imagem |
| `GENERATION_IMAGE` | Edicao de imagem (image-to-image) | Pincel |
| `GENERATION_TEXT_TO_IMAGE` | Geracao de imagem a partir de texto | Varinha |
| `GENERATION_UPSCALE` | Aumentar resolucao | Lupa+ |
| `GENERATION_REMOVE_BG` | Remover fundo | Tesoura |
| `GENERATION_IMAGE_TO_VIDEO` | Gerar video a partir de imagem | Video |
| `RESULT_IMAGE` | Resultado (imagem gerada) | Imagem com check |
| `RESULT_VIDEO` | Resultado (video gerado) | Video com check |

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
Cria um node de arquivo (imagem).

**Body:**
```json
{ "position": { "x": 0, "y": 0 }, "inputType": "IMAGE" }
```

### POST `/flows/{flowId}/nodes/generation-image`
Cria um node de **edicao de imagem** (image-to-image). Precisa de prompt + imagem como input.

**Body:**
```json
{ "position": { "x": 0, "y": 0 } }
```
**Defaults:** model=`fal-ai/nano-banana-2/edit`, quality=`1K`, aspectRatio=`1:1`

### POST `/flows/{flowId}/nodes/text-to-image`
Cria um node de **geracao de imagem** a partir de texto. Precisa apenas de prompt como input.

**Body:**
```json
{ "position": { "x": 0, "y": 0 } }
```
**Defaults:** model=`fal-ai/nano-banana-2`, quality=`1K`, aspectRatio=`1:1`

### POST `/flows/{flowId}/nodes/upscale`
Cria um node de **upscale** (aumentar resolucao). Precisa de 1 imagem como input.

**Body:**
```json
{ "position": { "x": 0, "y": 0 } }
```
**Defaults:** model=`fal-ai/esrgan`, scale=`2`, face=`false`, upscaleModel=`RealESRGAN_x4plus`

### POST `/flows/{flowId}/nodes/remove-bg`
Cria um node de **remocao de fundo**. Precisa de 1 imagem como input.

**Body:**
```json
{ "position": { "x": 0, "y": 0 } }
```
**Defaults:** model=`fal-ai/birefnet`

### POST `/flows/{flowId}/nodes/image-to-video`
Cria um node de **geracao de video** a partir de imagem. Precisa de 1 imagem como input. Prompt opcional.

**Body:**
```json
{ "position": { "x": 0, "y": 0 }, "tier": "standard" }
```

| Campo | Tipo | Valores | Descricao |
|-------|------|---------|-----------|
| `tier` | enum (opcional) | `standard`, `premium` | Standard = LTX-2.3 ($0.06/s), Premium = Kling v3 ($0.112/s) |

**Defaults:** tier=`standard`, duration=`5`, resolution=`1080p`, aspectRatio=`16:9`, generateAudio=`true`

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
  "scale": 4,
  "face": true,
  "upscaleModel": "RealESRGAN_x4plus"
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

### Enums compartilhados (generation e text-to-image)

| Campo | Valores |
|-------|---------|
| `aspectRatio` | `1:1`, `1:4`, `1:8`, `2:3`, `3:2`, `3:4`, `4:1`, `4:3`, `4:5`, `5:4`, `8:1`, `9:16`, `16:9`, `21:9` |
| `quality` | `0.5K`, `1K`, `2K`, `4K` |

### Enums de upscale

| Campo | Valores |
|-------|---------|
| `scale` | 1 a 8 (fator de escala) |
| `face` | `true`/`false` (otimizacao de rosto) |
| `upscaleModel` | `RealESRGAN_x4plus`, `RealESRGAN_x2plus`, `RealESRGAN_x4plus_anime_6B` |

### Enums de video

| Campo | Valores |
|-------|---------|
| `tier` | `standard` (LTX-2.3), `premium` (Kling v3) |
| `duration` | `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10` (segundos) |
| `resolution` | `1080p`, `1440p`, `2160p` |
| `aspectRatio` | `auto`, `16:9`, `9:16`, `1:1` |
| `generateAudio` | `true`/`false` |

---

## Nodes — Acoes

### POST `/flows/{flowId}/nodes/{nodeId}/upload`
Gera uma URL pre-assinada pra upload de imagem no S3.

**Body:**
```json
{
  "file": {
    "type": "image/png",
    "size": 1024000
  }
}
```
**Response:** `200`
```json
{
  "uploadSignature": "base64...",
  "key": "accountId/flowId/ksuid.png",
  "imageUrl": "https://cdn.domain/key"
}
```

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

### GET `/flows/{flowId}/nodes/{nodeId}/calculate-credits`
Calcula quantos creditos a geracao vai custar. Funciona pra todos os tipos de geracao.

**Response:** `200`
```json
{ "creditsRequired": 20 }
```

### POST `/flows/{flowId}/nodes/{nodeId}/generate-image`
**Dispara a geracao/processamento** do node. Funciona pra TODOS os tipos de geracao — o backend detecta o tipo automaticamente pelo nodeType.

| Node Type | Inputs necessarios (conectados via edge) |
|-----------|----------------------------------------|
| `GENERATION_IMAGE` | 1 prompt (min 3 chars) + 1 ou mais imagens |
| `GENERATION_TEXT_TO_IMAGE` | 1 prompt (min 3 chars) |
| `GENERATION_UPSCALE` | 1 imagem |
| `GENERATION_REMOVE_BG` | 1 imagem |
| `GENERATION_IMAGE_TO_VIDEO` | 1 imagem (prompt opcional) |

**Response:** `201`

O processamento acontece em background (SQS). O front deve fazer polling no `GET /flows/{flowId}` e observar o campo `status` do node de geracao:

`PENDING` → `QUEUED` → `PROCESSING` → `COMPLETED` / `FAILED`

Quando `COMPLETED`, um novo node de resultado (`RESULT_IMAGE` ou `RESULT_VIDEO`) aparece conectado ao node de geracao.

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
{ "key": "s3-key", "inputType": "IMAGE", "imageUrl": "https://cdn/..." }
```

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
  "face": false,
  "upscaleModel": "RealESRGAN_x4plus",
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

---

## Fluxos de uso tipicos

### Gerar imagem do zero (text-to-image)
```
1. POST /flows/{id}/nodes/prompt             → cria node de texto
2. PUT  /flows/{id}/nodes/{nId}/prompt       → escreve o prompt
3. POST /flows/{id}/nodes/text-to-image      → cria node de geracao
4. POST /flows/{id}/edges                    → conecta prompt → text-to-image
5. POST /flows/{id}/nodes/{nId}/generate-image → dispara geracao
6. GET  /flows/{id}                          → polling ate status=COMPLETED
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
8. POST /flows/{id}/nodes/{nId}/generate-image → dispara edicao
9. GET  /flows/{id}                          → polling ate status=COMPLETED
```

### Upscale de resultado
```
1. (apos ter um RESULT_IMAGE de uma geracao anterior)
2. POST /flows/{id}/nodes/upscale            → cria node de upscale
3. POST /flows/{id}/edges                    → conecta result_image → upscale
4. POST /flows/{id}/nodes/{nId}/generate-image → dispara upscale
5. GET  /flows/{id}                          → polling ate status=COMPLETED
```

### Remover fundo
```
1. POST /flows/{id}/nodes/remove-bg          → cria node de remove-bg
2. POST /flows/{id}/edges                    → conecta imagem → remove-bg
3. POST /flows/{id}/nodes/{nId}/generate-image → dispara remocao
4. GET  /flows/{id}                          → polling ate status=COMPLETED
```

### Gerar video a partir de imagem
```
1. (apos ter um RESULT_IMAGE ou IMAGE com upload)
2. POST /flows/{id}/nodes/image-to-video     → cria node de video (tier: standard ou premium)
3. POST /flows/{id}/edges                    → conecta imagem → image-to-video
4. (opcional) POST /flows/{id}/nodes/prompt + edge → conecta prompt pra guiar a animacao
5. POST /flows/{id}/nodes/{nId}/generate-image → dispara geracao de video
6. GET  /flows/{id}                          → polling ate status=COMPLETED (resultado = RESULT_VIDEO)
```

### Pipeline completo
```
Prompt → [Text-to-Image] → RESULT_IMAGE → [Remove BG] → RESULT_IMAGE → [Upscale] → RESULT_IMAGE
                                        → [Image-to-Video] → RESULT_VIDEO
```
