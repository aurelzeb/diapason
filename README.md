# Diapason

Entraînement à l’oreille absolue, en parcours progressif :

- **Notes seules** : 9 unités, de Do et Sol jusqu’aux 12 notes sur cinq octaves et trois timbres. Les notes sont jouées sur plusieurs octaves pour que la hauteur ne donne pas la réponse.
- **Accords (méthode Eguchi)** : les 9 accords de la méthode (Do majeur, Fa majeur 2ᵉ renversement…), associés à des couleurs, un nouvel accord par unité.
- **Test général** : disponible à tout moment, 20 notes au hasard sur les 88 touches du piano.
- **Brouillage** : un son au hasard, de la même durée que la question, joué avant chaque note pour empêcher de s’aider de la précédente. Il se coupe pendant l’entraînement (bouton ou touche B).
- Révision ciblée sur les notes fragiles, objectif quotidien en XP, série de jours, calendrier et statistiques détaillées.

Tout le son est synthétisé (Web Audio) : aucun fichier audio, l’appli fonctionne hors ligne.

## Structure

| Élément | Rôle |
| --- | --- |
| `index.html` | **Source unique** de l’appli (HTML, CSS et JS). C’est aussi le fichier publié en artefact claude.ai. |
| `scripts/build.mjs` | Construit `www/` : page complète, polices et icônes locales, manifeste et service worker. |
| `scripts/fetch-fonts.mjs` | Télécharge les polices Google dans `assets/fonts/` (à relancer seulement si les polices changent). |
| `scripts/icons.mjs` | Génère les icônes et écrans de démarrage à partir du dessin du diapason. |
| `android/`, `ios/` | Projets natifs Capacitor. |
| `.github/workflows/pages.yml` | Déploie la version installable sur GitHub Pages à chaque push sur `main`. |

Pour modifier l’appli, on modifie `index.html`, puis :

```bash
npm run sync
```

Cette commande reconstruit `www/` et copie le résultat dans les projets Android et iOS.

## Version installable (iPhone et Android, sans store)

Elle est publiée sur GitHub Pages : **https://aurelzeb.github.io/diapason/**

- **iPhone** : ouvrir le lien dans Safari, bouton Partager, puis « Sur l’écran d’accueil ».
- **Android** : ouvrir le lien dans Chrome, menu ⋮, puis « Installer l’application ».

Pour la tester sur l’ordinateur : `npm run serve`, puis http://localhost:8765.

## Appli Android (Play Store)

1. Installer [Android Studio](https://developer.android.com/studio) (il fournit le SDK Android et un JDK 21).
2. `npm install`, puis `npm run android` : le projet s’ouvre dans Android Studio.
3. Pour tester : brancher un téléphone (mode développeur activé) et cliquer sur ▶.
4. Pour publier : *Build > Generate Signed App Bundle*, puis envoyer le fichier `.aab` sur la [Play Console](https://play.google.com/console) (compte développeur : 25 $, une fois).

## Appli iOS (App Store)

La compilation iOS demande **un Mac avec Xcode**. Depuis Windows, on peut passer par un service de build en ligne (Codemagic, Ionic Appflow…).

1. Sur le Mac : `npm install`, puis `npm run ios` : le projet s’ouvre dans Xcode.
2. Choisir son équipe de signature dans *Signing & Capabilities*, puis lancer sur un iPhone branché.
3. Pour publier : *Product > Archive*, puis envoyer sur [App Store Connect](https://appstoreconnect.apple.com) (Apple Developer Program : 99 $/an).

Identifiant de l’appli : `io.github.aurelzeb.diapason` (dans `capacitor.config.json`).

## Licence

© 2026 aurelzeb, tous droits réservés. Le code est visible, mais toute réutilisation, copie ou publication demande une autorisation écrite : voir [LICENSE](LICENSE). Les polices (SIL Open Font License) et Capacitor (MIT) gardent leur propre licence.

## Données

- Dans l’appli native, l’historique est enregistré sur le téléphone (stockage natif Capacitor Preferences, doublé du stockage web).
- Dans la version installable, il reste dans le navigateur du téléphone.
- Les deux ne sont pas synchronisés entre eux.
