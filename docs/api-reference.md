# RivoFlow API Reference

> Base URL: `https://{API_DOMAIN}`
> Autenticacao: Cookie-based (accessToken via httpOnly cookie)
> Todas as rotas privadas exigem o cookie de autenticacao

---

## Auth

### POST `/auth/exchange-code`
Troca o code do Google OAuth por tokens.

**Query Params:**
| Param | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| `code` | string | sim | min 1 char |
| `redirectUri` | string | sim | min 1 char |

**Response:** `200`
- Seta cookies `accessToken` e `refreshToken` (httpOnly)
- Sem body na response

---

### POST `/auth/refresh-token`
Renova o accessToken usando o refreshToken do cookie.

**Body:**
| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| `refreshToken` | string | sim | min 1 char |

**Response:** `200` — Atualiza cookies `accessToken` e `refreshToken`

---

### POST `/auth/sign-out`
Limpa os cookies de autenticacao.

**Response:** `200` — Sem body

---

## Account

### GET `/account/me` 🔒
Retorna os dados do usuario autenticado com saldo.

**Response:** `200`
```json
{
  "id": "string",
  "email": "string",
  "provider": "string",
  "externalId": "string",
  "firstName": "string",
  "lastName": "string | undefined",
  "picture": "string",
  "isActive": true,
  "role": "USER",
  "balance": {
    "id": "string",
    "accountId": "string",
    "balance": 0,
    "lifetimeDeposited": 0,
    "lifetimeSpent": 0,
    "createdAt": "2026-03-28T...",
    "updatedAt": "2026-03-28T..."
  },
  "createdAt": "2026-03-28T...",
  "updatedAt": "2026-03-28T..."
}
```

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | string | ID interno da conta (KSUID) |
| `email` | string | Email do usuario |
| `provider` | string | Provedor de auth (ex: `google`) |
| `externalId` | string | ID do usuario no Cognito |
| `firstName` | string | Primeiro nome |
| `lastName` | string? | Sobrenome (pode ser undefined) |
| `picture` | string | URL da foto de perfil |
| `isActive` | boolean | Se a conta esta ativa |
| `role` | enum | `USER` ou `ADMIN` |
| `balance.balance` | number | Saldo atual de creditos |
| `balance.lifetimeDeposited` | number | Total de creditos depositados |
| `balance.lifetimeSpent` | number | Total de creditos gastos |

---

## Flows

### GET `/flows` 🔒
Lista todos os flows do usuario autenticado.

**Response:** `200`
```json
{
  "flows": [
    {
      "id": "string",
      "title": "string",
      "accountId": "string",
      "createdAt": "2026-03-28T...",
      "updatedAt": "2026-03-28T..."
    }
  ]
}
```

---

### POST `/flows` 🔒
Cria um novo flow.

**Body:**
| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| `title` | string | sim | min 1 char |

**Response:** `201`
```json
{
  "flow": {
    "id": "string",
    "title": "string",
    "accountId": "string",
    "nodes": [],
    "edges": [],
    "createdAt": "2026-03-28T...",
    "updatedAt": "2026-03-28T..."
  }
}
```

---

### GET `/flows/{flowId}` 🔒
Retorna o flow com todos os nodes, edges, CDN URLs das imagens/videos, e creditsRequired nos nodes de geracao.

**Path Params:**
| Param | Tipo | Validacao |
|-------|------|-----------|
| `flowId` | string | min 1 char |

**Response:** `200`
```json
{
  "flow": {
    "id": "string",
    "title": "string",
    "accountId": "string",
    "createdAt": "2026-03-28T...",
    "updatedAt": "2026-03-28T..."
  },
  "nodes": [
    {
      "id": "string",
      "flowId": "string",
      "nodeType": "PROMPT",
      "position": { "x": 0, "y": 0 },
      "isExecuted": false,
      "data": {},
      "createdAt": "2026-03-28T...",
      "updatedAt": "2026-03-28T..."
    }
  ],
  "edges": [
    {
      "id": "string",
      "flowId": "string",
      "sourceNodeId": "string",
      "targetNodeId": "string",
      "createdAt": "2026-03-28T...",
      "updatedAt": "2026-03-28T..."
    }
  ]
}
```

---

### PATCH `/flows/{flowId}` 🔒
Atualiza o titulo do flow.

**Path Params:**
| Param | Tipo | Validacao |
|-------|------|-----------|
| `flowId` | string | min 1 char |

**Body:**
| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| `title` | string | nao | min 1 char |

**Response:** `204` — Sem body

---

### DELETE `/flows/{flowId}` 🔒
Deleta o flow e todos nodes/edges (cascade).

**Path Params:**
| Param | Tipo | Validacao |
|-------|------|-----------|
| `flowId` | string | min 1 char |

**Response:** `200`

---

## Edges

### POST `/flows/{flowId}/edges` 🔒
Conecta dois nodes.

**Path Params:**
| Param | Tipo | Validacao |
|-------|------|-----------|
| `flowId` | string | min 1 char |

**Body:**
| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| `sourceNodeId` | string | sim | min 1 char |
| `targetNodeId` | string | sim | min 1 char |

