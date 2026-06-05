![CI](https://github.com/MalikCherfi/tp-github-actions/actions/workflows/ci.yml/badge.svg)

# TP GitHub Actions — CI/CD et automatisation

**Durée estimée :** 6h
**Prérequis :** Git, GitHub, bases Bash ou PowerShell (TPs précédents)
**Environnement :** tout OS avec Git installé et un compte GitHub actif

---

## Objectifs de la journée

À la fin de ce TP vous saurez lire et écrire des workflows GitHub Actions, construire un pipeline CI complet (lint + tests), gérer des secrets, automatiser un déploiement sur Azure, mettre en place des hooks locaux pour accélérer votre boucle de feedback, et sécuriser votre repo avec Dependabot, CODEOWNERS et les branch protection rules.

---

## Mise en place — Fork, VS Code et premier push

> ⏱️ Cette section prend environ **20 minutes**. Faites-la soigneusement — un environnement mal configuré rend tous les exercices suivants douloureux.

### Étape A — Forker le repo sur GitHub

Un **fork** crée une copie personnelle du repo sur votre compte GitHub. Vous avez tous les droits dessus : configurer des secrets, des environnements, des branch protection rules — exactement comme en entreprise.

1. Allez sur le repo du TP fourni par le formateur
2. Cliquez sur le bouton **Fork** en haut à droite
3. Laissez les paramètres par défaut et cliquez **Create fork**
4. Vous êtes maintenant sur `https://github.com/<votre-compte>/tp-github-actions`

> **Pourquoi forker plutôt que cloner directement ?**
> Sur un clone direct, vous n'avez pas les droits de push. Le fork vous donne votre propre repo avec vos propres Actions, secrets et environments — indispensable pour ce TP.

---

### Étape B — Cloner votre fork avec VS Code

**Option 1 — Directement depuis GitHub (recommandé pour débutants)**

1. Sur votre fork GitHub, cliquez le bouton vert **Code**
2. Sélectionnez l'onglet **Local** → **Open with Visual Studio Code**
3. VS Code s'ouvre et vous propose de cloner — acceptez
4. Choisissez un dossier sur votre machine (ex : `Documents/formation-devops/`)
5. Cliquez **Open** quand VS Code propose d'ouvrir le repo cloné

**Option 2 — Via le terminal**

```bash
# Remplacez <votre-compte> par votre nom d'utilisateur GitHub
git clone https://github.com/<votre-compte>/tp-github-actions
cd tp-github-actions

# Ouvrir dans VS Code
code .
```

---

### Étape C — Configurer VS Code pour ce TP

Installez ces extensions (cherchez leur nom dans l'onglet Extensions, icône en carré sur le panneau gauche) :

| Extension | Utilité dans ce TP |
|---|---|
| **GitHub Actions** (GitHub) | Autocomplétion YAML, visualisation des runs directement dans VS Code |
| **Python** (Microsoft) | Coloration, linting, exécution des tests |
| **YAML** (Red Hat) | Validation et autocomplétion des fichiers `.yml` |
| **GitLens** (GitKraken) | Voir l'historique Git ligne par ligne, inspecter les branches |

> **Astuce VS Code :** le fichier `.github/workflows/ci.yml` s'ouvre avec coloration et autocomplétion si l'extension **GitHub Actions** est installée. Vous verrez les erreurs YAML en temps réel sans avoir à pusher.

---

### Étape D — Configurer Git (si ce n'est pas déjà fait)

```bash
# Vérifier si Git connaît votre identité
git config --global user.name
git config --global user.email

# Si vide, configurez-le (même email que votre compte GitHub)
git config --global user.name "Prénom Nom"
git config --global user.email "votre@email.com"
```

Dans VS Code, vous pouvez aussi faire `Ctrl+Shift+P` → taper `Git: Open Settings` pour configurer via l'interface.

---

### Étape E — Installer les dépendances et vérifier l'environnement

Ouvrez un **terminal intégré** dans VS Code : menu **Terminal → New Terminal** (ou `` Ctrl+` ``).

```bash
# Vérifier que vous êtes bien dans le bon dossier
pwd          # doit afficher le chemin vers tp-github-actions
ls           # doit lister README.md, ressources/, .github/, etc.

# Installer les dépendances Python
pip install -r ressources/requirements.txt

# Vérifier que les tests passent en local AVANT de pusher
cd ressources
pytest -v
cd ..
```

Résultat attendu : **5 tests passent** avec des `PASSED` en vert.

---

### Étape F — Premier commit et push pour activer la CI

```bash
# Créer un fichier pour déclencher votre premier push
echo "# Mon TP GitHub Actions" >> notes.md

# Commiter
git add notes.md
git commit -m "feat: premier commit — activation de la CI"

# Pusher vers votre fork
git push origin main
```

**Vérification :** allez dans l'onglet **Actions** de votre fork GitHub. Vous devriez voir votre premier workflow en cours d'exécution (cercle orange → coche verte si tout va bien).

> Si le workflow n'apparaît pas, vérifiez que vous avez bien pushé sur **votre fork** et non sur le repo original.

---

### Étape G — Connecter VS Code à GitHub Actions (optionnel mais pratique)

Avec l'extension **GitHub Actions** installée :

1. Cliquez sur l'icône GitHub Actions dans le panneau gauche (icône en forme de cercle avec une flèche)
2. Connectez-vous à votre compte GitHub si demandé
3. Vous voyez maintenant vos workflows et leurs statuts directement dans VS Code — sans ouvrir le navigateur

---

Le dossier `ressources/` contient une mini API Flask — **NexaCloud API** — que vous utiliserez comme cible de votre pipeline CI/CD tout au long du TP.

---

## Étape 1 — Anatomie d'un workflow (45 min)

> 🎯 **Pourquoi on fait ça ?**
> Tout le monde a déjà vu un workflow GitHub Actions échouer sans comprendre pourquoi. Avant d'en écrire un, il faut savoir lire ce que GitHub exécute. Un workflow est un fichier YAML versionné dans le repo — il se comporte exactement comme du code : il peut avoir des bugs, des effets de bord, et il doit être relu. Cette étape vous donne les repères pour ne plus subir la CI mais la comprendre.

### Concept

Un workflow GitHub Actions est un fichier `.yml` dans `.github/workflows/`. Il décrit **quand** se déclencher, **où** s'exécuter et **quoi** faire.

```
.github/
└── workflows/
    └── mon-workflow.yml
```

**Structure d'un workflow :**

```yaml
name: Nom du workflow          # affiché dans l'onglet Actions

on:                            # déclencheurs
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:                          # un ou plusieurs jobs (s'exécutent en parallèle par défaut)
  mon-job:
    runs-on: ubuntu-latest     # le runner (machine virtuelle GitHub)

    steps:                     # étapes du job (s'exécutent en séquence)
      - name: Checkout
        uses: actions/checkout@v4    # action réutilisable du Marketplace

      - name: Dire bonjour
        run: echo "Bonjour depuis GitHub Actions"
```

**Les concepts clés :**

| Terme | Rôle |
|-------|------|
| `on` | Définit quand le workflow se déclenche (push, PR, schedule, manuel…) |
| `jobs` | Unité de travail — chaque job tourne sur sa propre VM |
| `runs-on` | Le système d'exploitation du runner (`ubuntu-latest`, `windows-latest`, `macos-latest`) |
| `steps` | Les étapes séquentielles d'un job |
| `uses` | Utilise une **action** publiée sur le Marketplace (ex : `actions/checkout@v4`) |
| `run` | Exécute une commande shell directement |

---

### Exercice 1.1 — Lire un workflow existant

Ouvrez le fichier `.github/workflows/ci.yml` déjà présent dans ce repo.

Répondez aux questions suivantes **sans modifier le fichier** :

1. Sur quelle(s) branche(s) ce workflow se déclenche-t-il ?
  - Le workflow se déclenche sur la branche "main"
2. Combien de jobs contient-il ?
  - Il contient un job
3. Sur quel système d'exploitation tourne-t-il ?
  - Il tourne sur ubuntu
4. Quelle action installe Python ?
  - - uses: actions/setup-python@v5
      with:
      python-version: '3.12'
5. Quelle commande lance les tests ?


Vérifiez vos réponses en allant dans l'onglet **Actions** de votre repo GitHub après votre premier push.

---

### Exercice 1.2 — Premier workflow "Hello NexaCloud"

Créez le fichier `.github/workflows/hello.yml` :

```yaml
name: Hello NexaCloud

on:
  push:
    branches: [main]
  workflow_dispatch:       # permet de déclencher manuellement depuis l'interface GitHub

jobs:
  salutation:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout du code
        uses: actions/checkout@v4

      - name: Informations sur l'environnement
        run: |
          echo "Repo    : ${{ github.repository }}"
          echo "Branche : ${{ github.ref_name }}"
          echo "Commit  : ${{ github.sha }}"
          echo "Acteur  : ${{ github.actor }}"

      - name: Lister les fichiers du repo
        run: ls -la
```

Commitez et pushez. Observez l'exécution dans l'onglet **Actions**.

> ✏️ **À vous**
>
> Ajoutez un step qui affiche la date et l'heure du runner avec `date`.
> Puis déclenchez le workflow **manuellement** depuis l'interface GitHub (bouton "Run workflow").

<details>
<summary>✅ Correction</summary>

```yaml
name: Hello NexaCloud

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  salutation:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout du code
        uses: actions/checkout@v4

      - name: Informations sur l'environnement
        run: |
          echo "Repo    : ${{ github.repository }}"
          echo "Branche : ${{ github.ref_name }}"
          echo "Commit  : ${{ github.sha }}"
          echo "Acteur  : ${{ github.actor }}"

      - name: Lister les fichiers du repo
        run: ls -la

      - name: Date et heure du runner
        run: date
```

</details>

---

### Pour aller plus loin — Étape 1

<details>
<summary>💡 Voir les pistes d'approfondissement</summary>

```yaml
# Déclencher uniquement sur certains dossiers
on:
  push:
    paths:
      - "ressources/**"   # se déclenche seulement si un fichier de ressources/ change

# Déclencher sur un planning (cron)
on:
  schedule:
    - cron: "0 8 * * 1-5"   # chaque jour ouvré à 8h UTC

# Exécuter un step seulement si une condition est remplie
- name: Alerter si branche main
  if: github.ref_name == 'main'
  run: echo "On est sur main !"
```

</details>

---

## Étape 2 — Pipeline CI : lint et tests (1h30)

> 🎯 **Pourquoi on fait ça ?**
> Sans CI, chaque développeur valide son code uniquement sur sa machine — et "ça marche chez moi" n'est pas suffisant. Un pipeline CI exécute automatiquement le lint (vérification du style) et les tests à chaque push. Si quelqu'un casse quelque chose, l'équipe le sait en 2 minutes, pas en 2 jours. C'est la première ligne de défense qualité d'une équipe DevOps.

### Le lint et les tests : pourquoi les deux ?

Avant d'écrire le workflow, il faut comprendre ce qu'il va exécuter — et pourquoi ces deux outils sont complémentaires plutôt que redondants.

**Le lint — vérifier le style et la forme**

Le lint analyse votre code **sans l'exécuter**. Il cherche des problèmes de forme : lignes trop longues, espaces superflus, imports inutilisés, variables non définies… L'outil utilisé ici est `flake8`.

```python
# Exemple de code qui passe les tests mais ÉCHOUE au lint
import os          # ← flake8 signale : import non utilisé (F401)
def calcul(x,y):  # ← flake8 signale : espace manquant après la virgule (E231)
    result=x+y    # ← flake8 signale : pas d'espace autour de = (E225)
    return result
```

> **Pourquoi ça compte ?** Un code illisible est un code qui accumule les bugs silencieusement. Le lint force une discipline de style commune dans toute l'équipe — sans débat en code review sur les espaces et les indentations.

**Les tests — vérifier le comportement**

Les tests exécutent votre code avec des entrées connues et vérifient que la sortie est celle attendue. L'outil utilisé ici est `pytest`.

```python
# Un test simple : appeler la route /health et vérifier la réponse
def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200           # ← le serveur répond bien
    assert response.get_json()["status"] == "healthy"  # ← la valeur est correcte
```

> **Pourquoi ça compte ?** Le lint ne peut pas détecter qu'une fonction retourne `None` au lieu d'un dictionnaire, ou qu'une route renvoie 500 sous certaines conditions. Les tests vérifient le comportement réel — et ils le revérifient à chaque modification du code.

**Lint + tests dans la CI : la combinaison**

```
git push
    │
    ├─► job lint  (10s)  → est-ce que le code est propre ?
    │
    └─► job test  (30s)  → est-ce que le code fonctionne ?
```

Les deux jobs tournent **en parallèle** — un problème de style n'empêche pas les tests de tourner. Si l'un échoue, la PR est bloquée. C'est le filet de sécurité minimum avant tout déploiement.

---

### Concept

**Le Marketplace GitHub Actions** fournit des milliers d'actions prêtes à l'emploi. Les plus utilisées pour Python :

| Action | Rôle |
|--------|------|
| `actions/checkout@v4` | Clone le repo dans le runner |
| `actions/setup-python@v5` | Installe Python (version choisie) |
| `actions/cache@v4` | Met en cache `pip` pour accélérer les builds |

**Les contextes `${{ }}` :**

```yaml
${{ github.sha }}         # hash du commit courant
${{ github.ref_name }}    # nom de la branche
${{ secrets.MON_SECRET }} # valeur d'un secret GitHub
${{ matrix.python }}      # valeur courante dans une matrice de build
```

---

### Exercice 2.1 — Installer Python et lancer les tests

Créez `.github/workflows/ci.yml` (remplacez le fichier existant) :

```yaml
name: CI — NexaCloud API

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      # TODO: ajouter un step "Setup Python" avec actions/setup-python@v5
      # version : "3.11"

      # TODO: ajouter un step "Installer les dépendances"
      # commande : pip install -r ressources/requirements.txt

      # TODO: ajouter un step "Lancer les tests"
      # commande : pytest ressources/ -v
```

Pushez et observez le résultat dans l'onglet Actions.

<details>
<summary>✅ Correction</summary>

```yaml
name: CI — NexaCloud API

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Installer les dépendances
        run: pip install -r ressources/requirements.txt

      - name: Lancer les tests
        run: pytest ressources/ -v
```

</details>

---

### Exercice 2.2 — Ajouter le lint avec flake8

Ajoutez un **second job** `lint` dans votre `ci.yml`. Les deux jobs tournent en parallèle.

```yaml
  lint:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Installer flake8
        run: pip install flake8

      # TODO: ajouter un step "Lint avec flake8"
      # commande : flake8 ressources/ --config ressources/.flake8
```

<details>
<summary>✅ Correction</summary>

```yaml
name: CI — NexaCloud API

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Installer flake8
        run: pip install flake8

      - name: Lint avec flake8
        run: flake8 ressources/ --config ressources/.flake8

  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Installer les dépendances
        run: pip install -r ressources/requirements.txt

      - name: Lancer les tests
        run: pytest ressources/ -v
```

</details>

---

### Exercice 2.3 — Faire échouer et corriger la CI

C'est l'exercice le plus important de l'étape.

1. **Introduisez une erreur de style** dans `ressources/app.py` : ajoutez une ligne avec des espaces superflus en fin de ligne ou une ligne trop longue (> 100 caractères). Commitez et pushez.
2. **Observez** : quel job échoue ? Que dit le message d'erreur dans les logs ?
3. **Corrigez** l'erreur, pushez à nouveau.
4. **Introduisez une erreur dans un test** : modifiez `test_app.py` pour qu'un assert soit faux (ex : `assert data["info"] == 999`). Commitez et pushez.
5. **Observez** : cette fois quel job échoue ?
6. **Corrigez** et vérifiez que la CI repasse au vert.

> 💡 Le but n'est pas de ne jamais casser la CI — c'est de savoir lire les logs et corriger rapidement. Cette compétence s'acquiert en cassant volontairement.

---

### Pour aller plus loin — Étape 2

<details>
<summary>💡 Voir les pistes d'approfondissement</summary>

```yaml
# Ajouter la couverture de tests
- name: Tests avec couverture
  run: pytest ressources/ -v --cov=ressources --cov-report=term-missing

# Uploader le rapport de couverture comme artefact téléchargeable
- name: Générer le rapport HTML
  run: pytest ressources/ --cov=ressources --cov-report=html

- name: Upload du rapport
  uses: actions/upload-artifact@v4
  with:
    name: rapport-couverture
    path: htmlcov/

# Mettre en cache les dépendances pip (accélère les builds suivants)
- name: Cache pip
  uses: actions/cache@v4
  with:
    path: ~/.cache/pip
    key: ${{ runner.os }}-pip-${{ hashFiles('ressources/requirements.txt') }}
```

</details>

---

## Étape 3 — Secrets et environnements (45 min)

> 🎯 **Pourquoi on fait ça ?**
> Un mot de passe ou une clé API codé en dur dans un workflow est visible par tous ceux qui ont accès au repo — et reste dans l'historique Git pour toujours. Les secrets GitHub sont chiffrés, masqués dans les logs et jamais exposés en clair. C'est la pratique minimale de sécurité que tout DevOps doit maîtriser avant de toucher à un environnement de production.

### Concept

**Secrets vs Variables :**

| | Secrets | Variables |
|---|---|---|
| Valeur visible | ❌ jamais | ✅ oui |
| Usage | Mots de passe, clés API, tokens | URLs, noms de config non sensibles |
| Syntaxe | `${{ secrets.NOM }}` | `${{ vars.NOM }}` |

**Créer un secret :** Settings → Secrets and variables → Actions → New repository secret

**Les environnements** permettent de protéger les déploiements : un revieweur doit approuver avant que le job parte en production.

---

### Exercice 3.1 — Utiliser un secret dans un workflow

1. Dans votre repo GitHub : **Settings → Secrets and variables → Actions**
2. Créez un secret nommé `API_KEY` avec la valeur `nexacloud-secret-42`
3. Créez `.github/workflows/secrets.yml` :

```yaml
name: Demo Secrets

on:
  workflow_dispatch:

jobs:
  demo:
    runs-on: ubuntu-latest

    steps:
      - name: Utiliser le secret
        run: |
          echo "La clé existe : ${{ secrets.API_KEY != '' }}"
          # ⚠️ Cette ligne sera masquée dans les logs :
          echo "Valeur : ${{ secrets.API_KEY }}"
```

Déclenchez manuellement. Observez que GitHub **masque automatiquement** la valeur du secret dans les logs (remplacée par `***`).

<details>
<summary>✅ Correction</summary>

```yaml
name: Demo Secrets

on:
  workflow_dispatch:

jobs:
  demo:
    runs-on: ubuntu-latest

    env:
      API_KEY: ${{ secrets.API_KEY }}   # injection du secret comme variable d'environnement

    steps:
      - name: Vérifier que le secret est défini
        run: |
          if [ -z "$API_KEY" ]; then
            echo "❌ Le secret API_KEY n'est pas défini"
            exit 1
          fi
          echo "✅ Le secret API_KEY est défini (${#API_KEY} caractères)"

      - name: Simuler un appel API authentifié
        run: |
          echo "Appel à l'API avec Authorization: Bearer ***"
          # En vrai : curl -H "Authorization: Bearer $API_KEY" https://api.example.com
```

</details>

---

### Exercice 3.2 — Créer des environnements staging et production

1. Dans votre repo : **Settings → Environments → New environment**
2. Créez `staging` (sans protection)
3. Créez `production` avec **Required reviewers** → ajoutez votre propre compte
4. Créez `.github/workflows/deploy.yml` :

```yaml
name: Deploy

on:
  workflow_dispatch:

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging          # utilise l'environnement staging

    steps:
      - name: Déployer en staging
        run: echo "Déploiement en staging..."

  deploy-production:
    runs-on: ubuntu-latest
    environment: production       # TODO: ajouter la dépendance sur deploy-staging
    needs: deploy-staging

    steps:
      - name: Déployer en production
        run: echo "Déploiement en production !"
```

Déclenchez manuellement. Observez que le job `production` est **bloqué en attente de votre approbation**.

<details>
<summary>✅ Correction</summary>

```yaml
name: Deploy

on:
  workflow_dispatch:

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Déployer en staging
        run: |
          echo "✅ Déploiement en staging réussi"
          echo "URL : https://staging.nexacloud.example.com"

  deploy-production:
    runs-on: ubuntu-latest
    environment: production
    needs: deploy-staging         # attend que staging soit terminé ET approuvé

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Déployer en production
        run: |
          echo "🚀 Déploiement en production réussi"
          echo "URL : https://nexacloud.example.com"
```

</details>

---

### Exercice 3.3 — Choisir l'environnement au déclenchement

> 🎯 **Pourquoi ?**
> Un `workflow_dispatch` peut exposer des **inputs** : des paramètres que l'opérateur renseigne au moment du déclenchement manuel. C'est utile pour choisir dynamiquement une cible de déploiement sans modifier le YAML à chaque fois.

Modifiez `deploy.yml` pour ajouter un input `environment` avec les choix `staging` et `production`. GitHub affichera un menu déroulant au moment du déclenchement.

**Syntaxe des inputs `workflow_dispatch` :**

```yaml
on:
  workflow_dispatch:
    inputs:
      mon_input:
        description: "Description affichée dans l'UI"
        required: true
        default: "valeur_par_défaut"
        type: choice
        options:
          - choix_1
          - choix_2
```

**Objectif :** n'avoir qu'un seul job `deploy` qui adapte son message selon `${{ inputs.environment }}`.

<details>
<summary>✅ Correction</summary>

```yaml
name: Deploy

on:
  workflow_dispatch:
    inputs:
      environment:
        description: "Environnement cible"
        required: true
        default: "staging"
        type: choice
        options:
          - staging
          - production

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}   # bloqué si production nécessite une approbation

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Déployer sur ${{ inputs.environment }}
        run: |
          if [ "${{ inputs.environment }}" = "production" ]; then
            echo "🚀 Déploiement en PRODUCTION"
            echo "URL : https://nexacloud.example.com"
          else
            echo "✅ Déploiement en STAGING"
            echo "URL : https://staging.nexacloud.example.com"
          fi
```

**Ce qui se passe :**
- GitHub affiche un menu déroulant `staging / production` au déclenchement manuel
- La valeur choisie est injectée via `${{ inputs.environment }}`
- Si l'environnement `production` a des **Required reviewers**, GitHub bloque le job en attente d'approbation — même avec un seul job

</details>

---

### Pour aller plus loin — Étape 3

<details>
<summary>💡 Voir les pistes d'approfondissement</summary>

```yaml
# Définir des variables d'environnement au niveau du job
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      APP_ENV: production
      API_URL: ${{ vars.API_URL }}        # variable non sensible
      API_KEY: ${{ secrets.API_KEY }}     # secret chiffré

# Partager des outputs entre jobs
jobs:
  build:
    outputs:
      version: ${{ steps.version.outputs.tag }}
    steps:
      - id: version
        run: echo "tag=1.2.3" >> $GITHUB_OUTPUT

  deploy:
    needs: build
    steps:
      - run: echo "Déploiement de la version ${{ needs.build.outputs.version }}"
```

</details>

---

## Étape 4 — CD vers Azure App Service (1h30)

> 🎯 **Pourquoi on fait ça ?**
> La CI vérifie que le code est correct. Le CD (Continuous Deployment) va plus loin : il déploie automatiquement le code validé sur un serveur réel. Sans CD, le déploiement est une opération manuelle, risquée et souvent évitée — ce qui crée des releases rares et stressantes. Avec CD, déployer devient aussi banal qu'un `git push`, et les problèmes sont détectés immédiatement en environnement réel.

### Concept

Le pipeline complet **CI → CD** :

```
git push
    │
    ▼
┌─────────────┐     ✅ ok      ┌──────────────┐    ✅ approuvé   ┌──────────────┐
│  lint + test │ ──────────▶  │    staging   │ ────────────▶   │  production  │
└─────────────┘               └──────────────┘                  └──────────────┘
       │ ❌ fail                      │ ❌ fail
       ▼                             ▼
   bloqué                       rollback
```

**Action de déploiement Azure App Service :**

```yaml
- name: Déployer sur Azure Web App
  uses: azure/webapps-deploy@v3
  with:
    app-name: "nexacloud-api"
    publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
    package: .
```

---

### Exercice 4.1 — Créer l'App Service Azure

> Si vous n'avez pas d'accès Azure actif, passez directement à l'exercice 4.2 et simulez le déploiement avec un `run: echo`.

> 💶 **Plan B1 recommandé (~13€/mois)**
> Le plan gratuit (F1) n'a pas l'option "Always On" : l'app s'arrête après quelques minutes d'inactivité et redémarre avec un cold start de 5 à 10 secondes. Pour ce TP, utilisez le plan **B1** qui garantit une app stable et disponible en permanence. Pensez à **supprimer le resource group** à la fin du TP pour arrêter la facturation : `az group delete --name rg-nexacloud-tp`.

> ⚠️ **Prérequis Azure — authentification basique**
> Les nouveaux App Services Azure désactivent l'authentification basique par défaut depuis 2023, ce qui rend le publish profile inutilisable. Avant de configurer le secret GitHub, activez-la :
> **App Service → Settings → Configuration → General settings → SCM Basic Auth Publishing Credentials → On → Save**
> Puis re-téléchargez le publish profile (il est regénéré après cette modification).

```bash
# Dans votre terminal (Azure CLI doit être installé)
az login

RESOURCE_GROUP="rg-nexacloud-tp"
APP_NAME="nexacloud-api-$RANDOM"   # nom unique obligatoire
LOCATION="francecentral"

# Créer le resource group
az group create --name "$RESOURCE_GROUP" --location "$LOCATION"

# Créer le plan App Service (B1 — nécessaire pour Always On et la stabilité)
az appservice plan create \
    --name "plan-nexacloud" \
    --resource-group "$RESOURCE_GROUP" \
    --sku B1 \
    --is-linux

# Créer l'App Service Python
az webapp create \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --plan "plan-nexacloud" \
    --runtime "PYTHON:3.11"

# Récupérer le publish profile (à coller dans les secrets GitHub)
az webapp deployment list-publishing-profiles \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --xml
```

Copiez la sortie XML et créez un secret GitHub `AZURE_WEBAPP_PUBLISH_PROFILE` avec cette valeur.

---

### Exercice 4.2 — Pipeline CI/CD complet

Créez `.github/workflows/cicd.yml` — le pipeline complet en 3 jobs chainés :

```yaml
name: CI/CD — NexaCloud API

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # ── Job 1 : Qualité ────────────────────────────────────────────────
  qualite:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - run: pip install -r ressources/requirements.txt

      - name: Lint
        run: flake8 ressources/ --config ressources/.flake8

      - name: Tests
        run: pytest ressources/ -v --cov=ressources

  # ── Job 2 : Staging ───────────────────────────────────────────────
  staging:
    runs-on: ubuntu-latest
    needs: qualite                 # attend que le job qualite réussisse
    environment: staging
    if: github.ref_name == 'main'  # uniquement sur la branche main

    steps:
      - uses: actions/checkout@v4

      # TODO: ajouter le step de déploiement sur Azure App Service
      # (remplacez app-name par votre nom d'application)

  # ── Job 3 : Production ────────────────────────────────────────────
  production:
    runs-on: ubuntu-latest
    needs: staging
    environment: production
    if: github.ref_name == 'main'

    steps:
      - uses: actions/checkout@v4

      # TODO: même chose pour la production
```

<details>
<summary>✅ Correction</summary>

```yaml
name: CI/CD — NexaCloud API

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  qualite:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Installer les dépendances
        run: pip install -r ressources/requirements.txt

      - name: Lint
        run: flake8 ressources/ --config ressources/.flake8

      - name: Tests avec couverture
        run: pytest ressources/ -v --cov=ressources --cov-report=term-missing

  staging:
    runs-on: ubuntu-latest
    needs: qualite
    environment: staging
    if: github.ref_name == 'main'

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Installer les dépendances
        run: pip install -r ressources/requirements.txt

      - name: Déployer sur Azure App Service (staging)
        uses: azure/webapps-deploy@v3
        with:
          app-name: "nexacloud-api-staging"
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE_STAGING }}
          package: ressources/

  production:
    runs-on: ubuntu-latest
    needs: staging
    environment: production
    if: github.ref_name == 'main'

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Installer les dépendances
        run: pip install -r ressources/requirements.txt

      - name: Déployer sur Azure App Service (production)
        uses: azure/webapps-deploy@v3
        with:
          app-name: "nexacloud-api"
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: ressources/
```

</details>

---

### Pour aller plus loin — Étape 4

<details>
<summary>💡 Voir les pistes d'approfondissement</summary>

```yaml
# Smoke test post-déploiement : vérifier que l'app répond avant de valider
- name: Smoke test post-déploiement
  run: |
    sleep 30   # attendre que l'app démarre
    curl --fail https://nexacloud-api.azurewebsites.net/health || exit 1
