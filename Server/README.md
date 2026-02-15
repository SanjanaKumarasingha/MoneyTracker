### Server

Api end points

Transaction

GET /transactions: Get all transactions.
GET /transactions/income: Get all income transactions.
GET /transactions/expense: Get all expense transactions.
POST /transactions/income: Add a new income transaction. (Body should include fields like amount, user, linkedAccount, etc.)
POST /transactions/expense: Add a new expense transaction. (Body should include fields like amount, user, linkedAccount, eatc.)
PUT /transactions/:id: Update a transaction by its ID.
DELETE /transactions/:id: Delete a transaction by its ID.


### Auth
POST / auth/login: User Login 

### Categories
categories - POST
categories - GET
categories:id - GET
categories:id - PATCH
categories:id - DELETE




