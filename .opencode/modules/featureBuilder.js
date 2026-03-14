import fs from "fs"

const PLAN_PATH = "docs/reference/plan.md"

function loadPlan() {

  if (!fs.existsSync(PLAN_PATH)) {
    throw new Error("plan.md missing")
  }

  return fs.readFileSync(PLAN_PATH, "utf8")

}

function extractFeatures(planText) {

  const features = []
  const lines = planText.split("\n")

  for (const line of lines) {

    if (line.startsWith("Feature")) {

      const name = line
        .replace("Feature:", "")
        .replace("Feature", "")
        .trim()

      features.push(name)

    }

  }

  return features

}

function createBackendFeature(feature) {

  const controller = `
export async function ${feature}Feature(req,res){

  res.json({
    feature:"${feature}",
    status:"active"
  })

}
`

  fs.writeFileSync(
    `backend/controllers/${feature}FeatureController.js`,
    controller
  )

  const route = `
import express from "express"
import { ${feature}Feature } from "../controllers/${feature}FeatureController.js"

const router = express.Router()

router.get("/", ${feature}Feature)

export default router
`

  fs.writeFileSync(
    `backend/routes/${feature}Feature.js`,
    route
  )

}

function createFrontendFeature(feature) {

  const component = `
export default function ${feature}Feature(){

  async function load(){

    const res = await fetch("/api/${feature}")

    const data = await res.json()

    console.log(data)

  }

  return(

    <div>

      <h2>${feature} Feature</h2>

      <button onClick={load}>
        Load ${feature}
      </button>

    </div>

  )

}
`

  fs.writeFileSync(
    `frontend/pages/${feature}.jsx`,
    component
  )

}

function writeFeatureLog(features) {

  const log = `
# Feature Build Log

Features Built:
${features.join("\n")}

Time:
${new Date().toISOString()}
`

  fs.writeFileSync(
    "docs/reference/feature-build-log.md",
    log
  )

}

export default async function featureBuilder() {

  console.log("Building application features")

  const plan = loadPlan()

  const features = extractFeatures(plan)

  if (features.length === 0) {
    throw new Error("No features detected in plan")
  }

  for (const feature of features) {

    createBackendFeature(feature)

    createFrontendFeature(feature)

    console.log(`Feature created: ${feature}`)

  }

  writeFeatureLog(features)

  console.log(`Feature generation complete (${features.length} features)`)

}
