import fs from "fs"
import { execSync } from "child_process"

const PACKAGE_FILE = "package.json"

function run(cmd) {
  execSync(cmd, { stdio: "inherit" })
}

function ensurePackageJson() {

  if (!fs.existsSync(PACKAGE_FILE)) {

    console.log("Initializing package.json")

    run("npm init -y")

  }

}

function ensurePlaywrightInstalled() {

  const pkg = JSON.parse(fs.readFileSync(PACKAGE_FILE))

  const devDeps = pkg.devDependencies || {}

  if (!devDeps["@playwright/test"]) {

    console.log("Installing Playwright")

    run("npm install -D @playwright/test")

    run("npx playwright install")

  }

}

function ensurePlaywrightConfig() {

  if (!fs.existsSync("playwright.config.js")) {

    console.log("Creating Playwright config")

    const config = `
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true
  }
})
`

    fs.writeFileSync("playwright.config.js", config)

  }

}

function ensureE2EDirectory() {

  fs.mkdirSync("tests/e2e", { recursive: true })

}

function updatePackageScripts() {

  const pkg = JSON.parse(fs.readFileSync(PACKAGE_FILE))

  if (!pkg.scripts) pkg.scripts = {}

  if (!pkg.scripts["test:e2e"]) {

    console.log("Adding Playwright script to package.json")

    pkg.scripts["test:e2e"] = "playwright test"

    fs.writeFileSync(
      PACKAGE_FILE,
      JSON.stringify(pkg, null, 2)
    )

  }

}

function runUnitTests() {

  if (!fs.existsSync(PACKAGE_FILE)) return

  const pkg = JSON.parse(fs.readFileSync(PACKAGE_FILE))

  if (pkg.scripts && pkg.scripts.test) {

    console.log("Running unit tests")

    run("npm test")

  }

}

function runPlaywrightTests() {

  console.log("Running Playwright E2E tests")

  run("npx playwright test")

}

export default async function testRunner() {

  console.log("Preparing test environment")

  ensurePackageJson()

  ensurePlaywrightInstalled()

  ensurePlaywrightConfig()

  ensureE2EDirectory()

  updatePackageScripts()

  console.log("Running tests")

  runUnitTests()

  runPlaywrightTests()

}
