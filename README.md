# GraphQL — Developer Profile Sheet

Client-side dashboard that signs in against the Reboot01 Auth API and loads profile data from the GraphQL Engine.

## Local development

```bash
npx --yes serve -c serve.json .
```

Open the printed URL. SPA routes (`/login`, `/profile`) are rewritten to `index.html` via `serve.json`.

## GitHub Pages

The site is static and deploys from `main` via [`.github/workflows/pages.yml`](.github/workflows/pages.yml).

### One-time setup

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment → Source:** GitHub Actions.
3. After the workflow succeeds, the site is at:

   `https://<user>.github.io/<repo>/`

Routing is base-path aware, so project Pages URLs (`/<repo>/login`, `/<repo>/profile`) work. Deep links use `404.html` as an SPA fallback.

### Notes

- Relative asset paths and `.nojekyll` keep CSS/JS loading correctly under a project subpath.
- Auth and GraphQL still call `learn.reboot01.com` (requires that API to allow the Pages origin via CORS).
