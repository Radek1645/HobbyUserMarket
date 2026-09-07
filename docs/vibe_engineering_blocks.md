# Vibe Engineering Blocks (54 Building Blocks for AI Builders)

Tento rozšířený seznam obsahuje původních 47 stavebních bloků z e-knihy *Vibe Engineering Blocks* od Hasana doplněných o 7 pokročilých produkčních bloků. Každý blok obsahuje český význam, stručný popis a přesný prompt (*Tell the AI*), který můžeš rovnou předat svému AI agentovi (Claude, Cursor, Windsurf).

---

## Part 1. Plan before you build

### 01. Plan first
* **Popis:** Write the spec before the code. Místo bezhlavého generování kódu nejdřív uzamkni rozhodnutí a architekturu.
* **Prompt pro AI:** `In a fresh chat: "Let's discuss and plan the [feature]." Go back and forth until it's exactly right, run /grill-me to catch what you missed, then save the plan as a step-by-step.md to build from in a new session.`

### 02. MVP
* **Popis:** Ship the smallest useful version first. Osekat funkci na naprosté minimum, vydat to a učit se z reálného provozu.
* **Prompt pro AI:** `Cut this feature list down to the smallest version that's genuinely useful, then sequence the rest for later.`

---

## Part 2. Set up the project right

### 03. Git
* **Popis:** Version control, rewind any change. Záchranný bod pro jakoukoliv změnu, možnost se kdykoliv vrátit k funkční verzi.
* **Prompt pro AI:** `Set up Git and GitHub for my project: a sensible .gitignore, a simple branch workflow, and push commits to a private repo as backup.`

### 04. Lockfiles
* **Popis:** Pin exact versions so installs match everywhere. Zamčení přesných verzí balíčků, aby aplikace fungovala stejně na všech strojích.
* **Prompt pro AI:** `Check my dependency setup: am I locking exact versions, and are any of my packages unmaintained or risky?`

### 05. venv
* **Popis:** Each project, its own package box. Izolované prostředí pro každý projekt, aby se nepopraly závislosti a verze knihoven.
* **Prompt pro AI:** `Set up a virtual environment for this project and show me how to activate it and install packages into it.`

### 06. Env vars
* **Popis:** Keep settings out of your code. Konfigurace a nastavení patří mimo kód do souboru `.env`, v kódu zůstává jen validovaný config object.
* **Prompt pro AI:** `Audit my repo for hardcoded settings that should be environment variables, centralize them into one validated config object, and generate a complete .env.example.`

### 07. Secrets
* **Popis:** Keep them out of code, git, and logs. Tajné klíče (API keys, hesla) nesmí projít do gitu ani do logů (maskování na `sk-live-***`).
* **Prompt pro AI:** `Scan my code and git history for leaked secrets, then show me how to store them safely and redact them in logs and error output.`

---

## Part 3. Build with AI

### 08. CLAUDE.md
* **Popis:** The rules file the AI reads every session. Soubor s pravidly architektury na kořeni projektu, který AI čte na začátku každé relace.
* **Prompt pro AI:** `Generate a CLAUDE.md that captures my architecture rules and conventions, so your future edits fit my codebase.`

### 09. Agent memory
* **Popis:** Facts the AI keeps across sessions. Soubor s pamětí, kam si AI ukládá klíčová fakta o projektu pro budoucí relace.
* **Prompt pro AI:** `Set up a memory file convention so you save and recall key project facts across sessions.`

### 10. Skills
* **Popis:** Package a procedure the AI can run. Zabalení opakovaného vícekrokového postupu do znovupoužitelného příkazu (SKILL.md).
* **Prompt pro AI:** `Turn this repeatable procedure into a SKILL.md I can invoke, including the steps and the tools each one needs.`

---

## Part 4. Keep the code clean

### 11. Modularity
* **Popis:** Small files that each do one job. Malé soubory s jedinou zodpovědností. Pravidlo: nad ~600 řádků rozdělit.
* **Prompt pro AI:** `Review my structure for modularity: which files do too much, and how should I split them along responsibility seams?`

### 12. Separation
* **Popis:** Separation of concerns: keep UI, logic, and data apart. Oddělení uživatelského rozhraní, business logiky a databázové vrstvy.
* **Prompt pro AI:** `Show me where my UI, business logic, and data access are tangled together, and how to split them into clean layers.`

---

## Part 5. Data: store it well

