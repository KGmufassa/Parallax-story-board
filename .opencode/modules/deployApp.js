import fs from "fs"
import { execSync } from "child_process"

const STACK_PATH = "docs/reference/stack.md"

function loadStack() {

  if (!fs.existsSync(STACK_PATH)) {
    throw new Error("stack.md missing")
  }

  return fs.readFileSync(STACK_PATH,"utf8")

}

function createDeploymentDir() {

  fs.mkdirSync("deployment",{recursive:true})

}

function createDockerfile() {

  const dockerfile = `
FROM node:20

WORKDIR /app

COPY . .

RUN npm install

EXPOSE 3000

CMD ["node","backend/server.js"]
`

  fs.writeFileSync("deployment/Dockerfile",dockerfile)

}

function createCompose() {

  const compose = `
version: "3"

services:

  app:
    build: .
    ports:
      - "3000:3000"

  database:
    image: postgres
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: password
      POSTGRES_DB: app_db
    ports:
      - "5432:5432"
`

  fs.writeFileSync(
    "deployment/docker-compose.yml",
    compose
  )

}

function buildFrontend() {

  if (fs.existsSync("frontend")) {

    try {

      execSync("npm run build",{stdio:"inherit"})

    } catch {

      console.log("Frontend build skipped")

    }

  }

}

function packageApp() {

  try {

    execSync(
      "docker compose build",
      {stdio:"inherit"}
    )

  } catch {

    console.log("Docker build skipped")

  }

}

function deployApp() {

  try {

    execSync(
      "docker compose up -d",
      {stdio:"inherit"}
    )

  } catch {

    console.log("Deployment skipped")

  }

}

function writeDeploymentReport() {

  const report = `
# Deployment Report

Status: Deployment Attempted

Time:
${new Date().toISOString()}

Deployment Method:
Docker Compose
`

  fs.writeFileSync(
    "docs/reference/deployment-report.md",
    report
  )

}

export default async function deployAppModule() {

  console.log("Starting deployment process")

  loadStack()

  createDeploymentDir()

  createDockerfile()

  createCompose()

  buildFrontend()

  packageApp()

  deployApp()

  writeDeploymentReport()

  console.log("Deployment process finished")

}
