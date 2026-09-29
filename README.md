# Daivik Vastram WhatsApp Automation

Firebase Functions + Express integration for Shopify COD orders and the Meta WhatsApp Cloud API.

## 1. Install

```bash
npm install
```

## 2. Environment

Copy:

```text
config/env.example
```

to:

```text
.env
```

Fill in the Meta and Shopify credentials. Never commit `.env` or expose access tokens.

## 3. Run

```bash
npm start
```

## 4. Test

Open:

```text
http://localhost:3000/
http://localhost:3000/health
```

Local endpoints:

```text
http://localhost:3000/
http://localhost:3000/health
```

## Deploy to Firebase

1. Create or select a Firebase project, then install and sign in to the Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use --add
```

2. Create a local `.env` from `config/env.example` and fill in all required values. Do not commit `.env`.

3. Install dependencies and deploy the HTTP function:

```bash
npm install
firebase deploy --only functions
```

The deployed function is named `api`. Set the Meta WhatsApp callback URL to:

```text
https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/api/webhook
```

The verify token in Meta must match `WHATSAPP_VERIFY_TOKEN` in the deployed function environment.

Current project URL:

```text
https://api-bjcd5jjoia-uc.a.run.app
```

## 5. Meta webhook

Meta WhatsApp callback URL:

```text
https://api-bjcd5jjoia-uc.a.run.app/webhook
```

Shopify webhook URL:

```text
https://api-bjcd5jjoia-uc.a.run.app/shopify/webhook
```

Verify token must exactly match:

```text
WHATSAPP_VERIFY_TOKEN
```

## Current features

- Meta webhook verification
- Incoming WhatsApp messages
- Dynamic COD confirmation and cancellation by order number
- Normal WhatsApp messages are ignored
- Shopify order tagging after confirmation or cancellation
- WhatsApp status logging
- WhatsApp text sending helper
- WhatsApp template sending with an image header
- Firestore pending-order tracking
- Health check
