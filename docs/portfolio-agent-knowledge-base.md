# Portfolio Agent Knowledge Base

## Purpose
This agent updates the portfolio content for the repository `rprabhakar789/portfolio-agent-sandbox` based on plain-English instructions received from email.

The agent must:
1. Update only portfolio content.
2. Never modify application logic, workflows, or config unless explicitly asked by a trusted human through a coding session.
3. Prefer safe, minimal content changes.
4. Generate changes that can be committed, reviewed, merged, and deployed to GitHub Pages.

---

## Repository Context

### Target repository
- Repo: `rprabhakar789/portfolio-agent-sandbox`

### Deployment
- Site is deployed via GitHub Pages from `main`.
- Merging a content PR to `main` triggers deploy automatically.

---

## Editable Scope

The agent may edit only files under:

- `content/profile.json`
- `content/projects.json`
- `content/skills.json`

The agent must **not** edit:
- `.github/**`
- `pipeline/**`
- `index.html`
- `styles.css`
- any package/config/build files

If a requested change cannot be completed within the allowed content files, the agent must refuse or ask for a repo/schema change.

---

## Content File Contracts

### 1. `content/profile.json`
Type: **object**

Expected shape:
```json
{
  "name": "Your Name",
  "title": "Software Engineer",
  "bio": "Short bio",
  "email": "you@example.com",
  "github": "https://github.com/...",
  "linkedin": "https://linkedin.com/in/...",
  "avatar": "assets/avatar.png",
  "experience": [
    {
      "title": "Software Engineer 2",
      "company": "Microsoft",
      "startDate": "2025",
      "endDate": "Present"
    }
  ]
}
```

Rules:
- `experience` is an array inside the profile object.
- Bio/title/name/contact links should be updated using object-field edits.
- Experience entries should be appended to `experience`.

---

### 2. `content/projects.json`
Type: **root array**

Expected shape:
```json
[
  {
    "title": "Project Name",
    "description": "Short description",
    "url": "https://...",
    "tags": ["tag1", "tag2"],
    "featured": true
  }
]
```

Rules:
- This file is a **root array**.
- To add a project, append a new object to the root array.
- Do not assume there is a `projects` key.
- Do not generate operations targeting `key: "projects"`.

---

### 3. `content/skills.json`
Type: **root array**

Expected shape:
```json
[
  { "name": "JavaScript", "level": "Expert" },
  { "name": "Docker", "level": "Intermediate" }
]
```

Rules:
- This file is a **root array**.
- To add a skill, append an object like:
  ```json
  { "name": "AWS", "level": "Intermediate" }
  ```
- Do not use plain strings like `"AWS (Intermediate)"` unless explicitly requested.
- Do not assume there is a `skills` key.
- Do not generate operations targeting `key: "skills"`.

---

## Critical Root-Array Rule

For `content/projects.json` and `content/skills.json`:

- They are root arrays, not objects.
- Root-array append/remove operations must target the **array root**.
- Do **not** generate:
  - `key: "skills"`
  - `key: "projects"`
- If operation format requires a key, use an empty key or explicit root-array handling according to implementation rules.

This is extremely important because invalid object-style edits on arrays may appear to succeed in memory but produce no real JSON file changes.

---

## Allowed Operation Semantics

### Object file edits
For object files like `content/profile.json`:
- `set` on object fields is allowed
- `append` is allowed for array fields like `experience`
- `remove` is allowed for fields or array items

### Root-array file edits
For root-array files like `content/projects.json` and `content/skills.json`:
- `append` means append an item to the root array
- `remove` means remove a matching item from the root array
- `set` is allowed only when replacing the entire array intentionally

---

## Instruction Interpretation Rules

### Skills updates
Examples:
- “Add AWS and AI Agent to my skills list”
- “Append these exact skills: Dancing (Beginner), Singing (Beginner)”

Interpretation:
- Add new entries to `content/skills.json`
- Normalize to structured objects when possible:
  - `AWS` → `{ "name": "AWS", "level": "Intermediate" }` if level is implied or provided
  - `Dancing (Beginner)` → `{ "name": "Dancing", "level": "Beginner" }`

### Experience updates
Examples:
- “Add Software Engineer 2 at Microsoft from 2025 till now”
- “Update my work experience”

Interpretation:
- Append or update `profile.experience` inside `content/profile.json`

### Bio/title updates
Examples:
- “Update my bio to ...”
- “Change my title to Senior Software Engineer”

Interpretation:
- Update object fields in `content/profile.json`

---

## Merge and Deploy Intent

The following phrases indicate explicit auto-merge intent:
- `merge and deploy`
- `auto merge`
- `automerge`
- `publish this`
- `ship this`
- `go live`

If none of these appear, default to PR-first behavior.

`push and deploy` is **not** an approved auto-merge phrase unless the implementation explicitly adds it.

---

## Output Quality Requirements

When generating edits:
1. Match the real JSON structure of the target file.
2. Prefer structured objects over free-form strings.
3. Avoid no-op operations.
4. Ensure changes would produce a real file diff.
5. If uncertain about file shape, inspect the current content before generating operations.

---

## Failure Rules

The agent must fail loudly instead of pretending success when:
- generated operations do not match the target file structure
- operations produce no actual file diff
- requested change is outside allowed files
- required content structure is missing
- the instruction is ambiguous enough that multiple destructive interpretations are possible

---

## Preferred Behavior for Reliability

Before generating final operations, the model should consider:
1. target file path
2. whether the file is an object or root array
3. exact current file structure
4. whether the operation will produce a real diff

If possible, always reason using the current file content as context.

---

## Examples

### Good skills update
Instruction:
> Add AWS and AI Agent to my skills list. Merge and deploy.

Good intent:
- target file: `content/skills.json`
- operation style: root-array append
- values:
```json
[
  { "name": "AWS", "level": "Intermediate" },
  { "name": "AI Agent", "level": "Intermediate" }
]
```

### Bad skills update
Bad output:
```json
[
  { "file": "content/skills.json", "op": "append", "key": "skills", "value": "AWS (Intermediate)" }
]
```

Why bad:
- uses `key: "skills"` on a root array
- uses string instead of structured object
- may produce no persisted JSON diff

### Good experience update
Instruction:
> Add Software Engineer 2 at Microsoft from 2025 till now.

Good target:
- `content/profile.json`
- append to `experience`

Value:
```json
{
  "title": "Software Engineer 2",
  "company": "Microsoft",
  "startDate": "2025",
  "endDate": "Present"
}
```

---

## Final Rule

The highest priority is **correct content structure** over confidence.
If the model cannot confidently map the instruction to valid file-shape-aware edits, it should return an explicit failure or clarification request instead of a guessed operation.
