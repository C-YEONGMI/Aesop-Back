# Aesop Back

Backend application for the Aesop renewal project.

## Stack

- Node.js
- Express
- MongoDB
- JWT authentication

## Run

```bash
npm install
npm run dev
```

## Product data

- `npm run seed` loads the local snapshot from `src/data/products.json`
- `npm run sync:products` scrapes the source catalog and writes directly to MongoDB

## Environment

Copy `.env.example` to `.env` and set your MongoDB and auth values.
