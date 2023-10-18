# Your Story Matters (YSM)

Your Story Matters (YSM) is a digital companion for survivors of sexual assault launched in 2019. Formerly called YANA (You Are Not Alone) and funded by Nesta and the UK Department of Digital, Culture, Media and Sport through the Tech to Connect Challenge, YSM has curated content including recovery, moving through trauma, accessing justice through the law, stories of resilience, and allows survivors the option to create an account and save their journey.

## Get Involved

If you would like to help Chayn and receive special access to our organization and volunteer opportunities, please [visit our Getting Involved guide](https://chayn.notion.site/Get-involved-423c067536f3426a88005de68f0cab19). We'll get back to you to schedule an onboarding call. Other ways to get involved and support us are [donating](https://www.paypal.me/chaynhq), starring this repo and making an open-source contribution here on GitHub, and supporting us on social media!

Our social medias:

Website - [Chayn](https://www.chayn.co/)

Twitter - [@ChaynHQ](https://twitter.com/ChaynHQ)

Instagram - [@chaynhq](https://www.instagram.com/chaynhq/)

Youtube - [Chayn Team](https://www.youtube.com/channel/UC5_1Ci2SWVjmbeH8_USm-Bg)

LinkedIn - [@chayn](https://www.linkedin.com/company/chayn)

# YSM Backend

![GitHub Actions CI workflow badge](https://github.com/chaynHQ/ysm-backend/workflows/YSM%20Backend%20CI%20pipeline/badge.svg)

A NestJS API server with Jest testing.

This repo serves just the YSM backend, find YSM's frontend code here: https://github.com/chaynHQ/ysm

**Currently in active development.**

## How to Contribute:

Before making a contribution, please follow our Contributing Guidelines in [CONTRIBUTING.md](/CONTRIBUTING.md).

Happy coding! ⭐

## Development

**RECOMMENDED: You may skip ahead to the [Running as a Docker Container Locally section below](#running-as-a-docker-container-locally) if you just want to run the backend service locally and not do any development work on it.**

### Prerequisites

- NodeJS v14+
- Yarn v1.21+

### Technologies Used:

- [NestJS](https://nestjs.com/) - Node.js web framework
- [Jest](https://jestjs.io/) - JavaScript testing
- [Firebase](https://firebase.google.com/) - user authentication and analytics
- [Rollbar](https://rollbar.com/) - error reporting
- [StoryBlok](https://www.storyblok.com/) - headless CMS for pages and courses content
- [Heroku](https://www.heroku.com/) - build, deploy and operate staging and production apps
- [GitHub Actions](https://github.com/features/actions) - CI pipeline

### Set up local env config

For local development, create a new **`.env.development`** file and add the following environment variables:

If you're an official Chayn volunteer, please get in touch with the team for access to the environment variables.

```
# The API token from Storyblok (must have 'draft' access)
STORYBLOK_TOKEN=

# The service account JSON object serialised into a string and then base64 encoded
FIREBASE_SERVICE_ACCOUNT={value}

# OPTIONAL: comma separated list of email addresses for users allowed to access preview mode (for viewing draft content from Storyblok)
CONTENT_EDITOR_EMAILS=

# OPTIONAL: when running in `dev` mode. Either set this to the Rollbar server token, or to `false` to disable.
ROLLBAR_TOKEN={value}

# OPTIONAL: required in `production` mode or if `ROLLBAR_TOKEN` is set.
ROLLBAR_ENV=local-dev

# OPTIONAL: The window of time (in milliseconds) for the rate limiting to apply.
RATE_LIMIT_WINDOW_MS={value}

# OPTIONAL: The max number of requests (per IP address) within the window of time (above).
RATE_LIMIT_MAX=(value)
```

**If creating new environment variables:**

- Check if the new environment variable must be added the [ci.yml](.github/workflows/ci.yml) file.
- Note that new environment variables must be added to Heroku before release to production. Please tag staff in your issue if creating new environment variables.

### Install dependencies

```bash
yarn
```

### Set up local env config for tests

Tests will use a separate `.env.test` file which should already be present.

You'll also need to create a **`.env.test.local`** file (see below for more details).

All access to external services in **unit tests** should be mocked out, so when adding new config to the app make sure to add a dummy 'noop' value in the `.env.test` file and commit to the repo.

It's also advisable to mock out access to external services in the **e2e tests** (e.g. like with Storyblok), but sometimes it makes sense to actually call the external service (like for Firebase Auth tokens). In the latter case, make sure all "live" config is set in a **`.env.test.local`** file (which must NOT be committed to the repo), with the following:

```shell
FIREBASE_SERVICE_ACCOUNT={value}  # Same as in .env.development - the service account JSON object serialised into a string and then base64 encoded

FIREBASE_WEB_API_KEY={value}  # Special API key just for use in e2e tests - found in the settings page for the Firebase project
```

### Run locally

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```

### Run tests

```bash
# unit tests
$ yarn test

# e2e tests
$ yarn test:e2e

# test coverage
$ yarn test:cov
```

### Formatting and linting

```bash
yarn lint
```

To lint and fix:

```bash
yarn lint:fix
```

Formatting and linting is provided by ESLint and Prettier (see the relevant configs for details).

Workspace settings for VSCode are included in this folder.

### Build the app for production

```bash
yarn build
```

### Generating new modules, controllers, services, etc

NestJS provides the [`nest generate`](https://docs.nestjs.com/cli/usages#nest-generate) command to help generate relevant files.

### Debug logs for all `axios` requests (e.g. for Storyblok requests)

To see debug logs for all axios requests made – e.g. by the Storyblok client – start the dev server with:

```bash
DEBUG=axios yarn start:dev
```

Note: the `axios-debug-log` library used to provide this logging has only been added as a dev dependency, so this will not work in production environments.

# Running as a Docker Container Locally

You may want to run the backend service in a Docker container if:

1. You don't intend to do any development work on it and just need a running service for the frontend to access.
1. You want to test that the Docker image works as expected, e.g. if you've made any changes to the `Dockerfile`.

**Steps to run the docker container locally:**

1. Ensure you have the Docker service installed and running on your machine. More info on how to do this: <https://docs.docker.com/get-docker/>.
2. Follow the directions above on [setting up your local env config](#set-up-local-env-config). Note that you don't need to follow any other instructions from the previous sections (like having the prerequisites, installing dependencies, etc.) as the Docker build process will do all this for you.

Then, build the image:

```sh
docker build -t ysm-backend .
```

Then, run the backend service in a container:

```sh
docker run --rm -it -p 3000:3000 --env-file=.env.development -e PORT=3000 --init ysm-backend
```

You can now test that the service is running, either using `curl`:

```sh
curl -v http://localhost:3000/api/resources
```

… or opening the URL <http://localhost:3000/api/resources> in your browser. It should show the JSON output of the `/resources` API.

# License

This project uses the [MIT License](/LICENSE).

YSM and all of Chayn's projects are open-source.

While the core tech stack included here is open-source, some external integrations used in this project may require subscriptions.
