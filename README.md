
**NPS Core Engine ****  
--  © 2025 Nyumban Property Solutions (NPS). All rights reserved.  
--
--  This codebase is confidential and proprietary to NPS.  
--  Unauthorized use, replication, or distribution is strictly prohibited  
--  without explicit written consent from NPS.

--  Version: 1.0.0  
--  Published: June/13/2025  
--  Author: Eng Ibn Muzamir  
--  Audiences: Backend Developers, QA Engineers, DevOps

## 🖥️ Project Overview

This is the backend service powering **Nyumban Property Solutions**, built using [**Node.js**](https://nodejs.org/) with [**Express.js**](https://expressjs.com/) and [**Prisma ORM**](https://www.prisma.io/).  
It handles authentication, property data, user roles, rent tracking, and integration with payment providers (e.g. Flutterwave, MTN, Airtel).

> ✅ **Architecture Note**: This codebase follows a **modular architecture**, where features are organized into isolated modules (`auth`, `users`, `properties`, etc.).  
> This improves scalability, maintainability, and developer productivity.

---

## 📌 Features

- JWT-based authentication & user management
- Tenant-landlord data modeling via Prisma
- RESTful APIs for mobile app integration
- Encrypted password handling (bcrypt)
- Joi-based request validation
- CORS configuration for frontend communication
- Mobile Money (MoMo) integration-ready

---

## 🛠️ Development Setup

### ✅ Prerequisites

- Node.js ≥ 18.x
- PostgreSQL database (local or hosted)
- Prisma CLI (`npx prisma`)
- `.env` configuration file (sample below)

---

### 📁 Sample `.env` File

```env
DATABASE_URL=postgresql://username:password@localhost:5432/nps
JWT_SECRET=your_jwt_secret
PORT=5000
````

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Set Up Prisma & DB

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 3. Run the Server

```bash
npm run dev
# or
yarn dev
```

---

## 🧩 Backend Stack

| Layer               | Tech Used           |
| ------------------- | ------------------- |
| Server Framework    | Express.js          |
| ORM & DB Mapping    | Prisma + PostgreSQL |
| Validation          | Joi                 |
| Auth                | JWT + bcrypt        |
| Environment Config  | dotenv              |
| API Docs (optional) | Swagger / Redoc     |

---

## 🧪 Testing & Debugging

* Use Postman/Insomnia for testing endpoints
* Run development logs via `console.log()` or Winston
* Recommended: Add unit tests with Jest (optional)

---

## 🔐 Security Notes

* Passwords are hashed with `bcrypt` before storage
* JWTs are used for session-less authentication
* Webhooks and API endpoints should include signature validation

---

## 📦 Deployment Strategy

| Environment | Platform       | Tools Used              |
| ----------- | -------------- | ----------------------- |
| Staging     | EC2 or Railway | GitHub Actions + PM2    |
| Production  | AWS EC2/RDS    | CI/CD + Secrets Manager |

---

## 📈 Monitoring & Logs

* Use `Winston` for logging (extendable)
* Suggest integration with CloudWatch or Logtail
* Include structured logs for payment events

---

## 📚 Resources

* [Express Docs](https://expressjs.com/)
* [Prisma Docs](https://www.prisma.io/docs)
* [JWT Intro](https://jwt.io/introduction/)
* [Flutterwave API](https://developer.flutterwave.com/)

---
