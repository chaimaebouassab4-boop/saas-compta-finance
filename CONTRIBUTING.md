# Contribution

## Branches

- Créer une branche courte depuis `main` pour chaque tâche : `feat/<module>-<sujet>`, `fix/<module>-<sujet>` ou `docs/<sujet>`.
- Garder une branche centrée sur un changement cohérent et synchronisée avec `main`.
- Ne pas commiter de secrets, de documents clients, de factures réelles ni de données personnelles.

## Pull requests et revue

- Ouvrir une pull request vers `main` avec un résumé, le module touché, les décisions prises et les vérifications exécutées.
- Demander une revue à une autre membre de l’équipe ; l’autrice de la PR ne s’auto-approuve pas.
- Décrire les changements d’API, de données, de statuts ou de permissions et leurs effets sur les autres modules.
- Ne fusionner qu’après revue et après exécution des contrôles automatisés disponibles. Les contrôles seront précisés avec la stack et la CI.

## Changements de contrats communs

- Pour tout changement affectant plusieurs modules, modifier le document correspondant dans `docs/contracts/` dans la même PR.
- Expliquer le besoin, les modules concernés, la compatibilité et les éventuelles étapes de migration.
- Faire valider la proposition par les membres concernés avant de mettre à jour les implémentations dépendantes.
- Mettre à jour mocks, exemples et tests concernés ; coordonner les changements incompatibles avec les autres modules.
- En cas de désaccord ou de décision non prise, noter explicitement le point à trancher plutôt que de figer une convention unilatérale.

## Sécurité et données de test

Utiliser uniquement des données fictives dans le dépôt. Vérifier que chaque module applique les permissions et l’isolation entre entreprises. Réaliser les tests croisés prévus : membre 1 teste le module du membre 2, membre 2 celui du membre 3, et membre 3 celui du membre 1.
