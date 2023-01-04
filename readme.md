<p align="center"><img alt="Directus Logo" src="https://user-images.githubusercontent.com/522079/158864859-0fbeae62-9d7a-4619-b35e-f8fa5f68e0c8.png"></p>

<br />

## 🐰 Introduction

Directus is a real-time API and App dashboard for managing SQL database content.

- **Free & open-source.** No artificial limitations, vendor lock-in, or hidden paywalls.
- **REST & GraphQL API.** Instantly layers a blazingly fast Node.js API on top of any SQL database.
- **Manage pure SQL.** Works with new or existing SQL databases, no migration required.
- **Choose your database.** Supports PostgreSQL, MySQL, SQLite, OracleDB, CockroachDB, MariaDB, and MS-SQL.
- **On-Prem or Cloud.** Run locally, install on-premises, or use our
  [self-service Cloud service](https://directus.io/pricing) (free tier available).
- **Completely extensible.** Built to white-label, it is easy to customize our modular platform.
- **A modern dashboard.** Our no-code Vue.js app is safe and intuitive for non-technical users, no training required.

**[Learn more about Directus](https://directus.io)**

<br />

## 🚀 Directus Cloud

[Directus Cloud](https://directus.io/pricing) allows you to create free Community Cloud projects in 90 seconds.

- **Free Community Cloud tier available (no credit card required)**
- **No product limitations or service usage quotas (unlimited users, API requests, etc)**
- A modern self-service dashboard to create and monitor all your projects in one place
- End-to-end solution: Directus, database, serverless auto-scaling, storage, and a global CDN
- Hourly usage-based pricing for our Standard Cloud allows you to pay-as-you-go
- Select your desired region and provision a new project in ~90 seconds

**[Create your Free Project](https://directus.cloud)**

<br />

## ⚙️ Installation

You can use the following configuration to get started using Docker Compose. Make sure to change all sensitive values
like `KEY`, `SECRET`, `ADMIN_PASSWORD`, _etc._

```yaml
version: '3'
services:
  directus:
    image: directus/directus:latest
    volumes:
      - ./uploads:/directus/uploads
      - ./database:/directus/database
    environment:
      KEY: '255d861b-5ea1-5996-9aa3-922530ec40b1'
      SECRET: '6116487b-cda1-52c2-b5b5-c8022c45e263'

      DB_CLIENT: 'sqlite3'
      DB_FILENAME: './data.db'

      ADMIN_EMAIL: 'admin@example.com'
      ADMIN_PASSWORD: 'd1r3ctu5'
```

Save this in your project as a file named `docker-compose.yml` and run:

```
docker-compose up -d
```

To learn more, visit the [Docker Guide](/self-hosted/installation/docker).

<br />

## 📌 Requirements

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) (often included with newer Docker installations)

#### Supported Databases

- PostgreSQL 10+
- MySQL 5.7.8+ / 8+ (with
  [mysql_native_password](https://dev.mysql.com/doc/refman/8.0/en/upgrading-from-previous-series.html#upgrade-caching-sha2-password-compatible-connectors))
- MariaDB 10.2.7+
- SQLite 3+
- CockroachDB 21.1.13+<sup>[1]</sup>
- MS SQL 13+<sup>[1]</sup>
- OracleDB 19+<sup>[1]</sup>

<sup>[1]</sup> Older versions may work, but aren't officially tested/supported.

#### Supported OS

- Ubuntu 18.04
- CentOS / RHEL 8
- macOS Catalina or newer
- Windows 10/11
- Docker ([DockerHub](https://hub.docker.com/r/directus/directus) +
  [Dockerfile](https://github.com/directus/directus/blob/main/docker/Dockerfile))

_Other operating systems may also work, but are not officially supported._

<br />

## 🤔 Community Help

[The Directus Documentation](https://docs.directus.io) is a great place to start, or explore these other channels:

- [Discord](https://directus.chat) (Live Discussions)
- [GitHub Issues](https://github.com/directus/directus/issues) (Report Bugs)
- [GitHub Discussions](https://github.com/directus/directus/discussions) (Questions, Feature Requests)
- [Twitter](https://twitter.com/directus) (Latest News)
- [YouTube](https://www.youtube.com/c/DirectusVideos/featured) (Video Tutorials)

<br />

## ❤️ Contributing & Sponsoring

Please read our [Contributing Guide](./contributing.md) before submitting Pull Requests.

All security vulnerabilities should be reported in accordance with our
[Security Policy](https://docs.directus.io/contributing/introduction/#reporting-security-vulnerabilities).

Directus is a premium open-source ([GPLv3](./license)) project, made possible with support from our passionate core
team, talented contributors, and amazing [GitHub Sponsors](https://github.com/sponsors/directus). Thank you all!

<br />

© 2004-2022, Monospace Inc
