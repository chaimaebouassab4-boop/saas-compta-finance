# 🧾 SaaS de gestion comptable

Socle de travail pour un SaaS destiné aux cabinets comptables 🏢 et aux PME 💼. La V1 vise le dépôt et le traitement assisté des factures 📄, leur validation humaine ✅, puis le suivi des ventes, des achats et des paiements 💶.

## 🎯 Périmètre V1

- 🔐 Gestion des accès, des cabinets, des entreprises clientes et de la supervision.
- 📤 Dépôt et suivi des factures, extraction et contrôles assistés à définir et implémenter.
- ✅ Validation humaine, ventes, achats, paiements et indicateurs 📊.
- 🧱 Isolation des données entre entreprises, à définir comme règle commune et à appliquer dans chaque module.

⚠️ L'OCR, l'IA 🤖, l'antivirus 🦠, le chiffrement 🔒, l'authentification multifacteur, les contrôles de sécurité 🛡️ et les intégrations 🔌 ne sont pas annoncés comme fonctionnels : ils restent à concevoir et à implémenter. Odoo pourra être étudié ultérieurement 🔭 et ne fait pas partie du socle initial.

## 🔄 Parcours d'une facture

1. 📥 Un membre de l'entreprise dépose une facture.
2. 🗂️ Le module de traitement enregistre le document et suit son état. L'extraction et les contrôles assistés seront ajoutés lorsqu'ils seront définis et développés.
3. 🧑‍💼 Le comptable examine les données et alertes proposées 🚨, puis corrige ✏️, valide ✅ ou rejette ❌ la facture.
4. 📈 Les données validées alimentent le suivi des achats, ventes et paiements ainsi que les indicateurs autorisés.

🤝 Les échanges et statuts détaillés seront convenus ensemble en semaine 1 dans [docs/contracts](docs/contracts/README.md). Les équipes peuvent avancer avec des mocks 🎭 jusqu'à l'intégration hebdomadaire.

## 🗺️ Structure du dépôt

- 🖥️ `frontend/modules/` : interface regroupée par les trois modules.
- ⚙️ `backend/modules/` : API et logique métier, regroupées par module.
- 🧱 `backend/shared/tenant-isolation/` : règles générales d'isolation entre entreprises, portées par le membre 1.
- 🛠️ `worker/modules/traitement-factures/` : emplacement réservé aux traitements différés du module factures, si retenus.
- 📜 `docs/contracts/` : contrats de données, API, statuts et permissions à définir en semaine 1.
- 🐳 `infra/` : configuration locale et Docker, portée par le membre 2.
- 🔍 `tests/security/cross-tenant/` : tests croisés d'isolation et de sécurité entre entreprises.
- 📚 `docs/` : répartition et décisions d'architecture.

💡 Aucun framework ni langage n'est imposé. Les dossiers sont des points de départ ; ce dépôt ne contient pas encore d'application exécutable.

## 🚀 Démarrage du projet

Le dépôt contient pour l'instant la documentation 📝 et la structure initiale 🏗️, pas de code applicatif ni de configuration Docker exécutable. En semaine 1, l'équipe doit choisir sa stack, compléter les contrats communs, puis ajouter les commandes d'installation, de lancement et de test à cette section et à `infra/README.md`.

Après accord sur la stack, le démarrage local devra être documenté avec les prérequis, la configuration d'environnement (à partir d'un fichier exemple sans secret 🔑), la base de données 🗄️ et les services nécessaires. 🚫 Ne jamais utiliser de vraies factures ni données clients comme fixtures.

---

## 👥 Répartition de l'équipe

Chaque membre développe le frontend, le backend, les données, les tests et les protections de son propre module. Les sujets transversaux ci-dessous sont partagés comme indiqué dans le plan de répartition.

### 🧩 Membres et modules

#### 1️⃣ Membre 1 — Chaimae Bouassab

**🔐 Accès, entreprises et supervision**

- 🖥️ Frontend : connexion, gestion des utilisateurs et espace du responsable de cabinet (entreprises clientes, état des dossiers, affectations de comptables).
- ⚙️ Backend : API des utilisateurs, entreprises, rôles et affectations comptable–entreprise.
- 🗄️ Données : cabinets, entreprises, utilisateurs, rôles et affectations.
- 🛡️ Sécurité : authentification et contrôle des rôles, avec les mécanismes précis à décider et implémenter.
- 📊 Données et indicateurs : score de risque ou de retard et statistiques d'avancement, à concevoir ; aucune IA n'est encore implémentée.
- 🔁 Responsabilités transversales : règle générale d'isolation entre entreprises et base de l'interface commune (menu, thème 🎨, composants).

