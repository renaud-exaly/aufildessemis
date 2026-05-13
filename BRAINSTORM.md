# Au fil des semis — Brainstorm & Spécifications

> *Un carnet vivant, partagé, où l'on suit ses semis saison après saison.*

Document de cadrage. Aligne le périmètre, la stack et les décisions avant de scaffolder.

---

## 1. Contexte projet

**Au fil des semis** est un site web / web app autour du potager :
- Tenir le journal de ses semis et plantations (photos datées, notes)
- Consulter une bibliothèque de fiches plantes enrichies de tips & conseils
- Partager avec une communauté bienveillante de jardiniers

**Public visé** : jardiniers amateurs francophones, plutôt débutants à intermédiaires. Belgique en priorité (calendriers, climat).

**Ton éditorial** : tutoiement, chaleureux, lent, soigné. Pas de bullshit "growth hacking".

**Langue** : français uniquement.

**Hébergement** : VPS (probablement OVH comme cocon-detre). Déploiement Docker, auto-hébergeable.

**Domaine** : `aufildessemis.be` (à acquérir, ~6,99 €/an chez OVH).

---

## 2. Audience & rôles

- **Visiteur anonyme** : lit le journal public, la bibliothèque, le calendrier de semis, les tips
- **Membre** (inscription libre) : crée son profil, ses semis, publie des updates, commente, s'abonne à la newsletter, reçoit les rappels
- **Modérateur / admin** : édite les pages CMS, valide/supprime contenus signalés, gère les fiches plantes maîtresses

**Onboarding** : inscription libre + modération a posteriori (signalements). Pas de validation manuelle au 1er post.

---

## 3. Besoins fonctionnels (MVP v1)

| Domaine | Besoin |
|---|---|
| **Site éditorial** | Pages CMS (Accueil, À propos, Contact, Mentions légales, Politique RGPD) |
| **Bibliothèque plantes** | Fiches espèces (courgette, basilic, poivron…) avec étapes-types, période de semis (Belgique), tips de base |
| **Journal de semis** | Un *Sowing* = un lot (ex. "Mes courgettes 2026") rattaché à une `Plant`. Fil de mises à jour datées (photo + texte + étape *optionnelle* taguée). |
| **Communauté** | Comptes membres, profils publics légers, commentaires & réactions sur Sowings et Tips |
| **Tips & conseils** | Conseils partagés (par admins ou validés), liés ou non à une plante, recherchables |
| **Calendrier de semis** | Vue "que planter ce mois-ci" adaptée à la Belgique |
| **Rappels** | Emails programmés par `Sowing` (arrosage, repiquage, récolte) selon les étapes de la fiche plante |
| **Newsletter** | Mensuelle, via Resend Broadcasts ("Ce mois au potager") |
| **Modération** | Signalements, file d'attente admin, suppression, ban |

---

## 4. Modèle de données (collections Payload)

```
Users
  ├── role: admin | moderator | member
  ├── displayName, bio, avatar, region (default: BE)
  └── newsletterOptIn, reminderOptIn

Plants                        # fiches maîtresses, éditées par admins
  ├── name (fr), latinName, slug
  ├── coverImage, gallery
  ├── description (rich text)
  ├── sowingWindow (mois début/fin Belgique)
  ├── typicalStages[] = [semis, levée, repiquage, endurcissement,
  │                       mise en terre, floraison, récolte]
  │     chaque stage: name, daysFromPrevious (estim.), tip court
  └── relatedTips → Tips[]

Sowings                       # un lot de semis appartenant à un user
  ├── owner → User
  ├── plant → Plant
  ├── name (ex. "Courgettes 2026")
  ├── startedAt
  ├── visibility: public | private
  ├── currentStage (dérivé du dernier SowingUpdate)
  └── reminderSettings (override par défaut de la Plant)

SowingUpdates
  ├── sowing → Sowing
  ├── date
  ├── photos[]
  ├── note (rich text)
  ├── stage (optionnel — un des typicalStages de la Plant)
  └── reactions[] (emoji + user)

Tips
  ├── author → User
  ├── title, body (rich text), coverImage
  ├── plants[] → Plant (optionnel, plusieurs possibles)
  ├── status: published | flagged
  └── reactions[]

Comments                      # polymorphe : sur Sowing OU Tip
  ├── author → User
  ├── target (Sowing | Tip)
  ├── body
  └── status: visible | flagged | hidden

Reports                       # signalement modération
  ├── reporter → User
  ├── target (Sowing | SowingUpdate | Comment | Tip | User)
  ├── reason, note
  └── status: open | resolved | dismissed

Pages                         # CMS classique (Accueil, À propos, etc.)
  ├── slug, title, blocks[]
  └── seo

NewsletterIssues              # archives des broadcasts envoyés
  ├── month, subject, htmlSnapshot
  └── resendBroadcastId
```