**Response:** `201`
```json
{
  "edge": {
    "id": "string",
    "flowId": "string",
    "sourceNodeId": "string",
    "targetNodeId": "string",
    "createdAt": "2026-03-28T...",
    "updatedAt": "2026-03-28T..."
  },
  "creditsRequired": 20
}
```

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `edge` | object | Dados do edge criado |
| `creditsRequired` | number? | Custo em creditos (retornado quando o target e um node de geracao) |

---

### DELETE `/flows/{flowId}/edges/{edgeId}` 🔒
Remove uma conexao.

**Path Params:**
| Param | Tipo | Validacao |
|-------|------|-----------|
| `flowId` | string | min 1 char |
| `edgeId` | string | min 1 char |

**Response:** `204` — Sem body

---

## Node Types

O front precisa renderizar cada tipo de node de forma diferente:

| nodeType | Descricao | Inputs necessarios | Icone sugerido |
|----------|-----------|-------------------|----------------|
| `PROMPT` | Input de texto | — | Texto/Chat |
| `IMAGE` | Upload de imagem | — | Imagem |
| `VIDEO` | Upload de video | — | Video clip |
| `GENERATION_IMAGE_EDIT` | Edicao de imagem (image-to-image) | 1 prompt (min 3 chars) + 1+ imagens | Pincel |
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

A estrutura base de todo node retornado:
```json
{
  "node": {
    "id": "string (KSUID)",
    "flowId": "string",
    "nodeType": "string",
    "position": { "x": 0, "y": 0 },
    "isExecuted": false,
    "data": {},
    "createdAt": "2026-03-28T...",
    "updatedAt": "2026-03-28T..."
  }
}
```

---

### POST `/flows/{flowId}/nodes/prompt` 🔒
Cria um node de texto (prompt).

**Path Params:**
| Param | Tipo | Validacao |
|-------|------|-----------|
| `flowId` | string | min 1 char |

**Body:**
| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| `position` | object | sim | — |
| `position.x` | number | sim | — |
| `position.y` | number | sim | — |

**Response:** `201` — Node com `nodeType: "PROMPT"` e `data: { "prompt": "" }`

---

### POST `/flows/{flowId}/nodes/file` 🔒
Cria um node de imagem (upload).

**Path Params:**
| Param | Tipo | Validacao |
|-------|------|-----------|
| `flowId` | string | min 1 char |

**Body:**
| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| `position` | object | sim | — |
| `position.x` | number | sim | — |
| `position.y` | number | sim | — |

**Response:** `201` — Node com `nodeType: "IMAGE"` e `data: { "key": null, "inputType": null }`

---

### POST `/flows/{flowId}/nodes/video` 🔒
Cria um node de video (upload).

**Path Params:**
| Param | Tipo | Validacao |
|-------|------|-----------|
| `flowId` | string | min 1 char |

**Body:**
| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| `position` | object | sim | — |
| `position.x` | number | sim | — |
| `position.y` | number | sim | — |

**Response:** `201` — Node com `nodeType: "VIDEO"` e `data: { "key": null, "inputType": null, "duration": null, "fps": null }`

---

### POST `/flows/{flowId}/nodes/generation-image` 🔒
Cria um node de **edicao de imagem** (image-to-image).

**Path Params:**
| Param | Tipo | Validacao |
|-------|------|-----------|
| `flowId` | string | min 1 char |

**Body:**
| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| `position` | object | sim | — |
| `position.x` | number | sim | — |
| `position.y` | number | sim | — |

**Defaults:** model=`fal-ai/nano-banana-2/edit`, quality=`0.5K`, aspectRatio=`1:1`

**Response:** `201` — Node com `nodeType: "GENERATION_IMAGE_EDIT"`
```json
{
  "node": {
    "id": "...",
    "nodeType": "GENERATION_IMAGE_EDIT",
    "data": {
      "model": "fal-ai/nano-banana-2/edit",
      "status": "PENDING",
      "attempts": 0,
      "outputNodeId": null,
      "aspectRatio": "1:1",
      "quality": "0.5K"
    }
  }
}
```

---

### POST `/flows/{flowId}/nodes/text-to-image` 🔒
Cria um node de **geracao de imagem** a partir de texto.

**Path Params:**
| Param | Tipo | Validacao |
|-------|------|-----------|
| `flowId` | string | min 1 char |

**Body:**
| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| `position` | object | sim | — |
| `position.x` | number | sim | — |
| `position.y` | number | sim | — |

**Defaults:** model=`fal-ai/nano-banana-2`, quality=`0.5K`, aspectRatio=`1:1`

**Response:** `201` — Node com `nodeType: "GENERATION_TEXT_TO_IMAGE"`
```json
{
  "node": {
    "id": "...",
    "nodeType": "GENERATION_TEXT_TO_IMAGE",
    "data": {
      "model": "fal-ai/nano-banana-2",
      "status": "PENDING",
      "attempts": 0,
      "outputNodeId": null,
      "aspectRatio": "1:1",
      "quality": "0.5K"
    }
  }
}
```

---

### POST `/flows/{flowId}/nodes/upscale` 🔒
Cria um node de **upscale** (aumentar resolucao).

**Path Params:**
| Param | Tipo | Validacao |
|-------|------|-----------|
| `flowId` | string | min 1 char |

**Body:**
| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| `position` | object | sim | — |
| `position.x` | number | sim | — |
| `position.y` | number | sim | — |

