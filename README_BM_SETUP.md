# BM Notenberechnung Setup

## Datenbank Setup

Um die BM Notenberechnung zu verwenden, müssen Sie die Datenbanktabellen in Supabase erstellen.

### 1. Supabase SQL Editor

1. Gehen Sie zu Ihrem Supabase Dashboard
2. Öffnen Sie den SQL Editor
3. Führen Sie das folgende SQL-Skript aus:

```sql
-- Kopieren Sie den Inhalt aus database/migrations/001_create_bm_tables.sql
```

### 2. Tabellen Übersicht

**bm_settings**
- Speichert die BM-Typ Auswahl (TALS, WD-D, ARTE, Gesundheit & Soziales)
- Speichert die Studienform (Vollzeit/Teilzeit)

**grades**
- Speichert alle Noten (Semester-, Erfahrungs- und Prüfungsnoten)
- Unterstützt verschiedene Notentypen und Semester

### 3. Funktionen

Die App unterstützt:
- ✅ Auswahl des BM-Typs mit entsprechenden Fächern
- ✅ Eingabe von Semesternoten, Erfahrungsnoten und Prüfungsnoten
- ✅ Automatische Berechnung der Fachnoten nach BM-Regeln
- ✅ Berechnung der Gesamtnote
- ✅ Überprüfung der Bestehensnormen
- ✅ Spezielle Behandlung von Naturwissenschaften (Physik/Chemie)

### 4. Berechnungslogik

**Fachnoten:**
- Grundlagen- & Schwerpunktbereich: ½ Prüfungsnote + ½ Erfahrungsnote
- Ergänzungsbereich: Erfahrungsnote
- Erfahrungsnote: Durchschnitt aller Semesternoten (auf halbe Note gerundet)

**Bestehensnormen:**
1. Gesamtnote ≥ 4.0
2. Maximal 2 Fachnoten ungenügend
3. Summe der Abweichungen aller ungenügenden Noten ≤ 2.0

### 5. BM-Typen und Fächer

**BM 2 TALS:** Deutsch, Französisch, Englisch, Mathematik Grundlagen, Mathematik Schwerpunkt, Naturwissenschaften, Geschichte & Politik, Wirtschaft & Recht

**BM 2 WD-D:** Deutsch, Französisch, Englisch, Mathematik, Finanz- & Rechnungswesen, Wirtschaft & Recht Schwerpunkt, Wirtschaft & Recht Ergänzung, Geschichte & Politik

**BM 2 ARTE:** Deutsch, Französisch, Englisch, Mathematik, Gestaltung/Kunst/Kultur, Information & Kommunikation, Geschichte & Politik, Technik & Umwelt

**BM 2 Gesundheit & Soziales:** Deutsch, Französisch, Englisch, Mathematik, Sozialwissenschaften, Naturwissenschaften, Geschichte & Politik, Wirtschaft & Recht