**Hybride lot libre + étapes** : chaque `SowingUpdate` peut être taguée à un `stage` parmi ceux définis sur la `Plant`. C'est optionnel — on n'oblige jamais. Mais ça déverrouille :
- vue "où en sont mes semis ?" (dernière étape atteinte)
- filtres communautaires ("voir tous les semis au stade *floraison*")
- rappels intelligents ("3 semaines depuis ton semis, c'est l'heure du repiquage ?")

---

## 5. Pages publiques

| Route | Description |
|---|---|
| `/` | Accueil : derniers semis communauté + "Que planter ce mois-ci" + édito |
| `/bibliotheque` | Index des `Plants` (recherche, filtre saison) |
| `/bibliotheque/[slug]` | Fiche plante (description, étapes, semis communauté, tips associés) |
| `/journal` | Feed chronologique des `SowingUpdates` publiques (tous users) |
| `/journal/[user]/[sowing]` | Détail d'un semis : fil complet, photos, commentaires |
| `/tips` | Index des conseils, filtrables |
| `/tips/[slug]` | Article tip |
| `/calendrier` | Calendrier annuel de semis (Belgique) |
| `/mon-potager` | Espace perso (auth requis) : mes semis, rappels, profil |
| `/a-propos`, `/contact`, `/mentions-legales`, `/confidentialite` | Pages CMS |

---

## 6. Stack technique

Identique à cocon-detre, pour capitaliser sur l'expérience acquise :

| Couche | Techno |
|---|---|
| Frontend | Next.js 16 App Router (mode `standalone`) |
| CMS + Admin | Payload CMS 3 (intégré à la même app Next) |
| DB | PostgreSQL (container) |
| Auth membres | Payload Auth |
| Stockage médias | Volume Docker local (option MinIO plus tard si volume photos explose) |
| Email transactionnel | Resend |
| Newsletter | Resend Audiences + Broadcasts |
| Rappels programmés | Cron container (ou cron Payload jobs) → Resend |
| Reverse proxy / TLS | Caddy |
| Hosting | VPS OVH |
| Déploiement | Docker + docker-compose |
| Tests | Vitest (unit/int) + Playwright (e2e) |

**Mobile-first / PWA** : manifest + service worker pour installation sur écran d'accueil, formulaire d'ajout de `SowingUpdate` optimisé téléphone (gros boutons, prise photo native via `<input type="file" capture="environment">`, formulaire court).

---

## 7. Direction artistique

**Palette "potager moderne"** (tokens CSS) :

| Token | Hex | Usage |
|---|---|---|
| `--green-deep` | `#2D4A3E` | Fond sections sombres, header, accents forts |
| `--green-sage` | `#7A8B6F` | Liens secondaires, badges étapes |
| `--cream` | `#F5F1E8` | Fond principal (lecture) |
| `--tomato` | `#C84B31` | CTA, liens, badges importants (par touches) |
| `--sand` | `#D4B895` | Surfaces secondaires, séparateurs |
| `--ink` | `#1F2A24` | Texte corps sur crème |

