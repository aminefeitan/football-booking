# ⚽ Football Booking — Plateforme de Réservation de Terrains de Football

> Application web complète pour la recherche, la réservation de terrains de football, l'organisation de matchs et la gestion d'équipes.

---

## 📋 Table des Matières

1. [Présentation du Projet](#-présentation-du-projet)
2. [Rôles et Acteurs](#-rôles-et-acteurs)
3. [Fonctionnalités Complètes](#-fonctionnalités-complètes)
4. [Architecture de l'Application](#-architecture-de-lapplication)
5. [Stack Technologique](#-stack-technologique)
6. [Modèle de Données](#-modèle-de-données)
7. [API REST — Endpoints](#-api-rest--endpoints)
8. [Règles Métier](#-règles-métier)
9. [Plan Frontend — Interfaces Nécessaires](#-plan-frontend--interfaces-nécessaires)
10. [Installation et Lancement](#-installation-et-lancement)

---

## 🎯 Présentation du Projet

### Contexte

Au Maroc et dans de nombreux pays, la réservation de terrains de football (synthétiques ou naturels) se fait encore majoritairement par téléphone ou en se déplaçant sur place. Les joueurs amateurs rencontrent des difficultés pour :

- 🔍 Trouver des terrains disponibles dans leur ville
- 🏟️ Organiser des matchs entre amis ou avec des inconnus
- 💰 Gérer les paiements de manière transparente
- 👥 Constituer des équipes et inviter des joueurs

### Solution

**Football Booking** est une application web qui permet de :

- Rechercher et réserver des terrains de football en ligne, avec gestion automatique des créneaux horaires et des conflits de réservation
- Organiser et rejoindre des matchs (publics ou privés) avec gestion automatique des places disponibles
- Créer et gérer des équipes, inviter des joueurs, définir des rôles (capitaine, membre)
- Gérer les paiements liés aux réservations
- Offrir aux gestionnaires de terrains un espace dédié pour administrer leurs infrastructures

---

## 👥 Rôles et Acteurs

L'application définit **3 rôles principaux** + un système externe :

### 🏃 Joueur (`PLAYER`)

| Aspect | Description |
|--------|-------------|
| **Identité** | Utilisateur principal de la plateforme, modélisé par l'entité polymorphique `Player` (héritant de `User`) |
| **Objectif** | Trouver des terrains, réserver des créneaux, jouer des matchs, rejoindre des équipes |
| **Profil & Attributs** | Intègre directement la position préférée, le niveau de compétence, la ville, la bio et la disponibilité |
| **Permissions** | Rechercher des terrains · Réserver des créneaux · Créer/rejoindre des matchs · Créer/rejoindre des équipes · Inviter des joueurs · Gérer son profil · Effectuer des paiements |

**Cycle de vie du joueur :**
1. S'inscrit avec email/mot de passe en tant que `PLAYER` → une instance de `Player` est persistée en base
2. Complète son profil sportif (position, niveau, ville, disponibilité)
3. Recherche et réserve des terrains
4. Crée ou rejoint des matchs publics/privés
5. Crée des équipes ou accepte des invitations

---

### 🏗️ Gestionnaire de Terrain (`FIELD_MANAGER`)

| Aspect | Description |
|--------|-------------|
| **Identité** | Propriétaire ou gérant de terrains, modélisé par l'entité polymorphique `FieldManager` (héritant de `User`) |
| **Objectif** | Gérer ses terrains, consulter les réservations, suivre ses revenus |
| **Attributs spécifiques** | Raison sociale (`businessName`), identifiant fiscal (`taxNumber`), collection de terrains gérés |
| **Permissions** | Ajouter un terrain · Modifier les infos d'un terrain · Activer/Désactiver un terrain · Consulter les réservations de ses terrains · Consulter ses revenus |

**Responsabilités :**
- Définit les caractéristiques du terrain : type (5v5, 7v7, 11v11), surface, prix/heure, équipements (éclairage, vestiaires, parking, intérieur/extérieur)
- Renseigne l'adresse, les coordonnées GPS et les informations de contact
- Gère la disponibilité en activant/désactivant le terrain
- Suit les réservations effectuées sur ses terrains

---

### 🛡️ Administrateur (`ADMIN`)

| Aspect | Description |
|--------|-------------|
| **Identité** | Superviseur global de la plateforme, modélisé par l'entité polymorphique `Admin` (héritant de `User`) |
| **Objectif** | Gérer les utilisateurs, modérer le contenu, superviser l'activité |
| **Attributs spécifiques** | Département de rattachement (`department`) |
| **Permissions** | Gérer les utilisateurs (changer statut : `ACTIVE`, `INACTIVE`, `SUSPENDED`, `BANNED`) · Gérer les rôles · Consulter tous les terrains et réservations · Accéder aux statistiques |

**Statuts utilisateur gérés par l'Admin :**

| Statut | Description |
|--------|-------------|
| `ACTIVE` | Compte actif, accès complet |
| `INACTIVE` | Compte inactif (désactivé) |
| `SUSPENDED` | Compte temporairement suspendu |
| `BANNED` | Compte banni (connexion refusée) |

---

### 💳 Système de Paiement (Externe)

Système externe de traitement des paiements (Stripe, CMI, etc.) pour valider et traiter les transactions financières liées aux réservations. Dans la V1 (MVP), le paiement est simulé en interne avec enregistrement de la transaction.

**Méthodes de paiement supportées :** `CREDIT_CARD` · `CASH` · `STRIPE` · `CMI`

---

## ⚙️ Fonctionnalités Complètes

### 🔐 Module Authentification & Profil

| Fonctionnalité | Description | Rôle |
|----------------|-------------|------|
| Inscription | Créer un compte avec email, mot de passe (haché BCrypt), nom, prénom, téléphone, rôle | Tous |
| Connexion | Se connecter avec email et mot de passe, recevoir un token d'authentification | Tous |
| Profil courant | Consulter son profil via le header `X-User-Id` | Tous |
| Profil joueur | Créer/modifier son profil sportif (position, niveau, ville, bio, disponibilité) | Player |
| Recherche joueurs | Rechercher des joueurs disponibles par ville | Player |

### 🏟️ Module Terrains

| Fonctionnalité | Description | Rôle |
|----------------|-------------|------|
| Lister les terrains | Voir tous les terrains actifs | Tous |
| Recherche avancée | Filtrer par ville, type (5v5/7v7/11v11), prix max, intérieur, éclairage | Tous |
| Détails d'un terrain | Consulter toutes les caractéristiques d'un terrain | Tous |
| Ajouter un terrain | Créer un nouveau terrain avec toutes ses caractéristiques | Field Manager |
| Modifier un terrain | Mettre à jour les informations d'un terrain | Field Manager |
| Désactiver un terrain | Rendre un terrain indisponible (soft delete) | Field Manager |

### 📅 Module Réservations

| Fonctionnalité | Description | Rôle |
|----------------|-------------|------|
| Créer une réservation | Réserver un créneau horaire sur un terrain avec calcul automatique du prix | Player |
| Mes réservations | Consulter la liste de ses réservations (historique + à venir) | Player |
| Détails réservation | Voir le détail d'une réservation spécifique | Tous |
| Annuler une réservation | Annuler sa propre réservation avec un motif | Player |
| Expiration automatique | Les réservations non payées expirent après 15 minutes | Système |
| Confirmation automatique | La réservation passe à `CONFIRMED` après le paiement | Système |

**Cycle de vie d'une réservation :**
```
PENDING_PAYMENT ──► CONFIRMED ──► COMPLETED
       │                │
       ▼                ▼
    EXPIRED         CANCELLED
```

### ⚽ Module Matchs

| Fonctionnalité | Description | Rôle |
|----------------|-------------|------|
| Créer un match | Définir titre, date, durée, nombre max joueurs, public/privé, ville, terrain | Player (organisateur) |
| Lister les matchs | Voir les matchs publics à venir, filtrables par ville | Tous |
| Détails d'un match | Consulter les infos et la liste des participants | Tous |
| Rejoindre un match | S'inscrire à un match ouvert en choisissant un côté (A ou B) | Player |
| Quitter un match | Se désinscrire d'un match | Player |
| Annuler un match | Annuler le match (réservé à l'organisateur) | Player (organisateur) |

**Cycle de vie d'un match :**
```
OPEN ──► FULL ──► IN_PROGRESS ──► COMPLETED
  │        │
  ▼        ▼
CANCELLED CANCELLED
```

**Comportement automatique :**
- L'organisateur est automatiquement inscrit comme participant côté A avec le statut `CONFIRMED`
- Quand le nombre max de joueurs est atteint → statut passe à `FULL`
- Quand un joueur quitte un match `FULL` → statut revient à `OPEN`

### 👥 Module Équipes

| Fonctionnalité | Description | Rôle |
|----------------|-------------|------|
| Créer une équipe | Définir nom, description, ville, nombre max de membres | Player |
| Lister les équipes | Voir les équipes actives, filtrables par ville | Tous |
| Détails d'une équipe | Consulter les infos et la liste des membres | Tous |
| Ajouter un membre | Ajouter directement un joueur à une équipe | Captain |
| Retirer un membre | Retirer un joueur de l'équipe | Captain |
| Mes équipes | Consulter les équipes dont on est membre | Player |

**Système d'invitations :**

| Fonctionnalité | Description | Rôle |
|----------------|-------------|------|
| Inviter un joueur | Envoyer une invitation à un joueur | Captain / Membre |
| Voir les invitations d'une équipe | Consulter toutes les invitations envoyées | Captain |
| Mes invitations en attente | Voir les invitations reçues | Player |
| Accepter une invitation | Accepter et devenir membre automatiquement | Player (invité) |
| Décliner une invitation | Refuser l'invitation | Player (invité) |

**Rôles dans l'équipe :**
- `CAPTAIN` : Créateur de l'équipe, droits d'administration
- `MEMBER` : Membre standard

### 💰 Module Paiements

| Fonctionnalité | Description | Rôle |
|----------------|-------------|------|
| Effectuer un paiement | Payer une réservation (la confirme automatiquement) | Player |
| Historique des paiements | Consulter ses transactions passées | Player |

**Statuts de paiement :** `PENDING` → `COMPLETED` / `FAILED` / `REFUNDED`

### 👤 Module Administration (Utilisateurs)

| Fonctionnalité | Description | Rôle |
|----------------|-------------|------|
| Consulter un utilisateur | Voir les détails d'un utilisateur par ID | Admin |
| Lister par rôle | Filtrer les utilisateurs par rôle (PLAYER, FIELD_MANAGER, ADMIN) | Admin |

---

## 🏗️ Architecture de l'Application

### Architecture 3-tiers (MVC)

```
┌──────────────────────────────────────────────────────────────┐
│                     CLIENT (Navigateur)                       │
│              Future interface Frontend (React/Next.js)        │
└─────────────────────────┬────────────────────────────────────┘
                          │ HTTP / JSON
                          ▼
┌──────────────────────────────────────────────────────────────┐
│              COUCHE PRÉSENTATION (API REST)                   │
│              JAX-RS Resources — @Path("/api/v1")              │
│                                                              │
│  AuthResource      BookingResource     FieldResource         │
│  MatchResource     PaymentResource     PlayerResource        │
│  TeamResource      UserResource                              │
│                                                              │
│  ── Transversal ──                                           │
│  CorsFilter (CORS)    ApiExceptionMapper (erreurs JSON)      │
└─────────────────────────┬────────────────────────────────────┘
                          │ @Inject (CDI)
                          ▼
┌──────────────────────────────────────────────────────────────┐
│              COUCHE MÉTIER (Services)                         │
│              CDI Beans — @ApplicationScoped @Transactional    │
│                                                              │
│  AuthService       BookingService      FieldService          │
│  MatchService      PaymentService      PlayerService         │
│  TeamService                                                 │
└─────────────────────────┬────────────────────────────────────┘
                          │ EntityManager (JPA)
                          ▼
┌──────────────────────────────────────────────────────────────┐
│              COUCHE DONNÉES (Entities JPA)                    │
│              Jakarta Persistence 3.2 / Hibernate              │
│                                                              │
│  BaseEntity (@MappedSuperclass)                              │
│  User (JOINED) ──► Player, FieldManager, Admin               │
│  Field             Booking             Payment               │
│  Match             MatchParticipant    Team                  │
│  TeamMember        TeamInvitation                            │
└─────────────────────────┬────────────────────────────────────┘
                          │ JDBC / Flyway
                          ▼
┌──────────────────────────────────────────────────────────────┐
│              BASE DE DONNÉES — PostgreSQL                     │
│              Schéma unifié de zéro : schema.sql              │
│              Migration initiale Flyway : V1__schema.sql      │
└──────────────────────────────────────────────────────────────┘
```

### Organisation du Code Source

```
src/main/java/com/sports/footballbooking/
├── HelloApplication.java          # Point d'entrée JAX-RS (@ApplicationPath("/api/v1"))
├── config/
│   ├── CorsFilter.java            # Filtre CORS pour les requêtes cross-origin
│   └── FlywayMigrator.java        # Lancement automatique des migrations Flyway
├── entity/                        # Entités JPA (modèle de données & héritage)
│   ├── BaseEntity.java            # Superclasse d'audit (id, createdAt, updatedAt)
│   ├── User.java                  # Classe racine polymorphique abstraite (@Inheritance JOINED)
│   ├── Player.java                # Joueur (hérite de User, attributs sportifs)
│   ├── FieldManager.java          # Gestionnaire de terrain (hérite de User, businessName)
│   ├── Admin.java                 # Administrateur (hérite de User, department)
│   ├── Field.java                 # Terrain de football (hérite de BaseEntity)
│   ├── Booking.java               # Réservation de créneau (hérite de BaseEntity)
│   ├── Match.java                 # Match de football (hérite de BaseEntity)
│   ├── MatchParticipant.java      # Participant à un match
│   ├── Payment.java               # Paiement (hérite de BaseEntity)
│   ├── Team.java                  # Équipe (hérite de BaseEntity)
│   ├── TeamMember.java            # Membre d'une équipe
│   └── TeamInvitation.java        # Invitation à une équipe (hérite de BaseEntity)
├── exception/                     # Gestion centralisée des erreurs
│   ├── ApiExceptionMapper.java    # Conversion exceptions → réponses JSON
│   ├── BusinessException.java     # Erreur métier (409 Conflict)
│   └── NotFoundException.java     # Ressource introuvable (404 Not Found)
├── resource/                      # Contrôleurs REST (endpoints)
│   ├── AuthResource.java          # /api/v1/auth
│   ├── BookingResource.java       # /api/v1/bookings
│   ├── FieldResource.java         # /api/v1/fields
│   ├── MatchResource.java         # /api/v1/matches
│   ├── PaymentResource.java       # /api/v1/payments
│   ├── PlayerResource.java        # /api/v1/players
│   ├── TeamResource.java          # /api/v1/teams
│   └── UserResource.java          # /api/v1/users
└── service/                       # Logique métier
    ├── AuthService.java           # Inscription, connexion, hachage BCrypt
    ├── BookingService.java        # Création, annulation, expiration réservations
    ├── FieldService.java          # CRUD terrains, recherche avancée
    ├── MatchService.java          # Gestion matchs, inscriptions, annulation
    ├── PaymentService.java        # Traitement paiements, confirmation réservation
    ├── PlayerService.java         # Gestion des joueurs, recherche
    └── TeamService.java           # Équipes, membres, invitations

src/main/resources/
├── META-INF/
│   ├── persistence.xml            # Configuration JPA (Hibernate, PostgreSQL)
│   └── beans.xml                  # Configuration CDI
└── db/migration/
    └── V1__schema.sql             # Schéma complet de zéro (Flyway)
```

### Couches en Détail

| Couche | Responsabilité | Technologies |
|--------|---------------|--------------|
| **Présentation** | Expose les endpoints REST, reçoit les requêtes HTTP, retourne les réponses JSON | JAX-RS 4.0, JSON-B 3.0 |
| **Métier** | Logique métier, validations, calculs de prix, gestion des statuts | CDI 4.1, Bean Validation 3.1 |
| **Données** | Mapping objet-relationnel, requêtes nommées, lifecycle callbacks | JPA 3.2, Hibernate |
| **Transversale** | CORS, exception mapping, migrations BDD | CorsFilter, ApiExceptionMapper, Flyway |

---

## 🛠️ Stack Technologique

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Langage | Java | 17 |
| Spécification | Jakarta EE | 10 |
| Serveur d'applications | WildFly | — |
| API REST | JAX-RS (Jakarta RESTful Web Services) | 4.0 |
| Injection de dépendances | CDI (Contexts and Dependency Injection) | 4.1 |
| ORM / Persistance | JPA (Jakarta Persistence) / Hibernate | 3.2 |
| Base de données | PostgreSQL | — |
| Driver JDBC | PostgreSQL JDBC | 42.7.4 |
| Migration de schéma | Flyway | 10.21.0 |
| Validation | Bean Validation (Jakarta Validation) | 3.1 |
| Sérialisation JSON | JSON-B + JSON-P | 3.0 / 2.1 |
| Hachage mot de passe | BCrypt (favre-lib) | 0.10.2 |
| Build | Apache Maven (WAR packaging) | — |
| Tests unitaires | JUnit 5 (Jupiter) | 5.10.2 |
| Tests mocking | Mockito | 5.11.0 |
| Tests API | Postman (collection incluse) | — |

---

## 🗃️ Modèle de Données

### Diagramme de Relations & Héritage

```
BaseEntity (@MappedSuperclass : id, createdAt, updatedAt)
  ▲
  ├── Field, Booking, Team, Payment, Match, TeamInvitation
  │
  └── User (@Inheritance JOINED)
        ▲
        ├── Player       (attributs sportifs : position, niveau, ville, bio, dispo)
        ├── FieldManager (businessName, taxNumber, managedFields)
        └── Admin        (department)

User (1) ─────────────────── (*)    Booking        [en tant que réservant]
User (1) ─────────────────── (*)    Payment        [en tant que payeur]
User (1) ─────────────────── (*)    Field          [en tant qu'owner / gestionnaire]
User (1) ─────────────────── (*)    Match          [en tant qu'organisateur]
User (1) ─────────────────── (*)    Team           [en tant que créateur]
User (1) ─────────────────── (*)    TeamMember     [en tant que membre]
User (1) ─────────────────── (*)    MatchParticipant
User (1) ─────────────────── (*)    TeamInvitation [invitedUser / invitedBy]

Field (1) ────────────────── (*)    Booking
Field (1) ────────────────── (*)    Match

Booking (1) ──────────────── (*)    Payment
Booking (1) ──────────────── (0..1) Match

Match (1) ────────────────── (*)    MatchParticipant

Team (1) ─────────────────── (*)    TeamMember
Team (1) ─────────────────── (*)    TeamInvitation
```

### Tables de la Base de Données

| Table | Colonnes Clés | Contraintes |
|-------|--------------|-------------|
| `users` | id (UUID PK), email (UNIQUE), password_hash, first_name, last_name, phone, role (ENUM), status (ENUM), created_at, updated_at | email unique |
| `players` | id (UUID PK, FK→users ON DELETE CASCADE), preferred_position, skill_level, city, bio, available | Héritage JOINED de `users` |
| `field_managers` | id (UUID PK, FK→users ON DELETE CASCADE), business_name, tax_number | Héritage JOINED de `users` |
| `admins` | id (UUID PK, FK→users ON DELETE CASCADE), department | Héritage JOINED de `users` |
| `fields` | id (UUID PK), owner_id (FK→users), name, city, field_type, price_per_hour, currency, indoor, has_lights, has_locker_room, has_parking, active, created_at, updated_at | — |
| `bookings` | id (UUID PK), user_id (FK→users), field_id (FK→fields), start_at, end_at, total_amount, status (ENUM), expires_at, created_at, updated_at | Exclusion GiST de chevauchement |
| `matches` | id (UUID PK), organizer_id (FK→users), booking_id (FK→bookings), field_id (FK→fields), title, match_date, max_players, status, is_public, created_at, updated_at | — |
| `match_participants` | id (UUID PK), match_id (FK→matches), user_id (FK→users), team_side, status, joined_at | UNIQUE(match_id, user_id) |
| `payments` | id (UUID PK), user_id (FK→users), booking_id (FK→bookings), amount, payment_method, status, transaction_ref, paid_at, created_at, updated_at | — |
| `teams` | id (UUID PK), creator_id (FK→users), name, city, max_members, active, created_at, updated_at | — |
| `team_members` | id (UUID PK), team_id (FK→teams), user_id (FK→users), role, position, joined_at | UNIQUE(team_id, user_id) |
| `team_invitations` | id (UUID PK), team_id (FK→teams), invited_user_id (FK→users), invited_by_id (FK→users), status, created_at, updated_at | UNIQUE(team_id, invited_user_id) |

---

## 🌐 API REST — Endpoints

Base URL : `/api/v1`

### 🔐 Authentification (`/auth`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/auth/register` | Inscription d'un nouvel utilisateur | ❌ |
| `POST` | `/auth/login` | Connexion (retourne un token) | ❌ |
| `GET` | `/auth/me` | Profil de l'utilisateur connecté | ✅ `X-User-Id` |

### 🏟️ Terrains (`/fields`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/fields` | Lister les terrains actifs (filtres: city, fieldType, maxPrice, indoor, hasLights) | ❌ |
| `GET` | `/fields/{id}` | Détails d'un terrain | ❌ |
| `POST` | `/fields` | Créer un terrain | ✅ `X-User-Id` (Field Manager) |
| `PUT` | `/fields/{id}` | Modifier un terrain | ✅ |
| `DELETE` | `/fields/{id}` | Désactiver un terrain (soft delete) | ✅ |

### 📅 Réservations (`/bookings`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/bookings` | Créer une réservation | ✅ `X-User-Id` |
| `GET` | `/bookings/me` | Mes réservations | ✅ `X-User-Id` |
| `GET` | `/bookings/{id}` | Détails d'une réservation | ❌ |
| `PATCH` | `/bookings/{id}/cancel` | Annuler une réservation | ✅ `X-User-Id` |

### ⚽ Matchs (`/matches`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/matches` | Lister les matchs publics à venir (filtre: city) | ❌ |
| `GET` | `/matches/{id}` | Détails d'un match avec participants | ❌ |
| `POST` | `/matches` | Créer un match | ✅ `X-User-Id` |
| `POST` | `/matches/{id}/join` | Rejoindre un match (body: teamSide A/B) | ✅ `X-User-Id` |
| `DELETE` | `/matches/{id}/leave` | Quitter un match | ✅ `X-User-Id` |
| `POST` | `/matches/{id}/cancel` | Annuler un match (organisateur uniquement) | ✅ `X-User-Id` |

### 👥 Équipes (`/teams`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/teams` | Lister les équipes (filtre: city) | ❌ |
| `GET` | `/teams/{id}` | Détails d'une équipe avec membres | ❌ |
| `POST` | `/teams` | Créer une équipe | ✅ `X-User-Id` |
| `POST` | `/teams/{id}/members` | Ajouter un membre | ✅ |
| `DELETE` | `/teams/{id}/members/{userId}` | Retirer un membre | ✅ |
| `GET` | `/teams/user/{userId}` | Équipes d'un utilisateur | ❌ |

### ✉️ Invitations d'Équipe (`/teams`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/teams/{id}/invitations` | Inviter un joueur | ✅ `X-User-Id` |
| `GET` | `/teams/{id}/invitations` | Invitations d'une équipe | ❌ |
| `GET` | `/teams/invitations/pending` | Mes invitations en attente | ✅ `X-User-Id` |
| `POST` | `/teams/invitations/{invitationId}/accept` | Accepter une invitation | ✅ `X-User-Id` |
| `POST` | `/teams/invitations/{invitationId}/decline` | Décliner une invitation | ✅ `X-User-Id` |

### 💰 Paiements (`/payments`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `POST` | `/payments` | Effectuer un paiement | ✅ `X-User-Id` |
| `GET` | `/payments/my` | Historique de mes paiements | ✅ `X-User-Id` |

### 🏃 Joueurs (`/players`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/players` | Rechercher des joueurs (filtre: `city`) | ❌ |
| `GET` | `/players/available` | Rechercher les joueurs disponibles (filtre: `city`) | ❌ |
| `GET` | `/players/me` | Profil du joueur connecté | ✅ `X-User-Id` |
| `PUT` | `/players/me` | Mettre à jour mon profil de joueur | ✅ `X-User-Id` |
| `GET` | `/players/{userId}` | Profil d'un joueur par son ID | ❌ |
| `PUT` | `/players/{userId}` | Modifier un profil joueur par son ID | ❌ |

### 👤 Utilisateurs (`/users`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/users/{id}` | Détails d'un utilisateur | ❌ |
| `GET` | `/users` | Lister les utilisateurs par rôle (filtre: role) | ❌ |

---

## 📏 Règles Métier

| # | Règle | Module |
|---|-------|--------|
| R1 | Un utilisateur ne peut pas réserver un créneau déjà occupé (vérification de chevauchement) | Réservation |
| R2 | Durée de réservation : min 30 minutes, max 4 heures | Réservation |
| R3 | Impossible de réserver dans le passé | Réservation |
| R4 | Un terrain doit être actif (`active = true`) pour accepter des réservations | Réservation |
| R5 | Une réservation non payée expire automatiquement après 15 minutes | Réservation |
| R6 | Seul le propriétaire d'une réservation peut l'annuler | Réservation |
| R7 | Une réservation `CANCELLED` ou `COMPLETED` ne peut pas être re-annulée | Réservation |
| R8 | L'organisateur d'un match est automatiquement inscrit comme participant (côté A, statut `CONFIRMED`) | Match |
| R9 | Un joueur ne peut pas s'inscrire deux fois au même match | Match |
| R10 | Un match complet (nombre max atteint) passe automatiquement en `FULL` | Match |
| R11 | Seul l'organisateur peut annuler un match | Match |
| R12 | Un joueur ne peut être invité qu'une seule fois dans la même équipe | Équipe |
| R13 | Un joueur ne peut être membre d'une équipe qu'une seule fois | Équipe |
| R14 | Les mots de passe sont hachés avec BCrypt (jamais stockés en clair) | Auth |
| R15 | L'email de chaque utilisateur est unique dans le système | Auth |
| R16 | Prix total = prix_par_heure × durée_en_heures (arrondi à 2 décimales) | Réservation |
| R17 | La devise par défaut est le **MAD** (Dirham marocain) | Global |

---

## 🎨 Plan Frontend — Interfaces Nécessaires

### Choix Technologique Recommandé

| Option | Framework | Avantages |
|--------|-----------|-----------|
| **Recommandé** | **React + Vite** | Rapide, écosystème riche, facile à intégrer avec l'API REST |
| Alternative | Next.js | SSR, SEO optimisé |
| Alternative | Angular | Structuré, TypeScript natif |

### Phase 1 — Pages Publiques & Authentification (Semaine 1)

#### 1.1 Page d'Accueil (`/`)
- Hero section avec illustration terrain de football
- Barre de recherche rapide (ville + type de terrain)
- Section "Matchs à venir" (aperçu des matchs publics)
- Section "Comment ça marche" (3 étapes)
- Footer avec liens

#### 1.2 Page Inscription (`/register`)
- Formulaire : email, mot de passe, confirmation mot de passe, prénom, nom, téléphone
- Sélecteur de rôle : Joueur / Gestionnaire de terrain
- Validation en temps réel (email format, force du mot de passe)
- Lien vers la page de connexion

#### 1.3 Page Connexion (`/login`)
- Formulaire : email, mot de passe
- Option "Mot de passe oublié" (future)
- Lien vers la page d'inscription
- Message d'erreur en cas d'échec

#### 1.4 Layout Principal (Navbar + Sidebar)
- Navigation conditionnelle selon le rôle (Player / Field Manager / Admin)
- Avatar utilisateur + menu déroulant
- Notifications (badges invitations en attente)
- Bouton de déconnexion

---

### Phase 2 — Module Terrains (Semaine 1-2)

#### 2.1 Page Recherche de Terrains (`/fields`)
- Barre de recherche avec filtres : ville, type (5v5/7v7/11v11), prix max, intérieur/extérieur, éclairage
- Grille de cartes de terrains (photo, nom, ville, prix/h, type, note)
- Vue carte (optionnel, avec coordonnées GPS)
- Pagination / infinite scroll

#### 2.2 Page Détail d'un Terrain (`/fields/:id`)
- Galerie photos du terrain
- Informations complètes : nom, adresse, ville, type, surface, prix
- Badges d'équipements (éclairage ✅, vestiaires ✅, parking ✅, intérieur ❌)
- Coordonnées de contact
- Calendrier de disponibilité (créneaux)
- Bouton "Réserver" → modal de réservation
- Localisation sur carte (latitude/longitude)

#### 2.3 Formulaire de Réservation (Modal ou Page `/fields/:id/book`)
- Sélecteur de date et d'heure (date picker + time picker)
- Durée (slider 30min — 4h)
- Résumé : terrain, créneau, prix calculé
- Bouton "Confirmer la réservation"
- Compte à rebours de 15 min après création (avant expiration)

---

### Phase 3 — Module Matchs (Semaine 2)

#### 3.1 Page Liste des Matchs (`/matches`)
- Filtre par ville
- Cartes de matchs : titre, date, lieu, organisateur, places restantes (X/max), statut
- Barre de progression visuelle (places occupées)
- Badge de statut (OPEN en vert, FULL en orange, CANCELLED en rouge)

#### 3.2 Page Détail d'un Match (`/matches/:id`)
- Informations complètes : titre, description, date, durée, terrain associé
- Composition des équipes : Côté A vs Côté B (avec avatars des joueurs)
- Nombre de places restantes
- Bouton "Rejoindre" → choix du côté (A ou B)
- Bouton "Quitter" si déjà inscrit
- Bouton "Annuler le match" si organisateur

#### 3.3 Formulaire Créer un Match (Modal ou Page `/matches/create`)
- Titre, description
- Date et heure (date-time picker)
- Durée (en minutes)
- Nombre max de joueurs
- Public / Privé (toggle)
- Ville
- Sélecteur de terrain (optionnel)
- Lien avec une réservation existante (optionnel)

---

### Phase 4 — Module Équipes & Invitations (Semaine 2-3)

#### 4.1 Page Liste des Équipes (`/teams`)
- Filtre par ville
- Cartes d'équipes : nom, ville, nombre de membres, logo/avatar
- Bouton "Créer une équipe"

#### 4.2 Page Détail d'une Équipe (`/teams/:id`)
- Informations : nom, description, ville, créateur
- Liste des membres (avatar, nom, rôle CAPTAIN/MEMBER, position)
- Actions du capitaine : inviter un joueur, retirer un membre
- Bouton "Quitter l'équipe" pour les membres

#### 4.3 Formulaire Créer une Équipe (Modal)
- Nom, description, ville, nombre max de membres

#### 4.4 Modal Inviter un Joueur
- Recherche de joueurs par nom ou ville
- Liste des joueurs disponibles avec leur profil
- Bouton "Inviter"

#### 4.5 Page Mes Invitations (`/invitations`)
- Liste des invitations en attente
- Pour chaque invitation : équipe, invité par, date
- Boutons "Accepter" / "Décliner"

---

### Phase 5 — Tableaux de Bord par Rôle (Semaine 3)

#### 5.1 Dashboard Joueur (`/dashboard`)
- **Résumé** : nombre de réservations actives, matchs à venir, équipes
- **Mes réservations** : liste avec statut (couleur codée), lien vers détails
- **Mes matchs** : prochains matchs auxquels je suis inscrit
- **Mes équipes** : liste des équipes avec mon rôle
- **Invitations en attente** : notification + action rapide
- **Mon profil joueur** : position, niveau, disponibilité (éditable)

#### 5.2 Dashboard Gestionnaire de Terrain (`/manager/dashboard`)
- **Mes terrains** : liste de mes terrains avec statut (actif/inactif)
- **Réservations récentes** : dernières réservations sur mes terrains
- **Revenus** : total des revenus (par terrain, par période)
- **Formulaire rapide** : ajouter un nouveau terrain
- **Statistiques** : taux d'occupation, créneaux les plus demandés

#### 5.3 Dashboard Administrateur (`/admin/dashboard`)
- **Vue d'ensemble** : nombre total d'utilisateurs, terrains, réservations, matchs
- **Gestion des utilisateurs** : tableau avec recherche, filtres par rôle/statut, actions (activer/suspendre/bannir)
- **Terrains** : liste de tous les terrains
- **Réservations** : vue globale des réservations

---

### Phase 6 — Pages de Profil & Paramètres (Semaine 3)

#### 6.1 Page Mon Profil (`/profile`)
- Informations personnelles (nom, email, téléphone) — éditable
- Profil joueur (position, niveau, ville, bio, disponibilité) — éditable
- Historique des paiements

#### 6.2 Page Profil Public d'un Joueur (`/players/:id`)
- Informations publiques : nom, position, niveau, ville, bio
- Badge de disponibilité (Disponible / Indisponible)
- Équipes dont il est membre
- Bouton "Inviter dans une équipe"

---

### Récapitulatif des Interfaces

| # | Page / Composant | Route | Rôle Cible |
|---|-----------------|-------|------------|
| 1 | Accueil | `/` | Public |
| 2 | Inscription | `/register` | Public |
| 3 | Connexion | `/login` | Public |
| 4 | Recherche Terrains | `/fields` | Public |
| 5 | Détail Terrain | `/fields/:id` | Public |
| 6 | Réservation (Modal) | `/fields/:id/book` | Player |
| 7 | Liste Matchs | `/matches` | Public |
| 8 | Détail Match | `/matches/:id` | Public |
| 9 | Créer Match | `/matches/create` | Player |
| 10 | Liste Équipes | `/teams` | Public |
| 11 | Détail Équipe | `/teams/:id` | Public |
| 12 | Créer Équipe (Modal) | — | Player |
| 13 | Mes Invitations | `/invitations` | Player |
| 14 | Dashboard Joueur | `/dashboard` | Player |
| 15 | Dashboard Gestionnaire | `/manager/dashboard` | Field Manager |
| 16 | Dashboard Admin | `/admin/dashboard` | Admin |
| 17 | Mon Profil | `/profile` | Tous (connectés) |
| 18 | Profil Public Joueur | `/players/:id` | Public |
| 19 | Mes Réservations | `/bookings` | Player |
| 20 | Historique Paiements | `/payments` | Player |
| 21 | Gestion Utilisateurs | `/admin/users` | Admin |
| 22 | Gestion Terrains (Manager) | `/manager/fields` | Field Manager |

### Composants Réutilisables

| Composant | Usage |
|-----------|-------|
| `Navbar` | Navigation principale, conditionnelle par rôle |
| `FieldCard` | Carte résumé d'un terrain (grille de recherche) |
| `MatchCard` | Carte résumé d'un match (liste des matchs) |
| `TeamCard` | Carte résumé d'une équipe |
| `PlayerCard` | Carte résumé d'un joueur |
| `BookingRow` | Ligne de réservation dans un tableau |
| `InvitationCard` | Carte d'invitation avec actions accepter/décliner |
| `StatusBadge` | Badge coloré pour afficher un statut |
| `DateTimePicker` | Sélecteur de date et heure |
| `SearchBar` | Barre de recherche avec filtres |
| `Modal` | Modal réutilisable (formulaires, confirmations) |
| `LoadingSpinner` | Indicateur de chargement |
| `EmptyState` | État vide avec illustration |
| `Pagination` | Pagination de listes |
| `ProtectedRoute` | Route protégée par authentification et rôle |

---

## 🚀 Installation et Lancement

### Prérequis

- Java 17+
- Maven 3.8+
- PostgreSQL 14+
- WildFly 30+ (ou compatible Jakarta EE 10)

### Configuration de la Base de Données

```sql
CREATE DATABASE football_booking;
CREATE USER football_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE football_booking TO football_user;
```

Initialiser le schéma complet directement avec le script unifié :
```bash
psql -U football_user -d football_booking -f schema.sql
```
*(Alternativement, Flyway exécutera automatiquement la migration équivalente `V1__schema.sql` lors du démarrage de l'application).*

### Configuration WildFly (datasource)

Ajouter la datasource `FootballBookingDS` dans la configuration WildFly :

```xml
<datasource jndi-name="java:jboss/datasources/FootballBookingDS"
            pool-name="FootballBookingDS">
    <connection-url>jdbc:postgresql://localhost:5432/football_booking</connection-url>
    <driver>postgresql</driver>
    <security>
        <user-name>football_user</user-name>
        <password>your_password</password>
    </security>
</datasource>
```

### Build et Déploiement

```bash
# Build du projet (génère le fichier WAR)
mvn clean package

# Le fichier WAR est généré dans target/football-booking-1.0-SNAPSHOT.war
# Déployer le WAR dans WildFly (copier dans standalone/deployments/)
```

### Test de l'API

Une collection Postman est incluse dans le projet :
- Fichier : `football_booking_postman_collection.json`
- Importer dans Postman pour tester tous les endpoints

---

## 📝 Licence

Projet universitaire — Octobre 2026

---

*Généré à partir de l'analyse complète du code source du projet Football Booking.*