# Si ce test échoue, le job échoue → on peut déclencher un rollback

# Notifier Discord en cas d'échec (if: failure() = s'exécute seulement si un step précédent a échoué)
# Créer le webhook : channel Discord → ⚙️ Edit Channel → Integrations → Webhooks → New Webhook
- name: Notifier Discord
  if: failure()
  run: |
    curl -X POST ${{ secrets.DISCORD_WEBHOOK_URL }} \
      -H "Content-Type: application/json" \
      -d '{
        "embeds": [{
          "title": "❌ Déploiement échoué",
          "color": 15158332,
          "fields": [
            {"name": "Repo", "value": "${{ github.repository }}", "inline": true},
            {"name": "Branche", "value": "${{ github.ref_name }}", "inline": true},
            {"name": "Déclenché par", "value": "${{ github.actor }}", "inline": true}
          ],
          "url": "https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}"
        }]
      }'
```

</details>

---

## Étape 5 — Hooks locaux pre-commit (45 min)

> 🎯 **Pourquoi on fait ça ?**
> Attendre que la CI échoue pour découvrir une erreur de lint, c'est perdre 3 minutes à chaque fois — sans compter que le commit est déjà dans l'historique. Un hook `pre-commit` exécute les mêmes vérifications **avant** le commit, en 2 secondes, directement sur votre machine. Le principe s'appelle "shift left" : détecter les problèmes le plus tôt possible dans le cycle. En équipe, c'est aussi une façon de standardiser les pratiques sans effort : tout le monde a les mêmes hooks, activés automatiquement.

### Concept

**La boucle de feedback :**

```
Écrire du code
      │
      ▼
  git commit ──► hook pre-commit (2s, local) ──► ❌ bloqué si erreur
      │
      ▼
   git push ──► CI GitHub Actions (3 min, remote) ──► ❌ bloqué si erreur
      │
      ▼
  merge PR ──► CD déploiement (staging → prod)
