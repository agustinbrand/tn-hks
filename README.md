# Codex Bundle App for Tiendanube

Public Tiendanube application that transforms the existing bundle snippet into a managed, configurable app with:

- OAuth installation and embedded admin powered by Express + PostgreSQL
- React dashboard to configure pack labels, descuentos, colores y complementarios
- Storefront script (ES5 compatible) injected via ScriptTag that renders the bundle UI and handles cart logic
- Webhook + ScriptTag lifecycle management and clean uninstall

## Monorepo structure

```
tiendanube-bundle-app/
├─ packages/
│  ├─ server/         # Node/Express backend (OAuth, APIs, webhooks, script delivery)
│  ├─ admin/          # React embedded admin built with Vite
│  └─ storefront/     # Storefront bundle script, compiled with esbuild
├─ .env.example       # Environment variable template
└─ README.md
```

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   npm install --workspace packages/server
   npm install --workspace packages/admin
   npm install --workspace packages/storefront
   ```

2. **Create `.env`**

   Copy `.env.example` into `.env` and fill the values provided by Tiendanube (Client ID, Client Secret, scopes, redirect URL) plus your Postgres connection string and a strong `SESSION_JWT_SECRET`.

3. **Prepare PostgreSQL**

   The server runs lightweight migrations on boot (tables: `stores`, `store_tokens`, `bundle_configs`). Make sure the database exists and the user has rights to create tables.

4. **Build storefront script**

   ```bash
   npm run build --workspace packages/storefront
   ```

   The output goes to `packages/storefront/dist/bundle.js`, served at `/public/bundle.js`.

5. **Run backend (development)**

   ```bash
   npm run dev --workspace packages/server
   ```

   Express listens on `PORT` (defaults to `3000`). During development you can proxy `/auth`, `/api`, `/public` requests from Vite by setting `VITE_DEV_SERVER_PROXY=http://localhost:3000` and starting the admin app as well.

6. **Run admin app**

   ```bash
   npm run dev --workspace packages/admin
   ```

   Configure your Tiendanube app’s embedded URL to point to your local tunnel (e.g. `https://<ngrok>/admin`). The admin app authenticates via `/auth/launch` and exchanges the signature for a session JWT stored in `localStorage`.

7. **Production build**

   ```bash
   npm run build --workspace packages/storefront
   npm run build --workspace packages/admin
   npm run build --workspace packages/server
   ```

   Deploy the `packages/server` dist along with static assets:

   - Serve `packages/admin/dist` from your CDN and set the embedded URL to `https://your-domain.com/admin`.
   - Configure Express to serve admin assets (add `app.use("/admin", express.static(...))`) before deploying.

## OAuth flow & app lifecycle

1. Merchant clicks “Instalar” from the App Store → `GET /auth/install?store_id=…&permanent_domain=…`
2. We redirect to Tiendanube’s OAuth screen with a `state` JWT containing store metadata.
3. `GET /auth/callback` exchanges the code for an access token, persists store + token, registers ScriptTag + webhooks, then redirects to `/admin?session=<JWT>`.
4. Embedded admin reads the session token (or uses `/auth/launch` when opened from the App Bridge) and interacts with `/api/**`.
5. Storefront loads `/public/bundle.js?store_id=…`, detects the product ID, fetches configuration through `/public/config`, and renders the bundle module.
6. `app/uninstalled` webhook cleans up database records.

## Key backend endpoints

- `GET /auth/install` · OAuth entry point  
- `GET /auth/callback` · Token exchange  
- `GET /auth/launch` · Validates Tiendanube signature and returns a session JWT  
- `GET /api/session` · Returns store metadata for the admin UI  
- `GET /api/products` · Thin proxy to list products (used for pickers)  
- `GET/POST /api/bundles/:productId` · Load and store bundle configuration  
- `GET /public/config` · Returns storefront-ready bundle data (including fresh complementary product details)  
- `GET /public/bundle.js` · Serves the compiled script  
- `POST /webhooks/*` · Webhook receivers (`app-uninstalled`, `products-update`, etc.)

## Configuration schema

Bundle configs are stored per `store_id + product_id` and include:

- Texts (heading, CTA, helper, errors)  
- Pack definitions: units, labels, subheadlines, discount, badges  
- Free shipping threshold + badge text  
- Color palette (primary, hover, success)  
- Complementary product IDs + cached names/images  
- Rendering options (`inside` vs `bottom`)

The storefront endpoint enriches complementaries with live product data to ensure prices/variants remain in sync.

## Deployment checklist

1. Provision Postgres, S3 (optional for admin assets), HTTPS certificate.  
2. Configure environment variables in your hosting provider.  
3. Set Tiendanube app URLs:  
   - Installation URL -> `https://your-domain.com/auth/install`  
   - Callback URL -> `https://your-domain.com/auth/callback`  
   - Embedded admin URL -> `https://your-domain.com/admin` (serve `packages/admin/dist`).  
4. Add `APP_WEBHOOK_SECRET` in Tiendanube partner panel and match it in `.env`.  
5. Build and deploy all packages.  
6. Test end-to-end on a staging storefront: install, configure bundle, verify storefront injection, uninstall.  
7. Prepare App Store listing (screenshots, pricing, support info, privacy policy).  
8. Submit for Tiendanube review.

## Extending

- Implement Billing API integration for paid tiers.  
- Add analytics (events when bundles are added).  
- Localize admin + storefront strings for Portuguese.  
- Cache `/public/config` responses with Redis/CDN to reduce API calls.  
- Generate email alerts when product variants go out of stock.

---

With this scaffold you can migrate the original `mod-codex.tpl` functionality into a maintainable native Tiendanube app. Follow the checklist in the summary to complete deployment and certification. ¡Éxitos! 💪🛍️