**Defaults:** model=`fal-ai/seedvr/upscale/image`, scale=`2`

**Response:** `201` — Node com `nodeType: "GENERATION_UPSCALE"`
```json
{
  "node": {
    "id": "...",
    "nodeType": "GENERATION_UPSCALE",
    "data": {
      "model": "fal-ai/seedvr/upscale/image",
      "status": "PENDING",
      "attempts": 0,
      "outputNodeId": null,
      "scale": 2
    }
  }
}
```

---

### POST `/flows/{flowId}/nodes/remove-bg` 🔒
Cria um node de **remocao de fundo**.

**Path Params:**
| Param | Tipo | Validacao |
|-------|------|-----------|
| `flowId` | string | min 1 char |

**Body:**
| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| `position` | object | sim | — |
| `position.x` | number | sim | — |
| `position.y` | number | sim | — |

**Defaults:** model=`fal-ai/birefnet`

**Response:** `201` — Node com `nodeType: "GENERATION_REMOVE_BG"`
```json
{
  "node": {
    "id": "...",
    "nodeType": "GENERATION_REMOVE_BG",
    "data": {
      "model": "fal-ai/birefnet",
      "status": "PENDING",
      "attempts": 0,
      "outputNodeId": null
    }
  }
}
```

---

### POST `/flows/{flowId}/nodes/image-to-video` 🔒
Cria um node de **geracao de video** a partir de imagem.

**Path Params:**
| Param | Tipo | Validacao |
|-------|------|-----------|
| `flowId` | string | min 1 char |

**Body:**
| Campo | Tipo | Obrigatorio | Validacao | Valores |
|-------|------|-------------|-----------|---------|
| `position` | object | sim | — | — |
| `position.x` | number | sim | — | — |
| `position.y` | number | sim | — | — |
| `tier` | enum | nao | VideoTierEnum | `standard`, `premium` |

**Defaults:** tier=`standard`, duration=`3`, resolution=`1080p`, aspectRatio=`16:9`, generateAudio=`true`

#### Comparacao entre tiers

| | Standard (LTX-2.3) | Premium (Kling v3 Pro) |
|---|---|---|
| **Modelo** | `fal-ai/ltx-2.3/image-to-video` | `fal-ai/kling-video/v3/pro/image-to-video` |
| **Preco base** | $0.06/s | $0.112/s |
| `duration` | 3-10s | 3-10s |
| `resolution` | **Selecionavel** (`1080p`, `1440p`, `2160p`) | **Nao se aplica** (ignorado pela API) |
| `aspectRatio` | **Selecionavel** (`auto`, `16:9`, `9:16`, `1:1`) | **Nao enviado** pra API |
| `generateAudio` | Sim | Sim |
| **End frame (2a imagem)** | Sim | Sim |

#### Calculo de creditos por tier

**Standard** — o custo varia pela **resolucao**:
```
custo = precoBase × duracao × multiplicadorResolucao
```

| Resolucao | Multiplicador |
|-----------|---------------|
| `1080p` | 1.0x |
| `1440p` | 2.0x |
| `2160p` | 4.0x |

Exemplo: video de 5s em `2160p` custa 4x mais que em `1080p`.

**Premium** — o custo varia pelo **audio**:
```
custo = precoBase × duracao × multiplicadorAudio
```

| Audio | Multiplicador |
|-------|---------------|
| `generateAudio: false` | 1.0x |
| `generateAudio: true` | 1.5x |

Exemplo: video de 5s com audio custa 1.5x mais que sem audio.

#### Parametros enviados pra fal.ai

**Standard (LTX-2.3):**
```json
{
  "image_url": "string",
  "prompt": "string",
  "duration": 3,
  "resolution": "1080p",
  "aspect_ratio": "16:9",
  "generate_audio": true
}
```

**Premium (Kling v3 Pro):**
```json
{
  "start_image_url": "string",
  "end_image_url": "string (opcional, 2a imagem)",
  "prompt": "string",
  "duration": "3",
  "generate_audio": true
}
```
> `resolution` e `aspectRatio` **nao sao enviados** na API do Kling v3 Pro.

**Response:** `201` — Node com `nodeType: "GENERATION_IMAGE_TO_VIDEO"`
```json
{
  "node": {
    "id": "...",
    "nodeType": "GENERATION_IMAGE_TO_VIDEO",
    "data": {
      "model": "fal-ai/ltx-2.3/image-to-video",
      "status": "PENDING",
      "attempts": 0,
      "outputNodeId": null,
      "tier": "standard",
      "duration": "3",
      "resolution": "1080p",
      "aspectRatio": "16:9",
      "generateAudio": true
    }
  }
}
```

---

### POST `/flows/{flowId}/nodes/motion-control` 🔒
Cria um node de **motion control** (transferir movimentos de um video pra uma imagem).

**Path Params:**
| Param | Tipo | Validacao |
|-------|------|-----------|
| `flowId` | string | min 1 char |

**Body:**
| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| `position` | object | sim | — |
| `position.x` | number | sim | — |
| `position.y` | number | sim | — |

**Defaults:** model=`fal-ai/kling-video/v3/pro/motion-control`, characterOrientation=`video`, keepOriginalSound=`false`