```

**Le framework `pre-commit`** gère les hooks via un fichier `.pre-commit-config.yaml` versionné dans le repo — tout le monde a les mêmes hooks.

---

### Exercice 5.1 — Installer pre-commit

```bash
# Installer pre-commit (une seule fois sur votre machine)
pip install pre-commit

# Vérifier l'installation
pre-commit --version
```

Créez `.pre-commit-config.yaml` à la racine du repo :

```yaml
repos:
  - repo: https://github.com/pycqa/flake8
    rev: 7.0.0
    hooks:
      - id: flake8
        args: [--config, ressources/.flake8]
        files: ressources/.*\.py$

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: trailing-whitespace      # supprime les espaces en fin de ligne
      - id: end-of-file-fixer        # ajoute un saut de ligne en fin de fichier
      - id: check-yaml               # valide les fichiers YAML (vos workflows !)
      - id: check-merge-conflict     # bloque si des marqueurs de conflit Git traînent
```

```bash
# Activer les hooks dans votre repo local (à faire une seule fois)
pre-commit install

# Tester sur tous les fichiers existants
pre-commit run --all-files
```

> ✏️ **À vous**
>
> Introduisez un espace en fin de ligne dans `ressources/app.py`, puis tentez un `git commit`. Observez le hook bloquer le commit et corriger automatiquement le fichier.

<details>
<summary>✅ Correction</summary>

```yaml
# .pre-commit-config.yaml — version complète
repos:
  - repo: https://github.com/pycqa/flake8
    rev: 7.0.0
    hooks:
      - id: flake8
        args: [--config, ressources/.flake8]
        files: ressources/.*\.py$

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-merge-conflict
      - id: check-added-large-files
        args: [--maxkb=500]

  - repo: https://github.com/pycqa/isort
    rev: 5.13.2
    hooks:
      - id: isort                    # trie automatiquement les imports Python
        files: ressources/.*\.py$
