import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Plus, Trash2, Save, Search, Code2, Copy, Check, X, ChevronDown, Lightbulb } from 'lucide-react';
import { useStore } from '../store';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CodeSnippetItem {
  id: string;
  title: string;
  language: string;
  code: string;
  description?: string;
  updated_at: number;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────
const LS_KEY = 'devflow_snippets_v2';
const loadLS = (): CodeSnippetItem[] => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
};
const saveLS = (s: CodeSnippetItem[]) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /* quota */ }
};
const tryIPC = async (method: string, ...args: any[]) => {
  try {
    const a = (window as any).api;
    if (a && typeof a[method] === 'function') return await a[method](...args);
  } catch { /* ignore */ }
  return null;
};

// ─── Language list ────────────────────────────────────────────────────────────
const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', color: '#f7df1e' },
  { value: 'typescript', label: 'TypeScript', color: '#3178c6' },
  { value: 'javascriptreact', label: 'React JSX', color: '#61dafb' },
  { value: 'typescriptreact', label: 'React TSX', color: '#61dafb' },
  { value: 'python', label: 'Python', color: '#3776ab' },
  { value: 'java', label: 'Java', color: '#b07219' },
  { value: 'csharp', label: 'C# / .NET', color: '#178600' },
  { value: 'cpp', label: 'C++', color: '#f34b7d' },
  { value: 'go', label: 'Go', color: '#00add8' },
  { value: 'rust', label: 'Rust', color: '#f34b1d' },
  { value: 'php', label: 'PHP', color: '#777bb4' },
  { value: 'ruby', label: 'Ruby', color: '#cc342d' },
  { value: 'swift', label: 'Swift', color: '#fa7343' },
  { value: 'kotlin', label: 'Kotlin', color: '#a97bff' },
  { value: 'sql', label: 'SQL', color: '#336791' },
  { value: 'shell', label: 'Shell/Bash', color: '#89e051' },
  { value: 'html', label: 'HTML', color: '#e34f26' },
  { value: 'css', label: 'CSS', color: '#264de4' },
  { value: 'json', label: 'JSON', color: '#8bc34a' },
  { value: 'yaml', label: 'YAML', color: '#cb171e' },
  { value: 'xml', label: 'XML', color: '#0060ac' },
  { value: 'markdown', label: 'Markdown', color: '#083fa1' },
  { value: 'dockerfile', label: 'Dockerfile', color: '#2496ed' },
  { value: 'graphql', label: 'GraphQL', color: '#e10098' },
];