**Nota:** O `characterOrientation` e sempre `video` — o modelo replica os movimentos do video de referencia na imagem. Video de referencia maximo de 30 segundos.

**Response:** `201` — Node com `nodeType: "GENERATION_MOTION_CONTROL"`
```json
{
  "node": {
    "id": "...",
    "nodeType": "GENERATION_MOTION_CONTROL",
    "data": {
      "model": "fal-ai/kling-video/v3/pro/motion-control",
      "status": "PENDING",
      "attempts": 0,
      "outputNodeId": null,
      "characterOrientation": "video",
      "keepOriginalSound": false
    }
  }
}
```

---

## Nodes — Update

Todos retornam `204` sem body.

Todos os path params comuns:
| Param | Tipo | Validacao |
|-------|------|-----------|
| `flowId` | string | min 1 char |
| `nodeId` | string | min 1 char |

---

### PUT `/flows/{flowId}/nodes/{nodeId}/prompt` 🔒
Atualiza o texto do prompt.

**Body:**
| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| `prompt` | string | sim | — (aceita string vazia) |

**Response:** `204`

---

### PUT `/flows/{flowId}/nodes/{nodeId}/generation` 🔒
Atualiza parametros do node de edicao de imagem (GENERATION_IMAGE_EDIT).

**Body:**
| Campo | Tipo | Obrigatorio | Validacao | Valores |
|-------|------|-------------|-----------|---------|
| `aspectRatio` | enum | nao | AspectRatioEnum | `1:1`, `1:4`, `1:8`, `2:3`, `3:2`, `3:4`, `4:1`, `4:3`, `4:5`, `5:4`, `8:1`, `9:16`, `16:9`, `21:9` |
| `quality` | enum | nao | QualityEnum | `0.5K`, `1K`, `2K`, `4K` |

**Response:** `204`

---

### PUT `/flows/{flowId}/nodes/{nodeId}/text-to-image` 🔒
Atualiza parametros do node text-to-image (GENERATION_TEXT_TO_IMAGE).

**Body:**
| Campo | Tipo | Obrigatorio | Validacao | Valores |
|-------|------|-------------|-----------|---------|
| `aspectRatio` | enum | nao | AspectRatioEnum | `1:1`, `1:4`, `1:8`, `2:3`, `3:2`, `3:4`, `4:1`, `4:3`, `4:5`, `5:4`, `8:1`, `9:16`, `16:9`, `21:9` |
| `quality` | enum | nao | QualityEnum | `0.5K`, `1K`, `2K`, `4K` |

**Response:** `204`

---

### PUT `/flows/{flowId}/nodes/{nodeId}/upscale` 🔒
Atualiza parametros do node de upscale (GENERATION_UPSCALE).

**Body:**
| Campo | Tipo | Obrigatorio | Validacao | Valores |
|-------|------|-------------|-----------|---------|
| `scale` | number | nao | inteiro, min 1, max 10 | 1 a 10 |

**Response:** `204`

---

### PUT `/flows/{flowId}/nodes/{nodeId}/image-to-video` 🔒
Atualiza parametros do node de video (GENERATION_IMAGE_TO_VIDEO).

**Body:**
| Campo | Tipo | Obrigatorio | Validacao | Valores |
|-------|------|-------------|-----------|---------|
| `tier` | enum | nao | VideoTierEnum | `standard`, `premium` |
| `duration` | enum | nao | VideoDurationEnum | `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10` |
| `resolution` | enum | nao | VideoResolutionEnum | `1080p`, `1440p`, `2160p` |
| `aspectRatio` | enum | nao | VideoAspectRatioEnum | `auto`, `16:9`, `9:16`, `1:1` |
| `generateAudio` | boolean | nao | — | `true`, `false` |

> **Nota:** Ao mudar o `tier`, o `model` e atualizado automaticamente pelo backend. Os campos `resolution` e `aspectRatio` so tem efeito no tier `standard` — no `premium` sao ignorados pela API do fal.ai.

**Response:** `204`

---

### PUT `/flows/{flowId}/nodes/{nodeId}/motion-control` 🔒
Atualiza parametros do node de motion control (GENERATION_MOTION_CONTROL).

**Body:**
| Campo | Tipo | Obrigatorio | Validacao | Valores |
|-------|------|-------------|-----------|---------|
| `characterOrientation` | enum | nao | CharacterOrientationEnum | `image`, `video` |
| `keepOriginalSound` | boolean | nao | — | `true`, `false` |

**Response:** `204`

---

## Nodes — Acoes

### PATCH `/flows/{flowId}/nodes/{nodeId}/position` 🔒
Move um node no canvas.

**Path Params:**
| Param | Tipo | Validacao |
|-------|------|-----------|
| `flowId` | string | min 1 char |
| `nodeId` | string | min 1 char |

**Body:**
| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| `position` | object | sim | — |
| `position.x` | number | sim | — |
| `position.y` | number | sim | — |

**Response:** `204`

---

### DELETE `/flows/{flowId}/nodes/{nodeId}` 🔒
Deleta um node e suas conexoes (edges).

**Path Params:**
| Param | Tipo | Validacao |
|-------|------|-----------|
| `flowId` | string | min 1 char |
| `nodeId` | string | min 1 char |

**Response:** `204`

---

