# Note sesiune Codex

## Relația User – Athlete – Team

- `User` are relații 1:1 opționale către `FootballAthlete` și `TennisAthlete`.
- Cheia străină este păstrată în tabelele de atleți: `FootballAthlete.userId` și `TennisAthlete.userId`. Ambele sunt obligatorii și `@unique`.
- Rolul (`atlet_fotbal` sau `atlet_tenis`) nu creează relația singur; este necesară și înregistrarea corespunzătoare din tabelul de atleți.
- Datele generale sunt în `Profile`, legat 1:1 de `User` prin `Profile.userId`.
- Echipa este asociată profilului prin `Profile.teamId`, care este opțional. O echipă poate avea mai multe profiluri.

## Parole

Parolele folosesc `bcryptjs`, cu 10 salt rounds:

```ts
await bcrypt.hash(password, 10)
```

Verificarea se face cu `bcrypt.compare(password, passwordHash)`.

## Seed useri de test

La 30 iulie 2026 a fost rulat cu succes `prisma/seed-useri.ts`.

- Au fost create 8 conturi de test, câte unul pentru fiecare rol.
- Au fost create și înregistrările asociate `FootballAthlete` și `TennisAthlete` pentru cei doi atleți de test.
- Parola implicită pentru aceste conturi: `Test1234!`.
- Fișierul de seed a fost ajustat pentru Prisma 7, folosind `PrismaPg` și un pool PostgreSQL, la fel ca restul proiectului.