```

</details>

---

### Exercice 5.2 — Aligner hooks locaux et CI

L'objectif est que **les mêmes règles** s'appliquent en local (hook) et dans la CI (workflow).

Comparez votre `.pre-commit-config.yaml` avec votre `ci.yml` :

| Vérification | Hook local | CI GitHub Actions |
|---|---|---|
| Espaces en fin de ligne | `trailing-whitespace` | — |
| YAML valide | `check-yaml` | — |
| Lint Python (flake8) | `flake8` | job `lint` |
| Tests | — | job `test` |

> ✏️ **À vous**
>
> Les tests ne tournent pas en hook pre-commit (trop lents pour un commit). Mais vous pouvez les ajouter en hook `pre-push` — qui se déclenche uniquement lors d'un `git push`. Ajoutez cette configuration :

```bash
# Créer manuellement le hook pre-push
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash
echo "[pre-push] Lancement des tests..."
cd ressources
pytest -q
EXIT_CODE=$?
cd ..
if [ $EXIT_CODE -ne 0 ]; then
    echo "❌ Tests échoués — push bloqué"
    exit 1
fi
echo "✅ Tests passés — push autorisé"
EOF
chmod +x .git/hooks/pre-push
```

<details>
<summary>✅ Correction — script setup-hooks.sh</summary>

```bash
#!/bin/bash
# setup-hooks.sh — Installe les hooks locaux (à lancer une fois par développeur)