// ─── Code templates per language ──────────────────────────────────────────────
const TEMPLATES: Record<string, { label: string; code: string }[]> = {
  javascript: [
    { label: 'Async Function', code: `async function fetchData(url) {\n  try {\n    const response = await fetch(url);\n    if (!response.ok) throw new Error(\`HTTP \${response.status}\`);\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error('Fetch error:', error);\n    throw error;\n  }\n}` },
    { label: 'Array Methods Chain', code: `const result = data\n  .filter(item => item.active)\n  .map(item => ({ ...item, label: item.name.toUpperCase() }))\n  .sort((a, b) => a.label.localeCompare(b.label))\n  .slice(0, 10);` },
    { label: 'Promise.all', code: `const [users, posts, comments] = await Promise.all([\n  fetch('/api/users').then(r => r.json()),\n  fetch('/api/posts').then(r => r.json()),\n  fetch('/api/comments').then(r => r.json()),\n]);` },
    { label: 'Event Listener', code: `document.addEventListener('DOMContentLoaded', () => {\n  const btn = document.getElementById('myBtn');\n  btn?.addEventListener('click', (e) => {\n    e.preventDefault();\n    console.log('Clicked!', e.target);\n  });\n});` },
    { label: 'Debounce Function', code: `function debounce(fn, delay = 300) {\n  let timer;\n  return function (...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn.apply(this, args), delay);\n  };\n}\n\nconst search = debounce((query) => console.log(query), 500);` },
  ],
  typescript: [
    { label: 'Generic Interface', code: `interface ApiResponse<T> {\n  data: T;\n  error: string | null;\n  status: number;\n  timestamp: Date;\n}\n\ntype User = {\n  id: string;\n  name: string;\n  email: string;\n  role: 'admin' | 'user' | 'guest';\n};` },
    { label: 'Generic Fetch Hook', code: `async function fetchData<T>(url: string): Promise<ApiResponse<T>> {\n  const response = await fetch(url);\n  if (!response.ok) {\n    return { data: null as T, error: response.statusText, status: response.status, timestamp: new Date() };\n  }\n  const data: T = await response.json();\n  return { data, error: null, status: 200, timestamp: new Date() };\n}` },
    { label: 'Enum + Type Guard', code: `enum Status {\n  Active = 'ACTIVE',\n  Inactive = 'INACTIVE',\n  Pending = 'PENDING',\n}\n\nfunction isActive(s: Status): s is Status.Active {\n  return s === Status.Active;\n}` },
    { label: 'Utility Types', code: `type PartialUser = Partial<User>;\ntype ReadonlyUser = Readonly<User>;\ntype UserKeys = keyof User;\ntype PickedUser = Pick<User, 'id' | 'name'>;\ntype OmitPassword = Omit<User, 'password'>;` },
  ],
  javascriptreact: [
    { label: 'React Functional Component', code: `import React, { useState, useEffect } from 'react';\n\ninterface Props {\n  title: string;\n  onClose: () => void;\n}\n\nexport const MyComponent: React.FC<Props> = ({ title, onClose }) => {\n  const [loading, setLoading] = useState(false);\n\n  useEffect(() => {\n    // Side effect\n    return () => { /* cleanup */ };\n  }, []);\n\n  return (\n    <div className="container">\n      <h1>{title}</h1>\n      <button onClick={onClose}>Close</button>\n    </div>\n  );\n};\nexport default MyComponent;` },
    { label: 'Custom Hook', code: `import { useState, useEffect } from 'react';\n\nexport function useFetch<T>(url: string) {\n  const [data, setData] = useState<T | null>(null);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState<Error | null>(null);\n\n  useEffect(() => {\n    let cancelled = false;\n    setLoading(true);\n    fetch(url)\n      .then(r => r.json())\n      .then(d => { if (!cancelled) setData(d); })\n      .catch(e => { if (!cancelled) setError(e); })\n      .finally(() => { if (!cancelled) setLoading(false); });\n    return () => { cancelled = true; };\n  }, [url]);\n\n  return { data, loading, error };\n}` },
    { label: 'Context Provider', code: `import React, { createContext, useContext, useState } from 'react';\n\ninterface ThemeContextType {\n  theme: 'light' | 'dark';\n  toggle: () => void;\n}\n\nconst ThemeContext = createContext<ThemeContextType | null>(null);\n\nexport const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {\n  const [theme, setTheme] = useState<'light' | 'dark'>('light');\n  return (\n    <ThemeContext.Provider value={{ theme, toggle: () => setTheme(t => t === 'light' ? 'dark' : 'light') }}>\n      {children}\n    </ThemeContext.Provider>\n  );\n};\n\nexport const useTheme = () => {\n  const ctx = useContext(ThemeContext);\n  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');\n  return ctx;\n};` },
  ],
  python: [
    { label: 'Dataclass', code: `from dataclasses import dataclass, field\nfrom typing import List, Optional\n\n@dataclass\nclass User:\n    id: int\n    name: str\n    email: str\n    tags: List[str] = field(default_factory=list)\n    role: Optional[str] = None\n\n    def __post_init__(self):\n        self.email = self.email.lower()` },
    { label: 'FastAPI Endpoint', code: `from fastapi import FastAPI, HTTPException, Depends\nfrom pydantic import BaseModel\n\napp = FastAPI()\n\nclass ItemCreate(BaseModel):\n    name: str\n    price: float\n    description: str = ""\n\n@app.post("/items", status_code=201)\nasync def create_item(item: ItemCreate):\n    # Save to DB...\n    return {"id": 1, **item.dict()}\n\n@app.get("/items/{item_id}")\nasync def get_item(item_id: int):\n    if item_id < 0:\n        raise HTTPException(status_code=404, detail="Item not found")\n    return {"id": item_id}` },
    { label: 'Async Context Manager', code: `import asyncio\nimport aiohttp\n\nasync def fetch_all(urls: list[str]) -> list[dict]:\n    async with aiohttp.ClientSession() as session:\n        tasks = [session.get(url) for url in urls]\n        responses = await asyncio.gather(*tasks)\n        return [await r.json() for r in responses]\n\nresults = asyncio.run(fetch_all(["https://api.example.com/a", "https://api.example.com/b"]))` },
    { label: 'List Comprehension', code: `# Filter and transform\neven_squares = [x**2 for x in range(20) if x % 2 == 0]\n\n# Nested comprehension\nmatrix = [[i * j for j in range(1, 6)] for i in range(1, 6)]\n\n# Dict comprehension\nword_lengths = {word: len(word) for word in ["hello", "world", "python"]}` },
  ],
  java: [
    { label: 'Spring Boot Controller', code: `import org.springframework.web.bind.annotation.*;\nimport org.springframework.http.ResponseEntity;\nimport java.util.List;\n\n@RestController\n@RequestMapping("/api/users")\n@CrossOrigin(origins = "*")\npublic class UserController {\n\n    private final UserService userService;\n\n    public UserController(UserService userService) {\n        this.userService = userService;\n    }\n\n    @GetMapping\n    public ResponseEntity<List<User>> getAll() {\n        return ResponseEntity.ok(userService.findAll());\n    }\n\n    @PostMapping\n    public ResponseEntity<User> create(@RequestBody @Valid UserRequest req) {\n        return ResponseEntity.status(201).body(userService.create(req));\n    }\n}` },
    { label: 'Java Stream API', code: `import java.util.stream.*;\nimport java.util.*;\n\nList<String> names = users.stream()\n    .filter(u -> u.isActive())\n    .map(User::getName)\n    .sorted()\n    .distinct()\n    .collect(Collectors.toList());\n\nMap<String, List<User>> byRole = users.stream()\n    .collect(Collectors.groupingBy(User::getRole));` },
    { label: 'Record Class (Java 16+)', code: `public record UserDto(String id, String name, String email) {\n    // Compact constructor for validation\n    public UserDto {\n        Objects.requireNonNull(id, "id cannot be null");\n        if (email == null || !email.contains("@")) {\n            throw new IllegalArgumentException("Invalid email");\n        }\n    }\n}` },
  ],
  csharp: [
    { label: 'ASP.NET Minimal API', code: `using Microsoft.AspNetCore.Mvc;\n\nvar builder = WebApplication.CreateBuilder(args);\nbuilder.Services.AddScoped<IUserService, UserService>();\nvar app = builder.Build();\n\napp.MapGet("/users", async (IUserService svc) =>\n    Results.Ok(await svc.GetAllAsync()));\n\napp.MapPost("/users", async ([FromBody] CreateUserDto dto, IUserService svc) => {\n    var user = await svc.CreateAsync(dto);\n    return Results.Created($"/users/{user.Id}", user);\n});\n\napp.Run();` },
    { label: 'LINQ Query', code: `var result = dbContext.Users\n    .Where(u => u.IsActive && u.CreatedAt > DateTime.UtcNow.AddDays(-30))\n    .OrderByDescending(u => u.CreatedAt)\n    .Select(u => new UserDto(u.Id, u.Name, u.Email))\n    .Take(20)\n    .ToListAsync();` },
    { label: 'Record Type', code: `public record UserDto(Guid Id, string Name, string Email);\n\npublic sealed record CreateUserRequest(\n    string Name,\n    string Email,\n    string Password\n) : IValidatable {\n    public bool IsValid() => !string.IsNullOrWhiteSpace(Name) && Email.Contains('@');\n}` },
  ],
  go: [
    { label: 'HTTP Handler', code: `package main\n\nimport (\n\t"encoding/json"\n\t"log"\n\t"net/http"\n)\n\ntype User struct {\n\tID   int    \`json:"id"\`\n\tName string \`json:"name"\`\n}\n\nfunc getUsers(w http.ResponseWriter, r *http.Request) {\n\tusers := []User{{1, "Alice"}, {2, "Bob"}}\n\tw.Header().Set("Content-Type", "application/json")\n\tjson.NewEncoder(w).Encode(users)\n}\n\nfunc main() {\n\thttp.HandleFunc("/users", getUsers)\n\tlog.Fatal(http.ListenAndServe(":8080", nil))\n}` },
    { label: 'Goroutine + Channel', code: `package main\n\nimport (\n\t"fmt"\n\t"sync"\n)\n\nfunc worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {\n\tdefer wg.Done()\n\tfor j := range jobs {\n\t\tresults <- j * j\n\t}\n}\n\nfunc main() {\n\tjobs := make(chan int, 10)\n\tresults := make(chan int, 10)\n\tvar wg sync.WaitGroup\n\n\tfor w := 1; w <= 3; w++ {\n\t\twg.Add(1)\n\t\tgo worker(w, jobs, results, &wg)\n\t}\n\n\tfor i := 1; i <= 9; i++ { jobs <- i }\n\tclose(jobs)\n\twg.Wait()\n\tclose(results)\n\n\tfor r := range results { fmt.Println(r) }\n}` },
  ],
  sql: [
    { label: 'CREATE TABLE', code: `CREATE TABLE users (\n  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  name        VARCHAR(100) NOT NULL,\n  email       VARCHAR(255) UNIQUE NOT NULL,\n  role        VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'guest')),\n  is_active   BOOLEAN DEFAULT TRUE,\n  created_at  TIMESTAMPTZ DEFAULT NOW(),\n  updated_at  TIMESTAMPTZ DEFAULT NOW()\n);\n\nCREATE INDEX idx_users_email ON users(email);\nCREATE INDEX idx_users_role  ON users(role) WHERE is_active = TRUE;` },
    { label: 'Complex JOIN Query', code: `SELECT\n  u.id,\n  u.name,\n  u.email,\n  COUNT(o.id)          AS order_count,\n  SUM(o.total_amount)  AS total_spent,\n  MAX(o.created_at)    AS last_order\nFROM users u\nLEFT JOIN orders o ON o.user_id = u.id\nWHERE u.is_active = TRUE\n  AND u.created_at > NOW() - INTERVAL '1 year'\nGROUP BY u.id, u.name, u.email\nHAVING COUNT(o.id) > 0\nORDER BY total_spent DESC\nLIMIT 50;` },
    { label: 'CTE + Window Function', code: `WITH ranked_sales AS (\n  SELECT\n    product_id,\n    sale_date,\n    amount,\n    ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY amount DESC) AS rank,\n    SUM(amount) OVER (PARTITION BY product_id) AS total_by_product\n  FROM sales\n  WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days'\n)\nSELECT * FROM ranked_sales WHERE rank <= 3;` },
  ],
  shell: [
    { label: 'Script Template', code: `#!/usr/bin/env bash\nset -euo pipefail\n\n# ── Config ────────────────────────────────────────\nSCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"\nLOG_FILE="/tmp/script.log"\n\n# ── Logging ───────────────────────────────────────\nlog() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }\nerror() { log "ERROR: $*" >&2; exit 1; }\n\n# ── Main ──────────────────────────────────────────\nmain() {\n  log "Starting script..."\n  [[ -z "${1:-}" ]] && error "Usage: $0 <argument>"\n  log "Done."\n}\n\nmain "$@"` },
    { label: 'Process All Files', code: `#!/usr/bin/env bash\nset -euo pipefail\n\nDIR="${1:-.}"\nEXT="${2:-.txt}"\n\nfind "$DIR" -name "*$EXT" -type f | while IFS= read -r file; do\n  echo "Processing: $file"\n  # Do something with $file\ndone\n\necho "Done processing $(find "$DIR" -name "*$EXT" | wc -l) files."` },
  ],
  html: [
    { label: 'HTML5 Boilerplate', code: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <meta name="description" content="Page description" />\n  <title>Page Title</title>\n  <link rel="stylesheet" href="styles.css" />\n</head>\n<body>\n  <header>\n    <nav aria-label="Main navigation">\n      <a href="/">Home</a>\n    </nav>\n  </header>\n\n  <main id="main-content">\n    <h1>Heading</h1>\n    <p>Content goes here.</p>\n  </main>\n\n  <footer>\n    <p>&copy; 2025</p>\n  </footer>\n\n  <script src="main.js" defer></script>\n</body>\n</html>` },
  ],
  css: [
    { label: 'CSS Variables & Reset', code: `:root {\n  --color-primary: #3b82f6;\n  --color-bg: #ffffff;\n  --color-text: #1e293b;\n  --radius: 8px;\n  --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);\n  --font-sans: 'Inter', system-ui, sans-serif;\n}\n\n*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\n\nbody {\n  font-family: var(--font-sans);\n  color: var(--color-text);\n  background: var(--color-bg);\n  line-height: 1.6;\n}` },
    { label: 'Flexbox Layout', code: `.container {\n  display: flex;\n  gap: 1rem;\n  flex-wrap: wrap;\n  align-items: flex-start;\n}\n\n.sidebar {\n  flex: 0 0 260px;\n}\n\n.main {\n  flex: 1;\n  min-width: 0;\n}` },
    { label: 'CSS Grid Layout', code: `.grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));\n  gap: 1.5rem;\n  padding: 1.5rem;\n}\n\n@media (max-width: 640px) {\n  .grid { grid-template-columns: 1fr; }\n}` },
  ],
  dockerfile: [
    { label: 'Node.js Dockerfile', code: `# Build stage\nFROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\nRUN npm run build\n\n# Production stage\nFROM node:20-alpine AS runner\nWORKDIR /app\nENV NODE_ENV=production\nCOPY --from=builder /app/dist ./dist\nCOPY --from=builder /app/node_modules ./node_modules\nEXPOSE 3000\nUSER node\nCMD ["node", "dist/main.js"]` },
  ],
};

// ─── Component ────────────────────────────────────────────────────────────────
export const CodeSnippets: React.FC = () => {
  const { theme } = useStore();
  const [snippets, setSnippets] = useState<CodeSnippetItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');
  const [copied, setCopied] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (templateRef.current && !templateRef.current.contains(e.target as Node)) setShowTemplates(false);
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) setShowLangMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    (async () => {
      const remote = await tryIPC('getCodeSnippets');
      if (Array.isArray(remote) && remote.length > 0) { setSnippets(remote); saveLS(remote); }
      else setSnippets(loadLS());
    })();
  }, []);

  const active = snippets.find(s => s.id === activeId);

  useEffect(() => {
    if (active) { setTitle(active.title); setLanguage(active.language); setCode(active.code); setDescription(active.description || ''); setSaveState('idle'); }
    else if (!activeId) { setTitle(''); setLanguage('javascript'); setCode(''); setDescription(''); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const doSave = useCallback((s: CodeSnippetItem) => {
    setSnippets(prev => {
      const u = prev.some(x => x.id === s.id) ? prev.map(x => x.id === s.id ? s : x) : [s, ...prev];
      saveLS(u); return u;
    });
    tryIPC('saveCodeSnippet', s);
  }, []);

  const handleSave = () => {
    if (!activeId || !title.trim()) return;
    const s: CodeSnippetItem = { id: activeId, title: title.trim(), language, code, description, updated_at: Date.now() };
    doSave(s);
    setSaveState('saved');
    setTimeout(() => setSaveState('idle'), 2000);
  };

  const handleCreate = () => {
    const id = `snip_${Date.now()}`;
    const s: CodeSnippetItem = { id, title: 'New Snippet', language: 'javascript', code: '// Start coding here\n', description: '', updated_at: Date.now() };
    setSnippets(prev => { const u = [s, ...prev]; saveLS(u); return u; });
    tryIPC('saveCodeSnippet', s);
    setActiveId(id);
    setTitle('New Snippet'); setLanguage('javascript'); setCode('// Start coding here\n'); setDescription('');
    setSaveState('idle');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this snippet?')) return;
    setSnippets(prev => { const u = prev.filter(s => s.id !== id); saveLS(u); return u; });
    tryIPC('deleteCodeSnippet', id);
    if (activeId === id) setActiveId(null);
  };

  const insertTemplate = (tpl: { label: string; code: string }) => {
    setCode(tpl.code);
    setTitle(tpl.label);
    setShowTemplates(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = snippets.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.language.toLowerCase().includes(search.toLowerCase())
  );

  const currentLang = LANGUAGES.find(l => l.value === language) || LANGUAGES[0];
  const templates = TEMPLATES[language] || [];

  const monacoTheme = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'vs-dark' : 'vs';

  return (
    <div className="flex h-full w-full overflow-hidden theme-bg-primary">
      {/* ── Left list pane ── */}
      <div className="w-72 border-r theme-border flex flex-col h-full theme-bg-secondary flex-shrink-0">
        <div className="p-4 border-b theme-border flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 size={15} className="text-[var(--accent-color)]" />
              <h3 className="text-sm font-bold theme-text-primary">Snippets</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-bg)] text-[var(--accent-color)] font-bold">{snippets.length}</span>
            </div>
            <button onClick={handleCreate} className="p-1.5 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors cursor-pointer shadow-sm" title="New Snippet">
              <Plus size={14} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-zinc-500" size={13} />
            <input
              type="text"
              placeholder="Search snippets..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs theme-text-primary theme-bg-primary border theme-border rounded-lg focus:border-[var(--accent-color)]/50 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
              <Code2 size={28} className="text-zinc-300" />
              <div>
                <p className="text-xs font-semibold theme-text-secondary">No snippets yet</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Click + to save your first snippet</p>
              </div>
              <button onClick={handleCreate} className="px-3 py-1.5 bg-[var(--accent-color)] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer">
                <Plus size={12} /> New Snippet
              </button>
            </div>
          ) : filtered.map(s => {
            const lang = LANGUAGES.find(l => l.value === s.language);
            const isActive = s.id === activeId;
            return (
              <div key={s.id} onClick={() => setActiveId(s.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all group ${isActive ? 'theme-bg-primary border-[var(--accent-color)]/40 shadow-sm' : 'border-transparent hover:theme-bg-primary hover:border-[var(--border-color)]'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: lang?.color || '#888' }} />
                    <span className={`text-xs font-semibold truncate ${isActive ? 'text-[var(--accent-color)]' : 'theme-text-primary'}`}>{s.title}</span>
                  </div>
                  <button onClick={e => handleDelete(s.id, e)} className="p-0.5 text-zinc-400 hover:text-rose-500 rounded cursor-pointer opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                    <X size={11} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded theme-bg-primary border theme-border" style={{ color: lang?.color || '#888' }}>{lang?.label || s.language}</span>
                  <span className="text-[9px] text-zinc-500">{new Date(s.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right editor pane ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden theme-bg-primary">
        {activeId ? (
          <>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b theme-border flex-shrink-0">
              <div className="flex flex-col gap-0.5 flex-grow min-w-0">
                <input
                  type="text"
                  placeholder="Snippet Title…"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="text-sm font-bold theme-text-primary bg-transparent focus:outline-none border-b-2 border-transparent focus:border-[var(--accent-color)]/40 px-1 py-0.5 transition-colors"
                />
                <input
                  type="text"
                  placeholder="Optional description…"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="text-[10px] text-zinc-500 bg-transparent focus:outline-none px-1"
                />
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Language selector dropdown */}
                <div className="relative" ref={langMenuRef}>
                  <button
                    onClick={() => { setShowLangMenu(v => !v); setShowTemplates(false); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold theme-bg-secondary border theme-border rounded-lg cursor-pointer hover:border-[var(--accent-color)]/50 transition-colors"
                    style={{ color: currentLang.color }}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: currentLang.color }} />
                    {currentLang.label}
                    <ChevronDown size={11} className={`transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {showLangMenu && (
                    <div className="absolute top-full left-0 mt-1 w-48 rounded-xl border theme-border theme-bg-primary shadow-xl z-50 overflow-hidden py-1 max-h-72 overflow-y-auto">
                      {LANGUAGES.map(lang => (
                        <button
                          key={lang.value}
                          onClick={() => { setLanguage(lang.value); setShowLangMenu(false); setShowTemplates(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium cursor-pointer transition-colors text-left ${language === lang.value ? 'bg-[var(--accent-bg)] text-[var(--accent-color)]' : 'theme-text-secondary hover:theme-bg-secondary'}`}
                        >
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: lang.color }} />
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Templates dropdown */}
                <div className="relative" ref={templateRef}>
                  <button
                    onClick={() => { setShowTemplates(v => !v); setShowLangMenu(false); }}
                    disabled={templates.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold theme-bg-secondary border theme-border rounded-lg cursor-pointer hover:border-[var(--accent-color)]/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed theme-text-secondary hover:text-[var(--accent-color)]"
                  >
                    <Lightbulb size={12} />
                    Templates
                    {templates.length > 0 && <span className="text-[10px] bg-[var(--accent-bg)] text-[var(--accent-color)] px-1 rounded-full">{templates.length}</span>}
                    <ChevronDown size={11} className={`transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
                  </button>
                  {showTemplates && templates.length > 0 && (
                    <div className="absolute top-full right-0 mt-1 w-60 rounded-xl border theme-border theme-bg-primary shadow-xl z-50 overflow-hidden py-1">
                      <p className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b theme-border">{currentLang.label} Templates</p>
                      {templates.map((tpl, i) => (
                        <button
                          key={i}
                          onClick={() => insertTemplate(tpl)}
                          className="w-full flex flex-col items-start gap-0.5 px-3 py-2.5 text-left cursor-pointer hover:bg-[var(--accent-bg)] transition-colors"
                        >
                          <span className="text-xs font-semibold theme-text-primary">{tpl.label}</span>
                          <span className="text-[10px] text-zinc-500 truncate w-full">{tpl.code.split('\n')[0].slice(0, 45)}…</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="w-px h-5 bg-[var(--border-color)]" />

                <button onClick={handleCopy} className="px-3 py-1.5 text-xs font-bold theme-bg-secondary theme-text-secondary border theme-border rounded-lg flex items-center gap-1.5 cursor-pointer hover:border-[var(--accent-color)]/50 transition-colors">
                  {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>

                <button
                  onClick={handleSave}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm ${saveState === 'saved' ? 'bg-emerald-500 text-white' : 'bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white'}`}
                >
                  {saveState === 'saved' ? <Check size={12} /> : <Save size={12} />}
                  {saveState === 'saved' ? 'Saved!' : 'Save'}
                </button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                language={language === 'javascriptreact' ? 'javascript' : language === 'typescriptreact' ? 'typescript' : language}
                theme={monacoTheme}
                value={code}
                onChange={v => setCode(v || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', Monaco, monospace",
                  fontLigatures: true,
                  lineNumbers: 'on',
                  padding: { top: 12, bottom: 12 },
                  automaticLayout: true,
                  wordWrap: 'on',
                  renderLineHighlight: 'gutter',
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  tabSize: 2,
                  scrollbar: { vertical: 'auto', horizontal: 'auto' },
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: true,
                  parameterHints: { enabled: true },
                  bracketPairColorization: { enabled: true },
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center select-none gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent-bg)] border border-[var(--accent-color)]/20 flex items-center justify-center">
              <Code2 size={28} className="text-[var(--accent-color)]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold theme-text-primary">No Snippet Selected</p>
              <p className="text-xs text-zinc-500 mt-1">Select a snippet or create a new one with +</p>
            </div>
            <button onClick={handleCreate} className="px-4 py-2 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-sm">
              <Plus size={14} /> New Snippet
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default CodeSnippets;
