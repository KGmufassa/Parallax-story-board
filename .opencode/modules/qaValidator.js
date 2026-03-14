import fs from "fs"

const PLAN_PATH = "docs/reference/plan.md"

function loadPlan() {

  if (!fs.existsSync(PLAN_PATH)) {
    throw new Error("plan.md missing")
  }

  return fs.readFileSync(PLAN_PATH,"utf8")

}

function extractFeatures(text) {

  const features = []

  const lines = text.split("\n")

  for (const line of lines) {

    if (line.startsWith("Feature")) {

      const name = line
        .replace("Feature:","")
        .replace("Feature","")
        .trim()

      features.push(name)

    }

  }

  return features

}

function getBackendRoutes() {

  if (!fs.existsSync("backend/routes")) return []

  return fs.readdirSync("backend/routes")
    .map(f => f.replace(".js",""))

}

function getFrontendPages() {

  if (!fs.existsSync("frontend/pages")) return []

  return fs.readdirSync("frontend/pages")
    .map(f => f.replace(".jsx",""))

}

function validateFeatures(features, routes, pages) {

  const missingBackend = []
  const missingFrontend = []

  for (const feature of features) {

    if (!routes.includes(feature) && !routes.includes(feature+"Feature")) {
      missingBackend.push(feature)
    }

    if (!pages.includes(feature)) {
      missingFrontend.push(feature)
    }

  }

  return {
    missingBackend,
    missingFrontend
  }

}

function writeReport(features, routes, pages, validation) {

  const status =
    validation.missingBackend.length === 0 &&
    validation.missingFrontend.length === 0
      ? "PASSED"
      : "FAILED"

  const report = `
# QA Report

Features Expected
${features.join("\n")}

Backend Routes Found
${routes.join("\n")}

Frontend Pages Found
${pages.join("\n")}

Missing Backend Routes
${validation.missingBackend.join("\n") || "None"}

Missing Frontend Pages
${validation.missingFrontend.join("\n") || "None"}

Status
${status}

Time
${new Date().toISOString()}
`

  fs.writeFileSync(
    "docs/reference/qa-report.md",
    report
  )

  return status

}

export default async function qaValidator() {

  console.log("Running QA validation")

  const plan = loadPlan()

  const features = extractFeatures(plan)

  const routes = getBackendRoutes()

  const pages = getFrontendPages()

  const validation = validateFeatures(features, routes, pages)

  const status = writeReport(
    features,
    routes,
    pages,
    validation
  )

  if (status === "FAILED") {
    throw new Error("QA validation failed")
  }

  console.log("QA validation passed")

}
