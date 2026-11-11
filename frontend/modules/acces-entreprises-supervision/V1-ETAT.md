# V1 Mizane — état de livraison locale

Démarrer depuis ce dossier : `npm run dev -- --port 8080`.

- Accueil : http://localhost:8080/
- Démonstration : http://localhost:8080/demo
- Comptes réels : http://localhost:8080/connexion

## Disponible
Accueil responsive en français, connexion/inscription, création d’organisation, profil, sélection d’entreprise, import PDF/images avec aperçu privé, saisie guidée et contrôles, correction et validation comptable, création/émission de ventes, paiements partiels, indicateurs calculés, graphiques mensuels, recherche/filtres et historique. Invitations comptables par code utilisant les fonctions existantes.

Les comptes réels sont reliés au client Supabase généré du projet et aux tables existantes. Les restrictions RLS sont actives sur les tables principales et le bucket finance-documents est privé. Aucun schéma ni fichier généré n’a été modifié manuellement.

La démonstration utilise uniquement des données fictives en mémoire, sans écriture dans Supabase. Elle se réinitialise en rechargeant la page. Ses imports restent dans la session. Aucune extraction OCR ou IA n’est active ; les documents réels nécessitent une saisie manuelle. Les lignes sont enregistrées avec la facture dans extracted_fields afin que leur enregistrement soit atomique.

## Vérifications et limites
Compilation de production, vérification TypeScript et sept tests : routage, calculs, doublons, import/saisie/validation et paiement partiel. Parcours de correction/validation également vérifié dans le navigateur.

Le parcours réel de bout en bout (confirmation e-mail, deux comptes entreprise/comptable, upload privé et rechargement des données) reste à vérifier avec des comptes de test. La présence des politiques ne constitue pas un audit de sécurité complet. Les contrôles métier côté base existants n’ont pas été renforcés ici.

Les modifications sont locales. Aucune publication ni synchronisation GitHub/Lovable n’a été effectuée. Cette copie n’a pas de dossier .git. L’aperçu hébergé Lovable reste donc inchangé.

Export PDF, numérotation légale automatique, avoirs, gestion avancée du cabinet, OCR et connecteur Odoo restent à développer. Les factures de vente disposent d’un aperçu à l’écran ; ce n’est pas une garantie de conformité fiscale.
