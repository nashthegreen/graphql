# GraphQL

Reboot01 student profile page. Sign in with JWT, query your data from GraphQL, and view stats as SVG charts.

## Features

- **Login** — username or email + password (Basic auth → JWT)
- **Logout** — clears the session; expired / invalid JWTs are dropped automatically
- **Profile** — identity, XP, level, audits, skills, projects, etc
- **SVG charts** (see below)

## SVG graphs

| Chart | Type | Data |
|---|---|---|
| XP progress | Line | XP transactions over time |
| XP by project | Treemap | XP per project path |
| Audit ratio | Donut | `totalUp` / `totalDown` |
| Skills | Radar | Soft skills (`skill_*`) |
| Technologies | Radar | Tech skills (`skill_*`) |

## Sample queries

```graphql
query {
  user { id login auditRatio totalUp totalDown }
}
```

```graphql
query ($userId: Int!, $xpPath: String!) {
  transaction(
    where: { type: { _eq: "xp" }, userId: { _eq: $userId }, path: { _like: $xpPath } }
    order_by: { createdAt: asc }
  ) { amount createdAt path }
}
```

```graphql
{
  transaction(
    distinct_on: type
    where: { type: { _like: "skill_%" } }
    order_by: { type: asc, amount: desc }
  ) { type amount }
}
```

Full set: [`static/js/queries.js`](static/js/queries.js).

## APIs

| | |
|---|---|
| Sign-in | `https://learn.reboot01.com/api/auth/signin` |
| GraphQL | `https://learn.reboot01.com/api/graphql-engine/v1/graphql` |

GraphQL calls use `Authorization: Bearer <JWT>`.

## Run locally

```bash
npx --yes serve -c serve.json .
```

Open the URL shown. Routes `/login` and `/profile` rewrite to `index.html`.

## GitHub Pages

Deploys from `main` via [`.github/workflows/pages.yml`](.github/workflows/pages.yml).

1. Push the repo to GitHub.
2. **Settings → Pages → Source:** GitHub Actions.
3. Site: `https://<user>.github.io/<repo>/`

Base-path routing + `404.html` cover project Pages URLs. Auth still hits `learn.reboot01.com` (CORS must allow the Pages origin).
