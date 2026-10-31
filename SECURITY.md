# Security and local configuration

Copy `server/.env.example` to `server/.env`. Set your OpenAI key and a separate random `APP_ACCESS_TOKEN` of at least 32 characters. Generate an app token locally with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Enter that app token in the frontend's **App access token** field. Never enter the OpenAI key in the browser. The app token is held in React memory and cleared on reload; do not embed it in frontend environment variables or commit it. This shared token is intended for a private demo, not a public multi-user login system.

The backend loads `.env` relative to its own directory, binds to `127.0.0.1` by default, and accepts browser requests only from `ALLOWED_ORIGINS` (comma-separated exact origins; default `http://localhost:3002`). The frontend supports `REACT_APP_API_URL` for a different backend URL. Use HTTPS for remote access. Set `HOST` deliberately if deploying behind a trusted HTTPS reverse proxy.

The application includes these protections:

- No API key, request-body, completion, or raw provider-error logging.
- Ignore rules for environment files, logs, dependencies, and common private-key files. `.env.example` remains trackable.
- Required bearer token for recipe requests; CORS is an additional browser restriction.
- Global limits of 20 requests and 10 recipe generations per minute, with at most two simultaneous provider calls. Failed generations also consume the budget.
- An 8 KB JSON body limit; required string preferences with length and enum validation; rejection of unknown fields.
- GPT-6 Luna with reasoning disabled, a 1,000-token completion cap and a 30-second provider timeout with automatic retries disabled.
- User preferences are sent as user data separately from system instructions.

Limits are in memory and apply to one server process. Restarts reset them. Multiple instances need shared rate-limit storage and deployment-level limits. A shared token holder can consume the generation allowance. Set provider-side spending controls as an additional safeguard.

Run backend checks with `cd server` then `npm test`; tests use a mock provider and make no paid API calls. No real secrets are included in the examples.

Ignore rules do not remove secrets already committed. If a real credential was previously committed or appeared in shared logs, revoke and replace it and review Git history. These changes do not rotate credentials or purge past logs/history.
