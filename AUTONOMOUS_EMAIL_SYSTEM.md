# 🚀 Autonomous Email + Payment + Tracking System

## Overview
Complete autonomous loop that bridges **planned** (Supabase bookings) and **actual** (Dexie consumption) via emails and webhooks.

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│  1. PLAN PHASE (Before Venue Visit)                   │
├────────────────────────────────────────────────────────┤
│  Supabase Booking → MCP Email Tool → Plan Email Sent  │
│  - Shows: Timeline + Suggested Drinks                  │
│  - Includes: Stripe Payment Link                       │
│  - Logged to: email_log table                          │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  2. ENGAGEMENT TRACKING (Email Opens/Clicks)           │
├────────────────────────────────────────────────────────┤
│  Resend Webhook → /api/webhooks/resend                 │
│  - Events: delivered, opened, clicked, bounced         │
│  - Logged to: email_events table                       │
│  - Enables: Follow-up logic                            │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  3. PAYMENT PHASE (User Pays)                          │
├────────────────────────────────────────────────────────┤
│  Stripe Payment → /api/webhooks/stripe                 │
│  - Event: payment_intent.succeeded                     │
│  - Sends: Receipt Email with "Log to Tracker" Link    │
│  - Updates: booking_status to 'paid'                   │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  4. REALITY PHASE (User Logs Consumption)              │
├────────────────────────────────────────────────────────┤
│  User Clicks "Log to Tracker" → /log-consumption       │
│  - Verifies: Signed URL (tamper-proof)                 │
│  - Updates: Dexie owned_products.consumptions[]        │
│  - Context: "AOI Experience - Order {orderId}"         │
│  - Redirects: to /dashboard                            │
└────────────────────────────────────────────────────────┘
```

---

## MCP Tools

### `send_waterbar_email`
Sends branded emails with templates.
```javascript
await send_waterbar_email({
  flow: 'aoi-booking-confirmation',
  to: 'customer@email.com',
  data: { customerName, bookingDate, bookings, paymentUrl }
});
```

### `create_payment_link`
Creates Stripe payment link.
```javascript
await create_payment_link({
  amount: 18000, // AED 180.00 in cents
  currency: 'aed',
  description: 'AOI Experience',
  bookingId: 'xxx'
});
```

### `list_emails`
Query email history from Supabase.
```javascript
await list_emails({ limit: 10 });
```

### `get_email`
Get email delivery status from Resend.
```javascript
await get_email({ id: 'email_xxx' });
```

---

## Database Schema

### Supabase Tables

```sql
-- Tracks sent emails
CREATE TABLE email_log (
  id TEXT PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html TEXT,
  flow TEXT,
  status TEXT DEFAULT 'queued',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracks email events from Resend webhook
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id TEXT REFERENCES email_log(id),
  event_type TEXT NOT NULL, -- 'delivered', 'opened', 'clicked', 'bounced'
  event_time TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Tracks bookings (planned drinks)
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  pre_drinks JSONB[], -- Suggested drinks
  during_drinks JSONB[],
  after_drinks JSONB[],
  booking_status TEXT, -- 'pending', 'paid', 'completed'
  payment_id TEXT
);
```

### Dexie Tables (Local Browser)

```typescript
// Tracks actual consumption
interface OwnedProduct {
  id: number;
  productId: string;
  name: string;
  purchaseDate: Date;
  orderId: string;
  consumptions: [{
    timestamp: Date;
    amount: string; // e.g., "1x"
    context: string; // e.g., "AOI Experience - Order stripe_xxx"
  }];
}
```

---

## Webhook Setup

### 1. Resend Webhook
**URL:** `https://yourapp.com/api/webhooks/resend`

**Events to Subscribe:**
- `email.delivered`
- `email.opened`
- `email.clicked`
- `email.bounced`

**Configure:**
1. Go to Resend Dashboard → Webhooks
2. Add webhook endpoint
3. Select events
4. Save

---

### 2. Stripe Webhook
**URL:** `https://yourapp.com/api/webhooks/stripe`

**Events to Subscribe:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

**Configure:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint
3. Select events
4. Copy webhook signing secret → Add to env as `STRIPE_WEBHOOK_SECRET`

