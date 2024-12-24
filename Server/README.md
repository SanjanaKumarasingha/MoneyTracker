### Server

Api end points

Transaction

GET /transactions: Get all transactions.
GET /transactions/income: Get all income transactions.
GET /transactions/expense: Get all expense transactions.
POST /transactions/income: Add a new income transaction. (Body should include fields like amount, user, linkedAccount, etc.)
POST /transactions/expense: Add a new expense transaction. (Body should include fields like amount, user, linkedAccount, etc.)
PUT /transactions/:id: Update a transaction by its ID.
DELETE /transactions/:id: Delete a transaction by its ID.
