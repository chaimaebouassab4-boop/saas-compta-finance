# Module 1 — bilan de l’intégration de transition

La connexion Supabase commune est conservée pour les trois modules. Le code React des opérations du membre 1 est raccordé à une passerelle FastAPI utilisant le même jeton utilisateur et la même base via PostgREST. Les API d’inscription et de connexion distinctes du prototype ne sont pas exposées par le point d’entrée principal.

## Résultats observés

- Build React : réussi (avertissements Vite de configuration et taille de bundles).
- TypeScript : `tsc --noEmit` réussi.
- Frontend : 10 tests réussis ; les trois nouveaux tests couvrent le client API avec session existante et refus d’accès, avec fetch simulé.
- Backend : 4 tests réussis ; deux historiques utilisent SQLite, deux nouveaux utilisent un amont Auth/PostgREST simulé.
- PostgreSQL 16 : cinq migrations existantes appliquées dans un cluster temporaire avec substituts Auth/Storage minimaux ; deux comptes et deux organisations fictifs, isolation et invitations vérifiées. Instance arrêtée ; aucune base existante utilisée.
- Aucun compte réel, aucune modification des données du projet hébergé, aucun commit ni push.

Ce n’est pas une validation de bout en bout : les tests React, passerelle et PostgreSQL sont séparés. Il reste à tester le navigateur avec deux comptes de test autorisés sur une instance complète Auth/PostgREST/PostgreSQL, ainsi que la configuration du proxy de déploiement. Le module n’est pas annoncé prêt pour une PR.

## Sources créées ou modifiées pendant cette étape

- `backend/modules/acces-entreprises-supervision/.env.example`
- `backend/modules/acces-entreprises-supervision/README.md`
- `backend/modules/acces-entreprises-supervision/app/main.py`
- `backend/modules/acces-entreprises-supervision/app/transition.py`
- `backend/modules/acces-entreprises-supervision/tests/test_access.py`
- `backend/modules/acces-entreprises-supervision/tests/test_transition.py`
- `backend/modules/acces-entreprises-supervision/tests/postgres_check.py`
- `frontend/modules/acces-entreprises-supervision/vite.config.ts`
- `frontend/modules/acces-entreprises-supervision/src/components/workspace.tsx`
- `frontend/modules/acces-entreprises-supervision/src/lib/module1-api.ts`
- `frontend/modules/acces-entreprises-supervision/src/test/module1-api.test.ts`
- `docs/contracts/MODULE1_MIGRATION.md`
- `docs/MODULE1_INTEGRATION.md`

Les sorties ignorées du build sont également régénérées. Les fichiers étaient pour la plupart déjà non suivis par Git avant cette étape ; l’état Git seul ne permet pas de calculer un diff de ce travail.

## Ce qui reste sur Supabase

Authentification, sessions, Google OAuth et stockage des identités restent communs. Les tables et fonctions PostgreSQL existantes restent la source des organisations et permissions. Les modules 2 et 3 gardent leurs appels directs pour factures, stockage des documents, événements et paiements. La base financière et son tableau de bord n’ont pas été refondus.

Les méthodes FastAPI pour membres et changement de rôle sont présentes, mais le frontend ne contenait pas d’écran complet d’administration des membres : aucun écran supplémentaire n’a été ajouté. Le raccordement des comptes/organisations concerne les écrans déjà existants. Les affectations cabinet–entreprise et leurs écrans doivent encore faire l’objet d’une validation dédiée.
