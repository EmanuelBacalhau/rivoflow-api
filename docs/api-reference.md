# RivoFlow API Reference

> Base URL: `https://{API_DOMAIN}`
> Autenticacao: Cookie-based (accessToken via httpOnly cookie)

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

---

### POST `/auth/refresh-token`
Renova o accessToken usando o refreshToken do cookie.

**Response:** `200` — Atualiza cookies

---

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
  "id": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "picture": "string",
  "balance": {
    "balance": 0,
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
Retorna o flow com todos os nodes, edges, e CDN URLs das imagens.

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
**Defaults:** model=`fal-ai/flux/dev`, imageSize=`landscape_4_3`, guidanceScale=`3.5`

### POST `/flows/{flowId}/nodes/upscale`
Cria um node de **upscale** (aumentar resolucao).

**Body:**
```json
{ "position": { "x": 0, "y": 0 } }
```
**Defaults:** model=`fal-ai/esrgan`, scale=`2`, face=`false`, upscaleModel=`RealESRGAN_x4plus`

### POST `/flows/{flowId}/nodes/remove-bg`
Cria um node de **remocao de fundo**.

**Body:**
```json
{ "position": { "x": 0, "y": 0 } }
```
**Defaults:** model=`fal-ai/birefnet`

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

| Campo | Valores |
|-------|---------|
| `aspectRatio` | `1:1`, `1:4`, `1:8`, `2:3`, `3:2`, `3:4`, `4:1`, `4:3`, `4:5`, `5:4`, `8:1`, `9:16`, `16:9`, `21:9` |
| `quality` | `0.5K`, `1K`, `2K`, `4K` |

### PUT `/flows/{flowId}/nodes/{nodeId}/text-to-image`
Atualiza parametros do node text-to-image.

**Body (todos opcionais):**
```json
{
  "imageSize": "landscape_4_3",
  "guidanceScale": 3.5,
  "seed": 42
}
```

| Campo | Tipo | Valores |
|-------|------|---------|
| `imageSize` | enum | `square_hd`, `square`, `portrait_4_3`, `portrait_16_9`, `landscape_4_3`, `landscape_16_9` |
| `guidanceScale` | number | 1 a 20 (controla aderencia ao prompt) |
| `seed` | number \| null | inteiro ou null pra aleatorio |

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

| Campo | Tipo | Valores |
|-------|------|---------|
| `scale` | number | 1 a 8 (fator de escala) |
| `face` | boolean | ativa otimizacao de rosto |
| `upscaleModel` | enum | `RealESRGAN_x4plus`, `RealESRGAN_x2plus`, `RealESRGAN_x4plus_anime_6B` |

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
Calcula quantos creditos a geracao vai custar.

**Response:** `200`
```json
{ "creditsRequired": 20 }
```

### POST `/flows/{flowId}/nodes/{nodeId}/generate-image`
**Dispara a geracao/processamento** do node. Funciona pra TODOS os tipos de geracao — o backend detecta o tipo automaticamente.

| Node Type | Inputs necessarios |
|-----------|-------------------|
| `GENERATION_IMAGE` | Prompt (min 3 chars) + pelo menos 1 imagem |
| `GENERATION_TEXT_TO_IMAGE` | Prompt (min 3 chars) |
| `GENERATION_UPSCALE` | Pelo menos 1 imagem |
| `GENERATION_REMOVE_BG` | Pelo menos 1 imagem |

**Response:** `201` — O processamento acontece em background (SQS). Faca polling no `GET /flows/{flowId}` pra ver o status mudar: `QUEUED` → `PROCESSING` → `COMPLETED`/`FAILED`.

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

### PROMPT
```json
{ "prompt": "texto do usuario" }
```

### IMAGE / RESULT_IMAGE
```json
{ "key": "s3-key", "inputType": "IMAGE", "imageUrl": "https://cdn/..." }
```

### GENERATION_IMAGE (edicao)
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

### GENERATION_TEXT_TO_IMAGE
```json
{
  "status": "PENDING",
  "attempts": 0,
  "outputNodeId": null,
  "imageSize": "landscape_4_3",
  "guidanceScale": 3.5,
  "seed": null,
  "consumedCredits": 7
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
  "consumedCredits": 3
}
```

### GENERATION_REMOVE_BG
```json
{
  "status": "PENDING",
  "attempts": 0,
  "outputNodeId": null,
  "consumedCredits": 2
}
```

---

## Fluxo de uso tipico

```
1. POST /flows                              → cria flow
2. POST /flows/{id}/nodes/prompt            → cria node de texto
3. PUT  /flows/{id}/nodes/{nId}/prompt      → escreve o prompt
4. POST /flows/{id}/nodes/text-to-image     → cria node de geracao
5. POST /flows/{id}/edges                   → conecta prompt → text-to-image
6. POST /flows/{id}/nodes/{nId}/generate-image → dispara geracao
7. GET  /flows/{id}                         → polling ate status=COMPLETED
8. POST /flows/{id}/nodes/upscale           → cria node de upscale
9. POST /flows/{id}/edges                   → conecta result_image → upscale
10. POST /flows/{id}/nodes/{nId}/generate-image → dispara upscale
```