### POST `/flows/{flowId}/nodes/{nodeId}/upload` 🔒
Gera uma URL pre-assinada pra upload de imagem ou video no S3. O `inputType` do node e definido automaticamente pelo `file.type` (`image/*` → `IMAGE`, `video/*` → `VIDEO`).

**Path Params:**
| Param | Tipo | Validacao |
|-------|------|-----------|
| `flowId` | string | min 1 char |
| `nodeId` | string | min 1 char |

**Body:**
| Campo | Tipo | Obrigatorio | Validacao | Descricao |
|-------|------|-------------|-----------|-----------|
| `file` | object | sim | — | — |
| `file.type` | string | sim | min 1 char | MIME type (ex: `image/png`, `video/mp4`) |
| `file.size` | number | sim | — | Tamanho em bytes |

**Response:** `200`
```json
{
  "uploadSignature": "base64...",
  "key": "accountId/flowId/ksuid.ext",
  "fileUrl": "https://cdn.domain/key"
}
```

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `uploadSignature` | string | URL pre-assinada do S3 para upload direto |
| `key` | string | Chave do arquivo no S3 |
| `fileUrl` | string | URL publica via CDN |

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

---

### GET `/flows/{flowId}/nodes/{nodeId}/status` 🔒
Retorna o status atual de um node de geracao e, quando completado, os dados do node de resultado.

**Path Params:**
| Param | Tipo | Validacao |
|-------|------|-----------|
| `flowId` | string | min 1 char |
| `nodeId` | string | min 1 char |

**Response:** `200`

Quando em processamento:
```json
{
  "status": "PROCESSING",
  "result": null
}
```

Quando `COMPLETED` com RESULT_IMAGE:
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
      "inputType": "IMAGE",
      "imageUrl": "https://cdn.domain/accountId/flowId/ksuid.png"
    },
    "createdAt": "2026-03-22T...",
    "updatedAt": "2026-03-22T..."
  }
}
```

Quando `COMPLETED` com RESULT_VIDEO:
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
      "fps": 25,
      "videoUrl": "https://cdn.domain/accountId/flowId/ksuid.mp4"
    },
    "createdAt": "2026-03-22T...",
    "updatedAt": "2026-03-22T..."
  }
}
```

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `status` | enum | `PENDING`, `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED` |
| `result` | object \| null | Dados do node resultado (null ate completar) |
| `result.data.key` | string | Chave do arquivo no S3 |
| `result.data.inputType` | string | `IMAGE` (para RESULT_IMAGE) |
| `result.data.imageUrl` | string | URL do CDN da imagem (RESULT_IMAGE) |
| `result.data.videoUrl` | string | URL do CDN do video (RESULT_VIDEO) |
| `result.data.duration` | number | Duracao em segundos (RESULT_VIDEO) |
| `result.data.fps` | number | Frames por segundo (RESULT_VIDEO) |

**Uso no front:** Fazer polling nesse endpoint a cada 2-3s depois de chamar `/generate`. Quando `status === "COMPLETED"`, o `result` ja contem os dados do node gerado — nao precisa mais buscar o flow completo so pra pegar o resultado.

---

### GET `/flows/{flowId}/nodes/{nodeId}/metadata` 🔒
Retorna se o video ja foi processado e tem a duracao disponivel. **Otimizado pra polling** apos upload de video.

**Path Params:**
| Param | Tipo | Validacao |
|-------|------|-----------|
| `flowId` | string | min 1 char |
| `nodeId` | string | min 1 char |

**Response:** `200`

Antes do processamento:
```json
{
  "ready": false,
  "duration": null
}
```

Apos a Lambda de metadata processar:
```json
{
  "ready": true,
  "duration": 5.2
}
```

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `ready` | boolean | Se a duracao ja foi extraida |
| `duration` | number \| null | Duracao do video em segundos |

**Uso no front:** Apos upload de video, fazer polling a cada 1-2s nesse endpoint. Quando `ready === true`, o `duration` esta disponivel e o front pode chamar `calculate-credits` no node de motion control.

---

### GET `/flows/{flowId}/nodes/{nodeId}/calculate-credits` 🔒
Calcula quantos creditos a geracao vai custar. Funciona pra todos os tipos de geracao.

**Path Params:**
| Param | Tipo | Validacao |
|-------|------|-----------|
| `flowId` | string | min 1 char |
| `nodeId` | string | min 1 char |

**Response:** `200`
```json
{ "creditsRequired": 20 }
```

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `creditsRequired` | number | Custo estimado em creditos |

---

### POST `/flows/{flowId}/nodes/{nodeId}/generate` 🔒
**Dispara a geracao/processamento** do node. Funciona pra TODOS os tipos de geracao — o backend detecta o tipo automaticamente pelo nodeType.

**Path Params:**
| Param | Tipo | Validacao |
|-------|------|-----------|
| `flowId` | string | min 1 char |
| `nodeId` | string | min 1 char |

**Body:** Nenhum