### 13. JSON
* **Popis:** Structured data any system can read. Standardní formát pro výměnu dat mezi API a vykreslování v UI + validace.
* **Prompt pro AI:** `Show me the JSON shape this API returns, and add validation so a malformed response is caught early.`

### 14. SQL
* **Popis:** Ask a database for exactly what you want. Deklarativní dotazování relacni databáze o přesná data bez tahání zbytečností.
* **Prompt pro AI:** `Write the SQL to get what I want from my database, and explain the query and any indexes it needs.`

### 15. Data modeling
* **Popis:** Design your tables and how they link. Návrh tabulek bez duplicit – každá entita na jednom místě, propojené přes ID (relace).
* **Prompt pro AI:** `Review my data model for duplication, missing relationships, and fields that will hurt me later.`

### 16. Migrations
* **Popis:** Versioned schema changes, in order. Verzované skripty pro změny databázového schématu spouštěné ve stejném pořadí na všech prostředích.
* **Prompt pro AI:** `Set up a migration workflow for my database and show me how to make a safe schema change.`

### 17. Transactions
* **Popis:** All steps save together, or none do. Skupina operací (např. odečíst z A, připsat na B), která se buď provede celá (Commit), nebo vůbec (Rollback).
* **Prompt pro AI:** `Show me the multi-step writes in my app that should be wrapped in a transaction but aren't.`

### 18. Indexing
* **Popis:** Jump to the rows instead of scanning. Vytvoření indexu nad vyhledávanými sloupci pro přímý skok místo sekvenčního průchodu milionem řádků.
* **Prompt pro AI:** `Find my slowest or most frequent queries and tell me exactly which indexes to add.`

### 19. N+1 queries
* **Popis:** Don't fire one query per row. Past, kdy se pro N záznamů volá N samostatných dotazů do databáze místo jednoho dávkového (batching / eager-loading).
* **Prompt pro AI:** `Scan my code for N+1 query patterns and show me how to batch or eager-load them.`

### 20. NoSQL
* **Popis:** MongoDB, and data that won't fit a table. Dokladové databáze pro proměnlivé, zanořené nebo dynamické datové struktury bez pevného schématu.
* **Prompt pro AI:** `Is MongoDB or a relational DB the better fit for my data shape and access patterns? Justify it.`

---

## Part 6. Lock the doors (security)

### 21. TLS
* **Popis:** The padlock behind HTTPS. Šifrování komunikace mezi prohlížečem a serverem v tranzitu.
* **Prompt pro AI:** `Make sure my app enforces HTTPS everywhere, with HSTS, redirects, and secure cookies, and flag any mixed content.`

### 22. Input validation
* **Popis:** Check every request against a schema first. Validace všech vstupů na hranici aplikace (schema validation) dřív, než se spustí aplikační logika.
* **Prompt pro AI:** `Add schema validation to every input boundary so malformed requests are rejected before my logic runs.`

### 23. XSS
* **Popis:** Cross-site scripting. Ochrana proti spuštění cizího škodlivého kódu (JavaScriptu) v prohlížeči uživatele skrze neošetřený vstup.
* **Prompt pro AI:** `Audit my app for XSS: where does user input reach the page unescaped, and how do I fix it?`

### 24. CSRF
* **Popis:** Cross-site request forgery. Ochrana před podvržením požadavku ze cizí stránky s využitím přihlášené relace (cookies) uživatele.
* **Prompt pro AI:** `Check my CSRF protection on cookie-authenticated routes and fix any gaps.`

### 25. CORS
* **Popis:** Cross-origin resource sharing. Nastavení pravidel, ze kterých domén smí prohlížeč přistupovat k vašemu API.
* **Prompt pro AI:** `Configure CORS for my API and frontend origins without opening it up to everyone.`

### 26. SSRF
* **Popis:** Server-side request forgery. Ochrana před situací, kdy útočník donutí váš server stahovat interní/privátní IP adresy a vyzrazovat tajné klíče.
* **Prompt pro AI:** `I fetch user-supplied URLs. Add an SSRF guard that blocks private IPs and unsafe schemes, re-checked when the address resolves.`

### 27. Hashing
* **Popis:** A one-way fingerprint. Jednosměrný otisk pro ukládání hesel (bcrypt, argon2) – v databázi nikdy nesmí být čistý text.
* **Prompt pro AI:** `Am I hashing passwords correctly (algorithm, salt, work factor)? Review my auth storage.`

