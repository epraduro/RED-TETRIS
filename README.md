<h1> RED_TETRIS </h1>

<p align="center"> <img src="https://img.shields.io/badge/42-Project-black?style=for-the-badge&logo=42"> <img src="https://img.shields.io/badge/Frontend-JavaScript-yellow?style=for-the-badge&logo=javascript"> <img src="https://img.shields.io/badge/Backend-Node.js-green?style=for-the-badge&logo=node.js"> <img src="https://img.shields.io/badge/RealTime-Socket.io-black?style=for-the-badge"> </p>

<h2> Description </h2>

RED-TETRIS est une implémentation du célèbre jeu Tetris en version multijoueur temps réel, développée dans le cadre du cursus 42.

<h2> Objectifs du projet : </h2>

•  Création d’un jeu en temps réel </br>
•  Gestion de WebSockets </br>
•  Architecture frontend/backend </br>
•  Synchronisation entre joueurs </br>
•  Gestion des états de jeu </br>

<h2> Aperçu </h2>

<p align="center">
  <p> Inscription: </p>
  <img src="picture/inscription.png" width="450">
  <p> Connexion: </p>
  <img src="picture/connexion.png" width="450">
  <p> Page d'accueil avec salle de jeu disponible: </p>
  <img src="picture/page_accueil2.png" width="450">
  <p> Salle de jeu: </p>
  <img src="picture/salle_de_jeu.png" width="450">
  <p> Page de profil: </p>
  <img src="picture/page_de_profil.png" width="450">
</p>

<h2> Allez tester par vous même !</h2>

  [http://srv558899.hstgr.cloud:4000](http://srv558899.hstgr.cloud:4000)

  Vous pouvez utiliser le compte déjà créer

 • Nom d'utlisateur: </br>
  
    admin
 • Mot de passe: <br>
    
    password

<h2> Gameplay </h2>

•  Les joueurs rejoignent une room </br>
•  Les parties se déroulent en simultané </br>
•  Le but est de : </br>
&nbsp;&nbsp;&nbsp;    •  compléter des lignes </br>
&nbsp;&nbsp;&nbsp;    •  survivre plus longtemps que les autres </br>
•  Des pénalités peuvent être envoyées aux adversaires </br>

<h2> Contrôles </h2>

| Touche  | Action    |
| ------- | --------- |
| <p align="center"> ⬅️ / ➡️ </p> | <p align="center"> Déplacer </p>|
| <p align="center"> ⬇️ </p>     | <p align="center"> Accélérer </p>|
| <p align="center"> ⬆️ </p>     | <p align="center"> Rotation </p>|
| <p align="center"> Espace </p> | <p align="center"> Hard drop </p>|

<h2> En solo ou à plusieurs </h2>

<h4> Fonctionnalités: </h4>

•  Créer / Rejoindre une room </br>
•  Synchronisation en temps réel </br>
•  Pénalisations entre joueurs </br>
•  Gestion des connexions/déconnexions </br>

<h4> Features </h4>

•  Jeu Tetris d'origine </br>
•  Système multijoueur temps réel </br>
•  Communication via Websockets </br>
•  Architecture client / serveur </br>
•  Gestion des collisions et rotations </br>
•  Score / lignes </br>

<h2> Architecture </h2>

📦 red-tetris </br>
┣ 📂 back      </br>
 ┃ ┣ 📂 game   </br>
 ┃ ┗ 📜 server.js   </br>
 ┣ 📂 front         </br>
 ┃ ┣ 📂 src </br>
 ┃ ┃ ┣ 📂 game  </br>
 ┃ ┃ ┣ 📂 users </br>
 ┃ ┃ ┗ 📜 App.js   </br>
 ┣ 📜 package.json </br>
 ┗ 📜 README.md </br>

<h2> Bonus </h2>

Utilisateur: </br>
&nbsp;&nbsp;&nbsp;•  Creation de compte </br>
&nbsp;&nbsp;&nbsp;•  Page de profil avec historique des parties </br>

Jeu: </br>
&nbsp;&nbsp;&nbsp;•  Système de score </br>
&nbsp;&nbsp;&nbsp;•  Implémentation de différents modes de jeu </br>

<h2> Technologies utilisées </h2>

•  JavaScript </br>
•  Node.js </br>
•  Socket.io </br>
•  React </br>
•  Tailwind </br>

