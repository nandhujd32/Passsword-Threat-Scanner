# Password Threat Scanner

A client-side password strength analyzer with a dark HUD/circuit theme — entropy scoring, a multi-scenario crack-time table, pattern-based vulnerability flags, a configurable password generator, and a hashed (SHA-256) reuse ledger. Everything runs in the browser; nothing is sent to a server.

## Files

```
index.html      # markup
css/style.css   # all styling + animations
js/script.js    # scoring engine, generator, ledger, history logic
```

## Run locally

Just open `index.html` in a browser — no build step, no dependencies to install.

## Deploy to GitHub Pages

1. Create a new GitHub repo and push these three files (keep the folder structure as-is).

   ```bash
   git init
   git add .
   git commit -m "Password threat scanner"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```

2. On GitHub: go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`.
4. Set **Branch** to `main` and folder to `/ (root)`, then **Save**.
5. GitHub will publish it at:

   ```
   https://<your-username>.github.io/<repo-name>/
   ```

   It usually takes 1-2 minutes to go live after the first push.

## Notes

- The scan history and reuse ledger are in-memory only (JavaScript variables) — they reset on page reload. There's no backend and no persistent storage in this version.
- Fonts (Orbitron, Rajdhani, Share Tech Mono) load from Google Fonts via `<link>` tags in `index.html`, so an internet connection is needed on first load.
