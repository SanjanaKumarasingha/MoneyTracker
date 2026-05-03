# Codex Progress Log

## 2026-03-16

### Issue 1 Fix Session
- Focus: `9/10` Broken authorization boundaries in backend routes.
- Goal: stop authenticated users from reading or changing another user's `user`, `category`, `wallet`, or `record` data by guessing ids.

### What We Fixed
- Added ownership-aware lookups in backend services:
  - `CategoriesService.findOneForUser(id, userId)`
  - `WalletsService.findOneForUser(id, userId)`
  - `RecordsService.findOneForUser(id, userId)`
- Updated protected controllers so they no longer trust route/body ids by themselves:
  - `users` routes now require `req.user.id` to match the route `:id`
  - `categories` routes now require the category to belong to `req.user.id`
  - `wallets` routes now require the wallet to belong to `req.user.id`
  - `records` routes now require the record, wallet, and category to belong to `req.user.id`

### Step By Step Learning Notes
1. Start with the risk, not the code.
   Why: the bug was not "a controller is wrong", it was "ownership is not enforced". That gives you a rule to check everywhere: every protected route must answer "does this resource belong to the logged-in user?"

2. Trace how ownership exists in the data model.
   Why: authorization should follow real relations, not assumptions.
   In this project:
   - `Category -> User`
   - `Wallet -> User`
   - `Record -> Wallet -> User`

3. Move the ownership check close to data access.
   Why: `findOne(id)` only proves existence. We needed queries that prove both existence and ownership.
   Better pattern:
   - bad: `findOne(id)` then update/delete
   - better: `findOneForUser(id, req.user.id)` then update/delete

4. Make controllers compare request identity against resource identity.
   Why: route params like `/users/2` are user input and cannot be trusted. The trusted identity is `req.user.id`, because it comes from the JWT guard.

5. Test the security rule directly.
   Why: for auth bugs, the important test is not only "happy path works", but "cross-user access is rejected".
   Added controller tests that now fail if:
   - one user reads another user profile
   - one user reads/deletes another user's category
   - one user updates/deletes another user's wallet
   - one user creates or reads another user's record

### What You Should Learn From This
- Authentication answers: "who is making the request?"
- Authorization answers: "is this user allowed to access this exact resource?"
- If code only checks `id exists`, that is not authorization.
- A strong habit: for every protected route, identify:
  - trusted identity: usually `req.user.id`
  - target resource: route/body id
  - ownership rule: how the resource links back to the user

### Verification
- Ran targeted backend tests on `2026-03-16`:
  - `npm test -- --runInBand users.controller.spec.ts categories.controller.spec.ts wallets.controller.spec.ts records.controller.spec.ts`
- Result: `4` suites passed, `8` tests passed.

### Files Changed For This Fix
- `Server/src/users/users.controller.ts`
- `Server/src/categories/categories.controller.ts`
- `Server/src/wallets/wallets.controller.ts`
- `Server/src/records/records.controller.ts`
- `Server/src/categories/categories.service.ts`
- `Server/src/wallets/wallets.service.ts`
- `Server/src/records/records.service.ts`
- `Server/src/users/users.controller.spec.ts`
- `Server/src/categories/categories.controller.spec.ts`
- `Server/src/wallets/wallets.controller.spec.ts`
- `Server/src/records/records.controller.spec.ts`

### Remaining Risk After This Fix
- Registration is still non-transactional.
- Error semantics still mix authorization errors with validation-style cases.
- These are controller-level tests with mocks, not full database-backed integration tests yet.

### Session Goal
- Quick repository review to identify the main project problems.
- Start a persistent file to track future progress with Codex.

### Current Assessment
Scale: `0` = no issue, `10` = critical issue.

1. `9/10` Broken authorization boundaries in backend routes.
   Evidence: `users`, `categories`, `wallets`, and `records` controllers trust URL/body ids without consistently checking that the resource belongs to `req.user.id`.
   Files: `Server/src/users/users.controller.ts`, `Server/src/categories/categories.controller.ts`, `Server/src/wallets/wallets.controller.ts`, `Server/src/records/records.controller.ts`

2. `8/10` Record/category/wallet APIs allow cross-user data access and mutation.
   Evidence: several `GET`, `PATCH`, and `DELETE` handlers only check that a record exists, not that the caller owns it.
   Files: `Server/src/categories/categories.controller.ts`, `Server/src/wallets/wallets.controller.ts`, `Server/src/records/records.controller.ts`

3. `8/10` User registration setup is not transactional.
   Evidence: user creation, default category creation, and category-order update happen in separate steps; a failure in the middle leaves partial data.
   File: `Server/src/users/users.controller.ts`

4. `7/10` Environment/config boot path is fragile.
   Evidence: JWT config reads env vars directly at module load time and `parseInt(process.env.JWT_EXPIRATION_TIME)` can produce invalid config silently.
   File: `Server/src/auth/auth.module.ts`

5. `7/10` Documentation/onboarding is effectively missing.
   Evidence: root README only contains a title, so setup steps, env vars, architecture, and run commands are undocumented.
   File: `ReadMe.md`

6. `6/10` Automated tests are mostly placeholders.
   Evidence: React and Flutter tests are default starter tests, and Nest specs barely assert behavior. This gives very weak change protection.
   Files: `Client/src/App.test.tsx`, `app/test/widget_test.dart`, `Server/src/app.controller.spec.ts`

7. `6/10` Frontend auth state is brittle.
   Evidence: auth depends on `sessionStorage`, Redux state, and ad-hoc Axios default header setup in multiple places instead of one reliable auth bootstrap path.
   Files: `Client/src/store/userSlice.ts`, `Client/src/layout/AuthLayout.tsx`, `Client/src/provider/AuthProvider.tsx`

8. `5/10` Mobile app looks incomplete and disconnected from the real backend.
   Evidence: Flutter starts on register page, auth service is a stub, and home screen still contains hard-coded values.
   Files: `app/lib/main.dart`, `app/lib/services/auth_service.dart`, `app/lib/pages/home.dart`

9. `4/10` Naming and repo structure are inconsistent.
   Evidence: `ReadMe.md` casing is unusual, `Client` vs `Server` vs `app` mixes conventions, and server scripts still reference `client/build` while repo folder is `Client`.
   Files: `ReadMe.md`, `Server/src/app.module.ts`, `Server/package.json`

10. `3/10` Validation and error semantics need cleanup.
   Evidence: duplicate-user checks return `UnauthorizedException` instead of conflict/validation-style errors, which makes API behavior less accurate for clients.
   File: `Server/src/users/users.controller.ts`

### Next Good Steps
- Fix ownership checks on every protected backend route first.
- Add integration tests around auth, wallet access, record access, and user update flows.
- Add a real root README with setup for `Client`, `Server`, and `app`.

### Notes
- This review was from static inspection only.
- I did not run the apps or test suites in this session.

## Template

### Next Session Entry
- Date:
- Goal:
- Changes made:
- Verification:
- Remaining risks:
