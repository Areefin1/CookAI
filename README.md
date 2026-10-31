# CookAI

**Turn the ingredients you have into a personalized recipe.**

CookAI is a full-stack recipe generator built with React, Node.js, Express, and the OpenAI API. Users customize five preferences—ingredients, meal type, cuisine, cooking time, and difficulty—and receive a recipe with preparation and cooking instructions.

## Features

- **Manage ingredients:** Add individual ingredients and remove them before generating a recipe.
- **Customize your meal:** Choose breakfast, lunch, dinner, or a snack, and enter a cuisine preference.
- **Set time and difficulty:** Select a cooking-time range and a beginner, intermediate, or advanced difficulty level.
- **Generate personalized recipes:** The backend builds a prompt from all five preferences and requests a detailed recipe, including a cuisine-inspired name in its local language.
- **View results in the app:** Aligned generator and result cards display recipes in a scrollable panel that matches the form's height, with preserved line breaks.
- **Track generation status:** Loading and error messages appear beneath the recipe generator.
- **Protect recipe access:** A separate app access token authorizes recipe requests while the OpenAI API key stays on the backend.

The prompt asks the model to use the supplied ingredients and mention any additional items it needs. These are model instructions, not constraints enforced by application logic.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 18, JavaScript, Tailwind CSS, Create React App |
| Backend | Node.js, Express, CORS, dotenv |
| AI integration | OpenAI Node.js SDK, Chat Completions API |
| Communication | HTTP POST requests with JSON, browser Fetch API |

## How It Works

1. The user enters the app access token, adds ingredients, and selects recipe preferences in the React interface.
2. The client sends a JSON request with a bearer token to `POST http://localhost:3001/recipe`.
3. Express checks the origin, request budget, access token, and preference values, then calls OpenAI using `gpt-6-luna`. Reasoning is disabled and completions are capped at 1,000 tokens.
4. The server returns the generated text as `{ "recipe": "..." }`.
5. React displays the recipe beside the input form.

The current implementation returns a complete JSON response after generation finishes. Recipes and preferences are held in React state; there is no database or saved recipe history.

## Project Structure

```text
.
├── client/
│   ├── public/                 # Static assets and HTML entry point
│   ├── src/
│   │   ├── App.js              # Recipe form, ingredient controls, API requests
│   │   ├── App.css             # App styles
│   │   └── index.css           # Tailwind directives and global styles
│   ├── .env.example            # Frontend port configuration
│   ├── package.json
│   └── tailwind.config.js
├── server/
│   ├── server.js               # Express endpoint and OpenAI integration
│   ├── server.test.js          # Security regression tests
│   ├── .env.example            # Configuration template
│   └── package.json
├── SECURITY.md
└── README.md
```

## Run Locally

### Prerequisites