| Node Type | Inputs necessarios (conectados via edge) |
|-----------|----------------------------------------|
| `GENERATION_IMAGE_EDIT` | 1 prompt (min 3 chars) + 1 ou mais imagens |
| `GENERATION_TEXT_TO_IMAGE` | 1 prompt (min 3 chars) |
| `GENERATION_UPSCALE` | 1 imagem |
| `GENERATION_REMOVE_BG` | 1 imagem |
| `GENERATION_IMAGE_TO_VIDEO` | 1-2 imagens (prompt opcional). Premium com 2 imagens: 1a = start frame, 2a = end frame |
| `GENERATION_MOTION_CONTROL` | 1 imagem + 1 video de referencia (prompt opcional) |

**Response:** `201` — Sem body

O processamento acontece em background:
1. Backend submete o request pro fal.ai via `fal.queue.submit()` (retorna imediatamente)
2. fal.ai processa em background (pode levar segundos a minutos)
3. Quando termina, fal.ai envia webhook pro backend (`POST /webhooks/fal-ai`)
4. Backend baixa o resultado, salva no S3, cria result node e debita creditos

O front deve fazer polling no `GET /flows/{flowId}/nodes/{nodeId}/status` e observar o campo `status`:

`PENDING` → `QUEUED` → `PROCESSING` → `COMPLETED` / `FAILED`

Quando `COMPLETED`, um novo node de resultado (`RESULT_IMAGE` ou `RESULT_VIDEO`) aparece conectado ao node de geracao.

**Nota tecnica:** O processamento e totalmente assincrono via webhooks do fal.ai. Nao ha timeout de Lambda — mesmo geracao de video de 15+ minutos funciona sem problemas.

---

## Payments

### POST `/payments/link-charge` 🔒
Gera um link de pagamento (PIX ou cartao) via Abacate Pay.

**Body:**
| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| `amount` | number | sim | min 1 |

**Response:** `201`
```json
{ "link": "https://pay.abacatepay.com/..." }
```

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `link` | string | URL de pagamento do Abacate Pay |

---

### GET `/payments/simulate-credits` 🔒
Simula quantos creditos o usuario receberia por X reais.

**Query Params:**
| Param | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| `amount` | number | sim | positivo (coerced de string pra number) |

**Response:** `200`
```json
{
  "credits": 150,
  "resultAmountInUsd": 6.0
}
```

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `credits` | number | Quantidade de creditos que receberia |
| `resultAmountInUsd` | number | Valor convertido pra USD |

---

## Enums — Referencia Completa

### GenerationStatusEnum
| Valor | Descricao |
|-------|-----------|
| `PENDING` | Aguardando ser disparado |
| `QUEUED` | Na fila do fal.ai |
| `PROCESSING` | Sendo processado |
| `COMPLETED` | Finalizado com sucesso |
| `FAILED` | Falhou |

### AspectRatioEnum (imagem — generation e text-to-image)
| Valor |
|-------|
| `1:1`, `1:4`, `1:8`, `2:3`, `3:2`, `3:4`, `4:1`, `4:3`, `4:5`, `5:4`, `8:1`, `9:16`, `16:9`, `21:9` |

### QualityEnum (imagem)
| Valor | Descricao |
|-------|-----------|
| `0.5K` | Baixa resolucao (mais rapido, mais barato) |
| `1K` | Resolucao padrao |
| `2K` | Alta resolucao |
| `4K` | Ultra resolucao (mais caro) |

### VideoTierEnum
| Valor | Modelo | Preco |
|-------|--------|-------|
| `standard` | LTX-2.3 | $0.06/s |
| `premium` | Kling v3 | $0.112/s |

### VideoDurationEnum (segundos)
| Valor |
|-------|
| `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10` |

### VideoResolutionEnum
| Valor |
|-------|
| `1080p`, `1440p`, `2160p` |

### VideoAspectRatioEnum
| Valor |
|-------|
| `auto`, `16:9`, `9:16`, `1:1` |

### CharacterOrientationEnum
| Valor | Descricao |
|-------|-----------|
| `image` | Orientacao baseada na imagem |
| `video` | Orientacao baseada no video de referencia (default) |

### AccountRoleEnum
| Valor |
|-------|
| `USER`, `ADMIN` |

### AccountTransactionType
| Valor | Descricao |
|-------|-----------|
| `DEPOSIT` | Deposito de creditos (pagamento) |
| `DEBIT` | Debito de creditos (geracao) |

---

## Node Data Types (retornados no GET /flows/{flowId})

Cada node tem um `data` com campos diferentes dependendo do `nodeType`. O front usa o `nodeType` pra discriminar.

### PROMPT
```json
{ "prompt": "texto do usuario" }
```
| Campo | Tipo | Descricao |
|-------|------|-----------|
| `prompt` | string | Texto digitado pelo usuario |

### IMAGE
```json
{ "key": "s3-key", "inputType": "IMAGE", "imageUrl": "https://cdn/..." }
```
| Campo | Tipo | Descricao |
|-------|------|-----------|
| `key` | string \| null | Chave do arquivo no S3 (null antes do upload) |
| `inputType` | string \| null | Tipo do input (`IMAGE`, null antes do upload) |
| `imageUrl` | string | URL do CDN (adicionada pelo backend no GET flow) |

### VIDEO
```json
{ "key": "s3-key", "inputType": "VIDEO", "duration": 5.2, "fps": null, "videoUrl": "https://cdn/..." }
```
| Campo | Tipo | Descricao |
|-------|------|-----------|
| `key` | string \| null | Chave do arquivo no S3 |
| `inputType` | string \| null | `VIDEO` |
| `duration` | number \| null | Duracao em segundos (preenchida automaticamente via S3 trigger) |
| `fps` | number \| null | Frames por segundo |
| `videoUrl` | string | URL do CDN |

