# Module 1 — inventaire et contrat de migration proposé

État actuel : une passerelle FastAPI est raccordée au code React du module 1. Elle réutilise la session Supabase et les données existantes via PostgREST ; elle ne crée pas une seconde identité. L’API principale n’expose plus l’inscription du prototype. Le contrat ci-dessous reste une cible de migration : certaines opérations ne sont pas encore implémentées. Voir `backend/modules/acces-entreprises-supervision/README.md` pour le périmètre effectivement connecté. Le parcours navigateur complet avec Auth/PostgREST réels n’a pas été vérifié.

## Inventaire des écrans et actions

| Écran ou fonction | Situation actuelle |
| --- | --- |
| Connexion / inscription | E-mail et mot de passe avec Supabase Auth ; lien de confirmation par e-mail selon la configuration ; connexion Google via Lovable. |
| Session et déconnexion | La route protégée vérifie `supabase.auth.getUser()` ; l’espace suit la session et appelle `signOut`. |
| Profil | Lecture et mise à jour de `profiles` via Supabase. |
| Organisations | Lecture de `organizations`, création et sélection d’une organisation. |
| Rôles | Lecture de `organization_members` et appels aux fonctions `can_manage_organization` et `can_process_organization_documents`. |
| Invitations | Création et acceptation de codes via les fonctions Supabase correspondantes. |
| Supervision | Liste des entreprises et compteurs calculés depuis les factures chargées dans l’espace. |
| Interface | Composants partagés et menu ; `workspace.tsx` mélange ces fonctions avec celles des modules 2 et 3. |

## Dépendances existantes

Les migrations locales existantes définissent notamment `profiles`, `organizations`, `organization_members`, `accounting_firm_clients` et `organization_invitations`. Elles lient les identités à `auth.users` et utilisent `auth.uid()` dans les politiques. Les factures référencent `organizations` ; les politiques des factures, paiements, événements et documents s’appuient sur les mêmes fonctions d’appartenance et rôles. Les fichiers de migration et les configurations existantes restent inchangés.

La connexion actuelle permet également aux modules 2 et 3 d’accéder à Supabase. Une session FastAPI distincte ne donne pas automatiquement une session Supabase : les comptes, identifiants et organisations doivent être reliés de manière vérifiable avant la bascule. Les mots de passe existants ne sont pas disponibles dans le code local pour une migration transparente. La confirmation e-mail, Google OAuth et la conservation des données nécessitent aussi un plan de transition validé.

## Contrat proposé pour FastAPI

Ces endpoints sont à compléter et à préciser pendant la transition. Les réponses d’erreur doivent distinguer requête invalide, absence de session, accès interdit et ressource absente sans divulguer les données d’une autre organisation. Le prototype et ses limites sont décrits dans `backend/modules/acces-entreprises-supervision/README.md`.

| Méthode et chemin | But | Autorisation attendue |
| --- | --- | --- |
| `POST /auth/register` | Inscription | Public ; validation du compte selon le mode retenu. |
| `POST /auth/login` | Connexion et création de session | Public ; vérification des identifiants. |
| `GET /auth/session` | Utilisateur et session courants | Session valide. |
| `POST /auth/logout` | Révocation de la session | Session valide. |
| `GET /me`, `PATCH /me` | Lire et modifier son profil | Utilisateur courant uniquement. |
| `GET /organizations`, `POST /organizations` | Lister les organisations accessibles et en créer une | Session valide ; association du créateur à la nouvelle organisation. |
| `GET /organizations/{id}` | Détails d’une organisation | Membre autorisé ou lien cabinet–client autorisé. |
| `GET /organizations/{id}/members` | Liste des membres et rôles | Accès limité selon les permissions convenues. |
| `PATCH /organizations/{id}/members/{user_id}` | Modifier un rôle | Gestionnaire autorisé ; empêcher la suppression accidentelle du dernier responsable. |
| `POST /organizations/{id}/invitations` | Créer une invitation | Gestionnaire autorisé. |
| `POST /invitations/accept` | Accepter un code valide | Session valide ; code à usage et durée limités. |
| `GET /organizations/{id}/assignments` | Lire les affectations comptable–entreprise | Accès limité aux acteurs autorisés. |
| `POST /organizations/{id}/assignments` | Créer une affectation | Gestionnaire autorisé et consentement approprié à définir. |
| `GET /supervision` | Dossiers et indicateurs autorisés | Session valide ; filtrage côté serveur par organisation. |

La forme des réponses, les rôles exacts, les droits de consultation et les règles d’affectation restent à convenir. Les données du tableau de bord dépendent des factures du module 3 ; leur source et le contrat d’échange devront être définis avec sa responsable.

## Vérifications prévues

Utiliser deux comptes et deux organisations fictifs : accès autorisé à sa propre organisation, accès refusé à l’autre, liste filtrée, invitation interdite pour un non-gestionnaire, acceptation contrôlée et session révoquée. Vérifier séparément le parcours Supabase restant des modules 2 et 3 et la continuité des données avant toute bascule.
