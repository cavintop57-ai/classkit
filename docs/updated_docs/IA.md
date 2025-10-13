# Information Architecture

```mermaid
graph TD
    A[Landing / QR<br/>https://widget.school/{code}] --> B(StudentForm)
    B --> C{Answer Correct?}
    C -->|Yes| D[POST /messages]
    C -->|No| E[Hint Modal]
    D --> F[WebSocket Broadcast]
    F --> G[Classroom Widget Canvas]

    subgraph Teacher App
        G --> H[Tray Panel]
        H --> I[Admin Console /admin]
    end
```

## Page Inventory
| Route | Purpose |
|-------|---------|
| `/` | Marketing / docs (optional) |
| `/admin` | School & class management dashboard |
| `/{code}` | Student entry page (nickname, answer, avatar) |
| `/static/*` | JS/CSS/asset delivery |
| WebSocket `/ws/{session}` | Real‑time channel per session |

## User Flows
1. **Student Join & Message**
   1. Scan QR → `/123456`
   2. Input nickname, select avatar, answer quiz
   3. Correct ⇒ message form enabled
   4. Submit ⇒ broadcast to widget

2. **Teacher Start Class**
   1. PC boot → widget autostart
   2. New session code auto‑generated
   3. Start timer / choose problem
   4. Toggle 업무모드 when lesson begins
