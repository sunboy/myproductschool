# HackProduct × Recordly Demo

## Credentials

Edit the top of `hackproduct-demo.py` to set your demo account:
```python
DEMO_EMAIL    = "you@example.com"
DEMO_PASSWORD = "yourpassword"
```

## Setup (one-time)

```bash
# Install Playwright
pip install playwright
playwright install chromium

# Enable mock mode (bypasses auth, uses pre-seeded Uber PM interview data)
echo "USE_MOCK_DATA=true" >> .env.local
echo "NEXT_PUBLIC_USE_MOCK_DATA=true" >> .env.local
```

## Record the demo

1. **Start the dev server** (new terminal tab):
   ```bash
   npm run dev
   ```

2. **Open Recordly** → select your screen → click **Record**

3. **Run the demo script** (in this terminal):
   ```bash
   python demo/hackproduct-demo.py
   ```

4. The script navigates the full flow automatically (~3–4 min). When it prints `✅ Demo complete`, stop Recordly and export.

## What the script covers

| Scene | What you see |
|-------|-------------|
| Dashboard | Home screen, Luma greeting, bento grid scroll |
| Ask Luma | Drawer opens, types FLOW question, waits for response |
| Explore | Domain grid, study plans scroll |
| Practice | Challenge catalog |
| Interviews | Persona roster — clicks Google → Meta → Uber |
| Start interview | Uber PM session starts |
| Inside session | Chat panel opens, FLOW HUD coverage bars visible |
| End → Debrief | End modal, debrief loading screen |

## Debug screenshots

Each scene saves a recon screenshot to `/tmp/demo-*.png` so you can inspect any step that failed.

## Troubleshooting

- **Server not found**: Make sure `npm run dev` is running on port 3000
- **Auth redirect**: Confirm `USE_MOCK_DATA=true` is in `.env.local` and you restarted the server
- **Luma drawer doesn't open**: The `[aria-label="Ask Luma"]` button is in the desktop NavRail — make sure the window is at 1440px wide (the script sets this automatically)
- **Interview won't start**: The mock API returns `sessionId: mock-session-id` — if it's failing, check the server console for errors