set -e

echo "=== Installation des hooks locaux NexaCloud ==="

# 1. Installer pre-commit
if ! command -v pre-commit &>/dev/null; then
    echo "Installation de pre-commit..."
    pip install pre-commit --quiet
fi

# 2. Activer les hooks pre-commit
pre-commit install
echo "✅ Hooks pre-commit activés"

# 3. Installer le hook pre-push
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash
echo "[pre-push] Lancement des tests..."
cd ressources && pytest -q
EXIT_CODE=$?
cd ..
[ $EXIT_CODE -ne 0 ] && echo "❌ Tests échoués — push bloqué" && exit 1
echo "✅ Tests passés — push autorisé"
EOF
chmod +x .git/hooks/pre-push
echo "✅ Hook pre-push installé"

echo ""
echo "=== Hooks installés avec succès ==="
echo "  pre-commit : flake8 + trailing-whitespace + check-yaml"
echo "  pre-push   : pytest"
```

</details>

---

### Pour aller plus loin — Étape 5

<details>
<summary>💡 Voir les pistes d'approfondissement</summary>

```yaml
# Hook sur le message de commit (conventional commits)
# Force un format standardisé : feat:, fix:, ci:, docs:, chore:…
# Ça rend l'historique Git lisible et permet de générer des changelogs automatiques
  - repo: https://github.com/compilerla/conventional-pre-commit
    rev: v3.2.0
    hooks:
      - id: conventional-pre-commit
        stages: [commit-msg]
        # Format attendu : feat: ajouter la route /logs
        #                  fix: corriger le calcul de pourcentage
        #                  ci: mettre à jour le workflow de déploiement
```

```bash
# Désactiver temporairement les hooks (à utiliser avec parcimonie)
# --no-verify bypasse TOUS les hooks — à éviter en équipe
git commit --no-verify -m "wip: travail en cours"
git push --no-verify
```

</details>

---

## Étape 6 — Sécurité et gouvernance du repo (1h)

> 🎯 **Pourquoi on fait ça ?**
> Un pipeline CI/CD qui fonctionne mais dont les dépendances ont 6 mois de retard, dont n'importe qui peut merger sans review, et dont une clé API traîne dans l'historique Git — c'est un repo qui donne une fausse impression de sécurité. Cette étape couvre les pratiques de gouvernance qu'une équipe DevOps met en place une fois pour toutes sur un repo : mises à jour automatiques, propriété des fichiers, règles de merge et détection des secrets oubliés.

### Concept — Les quatre piliers

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   Dependabot    │   │   CODEOWNERS    │   │Branch Protection│   │ Secret Scanning │
│                 │   │                 │   │     Rules       │   │                 │
│ Dépendances     │   │ Qui doit        │   │ CI obligatoire  │   │ Détecte les     │
│ toujours à jour │   │ reviewer quoi   │   │ avant merge     │   │ credentials     │
│ via des PRs auto│   │ selon les       │   │ + reviews       │   │ accidentellement│
│                 │   │ fichiers touchés│   │ obligatoires    │   │ commités        │
└─────────────────┘   └─────────────────┘   └─────────────────┘   └─────────────────┘
```