**Typographie** (Google Fonts, gratuites) :
- **Titres** : *Fraunces* (variable, serif chaleureuse, optical sizes — donne du caractère)
- **Corps** : *Inter* (sans-serif neutre, ultra-lisible, multi-poids)

**Mood** : carnet maraîcher contemporain. Photos pleine largeur sur le journal. Marges généreuses. Lecture lente. Pas d'animation tape-à-l'œil.

**Inspirations** : magazines type *Kinfolk*, *The Simple Things*, mais avec les mains dans la terre.

---

## 8. RGPD & légal

Comptes utilisateurs + emails (rappels, newsletter) → obligations :
- **Mentions légales** : éditeur, hébergeur, contact
- **Politique de confidentialité** : données collectées (email, prénom, contenus publiés), base légale (consentement pour newsletter ; contrat pour le compte), durée de conservation, droits (accès, rectification, suppression, portabilité), DPO/contact
- **Cookies** : pas de tracking tiers en MVP, donc bandeau cookies allégé (seul cookie de session). Si on ajoute analytics → Plausible/Umami (RGPD-friendly, pas de bandeau requis).
- **Consentement newsletter** : double opt-in via Resend
- **Droit à l'oubli** : bouton "supprimer mon compte" qui anonymise/efface les contenus du user

À rédiger en français, dans `/mentions-legales` et `/confidentialite` (pages CMS éditables).

---

## 9. Périmètre MVP v1

**Inclus** :
- Toutes les collections ci-dessus
- Inscription / login membres
- Création + édition + publication de Sowings + SowingUpdates
- Bibliothèque Plants (admin seed initial : courgette, poivron, basilic, tomate, salade, radis — 6 fiches pour démarrer)
- Tips (création par admins en v1)
- Commentaires + réactions
- Calendrier de semis (Belgique)
- Rappels emails
- Newsletter mensuelle (mécanique en place, contenu à rédiger)
- Modération (signalements + queue admin)
- Pages CMS + RGPD
- PWA mobile

**Reporté en v2** :
- Création de Tips par membres (en v1, seuls admins publient des Tips ; les membres peuvent commenter)
- Multi-régions / multi-climats (v1 = Belgique only)
- Échange de graines entre membres
- Stats personnelles ("ta saison en chiffres")
- Export PDF du carnet d'un user

---

## 10. Prochaines étapes (ordre proposé)

1. Acquérir le domaine (suggestions : `aufildessemis.be`, `aufildessemis.com`, `au-fil-des-semis.be`)
2. Choisir les polices définitives + valider la palette en hex
3. Scaffolder l'app Next + Payload (cloner la structure cocon-detre comme base)
4. Définir les collections Payload + migrations initiales
5. Seeder les 6 fiches plantes initiales
6. Construire pages publiques (Accueil → Bibliothèque → Journal → Mon Potager)
7. Auth + flow d'inscription + emails Resend
8. Système de rappels (cron)
9. Modération + signalements
10. Pages RGPD + bandeau cookies
11. Tests Vitest + Playwright
12. Dockerisation + déploiement OVH

---

## Annexe — 6 fiches plantes initiales à seeder

| Plante | Période semis (BE) | Étapes typiques |
|---|---|---|
| Courgette | avril → mai (int.) / mai → juin (ext.) | semis · levée · repiquage · endurcissement · mise en terre · floraison · récolte |
| Poivron | février → mars (int.) | semis · levée · repiquage · endurcissement · mise en terre · floraison · récolte |
| Basilic | mars → mai (int.) | semis · levée · éclaircissage · repiquage · récolte continue |
| Tomate | mars → avril (int.) | semis · levée · repiquage · endurcissement · mise en terre · tuteurage · floraison · récolte |
| Salade | mars → septembre (échelonné) | semis · levée · éclaircissage · récolte |
| Radis | mars → septembre (échelonné) | semis · levée · éclaircissage · récolte |
