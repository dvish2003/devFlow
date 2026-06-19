/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Plus, Trash2, Save, Search, Code2, Copy, Check, X, ChevronDown, Lightbulb } from 'lucide-react';
import { useStore } from '../store';
import type { CodeSnippetItem } from '../types';

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
    { label: 'Class with Private Fields', code: `class EventEmitter {\n  #listeners = new Map();\n\n  on(event, callback) {\n    if (!this.#listeners.has(event)) this.#listeners.set(event, []);\n    this.#listeners.get(event).push(callback);\n    return this;\n  }\n\n  emit(event, ...args) {\n    (this.#listeners.get(event) || []).forEach(cb => cb(...args));\n  }\n}` },
    { label: 'Custom Error Class', code: `class ValidationError extends Error {\n  constructor(message, field) {\n    super(message);\n    this.name = 'ValidationError';\n    this.field = field;\n  }\n}\n\ntry {\n  throw new ValidationError('Email is required', 'email');\n} catch (err) {\n  if (err instanceof ValidationError) {\n    console.error(\`\${err.field}: \${err.message}\`);\n  }\n}` },
    { label: 'Regex Validation', code: `const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;\nconst isValidEmail = (email) => emailRegex.test(email);\n\nconst text = 'Contact: alice@example.com, bob@example.org';\nconst emails = text.match(/[^\\s,]+@[^\\s,]+/g);` },
  ],
  typescript: [
    { label: 'Generic Interface', code: `interface ApiResponse<T> {\n  data: T;\n  error: string | null;\n  status: number;\n  timestamp: Date;\n}\n\ntype User = {\n  id: string;\n  name: string;\n  email: string;\n  role: 'admin' | 'user' | 'guest';\n};` },
    { label: 'Generic Fetch Hook', code: `async function fetchData<T>(url: string): Promise<ApiResponse<T>> {\n  const response = await fetch(url);\n  if (!response.ok) {\n    return { data: null as T, error: response.statusText, status: response.status, timestamp: new Date() };\n  }\n  const data: T = await response.json();\n  return { data, error: null, status: 200, timestamp: new Date() };\n}` },
    { label: 'Enum + Type Guard', code: `enum Status {\n  Active = 'ACTIVE',\n  Inactive = 'INACTIVE',\n  Pending = 'PENDING',\n}\n\nfunction isActive(s: Status): s is Status.Active {\n  return s === Status.Active;\n}` },
    { label: 'Utility Types', code: `type PartialUser = Partial<User>;\ntype ReadonlyUser = Readonly<User>;\ntype UserKeys = keyof User;\ntype PickedUser = Pick<User, 'id' | 'name'>;\ntype OmitPassword = Omit<User, 'password'>;` },
    { label: 'Discriminated Union', code: `type Shape =\n  | { kind: 'circle'; radius: number }\n  | { kind: 'rectangle'; width: number; height: number };\n\nfunction area(shape: Shape): number {\n  switch (shape.kind) {\n    case 'circle': return Math.PI * shape.radius ** 2;\n    case 'rectangle': return shape.width * shape.height;\n  }\n}` },
    { label: 'Abstract Class', code: `abstract class Repository<T> {\n  protected items: T[] = [];\n\n  abstract findById(id: string): T | undefined;\n\n  add(item: T): void {\n    this.items.push(item);\n  }\n}\n\nclass UserRepository extends Repository<User> {\n  findById(id: string) {\n    return this.items.find(u => (u as any).id === id);\n  }\n}` },
  ],
  javascriptreact: [
    { label: 'React Functional Component', code: `import React, { useState, useEffect } from 'react';\n\ninterface Props {\n  title: string;\n  onClose: () => void;\n}\n\nexport const MyComponent: React.FC<Props> = ({ title, onClose }) => {\n  const [loading, setLoading] = useState(false);\n\n  useEffect(() => {\n    // Side effect\n    return () => { /* cleanup */ };\n  }, []);\n\n  return (\n    <div className="container">\n      <h1>{title}</h1>\n      <button onClick={onClose}>Close</button>\n    </div>\n  );\n};\nexport default MyComponent;` },
    { label: 'Custom Hook', code: `import { useState, useEffect } from 'react';\n\nexport function useFetch<T>(url: string) {\n  const [data, setData] = useState<T | null>(null);\n  const [loading, setLoading] = useState(true);\n  const [error, setError] = useState<Error | null>(null);\n\n  useEffect(() => {\n    let cancelled = false;\n    setLoading(true);\n    fetch(url)\n      .then(r => r.json())\n      .then(d => { if (!cancelled) setData(d); })\n      .catch(e => { if (!cancelled) setError(e); })\n      .finally(() => { if (!cancelled) setLoading(false); });\n    return () => { cancelled = true; };\n  }, [url]);\n\n  return { data, loading, error };\n}` },
    { label: 'Context Provider', code: `import React, { createContext, useContext, useState } from 'react';\n\ninterface ThemeContextType {\n  theme: 'light' | 'dark';\n  toggle: () => void;\n}\n\nconst ThemeContext = createContext<ThemeContextType | null>(null);\n\nexport const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {\n  const [theme, setTheme] = useState<'light' | 'dark'>('light');\n  return (\n    <ThemeContext.Provider value={{ theme, toggle: () => setTheme(t => t === 'light' ? 'dark' : 'light') }}>\n      {children}\n    </ThemeContext.Provider>\n  );\n};\n\nexport const useTheme = () => {\n  const ctx = useContext(ThemeContext);\n  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');\n  return ctx;\n};` },
    { label: 'Controlled Form', code: `import { useState } from 'react';\n\nexport function LoginForm({ onSubmit }) {\n  const [form, setForm] = useState({ email: '', password: '' });\n\n  const handleChange = (e) => {\n    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));\n  };\n\n  const handleSubmit = (e) => {\n    e.preventDefault();\n    onSubmit(form);\n  };\n\n  return (\n    <form onSubmit={handleSubmit}>\n      <input name="email" value={form.email} onChange={handleChange} />\n      <input name="password" type="password" value={form.password} onChange={handleChange} />\n      <button type="submit">Log in</button>\n    </form>\n  );\n}` },
    { label: 'useMemo / useCallback', code: `import { useMemo, useCallback, useState } from 'react';\n\nfunction ProductList({ products, query }) {\n  const [favorites, setFavorites] = useState(new Set());\n\n  const filtered = useMemo(\n    () => products.filter(p => p.name.toLowerCase().includes(query.toLowerCase())),\n    [products, query]\n  );\n\n  const toggleFavorite = useCallback((id) => {\n    setFavorites(prev => {\n      const next = new Set(prev);\n      next.has(id) ? next.delete(id) : next.add(id);\n      return next;\n    });\n  }, []);\n\n  return filtered.map(p => (\n    <div key={p.id} onClick={() => toggleFavorite(p.id)}>{p.name}</div>\n  ));\n}` },
    { label: 'Error Boundary', code: `import React from 'react';\n\nexport class ErrorBoundary extends React.Component {\n  state = { hasError: false };\n\n  static getDerivedStateFromError() {\n    return { hasError: true };\n  }\n\n  componentDidCatch(error, info) {\n    console.error('Caught error:', error, info);\n  }\n\n  render() {\n    if (this.state.hasError) {\n      return <p>Something went wrong.</p>;\n    }\n    return this.props.children;\n  }\n}` },
  ],
  typescriptreact: [
    { label: 'Typed Component with Children', code: `import React from 'react';\n\ninterface CardProps {\n  title: string;\n  footer?: React.ReactNode;\n  children: React.ReactNode;\n}\n\nexport const Card: React.FC<CardProps> = ({ title, footer, children }) => {\n  return (\n    <div className="card">\n      <h2 className="card-title">{title}</h2>\n      <div className="card-body">{children}</div>\n      {footer && <div className="card-footer">{footer}</div>}\n    </div>\n  );\n};` },
    { label: 'Reducer with Discriminated Union', code: `import { useReducer } from 'react';\n\ntype State = { count: number };\ntype Action =\n  | { type: 'increment'; by?: number }\n  | { type: 'decrement'; by?: number }\n  | { type: 'reset' };\n\nfunction reducer(state: State, action: Action): State {\n  switch (action.type) {\n    case 'increment': return { count: state.count + (action.by ?? 1) };\n    case 'decrement': return { count: state.count - (action.by ?? 1) };\n    case 'reset': return { count: 0 };\n  }\n}\n\nexport function Counter() {\n  const [state, dispatch] = useReducer(reducer, { count: 0 });\n  return (\n    <button onClick={() => dispatch({ type: 'increment' })}>\n      Count: {state.count}\n    </button>\n  );\n}` },
    { label: 'Generic List Component', code: `interface ListProps<T> {\n  items: T[];\n  keyExtractor: (item: T) => string;\n  renderItem: (item: T) => React.ReactNode;\n}\n\nfunction List<T>({ items, keyExtractor, renderItem }: ListProps<T>) {\n  return (\n    <ul>\n      {items.map(item => (\n        <li key={keyExtractor(item)}>{renderItem(item)}</li>\n      ))}\n    </ul>\n  );\n}\n\nexport default List;` },
    { label: 'Typed Form with useState', code: `import { useState, FormEvent } from 'react';\n\ninterface LoginValues {\n  email: string;\n  password: string;\n}\n\nexport function LoginForm({ onSubmit }: { onSubmit: (v: LoginValues) => void }) {\n  const [values, setValues] = useState<LoginValues>({ email: '', password: '' });\n\n  const handleSubmit = (e: FormEvent) => {\n    e.preventDefault();\n    onSubmit(values);\n  };\n\n  return (\n    <form onSubmit={handleSubmit}>\n      <input\n        value={values.email}\n        onChange={(e) => setValues(v => ({ ...v, email: e.target.value }))}\n      />\n      <button type="submit">Submit</button>\n    </form>\n  );\n}` },
    { label: 'forwardRef + useImperativeHandle', code: `import { forwardRef, useImperativeHandle, useRef } from 'react';\n\ninterface InputHandle {\n  focus: () => void;\n}\n\nexport const FancyInput = forwardRef<InputHandle, { placeholder?: string }>(\n  (props, ref) => {\n    const inputRef = useRef<HTMLInputElement>(null);\n\n    useImperativeHandle(ref, () => ({\n      focus: () => inputRef.current?.focus(),\n    }));\n\n    return <input ref={inputRef} placeholder={props.placeholder} />;\n  }\n);` },
    { label: 'Lazy Loading + Suspense', code: `import { lazy, Suspense } from 'react';\n\nconst Dashboard = lazy(() => import('./Dashboard'));\n\nexport function App() {\n  return (\n    <Suspense fallback={<p>Loading...</p>}>\n      <Dashboard />\n    </Suspense>\n  );\n}` },
  ],
  python: [
    { label: 'Dataclass', code: `from dataclasses import dataclass, field\nfrom typing import List, Optional\n\n@dataclass\nclass User:\n    id: int\n    name: str\n    email: str\n    tags: List[str] = field(default_factory=list)\n    role: Optional[str] = None\n\n    def __post_init__(self):\n        self.email = self.email.lower()` },
    { label: 'FastAPI Endpoint', code: `from fastapi import FastAPI, HTTPException, Depends\nfrom pydantic import BaseModel\n\napp = FastAPI()\n\nclass ItemCreate(BaseModel):\n    name: str\n    price: float\n    description: str = ""\n\n@app.post("/items", status_code=201)\nasync def create_item(item: ItemCreate):\n    # Save to DB...\n    return {"id": 1, **item.dict()}\n\n@app.get("/items/{item_id}")\nasync def get_item(item_id: int):\n    if item_id < 0:\n        raise HTTPException(status_code=404, detail="Item not found")\n    return {"id": item_id}` },
    { label: 'Async Context Manager', code: `import asyncio\nimport aiohttp\n\nasync def fetch_all(urls: list[str]) -> list[dict]:\n    async with aiohttp.ClientSession() as session:\n        tasks = [session.get(url) for url in urls]\n        responses = await asyncio.gather(*tasks)\n        return [await r.json() for r in responses]\n\nresults = asyncio.run(fetch_all(["https://api.example.com/a", "https://api.example.com/b"]))` },
    { label: 'List Comprehension', code: `# Filter and transform\neven_squares = [x**2 for x in range(20) if x % 2 == 0]\n\n# Nested comprehension\nmatrix = [[i * j for j in range(1, 6)] for i in range(1, 6)]\n\n# Dict comprehension\nword_lengths = {word: len(word) for word in ["hello", "world", "python"]}` },
    { label: 'Custom Exception + Context Manager', code: `from contextlib import contextmanager\n\nclass DatabaseError(Exception):\n    pass\n\n@contextmanager\ndef transaction(conn):\n    try:\n        yield conn\n        conn.commit()\n    except Exception as e:\n        conn.rollback()\n        raise DatabaseError(str(e)) from e` },
    { label: 'Decorator with Arguments', code: `import functools\nimport time\n\ndef retry(times=3, delay=1):\n    def decorator(func):\n        @functools.wraps(func)\n        def wrapper(*args, **kwargs):\n            for attempt in range(times):\n                try:\n                    return func(*args, **kwargs)\n                except Exception:\n                    if attempt == times - 1:\n                        raise\n                    time.sleep(delay)\n        return wrapper\n    return decorator\n\n@retry(times=3)\ndef fetch():\n    ...` },
  ],
  java: [
    { label: 'Spring Boot Controller', code: `import org.springframework.web.bind.annotation.*;\nimport org.springframework.http.ResponseEntity;\nimport java.util.List;\n\n@RestController\n@RequestMapping("/api/users")\n@CrossOrigin(origins = "*")\npublic class UserController {\n\n    private final UserService userService;\n\n    public UserController(UserService userService) {\n        this.userService = userService;\n    }\n\n    @GetMapping\n    public ResponseEntity<List<User>> getAll() {\n        return ResponseEntity.ok(userService.findAll());\n    }\n\n    @PostMapping\n    public ResponseEntity<User> create(@RequestBody @Valid UserRequest req) {\n        return ResponseEntity.status(201).body(userService.create(req));\n    }\n}` },
    { label: 'Java Stream API', code: `import java.util.stream.*;\nimport java.util.*;\n\nList<String> names = users.stream()\n    .filter(u -> u.isActive())\n    .map(User::getName)\n    .sorted()\n    .distinct()\n    .collect(Collectors.toList());\n\nMap<String, List<User>> byRole = users.stream()\n    .collect(Collectors.groupingBy(User::getRole));` },
    { label: 'Record Class (Java 16+)', code: `public record UserDto(String id, String name, String email) {\n    // Compact constructor for validation\n    public UserDto {\n        Objects.requireNonNull(id, "id cannot be null");\n        if (email == null || !email.contains("@")) {\n            throw new IllegalArgumentException("Invalid email");\n        }\n    }\n}` },
    { label: 'Builder Pattern', code: `public class User {\n    private final String name;\n    private final String email;\n\n    private User(Builder b) {\n        this.name = b.name;\n        this.email = b.email;\n    }\n\n    public static class Builder {\n        private String name;\n        private String email;\n\n        public Builder name(String name) { this.name = name; return this; }\n        public Builder email(String email) { this.email = email; return this; }\n        public User build() { return new User(this); }\n    }\n}\n\n// User user = new User.Builder().name("Alice").email("a@x.com").build();` },
    { label: 'Optional Usage', code: `import java.util.Optional;\n\npublic Optional<User> findById(String id) {\n    return repository.findById(id);\n}\n\nString name = findById("1")\n    .map(User::getName)\n    .orElse("Unknown");\n\nfindById("2").ifPresentOrElse(\n    u -> System.out.println("Found: " + u.getName()),\n    () -> System.out.println("Not found")\n);` },
    { label: 'Custom Exception', code: `public class ResourceNotFoundException extends RuntimeException {\n    private final String resourceId;\n\n    public ResourceNotFoundException(String resourceId) {\n        super("Resource not found: " + resourceId);\n        this.resourceId = resourceId;\n    }\n\n    public String getResourceId() {\n        return resourceId;\n    }\n}` },
  ],
  csharp: [
    { label: 'ASP.NET Minimal API', code: `using Microsoft.AspNetCore.Mvc;\n\nvar builder = WebApplication.CreateBuilder(args);\nbuilder.Services.AddScoped<IUserService, UserService>();\nvar app = builder.Build();\n\napp.MapGet("/users", async (IUserService svc) =>\n    Results.Ok(await svc.GetAllAsync()));\n\napp.MapPost("/users", async ([FromBody] CreateUserDto dto, IUserService svc) => {\n    var user = await svc.CreateAsync(dto);\n    return Results.Created($"/users/{user.Id}", user);\n});\n\napp.Run();` },
    { label: 'LINQ Query', code: `var result = dbContext.Users\n    .Where(u => u.IsActive && u.CreatedAt > DateTime.UtcNow.AddDays(-30))\n    .OrderByDescending(u => u.CreatedAt)\n    .Select(u => new UserDto(u.Id, u.Name, u.Email))\n    .Take(20)\n    .ToListAsync();` },
    { label: 'Record Type', code: `public record UserDto(Guid Id, string Name, string Email);\n\npublic sealed record CreateUserRequest(\n    string Name,\n    string Email,\n    string Password\n) : IValidatable {\n    public bool IsValid() => !string.IsNullOrWhiteSpace(Name) && Email.Contains('@');\n}` },
    { label: 'Async Task with Cancellation', code: `public async Task<List<User>> GetUsersAsync(CancellationToken ct = default)\n{\n    using var client = new HttpClient();\n    var response = await client.GetAsync("https://api.example.com/users", ct);\n    response.EnsureSuccessStatusCode();\n    var json = await response.Content.ReadAsStringAsync(ct);\n    return JsonSerializer.Deserialize<List<User>>(json) ?? new();\n}` },
    { label: 'Custom Exception', code: `public class NotFoundException : Exception\n{\n    public string ResourceId { get; }\n\n    public NotFoundException(string resourceId)\n        : base($"Resource not found: {resourceId}")\n    {\n        ResourceId = resourceId;\n    }\n}` },
    { label: 'Extension Method', code: `public static class StringExtensions\n{\n    public static string Truncate(this string value, int maxLength)\n    {\n        if (string.IsNullOrEmpty(value) || value.Length <= maxLength)\n            return value;\n        return value[..maxLength] + "...";\n    }\n}\n\n// "Hello world".Truncate(5); // "Hello..."` },
  ],
  cpp: [
    { label: 'Class with RAII', code: `#include <memory>\n#include <string>\n\nclass Connection {\npublic:\n    explicit Connection(std::string host) : host_(std::move(host)) {\n        // Acquire resource\n    }\n    ~Connection() {\n        // Release resource\n    }\n    Connection(const Connection&) = delete;\n    Connection& operator=(const Connection&) = delete;\n\n    const std::string& host() const { return host_; }\n\nprivate:\n    std::string host_;\n};` },
    { label: 'Smart Pointers', code: `#include <memory>\n#include <vector>\n\nstruct Node {\n    int value;\n    std::unique_ptr<Node> next;\n    explicit Node(int v) : value(v), next(nullptr) {}\n};\n\nstd::shared_ptr<Node> makeList(const std::vector<int>& values) {\n    auto head = std::make_shared<Node>(values.empty() ? 0 : values[0]);\n    return head;\n}` },
    { label: 'STL Algorithms', code: `#include <algorithm>\n#include <vector>\n#include <numeric>\n\nstd::vector<int> nums = {5, 3, 8, 1, 9, 2};\n\nstd::sort(nums.begin(), nums.end());\n\nauto it = std::find_if(nums.begin(), nums.end(), [](int n) { return n > 5; });\n\nint sum = std::accumulate(nums.begin(), nums.end(), 0);\n\nstd::vector<int> doubled;\nstd::transform(nums.begin(), nums.end(), std::back_inserter(doubled),\n    [](int n) { return n * 2; });` },
    { label: 'Templates', code: `#include <iostream>\n\ntemplate <typename T>\nT maxValue(T a, T b) {\n    return (a > b) ? a : b;\n}\n\ntemplate <typename T>\nclass Stack {\npublic:\n    void push(const T& item) { data_.push_back(item); }\n    T pop() {\n        T top = data_.back();\n        data_.pop_back();\n        return top;\n    }\n    bool empty() const { return data_.empty(); }\nprivate:\n    std::vector<T> data_;\n};` },
    { label: 'Exception Handling', code: `#include <exception>\n#include <stdexcept>\n\nclass ValidationError : public std::runtime_error {\npublic:\n    explicit ValidationError(const std::string& msg) : std::runtime_error(msg) {}\n};\n\ntry {\n    if (age < 0) throw ValidationError("age cannot be negative");\n} catch (const ValidationError& e) {\n    std::cerr << "Validation failed: " << e.what() << std::endl;\n} catch (const std::exception& e) {\n    std::cerr << "Unexpected error: " << e.what() << std::endl;\n}` },
    { label: 'Operator Overloading', code: `struct Vector2 {\n    double x, y;\n\n    Vector2 operator+(const Vector2& other) const {\n        return { x + other.x, y + other.y };\n    }\n\n    bool operator==(const Vector2& other) const {\n        return x == other.x && y == other.y;\n    }\n\n    friend std::ostream& operator<<(std::ostream& os, const Vector2& v) {\n        return os << "(" << v.x << ", " << v.y << ")";\n    }\n};` },
  ],
  go: [
    { label: 'HTTP Handler', code: `package main\n\nimport (\n\t"encoding/json"\n\t"log"\n\t"net/http"\n)\n\ntype User struct {\n\tID   int    \`json:"id"\`\n\tName string \`json:"name"\`\n}\n\nfunc getUsers(w http.ResponseWriter, r *http.Request) {\n\tusers := []User{{1, "Alice"}, {2, "Bob"}}\n\tw.Header().Set("Content-Type", "application/json")\n\tjson.NewEncoder(w).Encode(users)\n}\n\nfunc main() {\n\thttp.HandleFunc("/users", getUsers)\n\tlog.Fatal(http.ListenAndServe(":8080", nil))\n}` },
    { label: 'Goroutine + Channel', code: `package main\n\nimport (\n\t"fmt"\n\t"sync"\n)\n\nfunc worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {\n\tdefer wg.Done()\n\tfor j := range jobs {\n\t\tresults <- j * j\n\t}\n}\n\nfunc main() {\n\tjobs := make(chan int, 10)\n\tresults := make(chan int, 10)\n\tvar wg sync.WaitGroup\n\n\tfor w := 1; w <= 3; w++ {\n\t\twg.Add(1)\n\t\tgo worker(w, jobs, results, &wg)\n\t}\n\n\tfor i := 1; i <= 9; i++ { jobs <- i }\n\tclose(jobs)\n\twg.Wait()\n\tclose(results)\n\n\tfor r := range results { fmt.Println(r) }\n}` },
    { label: 'Error Handling Pattern', code: `package main\n\nimport (\n\t"errors"\n\t"fmt"\n)\n\nvar ErrNotFound = errors.New("user not found")\n\nfunc findUser(id int) (*User, error) {\n\tif id <= 0 {\n\t\treturn nil, fmt.Errorf("invalid id %d: %w", id, ErrNotFound)\n\t}\n\treturn &User{ID: id}, nil\n}\n\nfunc main() {\n\t_, err := findUser(-1)\n\tif errors.Is(err, ErrNotFound) {\n\t\tfmt.Println("not found:", err)\n\t}\n}` },
    { label: 'Interface + Implementation', code: `package main\n\ntype Shape interface {\n\tArea() float64\n\tPerimeter() float64\n}\n\ntype Rectangle struct {\n\tWidth, Height float64\n}\n\nfunc (r Rectangle) Area() float64      { return r.Width * r.Height }\nfunc (r Rectangle) Perimeter() float64 { return 2 * (r.Width + r.Height) }` },
    { label: 'Context with Timeout', code: `package main\n\nimport (\n\t"context"\n\t"fmt"\n\t"time"\n)\n\nfunc fetchWithTimeout(ctx context.Context) error {\n\tctx, cancel := context.WithTimeout(ctx, 2*time.Second)\n\tdefer cancel()\n\n\tselect {\n\tcase <-time.After(3 * time.Second):\n\t\treturn fmt.Errorf("slow operation")\n\tcase <-ctx.Done():\n\t\treturn ctx.Err()\n\t}\n}` },
    { label: 'Struct Embedding', code: `package main\n\ntype Animal struct {\n\tName string\n}\n\nfunc (a Animal) Describe() string {\n\treturn "Animal: " + a.Name\n}\n\ntype Dog struct {\n\tAnimal\n\tBreed string\n}\n\n// d := Dog{Animal{Name: "Rex"}, "Labrador"}\n// d.Describe() returns "Animal: Rex"` },
  ],
  rust: [
    { label: 'Struct + Impl', code: `#[derive(Debug, Clone)]\nstruct User {\n    id: u32,\n    name: String,\n    email: String,\n}\n\nimpl User {\n    fn new(id: u32, name: &str, email: &str) -> Self {\n        Self { id, name: name.to_string(), email: email.to_string() }\n    }\n\n    fn display_name(&self) -> String {\n        format!("{} <{}>", self.name, self.email)\n    }\n}` },
    { label: 'Result + Error Handling', code: `use std::fmt;\n\n#[derive(Debug)]\nenum AppError {\n    NotFound(String),\n    Invalid(String),\n}\n\nimpl fmt::Display for AppError {\n    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {\n        match self {\n            AppError::NotFound(s) => write!(f, "Not found: {}", s),\n            AppError::Invalid(s) => write!(f, "Invalid: {}", s),\n        }\n    }\n}\n\nfn find_user(id: u32) -> Result<User, AppError> {\n    if id == 0 {\n        return Err(AppError::Invalid("id cannot be zero".into()));\n    }\n    Ok(User::new(id, "Alice", "alice@example.com"))\n}` },
    { label: 'Iterator Chain', code: `let nums: Vec<i32> = vec![5, 3, 8, 1, 9, 2];\n\nlet result: Vec<i32> = nums\n    .iter()\n    .filter(|&&n| n > 2)\n    .map(|&n| n * n)\n    .collect();\n\nlet sum: i32 = nums.iter().sum();\nlet max = nums.iter().max().unwrap_or(&0);` },
    { label: 'Async with Tokio', code: `use tokio::time::{sleep, Duration};\n\n#[tokio::main]\nasync fn main() {\n    let (a, b) = tokio::join!(\n        fetch_data("a"),\n        fetch_data("b"),\n    );\n    println!("{:?} {:?}", a, b);\n}\n\nasync fn fetch_data(name: &str) -> String {\n    sleep(Duration::from_millis(100)).await;\n    format!("data from {}", name)\n}` },
    { label: 'Trait + Default Implementation', code: `trait Shape {\n    fn area(&self) -> f64;\n\n    fn describe(&self) -> String {\n        format!("Shape with area {:.2}", self.area())\n    }\n}\n\nstruct Circle { radius: f64 }\n\nimpl Shape for Circle {\n    fn area(&self) -> f64 {\n        std::f64::consts::PI * self.radius * self.radius\n    }\n}` },
    { label: 'Pattern Matching', code: `enum Message {\n    Quit,\n    Move { x: i32, y: i32 },\n    Write(String),\n}\n\nfn process(msg: Message) {\n    match msg {\n        Message::Quit => println!("Quit"),\n        Message::Move { x, y } => println!("Move to ({}, {})", x, y),\n        Message::Write(text) if !text.is_empty() => println!("Write: {}", text),\n        Message::Write(_) => println!("Empty write"),\n    }\n}` },
  ],
  php: [
    { label: 'Class with Constructor Promotion', code: `<?php\n\nclass User\n{\n    public function __construct(\n        private int $id,\n        private string $name,\n        private string $email,\n        private string $role = 'user',\n    ) {}\n\n    public function getDisplayName(): string\n    {\n        return sprintf('%s <%s>', $this->name, $this->email);\n    }\n\n    public function isAdmin(): bool\n    {\n        return $this->role === 'admin';\n    }\n}` },
    { label: 'Array Functions', code: `<?php\n\n$users = [\n    ['name' => 'Alice', 'active' => true],\n    ['name' => 'Bob', 'active' => false],\n];\n\n$activeNames = array_map(\n    fn($u) => strtoupper($u['name']),\n    array_filter($users, fn($u) => $u['active'])\n);\n\n$total = array_reduce($users, fn($carry, $u) => $carry + 1, 0);` },
    { label: 'PDO Query', code: `<?php\n\n$pdo = new PDO('mysql:host=localhost;dbname=app', $user, $pass, [\n    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,\n]);\n\n$stmt = $pdo->prepare('SELECT id, name, email FROM users WHERE active = :active');\n$stmt->execute(['active' => 1]);\n\n$users = $stmt->fetchAll(PDO::FETCH_ASSOC);` },
    { label: 'Interface', code: `<?php\n\ninterface Notifiable\n{\n    public function notify(string $message): bool;\n}\n\nclass EmailNotifier implements Notifiable\n{\n    public function notify(string $message): bool\n    {\n        // send email...\n        return true;\n    }\n}` },
    { label: 'Custom Exception', code: `<?php\n\nclass ValidationException extends \\RuntimeException\n{\n    public function __construct(\n        string $message,\n        private readonly string $field,\n    ) {\n        parent::__construct($message);\n    }\n\n    public function getField(): string\n    {\n        return $this->field;\n    }\n}` },
    { label: 'Enum (PHP 8.1+)', code: `<?php\n\nenum Role: string\n{\n    case Admin = 'admin';\n    case User = 'user';\n    case Guest = 'guest';\n\n    public function canEdit(): bool\n    {\n        return $this === self::Admin;\n    }\n}` },
  ],
  ruby: [
    { label: 'Class with Attributes', code: `class User\n  attr_accessor :name, :email\n  attr_reader :id\n\n  def initialize(id, name, email)\n    @id = id\n    @name = name\n    @email = email.downcase\n  end\n\n  def display_name\n    "#{name} <#{email}>"\n  end\n\n  def admin?\n    role == 'admin'\n  end\nend` },
    { label: 'Enumerable Methods', code: `users = [\n  { name: 'Alice', active: true },\n  { name: 'Bob', active: false },\n]\n\nactive_names = users\n  .select { |u| u[:active] }\n  .map { |u| u[:name].upcase }\n  .sort\n\ngrouped = users.group_by { |u| u[:active] }` },
    { label: 'Rails Controller Action', code: `class UsersController < ApplicationController\n  def index\n    @users = User.active.order(created_at: :desc).limit(20)\n    render json: @users\n  end\n\n  def create\n    @user = User.new(user_params)\n    if @user.save\n      render json: @user, status: :created\n    else\n      render json: { errors: @user.errors }, status: :unprocessable_entity\n    end\n  end\n\n  private\n\n  def user_params\n    params.require(:user).permit(:name, :email)\n  end\nend` },
    { label: 'Module / Mixin', code: `module Greetable\n  def greet\n    "Hello, #{name}!"\n  end\nend\n\nclass Person\n  include Greetable\n  attr_reader :name\n\n  def initialize(name)\n    @name = name\n  end\nend` },
    { label: 'Custom Exception', code: `class ValidationError < StandardError\n  attr_reader :field\n\n  def initialize(message, field)\n    super(message)\n    @field = field\n  end\nend\n\nbegin\n  raise ValidationError.new('Email required', :email)\nrescue ValidationError => e\n  puts "#{e.field}: #{e.message}"\nend` },
    { label: 'Blocks, Procs & Lambdas', code: `def repeat(times)\n  times.times { |i| yield i }\nend\n\nrepeat(3) { |i| puts "Iteration #{i}" }\n\nsquare = ->(x) { x * x }\nputs square.call(5)\n\nadder = proc { |a, b| a + b }\nputs adder.call(2, 3)` },
  ],
  swift: [
    { label: 'Struct + Protocol', code: `protocol Identifiable {\n    var id: String { get }\n}\n\nstruct User: Identifiable, Codable {\n    let id: String\n    var name: String\n    var email: String\n    var role: Role = .user\n\n    enum Role: String, Codable {\n        case admin, user, guest\n    }\n}` },
    { label: 'Async/Await Network Call', code: `struct ApiClient {\n    func fetchUsers() async throws -> [User] {\n        guard let url = URL(string: "https://api.example.com/users") else {\n            throw URLError(.badURL)\n        }\n        let (data, response) = try await URLSession.shared.data(from: url)\n        guard let httpResponse = response as? HTTPURLResponse,\n              httpResponse.statusCode == 200 else {\n            throw URLError(.badServerResponse)\n        }\n        return try JSONDecoder().decode([User].self, from: data)\n    }\n}` },
    { label: 'SwiftUI View', code: `import SwiftUI\n\nstruct UserListView: View {\n    @State private var users: [User] = []\n    @State private var isLoading = false\n\n    var body: some View {\n        List(users) { user in\n            VStack(alignment: .leading) {\n                Text(user.name).font(.headline)\n                Text(user.email).font(.subheadline).foregroundColor(.secondary)\n            }\n        }\n        .overlay {\n            if isLoading { ProgressView() }\n        }\n    }\n}` },
    { label: 'Enum with Associated Values', code: `enum NetworkResult<T> {\n    case success(T)\n    case failure(Error)\n}\n\nfunc handle<T>(_ result: NetworkResult<T>) {\n    switch result {\n    case .success(let value):\n        print("Got: \(value)")\n    case .failure(let error):\n        print("Error: \(error.localizedDescription)")\n    }\n}` },
    { label: 'Generics with Constraints', code: `func findMax<T: Comparable>(_ items: [T]) -> T? {\n    guard !items.isEmpty else { return nil }\n    return items.reduce(items[0]) { $0 > $1 ? $0 : $1 }\n}\n\nprint(findMax([3, 7, 2, 9, 4]) ?? 0)` },
    { label: 'Custom Error Type', code: `enum ValidationError: Error, LocalizedError {\n    case missingField(String)\n    case invalidFormat(String)\n\n    var errorDescription: String? {\n        switch self {\n        case .missingField(let field): return "\(field) is required"\n        case .invalidFormat(let field): return "\(field) has invalid format"\n        }\n    }\n}` },
  ],
  kotlin: [
    { label: 'Data Class', code: `data class User(\n    val id: String,\n    val name: String,\n    val email: String,\n    val role: Role = Role.USER,\n) {\n    enum class Role { ADMIN, USER, GUEST }\n\n    val displayName: String\n        get() = "$name <$email>"\n}` },
    { label: 'Coroutines', code: `import kotlinx.coroutines.*\n\nsuspend fun fetchUsers(): List<User> = withContext(Dispatchers.IO) {\n    // simulate network call\n    delay(200)\n    listOf(User("1", "Alice", "alice@example.com"))\n}\n\nfun main() = runBlocking {\n    val (users, posts) = awaitAll(\n        async { fetchUsers() },\n        async { fetchPosts() },\n    )\n}` },
    { label: 'Sealed Class + When', code: `sealed class Result<out T> {\n    data class Success<T>(val data: T) : Result<T>()\n    data class Failure(val error: Throwable) : Result<Nothing>()\n}\n\nfun <T> handle(result: Result<T>) = when (result) {\n    is Result.Success -> println("Got: \${result.data}")\n    is Result.Failure -> println("Error: \${result.error.message}")\n}` },
    { label: 'Extension Function', code: `fun String.isValidEmail(): Boolean =\n    Regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$").matches(this)\n\nfun List<Int>.average2(): Double =\n    if (isEmpty()) 0.0 else sum().toDouble() / size\n\n// "test@example.com".isValidEmail()` },
    { label: 'Null Safety', code: `data class User(val name: String, val email: String?)\n\nfun greet(user: User?): String {\n    val name = user?.name ?: "Guest"\n    val domain = user?.email?.substringAfter("@") ?: "unknown"\n    return "Hi $name from $domain"\n}` },
    { label: 'Higher-Order Function', code: `fun <T, R> List<T>.mapIndexedNotNull2(transform: (Int, T) -> R?): List<R> {\n    val result = mutableListOf<R>()\n    forEachIndexed { i, item ->\n        transform(i, item)?.let { result.add(it) }\n    }\n    return result\n}` },
  ],
  sql: [
    { label: 'CREATE TABLE', code: `CREATE TABLE users (\n  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  name        VARCHAR(100) NOT NULL,\n  email       VARCHAR(255) UNIQUE NOT NULL,\n  role        VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'guest')),\n  is_active   BOOLEAN DEFAULT TRUE,\n  created_at  TIMESTAMPTZ DEFAULT NOW(),\n  updated_at  TIMESTAMPTZ DEFAULT NOW()\n);\n\nCREATE INDEX idx_users_email ON users(email);\nCREATE INDEX idx_users_role  ON users(role) WHERE is_active = TRUE;` },
    { label: 'Complex JOIN Query', code: `SELECT\n  u.id,\n  u.name,\n  u.email,\n  COUNT(o.id)          AS order_count,\n  SUM(o.total_amount)  AS total_spent,\n  MAX(o.created_at)    AS last_order\nFROM users u\nLEFT JOIN orders o ON o.user_id = u.id\nWHERE u.is_active = TRUE\n  AND u.created_at > NOW() - INTERVAL '1 year'\nGROUP BY u.id, u.name, u.email\nHAVING COUNT(o.id) > 0\nORDER BY total_spent DESC\nLIMIT 50;` },
    { label: 'CTE + Window Function', code: `WITH ranked_sales AS (\n  SELECT\n    product_id,\n    sale_date,\n    amount,\n    ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY amount DESC) AS rank,\n    SUM(amount) OVER (PARTITION BY product_id) AS total_by_product\n  FROM sales\n  WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days'\n)\nSELECT * FROM ranked_sales WHERE rank <= 3;` },
    { label: 'UPSERT', code: `INSERT INTO users (id, name, email)\nVALUES ($1, $2, $3)\nON CONFLICT (id)\nDO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, updated_at = NOW();` },
    { label: 'Transaction', code: `BEGIN;\n\nUPDATE accounts SET balance = balance - 100 WHERE id = 1;\nUPDATE accounts SET balance = balance + 100 WHERE id = 2;\n\nCOMMIT;` },
    { label: 'Subquery + EXISTS', code: `SELECT u.id, u.name\nFROM users u\nWHERE EXISTS (\n  SELECT 1 FROM orders o\n  WHERE o.user_id = u.id\n    AND o.created_at > NOW() - INTERVAL '7 days'\n);` },
  ],
  shell: [
    { label: 'Script Template', code: `#!/usr/bin/env bash\nset -euo pipefail\n\n# ── Config ────────────────────────────────────────\nSCRIPT_DIR="$(cd "$(dirname "\\\${BASH_SOURCE[0]}")" && pwd)"\nLOG_FILE="/tmp/script.log"\n\n# ── Logging ───────────────────────────────────────\nlog() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] \$*" | tee -a "\$LOG_FILE"; }\nerror() { log "ERROR: \$*" >&2; exit 1; }\n\n# ── Main ──────────────────────────────────────────\nmain() {\n  log "Starting script..."\n  [[ -z "\\\${1:-}" ]] && error "Usage: \$0 <argument>"\n  log "Done."\n}\n\nmain "\$@"` },
    { label: 'Process All Files', code: `#!/usr/bin/env bash\nset -euo pipefail\n\nDIR="\\\${1:-.}"\nEXT="\\\${2:-.txt}"\n\nfind "\$DIR" -name "*\$EXT" -type f | while IFS= read -r file; do\n  echo "Processing: \$file"\n  # Do something with \$file\ndone\n\necho "Done processing \$(find "\$DIR" -name "*\$EXT" | wc -l) files."` },
    { label: 'Argument Parsing', code: `#!/usr/bin/env bash\nset -euo pipefail\n\nVERBOSE=false\nOUTPUT="out.txt"\n\nwhile [[ $# -gt 0 ]]; do\n  case "$1" in\n    -v|--verbose) VERBOSE=true; shift ;;\n    -o|--output) OUTPUT="$2"; shift 2 ;;\n    -h|--help) echo "Usage: $0 [-v] [-o file]"; exit 0 ;;\n    *) echo "Unknown option: $1"; exit 1 ;;\n  esac\ndone\n\necho "Output: $OUTPUT, Verbose: $VERBOSE"` },
    { label: 'Trap for Cleanup', code: `#!/usr/bin/env bash\nset -euo pipefail\n\nTMP_DIR="$(mktemp -d)"\ncleanup() { rm -rf "$TMP_DIR"; }\ntrap cleanup EXIT\n\necho "Working in $TMP_DIR"\n# ... do work ...` },
    { label: 'Functions + Conditionals', code: `#!/usr/bin/env bash\nset -euo pipefail\n\nis_installed() {\n  command -v "$1" >/dev/null 2>&1\n}\n\nif is_installed "docker"; then\n  echo "Docker is installed"\nelse\n  echo "Docker is missing"\n  exit 1\nfi` },
    { label: 'Read Lines from File', code: `#!/usr/bin/env bash\nset -euo pipefail\n\nwhile IFS=',' read -r name email; do\n  echo "Name: $name, Email: $email"\ndone < users.csv` },
  ],
  html: [
    { label: 'HTML5 Boilerplate', code: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <meta name="description" content="Page description" />\n  <title>Page Title</title>\n  <link rel="stylesheet" href="styles.css" />\n</head>\n<body>\n  <header>\n    <nav aria-label="Main navigation">\n      <a href="/">Home</a>\n    </nav>\n  </header>\n\n  <main id="main-content">\n    <h1>Heading</h1>\n    <p>Content goes here.</p>\n  </main>\n\n  <footer>\n    <p>&copy; 2025</p>\n  </footer>\n\n  <script src="main.js" defer></script>\n</body>\n</html>` },
    { label: 'Form with Validation', code: `<form action="/submit" method="POST" novalidate>\n  <label for="email">Email</label>\n  <input id="email" name="email" type="email" required />\n\n  <label for="password">Password</label>\n  <input id="password" name="password" type="password" minlength="8" required />\n\n  <button type="submit">Sign in</button>\n</form>` },
    { label: 'Table', code: `<table>\n  <thead>\n    <tr>\n      <th scope="col">Name</th>\n      <th scope="col">Role</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>Alice</td>\n      <td>Admin</td>\n    </tr>\n  </tbody>\n</table>` },
    { label: 'Semantic Article', code: `<article>\n  <header>\n    <h2>Article Title</h2>\n    <p><time datetime="2026-06-20">June 20, 2026</time></p>\n  </header>\n  <p>Article content goes here.</p>\n  <footer>\n    <p>By <a href="/author/alice">Alice</a></p>\n  </footer>\n</article>` },
    { label: 'Accessible Modal Dialog', code: `<div role="dialog" aria-modal="true" aria-labelledby="dialog-title">\n  <h2 id="dialog-title">Confirm action</h2>\n  <p>Are you sure you want to continue?</p>\n  <button type="button">Cancel</button>\n  <button type="button">Confirm</button>\n</div>` },
    { label: 'Picture with Responsive Images', code: `<picture>\n  <source srcset="hero-large.webp" media="(min-width: 1024px)" />\n  <source srcset="hero-small.webp" media="(max-width: 1023px)" />\n  <img src="hero-fallback.jpg" alt="Descriptive text" loading="lazy" />\n</picture>` },
  ],
  css: [
    { label: 'CSS Variables & Reset', code: `:root {\n  --color-primary: #3b82f6;\n  --color-bg: #ffffff;\n  --color-text: #1e293b;\n  --radius: 8px;\n  --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);\n  --font-sans: 'Inter', system-ui, sans-serif;\n}\n\n*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\n\nbody {\n  font-family: var(--font-sans);\n  color: var(--color-text);\n  background: var(--color-bg);\n  line-height: 1.6;\n}` },
    { label: 'Flexbox Layout', code: `.container {\n  display: flex;\n  gap: 1rem;\n  flex-wrap: wrap;\n  align-items: flex-start;\n}\n\n.sidebar {\n  flex: 0 0 260px;\n}\n\n.main {\n  flex: 1;\n  min-width: 0;\n}` },
    { label: 'CSS Grid Layout', code: `.grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));\n  gap: 1.5rem;\n  padding: 1.5rem;\n}\n\n@media (max-width: 640px) {\n  .grid { grid-template-columns: 1fr; }\n}` },
    { label: 'Transition & Animation', code: `.button {\n  transition: transform 0.2s ease, box-shadow 0.2s ease;\n}\n\n.button:hover {\n  transform: translateY(-2px);\n  box-shadow: var(--shadow);\n}\n\n@keyframes fadeIn {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}\n\n.fade-in {\n  animation: fadeIn 0.3s ease-out;\n}` },
    { label: 'Responsive Media Queries', code: `.container {\n  padding: 1rem;\n}\n\n@media (min-width: 768px) {\n  .container { padding: 2rem; max-width: 720px; margin: 0 auto; }\n}\n\n@media (min-width: 1024px) {\n  .container { max-width: 960px; }\n}` },
    { label: 'Dark Mode with Custom Properties', code: `:root {\n  --bg: #ffffff;\n  --text: #111111;\n}\n\n@media (prefers-color-scheme: dark) {\n  :root {\n    --bg: #111111;\n    --text: #f5f5f5;\n  }\n}\n\nbody {\n  background: var(--bg);\n  color: var(--text);\n}` },
  ],
  json: [
    { label: 'Config Object', code: `{\n  "name": "my-app",\n  "version": "1.0.0",\n  "settings": {\n    "debug": false,\n    "maxRetries": 3,\n    "timeoutMs": 5000\n  },\n  "features": ["auth", "billing", "notifications"]\n}` },
    { label: 'API Response Shape', code: `{\n  "data": {\n    "id": "usr_123",\n    "name": "Alice",\n    "email": "alice@example.com",\n    "role": "admin",\n    "createdAt": "2026-01-15T10:30:00Z"\n  },\n  "meta": {\n    "requestId": "req_abc",\n    "timestamp": "2026-06-20T08:00:00Z"\n  },\n  "error": null\n}` },
    { label: 'Array of Objects', code: `{\n  "users": [\n    { "id": 1, "name": "Alice", "role": "admin" },\n    { "id": 2, "name": "Bob", "role": "user" }\n  ],\n  "total": 2\n}` },
    { label: 'Nested Configuration', code: `{\n  "database": {\n    "host": "localhost",\n    "port": 5432,\n    "credentials": { "user": "admin", "password": "***" }\n  },\n  "cache": {\n    "provider": "redis",\n    "ttlSeconds": 3600\n  }\n}` },
    { label: 'JSON Schema', code: `{\n  "$schema": "http://json-schema.org/draft-07/schema#",\n  "type": "object",\n  "required": ["id", "name"],\n  "properties": {\n    "id": { "type": "string" },\n    "name": { "type": "string", "minLength": 1 },\n    "age": { "type": "integer", "minimum": 0 }\n  }\n}` },
    { label: 'package.json Snippet', code: `{\n  "name": "my-app",\n  "version": "1.0.0",\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build",\n    "test": "vitest"\n  },\n  "dependencies": {\n    "react": "^18.2.0"\n  }\n}` },
  ],
  yaml: [
    { label: 'GitHub Actions Workflow', code: `name: CI\n\non:\n  push:\n    branches: [main]\n  pull_request:\n    branches: [main]\n\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: '20'\n      - run: npm ci\n      - run: npm test` },
    { label: 'Docker Compose', code: `version: "3.9"\nservices:\n  app:\n    build: .\n    ports:\n      - "3000:3000"\n    environment:\n      - NODE_ENV=production\n    depends_on:\n      - db\n  db:\n    image: postgres:16-alpine\n    environment:\n      POSTGRES_PASSWORD: secret\n    volumes:\n      - db_data:/var/lib/postgresql/data\n\nvolumes:\n  db_data:` },
    { label: 'Kubernetes Deployment', code: `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: api-server\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: api-server\n  template:\n    metadata:\n      labels:\n        app: api-server\n    spec:\n      containers:\n        - name: api\n          image: my-org/api:latest\n          ports:\n            - containerPort: 8080` },
    { label: 'Ansible Playbook', code: `- name: Deploy application\n  hosts: web\n  become: true\n  tasks:\n    - name: Install dependencies\n      apt:\n        name: nginx\n        state: present\n    - name: Start service\n      service:\n        name: nginx\n        state: started\n        enabled: true` },
    { label: 'CI Config with Matrix', code: `jobs:\n  test:\n    strategy:\n      matrix:\n        node-version: [18, 20, 22]\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: \${{ matrix.node-version }}\n      - run: npm test` },
    { label: 'Application Config', code: `app:\n  name: my-service\n  port: 3000\n  features:\n    auth: true\n    billing: false\nlogging:\n  level: info\n  format: json` },
  ],
  xml: [
    { label: 'Config Document', code: `<?xml version="1.0" encoding="UTF-8"?>\n<configuration>\n  <settings>\n    <setting key="debug" value="false" />\n    <setting key="maxRetries" value="3" />\n  </settings>\n  <features>\n    <feature name="auth" enabled="true" />\n    <feature name="billing" enabled="true" />\n  </features>\n</configuration>` },
    { label: 'Maven POM Snippet', code: `<project xmlns="http://maven.apache.org/POM/4.0.0">\n  <modelVersion>4.0.0</modelVersion>\n  <groupId>com.example</groupId>\n  <artifactId>app</artifactId>\n  <version>1.0.0</version>\n  <dependencies>\n    <dependency>\n      <groupId>org.springframework.boot</groupId>\n      <artifactId>spring-boot-starter-web</artifactId>\n    </dependency>\n  </dependencies>\n</project>` },
    { label: 'RSS Feed', code: `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>Example Blog</title>\n    <link>https://example.com</link>\n    <description>Latest posts</description>\n    <item>\n      <title>First Post</title>\n      <link>https://example.com/first-post</link>\n      <pubDate>Sat, 20 Jun 2026 08:00:00 GMT</pubDate>\n    </item>\n  </channel>\n</rss>` },
    { label: 'SOAP Envelope', code: `<?xml version="1.0"?>\n<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">\n  <soap:Body>\n    <GetUserRequest>\n      <UserId>123</UserId>\n    </GetUserRequest>\n  </soap:Body>\n</soap:Envelope>` },
    { label: 'Android Layout', code: `<?xml version="1.0" encoding="utf-8"?>\n<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"\n    android:layout_width="match_parent"\n    android:layout_height="match_parent"\n    android:orientation="vertical">\n\n    <TextView\n        android:layout_width="wrap_content"\n        android:layout_height="wrap_content"\n        android:text="Hello World" />\n</LinearLayout>` },
    { label: 'XML Sitemap', code: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>https://example.com/</loc>\n    <lastmod>2026-06-20</lastmod>\n    <priority>1.0</priority>\n  </url>\n</urlset>` },
  ],
  markdown: [
    { label: 'README Structure', code: `# Project Name\n\nBrief description of what this project does.\n\n## Installation\n\n\`\`\`bash\nnpm install\n\`\`\`\n\n## Usage\n\n\`\`\`js\nconst app = require('app');\napp.start();\n\`\`\`\n\n## Contributing\n\nPull requests welcome.\n\n## License\n\nMIT` },
    { label: 'Table', code: `| Name  | Role  | Active |\n|-------|-------|--------|\n| Alice | Admin | Yes    |\n| Bob   | User  | No     |` },
    { label: 'Code Block with Language', code: `\`\`\`python\ndef greet(name: str) -> str:\n    return f"Hello, {name}!"\n\`\`\`` },
    { label: 'Task List', code: `## Sprint Tasks\n\n- [x] Set up project scaffolding\n- [x] Design database schema\n- [ ] Implement auth endpoints\n- [ ] Write integration tests` },
    { label: 'Blockquote with Links', code: `> "The best way to predict the future is to create it."\n>\n> Read more in the [project docs](https://example.com/docs) or check the [changelog](https://example.com/changelog).` },
    { label: 'Frontmatter', code: `---\ntitle: "Getting Started"\ndate: 2026-06-20\ntags: [guide, setup]\n---\n\n# Getting Started\n\nThis guide walks through initial setup.` },
  ],
  dockerfile: [
    { label: 'Node.js Dockerfile', code: `# Build stage\nFROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\nRUN npm run build\n\n# Production stage\nFROM node:20-alpine AS runner\nWORKDIR /app\nENV NODE_ENV=production\nCOPY --from=builder /app/dist ./dist\nCOPY --from=builder /app/node_modules ./node_modules\nEXPOSE 3000\nUSER node\nCMD ["node", "dist/main.js"]` },
    { label: 'Python Dockerfile', code: `FROM python:3.12-slim\n\nWORKDIR /app\n\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\n\nCOPY . .\n\nEXPOSE 8000\nCMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]` },
    { label: 'Go Dockerfile', code: `FROM golang:1.22-alpine AS builder\nWORKDIR /app\nCOPY go.mod go.sum ./\nRUN go mod download\nCOPY . .\nRUN CGO_ENABLED=0 go build -o server .\n\nFROM alpine:3.19\nCOPY --from=builder /app/server /server\nEXPOSE 8080\nENTRYPOINT ["/server"]` },
    { label: 'Java Dockerfile', code: `FROM eclipse-temurin:21-jdk-alpine AS builder\nWORKDIR /app\nCOPY . .\nRUN ./gradlew bootJar\n\nFROM eclipse-temurin:21-jre-alpine\nCOPY --from=builder /app/build/libs/*.jar app.jar\nEXPOSE 8080\nENTRYPOINT ["java", "-jar", "/app.jar"]` },
    { label: '.dockerignore', code: `node_modules\nnpm-debug.log\n.git\n.env\ndist\n*.md\n.vscode` },
    { label: 'Healthcheck', code: `FROM nginx:alpine\n\nCOPY ./dist /usr/share/nginx/html\n\nHEALTHCHECK --interval=30s --timeout=3s \\\n  CMD wget -qO- http://localhost/ || exit 1\n\nEXPOSE 80` },
  ],
  graphql: [
    { label: 'Schema Definition', code: `type User {\n  id: ID!\n  name: String!\n  email: String!\n  role: Role!\n  posts: [Post!]!\n}\n\nenum Role {\n  ADMIN\n  USER\n  GUEST\n}\n\ntype Query {\n  users(active: Boolean): [User!]!\n  user(id: ID!): User\n}\n\ntype Mutation {\n  createUser(name: String!, email: String!): User!\n}` },
    { label: 'Query with Variables', code: `query GetUsers($active: Boolean, $limit: Int = 10) {\n  users(active: $active, limit: $limit) {\n    id\n    name\n    email\n    posts {\n      id\n      title\n    }\n  }\n}` },
    { label: 'Mutation with Input Type', code: `input CreateUserInput {\n  name: String!\n  email: String!\n  role: Role = USER\n}\n\ntype Mutation {\n  createUser(input: CreateUserInput!): User!\n}` },
    { label: 'Subscription', code: `type Subscription {\n  userCreated: User!\n  orderStatusChanged(orderId: ID!): Order!\n}\n\nsubscription OnUserCreated {\n  userCreated {\n    id\n    name\n  }\n}` },
    { label: 'Fragment', code: `fragment UserFields on User {\n  id\n  name\n  email\n}\n\nquery GetUserWithFragment($id: ID!) {\n  user(id: $id) {\n    ...UserFields\n    posts {\n      title\n    }\n  }\n}` },
    { label: 'Interface Type', code: `interface Node {\n  id: ID!\n}\n\ntype User implements Node {\n  id: ID!\n  name: String!\n}\n\ntype Post implements Node {\n  id: ID!\n  title: String!\n}` },
  ],
};
// ─── Component ────────────────────────────────────────────────────────────────
export const CodeSnippets: React.FC = () => {
  const { theme, snippets, saveSnippetItem, deleteSnippetItem } = useStore();
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

  const active = snippets.find(s => s.id === activeId);

  useEffect(() => {
    if (active) { setTitle(active.title); setLanguage(active.language); setCode(active.code); setDescription(active.description || ''); setSaveState('idle'); }
    else if (!activeId) { setTitle(''); setLanguage('javascript'); setCode(''); setDescription(''); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, snippets]);

  const doSave = useCallback((s: CodeSnippetItem) => {
    saveSnippetItem(s);
  }, [saveSnippetItem]);

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
    saveSnippetItem(s);
    setActiveId(id);
    setTitle('New Snippet'); setLanguage('javascript'); setCode('// Start coding here\n'); setDescription('');
    setSaveState('idle');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this snippet?')) return;
    deleteSnippetItem(id);
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
                  quickSuggestions: {
                    other: true,
                    comments: true,
                    strings: true
                  },
                  snippetSuggestions: 'top',
                  wordBasedSuggestions: 'allDocuments',
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
