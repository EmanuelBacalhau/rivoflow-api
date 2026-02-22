# Como Funciona o Cálculo de Créditos no Orion Flow API

Este documento explica de forma detalhada e simplificada como a nossa plataforma converte o uso do Google Gemini (cobrado em Dólares - USD) para o saldo de **Créditos** que o usuário final utiliza (que ele comprará em Real - BRL).

---

## 🌎 O Conceito Base: Por que usar "Créditos"?

Como moramos no Brasil e o usuário nos paga em Real (R$), mas a Google nos cobra em Dólar (US$), criar uma "Moeda de Crédito" dentro do sistema blinda o banco de dados contra flutuações bruscas de câmbio durante o uso picotado da plataforma.

A regra de ouro que estipulamos no sistema (em `src/shared/config/credit-pricing.ts`) é que:
**1 Crédito da Plataforma = US$ 0.01 Custo (Em Dólar)**.

Isso significa que o banco de dados armazena o consumo como uma ficha de fliperama. Nós compramos as fichas em Reais no checkout, e na hora de gastar, a máquina desconta fichas.

### Exemplo de Compra (BRL para Créditos)

Se você decidir que vai vender pacotes cobrando, por exemplo:
- **US$ 1.00 = R$ 5.50 (Custo Fixo de Câmbio Estipulado)**
- Para comprar **1000 Créditos** (que equivalem a US$ 10.00 de poder de fogo no backend):
- O Checkout da sua plataforma (Stripe/MercadoPago) pode cobrar do Brasileiro: **US$ 10.00 * 5.5 = R$ 55,00**.

Quando ele pagar **R$ 55,00**, o balance dele sobe para **1000 Créditos** de saldo. 

---

## 🧮 A Matemática da Geração de Imagem

Sempre que a geração de imagem é finalizada, usamos a função `calculateExactCreditsFromUsage` para saber quantos tokens ele realmente usou do modelo `Gemini 3 Pro`. A Google cobra em **Frações de Milhões de Tokens**, então a matemática é a seguinte:

### 1. Preços da Tabela Google (Em Dólares)
- **Input (Prompt + Imagens Enviadas):** $2.00 por Milhão de tokens.` (Preço atual: $0.000002 / token)`
- **Output de Imagens Geradas:** $120.00 por Milhão de tokens.` (Preço atual: $0.000120 / token)`
- **Output de Textos/Pensamentos:** $12.00 por Milhão de tokens.` (Preço atual: $0.000012 / token)`

### 2. Passo a Passo do Cálculo na API

Imagine a seguinte simulação real onde a resposta do Google nos devolveu este log final no `process-image-ai`:
- Prompt do usuário: 300 tokens de Input.
- A imagem gerada final pela Google teve 1120 tokens.
- O Google gastou para pensar: 150 tokens.

**PASSO A (Achar o Custo em Dólar de Cada Fase):**
- Custo do Input = `(300 / 1.000.000) * 2.00` = **US$ 0.0006**
- Custo da Imagem Gerada = `(1120 / 1.000.000) * 120.00` = **US$ 0.1344**
- Custo do Texto Pensado = `(150 / 1.000.000) * 12.00` = **US$ 0.0018**

`CUSTO TOTAL NO GOOGLE` = **US$ 0.1368**

**PASSO B (O Markup Mágico de Lucratividade):**
Nós nunca cobramos apenas o custo seco, pois senão a empresa não dá lucro e nem paga a infra.
Na nossa configuração `markupMultiplier` está configurado para `2.5x` (lucro bruto isolado na geração).

`CUSTO DE REVENDA` = `0.1368 * 2.5` = **US$ 0.342**

**PASSO C (Converter para Créditos):**
Se cada crédito nosso vale US$ 0.01:
Créditos Cobrados = `US$ 0.342 / 0.01` = **34.2 Créditos**. *(Nós arredondamos para cima com `Math.ceil` para cobrir poeira de decimal)*.
**Créditos Cobrados Finais: 35 Créditos.**

O sistema então vai no DynamoDB e debita cirurgicamente 35 Créditos do Saldo do Usuário!

---

## 🛡 O Buffer da "Estimativa Pré-Geração"

A Google cobra os **Pensamentos (*Thoughts*)**, que variam com a complexidade do prompt antes de ser enviado. Por isso nós desenhamos um limite preventivo na chamada `calculate-credits-node-generator` para quem vai mostrar o preço na Tela (Estimativa pré-click) ou validar o saldo inicial, para o usuário não ficar com saldo negativo!

A regra baseada em segurança: `Estimativa de Pensamentos = Tokens do Prompt * 3`.
Aviso de saldo exigido vai calcular isso e jogar na tela. O usuário terá que ter aqueles ~38 Créditos na conta para rodar, sabendo que quando completar a geração ele pode reter o resíduo e sobrar crédito no bolso pois apenas o estritamente real (como os 35 da nossa simulação) foi debitado!
