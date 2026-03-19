# MoneyTracker Product And API Plan

## 1. UI content to display

The dashboard should focus on operational money tracking instead of only charts.

- Overview cards: balance, income, expense, savings rate
- Wallet summary: active wallet, currency, latest activity, top categories
- Records feed: latest transactions, grouped daily timeline, quick add
- Category insights: top spending categories, category trend change, inactive categories
- Planning widgets for future: budgets, recurring payments, alerts, goals

## 2. Wallet screen improvements

Wallet cards should show more than the balance.

- Balance
- Record count
- Top 3 used categories
- Last activity date
- Future-ready actions: edit, archive, connect budgets

## 3. Voice command direction

Recommended approach for the web client:

1. Use the browser SpeechRecognition API with a typed command parser.
2. Add a command bar state manager in the client.
3. Map spoken phrases into intent objects.
4. Confirm destructive actions before sending mutations.

Suggested first commands:

- "add expense 250 food"
- "add income 5000 salary"
- "open wallets"
- "show charts"
- "switch to wallet cash"
- "create wallet travel in usd"

Suggested implementation structure:

- `Client/src/features/voice/useVoiceCommands.ts`
- `Client/src/features/voice/commandRegistry.ts`
- `Client/src/features/voice/intentHandlers.ts`

## 4. API documentation

The backend already exposes Swagger in non-production mode.

- Swagger UI: `http://localhost:5000/api`
- Base API prefix: `http://localhost:5000/api/v1`

Core endpoints to document clearly:

- Auth
- Users
- Wallets
- Categories
- Records

Each endpoint doc should include:

- Request body
- Response shape
- Auth requirements
- Error responses

## 5. Frontend API management

The frontend should keep API access behind a small data layer.

Current baseline implemented:

- Central Axios instance in `Client/src/apis/index.ts`
- Automatic bearer token injection from session storage

Recommended next structure:

- `Client/src/apis/client.ts`: axios instance, interceptors, error mapping
- `Client/src/apis/endpoints.ts`: endpoint constants
- `Client/src/apis/*.ts`: domain modules for wallets, records, categories, auth
- React Query keys centralized in `Client/src/apis/queryKeys.ts`

Recommended query keys:

- `['wallets', userId]`
- `['records', walletId]`
- `['categories']`
- `['user', userId]`
- `['remarks', categoryId]`

## 6. Immediate backlog

Priority order:

1. Stabilize first-wallet onboarding
2. Refresh wallet and record queries consistently
3. Reduce chart footprint and improve mobile readability
4. Add wallet-level category summaries
5. Introduce centralized query keys
6. Add voice command MVP
