# SaaS de gestion comptable

Socle de travail pour un SaaS destiné aux cabinets comptables et aux PME. La V1 vise le dépôt et le traitement assisté des factures, leur validation humaine, puis le suivi des ventes, des achats et des paiements.

## Périmètre V1

- Gestion des accès, des cabinets, des entreprises clientes et de la supervision.
- Dépôt et suivi des factures, extraction et contrôles assistés à définir et implémenter.
- Validation humaine, ventes, achats, paiements et indicateurs.
- Isolation des données entre entreprises, à définir comme règle commune et à appliquer dans chaque module.

L’OCR, l’IA, l’antivirus, le chiffrement, l’authentification multifacteur, les contrôles de sécurité et les intégrations ne sont pas annoncés comme fonctionnels : ils restent à concevoir et à implémenter. Odoo pourra être étudié ultérieurement et ne fait pas partie du socle initial.

## Parcours d’une facture

1. Un membre de l’entreprise dépose une facture.
2. Le module de traitement enregistre le document et suit son état. L’extraction et les contrôles assistés seront ajoutés lorsqu’ils seront définis et développés.
3. Le comptable examine les données et alertes proposées, puis corrige, valide ou rejette la facture.
4. Les données validées alimentent le suivi des achats, ventes et paiements ainsi que les indicateurs autorisés.

Les échanges et statuts détaillés seront convenus ensemble en semaine 1 dans [docs/contracts](docs/contracts/README.md). Les équipes peuvent avancer avec des mocks jusqu’à l’intégration hebdomadaire.

## Structure du dépôt

- `frontend/modules/` : interface regroupée par les trois modules.
- `backend/modules/` : API et logique métier, regroupées par module.
- `backend/shared/tenant-isolation/` : règles générales d’isolation entre entreprises, portées par le membre 1.
- `worker/modules/traitement-factures/` : emplacement réservé aux traitements différés du module factures, si retenus.
- `docs/contracts/` : contrats de données, API, statuts et permissions à définir en semaine 1.
- `infra/` : configuration locale et Docker, portée par le membre 2.
- `tests/security/cross-tenant/` : tests croisés d’isolation et de sécurité entre entreprises.
- `docs/` : répartition et décisions d’architecture.

Aucun framework ni langage n’est imposé. Les dossiers sont des points de départ ; ce dépôt ne contient pas encore d’application exécutable.

## Équipe

Voir [docs/REPARTITION.md](docs/REPARTITION.md) pour les responsabilités convenues, y compris celles de Nada.

## Démarrage du projet

Le dépôt contient pour l’instant la documentation et la structure initiale, pas de code applicatif ni de configuration Docker exécutable. En semaine 1, l’équipe doit choisir sa stack, compléter les contrats communs, puis ajouter les commandes d’installation, de lancement et de test à cette section et à `infra/README.md`.

Après accord sur la stack, le démarrage local devra être documenté avec les prérequis, la configuration d’environnement (à partir d’un fichier exemple sans secret), la base de données et les services nécessaires. Ne jamais utiliser de vraies factures ni données clients comme fixtures.
