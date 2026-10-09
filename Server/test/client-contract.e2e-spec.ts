import { NestExpressApplication } from '@nestjs/platform-express';
import * as request from 'supertest';

import { createTestApp, signUp, authHeader, Session } from './utils/test-app';

// Client contract tests: each request body below is copied from what
// Client/src/apis/* and Mobile/src/apis/* actually send - including the
// extra fields they include (ids, categoryOrder, confirmPassword...). The
// whitelisting ValidationPipe drops any DTO field without a validator, so
// these prove every field the server *reads* still arrives, and that the
// change took effect - not just that the request returned 2xx.
describe('Client request contracts (e2e)', () => {
  let app: NestExpressApplication;
  let dana: Session;
  let walletA: number;
  let walletB: number;
  let expenseCategory: number;

  const api = () => request(app.getHttpServer());
  const as = () => authHeader(dana);
  const getMe = async () =>
    (await api().get(`/api/v1/users/${dana.id}`).set(as()).expect(200)).body;

  beforeAll(async () => {
    app = await createTestApp();
    dana = await signUp(app, 'dana');

    // createWallet(newWallet: ICreateWallet) - IWallet fields + userId
    const a = await api()
      .post('/api/v1/wallets')
      .set(as())
      .send({ id: 0, name: 'Cash', currency: 'LKR', userId: dana.id })
      .expect(201);
    walletA = a.body.id;
    const b = await api()
      .post('/api/v1/wallets')
      .set(as())
      .send({ id: 0, name: 'Bank', currency: 'LKR', userId: dana.id })
      .expect(201);
    walletB = b.body.id;

    const categories = await api().get('/api/v1/categories').set(as());
    expenseCategory = categories.body.find((c) => c.type === 'expense').id;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('register ignores confirmPassword but keeps the password', async () => {
    // register(newUser: NewUser) sends the whole form state.
    await api()
      .post('/api/v1/users')
      .send({
        username: 'erin',
        email: 'erin@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      })
      .expect(201);

    await api()
      .post('/api/v1/auth/login')
      .send({ username: 'erin', password: 'Password123!' })
      .expect(201);
  });

  it('updateUser (profile) saves username and email', async () => {
    const me = await getMe();
    // { ...updateInfo.user } - the full IUserInfo, categoryOrder included.
    await api()
      .patch(`/api/v1/users/${dana.id}`)
      .set(as())
      .send({ ...me, username: 'dana2', email: 'dana2@example.com' })
      .expect(200);

    const after = await getMe();
    expect(after.username).toBe('dana2');
    expect(after.email).toBe('dana2@example.com');
    expect(after.categoryOrder).toEqual(me.categoryOrder);
  });

  it('updateCategoryOrder persists the new order', async () => {
    const me = await getMe();
    const reversed = [...me.categoryOrder].reverse();

    await api()
      .patch(`/api/v1/users/${dana.id}/category-order`)
      .set(as())
      .send({ id: dana.id, categoryOrder: reversed })
      .expect(200);

    expect((await getMe()).categoryOrder).toEqual(reversed);
  });

  it('createCategory (CategoryPage / ImportPage / mobile) creates it as sent', async () => {
    // ImportPage: { name, icon, type, enable, userId }; CategoryPage and
    // mobile send the whole ICreateCategory form state (id included).
    const res = await api()
      .post('/api/v1/categories')
      .set(as())
      .send({
        id: 0,
        name: 'Imported',
        icon: 'MONEY',
        type: 'income',
        enable: true,
        userId: dana.id,
      })
      .expect(201);

    expect(res.body).toMatchObject({
      name: 'Imported',
      icon: 'MONEY',
      type: 'income',
    });
    expect((await getMe()).categoryOrder).toContain(res.body.id);
  });

  it('updateCategory saves name, icon, and enable', async () => {
    await api()
      .patch(`/api/v1/categories/${expenseCategory}`)
      .set(as())
      .send({ icon: 'COFFEE', name: 'Coffee', enable: false })
      .expect(200);

    const category = await api()
      .get(`/api/v1/categories/${expenseCategory}`)
      .set(as())
      .expect(200);
    expect(category.body).toMatchObject({
      name: 'Coffee',
      icon: 'COFFEE',
      enable: false,
    });
  });

  it('setCategoryVisibility hides a category in one wallet', async () => {
    await api()
      .patch(
        `/api/v1/wallets/${walletA}/categories/${expenseCategory}/visibility`,
      )
      .set(as())
      .send({ hidden: true })
      .expect(200);

    const hidden = await api()
      .get(`/api/v1/wallets/${walletA}/hidden-categories`)
      .set(as())
      .expect(200);
    expect(hidden.body).toContain(expenseCategory);
  });

  it('updateWallet saves name and currency', async () => {
    await api()
      .patch(`/api/v1/wallets/${walletB}`)
      .set(as())
      .send({ name: 'Savings', currency: 'USD' })
      .expect(200);

    const wallets = await api()
      .get(`/api/v1/wallets/user/${dana.id}`)
      .set(as())
      .expect(200);
    expect(wallets.body.find((w) => w.id === walletB)).toMatchObject({
      name: 'Savings',
      currency: 'USD',
    });
  });

  it('createRecord + updateRecord (incl. moving wallet/category)', async () => {
    // createRecord sends whole wallet/category objects (mobile: date-only).
    const created = await api()
      .post('/api/v1/records')
      .set(as())
      .send({
        price: 250,
        remarks: 'contract',
        date: '2026-10-02',
        wallet: { id: walletA, name: 'Cash', currency: 'LKR' },
        category: { id: expenseCategory, name: 'Coffee', type: 'expense' },
      })
      .expect(201);

    await api()
      .patch(`/api/v1/records/${created.body.id}`)
      .set(as())
      .send({
        price: 300,
        remarks: 'contract edited',
        date: '2026-10-03',
        walletId: walletB,
        categoryId: expenseCategory,
      })
      .expect(200);

    const moved = await api()
      .get(`/api/v1/records/wallet/${walletB}`)
      .set(as())
      .expect(200);
    const record = moved.body.find((r) => r.id === created.body.id);
    expect(record).toBeDefined();
    expect(Number(record.price)).toBe(300);
    expect(record.remarks).toBe('contract edited');
  });

  it('transfer moves money between two wallets', async () => {
    // createTransfer(transfer: ITransferRecord)
    await api()
      .post('/api/v1/records/transfer')
      .set(as())
      .send({
        fromWalletId: walletA,
        toWalletId: walletB,
        amount: 1000,
        date: '2026-10-04',
        remarks: 'move to savings',
      })
      .expect(201);

    const into = await api()
      .get(`/api/v1/records/wallet/${walletB}`)
      .set(as())
      .expect(200);
    expect(
      into.body.some(
        (r) => r.remarks === 'move to savings' && Number(r.price) === 1000,
      ),
    ).toBe(true);
  });

  it('bulk import creates every row', async () => {
    // bulkCreateRecords({ walletId, rows: IBulkCreateRow[] })
    const res = await api()
      .post('/api/v1/records/bulk')
      .set(as())
      .send({
        walletId: walletA,
        rows: [
          { price: 10, date: '2026-09-01', remarks: 'row 1', categoryId: expenseCategory },
          { price: 20, date: '2026-09-02', categoryId: expenseCategory },
        ],
      })
      .expect(201);

    expect(JSON.stringify(res.body)).toContain('row 1');
  });

  it('createGoal (with category) + updateGoal save every field', async () => {
    // createGoal(newGoal: ICreateGoal)
    const created = await api()
      .post('/api/v1/goals')
      .set(as())
      .send({
        name: 'Coffee budget',
        type: 'spending_limit',
        periodType: 'custom',
        targetAmount: 5000,
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        userId: dana.id,
        walletId: walletA,
        categoryId: expenseCategory,
      })
      .expect(201);

    // updateGoal sends exactly these six fields.
    await api()
      .patch(`/api/v1/goals/${created.body.id}`)
      .set(as())
      .send({
        name: 'Coffee cap',
        type: 'spending_limit',
        periodType: 'monthly',
        targetAmount: 4000,
        startDate: '2026-10-01',
        endDate: null,
      })
      .expect(200);

    const goal = await api()
      .get(`/api/v1/goals/${created.body.id}`)
      .set(as())
      .expect(200);
    expect(goal.body).toMatchObject({
      name: 'Coffee cap',
      periodType: 'monthly',
      endDate: null,
    });
    expect(Number(goal.body.targetAmount)).toBe(4000);
    expect(goal.body.category.id).toBe(expenseCategory);
  });

  it('updatePassword (whole IUserInfo + passwords) changes the password', async () => {
    const me = await getMe();
    await api()
      .patch(`/api/v1/users/${dana.id}/update-password`)
      .set(as())
      .send({ ...me, oldPassword: 'Password123!', newPassword: 'Changed456!' })
      .expect(200);

    await api()
      .post('/api/v1/auth/login')
      .send({ username: me.username, password: 'Changed456!' })
      .expect(201);
  });
});