---

### Exercice 6.1 — Dependabot

**Dependabot** surveille vos dépendances et ouvre automatiquement des Pull Requests quand une nouvelle version est disponible. Cela couvre deux niveaux :
- Les **actions GitHub** utilisées dans vos workflows (`actions/checkout@v4`, `actions/setup-python@v5`…)
- Les **packages Python** de votre projet (`flask`, `pytest`…)

Créez `.github/dependabot.yml` :

```yaml
version: 2

updates:
  # ── Mettre à jour les actions GitHub ──────────────────────────────
  - package-ecosystem: "github-actions"
    directory: "/"                    # cherche dans .github/workflows/
    schedule:
      interval: "weekly"             # vérifie chaque semaine
    labels:
      - "dependencies"
      - "github-actions"

  # ── Mettre à jour les dépendances Python ──────────────────────────
  - package-ecosystem: "pip"
    directory: "/ressources"         # cherche requirements.txt ici
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
      - "python"
    open-pull-requests-limit: 5      # max 5 PRs ouvertes en même temps
```

Commitez et pushez. Allez dans **Insights → Dependency graph → Dependabot** pour vérifier que Dependabot est activé.

> ✏️ **À vous**
>
> Observez la liste des dépendances détectées dans l'onglet Dependabot. Si une mise à jour est disponible, Dependabot crée une PR automatiquement — allez voir son contenu. Que contient-elle ? Pourquoi est-ce utile en équipe ?

<details>
<summary>✅ Correction et explication</summary>

```yaml
# .github/dependabot.yml — configuration complète commentée
version: 2

updates:
  # GitHub Actions : surveille les "uses: action/nom@version" dans les workflows
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"      # "daily" ou "monthly" aussi possible
    labels:
      - "dependencies"
      - "github-actions"
    commit-message:
      prefix: "ci"            # les commits Dependabot auront le préfixe "ci:"

  # pip : surveille requirements.txt dans /ressources
  - package-ecosystem: "pip"
    directory: "/ressources"
    schedule:
      interval: "weekly"
    labels:
      - "dependencies"
      - "python"
    open-pull-requests-limit: 5
    commit-message:
      prefix: "chore"         # les commits auront le préfixe "chore:"
```

**Ce que contient une PR Dependabot :**
- Le fichier modifié (`requirements.txt` ou le workflow `.yml`)
- Le diff : ancienne version → nouvelle version
- Les release notes de la librairie
- Le résultat de la CI sur cette PR (vos tests tournent automatiquement)

**En équipe :** personne n'a à surveiller manuellement les CVE ou les changelogs. La PR Dependabot passe en revue comme n'importe quelle autre PR — si la CI est verte, on merge.

</details>

---

### Exercice 6.2 — CODEOWNERS

Le fichier `.github/CODEOWNERS` définit qui est **automatiquement ajouté comme reviewer** sur une PR selon les fichiers modifiés. Sans CODEOWNERS, quelqu'un peut modifier la CI ou les workflows de déploiement sans que personne de compétent ne le remarque.

Créez `.github/CODEOWNERS` :

```
# Syntaxe : <pattern de fichier>  <@utilisateur ou @org/équipe>

# Par défaut : tout changement requiert une review de ces personnes
*                          @<votre-compte-github>

# Les workflows CI/CD ne peuvent être modifiés que par le lead DevOps
.github/workflows/         @<votre-compte-github>

# Le fichier de dépendances requiert une validation technique
ressources/requirements.txt  @<votre-compte-github>

# Les fichiers de sécurité requièrent une double validation
.github/dependabot.yml     @<votre-compte-github>
.github/CODEOWNERS         @<votre-compte-github>
```

> ⚠️ Remplacez `<votre-compte-github>` par votre vrai nom d'utilisateur GitHub.

Commitez et pushez. Pour tester, créez une branche, modifiez un workflow, ouvrez une PR vers `main` — votre compte sera automatiquement ajouté comme reviewer requis.

<details>
<summary>✅ Correction et cas d'usage réel</summary>

```
# .github/CODEOWNERS — exemple équipe NexaCloud

# Règle par défaut (tout fichier non couvert par une règle plus précise)
*                                    @lead-dev

# Infrastructure et CI/CD : validation obligatoire du lead DevOps
.github/                             @lead-devops
terraform/                           @lead-devops
docker/                              @lead-devops

# Code applicatif : validation d'un dev senior
ressources/app.py                    @dev-senior
ressources/test_app.py               @dev-senior

# Documentation : n'importe quel membre de l'équipe
*.md                                 @lead-dev @dev-senior

# Fichiers sensibles : double validation obligatoire
.github/CODEOWNERS                   @lead-devops @lead-dev
ressources/requirements.txt          @lead-devops @dev-senior
```

**Comment ça fonctionne réellement :**
1. Quelqu'un ouvre une PR qui modifie `.github/workflows/ci.yml`
2. GitHub voit que ce chemin est couvert par la règle `.github/` → `@lead-devops`
3. `@lead-devops` est automatiquement ajouté comme **Required reviewer**
4. La PR ne peut pas être mergée sans son approbation — même si la CI est verte

**Couplé aux branch protection rules (exercice suivant), CODEOWNERS devient contraignant pour de vrai.**

</details>

---

### Exercice 6.3 — Branch Protection Rules

Sans branch protection, tout ce que vous avez construit peut être contourné : quelqu'un peut pusher directement sur `main`, merger une PR sans review, ou merger même si la CI est rouge. Les branch protection rules rendent ces garde-fous obligatoires et **font du workflow CI/CD une contrainte réelle**, pas une suggestion.

**Étape 1 — Activer la protection (interface GitHub)**

1. Allez dans **Settings → Branches** de votre repo
2. Cliquez **Add branch protection rule**
3. Dans **Branch name pattern** : tapez `main`
4. Activez exactement ces options :

| Option | Pourquoi |
|--------|----------|
| ✅ **Require a pull request before merging** | Interdit tout push direct sur `main` — tout passe par une PR |
| ✅ **Require approvals → 1** | Au moins 1 reviewer doit approuver — ce sera votre binôme à l'étape 6.5 |
| ✅ **Dismiss stale reviews when new commits are pushed** | Une review est invalidée si on repousse du code — évite d'approuver puis de modifier |
| ✅ **Require status checks to pass before merging** | La CI doit être verte avant merge |
| ✅ **Require branches to be up to date before merging** | La branche doit être à jour avec `main` |
| ✅ **Do not allow bypassing the above settings** | Même les admins respectent les règles |

5. Cliquez **Save changes**

**Étape 2 — Sélectionner le bon status check**

Après avoir activé "Require status checks", GitHub vous demande **quel job** doit passer. Ce n'est pas automatique.

1. Dans le champ de recherche qui apparaît, tapez `validate`
2. Sélectionnez le job `validate` (votre CI de validation)

> ⚠️ Si `validate` n'apparaît pas dans la liste, c'est que le CI n'a jamais tourné sur ce repo. Faites un push quelconque pour déclencher une première exécution, puis revenez sélectionner le check.

**Étape 3 — Vérifier que les règles s'appliquent**


```bash
# Tentative de push direct sur main → doit être bloqué
git push origin main
# → remote: error: GH006: Protected branch update failed for refs/heads/main.

# La bonne pratique à adopter désormais :
git checkout -b feat/ma-modification
# ... faire des modifications ...
git add .
git commit -m "feat: description de la modification"
git push origin feat/ma-modification
# → Ouvrir une PR sur GitHub → attendre la CI → demander une review → merger
```

<details>
<summary>✅ Correction et comportements attendus</summary>

