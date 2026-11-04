# ER-Diagramm

Das Diagramm entspricht `server/schema.sql`. GitHub zeigt den Mermaid-Block direkt als Grafik an.

```mermaid
erDiagram
    users ||--o{ contents : "lädt hoch"
    users ||--o{ ratings : "bewertet"
    users ||--o{ upvotes : "vergibt"
    users ||--o{ favorites : "merkt"
    users ||--o{ reports : "meldet"
    courses ||--o{ topics : "hat"
    courses ||--o{ contents : "enthält"
    courses ||--o{ ratings : "wird bewertet"
    courses |o--o{ favorites : "wird gemerkt"
    contents ||--o{ content_topics : "gehört zu"
    topics ||--o{ content_topics : "ordnet zu"
    contents ||--o{ upvotes : "erhält"
    contents |o--o{ favorites : "wird gemerkt"
    contents |o--o{ reports : "wird gemeldet"
    ratings |o--o{ reports : "wird gemeldet"

    users {
        INTEGER id PK
        TEXT username UK
        TEXT password_hash
        TEXT role "user oder admin"
        TEXT email_domain "nur die Domain"
        TEXT created_at
    }
    courses {
        INTEGER id PK
        TEXT name
        TEXT studiengang
        INTEGER semester "1 bis 6"
    }
    topics {
        INTEGER id PK
        INTEGER course_id FK
        TEXT name "UNIQUE mit course_id"
    }
    contents {
        INTEGER id PK
        INTEGER course_id FK
        INTEGER user_id FK "SET NULL bei Löschen"
        TEXT type "altklausur, cheatsheet, aufschrieb, zusammenfassung, tipp"
        TEXT title
        TEXT format "text oder pdf"
        TEXT body_text "nur Text"
        TEXT file_name "nur PDF, UUID-Name"
        TEXT original_name "nur PDF"
        INTEGER file_size
        INTEGER exam_year "nur altklausur"
        TEXT source
        TEXT created_at
    }
    content_topics {
        INTEGER content_id PK, FK
        INTEGER topic_id PK, FK
    }
    ratings {
        INTEGER id PK
        INTEGER course_id FK "UNIQUE mit user_id"
        INTEGER user_id FK
        INTEGER vorlesung "1 bis 5"
        INTEGER uebungen "1 bis 5"
        INTEGER schwierigkeit "1 bis 5"
        INTEGER aufwand "1 bis 5"
        TEXT comment "Erfahrungsbericht, optional"
        TEXT created_at
        TEXT updated_at
    }
    upvotes {
        INTEGER content_id PK, FK
        INTEGER user_id PK, FK
        TEXT created_at
    }
    favorites {
        INTEGER id PK
        INTEGER user_id FK
        INTEGER course_id FK "oder content_id"
        INTEGER content_id FK "oder course_id"
    }
    reports {
        INTEGER id PK
        INTEGER user_id FK
        INTEGER content_id FK "oder rating_id"
        INTEGER rating_id FK "oder content_id"
        TEXT reason
        TEXT created_at
    }
```

## Beziehungen und Löschverhalten

| Beziehung | Art | Beim Löschen des Elternteils |
| --- | --- | --- |
| `courses` → `topics` | 1 : n | Themenfelder werden gelöscht (`CASCADE`) |
| `courses` → `contents` | 1 : n | Inhalte werden gelöscht (`CASCADE`) |
| `users` → `contents` | 1 : n | Inhalt bleibt, `user_id` wird `NULL` (`SET NULL`) |
| `contents` ↔ `topics` über `content_topics` | m : n | Zuordnung wird gelöscht (`CASCADE`) |
| `courses` → `ratings`, `users` → `ratings` | 1 : n | Bewertungen werden gelöscht (`CASCADE`) |
| `contents` → `upvotes`, `users` → `upvotes` | 1 : n | Daumen werden gelöscht (`CASCADE`) |
| `users` / `courses` / `contents` → `favorites` | 1 : n | Favoriten werden gelöscht (`CASCADE`) |
| `users` / `contents` / `ratings` → `reports` | 1 : n | Meldungen werden gelöscht (`CASCADE`) |

## Regeln, die das Schema selbst erzwingt

- `users.username` ist eindeutig, `users.role` ist `user` oder `admin`.
- `ratings`: Pro Kurs und Nutzer gibt es höchstens eine Bewertung (`UNIQUE (course_id, user_id)`). Alle vier Werte liegen zwischen 1 und 5.
- `upvotes`: Der zusammengesetzte Primärschlüssel `(content_id, user_id)` erlaubt pro Nutzer nur einen Daumen je Inhalt.
- `contents`: Der Typ `tipp` ist nur als Text erlaubt (`CHECK (type <> 'tipp' OR format = 'text')`).
- `favorites` und `reports`: Genau eine der beiden Spalten ist gesetzt (`CHECK ((a IS NULL) <> (b IS NULL))`). In `favorites` verhindert `UNIQUE` keine Duplikate, weil SQLite `NULL`-Werte als verschieden behandelt. Die Abfragefunktion prüft deshalb vorher selbst.
- Durchschnittswerte und Zählungen (Daumen, Anzahl Bewertungen) sind **nicht** gespeichert, sondern werden per SQL berechnet (`AVG`, `COUNT`). Damit gibt es keine Redundanz, und die 3. Normalform bleibt erhalten.
