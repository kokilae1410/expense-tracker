# Expense Tracker

A production-quality, full-stack **Expense Tracker** web application built with a classic MVC
architecture: **Node.js + Express** on the backend, **MongoDB + Mongoose** for persistence, and a
**Vanilla HTML/CSS/JavaScript** frontend (no frameworks, no build step).

## Features

- 🔐 Register, Login, Logout (JWT auth stored in an httpOnly cookie + bearer token fallback)
- 📊 Dashboard with Total Income, Total Expense, Remaining Balance
- ➕ Add / ✏️ Edit / 🗑️ Delete transactions (income or expense)
- 📋 Full transaction history with pagination
- 🔍 Search by description, exact date, or month
- 🏷️ Category filters (separate income & expense category sets)
- 🕒 Recent transactions widget
- 📈 Monthly Expense Bar Chart, Income vs Expense Chart, Expense Category Pie Chart (Chart.js)
- 🗓️ Daily, Monthly, and Yearly Reports with tables + charts
- 🎯 Budget Planning per category/month with automatic spend tracking
- 🔔 Budget Alerts (warning at 80% usage, exceeded at 100%)
- 👤 User Profile (name, currency, avatar color, monthly budget goal, change password)
- ✅ Client-side and server-side form validation
- 🍞 Toast notifications for success/error feedback
- 📱 Fully responsive layout (collapsible sidebar on mobile)

## Tech Stack

| Layer      | Technology                                   |
|------------|-----------------------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript, Chart.js (CDN)|
| Backend    | Node.js, Express.js                            |
| Database   | MongoDB, Mongoose                              |
| Auth       | JWT (jsonwebtoken), bcryptjs                   |
| Validation | express-validator                              |
| Architecture | MVC (Models / Controllers / Routes / Views)  |

## Project Structure

```
expense-tracker/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── authController.js      # register, login, logout, getMe
│   ├── transactionController.js
│   ├── budgetController.js
│   ├── reportController.js
│   └── userController.js
├── middleware/
│   ├── authMiddleware.js      # JWT protect middleware
│   ├── errorMiddleware.js     # centralized error handling
│   └── validateMiddleware.js  # express-validator wrapper
├── models/
│   ├── User.js
│   ├── Transaction.js
│   └── Budget.js
├── routes/
│   ├── authRoutes.js
│   ├── transactionRoutes.js
│   ├── budgetRoutes.js
│   ├── reportRoutes.js
│   └── userRoutes.js
├── utils/
│   └── generateToken.js
├── public/                    # Frontend (served statically by Express)
│   ├── index.html             # redirects to login/dashboard
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── transactions.html
│   ├── reports.html
│   ├── budget.html
│   ├── profile.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── config.js
│       ├── api.js
│       ├── utils.js
│       ├── notifications.js
│       ├── nav.js
│       ├── auth.js
│       ├── transaction-modal.js
│       ├── dashboard.js
│       ├── transactions.js
│       ├── reports.js
│       ├── budget.js
│       └── profile.js
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- A running MongoDB instance (local or Atlas)

### Installation

```bash
git clone <your-repo-url>
cd expense-tracker
npm install
```

### Configure environment variables

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/expense_tracker
JWT_SECRET=replace_this_with_a_long_random_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5000
```

### Run the app

```bash
# development (auto-restart with nodemon)
npm run dev

# production
npm start
```

The app will be available at **http://localhost:5000**. Express serves the API under `/api/*`
and the static frontend from the `public/` folder — everything runs from a single server, no
separate frontend build step required.

## API Overview

All endpoints (except register/login) require authentication, either via the `token` httpOnly
cookie set on login, or an `Authorization: Bearer <token>` header.

### Auth
| Method | Endpoint             | Description         |
|--------|-----------------------|----------------------|
| POST   | `/api/auth/register`  | Create a new account |
| POST   | `/api/auth/login`     | Log in               |
| POST   | `/api/auth/logout`    | Log out              |
| GET    | `/api/auth/me`        | Get current user     |

### Transactions
| Method | Endpoint                                 | Description                               |
|--------|-------------------------------------------|--------------------------------------------|
| GET    | `/api/transactions`                        | List transactions (filters: `type`, `category`, `date`, `month`, `from`, `to`, `q`, `page`, `limit`) |
| POST   | `/api/transactions`                        | Create a transaction                      |
| GET    | `/api/transactions/:id`                    | Get a single transaction                  |
| PUT    | `/api/transactions/:id`                    | Update a transaction                      |
| DELETE | `/api/transactions/:id`                    | Delete a transaction                      |
| GET    | `/api/transactions/summary`                | Totals: income, expense, balance          |
| GET    | `/api/transactions/recent`                 | Most recent transactions                  |
| GET    | `/api/transactions/category-breakdown`     | Category totals (for pie chart)           |
| GET    | `/api/transactions/monthly-trend`          | Income vs expense per month (bar chart)   |

### Budgets
| Method | Endpoint            | Description                              |
|--------|----------------------|-------------------------------------------|
| POST   | `/api/budgets`        | Create/update a category budget          |
| GET    | `/api/budgets`         | List budgets with spend + alert status   |
| DELETE | `/api/budgets/:id`     | Delete a budget                          |

### Reports
| Method | Endpoint               | Description                    |
|--------|-------------------------|----------------------------------|
| GET    | `/api/reports/daily`     | Daily totals over a date range |
| GET    | `/api/reports/monthly`   | Monthly totals for a given year|
| GET    | `/api/reports/yearly`    | Yearly totals                  |

### Users
| Method | Endpoint                     | Description             |
|--------|--------------------------------|---------------------------|
| GET    | `/api/users/profile`           | Get profile              |
| PUT    | `/api/users/profile`           | Update profile           |
| PUT    | `/api/users/change-password`   | Change password          |

## Security Notes

- Passwords are hashed with **bcrypt** (10 salt rounds) before being stored.
- JWTs are signed with a server-side secret and delivered as an **httpOnly** cookie so they
  can't be read by client-side JavaScript, with a bearer-token fallback for API clients.
- All transaction/budget queries are scoped to `req.user._id`, so users can never read or
  modify another user's data.
- Input is validated both client-side (for UX) and server-side with `express-validator`
  (for security — never trust the client).

## License

MIT