**Flux protégé complet :**

```
┌─────────────────────────────────────────────────────────────────┐
│  git push origin feat/...                                       │
│         │                                                       │
│         ▼                                                       │
│    Ouvrir une Pull Request sur GitHub                           │
│         │                                                       │
│         ├──► CI se déclenche automatiquement (job "validate")   │
│         │         │                                             │
│         │    ❌ rouge → merge BLOQUÉ (status check requis)      │
│         │    ✅ vert  → merge possible si review aussi ok        │
│         │                                                       │
│         ├──► Review demandée (CODEOWNERS assigne automatiquement)│
│         │         │                                             │
│         │    ⏳ en attente → merge BLOQUÉ                       │
│         │    ✅ approuvée → merge possible si CI aussi ok        │
│         │                                                       │
│         └──► Les deux ✅ → bouton Merge devient actif           │
└─────────────────────────────────────────────────────────────────┘
```

**Note sur les repos personnels :** sans collaborateurs, vous êtes à la fois auteur et seul reviewer possible. GitHub vous empêche d'approuver votre propre PR. Pour tester seul, activez "Allow self-review" dans les paramètres de la règle — ou mieux : passez à l'exercice 6.5 en binôme, qui est la vraie condition de test.

</details>

---

### Exercice 6.4 — Exercice fil rouge : ajouter un endpoint et ouvrir une PR

Maintenant que la branche est protégée et la CI active, faites une **vraie modification** qui passe par le flux complet : branche → code → test → push → PR → CI → merge.

**Ce que vous allez ajouter :** un endpoint `/logs/stats` qui retourne le total de toutes les entrées de log.

**Étape 1 — Créer une branche**

```bash
git checkout -b feat/endpoint-stats
```

**Étape 2 — Ajouter l'endpoint dans `ressources/app.py`**

Ajoutez cette fonction avant le bloc `if __name__ == "__main__":` :

```python
@app.route("/logs/stats")
def logs_stats():
    total = sum(LOG_SUMMARY.values())
    return jsonify({
        "total": total,
        "breakdown": LOG_SUMMARY
    })
```

**Étape 3 — Écrire le test dans `ressources/test_app.py`**

```python
def test_logs_stats(client):
    """La route /logs/stats retourne le total et le détail."""
    response = client.get("/logs/stats")
    assert response.status_code == 200
    data = response.get_json()
    assert "total" in data
    assert "breakdown" in data
    assert data["total"] == 185   # 142 + 28 + 12 + 3
```

**Étape 4 — Vérifier en local avant de pusher**

```bash
cd ressources
pytest -v                          # tous les tests doivent passer, dont le nouveau
flake8 . --config .flake8          # aucune erreur de lint
cd ..
```

> 💡 C'est exactement ce que le hook pre-commit fait automatiquement si vous l'avez installé à l'étape 5. Vous devriez voir les checks passer avant même de commiter.

**Étape 5 — Commiter et pusher**

```bash
git add ressources/app.py ressources/test_app.py
git commit -m "feat: ajouter endpoint /logs/stats"
git push origin feat/endpoint-stats
```

**Étape 6 — Ouvrir la Pull Request sur GitHub**

1. GitHub affiche une bannière **"Compare & pull request"** → cliquez dessus
2. Titre : `feat: ajouter endpoint /logs/stats`
3. Description : expliquez en une phrase ce que fait l'endpoint et pourquoi
4. Cliquez **Create pull request**

**Étape 7 — Observer la CI**

Dans la PR, vous voyez le status check `validate` démarrer. Observez :
- Le cercle orange pendant l'exécution
- Le détail des étapes si vous cliquez sur **Details**
- La coche verte (ou croix rouge) au bout de ~1 minute

Le bouton **Merge pull request** reste grisé tant que la CI n'est pas verte **et** qu'aucune review n'a été approuvée.

> ✏️ **À vous**
>
> Introduisez volontairement une erreur dans votre test (changez `185` par `999`), committez et pushez. Observez la CI passer au rouge et le merge se bloquer. Corrigez puis pushez à nouveau pour voir la CI repasser au vert.

<details>
<summary>✅ Correction — endpoint et test complets</summary>

**`ressources/app.py` — section ajoutée :**

```python
@app.route("/logs/stats")
def logs_stats():
    """Retourne le total de toutes les entrées et le détail par niveau."""
    total = sum(LOG_SUMMARY.values())
    return jsonify({
        "total": total,
        "breakdown": LOG_SUMMARY
    })
```

**`ressources/test_app.py` — test ajouté :**

```python
def test_logs_stats(client):
    """La route /logs/stats retourne le total et le détail des niveaux."""
    response = client.get("/logs/stats")
    assert response.status_code == 200
    data = response.get_json()
    # Structure
    assert "total" in data
    assert "breakdown" in data
    # Valeurs : 142 + 28 + 12 + 3 = 185
    assert data["total"] == 185
    assert data["breakdown"]["critical"] == 3
```

**Vérification locale complète :**
```bash
cd ressources
pytest -v
# test_app.py::test_index_status          PASSED
# test_app.py::test_health                PASSED
# test_app.py::test_logs_summary_structure PASSED
# test_app.py::test_logs_summary_values   PASSED
# test_app.py::test_logs_critical_alerte  PASSED
# test_app.py::test_logs_stats            PASSED  ← nouveau
# 6 passed in 0.32s
```

</details>

---

### Exercice 6.5 — Travail en binôme : review croisée et CODEOWNERS

C'est l'exercice le plus proche des conditions réelles. Chaque étudiant travaille sur **son propre fork** et valide la PR de son binôme — exactement comme en équipe.

**Étape 1 — Trouver votre binôme**

Formez des paires. Chaque étudiant a son propre fork avec son URL GitHub : `https://github.com/<son-compte>/tp-github-actions`

**Étape 2 — S'ajouter mutuellement comme collaborateur**

Sur **votre** repo :
1. **Settings → Collaborators → Add people**
2. Cherchez le nom GitHub de votre binôme
3. Choisissez le rôle **Write** (peut pusher et créer des PRs, mais pas modifier les settings)
4. Votre binôme reçoit une invitation par email — il doit l'accepter

**Étape 3 — Mettre à jour CODEOWNERS pour inclure votre binôme**

Sur **votre** repo, modifiez `.github/CODEOWNERS` :

```
# Tout changement requiert une approbation de votre binôme
*                          @<votre-compte>  @<compte-binome>

# Les workflows ne peuvent être modifiés qu'avec validation des deux
.github/workflows/         @<votre-compte>  @<compte-binome>

# Le code applicatif
ressources/                @<votre-compte>  @<compte-binome>
```

Committez et pushez **directement sur `main`** — c'est une modification de gouvernance.

> ⚠️ Après ce commit, vous ne pourrez **plus** pusher sur `main` directement (branch protection). Assurez-vous que CODEOWNERS est correct avant.

**Étape 4 — Faire la review croisée**

Votre binôme ouvre une PR sur son repo (l'exercice 6.4 avec l'endpoint `/logs/stats`).

En tant que reviewer sur **son** repo :
1. Allez sur `https://github.com/<binome>/tp-github-actions/pulls`
2. Ouvrez sa PR
3. Cliquez **Files changed** — lisez le diff du code et du test
4. Cliquez **Review changes** puis :
   - **Comment** : si vous avez des questions sans bloquer
   - **Request changes** : si quelque chose doit être corrigé avant merge
   - **Approve** : si tout est correct

5. Une fois approuvée **et** la CI verte, votre binôme peut merger

