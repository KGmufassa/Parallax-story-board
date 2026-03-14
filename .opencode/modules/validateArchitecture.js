import fs from "fs"

const REQUIRED_FILES = [
  "docs/reference/prd.md",
  "docs/reference/plan.md",
  "docs/reference/backend-architecture.md",
  "docs/reference/frontend-architecture.md",
  "docs/reference/frontend-design-spec.md",
  "docs/reference/stack.md",
  "docs/reference/architecture-rules.md"
]

function fileExists(path) {
  return fs.existsSync(path)
}

function readFile(path) {
  return fs.readFileSync(path, "utf8")
}

function validateRequiredFiles() {

  const missing = []

  for (const file of REQUIRED_FILES) {

    if (!fileExists(file)) {
      missing.push(file)
    }

  }

  return missing

}

function validateBackendArchitecture(content) {

  const result = {
    hasEntities: false,
    hasServices: false
  }

  if (content.includes("Entity")) {
    result.hasEntities = true
  }

  if (content.includes("Service")) {
    result.hasServices = true
  }

  return result

}

function validateFrontendArchitecture(content) {

  const result = {
    hasRoutes: false,
    hasComponents: false
  }

  if (content.includes("Route")) {
    result.hasRoutes = true
  }

  if (content.includes("Component")) {
    result.hasComponents = true
  }

  return result

}

function validatePlan(content) {

  const result = {
    hasFeatures: false
  }

  if (content.includes("Feature")) {
    result.hasFeatures = true
  }

  return result

}

function writeValidationReport(report) {

  const output = `
# Architecture Validation Report

Validation Time:
${new Date().toISOString()}

## Missing Files
${report.missingFiles.length === 0 ? "None" : report.missingFiles.join("\n")}

## Backend Architecture
Entities: ${report.backend.hasEntities}
Services: ${report.backend.hasServices}

## Frontend Architecture
Routes: ${report.frontend.hasRoutes}
Components: ${report.frontend.hasComponents}

## Plan
Features Present: ${report.plan.hasFeatures}

Validation Status:
${report.status}
`

  fs.writeFileSync(
    "docs/reference/architecture-validation.md",
    output
  )

}

export default async function validateArchitecture() {

  console.log("Running architecture validation")

  const missingFiles = validateRequiredFiles()

  if (missingFiles.length > 0) {

    writeValidationReport({
      missingFiles,
      backend: {},
      frontend: {},
      plan: {},
      status: "FAILED"
    })

    throw new Error("Architecture validation failed: missing files")

  }

  const backendContent = readFile("docs/reference/backend-architecture.md")
  const frontendContent = readFile("docs/reference/frontend-architecture.md")
  const planContent = readFile("docs/reference/plan.md")

  const backend = validateBackendArchitecture(backendContent)
  const frontend = validateFrontendArchitecture(frontendContent)
  const plan = validatePlan(planContent)

  const status =
    backend.hasEntities &&
    backend.hasServices &&
    frontend.hasRoutes &&
    frontend.hasComponents &&
    plan.hasFeatures
      ? "PASSED"
      : "FAILED"

  const report = {
    missingFiles: [],
    backend,
    frontend,
    plan,
    status
  }

  writeValidationReport(report)

  if (status === "FAILED") {
    throw new Error("Architecture validation failed")
  }

  console.log("Architecture validation passed")

}
