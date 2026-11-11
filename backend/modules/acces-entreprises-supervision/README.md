# FastAPI du module 1 — transition d’identité commune

Le point d’entrée `app.main:app` expose la passerelle de transition. Il ne propose ni inscription ni connexion distinctes. Les utilisateurs gardent leur session Supabase (y compris Google, renouvellement et déconnexion), leur identifiant et leurs organisations. Le frontend envoie le jeton courant à FastAPI ; FastAPI vérifie le compte via `/auth/v1/user` puis utilise PostgREST avec ce même jeton. Les règles RLS et fonctions PostgreSQL existantes continuent donc à s’appliquer, sans clé service_role.

Il s’agit d’une migration des appels métier vers FastAPI, pas encore d’une sortie complète de Supabase. Aucune nouvelle identité ni synchronisation de tables n’est créée. Les tables `m1_*` du prototype ne sont pas utilisées par la passerelle. Ne pas appliquer leur migration à la base existante.

## Démarrage local

Depuis ce dossier, installer les dépendances de `requirements.txt` dans un environnement Python puis configurer `SUPABASE_URL` et `SUPABASE_PUBLISHABLE_KEY` côté serveur, pour le même projet que le frontend. Utiliser uniquement la clé publique, jamais une clé service_role. Le fichier `.env.example` documente les noms ; l’application ne charge pas automatiquement un fichier `.env`.

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Lancer ensuite `npm run dev` depuis le module frontend. Vite transmet `/api/module1/*` à FastAPI. En déploiement, prévoir ce même routage avec le reverse proxy et HTTPS : la configuration de développement Vite ne configure pas l’hébergement.

## Périmètre connecté

Organisations (liste/création/sélection), droits et rôle courant, invitations (création/acceptation), profil et compteurs de supervision passent par FastAPI. Les routes de liste de membres et de modification de rôle ainsi que les méthodes du client sont disponibles ; il n’existait pas d’écran d’administration complet des membres et aucun nouvel écran n’est ajouté ici.

Les opérations de factures, documents, validation, ventes et paiements restent sur Supabase avec la même session. Le tableau de bord financier est inchangé. Seule la projection de supervision des entreprises lit les statuts de factures côté serveur, sans les modifier. Les affectations cabinet–client continuent à dépendre du schéma et des règles existants.

## Vérification

`python -m pytest -q` vérifie le prototype SQLite et la passerelle avec un service amont simulé. Ces tests ne valident pas un parcours réel de production.

`tests/postgres_check.py` crée un cluster PostgreSQL temporaire et applique les cinq migrations Supabase existantes, avec des substituts locaux minimaux pour les schémas Auth/Storage. Il vérifie deux identités fictives, deux organisations, l’isolation et les invitations. Définir `PG_BIN` vers le dossier des exécutables PostgreSQL. Ce test ne touche pas aux bases existantes. Il conserve ses fichiers temporaires et arrête son instance.

Restent à vérifier : session réelle avec deux comptes de test du projet, chaîne navigateur → FastAPI → Auth/PostgREST → PostgreSQL, configuration serveur/hébergement et cohérence entre les migrations locales et celles effectivement déployées. Le module n’est pas déclaré prêt pour PR avant cette validation.
