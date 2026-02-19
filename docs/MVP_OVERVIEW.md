# Orion Flow API — Arquitetura Completa MVP

> Documento de referência do sistema. Gerado com base no codebase atual.
> Inclui: arquitetura, DynamoDB design, access patterns, fluxos e roadmap.

---

## Índice

1. [Visão Geral da Aplicação](#1-visão-geral-da-aplicação)
2. [Arquitetura de Infraestrutura](#2-arquitetura-de-infraestrutura)
3. [Fluxo de Autenticação Completo](#3-fluxo-de-autenticação-completo)
4. [DynamoDB — Single Table Design](#4-dynamodb--single-table-design)
5. [Access Patterns Completos](#5-access-patterns-completos)
6. [Sistema de Créditos e Precificação](#6-sistema-de-créditos-e-precificação)
7. [Fluxo de Geração de Imagem](#7-fluxo-de-geração-de-imagem)
8. [Endpoints da API](#8-endpoints-da-api)
9. [Arquitetura de Código](#9-arquitetura-de-código)
10. [O que está faltando — Crítico ao Simples](#10-o-que-está-faltando--crítico-ao-simples)
11. [Roadmap de Implementação MVP](#11-roadmap-de-implementação-mvc)

---

## 1. Visão Geral da Aplicação

Orion Flow API é um SaaS de geração de imagens com IA baseado em fluxos visuais (nodes + edges).
O usuário monta um grafo conectando nós de texto (prompt) e imagens a um nó gerador, que chama a Gemini para produzir uma nova imagem.

### Modelo de negócio

```
Usuário compra créditos → usa créditos para gerar imagens via AI
Você paga a Gemini por token → cobra markup de 2.5x do usuário
Margem = (créditos cobrados × $0.01) - custo real Gemini
```

### Hierarquia de dados

```
Account (usuário)
  └── N Flows (workspaces de criação)
        └── N Nodes (prompt / imagem / gerador / resultado)
        └── N Edges (conexões entre nodes)
```

> **Decisão de design**: sem entidade `Project`. Flow pertence diretamente ao Account.
> O campo `projectId` que existia nas entidades foi removido e substituído por `accountId`.

---

## 2. Arquitetura de Infraestrutura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AWS Cloud                                      │
│                                                                             │
│  ┌──────────┐    ┌─────────────────────────────────────────────────────┐   │
│  │  Route53 │───▶│  CloudFront CDN                                     │   │
│  └──────────┘    │  (cdn.domain.com)                                   │   │
│                  │  Origin: S3 Bucket (imagens geradas)                │   │
│                  └─────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────┐    ┌─────────────────────────────────────────────────────┐   │
│  │  Route53 │───▶│  API Gateway HTTP API v2                            │   │
│  └──────────┘    │  (api.domain.com)                                   │   │
│                  │  JWT Authorizer → Cognito User Pool                 │   │
│                  └──────────────┬──────────────────────────────────────┘   │
│                                 │ invoca                                    │
│                  ┌──────────────▼──────────────────────────────────────┐   │
│                  │  AWS Lambda Functions (Node.js / esbuild)           │   │
│                  │                                                      │   │
│                  │  Auth:    exchange-code, refresh-token               │   │
│                  │  Flows:   create, list, get, delete                  │   │
│                  │  Nodes:   create, update, delete                     │   │
│                  │           upload, confirm-upload                     │   │
│                  │           create-image-ai, calculate-credits         │   │
│                  │  Edges:   create, delete                             │   │
│                  │  Me:      get-me, get-balance, list-transactions     │   │
│                  │  (SQS):   process-image-ai (1024MB, timeout 300s)   │   │
│                  └──────┬──────────┬──────────┬───────────────────────┘   │
│                         │          │          │                             │
│              ┌──────────▼──┐  ┌────▼────┐  ┌─▼────────────────────────┐  │
│              │  DynamoDB   │  │   S3    │  │  SQS                     │  │
│              │  (single    │  │ Bucket  │  │  ImageQueue (VisTO 360s) │  │
│              │   table)    │  │ imagens │  │  DLQImageQueue (14 dias) │  │
│              └─────────────┘  └────┬────┘  └──────────────────────────┘  │
│                                    │                                        │
│              ┌─────────────────────▼──────────────────────┐               │
│              │  Cognito User Pool                          │               │
│              │  Google Identity Provider (OAuth 2.0)      │               │
│              │  Access Token: 15min                        │               │
│              │  Refresh Token: 7 dias (com rotação)        │               │
│              └─────────────────────────────────────────────┘               │
│                                                                             │
│              ┌──────────────────────────────────────────────┐              │
│              │  Google Gemini API (externa)                  │              │
│              │  gemini-2.0-flash-preview-image-generation   │              │
│              └──────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Componentes AWS

| Componente | Recurso | Configuração |
|-----------|---------|-------------|
| API Gateway | HTTP API v2 | JWT Authorizer via Cognito, CORS |
| Lambda | Node.js (esbuild) | PAY_PER_REQUEST, timeout 30s padrão |
| Lambda SQS | Node.js (esbuild) | 1024 MB, timeout 300s, batch 2 |
| DynamoDB | Single Table | PAY_PER_REQUEST, PITR 35 dias |
| S3 | 1 Bucket | CORS habilitado, acessado via CloudFront OAC |
| CloudFront | CDN | OAC, domínio customizado, TLS 1.2 |
| SQS | ImageQueue | VisibilityTimeout 360s, long poll 20s, maxReceive 3 |
| SQS DLQ | DLQImageQueue | MessageRetention 14 dias |
| Cognito | User Pool | Google federated, email como username |
| Route53 | Hosted Zone | A records para API + CDN |
| ACM | Certificados | DNS validated, automático via CloudFormation |

---

## 3. Fluxo de Autenticação Completo

### 3.1 Login inicial (como deve funcionar)

```
Browser/App                  Orion API                  Cognito                 DynamoDB
    │                            │                          │                       │
    │── GET Cognito Hosted UI ──▶│                          │                       │
    │   (redirect para Google)   │                          │                       │
    │                            │                          │                       │
    │◀─ redirect Google OAuth ──────────────────────────────│                       │
    │                                                       │                       │
    │─── usuário autoriza ───────────────────────────────▶ │                       │
    │◀── redirect com ?code=xxx ────────────────────────── │                       │
    │                            │                          │                       │
    │── POST /auth/exchange ────▶│                          │                       │
    │   { code, redirectUri }    │                          │                       │
    │                            │── POST /oauth2/token ───▶│                       │
    │                            │   { code, redirect_uri } │                       │
    │                            │◀─ { access_token,        │                       │
    │                            │     refresh_token }      │                       │
    │                            │                          │                       │
    │                            │── GET /oauth2/userInfo ─▶│                       │
    │                            │◀─ { sub, email,          │                       │
    │                            │     given_name,          │                       │
    │                            │     family_name,         │                       │
    │                            │     picture }            │                       │
    │                            │                          │                       │
    │                            │── Query GSI_ExternalId ─────────────────────────▶│
    │                            │   (externalId = sub)                             │
    │                            │◀─ Account | null ───────────────────────────────│
    │                            │                                                  │
    │                            │  [SE NOVO USUÁRIO]                               │
    │                            │── PutItem Account ──────────────────────────────▶│
    │                            │── PutItem Profile ──────────────────────────────▶│
    │                            │── PutItem CreditBalance (0) ───────────────────▶│
    │                            │                                                  │
    │                            │  [SE USUÁRIO EXISTENTE]                          │
    │                            │── UpdateItem Profile (picture, name) ───────────▶│
    │                            │                                                  │
    │◀─ Set-Cookie: access_token (HttpOnly, 15min) ──────────────────────────────  │
    │◀─ Set-Cookie: refresh_token (HttpOnly, 7d, Path=/auth/refresh) ────────────  │
```

### 3.2 Renovação de token (endpoint a criar)

```
Browser/App                  Orion API                  Cognito
    │                            │                          │
    │── POST /auth/refresh ─────▶│                          │
    │   Cookie: refresh_token    │                          │
    │                            │── POST /oauth2/token ───▶│
    │                            │   { grant_type: refresh_token,
    │                            │     refresh_token: xxx } │
    │                            │◀─ { access_token,        │
    │                            │     refresh_token (novo) }
    │◀─ Set-Cookie: access_token (novo, 15min) ────────────│
    │◀─ Set-Cookie: refresh_token (novo, 7d) ─────────────│
```

### 3.3 Request autenticado

```
Browser/App                  API Gateway                Lambda Handler
    │                            │                          │
    │── GET /flows ─────────────▶│                          │
    │   Cookie: access_token     │                          │
    │                            │ valida JWT via Cognito   │
    │                            │ extrai claim "sub"       │
    │                            │                          │
    │                            │── invoca Lambda ────────▶│
    │                            │   event.requestContext   │
    │                            │   .authorizer.jwt.claims │
    │                            │   .sub = "cognito-sub"   │
    │                            │                          │
    │                            │         busca Account por sub via GSI
    │                            │         passa internalId ao Controller
    │                            │                          │
    │◀─ 200 { flows: [...] } ───────────────────────────── │
```

> **Nota crítica atual**: o adapter extrai `internalAccountId` do JWT mas o Cognito não emite esse claim.
> Deve ser corrigido para extrair o `sub` e buscar o `internalId` via `AccountRepository.findByExternalId()`.

---

## 4. DynamoDB — Single Table Design

**Table name:** `rivo-flow-api-{stage}-table`
**Billing:** PAY_PER_REQUEST
**PITR:** habilitado, 35 dias

### 4.1 Chaves e GSIs

```
┌──────────────────────────────────────────────────────────────────┐
│  PRIMARY KEY                                                      │
│  PK (HASH)  +  SK (RANGE)                                        │
├──────────────────────────────────────────────────────────────────┤
│  GSI_ExternalId                                                   │
│  GSI1PK: externalId (string)   │  GSI1SK: PK (string)            │
│  Projeção: ALL                                                    │
│  Uso: login — buscar Account pelo sub do Cognito                 │
├──────────────────────────────────────────────────────────────────┤
│  GSI_Account                                                      │
│  GSI2PK: accountId (string)    │  GSI2SK: createdAt (string)     │
│  Projeção: ALL                                                    │
│  Uso: listar Flows do usuário, ordenados por data                │
├──────────────────────────────────────────────────────────────────┤
│  GSI_UsageDate  (interno — analytics do SaaS)                    │
│  GSI3PK: usageDate (string, YYYY-MM-DD)  │  GSI3SK: SK           │
│  Projeção: ALL                                                    │
│  Uso: agregar consumo de AI por dia (relatório de custo)         │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Todos os items da tabela

---

#### ACCOUNT

```
PK:           ACCOUNT#{internalId}
SK:           ACCOUNT#METADATA
type:         ACCOUNT
id:           string  (KSUID — ID interno gerado por nós)
externalId:   string  (sub do Cognito/Google — GSI1PK)
email:        string
status:       "active" | "suspended" | "deleted"
createdAt:    ISO 8601 string
updatedAt:    ISO 8601 string
```

Campos para GSI:
```
GSI1PK = externalId   (valor do campo externalId)
GSI1SK = PK           (valor do campo PK, ex: "ACCOUNT#01JXXXXX")
```

Exemplo real:
```json
{
  "PK":         "ACCOUNT#01JWKP3BFRT6XVHS8R0M4YN7Z2",
  "SK":         "ACCOUNT#METADATA",
  "type":       "ACCOUNT",
  "id":         "01JWKP3BFRT6XVHS8R0M4YN7Z2",
  "externalId": "108391827364519273645",
  "email":      "joao@gmail.com",
  "status":     "active",
  "createdAt":  "2025-01-15T10:30:00.000Z",
  "updatedAt":  "2025-01-15T10:30:00.000Z",
  "GSI1PK":     "108391827364519273645",
  "GSI1SK":     "ACCOUNT#01JWKP3BFRT6XVHS8R0M4YN7Z2"
}
```

---

#### PROFILE

```
PK:           ACCOUNT#{internalId}
SK:           PROFILE#METADATA
type:         PROFILE
firstName:    string
lastName:     string
pictureUrl:   string  (URL da foto do Google, sem expiração)
locale:       string  (ex: "pt-BR")
createdAt:    ISO 8601 string
updatedAt:    ISO 8601 string
```

Exemplo real:
```json
{
  "PK":         "ACCOUNT#01JWKP3BFRT6XVHS8R0M4YN7Z2",
  "SK":         "PROFILE#METADATA",
  "type":       "PROFILE",
  "firstName":  "João",
  "lastName":   "Silva",
  "pictureUrl": "https://lh3.googleusercontent.com/a/xxx",
  "locale":     "pt-BR",
  "createdAt":  "2025-01-15T10:30:00.000Z",
  "updatedAt":  "2025-01-15T10:30:00.000Z"
}
```

---

#### CREDIT_BALANCE

```
PK:                ACCOUNT#{internalId}
SK:                BALANCE#CURRENT
type:              CREDIT_BALANCE
balance:           number  (créditos disponíveis agora)
lifetimeDeposited: number  (total de créditos comprados na vida)
lifetimeSpent:     number  (total de créditos gastos na vida)
updatedAt:         ISO 8601 string
```

> Não tem `createdAt` — é um item que existe desde o cadastro e é sempre atualizado.
> O update usa `UpdateExpression` atômico para evitar race condition com concorrência.

Exemplo real:
```json
{
  "PK":                "ACCOUNT#01JWKP3BFRT6XVHS8R0M4YN7Z2",
  "SK":                "BALANCE#CURRENT",
  "type":              "CREDIT_BALANCE",
  "balance":           250,
  "lifetimeDeposited": 1000,
  "lifetimeSpent":     750,
  "updatedAt":         "2025-01-20T14:22:00.000Z"
}
```

---

#### CREDIT_TRANSACTION

Registra toda movimentação de créditos (depósitos, reembolsos, bônus).
Consumo de AI é registrado no `AI_USAGE`, não aqui.

```
PK:              ACCOUNT#{internalId}
SK:              TXN#{ksuid}           ← KSUID é time-ordered, ordena por data naturalmente
type:            CREDIT_TRANSACTION
transactionType: "DEPOSIT" | "REFUND" | "BONUS" | "ADJUSTMENT"
credits:         number  (quantidade de créditos, sempre positivo)
amountUsd:       number  (valor em dólar — 0 para bônus)
description:     string
paymentId:       string | null  (ID externo do gateway de pagamento, ex: Stripe)
createdAt:       ISO 8601 string
```

Campos para GSI:
```
GSI2PK = "ACCOUNT#{internalId}"   (mesmo PK — para listar por conta)
GSI2SK = createdAt
```

Exemplo real:
```json
{
  "PK":              "ACCOUNT#01JWKP3BFRT6XVHS8R0M4YN7Z2",
  "SK":              "TXN#01JWKQM9ZF3BXVHS8R0M4YN7Z2",
  "type":            "CREDIT_TRANSACTION",
  "transactionType": "DEPOSIT",
  "credits":         500,
  "amountUsd":       5.00,
  "description":     "Compra de 500 créditos",
  "paymentId":       "pi_3OxxxxxStripe",
  "createdAt":       "2025-01-15T11:00:00.000Z",
  "GSI2PK":          "ACCOUNT#01JWKP3BFRT6XVHS8R0M4YN7Z2",
  "GSI2SK":          "2025-01-15T11:00:00.000Z"
}
```

---

#### AI_USAGE

Registro interno de cada geração de imagem. Dados para você (dono do SaaS) acompanhar custo, receita e margem.

```
PK:             ACCOUNT#{internalId}
SK:             AI_USAGE#{ksuid}
type:           AI_USAGE
flowId:         string
nodeId:         string   (nodeGeneratorId)
model:          string   (ex: "gemini-2.0-flash-preview-image-generation")
quality:        "1K" | "2K" | "4K"
inputTokens:    number   (tokens de entrada — prompt + imagens)
outputTokens:   number   (tokens de saída — imagem gerada)
inputCostUsd:   number   (custo real pago à Gemini pelo input)
outputCostUsd:  number   (custo real pago à Gemini pelo output)
totalCostUsd:   number   (inputCostUsd + outputCostUsd)
creditsDeducted: number  (créditos cobrados do usuário)
revenueUsd:     number   (creditsDeducted × $0.01 — receita bruta)
marginUsd:      number   (revenueUsd − totalCostUsd — margem real)
usageDate:      string   (YYYY-MM-DD — para GSI_UsageDate)
createdAt:      ISO 8601 string
```

Campos para GSI:
```
GSI3PK = usageDate   (ex: "2025-01-15")
GSI3SK = SK          (ex: "AI_USAGE#01JWKQM9ZF...")
```

Exemplo real:
```json
{
  "PK":              "ACCOUNT#01JWKP3BFRT6XVHS8R0M4YN7Z2",
  "SK":              "AI_USAGE#01JWKR2BFRT6XVHS8R0M4YN7Z2",
  "type":            "AI_USAGE",
  "flowId":          "01JWKL9BFRT6XVHS8R0M4YN7Z2",
  "nodeId":          "01JWKM3BFRT6XVHS8R0M4YN7Z2",
  "model":           "gemini-2.0-flash-preview-image-generation",
  "quality":         "2K",
  "inputTokens":     1680,
  "outputTokens":    1120,
  "inputCostUsd":    0.00000336,
  "outputCostUsd":   0.0001344,
  "totalCostUsd":    0.00013776,
  "creditsDeducted": 35,
  "revenueUsd":      0.35,
  "marginUsd":       0.34986224,
  "usageDate":       "2025-01-15",
  "createdAt":       "2025-01-15T14:22:00.000Z",
  "GSI3PK":          "2025-01-15",
  "GSI3SK":          "AI_USAGE#01JWKR2BFRT6XVHS8R0M4YN7Z2"
}
```

---

#### FLOW

```
PK:        FLOW#{flowId}
SK:        FLOW#{flowId}
type:      FLOW
id:        string  (KSUID)
accountId: string  (internalId do Account — sem prefixo "ACCOUNT#")
title:     string
createdAt: ISO 8601 string
updatedAt: ISO 8601 string
```

Campos para GSI:
```
GSI2PK = "ACCOUNT#{accountId}"   (com prefixo)
GSI2SK = createdAt               (para ordenação)
```

Exemplo real:
```json
{
  "PK":        "FLOW#01JWKL9BFRT6XVHS8R0M4YN7Z2",
  "SK":        "FLOW#01JWKL9BFRT6XVHS8R0M4YN7Z2",
  "type":      "FLOW",
  "id":        "01JWKL9BFRT6XVHS8R0M4YN7Z2",
  "accountId": "01JWKP3BFRT6XVHS8R0M4YN7Z2",
  "title":     "Campanha Verão 2025",
  "createdAt": "2025-01-16T09:00:00.000Z",
  "updatedAt": "2025-01-16T09:00:00.000Z",
  "GSI2PK":    "ACCOUNT#01JWKP3BFRT6XVHS8R0M4YN7Z2",
  "GSI2SK":    "2025-01-16T09:00:00.000Z"
}
```

---

#### NODE

```
PK:         FLOW#{flowId}
SK:         NODE#{nodeId}
type:       NODE
id:         string  (KSUID)
flowId:     string
position:   { x: number, y: number }
isExecuted: boolean
data:       NodeData  (ver tipos abaixo)
createdAt:  ISO 8601 string
updatedAt:  ISO 8601 string
```

**NodeData por tipo:**

```typescript
// PROMPT
{ type: "PROMPT", prompt: string, totalTokens: number }

// IMAGE (upload do usuário)
{ type: "IMAGE", key: string | null, inputType: "IMAGE" | "VIDEO" | null, totalTokens: number }

// GENERATION_IMAGE (nó gerador)
{
  type: "GENERATION_IMAGE",
  model: string,
  parameters: { aspectRatio: "1:1"|"16:9"|"4:3"|"9:16", quality: "1K"|"2K"|"4K" },
  inputs: string[],      // IDs dos nodes de entrada
  outputNodeId: string | null,
  attempts: number,
  status: "pending"|"queued"|"processing"|"completed"|"failed",
  totalTokens: number
}

// RESULT_IMAGE (saída gerada pela AI)
{ type: "RESULT_IMAGE", key: string | null, inputType: "IMAGE", totalTokens: number }
```

---

#### EDGE

```
PK:           FLOW#{flowId}
SK:           EDGE#{edgeId}
type:         EDGE
id:           string  (KSUID)
flowId:       string
sourceNodeId: string
targetNodeId: string
createdAt:    ISO 8601 string
updatedAt:    ISO 8601 string
```

---

### 4.3 Visualização completa da tabela

```
┌──────────────────────────────────────┬────────────────────────────┬──────────────────┐
│ PK                                   │ SK                         │ type             │
├──────────────────────────────────────┼────────────────────────────┼──────────────────┤
│ ACCOUNT#01JW...                      │ ACCOUNT#METADATA           │ ACCOUNT          │
│ ACCOUNT#01JW...                      │ PROFILE#METADATA           │ PROFILE          │
│ ACCOUNT#01JW...                      │ BALANCE#CURRENT            │ CREDIT_BALANCE   │
│ ACCOUNT#01JW...                      │ TXN#01JW...                │ CREDIT_TRANSACT. │
│ ACCOUNT#01JW...                      │ TXN#01JX...                │ CREDIT_TRANSACT. │
│ ACCOUNT#01JW...                      │ AI_USAGE#01JW...           │ AI_USAGE         │
│ ACCOUNT#01JW...                      │ AI_USAGE#01JX...           │ AI_USAGE         │
├──────────────────────────────────────┼────────────────────────────┼──────────────────┤
│ FLOW#01JW...                         │ FLOW#01JW...               │ FLOW             │
│ FLOW#01JW...                         │ NODE#01JW...               │ NODE             │
│ FLOW#01JW...                         │ NODE#01JX...               │ NODE             │
│ FLOW#01JW...                         │ NODE#01JY...               │ NODE             │
│ FLOW#01JW...                         │ EDGE#01JW...               │ EDGE             │
├──────────────────────────────────────┼────────────────────────────┼──────────────────┤
│ FLOW#01JX...                         │ FLOW#01JX...               │ FLOW             │
│ FLOW#01JX...                         │ NODE#01JA...               │ NODE             │
│ FLOW#01JX...                         │ EDGE#01JB...               │ EDGE             │
└──────────────────────────────────────┴────────────────────────────┴──────────────────┘
```

---

## 5. Access Patterns Completos

Cada access pattern descreve: qual operação DynamoDB usar, quais chaves informar, e em qual contexto é chamado.

---

### AP-01 — Buscar Account por externalId (sub do Cognito)

**Quando:** No login, após obter o `sub` do `/oauth2/userInfo`.
**Operação:** `Query` no `GSI_ExternalId`

```typescript
{
  TableName: "rivo-flow-api-prod-table",
  IndexName: "GSI_ExternalId",
  KeyConditionExpression: "GSI1PK = :externalId",
  ExpressionAttributeValues: {
    ":externalId": "108391827364519273645"  // sub do Cognito
  },
  Limit: 1
}
```

**Retorna:** item `ACCOUNT` ou vazio (usuário novo).

---

### AP-02 — Buscar Account + Profile por internalId

**Quando:** Em todo request privado, para montar contexto do usuário.
**Operação:** `BatchGetItem` (2 itens de uma vez)

```typescript
{
  RequestItems: {
    "rivo-flow-api-prod-table": {
      Keys: [
        { PK: "ACCOUNT#01JW...", SK: "ACCOUNT#METADATA" },
        { PK: "ACCOUNT#01JW...", SK: "PROFILE#METADATA"  }
      ]
    }
  }
}
```

**Alternativa simples:** 2 `GetItem` em paralelo com `Promise.all`.

---

### AP-03 — Criar usuário novo (Account + Profile + Balance)

**Quando:** Primeiro login de um usuário.
**Operação:** `TransactWriteItems` (atomicidade — os 3 ou nenhum)

```typescript
{
  TransactItems: [
    {
      Put: {
        TableName: "rivo-flow-api-prod-table",
        Item: { PK: "ACCOUNT#01JW...", SK: "ACCOUNT#METADATA", type: "ACCOUNT", ... },
        ConditionExpression: "attribute_not_exists(PK)"  // evita duplicata
      }
    },
    {
      Put: {
        TableName: "rivo-flow-api-prod-table",
        Item: { PK: "ACCOUNT#01JW...", SK: "PROFILE#METADATA", type: "PROFILE", ... }
      }
    },
    {
      Put: {
        TableName: "rivo-flow-api-prod-table",
        Item: { PK: "ACCOUNT#01JW...", SK: "BALANCE#CURRENT", type: "CREDIT_BALANCE",
                balance: 0, lifetimeDeposited: 0, lifetimeSpent: 0, updatedAt: "..." }
      }
    }
  ]
}
```

---

### AP-04 — Buscar saldo de créditos

**Quando:** Antes de enfileirar geração de imagem, e no endpoint `GET /me/balance`.
**Operação:** `GetItem`

```typescript
{
  TableName: "rivo-flow-api-prod-table",
  Key: {
    PK: "ACCOUNT#01JW...",
    SK: "BALANCE#CURRENT"
  }
}
```

---

### AP-05 — Descontar créditos (atômico, com verificação de saldo)

**Quando:** Após geração de imagem bem-sucedida.
**Operação:** `UpdateItem` com `ConditionExpression`

```typescript
{
  TableName: "rivo-flow-api-prod-table",
  Key: { PK: "ACCOUNT#01JW...", SK: "BALANCE#CURRENT" },
  UpdateExpression: `
    SET balance = balance - :amount,
        lifetimeSpent = lifetimeSpent + :amount,
        updatedAt = :now
  `,
  ConditionExpression: "balance >= :amount",  // falha se saldo insuficiente
  ExpressionAttributeValues: {
    ":amount": 35,
    ":now": "2025-01-15T14:22:00.000Z"
  }
}
```

> **Crítico:** sem o `ConditionExpression`, dois requests simultâneos poderiam descontar mais do que o saldo permite.

---

### AP-06 — Depositar créditos (transação + atualizar balance)

**Quando:** Webhook de pagamento confirmado.
**Operação:** `TransactWriteItems`

```typescript
{
  TransactItems: [
    {
      // Registra a transação de depósito
      Put: {
        TableName: "rivo-flow-api-prod-table",
        Item: {
          PK: "ACCOUNT#01JW...",
          SK: "TXN#01JX...",
          type: "CREDIT_TRANSACTION",
          transactionType: "DEPOSIT",
          credits: 500,
          amountUsd: 5.00,
          paymentId: "pi_stripe_xxx",
          createdAt: "..."
        }
      }
    },
    {
      // Incrementa o balance atomicamente
      Update: {
        TableName: "rivo-flow-api-prod-table",
        Key: { PK: "ACCOUNT#01JW...", SK: "BALANCE#CURRENT" },
        UpdateExpression: `
          SET balance = balance + :credits,
              lifetimeDeposited = lifetimeDeposited + :credits,
              updatedAt = :now
        `,
        ExpressionAttributeValues: { ":credits": 500, ":now": "..." }
      }
    }
  ]
}
```

---

### AP-07 — Listar transações do usuário (paginado)

**Quando:** `GET /me/transactions`
**Operação:** `Query` na tabela principal, com paginação via `LastEvaluatedKey`

```typescript
{
  TableName: "rivo-flow-api-prod-table",
  KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
  ExpressionAttributeValues: {
    ":pk":     "ACCOUNT#01JW...",
    ":prefix": "TXN#"
  },
  ScanIndexForward: false,  // mais recentes primeiro
  Limit: 20,
  ExclusiveStartKey: lastEvaluatedKey  // cursor de paginação (opcional)
}
```

---

### AP-08 — Salvar registro de AI Usage

**Quando:** Após geração de imagem bem-sucedida, junto com o desconto de créditos.
**Operação:** `PutItem`

```typescript
{
  TableName: "rivo-flow-api-prod-table",
  Item: {
    PK: "ACCOUNT#01JW...",
    SK: "AI_USAGE#01JX...",
    type: "AI_USAGE",
    flowId: "...", nodeId: "...", model: "...",
    inputTokens: 1680, outputTokens: 1120,
    totalCostUsd: 0.000138,
    creditsDeducted: 35,
    revenueUsd: 0.35, marginUsd: 0.3499,
    usageDate: "2025-01-15",
    createdAt: "...",
    GSI3PK: "2025-01-15",
    GSI3SK: "AI_USAGE#01JX..."
  }
}
```

---

### AP-09 — Agregar custo de AI por dia (admin/interno)

**Quando:** Dashboard interno para você ver quanto gastou na Gemini por dia.
**Operação:** `Query` no `GSI_UsageDate`

```typescript
{
  TableName: "rivo-flow-api-prod-table",
  IndexName: "GSI_UsageDate",
  KeyConditionExpression: "GSI3PK = :date",
  ExpressionAttributeValues: {
    ":date": "2025-01-15"
  }
}
// Agregar: sum(totalCostUsd), sum(revenueUsd), sum(marginUsd), count
```

---

### AP-10 — Criar Flow

**Quando:** `POST /flows`
**Operação:** `PutItem`

```typescript
{
  TableName: "rivo-flow-api-prod-table",
  Item: {
    PK: "FLOW#01JW...",
    SK: "FLOW#01JW...",
    type: "FLOW",
    id: "01JW...",
    accountId: "01JW...",           // sem prefixo ACCOUNT#
    title: "Meu Flow",
    createdAt: "...", updatedAt: "...",
    GSI2PK: "ACCOUNT#01JW...",      // com prefixo ACCOUNT#
    GSI2SK: "2025-01-16T09:00:00Z"
  }
}
```

---

### AP-11 — Listar Flows do usuário

**Quando:** `GET /flows`
**Operação:** `Query` no `GSI_Account`

```typescript
{
  TableName: "rivo-flow-api-prod-table",
  IndexName: "GSI_Account",
  KeyConditionExpression: "GSI2PK = :accountId",
  FilterExpression: "#type = :type",
  ExpressionAttributeNames: { "#type": "type" },
  ExpressionAttributeValues: {
    ":accountId": "ACCOUNT#01JW...",
    ":type": "FLOW"
  },
  ScanIndexForward: false,  // mais recentes primeiro
  Limit: 20,
  ExclusiveStartKey: lastEvaluatedKey
}
```

---

### AP-12 — Buscar Flow completo (com Nodes e Edges)

**Quando:** `GET /flows/{flowId}`
**Operação:** `Query` na tabela principal (single query — tudo no mesmo PK)

```typescript
{
  TableName: "rivo-flow-api-prod-table",
  KeyConditionExpression: "PK = :pk",
  ExpressionAttributeValues: {
    ":pk": "FLOW#01JW..."
  }
}
// Retorna: 1 item FLOW + N itens NODE + N itens EDGE
// Separar pelo campo "type"
```

---

### AP-13 — Verificar ownership do Flow (autorização)

**Quando:** Qualquer operação em Node ou Edge de um Flow.
**Operação:** `GetItem` no Flow, verificar `flow.accountId === request.accountId`

```typescript
{
  TableName: "rivo-flow-api-prod-table",
  Key: {
    PK: "FLOW#01JW...",
    SK: "FLOW#01JW..."
  },
  ProjectionExpression: "accountId"  // só precisa desse campo
}
```

---

### AP-14 — Deletar Flow com todos Nodes e Edges

**Quando:** `DELETE /flows/{flowId}`
**Operação:** `Query` para listar tudo + `BatchWriteItem` para deletar (máx 25 por batch)

```typescript
// 1. Buscar todos os items do flow
Query: { KeyConditionExpression: "PK = :pk", ... }

// 2. Deletar em batches de 25
BatchWriteItem: {
  RequestItems: {
    "table": [
      { DeleteRequest: { Key: { PK: "FLOW#...", SK: "FLOW#..." } } },
      { DeleteRequest: { Key: { PK: "FLOW#...", SK: "NODE#..." } } },
      { DeleteRequest: { Key: { PK: "FLOW#...", SK: "EDGE#..." } } },
      // ...
    ]
  }
}
```

---

## 6. Sistema de Créditos e Precificação

### Pricing

```
1 crédito = $0.01 USD
Markup sobre custo Gemini: 2.5x

Gemini (input):  $2.00 / 1M tokens
Gemini (output): $120.00 / 1M tokens

Tokens por item:
  - Imagem de entrada (IMAGE node): 560 tokens fixos
  - Imagem gerada 1K: 1.120 tokens output
  - Imagem gerada 2K: 1.120 tokens output
  - Imagem gerada 4K: 2.000 tokens output
```

### Fórmula de cálculo

```
inputTokens  = promptTokens + (qtd_imagens × 560)
outputTokens = tokens_qualidade[quality]

custo_gemini = (inputTokens / 1M × $2) + (outputTokens / 1M × $120)
total_com_markup = custo_gemini × 2.5
créditos = ceil(total_com_markup / $0.01)
```

### Exemplo prático

```
Geração: 1 imagem de entrada + 1 prompt + qualidade 2K

inputTokens  = 150 (prompt) + 1 × 560 = 710 tokens
outputTokens = 1.120 tokens

custo_input   = 710 / 1.000.000 × $2    = $0.00000142
custo_output  = 1120 / 1.000.000 × $120 = $0.0001344
total_gemini  = $0.00013582
com_markup    = $0.00013582 × 2.5 = $0.00033955
créditos      = ceil(0.00033955 / 0.01) = 1 crédito

→ Custo para você: $0.00013582
→ Receita:         1 × $0.01 = $0.01
→ Margem:          $0.00986418 (~7000% markup efetivo)
```

---

## 7. Fluxo de Geração de Imagem

```
Frontend                    API (Lambda HTTP)           SQS           Lambda SQS Consumer
    │                            │                        │                    │
    │ 1. Monta o flow no canvas  │                        │                    │
    │    (nodes + edges)         │                        │                    │
    │                            │                        │                    │
    │── GET /flows/{id}/nodes    │                        │                    │
    │      /{nodeId}/calc-cred ─▶│                        │                    │
    │◀─ { creditsRequired: 35 } ─│                        │                    │
    │                            │                        │                    │
    │── POST /flows/{id}/nodes   │                        │                    │
    │      /{nodeId}/gen-image ─▶│                        │                    │
    │                            │ verifica saldo ≥ 35    │                    │
    │                            │ muda status → QUEUED   │                    │
    │                            │── SendMessage ─────────▶│                    │
    │                            │   { flowId, nodeId,    │                    │
    │                            │     inputs, accountId }│                    │
    │◀─ 200 { status: queued } ──│                        │                    │
    │                            │                        │                    │
    │ (polling frontend)         │                        │── receive ────────▶│
    │                            │                        │   message          │
    │                            │                        │                    │ muda status → PROCESSING
    │                            │                        │                    │ chama Gemini API
    │                            │                        │                    │ salva imagem no S3
    │                            │                        │                    │ cria/atualiza RESULT_IMAGE node
    │                            │                        │                    │ muda status → COMPLETED
    │                            │                        │                    │ desconta créditos (atômico)
    │                            │                        │                    │ salva AI_USAGE
    │                            │                        │                    │── deleteMessage ──▶│
    │                            │                        │                    │
    │── GET /flows/{id} ────────▶│                        │                    │
    │◀─ { flow com RESULT node } │                        │                    │
    │   (imagem via CloudFront)  │                        │                    │
```

### Retentativas SQS

```
Tentativa 1 → falha → SQS libera após 360s → Tentativa 2
Tentativa 2 → falha → SQS libera após 360s → Tentativa 3
Tentativa 3 → falha → mensagem vai para DLQ (retida 14 dias)
              status do node = FAILED
```

---

## 8. Endpoints da API

### Existentes

| Método | Path | Auth | Status |
|--------|------|------|--------|
| POST | `/auth/exchange-code` | público | ✅ funciona |
| POST | `/flows` | privado | ⚠️ sem accountId |
| GET | `/flows/{flowId}` | privado | ⚠️ sem authz ownership |
| POST | `/flows/{flowId}/nodes` | privado | ✅ |
| PUT | `/flows/{flowId}/nodes/{nodeId}` | privado | ✅ |
| DELETE | `/flows/{flowId}/nodes/{nodeId}` | privado | ✅ |
| POST | `/flows/{flowId}/nodes/{nodeId}/upload` | privado | ✅ |
| PATCH | `/flows/{flowId}/nodes/{nodeId}/confirm-upload` | privado | ✅ |
| POST | `/flows/{flowId}/nodes/{nodeId}/generate-image` | privado | ⚠️ sem check saldo |
| GET | `/flows/{flowId}/nodes/{nodeId}/calculate-credits` | privado | ✅ |
| POST | `/flows/{flowId}/edges` | privado | ✅ |
| DELETE | `/flows/{flowId}/edges/{edgeId}` | privado | ✅ |

### A criar

| Método | Path | Auth | Prioridade |
|--------|------|------|-----------|
| POST | `/auth/refresh` | público (cookie) | 🔴 crítico |
| GET | `/me` | privado | 🔴 crítico |
| GET | `/me/balance` | privado | 🔴 crítico |
| GET | `/me/transactions` | privado | 🟠 importante |
| GET | `/flows` | privado | 🟠 importante |
| DELETE | `/flows/{flowId}` | privado | 🟡 relevante |
| PUT | `/flows/{flowId}` | privado | 🟡 relevante |

---

## 9. Arquitetura de Código

### Estrutura de pastas

```
src/
├── application/
│   ├── contracts/
│   │   ├── abstracts/
│   │   │   ├── base.entity.ts       ← id (KSUID), createdAt, updatedAt
│   │   │   └── base-controller.ts   ← execute(request) → response
│   │   └── interfaces/
│   │       └── i-use-case.ts
│   ├── entities/                    ← domínio puro, sem framework
│   │   ├── flow.entity.ts
│   │   ├── node.entity.ts
│   │   └── edge.entity.ts
│   │   [FALTAM: account, profile, credit-balance, credit-transaction, ai-usage]
│   ├── use-cases/
│   │   ├── auth/
│   │   │   └── exchange-code.use-case.ts
│   │   │   [FALTAM: sign-in-or-register, refresh-token]
│   │   ├── flows/
│   │   │   ├── create-flow.use-case.ts
│   │   │   └── get-flow-by-id.use-case.ts
│   │   │   [FALTAM: list-flows, delete-flow]
│   │   ├── nodes/             ← completo
│   │   └── edges/             ← completo
│   │   [FALTAM: use-cases/me/, use-cases/credits/]
│   ├── controllers/           ← thin layer: valida schema, chama use-case
│   ├── errors/
│   ├── factories/
│   ├── strategies/
│   └── types/
│
├── infra/
│   ├── clients/
│   │   └── dynamoClient.ts    ← singleton do DynamoDB DocumentClient
│   ├── database/dynamo/
│   │   ├── items/             ← mapeadores Entity ↔ DynamoDB item
│   │   │   ├── flow.item.ts
│   │   │   ├── node.item.ts
│   │   │   └── edge.item.ts
│   │   │   [FALTAM: account, profile, credit-balance, credit-transaction, ai-usage]
│   │   └── repositories/      ← operações DynamoDB
│   │       ├── flow-dynamo.repository.ts
│   │       ├── node-dynamo.repository.ts
│   │       └── edge-dynamo.repository.ts
│   │       [FALTAM: account-dynamo, credit-dynamo, ai-usage-dynamo]
│   └── gateways/
│       ├── ai/
│       │   └── image-ai.gateway.ts  ← Gemini API
│       └── aws/
│           └── auth.gateway.ts      ← Cognito OAuth
│           [FALTAM: auth.gateway.getUserInfo()]
│
├── kernel/
│   └── di/
│       └── registry.ts        ← DI container manual com @Injectable()
│
├── main/
│   ├── adapters/
│   │   ├── lambda-http-adapter.ts   ← HTTP request → controller
│   │   └── lambda-sqs-adapter.ts    ← SQS message → controller
│   ├── functions/             ← entry points das Lambdas
│   └── utils/
│
├── shared/
│   ├── config/
│   │   ├── app.config.ts      ← singleton de configuração
│   │   ├── env.ts             ← validação das env vars com Zod
│   │   ├── credit-pricing.ts  ← $0.01/crédito, markup 2.5x
│   │   └── gemini-pricing.ts  ← tokens e preços por qualidade
│   └── utils/
│       └── credit-calculator.ts
│
└── sls/                       ← Serverless Framework configs
    ├── functions/             ← definição das Lambdas + rotas
    ├── resources/             ← CloudFormation (DynamoDB, S3, SQS, etc.)
    └── provider/              ← IAM, env vars
```

### Padrões de código

**DI Container**
```typescript
@Injectable()
class MeuUseCase {
  constructor(
    private readonly repo: MeuRepository,  // injetado automaticamente
    private readonly appConfig: AppConfig,
  ) {}
}
```

**Item mapper (Entity ↔ DynamoDB)**
```typescript
class MeuItem {
  static fromEntity(entity: MeuEntity): MeuItem { ... }  // Entity → Item
  static toEntity(item: MeuItem.Item): MeuEntity { ... }  // Item → Entity
  toItem(): MeuItem.Item { ... }                          // Item → DynamoDB object
}
```

**Controller**
```typescript
// BaseController<'private'> → recebe accountId no request
// BaseController<'public'>  → accountId é null
class MeuController extends BaseController<'private'> {
  async execute(request) {
    const schema = z.object({ ... })
    const validated = schema.parse(request.body)
    const result = await this.useCase.execute({ ...validated, accountId: request.accountId })
    return { statusCode: 200, body: result }
  }
}
```

---

## 10. O que está faltando — Crítico ao Simples

### 🔴 CRÍTICO

**C1 — `internalAccountId` no JWT não existe**
O adapter extrai `event.requestContext.authorizer.jwt.claims.internalAccountId` mas o Cognito emite `sub`, não esse campo. Todas as rotas privadas recebem `accountId = undefined` silenciosamente.
**Fix:** extrair `sub` do JWT → buscar Account via `GSI_ExternalId` → passar `internalId`.

**C2 — Usuário não é criado no banco ao fazer login**
O `ExchangeCodeUseCase` troca o code mas nunca verifica/cria o usuário.
**Fix:** criar `SignInOrRegisterUseCase` chamado após o exchange.

**C3 — GSIs não existem no CloudFormation**
O `dynamo.yml` só tem PK+SK. Sem os GSIs você não consegue buscar Account por `sub` nem listar Flows por usuário.
**Fix:** adicionar `GSI_ExternalId`, `GSI_Account`, `GSI_UsageDate` no `dynamo.yml`.

**C4 — Flow não tem `accountId`**
Qualquer usuário autenticado pode acessar o Flow de qualquer outro usuário.
**Fix:** salvar `accountId` no FlowItem e validar ownership nos use cases.

---

### 🟠 IMPORTANTE

**I1 — Créditos não são descontados após geração**
O `ProcessImageAIUseCase` completa a geração mas nunca toca no saldo.

**I2 — AI Usage não é registrado**
Você não tem como saber seu custo real na Gemini.

**I3 — Verificação de saldo antes de enfileirar**
O `CreateImageAIUseCase` não checa se o usuário tem créditos antes de publicar na SQS.

**I4 — Payload SQS não tem `accountId`**
O consumer SQS não sabe de qual usuário é o job, impossibilitando o desconto de créditos.

**I5 — Refresh token sem endpoint**
Access token expira em 15 minutos. Sem endpoint de refresh, o usuário vai receber 401 e precisar logar novamente.

---

### 🟡 RELEVANTE

**R1 — Sem listagem de Flows** (`GET /flows`)
**R2 — Sem delete de Flow** (`DELETE /flows/{flowId}`)
**R3 — Sem endpoints de usuário** (`GET /me`, `GET /me/balance`, `GET /me/transactions`)
**R4 — `findFlowAndNodesAndEdgesById` não trata flow inexistente** (retorna TypeError em vez de null)

---

### 🟢 SIMPLES

**S1 — Typo:** `signWIthGoogle` → `signWithGoogle` em `auth.gateway.ts`
**S2 — Nome errado:** `nanobananaApiKey` → `geminiApiKey` em `AppConfig`
**S3 — Arquivo com nome errado:** `calculateCreditsNodeGenerator.ts` → `calculate-credits-node-generator.ts`
**S4 — `lambdaBodyParse` sem try/catch** para JSON malformado
**S5 — Sem logging estruturado** nos use cases (dificulta debug no CloudWatch)

---

## 11. Roadmap de Implementação MVP

```
┌─ Sprint 1: Fundação de usuário (crítico) ────────────────────────────────────┐
│  1. Adicionar GSI_ExternalId + GSI_Account + GSI_UsageDate ao dynamo.yml     │
│  2. AccountEntity + AccountItem + AccountDynamoRepository                     │
│  3. ProfileEntity + ProfileItem                                               │
│  4. CreditBalanceEntity + CreditBalanceItem                                   │
│  5. AuthGateway.getUserInfo() → chama /oauth2/userInfo do Cognito             │
│  6. SignInOrRegisterUseCase                                                   │
│  7. Atualizar ExchangeCodeUseCase → chamar SignInOrRegister                   │
│  8. Corrigir lambda-http-adapter → extrair sub → buscar internalId            │
│  9. Atualizar FlowEntity + FlowItem → adicionar accountId                     │
│  10. Atualizar CreateFlowUseCase → receber e salvar accountId                 │
│  11. Adicionar ownership check no GetFlowByIdUseCase                         │
└───────────────────────────────────────────────────────────────────────────────┘

┌─ Sprint 2: Sistema de créditos ──────────────────────────────────────────────┐
│  12. CreditTransactionEntity + CreditTransactionItem                          │
│  13. AiUsageEntity + AiUsageItem                                              │
│  14. CreditDynamoRepository (getBalance, deductCredits atômico, deposit)      │
│  15. AiUsageDynamoRepository (save, listByAccount)                            │
│  16. Atualizar payload SQS → incluir accountId                                │
│  17. Atualizar CreateImageAIUseCase → verificar saldo antes de enfileirar     │
│  18. Atualizar ProcessImageAIUseCase → descontar créditos + salvar AiUsage    │
│  19. DeductCreditsUseCase (interno, chamado pelo ProcessImageAI)              │
└───────────────────────────────────────────────────────────────────────────────┘

┌─ Sprint 3: Endpoints de usuário e fluxo completo ────────────────────────────┐
│  20. POST /auth/refresh → RefreshTokenUseCase + Controller                    │
│  21. GET  /me           → GetMeUseCase + Controller                           │
│  22. GET  /me/balance   → GetCreditBalanceUseCase + Controller                │
│  23. GET  /me/transactions → ListTransactionsUseCase + Controller (paginado)  │
│  24. GET  /flows        → ListFlowsUseCase + Controller (paginado)            │
│  25. DELETE /flows/{id} → DeleteFlowUseCase + Controller (batch delete)       │
└───────────────────────────────────────────────────────────────────────────────┘

┌─ Sprint 4: Qualidade e correções ────────────────────────────────────────────┐
│  26. Fix null guard no findFlowAndNodesAndEdgesById                           │
│  27. Renomear signWIthGoogle, nanobananaApiKey, arquivo calculateCredits       │
│  28. Adicionar logging estruturado nos use cases críticos                     │
│  29. Fix lambdaBodyParse → try/catch para JSON inválido                       │
│  30. Adicionar IAM permissions para os novos GSIs                             │
└───────────────────────────────────────────────────────────────────────────────┘
```
