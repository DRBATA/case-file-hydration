# Water Bar Email#  Case File: Hydration

*Another late night in the data district.*

**Supabase** had the records.  
**React** wrote the story.  
**Resend** delivered the goods.

This isn't just another email server — it's an **MCP crew** working together to solve the hydration case.

---

##  The Demo

[Watch the case unfold](https://www.youtube.com/watch?v=dQw4w9WgXcQ) *(add your video link)*

---

##  The Evidence

- **Supabase MCP** → Pulls the booking (neat, precise)
- **React Email** → Dresses it up sharp (timeline, purple gradient, paired drinks)
- **Resend MCP** → Slips it into the inbox (no middlemen)
- **Supabase logs** → Keeps the receipts (sent, delivered, timestamped)

**Case closed.**

---

##  Fork This Case

### Prerequisites:
- Node.js 18+
- [Windsurf IDE](https://codeium.com/windsurf) (with MCP support)
- [Resend API key](https://resend.com)
- [Supabase project](https://supabase.com)

### Setup:

```bash
# Clone the case file
git clone https://github.com/yourusername/case-file-hydration
cd case-file-hydration

# Install dependencies
npm install
```

### 2. Build
```bash
npm run build
```

### 3. Configure Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "waterbar-emails": {
      "command": "node",
      "args": ["C:\\Users\\azamb\\OneDrive\\Desktop\\THE.WATER.BAR\\mcp-waterbar-emails\\build\\index.js"],
      "env": {
        "RESEND_API_KEY": "re_your_api_key_here"
      }
    }
  }
}
```

### 4. Refresh MCP in Windsurf

Click the hammer icon → Refresh MCP servers

## Demo: AOI Booking Confirmation

In Windsurf chat, try:

```
Use the waterbar-emails MCP. Call send_waterbar_email with this:

{
  "flow": "aoi-booking-confirmation",
  "to": "azambata.1984@gmail.com",
  "data": {
    "customerName": "Dr Azam",
    "bookingDate": "2025-07-06",
    "venue": "AOI - Al Quoz, Dubai",
    "totalAmount": "AED 180.00",
    "paymentUrl": "https://buy.stripe.com/test_xxx",
    "bookings": [
      {
        "time": "08:30",
        "experience": "Ice Bath",
        "duration": 10,
        "preDrink": "Ginger Shot",
        "explanation": "Ice Bath sharply awakens your system through noradrenaline release."
      },
      {
        "time": "09:10",
        "experience": "AOI Air PRO Implosion Dome",
        "duration": 50,
        "duringDrink": "Humantra Electrolytes",
        "explanation": "Immersive light and sound enhance cognitive clarity and focus."
      },
      {
        "time": "10:10",
        "experience": "Infrared Sauna",
        "duration": 30,
        "afterDrink": "METÉ Sparkling Water",
        "explanation": "Gentle warmth opens circulation, preparing you for integration."
      }
    ]
  }
}
```

## Available Flows

- `aoi-booking-confirmation` - AOI experience bookings with timeline
- `water-bar-order-confirmation` - Water Bar order receipts
- `water-bar-followup` - Post-visit thank you
- `water-bar-missed-you` - Event no-show followup

## Hackathon Demo Script

**Opening:**
> "I built an AI-orchestrated wellness booking system that chains Supabase + OpenAI + Stripe + Resend to automate multi-venue experience confirmations."

**Show:**
1. User books Ice Bath + Air PRO + Sauna on AOI site
2. AI suggests paired drinks based on physiology
3. Windsurf calls send_waterbar_email MCP tool
4. Beautiful branded email arrives with timeline + drinks

**Emphasize:**
- Multi-MCP orchestration (4 services)
- Real business value (actual bookings)
- AI-driven content (drink pairings, explanations)
- Repeatable (React Email templates = editable)
