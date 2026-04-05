# ▶️ How to Run FundVision Pro on Windows

---

## ✅ STEP 1 — Create your .env file

Copy `.env.example` to `.env`:
```powershell
copy .env.example .env
```

Then open `.env` in Notepad and fill in:
- `DB_PASSWORD=` your MySQL root password
- `SECRET_KEY=` run this and paste the output:
  ```powershell
  python -c "import secrets; print(secrets.token_hex(32))"
  ```
- `ANTHROPIC_API_KEY=` your key from console.anthropic.com (needed for AI features)

---

## ✅ STEP 2 — Import the MySQL schema

> ⚠️ PowerShell does NOT support `<` redirection. Use `cmd` or the mysql `source` command instead.

**Option A — Use cmd.exe:**
```cmd
cmd /c "mysql -u root -p fundvision < schema.sql"
```

**Option B — Use mysql source command (works in PowerShell):**
```powershell
mysql -u root -p fundvision -e "source schema.sql"
```

**Option C — Full path (most reliable):**
```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS fundvision; USE fundvision; source schema.sql;"
```

---

## ✅ STEP 3 — Create and activate a virtual environment

```powershell
python -m venv venv
.\venv\Scripts\activate
```

Your prompt should now show `(venv)`.

---

## ✅ STEP 4 — Install Python dependencies

```powershell
pip install -r requirements.txt
```

If you get a numpy build error, install a pre-built wheel:
```powershell
pip install numpy --only-binary=:all:
pip install -r requirements.txt
```

---

## ✅ STEP 5 — Start the Backend (Terminal 1, keep open)

```powershell
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     ✅ Database tables verified.
```

API docs: http://localhost:8000/api/docs

---

## ✅ STEP 6 — Start the Frontend (Terminal 2, keep open)

```powershell
cd frontend
npm install
npm run dev
```

Open: **http://localhost:5173**

---

## ⚠️ Common Errors & Fixes

| Error | Fix |
|---|---|
| `ECONNREFUSED` on frontend | Backend not running — do Step 5 first |
| `The '<' operator is reserved` | Use `cmd /c "mysql ... < schema.sql"` instead |
| `ALLOWED_ORIGINS` parse error | Make sure `.env` has comma-separated origins, no brackets |
| `numpy` build fails | Run `pip install numpy --only-binary=:all:` first |
| `Can't create database, exists` | Safe to ignore — DB already exists |
| `ModuleNotFoundError: aiomysql` | Run `pip install aiomysql` |
| `HTTP 500` on register | Check the backend terminal window for the real traceback |