### RESULT_IMAGE
```json
{ "key": "s3-key", "inputType": "IMAGE", "imageUrl": "https://cdn/..." }
```
| Campo | Tipo | Descricao |
|-------|------|-----------|
| `key` | string | Chave do arquivo no S3 |
| `inputType` | string | `IMAGE` |
| `imageUrl` | string | URL do CDN da imagem gerada |

### RESULT_VIDEO
```json
{ "key": "s3-key", "duration": 5.2, "fps": 25, "videoUrl": "https://cdn/..." }
```
| Campo | Tipo | Descricao |
|-------|------|-----------|
| `key` | string | Chave do arquivo no S3 |
| `duration` | number | Duracao em segundos |
| `fps` | number | Frames por segundo |
| `videoUrl` | string | URL do CDN do video gerado |

### GENERATION_IMAGE_EDIT
```json
{
  "model": "fal-ai/nano-banana-2/edit",
  "status": "PENDING",
  "attempts": 0,
  "outputNodeId": null,
  "aspectRatio": "1:1",
  "quality": "0.5K",
  "consumedCredits": 0,
  "falRequestId": null
}
```
| Campo | Tipo | Descricao |
|-------|------|-----------|
| `model` | string | Modelo AI utilizado |
| `status` | GenerationStatusEnum | Status da geracao |
| `attempts` | number | Numero de tentativas |
| `outputNodeId` | string \| null | ID do RESULT node criado (null ate completar) |
| `aspectRatio` | AspectRatioEnum | Proporcao da imagem |
| `quality` | QualityEnum | Qualidade/resolucao |
| `consumedCredits` | number | Creditos ja consumidos |
| `falRequestId` | string \| null | ID do request no fal.ai |

### GENERATION_TEXT_TO_IMAGE
Mesma estrutura do `GENERATION_IMAGE_EDIT` com model diferente.

### GENERATION_UPSCALE
```json
{
  "model": "fal-ai/seedvr/upscale/image",
  "status": "PENDING",
  "attempts": 0,
  "outputNodeId": null,
  "scale": 2,
  "consumedCredits": 0,
  "falRequestId": null
}
```
| Campo | Tipo | Descricao |
|-------|------|-----------|
| `scale` | number | Fator de escala (1-10) |

### GENERATION_REMOVE_BG
```json
{
  "model": "fal-ai/birefnet",
  "status": "PENDING",
  "attempts": 0,
  "outputNodeId": null,
  "consumedCredits": 0,
  "falRequestId": null
}
```

### GENERATION_IMAGE_TO_VIDEO
```json
{
  "model": "fal-ai/ltx-2.3/image-to-video",
  "status": "PENDING",
  "attempts": 0,
  "outputNodeId": null,
  "tier": "standard",
  "duration": "3",
  "resolution": "1080p",
  "aspectRatio": "16:9",
  "generateAudio": true,
  "consumedCredits": 0,
  "falRequestId": null
}
```
| Campo | Tipo | Descricao |
|-------|------|-----------|
| `tier` | VideoTierEnum | Standard ou premium |
| `duration` | VideoDurationEnum | Duracao em segundos |
| `resolution` | VideoResolutionEnum | Resolucao do video |
| `aspectRatio` | VideoAspectRatioEnum | Proporcao do video |
| `generateAudio` | boolean | Se deve gerar audio |

### GENERATION_MOTION_CONTROL
```json
{
  "model": "fal-ai/kling-video/v3/pro/motion-control",
  "status": "PENDING",
  "attempts": 0,
  "outputNodeId": null,
  "characterOrientation": "video",
  "keepOriginalSound": false,
  "consumedCredits": 0,
  "falRequestId": null
}
```
| Campo | Tipo | Descricao |
|-------|------|-----------|
| `characterOrientation` | CharacterOrientationEnum | Orientacao do personagem |
| `keepOriginalSound` | boolean | Manter audio original do video de referencia |

---

## Creditos — Pricing

Configuracao base (`CreditPricing`):
| Config | Valor | Descricao |
|--------|-------|-----------|
| `usdPerCredit` | $0.01 | Preco por credito em USD |
| `markupMultiplier` | 2.5x | Multiplicador de markup (imagens) |
| `videoMarkupMultiplier` | 2.0x | Multiplicador de markup (videos) |

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

## Erros