### 28. Authentication
* **Popis:** Proving who you are. Ověření identity (email/heslo) a vydání session tokenu pro navazující požadavky.
* **Prompt pro AI:** `Review my authentication: am I verifying credentials and issuing sessions or tokens securely?`

### 29. Authorization
* **Popis:** What you're allowed to do. Kontrola oprávnění a vlastnictví záznamu (role, RBAC) při každé akci. Přihlášený automaticky neznamená oprávněný.
* **Prompt pro AI:** `Check my authorization: does every protected action verify the user's role and that they own the record?`

### 30. Brute force
* **Popis:** Lock out repeated password guessing. Blokování opakovaných neúspěšných pokusů o přihlášení (dovolených např. 5 pokusů, pak cooldown).
* **Prompt pro AI:** `Add brute-force lockout to my login with sensible thresholds and a cooldown.`

---

## Part 7. Don't fall over (reliability & concurrency)

### 31. Timeouts
* **Popis:** Don't wait forever on a dead call. Nastavení časového limitu pro vnější volání, aby jeden zamrzlý požadavek nezablokoval celý server.
* **Prompt pro AI:** `Find every outbound call in my code without a timeout and add sensible ones.`

### 32. Retry
* **Popis:** With backoff: wait longer each time. Opakování neúspěšných síťových volání s postupně se prodlužující pauzou (exponential backoff).
* **Prompt pro AI:** `Add retry-with-backoff to my flaky external calls, but only where it's safe to retry.`

### 33. Circuit breaker
* **Popis:** Stop calling a dead service. Automatické odpojení nefunkční externí služby při opakovaných chybách, aby se dala do pořádku a neplýtvalo se zdroji.
* **Prompt pro AI:** `Find the outbound calls that need a circuit breaker and implement one with sensible thresholds.`

### 34. Error handling
* **Popis:** Decide what happens when things break. Zachytávání chyb – detailní log pro vás, přívětivá a bezpečná hláška pro uživatele.
* **Prompt pro AI:** `Review my error handling: where am I swallowing errors or leaking internal details to users?`

### 35. Race conditions
* **Popis:** Two requests, one resource. Souběžný přístup ke stejnému zdroji (např. prodání jednoho kusu zboží dvakrát). Řeší se atomickými operacemi a transakcemi.
* **Prompt pro AI:** `Show me where concurrent requests can race on shared data, and make those updates atomic.`

---

## Part 8. Fast at scale (performance)

### 36. Background jobs
* **Popis:** Do slow work off to the side. Přesun pomalých úloh (odesílání emailů, generování PDF) do fronty na pozadí mimo hlavní webový požadavek.
* **Prompt pro AI:** `Which operations should move to a background queue? Set one up and migrate them.`

### 37. Caching
* **Popis:** Do the work once, reuse it. Uložení výsledků náročných dotazů do paměti (Redis, in-memory) s nastavenou dobou platnosti (TTL).
* **Prompt pro AI:** `Find my most expensive repeated operations and add caching with a sensible TTL and invalidation.`

### 38. Rate limiting
* **Popis:** Cap requests per caller. Omezení počtu požadavků na uživatele nebo IP adresu v daném čase (ochrana před přetížením a vysokým účtem za servery).
* **Prompt pro AI:** `Add per-user and per-IP rate limiting to my public endpoints.`

### 39. Pagination
* **Popis:** Hand back data in pages. Stránkování velkých datových sad (po 20 záznamech) místo načítání tisíců řádků najednou.
* **Prompt pro AI:** `Add pagination to my list endpoints and pick cursor vs offset for my use case.`

---

## Part 9. See what's happening (observability)

### 40. Error tracking
* **Popis:** Every crash in one place. Centralizované sledování chyb v produkci (např. Sentry) s plným kontextem (kdo, kde, co dělal).
* **Prompt pro AI:** `Set up centralized error tracking that captures exceptions with context but shows users a safe message.`

### 41. Structured logs
* **Popis:** Logs you can actually search. Logování ve strukturovaném formátu (JSON) s automatickým přidáváním request_id a user_id pro snadné vyhledávání.
* **Prompt pro AI:** `Convert my logging to structured JSON that carries request and user context automatically.`

---

## Part 10. Ship it & go live

