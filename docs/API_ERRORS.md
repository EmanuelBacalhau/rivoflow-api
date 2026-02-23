# Guia de Tratamento de Erros da API

Este documento detalha o padrão de respostas de erro da nossa API (`rivo-flow-api`) e fornece orientações sobre como o front-end pode tratá-los de forma eficaz.

## Estrutura da Resposta de Erro

Sempre que a API retornar um erro (status HTTP `4xx` ou `5xx`), o corpo da resposta (`body`) seguirá o seguinte formato JSON:

```json
{
  "error": {
    "code": "STRING_DO_CODIGO_DE_ERRO",
    "message": "Mensagem detalhando o erro (pode ser uma string ou um array em caso de validação)"
  }
}
```

- **`code`**: Um identificador único e padronizado do erro. Você deve usar esse campo no front-end para tomar decisões (ex: exibir uma mensagem específica, redirecionar o usuário).
- **`message`**: A descrição legível por humanos sobre o erro ocorrido. Útil para log ou exibição de mensagens genéricas.

---

## Códigos de Erro (`error.code`)

Abaixo estão todos os possíveis códigos de erro retornados pela API, seus status HTTP comuns e os cenários em que ocorrem.

### 1. Erros de Autenticação e Autorização
Normalmente retornam status **401 (Unauthorized)** ou **403 (Forbidden)**.

| Code           | HTTP | Descrição | Sugestão de Tratativa no Front-end |
|----------------|:----:|-----------|-------------------------------------|
| `UNAUTHORIZED` | 401  | O usuário não está autenticado ou o token é inválido/expirado. Conta pode não ter sido encontrada. | Limpar dados de sessão local e redirecionar para a página de `/login`. |
| `FORBIDDEN`    | 403  | O usuário está autenticado, mas não tem permissão para acessar o recurso. | Exibir mensagem informando que o acesso é negado ou redirecionar para local seguro. |

### 2. Erros de Validação (Payload Inválido)
Sempre retorna status **400 (Bad Request)** e ocorre quando os dados enviados para a API estão incorretos ou faltando.

| Code               | HTTP | Descrição |
|--------------------|:----:|-----------|
| `VALIDATION_ERROR` | 400  | Os dados enviados no corpo (`body`), rota (`params`) ou query (`query`) falharam na validação. |

**Formato específico do `message` para `VALIDATION_ERROR`:**
Neste caso, a `message` não é uma *string*, mas sim um *Array* contendo os detalhes dos campos inválidos:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": [
      {
        "path": "email",
        "message": "Invalid email format"
      },
      {
        "path": "password",
        "message": "String must contain at least 6 character(s)"
      }
    ]
  }
}
```
*Sugestão:* Use este array para destacar visualmente no formulário quais campos estão com erro.

### 3. Erros de Recursos (Business Logic)
Normalmente retornam status **404 (Not Found)** ou **400/422**.

| Code | HTTP | Descrição |
|---|:---:|---|
| `RESOURCE_NOT_FOUND` | 404 | O recurso que você tentou acessar, atualizar ou deletar não existe. |
| `INVALID_NODE_TYPE` | 400 | Um tipo de nó inválido foi enviado ao tentar criar/atualizar um Flow. |
| `NODE_ALREADY_PROCESSING` | 400 / 409 | Ação bloqueada pois o nó selecionado já está em processamento no momento. |
| `NODE_ALREADY_PROCESSED` | 400 / 409 | O nó que foi solicitado para processamento já concluiu esta etapa e não pode ser re-processado. |
| `NO_FILE_UPLOADED` | 400 | A rota exigia o upload de um arquivo atrelado ao nó, mas nenhum arquivo foi recebido válido. |

### 4. Erros de Infraestrutura e Servidor
Erros geralmente atrelados ao status **500 (Internal Server Error)** ou falhas na comunicação com APIs externas.

| Code | HTTP | Descrição | Sugestão de Tratativa |
|---|:---:|---|---|
| `EXTERNAL_SERVICE_ERROR` | 500 / 502 | A nossa API tentou se comunicar com um serviço externo (AI, Pagamento, etc.) mas o serviço falhou. | Exibir mensagem ("O serviço está instável, tente novamente mais tarde.") |
| `INTERNAL_SERVER_ERROR` | 500 | Um erro inesperado aconteceu nos nossos servidores (Crash). | Exibir mensagem de erro genérica ("Ops, ocorreu um erro inesperado em nossos servidores.") |

---

## Exemplo de Tratativa Global com Axios

Uma boa prática no Front-end é centralizar o tratamento de erros no seu client HTTP (como um *interceptor* do Axios).

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://sua-api.com',
});

api.interceptors.response.use(
  (response) => {
    // Retorna a resposta se for sucesso (2xx)
    return response;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const errorCode = error.response.data?.error?.code;
      const errorMessage = error.response.data?.error?.message;

      // 1. Tratar deslogamento automático (Token Inválido)
      if (status === 401 || errorCode === 'UNAUTHORIZED') {
        console.warn('Sessão expirada. Deslogando usuário...');
        // Função do seu app para limpar cache (localStorage, cookies) e redirecionar pra /login
        // signOutAndRedirectToLogin();
      }

      // 2. Erros de Validação em Formulários
      if (errorCode === 'VALIDATION_ERROR') {
        // 'errorMessage' é um Array contendo { path, message }
        console.error('Campos inválidos:', errorMessage);
        // Você pode disparar um evento para injetar esses erros no seu Form (React Hook Form, Formik, etc)
      }

      // 3. Tratamento genérico de notificação com Toast/Snackbar
      // Exibe a mensagem de erro fornecida pela API se ela for uma string (ou define uma mensagem default se for array/indisponível)
      if (typeof errorMessage === 'string') {
        // toast.error(errorMessage);
        console.error(`Erro na API [${errorCode}]:`, errorMessage);
      }
    } else if (error.request) {
      // Erro de rede (Usuário sem internet ou servidor caiu completamente)
      // toast.error('Falha de conexão. Verifique sua rede e tente novamente.');
    }

    // Rejeita a promessa para que a requisição original também entre no catch
    return Promise.reject(error);
  }
);

export default api;
```