- Node.js 20 or newer and npm installed (backend tests use Node's built-in test runner and Fetch API).
- An OpenAI API key with API access and available quota for the configured model.

Run the following commands from the project directory containing this README, `client/`, and `server/`.

### 1. Configure and start the backend

```bash
cd server
npm install
```

Copy `server/.env.example` to `server/.env`, then fill in your credentials:

```dotenv
OPENAI_API_KEY=your_openai_api_key_here
APP_ACCESS_TOKEN=your_random_app_token_at_least_32_characters
ALLOWED_ORIGINS=http://localhost:3002
HOST=127.0.0.1
```

Generate a separate random app token locally:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Paste the generated value into `APP_ACCESS_TOKEN`. This is a private access credential you create, separate from the OpenAI API key. Enter the same value in the frontend's **App access token** field when using the app; it is cleared on page reload.

Environment files are ignored by Git. Keep both credentials out of source control, and keep the OpenAI key exclusively in the backend. Do not embed the app token in frontend environment variables. See [SECURITY.md](SECURITY.md) for details.

Start the API from the `server/` directory (dotenv loads the configuration relative to `server.js`):

```bash
npm start
```

The backend listens on `http://localhost:3001` and binds to the loopback address by default. It refuses to start without an OpenAI key and an app access token of at least 32 characters.

### 2. Start the frontend

Copy `client/.env.example` to `client/.env` to set `PORT=3002`. Then open a second terminal in the project directory:

```bash
cd client
npm install
npm start
```

The frontend runs on port **3002**; the backend runs on **3001**. If changing the frontend origin, also update `ALLOWED_ORIGINS` in `server/.env` and restart the backend. For a different backend address, set `REACT_APP_API_URL` in `client/.env` and restart the frontend.

Open [http://localhost:3002](http://localhost:3002). Keep both processes running while using the app.

### 3. Generate a recipe

1. Enter your `APP_ACCESS_TOKEN` in the **App access token** field above the generator.
2. Type an ingredient and press **+** or Enter to add it. Repeat for each ingredient; use **X** to remove one.
3. Choose a meal type, enter a cuisine, and select a cooking time and difficulty.
4. Click **Generate Recipe**. The submitted preferences reset, and the generated recipe appears in the panel beside the form when the request completes.

For example, try chicken, rice, garlic, and lemon with **Dinner**, **Mediterranean**, **30–60 minutes**, and **Beginner-friendly**.

## API Reference

### `POST /recipe`

Requires these headers:

```http
Content-Type: application/json
Authorization: Bearer <your_app_access_token>
```

Accepts a JSON body containing the five recipe preferences. All fields are required strings. The frontend sends ingredients as a comma-separated string.

```json
{
  "ingredients": "chicken, rice, garlic, lemon",
  "mealType": "Dinner",
  "cuisine": "Mediterranean",
  "cookingTime": "30-60 minutes",
  "complexity": "Beginner"
}
```

**Success — `200 OK`**

```json
{
  "recipe": "Generated recipe text, including a name and cooking instructions..."
}
```

**Generation failure — `502 Bad Gateway`**

```json
{
  "error": "Failed to generate recipe"
}
```

Other request errors:

| Status | Meaning |
| --- | --- |
| `400` | Malformed JSON, missing or invalid preferences, or unsupported fields |
| `401` | Missing or incorrect app access token |
| `403` | Browser origin is not allowed |
| `413` | JSON body exceeds 8 KB |
| `415` | Content type is not JSON |
| `429` | Request, generation, or concurrency limit reached |

## Development Commands

Run these commands from `client/`:

| Command | Purpose |
| --- | --- |
| `npm start` | Start the React development server |
| `npm run build` | Create a production frontend build in `build/` |
| `npm test` | Run the frontend test runner |

The frontend still contains the default Create React App test, which looks for a “learn react” link absent from the current interface. It needs updating before it can validate CookAI. Run backend security tests with `npm test` from `server/`; they use a mock provider.

## Security

- **Backend-only OpenAI credentials:** Secrets are loaded from the server environment and are not included in the frontend bundle.
- **Protected recipe endpoint:** Bearer-token authentication and an explicit browser-origin allowlist guard recipe requests.
- **Bounded usage:** Each server process allows 20 total requests and 10 generation attempts per minute, with at most two simultaneous provider calls. Provider requests have a 30-second timeout, no automatic retries, and a 1,000-token completion cap.
- **Validated input:** The backend enforces an 8 KB JSON body limit, string length limits, supported preference values, and rejection of unknown fields.
- **Reduced logging exposure:** API keys, submitted preferences, generated recipes, and raw provider errors are not logged.
- **Secret-file protection:** Git ignore rules cover environment files, logs, dependencies, and common private-key files; placeholder `.env.example` files remain trackable.

See [SECURITY.md](SECURITY.md) for configuration and deployment guidance. These controls support a private demo; they do not replace a production authentication and usage-management system.

## Current Limitations

- **Shared access:** The app uses one shared token rather than individual accounts or sessions. Anyone holding that token can use the generation allowance.
- **Single-process rate limits:** Budgets are stored in memory and reset on restart. Multiple instances need a shared limiter; these limits do not impose a lifetime spending cap.
- **No saved recipes:** Preferences and generated recipes live in React state and are lost on reload.
- **Desktop layout:** The cards align and resize together, but the fixed-width columns still need a responsive layout for smaller screens.
- **Plain-text output:** Recipe line breaks are preserved, but Markdown headings and emphasis are displayed literally.
- **Generic provider errors:** OpenAI authentication, billing, model-access, and connection failures share the same user-facing generation-error message.
- **Incomplete frontend tests:** The frontend still has the default Create React App test; backend security tests use a mock provider and do not verify live model access or recipe quality.

Potential extensions include saved recipes, dietary filters, per-user accounts, Markdown rendering, and a responsive layout.
