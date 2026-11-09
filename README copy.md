# The Library — MERN + Supabase EPUB shelf

React (Vite) front end, Express API, Supabase Postgres + Storage.
Each genre you create becomes one slab on a dark bookcase; uploaded books stand on the slab of their genre.

## 1. Supabase
1. Create a project at supabase.com.
2. SQL Editor -> paste and run `supabase.sql` (creates tables + a public `library` storage bucket).
3. Settings -> API: copy the **Project URL** and the **service_role** key.

## 2. Configure
```bash
cp server/.env.example server/.env     # fill SUPABASE_URL and SUPABASE_SERVICE_KEY
```

## 3. Run
```bash
npm run install:all
npm run dev
```
Open http://localhost:5173 → "Manage genres" → add genres → "Add a book".

Requires Node 20+ (the server uses `--env-file`).

## Notes
- Title, author and cover are read from the EPUB automatically; you can override title/author while uploading.
- Reading position is remembered per book (browser localStorage).
- There is no login. Anyone who can reach the site can add or delete books. Add auth before deploying publicly.
- Never put the service_role key in the client code.
- Production: `npm run build --prefix client`, host `client/dist` anywhere, set `VITE_API_URL` and `CLIENT_ORIGIN`.
