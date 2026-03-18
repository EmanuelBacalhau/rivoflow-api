# Sistema de Planos Mensais com Créditos

## Contexto

Hoje o `AccountBalance` tem apenas `balance`, `lifetimeDeposited` e `lifetimeSpent`. Queremos implementar planos mensais onde:

- Créditos do plano **expiram** no fim do mês (não acumulam)
- Cliente pode **comprar créditos extras** (não expiram)
- Plano atribuído via **pagamento recorrente**
- Frontend precisa mostrar **% de uso do plano**

---

## Modelo de Dados

### Nova entidade: `SubscriptionEntity`

Armazena a assinatura do usuário.

**DynamoDB keys:**
- `PK: ACCOUNT#{accountId}`
- `SK: SUBSCRIPTION#{subscriptionId}`

**Campos:**

| Campo | Tipo | Descrição |
|---|---|---|
| `accountId` | string | ID da conta |
| `planType` | string | Tipo do plano (ex: FREE, BASIC, PRO) |
| `planCredits` | number | Créditos mensais do plano (ex: 500) |
| `status` | enum | ACTIVE, CANCELLED, PAST_DUE, EXPIRED |
| `currentPeriodStart` | Date | Início do período atual |
| `currentPeriodEnd` | Date | Fim do período atual |
| `externalSubscriptionId` | string | ID da assinatura no gateway de pagamento |

### Alteração: `AccountBalanceEntity`

Separar o balance em dois pools:

| Antes | Depois |
|---|---|
| `balance` | **REMOVER** (vira campo computado) |
| — | `planCreditsUsed` (créditos do plano usados no período) |
| — | `extraCredits` (créditos comprados avulso, nunca expiram) |
| `lifetimeDeposited` | mantém |
| `lifetimeSpent` | mantém |

---

## Cálculos

### Créditos disponíveis (computado)

```
availableCredits = (subscription.planCredits - planCreditsUsed) + extraCredits
```

### % usado do plano

```
usagePercent = (planCreditsUsed / subscription.planCredits) * 100
```

### Exemplo

- Plano: 500 créditos/mês
- Usou 200 do plano
- Comprou 100 extras

```
availableCredits = (500 - 200) + 100 = 400
usagePercent = (200 / 500) * 100 = 40%
```

---

## Lógica de Consumo (Débito)

Ordem de prioridade ao gastar créditos:

1. Primeiro consome créditos do **plano** (expiram, usar primeiro)
2. Depois consome créditos **extras** (não expiram)

```
function debit(amount):
  planRemaining = subscription.planCredits - planCreditsUsed

  if amount <= planRemaining:
    planCreditsUsed += amount
  else:
    planCreditsUsed = subscription.planCredits  // esgota plano
    extraCredits -= (amount - planRemaining)    // resto do extra

  lifetimeSpent += amount
```

---

## Lógica de Crédito (Compra Avulsa)

Compras avulsas vão direto pra `extraCredits`:

```
extraCredits += creditsPurchased
lifetimeDeposited += creditsPurchased
```

---

## Reset Mensal

Quando o gateway notifica renovação do período:

```
planCreditsUsed = 0
currentPeriodStart = nova data
currentPeriodEnd = nova data + 1 mês
```

Créditos do plano não usados simplesmente expiram (`planCreditsUsed` volta a 0).

---

## Resposta do GET /account/me

```json
{
  "account": {
    "id": "...",
    "email": "...",
    "firstName": "...",
    "lastName": "...",
    "picture": "...",
    "isActive": true
  },
  "balance": {
    "availableCredits": 350,
    "extraCredits": 100,
    "lifetimeDeposited": 500,
    "lifetimeSpent": 250
  },
  "subscription": {
    "planType": "BASIC",
    "planCredits": 500,
    "planCreditsUsed": 250,
    "usagePercent": 50,
    "status": "ACTIVE",
    "currentPeriodEnd": "2026-04-17T00:00:00Z"
  }
}
```

---

## Arquivos a Criar

| Arquivo | Descrição |
|---|---|
| `src/application/entities/subscription.entity.ts` | Nova entidade |
| `src/application/entities/subscription-enums.ts` | Enums (SubscriptionStatus) |
| `src/infra/database/dynamo/items/subscription.item.ts` | DynamoDB item mapper |
| `src/infra/database/dynamo/repositories/subscription-dynamo.repository.ts` | Repository |
| `src/application/use-cases/subscriptions/create-subscription.use-case.ts` | Criar assinatura via webhook |
| `src/application/use-cases/subscriptions/renew-subscription.use-case.ts` | Renovar (reset mensal) |
| `src/application/use-cases/subscriptions/cancel-subscription.use-case.ts` | Cancelar assinatura |
| `src/application/controllers/subscriptions/` | Controllers correspondentes |
| `src/main/functions/subscriptions/` | Lambda handlers |

## Arquivos a Modificar

| Arquivo | O que muda |
|---|---|
| `src/application/entities/account-balance.entity.ts` | Remover `balance`, adicionar `planCreditsUsed` + `extraCredits` |
| `src/infra/database/dynamo/items/account-balance.item.ts` | Atualizar mapper com novos campos |
| `src/application/services/credit-debit.service.ts` | Lógica de débito com prioridade (plano → extras) |
| `src/application/use-cases/payments/webhook-charge.use-case.ts` | Compra avulsa → `extraCredits` |
| `src/application/use-cases/nodes/create-image-ai.use-case.ts` | Validação de saldo com `availableCredits` |
| `src/application/use-cases/account/get-me.use-case.ts` | Retornar subscription + % uso |
| `src/infra/database/dynamo/repositories/account-dynamo.repository.ts` | Carregar subscription junto |
| `src/application/entities/account.entity.ts` | Adicionar `subscription` opcional |
| `src/infra/database/dynamo/uows/create-account.uow.ts` | Novos campos no balance |
| `src/application/use-cases/account/create-account.use-case.ts` | Ajustar criação do balance |
| `serverless.ts` | Novos endpoints de webhook de assinatura |

---

## Ordem de Implementação

1. Criar `SubscriptionEntity` + enums + item + repository
2. Alterar `AccountBalanceEntity` (`balance` → `planCreditsUsed` + `extraCredits`)
3. Atualizar `AccountBalanceItem` mapper
4. Atualizar `CreditDebitService` com lógica de prioridade
5. Atualizar `WebhookChargeUseCase` (compra avulsa → `extraCredits`)
6. Atualizar `CreateAccountUseCase` e UoW (novos campos)
7. Atualizar `GetMeUseCase` (retornar subscription + % uso)
8. Atualizar `CreateImageAIUseCase` (validação de saldo)
9. Criar use cases de subscription (create, renew, cancel)
10. Criar controllers + handlers + endpoints no serverless.ts

---

## Verificação

- [ ] Criar conta nova → balance com `planCreditsUsed: 0`, `extraCredits: 0`
- [ ] Comprar créditos avulsos → `extraCredits` incrementa
- [ ] Atribuir plano → subscription criada com `planCredits`
- [ ] Gerar imagem → debita primeiro do plano, depois extras
- [ ] `GET /account/me` → retorna % uso correto
- [ ] Renovação mensal → `planCreditsUsed` reseta pra 0
