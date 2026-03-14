import fs from "fs"
import path from "path"

const STACK_PATH = "docs/reference/stack.md"

function loadStack() {

  if (!fs.existsSync(STACK_PATH)) {
    throw new Error("stack.md not found")
  }

  return fs.readFileSync(STACK_PATH, "utf8")

}

function createDirectory(dir) {

  fs.mkdirSync(dir, { recursive: true })

}

function createBackendStructure() {

  const dirs = [
    "backend/controllers",
    "backend/services",
    "backend/repositories",
    "backend/routes",
    "backend/models",
    "backend/config"
  ]

  dirs.forEach(createDirectory)

}

function createFrontendStructure() {

  const dirs = [
    "frontend/pages",
    "frontend/components",
    "frontend/layouts",
    "frontend/hooks"
  ]

  dirs.forEach(createDirectory)

}

function createDatabaseStructure() {

  const dirs = [
    "database/migrations",
    "database/seeds"
  ]

  dirs.forEach(createDirectory)

}

function createTestStructure() {

  const dirs = [
    "tests/backend",
    "tests/frontend"
  ]

  dirs.forEach(createDirectory)

}

function createBaseFiles() {

  const files = {
    "backend/app.js": "// backend entry point\n",
    "frontend/app.js": "// frontend entry point\n",
    "database/README.md": "# Database Layer\n",
    "tests/README.md": "# Test Suite\n"
  }

  for (const file in files) {

    const dir = path.dirname(file)

    createDirectory(dir)

    fs.writeFileSync(file, files[file])

  }

}

export default async function scaffoldProject() {

  console.log("Scaffolding project structure")

  const stack = loadStack()

  console.log("Detected stack configuration")

  createBackendStructure()

  createFrontendStructure()

  createDatabaseStructure()

  createTestStructure()

  createBaseFiles()

  console.log("Project scaffold created")

}
