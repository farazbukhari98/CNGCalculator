# CNG Fleet Calculator - Standalone Local Version

This folder contains the portable local build of the CNG Fleet Calculator.

## Use

Open `CNGCalculator.html` directly in a browser. No server, Vercel deployment, database, API key, or install step is required.

## Differences from the hosted version

- The calculator, analysis views, charts, local saved strategies, dark mode, strategy comparison, and PDF export are preserved.
- The hosted-only **Ask Shaun** natural-language assistant is removed from this local build because it depends on the `/api/natural-query` server endpoint and OpenAI credentials.

## Rebuild

From the repository root:

```bash
npm ci
npm run build:standalone
```

The build writes the generated local app to both:

- `dist/standalone/CNGCalculator.html` — ignored build output
- `standalone/CNGCalculator.html` — tracked portable file