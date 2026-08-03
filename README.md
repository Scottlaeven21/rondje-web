# Rondje — landingssite

Statische marketingsite voor **Rondje** (domein: `rond-je.nl`), in de stijl van
getcino.com maar met de eigen merkidentiteit (paars `#7C3AED` → oranje `#F97316`).

Geen build-stap, geen dependencies — puur HTML/CSS/JS.

## Structuur

```
rondje-web/
├─ index.html          # alle secties (hero, hoe-werkt-het, functies, FAQ, ...)
├─ styles.css          # styling + responsive
├─ script.js           # mobiel menu, nav-schaduw, FAQ-accordion
└─ assets/
   ├─ logo-mark.svg    # icoon (klinkende glazen in merkgradient) — favicon/app-icon/OG
   ├─ logo.svg         # horizontaal logo (icoon + woordmerk)
   └─ favicon.svg      # favicon
```

## Lokaal bekijken

Elke statische server werkt, bijvoorbeeld:

```bash
npx serve .
# of
npx http-server .
```

Open daarna de getoonde `http://localhost:...` URL.

## Deployen op rond-je.nl

De site is volledig statisch, dus te hosten op elke statische host:

- **Vercel / Netlify / Cloudflare Pages**: sleep de map erin of koppel de repo;
  build command leeg laten, output = deze map. Koppel daarna het domein `rond-je.nl`.
- **Klassieke webhosting (FTP)**: upload de inhoud van `rondje-web/` naar de webroot
  (`public_html`).

## Nog te doen / aandachtspunten

- **App Store / Google Play links**: de download-knoppen wijzen nu naar `#`.
  Vervang de `href="#"` in `index.html` zodra de store-URL's bekend zijn.
- **/privacy en /terms**: footer linkt hiernaartoe — voeg die pagina's toe
  (of hergebruik de teksten uit de app: `PrivacyPolicyScreen` / `TermsScreen`).
- **Contact-e-mail**: staat op `hallo@rond-je.nl` — pas aan indien anders.
- **OG-afbeelding**: verwijst nu naar `logo-mark.svg`. Voor mooiere social-previews
  kun je een 1200×630 PNG-share-image toevoegen en de `og:image` bijwerken.
