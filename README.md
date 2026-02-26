# Bitespeed Identity Reconciliation

A backend service that consolidates customer contact information across multiple purchases. When a customer uses different emails or phone numbers at checkout, this API links all their contacts together under a single primary identity.

## Live Endpoint

```
POST https://id-reconc.onrender.com/identify
```

## Problem Statement

FlowBlend (via Bitespeed) needs to identify and track customers who may use different email addresses or phone numbers across orders. This service reconciles such contacts by maintaining `primary` and `secondary` contact records linked together.

## API

### `POST /identify`

**Request Body**
```json
{
  "email": "string (optional)",
  "phoneNumber": "string or number (optional)"
}
```
At least one of `email` or `phoneNumber` must be provided.

**Response**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["primary@email.com", "secondary@email.com"],
    "phoneNumbers": ["123456", "789012"],
    "secondaryContactIds": [2, 3]
  }
}
```

**Behaviour**
- If no existing contact matches → creates a new `primary` contact.
- If a match is found but the request contains new information → creates a `secondary` contact linked to the primary.
- If the request links two previously separate primary contacts → the **older** one remains primary; the newer one is demoted to `secondary`.
- Repeated requests with identical data are **idempotent** (no duplicate rows created).
- Primary's email and phone always appear **first** in their respective arrays.

## Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express 5
- **Database:** PostgreSQL (hosted on Render)
- **ORM:** Sequelize 6
- **Hosting:** Render

## Schema

```sql
CREATE TABLE contacts (
  id              SERIAL PRIMARY KEY,
  phoneNumber     VARCHAR,
  email           VARCHAR,
  linkedId        INTEGER REFERENCES contacts(id),
  linkPrecedence  ENUM('primary', 'secondary') NOT NULL,
  createdAt       TIMESTAMP NOT NULL,
  updatedAt       TIMESTAMP NOT NULL,
  deletedAt       TIMESTAMP
);
```

## Local Setup

```bash
git clone <repo-url>
cd Bitespeed_Assgn
npm install
```

Create a `.env` file:
```
PORT=3000
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<dbname>
```

```bash
npm run dev
```

The `contacts` table is auto-created on first run via `sequelize.sync()`.

## Example

**Request**
```json
POST /identify
{ "email": "mcfly@hillvalley.edu", "phoneNumber": "123456" }
```

**Response**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2]
  }
}
```