#### 2️⃣ Membre 2 — Fatima Zohra Garoud

**📄 Dépôt et traitement des factures**

- 🖥️ Frontend : dépôt, liste des documents avec statuts et écran de révision (document, formulaire, alertes).
- ⚙️ Backend : API de dépôt et suivi du traitement ; traitements en arrière-plan si retenus.
- 🗄️ Données : documents, factures extraites, alertes et doublons.
- 🛡️ Sécurité : vérification des fichiers, empreinte, stockage et accès temporaire, à concevoir et implémenter.
- 🔎 Extraction et données : OCR, extraction de champs, confiance, doublons et mesure de précision, à concevoir et implémenter.
- 🔁 Responsabilités transversales : configuration locale et Docker 🐳.

#### 3️⃣ Membre 3 — Chaimae Abbabri

**✅ Validation, ventes, achats, paiements et indicateurs**

- 🖥️ Frontend : espace comptable, validation, tableau de bord du dirigeant et suivi des paiements 💶.
- ⚙️ Backend : correction, validation, rejet, workflow des statuts et calcul des indicateurs.
- 🗄️ Données : factures, lignes de facture, tiers, paiements et données d'indicateurs.
- 🛡️ Sécurité : journal d'audit 📋, intégrité des validations et droits sur les indicateurs, à concevoir et implémenter.
- 📊 Données et indicateurs : rapprochement paiement–facture, catégorisation et détection d'anomalies, à concevoir et implémenter.
- 🔁 Responsabilités transversales : tests automatiques et intégration continue (CI) 🤖.

#### 🙋‍♀️ Nada

Membre de l'équipe ; **responsabilité à définir avec l'équipe** 🤝. Aucun module ne lui est attribué dans le plan.

### 🔁 Responsabilités transversales

| 📌 Sujet | 👤 Responsable ou règle |
| --- | --- |
| 🧱 Isolation entre entreprises | Chaimae Bouassab définit la règle générale ; chaque membre l'applique à ses propres tables et module. |
| 🎨 Interface commune | Chaimae Bouassab met en place la base ; les autres membres réutilisent les composants communs. |
| 🐳 Configuration locale et Docker | Fatima Zohra Garoud. |
| 🧪 Tests automatiques et CI | Chaimae Abbabri. |
| 🔍 Tests de sécurité croisés | Membre 1 teste le module du membre 2 ; membre 2 celui du membre 3 ; membre 3 celui du membre 1. |
| 📜 Contrats communs | Toute l'équipe les décide en semaine 1 : données, endpoints, formats échangés et permissions. |
| 🔗 Intégration | Intégration hebdomadaire ; les mocks 🎭 permettent d'avancer avant la disponibilité des autres modules. |

## 🗓️ Les étapes du projet

- 📅 Semaine 1 : décisions communes sur données, API, maquettes, Git et Docker.
- 🛠️ Semaines 2–3 : données, backend et sécurité de chaque module.
- 🎨 Semaines 4–5 : frontend et travaux IA/données de chaque module.
- 🏁 Semaine 6 : intégration, tests de sécurité croisés, états de chargement/erreur/vide et corrections.
- 🔮 Phase ultérieure : les extensions citées dans le plan (notes de frais 🧾 et congés 🏖️) sont hors périmètre initial.
### 🤝 Comment avancer ensemble

1. **Définir les contrats en semaine 1** : convenir des modèles de données, des API, des statuts et des permissions dans [`docs/contracts/`](docs/contracts/README.md).
2. **Développer chaque module** : chaque membre prend en charge son interface, son backend, ses données, ses tests et ses protections. Les modules 2 et 3 peuvent utiliser un utilisateur fictif ; le module 3 peut utiliser des factures fictives déjà extraites.
3. **Intégrer chaque semaine** : remplacer progressivement les mocks par les modules disponibles et vérifier leurs échanges.
4. **Ouvrir une pull request** : présenter les changements et demander une revue à une autre membre. Coordonner toute modification de contrat avec les membres concernées ; voir [CONTRIBUTING.md](CONTRIBUTING.md).
5. **Réaliser les tests croisés** : membre 1 teste le module 2, membre 2 teste le module 3 et membre 3 teste le module 1, notamment pour l’isolation entre entreprises.
6. **Finaliser ensemble** : intégrer les modules, traiter les erreurs et états vides, corriger les problèmes et préparer la suite.

📚 Le détail des responsabilités reste disponible dans [docs/REPARTITION.md](docs/REPARTITION.md) et les échanges entre modules dans [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).