Todos os erros seguem a mesma estrutura:

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "string ou array de objetos"
}
```

### Codigos de erro

| Code | Status | Descricao |
|------|--------|-----------|
| `VALIDATION_ERROR` | 400 | Erro de validacao (Zod). `message` e um array de `{ path, message }` |
| `RESOURCE_NOT_FOUND` | 404 | Recurso nao encontrado |
| `INVALID_NODE_TYPE` | 400 | Tipo de node invalido pra operacao |
| `NODE_ALREADY_PROCESSING` | 409 | Node ja esta em processamento |
| `NODE_ALREADY_PROCESSED` | 409 | Node ja foi processado |
| `NO_FILE_UPLOADED` | 400 | Nenhum arquivo enviado |
| `EXTERNAL_SERVICE_ERROR` | 502 | Erro em servico externo (fal.ai, Abacate Pay) |
| `FORBIDDEN` | 403 | Sem permissao |
| `UNAUTHORIZED` | 401 | Nao autenticado |
| `INTERNAL_SERVER_ERROR` | 500 | Erro interno |

Exemplo de erro de validacao:
```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": [
    { "path": "title", "message": "String must contain at least 1 character(s)" }
  ]
}
```

---

## Webhooks internos (nao chamar do front)

### POST `/webhooks/fal-ai`
Endpoint publico chamado pelo fal.ai quando o processamento termina.

**Query Params:**
| Param | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| `secret` | string | sim | min 1 char |

**Body:**
| Campo | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| `request_id` | string | sim | min 1 char |
| `status` | enum | sim | `OK`, `ERROR` |
| `payload` | any | nao | — |
| `error` | string | nao | — |

**Response:** `200`

---

### POST `/payments/webhook-charge`
Endpoint chamado pelo Abacate Pay quando um pagamento e confirmado.

**Query Params:**
| Param | Tipo | Obrigatorio | Validacao |
|-------|------|-------------|-----------|
| `webhookSecret` | string | sim | — |

**Headers:**
| Header | Tipo | Descricao |
|--------|------|-----------|
| `x-webhook-signature` | string | Assinatura HMAC-SHA256 do body |

**Body (BillingPaidWebhook):**
```json
{
  "id": "string",
  "devMode": false,
  "event": "billing.paid",
  "data": {
    "payment": {
      "amount": 2000,
      "fee": 100,
      "method": "PIX"
    },
    "billing": {
      "id": "string",
      "amount": 2000,
      "paidAmount": 2000,
      "status": "PAID",
      "kind": ["PIX"],
      "frequency": "ONE_TIME",
      "couponsUsed": [],
      "products": [
        {
          "id": "string",
          "externalId": "accountId",
          "quantity": 1
        }
      ],
      "customer": {
        "id": "string",
        "metadata": {
          "name": "string",
          "email": "string",
          "cellphone": "string",
          "taxId": "string"
        }
      }
    }
  }
}
```

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | string | ID do webhook |
| `devMode` | boolean | Se esta em modo de teste |
| `event` | string | Tipo do evento (ex: `billing.paid`) |
| `data.payment.amount` | number | Valor pago em centavos |
| `data.payment.fee` | number | Taxa em centavos |
| `data.payment.method` | string | Metodo (ex: `PIX`) |
| `data.billing.products[].externalId` | string | ID da conta do usuario (accountId) |
| `data.billing.amount` | number | Valor total em centavos |

**Response:** `201`

---

## Arquitetura de pagamentos

O processamento de pagamentos e assincrono via SQS:

```
Abacate Pay                     Backend                          AWS SQS
  |                              |                                |
  |-- POST /webhook-charge ----->|                                |
  |                              |-- Valida webhook secret        |
  |                              |-- Verifica HMAC-SHA256         |
  |                              |-- Publica na PaymentQueue ---->|
  |<---- 201 (imediato) --------|                                |
  |                              |                                |
  |                              |<-- SQS trigger (batch: 1) ----|
  |                              |                                |
  |                              |-- processPayment Lambda        |
  |                              |   ├─ Busca cotacao USD-BRL     |
  |                              |   ├─ Calcula creditos          |
  |                              |   ├─ Atualiza saldo da conta   |
  |                              |   └─ Registra transacao        |
```

**Fluxo do processPayment Lambda:**
1. Extrai `products[0].externalId` como `accountId`
2. Busca cotacao USD-BRL via AwesomeAPI
3. Converte `billing.amount / 100` de centavos pra BRL
4. Converte BRL pra USD usando cotacao
5. Calcula creditos: `Math.floor(amountInUsd / CreditPricing.usdPerCredit)`
6. Atualiza `balance` e `lifetimeDeposited` da conta
7. Registra transacao com metadata (amountBrl, amountUsd, exchangeRate, paymentMethod, billingId)

**Transacao registrada (DEPOSIT):**
```json
{
  "accountId": "string",
  "type": "DEPOSIT",
  "credits": 150,
  "metadata": {
    "amountBrl": 20.0,
    "amountUsd": 3.5,
    "exchangeRate": 5.71,
    "paymentMethod": "PIX",
    "billingId": "string"
  }
}
```

A validacao do webhook usa:
- `webhookSecret` (query param) comparado com `WEBHOOK_SECRET` do env
- `x-webhook-signature` (header) verificado via HMAC-SHA256 com `ABACATE_PAY_PUBLIC_KEY`

---

## Arquitetura de processamento AI

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
4. GET  /flows/{id}/nodes/{nId}/status        → polling ate status=COMPLETED
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

## Cookies (autenticacao)

Todos os cookies sao `SameSite=None; Secure; HttpOnly; Path=/`.

| Cookie | Descricao | Max-Age |
|--------|-----------|---------|
| `accessToken` | JWT do Cognito com `internalAccountId` | 7 horas |
| `refreshToken` | Token pra renovar o accessToken | Session |

O front precisa usar `credentials: 'include'` (fetch) ou `withCredentials: true` (axios) em todas as requests.
