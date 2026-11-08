# Répartition de l’équipe

Chaque membre développe le frontend, le backend, les données, les tests et les protections de son propre module. Les sujets transversaux ci-dessous sont partagés comme indiqué dans le plan de répartition.

## Membres et modules

### Membre 1 — Chaimae Bouassab

**Accès, entreprises et supervision**

- Frontend : connexion, gestion des utilisateurs et espace du responsable de cabinet (entreprises clientes, état des dossiers, affectations de comptables).
- Backend : API des utilisateurs, entreprises, rôles et affectations comptable–entreprise.
- Données : cabinets, entreprises, utilisateurs, rôles et affectations.
- Sécurité : authentification et contrôle des rôles, avec les mécanismes précis à décider et implémenter.
- Données et indicateurs : score de risque ou de retard et statistiques d’avancement, à concevoir ; aucune IA n’est encore implémentée.
- Responsabilités transversales : règle générale d’isolation entre entreprises et base de l’interface commune (menu, thème, composants).

### Membre 2 — Fatima Zohra Garoud

**Dépôt et traitement des factures**

- Frontend : dépôt, liste des documents avec statuts et écran de révision (document, formulaire, alertes).
- Backend : API de dépôt et suivi du traitement ; traitements en arrière-plan si retenus.
- Données : documents, factures extraites, alertes et doublons.
- Sécurité : vérification des fichiers, empreinte, stockage et accès temporaire, à concevoir et implémenter.
- Extraction et données : OCR, extraction de champs, confiance, doublons et mesure de précision, à concevoir et implémenter.
- Responsabilités transversales : configuration locale et Docker.

### Membre 3 — Chaimae Abbabri

**Validation, ventes, achats, paiements et indicateurs**

- Frontend : espace comptable, validation, tableau de bord du dirigeant et suivi des paiements.
- Backend : correction, validation, rejet, workflow des statuts et calcul des indicateurs.
- Données : factures, lignes de facture, tiers, paiements et données d’indicateurs.
- Sécurité : journal d’audit, intégrité des validations et droits sur les indicateurs, à concevoir et implémenter.
- Données et indicateurs : rapprochement paiement–facture, catégorisation et détection d’anomalies, à concevoir et implémenter.
- Responsabilités transversales : tests automatiques et intégration continue (CI).

### Nada

Membre de l’équipe ; **responsabilité à définir avec l’équipe**. Aucun module ne lui est attribué dans le plan.

## Responsabilités transversales

| Sujet | Responsable ou règle |
| --- | --- |
| Isolation entre entreprises | Chaimae Bouassab définit la règle générale ; chaque membre l’applique à ses propres tables et module. |
| Interface commune | Chaimae Bouassab met en place la base ; les autres membres réutilisent les composants communs. |
| Configuration locale et Docker | Fatima Zohra Garoud. |
| Tests automatiques et CI | Chaimae Abbabri. |
| Tests de sécurité croisés | Membre 1 teste le module du membre 2 ; membre 2 celui du membre 3 ; membre 3 celui du membre 1. |
| Contrats communs | Toute l’équipe les décide en semaine 1 : données, endpoints, formats échangés et permissions. |
| Intégration | Intégration hebdomadaire ; les mocks permettent d’avancer avant la disponibilité des autres modules. |

## Organisation indicative du plan

- Semaine 1 : décisions communes sur données, API, maquettes, Git et Docker.
- Semaines 2–3 : données, backend et sécurité de chaque module.
- Semaines 4–5 : frontend et travaux IA/données de chaque module.
- Semaine 6 : intégration, tests de sécurité croisés, états de chargement/erreur/vide et corrections.
- Phase ultérieure : les extensions citées dans le plan (notes de frais et congés) sont hors périmètre initial.