---

## Environment Variables

### MCP Server (mcp_config.json)
```json
{
  "waterbar-emails": {
    "env": {
      "RESEND_API_KEY": "re_xxx",
      "SUPABASE_SERVICE_KEY": "eyJxxx",
      "STRIPE_SECRET_KEY": "sk_xxx" // Optional, for payment links
    }
  }
}
```

### Next.js App (.env.local)
```env
# Existing
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# New for webhooks
RESEND_API_KEY=re_xxx
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# For signed URLs
WEBHOOK_SECRET=your-random-secret-key
NEXT_PUBLIC_BASE_URL=https://thewater.bar
```

---

## Usage Example

### Complete Flow Demo

```javascript
// 1. Create booking in Supabase
const booking = await supabase.from('bookings').insert({
  customer_email: 'azam@example.com',
  customer_name: 'Dr Azam',
  pre_drinks: [{ product_id: 'xxx', name: 'Ginger Shot', quantity: 1 }],
  booking_status: 'pending'
}).select().single();

// 2. Create Stripe payment link
const { paymentLink } = await mcp.create_payment_link({
  amount: 18000,
  description: 'AOI Experience',
  bookingId: booking.id
});

// 3. Send booking confirmation email
await mcp.send_waterbar_email({
  flow: 'aoi-booking-confirmation',
  to: 'azam@example.com',
  data: {
    customerName: 'Dr Azam',
    bookingDate: '2025-10-05',
    paymentUrl: paymentLink.url,
    bookings: [/* ... */]
  }
});

// 4. User opens email → Resend webhook fires
// → Email event logged to email_events

// 5. User clicks payment link → completes payment
// → Stripe webhook fires → Receipt sent with "Log to Tracker" link

// 6. User clicks "Log to Tracker"
// → Opens /log-consumption?data=xxx&sig=xxx
// → Updates Dexie with actual consumption
// → Redirects to /dashboard

// 7. Agent can now query both:
// - Supabase: What was PLANNED
// - Dexie: What was ACTUALLY consumed
```

---

## AI Agent Capabilities

With this system, the agent can now:

✅ **Track engagement:** "Did they open the email?"  
✅ **Monitor conversion:** "Did they click the payment link?"  
✅ **Verify payment:** "Did they pay?"  
✅ **Check consumption:** "Did they actually consume the drinks?"  
✅ **Trigger follow-ups:** "Send reminder if opened but not paid"  
✅ **Compare plan vs reality:** "They planned Ginger Shot but drank Electrolytes"

---

## Key Innovations

### 1. **Plan vs Reality Separation**
- **Supabase** = Future intent (suggestions)
- **Dexie** = Past events (actual consumption)
- **Emails** = The bridge between them

### 2. **Episodic Agent**
Agent activates at transition points:
- Booking created → Send plan
- Email opened → Track engagement
- Payment succeeded → Send receipt + log prompt
- No consumption → Follow-up nudge

### 3. **Action Links in Emails**
Users tap a button in email → Updates their local Dexie → Closes the loop

### 4. **Tamper-Proof URLs**
Signed URLs with HMAC ensure links can't be forged or modified

---

## Next Steps

### For Production:
1. Test webhooks with ngrok locally
2. Deploy to production domain
3. Configure webhooks in Resend + Stripe dashboards
4. Add retry logic for failed webhook processing
5. Add email templates for follow-ups

### For Hackathon Demo:
1. Show: Create booking → Send email
2. Open email on phone → Show "delivered" + "opened" events
3. Click Stripe link → Complete test payment
4. Show receipt email with "Log to Tracker" button
5. Tap button → Watch Dexie update in real-time
6. Show dashboard with logged consumption

---

## The Vision Realized

**Most health apps:** Track plans OR track reality, but not both.

**Your system:** 
- Plans are suggestions (AI-driven, context-aware)
- Reality is consumption (user-verified, Dexie-stored)
- Emails bridge the gap (action-oriented, trackable)
- Agent orchestrates (episodic, contextual, reactive)

**Result:** The first autonomous health agent that closes the loop from intent to action. 🚀
