# Architecture initiale

Cette architecture organise le travail sans imposer de langage, framework, base de données ni fournisseur. Le dépôt ne contient pas encore d’application exécutable. Les responsabilités et contrats décrits ici sont des points de départ à préciser ensemble en semaine 1.

## Dossiers

- `frontend/modules/` : interface séparée en accès/entreprises/supervision, traitement des factures et validation/ventes/achats/paiements. Les composants communs démarrent dans le module du membre 1 avant d’être réutilisés.
- `backend/modules/` : API, règles métier et accès aux données de chaque module. Chaque membre garde la responsabilité complète de son module.
- `backend/shared/tenant-isolation/` : emplacement de la règle générale d’isolation entre entreprises. Chaque module l’applique à ses données ; les contrats et tests doivent en vérifier l’application.
- `worker/modules/traitement-factures/` : emplacement conditionnel pour les tâches asynchrones du traitement des factures. Le choix d’un système de tâches reste à décider.
- `docs/contracts/` : modèles de données, API, états de facture et permissions communes, à convenir en semaine 1.
- `infra/` : configuration de développement local et Docker, portée par le membre 2 ; aucune stack Docker n’est définie à ce stade.
- `tests/security/cross-tenant/` : tests de séparation entre entreprises et place pour les tests croisés. Le membre 3 porte les tests automatiques/CI ; la règle est définie par le membre 1 et appliquée par chaque module.

## Échanges entre modules

1. Le module Accès fournit l’identité, le rôle et le contexte d’entreprise nécessaires aux autres modules. Les mécanismes d’authentification et de session restent à décider.
2. Le module Traitement des factures reçoit un document et expose son état et, lorsqu’ils seront implémentés, les champs extraits et alertes proposés.
3. Le module Validation consomme les résultats disponibles, permet au comptable de corriger puis valider ou rejeter, et publie les données validées utiles au suivi et aux indicateurs.
4. Chaque échange doit transporter et vérifier le contexte d’entreprise selon le contrat commun. Aucun module ne doit pouvoir lire ou modifier les données d’une autre entreprise sans permission explicite.

Les membres peuvent employer des mocks (par exemple des factures déjà extraites pour le module 3 et un utilisateur fictif pour les modules 2 et 3) jusqu’à l’intégration hebdomadaire. Les contrats communs priment sur les formes temporaires des mocks.

## Décisions d’architecture à prendre

Choix de stack et de stockage, mécanisme d’authentification, forme de l’isolation des données, conventions d’API, traitement asynchrone, stockage des fichiers, statuts de facture et permissions restent ouverts. Les détails et emplacements de décision figurent dans [les contrats communs](contracts/README.md). Odoo est une possibilité future, en dehors du socle initial.
