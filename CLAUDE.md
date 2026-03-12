# CLAUDE.md
Read INSTRUCTIONS.md for the full project plan, 
architecture, and build steps. Follow the phases 
in order. The CSV data is in data/scarebnb_listings.csv.

This is a Next.js App Router project using:
- Vercel AI Gateway (model string format: provider/model)
- AI SDK v5+ (streamText, tool, useChat)
- Supabase for data
- Tailwind for styling

Always use 'anthropic/claude-sonnet-4.5' as the model for inside the app my users will use. 
When building you should always use `'anthropic/claude-opus-4.6' for your coding tasks
string — no provider-specific imports needed.