**Ce que vous vérifiez en tant que reviewer :**

```
□ Le nouvel endpoint retourne le bon status code (200)
□ Le test vérifie la structure ET les valeurs
□ Le code ne casse pas les tests existants (CI verte)
□ Pas d'import inutile, pas de ligne trop longue (lint vert)
□ Le nom de la branche et le message de commit sont lisibles
□ La description de la PR explique le changement
```

> ✏️ **À vous**
>
> Laissez un commentaire sur la PR de votre binôme — même si tout est correct, notez ce que vous avez vérifié. En entreprise, une review sans commentaire est une review suspecte.

<details>
<summary>✅ Exemple de review bien rédigée</summary>

**Commentaire global (onglet "Review changes") :**

```
✅ Approve

J'ai vérifié :
- L'endpoint /logs/stats répond 200 avec la bonne structure (total + breakdown)
- Le calcul 142 + 28 + 12 + 3 = 185 est correct
- Le test couvre la structure et les valeurs
- La CI est verte : lint et 6 tests passent
- Pas d'effet de bord sur les autres routes

Suggestion mineure (non bloquante) : on pourrait ajouter un assert sur
data["breakdown"]["info"] == 142 pour couvrir tous les niveaux.
```

**Commentaire inline sur une ligne de code :**

```python
# Sur la ligne : assert data["total"] == 185
# Commentaire : bien de tester la valeur exacte — mais si LOG_SUMMARY change
# un jour, ce test cassera silencieusement. Envisager de calculer le total
# dynamiquement : assert data["total"] == sum(LOG_SUMMARY.values())
```

</details>

---

### Exercice 6.4 — Secret Scanning

GitHub scanne automatiquement les commits à la recherche de patterns reconnus comme des credentials (clés AWS, tokens GitHub, clés Azure, mots de passe courants…). Si un secret est détecté, GitHub envoie une alerte et, pour certains fournisseurs, révoque le token automatiquement.

**Activer secret scanning :**

1. **Settings → Code security and analysis**
2. Activez **Secret scanning** (peut nécessiter un repo public ou GitHub Advanced Security)
3. Activez aussi **Push protection** — bloque le push si un secret est détecté avant même qu'il arrive dans l'historique

**Tester la détection (avec un faux secret) :**

> ⚠️ Utilisez uniquement des **faux secrets** au format reconnu — jamais de vraies clés.

```bash
# Créer un fichier avec un faux token GitHub (format reconnu par le scanner)
echo "GITHUB_TOKEN=ghp_azertyuiopqsdfghjklmwxcvbn123456789" > test-secret.txt
git add test-secret.txt
git commit -m "test: vérification du secret scanning"
git push origin main
```

Si **Push protection** est activé, GitHub bloque le push avec un message explicite. Sinon, une alerte apparaît dans **Security → Secret scanning alerts**.

```bash
# Nettoyer après le test
git rm test-secret.txt
git commit -m "chore: suppression du fichier de test"
git push origin main
```

> 💡 **Important :** supprimer le fichier ne supprime pas le secret de l'historique Git. En production, si un vrai secret est commité, il faut le révoquer immédiatement côté fournisseur (GitHub, AWS, Azure…) — la rotation du secret est prioritaire sur le nettoyage de l'historique.

<details>
<summary>✅ Correction — Checklist sécurité complète d'un repo</summary>

Voici la checklist qu'une équipe DevOps applique à chaque nouveau repo :

```
Sécurité dépendances
  ☑ .github/dependabot.yml configuré (github-actions + pip/npm)
  ☑ Dependabot activé dans Settings → Code security

Gouvernance des changements
  ☑ .github/CODEOWNERS configuré avec les bons responsables
  ☑ Branch protection sur main :
      - Pull request obligatoire
      - 1 approbation minimum
      - CI obligatoire avant merge
      - Branches à jour avant merge
      - Bypass interdit même pour les admins

Détection des secrets
  ☑ Secret scanning activé
  ☑ Push protection activé
  ☑ .gitignore inclut .env, *.key, *.pem, credentials*

Bonnes pratiques
  ☑ Pas de secrets dans le code — uniquement via ${{ secrets.NOM }}
  ☑ Actions épinglées à une version précise (ex: @v4 et non @main)
  ☑ Principe du moindre privilège sur les tokens (write-all désactivé)
```

**Épingler les actions à un hash de commit (niveau avancé) :**
```yaml
# Moins pratique mais plus sûr : un tag peut être déplacé, un hash non
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2
```

</details>

---

### Pour aller plus loin — Étape 6

<details>
<summary>💡 Voir les pistes d'approfondissement</summary>

```yaml
# Ajouter CodeQL pour l'analyse de sécurité du code Python

on:
  push:
    branches: [main]
  schedule:
    - cron: "0 6 * * 1"   # chaque lundi matin

jobs:
  analyse:
    runs-on: ubuntu-latest
    permissions:
      security-events: write

    steps:
      - uses: actions/checkout@v4

      - name: Initialiser CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: python

      - name: Analyser
        uses: github/codeql-action/analyze@v3
```

```
# Ajouter un badge de statut CI dans le README
# Copiez cette ligne en haut de votre README.md :
![CI](https://github.com/<votre-compte>/tp-github-actions/actions/workflows/ci.yml/badge.svg)
```

</details>

---

## BONUS — Workflows avancés (1h)

> Cette section nécessite d'avoir terminé les étapes 1 à 5.

### Bonus 1 — Matrix build : tester sur plusieurs versions Python

```yaml
name: Matrix CI

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        python-version: ["3.10", "3.11", "3.12"]
      fail-fast: false    # continuer même si une version échoue

    steps:
      - uses: actions/checkout@v4

      - name: Setup Python ${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}

      - run: pip install -r ressources/requirements.txt
      - run: pytest ressources/ -v
```

GitHub lancera **3 jobs en parallèle**, un par version Python. Très utile pour s'assurer de la compatibilité.

---

### Bonus 2 — Workflow réutilisable

Un workflow réutilisable évite de copier-coller les mêmes steps dans plusieurs workflows.

Créez `.github/workflows/reusable-tests.yml` :

```yaml
name: Tests réutilisables

on:
  workflow_call:              # ce workflow est appelé par d'autres workflows
    inputs:
      python-version:
        required: true
        type: string

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: ${{ inputs.python-version }}

      - run: pip install -r ressources/requirements.txt
      - run: pytest ressources/ -v
```

Appelez-le depuis votre `cicd.yml` :

```yaml
jobs:
  qualite:
    uses: ./.github/workflows/reusable-tests.yml
    with:
      python-version: "3.11"
```

---

## Grille d'évaluation (20 pts)

| Critère | Points |
|---------|--------|
| Étape 1 : workflow `hello.yml` fonctionnel avec les 4 infos contexte + date | 2 |
| Étape 2 : pipeline CI avec lint flake8 + tests pytest en deux jobs parallèles | 4 |
| Étape 3 : secret utilisé correctement, environnements staging/production créés | 3 |
| Étape 4 : pipeline CI/CD complet avec les 3 jobs chainés | 4 |
| Étape 5 : `.pre-commit-config.yaml` fonctionnel + hook pre-push | 3 |
| Étape 6 : Dependabot + CODEOWNERS + branch protection avec status check obligatoire | 2 |
| Étape 6.4 : endpoint `/logs/stats` avec test → PR → CI verte → merge | 2 |
| Étape 6.5 : binôme ajouté comme collaborateur + review croisée approuvée | 2 |
| BONUS : matrix build ou workflow réutilisable | 2 |

---

*Formation DevSecOps Azure — Simplon*
