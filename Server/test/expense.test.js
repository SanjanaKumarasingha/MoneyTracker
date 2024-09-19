test("expense test", async () => {
    const req = {
        body: {
        title: "Test",
        amount: 100,
        category: "Test",
        description: "Test",
        date: "2021-08-20",
        },
        params: {
        id: "60f5b0d4c1d3b00015f9d9c2",
        },
    };
    const res = {
        status: jest.fn(() => res),
        json: jest.fn(),
    };
    const ExpenseSchema = require("../models/ExpenseModel");
    ExpenseSchema.find = jest.fn(() => ({
        sort: jest.fn(() => [
        {
            title: "Test",
            amount: 100,
            category: "Test",
            description: "Test",
            date: "2021-08-20",
        },
        ]),
    }));
    ExpenseSchema.findByIdAndDelete = jest.fn(() => ({
        then: jest.fn(),
        catch: jest.fn(),
    }));
    await addExpense(req, res);
    await getExpense(req, res);
    await deleteExpense(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    });