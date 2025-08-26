# Supabase Setup Guide

## Environment-Konfiguration

### 1. Environment-Dateien erstellen

Kopieren Sie die Beispiel-Dateien und passen Sie die Supabase-Zugangsdaten an:

```bash
# Development Environment
cp src/environments/environment.example.ts src/environments/environment.ts

# Production Environment  
cp src/environments/environment.example.ts src/environments/environment.prod.ts
```

### 2. Supabase-Zugangsdaten eintragen

Bearbeiten Sie `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://your-project-id.supabase.co',
  supabaseAnonKey: 'your-anon-key-here'
};
```

Bearbeiten Sie `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  supabaseUrl: 'https://your-project-id.supabase.co',
  supabaseAnonKey: 'your-anon-key-here'
};
```

### 3. Supabase-Zugangsdaten finden

1. Gehen Sie zu [supabase.com](https://supabase.com)
2. Öffnen Sie Ihr Projekt
3. Gehen Sie zu **Settings** > **API**
4. Kopieren Sie:
   - **Project URL** → `supabaseUrl`
   - **anon public** Key → `supabaseAnonKey`

### 4. Sicherheit

- ✅ Environment-Dateien sind in `.gitignore` ausgeschlossen
- ✅ Keine API-Keys werden versioniert
- ✅ Beispiel-Datei bleibt für neue Entwickler verfügbar

### 5. Datenbank-Setup

Führen Sie die Migrationen aus:

```sql
-- Führen Sie die SQL-Dateien in database/migrations/ aus:
-- 001_create_bm_tables.sql
-- 002_update_grades_schema.sql  
-- 003_create_scheduled_tests_table.sql
```

## Troubleshooting

**Problem**: App kann nicht auf Supabase zugreifen
**Lösung**: Überprüfen Sie URL und API-Key in den Environment-Dateien

**Problem**: Datenbank-Fehler
**Lösung**: Stellen Sie sicher, dass alle Migrationen ausgeführt wurden