### 42. Testing
* **Popis:** Catch the break before your users do. Automatické jednotkové a integrační testy pro ověření funkčnosti při každé změně.
* **Prompt pro AI:** `Write unit and integration tests for my critical paths and tell me where coverage is weakest.`

### 43. CI/CD
* **Popis:** Push the code, the robot ships it. Automatizovaný kanál, který při pushnutí kódu sestaví aplikaci, pustí testy a nasadí ji na server.
* **Prompt pro AI:** `Set up a CI/CD pipeline that auto-deploys my app on green builds to my platform.`

### 44. Domain & DNS
* **Popis:** The name, pointed at your server. Nastavení DNS záznamů (A, CNAME, MX) pro nasměrování domény na IP adresu serveru a zabezpečení.
* **Prompt pro AI:** `Walk me through pointing my domain at my host, including the DNS records I need and why.`

---

## Part 11. A few more blocks

### 45. Unified interface
* **Popis:** One layer in front, automatic failover. Jednotné rozhraní před externími poskytovateli (např. AI modely) s automatickým přepnutím na záložního dodavatele při výpadku.
* **Prompt pro AI:** `Wrap my provider integration behind an adapter interface so I can swap or add a fallback later.`

### 46. Playwright
* **Popis:** Test your app like a real user. End-to-end testování v reálném prohlížeči (klikání, přihlášení, nakupování, screenshoty pro kontrolu UI).
* **Prompt pro AI:** `Add Playwright end-to-end tests that click through my critical flows in a real browser, and use it to screenshot and verify changes.`

### 47. MCP
* **Popis:** Give your AI agent real tools. Model Context Protocol – standard pro připojení reálných nástrojů (vyhledávání, vygenerování obrázku, přístup k databázi) přímo k AI agentovi.
* **Prompt pro AI:** `Which MCP tools would make you more effective on this project? Help me wire them up.`

---

## Part 12. Production Readiness & Modern Stack (Doplněné bloky)

### 48. Connection Pooling
* **Popis:** Serverless DB connection manager. Správa databázových spojení pro serverless (PgBouncer, Supabase Pooler), aby souběžné požadavky nevyčerpaly limity databáze.
* **Prompt pro AI:** `Configure database connection pooling for serverless execution environments to prevent connection exhaustion.`

### 49. Idempotency Keys
* **Popis:** Prevent double-execution on retries. Unikátní klíč u plateb a zápisových operací, který zajistí, že se opakovaný požadavek po síťové chybě provede právě jednou.
* **Prompt pro AI:** `Add idempotency key validation to critical non-idempotent endpoints (payments, orders) to ensure retried requests execute exactly once.`

### 50. Webhook Signature Verification
* **Popis:** Verify external HTTP payloads. Kryptografické ověření podpisu příchozích webhooků (Stripe, GoPay) pomocí sdíleného secretu před zpracováním dat.
* **Prompt pro AI:** `Implement signature verification for all incoming webhooks using the provider's signing secret before processing payloads.`

### 51. Health Checks & Readiness Probes
* **Popis:** Monitor core stack status. Endpoint (`/api/health`), který aktivně testuje funkčnost databáze a externích závislostí a vrací 200 OK nebo 503 Service Unavailable.
* **Prompt pro AI:** `Add a /api/health endpoint that validates active database connections and essential external dependencies, returning 200 OK or 503 Service Unavailable.`

### 52. Feature Flags
* **Popis:** Toggle features dynamically. Možnost zapínat a vypínat funkce v aplikaci v reálném čase bez nutnosti provádět nový deployment kódu.
* **Prompt pro AI:** `Wrap this new feature in a feature flag strategy so it can be enabled or disabled dynamically without a code redeploy.`

### 53. Soft Deletes & Data Retention
* **Popis:** Preserve audit history safely. Příznak `deleted_at` místo okamžitého smažení z DB pro zachování integrity relací, auditu a řízenou skartaci.
* **Prompt pro AI:** `Implement soft deletes with a deleted_at timestamp for user records, and set up an automated purge process for hard-deleting expired data.`

### 54. Product Telemetry & Funnel Tracking
* **Popis:** Capture user funnel actions. Měření klíčových kroků uživatele v aplikaci (registrace, checkout, drop-off) s ohledem na soukromí pro vyhodnocování produktu.
* **Prompt pro AI:** `Add privacy-compliant event tracking to key business funnel steps (signup, checkout, retention actions) to capture user drop-off points.`
