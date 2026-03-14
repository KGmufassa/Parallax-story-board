import fs from "fs"

const PLAN_PATH = "docs/reference/plan.md"
const OUTPUT_PATH = "docs/reference/dependency-graph.json"

function loadPlan() {

  if (!fs.existsSync(PLAN_PATH)) {
    throw new Error("plan.md not found")
  }

  return fs.readFileSync(PLAN_PATH, "utf8")
}

function extractFeatures(planText) {

  const features = []

  const lines = planText.split("\n")

  for (const line of lines) {

    if (line.trim().startsWith("Feature")) {

      const name = line
        .replace("Feature:", "")
        .replace("Feature", "")
        .trim()

      features.push(name.toLowerCase().replace(/\s+/g, "-"))

    }

  }

  return features
}

function buildCoreTasks() {

  return [
    { id: "database", depends: [] },
    { id: "backend-core", depends: ["database"] },
    { id: "frontend-core", depends: [] }
  ]

}

function buildFeatureTasks(features) {

  const tasks = []

  for (const feature of features) {

    tasks.push({
      id: `feature-${feature}`,
      depends: ["backend-core", "frontend-core"]
    })

  }

  return tasks

}

function writeGraph(graph) {

  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(graph, null, 2)
  )

}

export default async function dependencyGraph() {

  console.log("Generating dependency graph")

  const plan = loadPlan()

  const features = extractFeatures(plan)

  if (features.length === 0) {
    throw new Error("No features detected in plan.md")
  }

  const coreTasks = buildCoreTasks()

  const featureTasks = buildFeatureTasks(features)

  const graph = {
    tasks: [...coreTasks, ...featureTasks]
  }

  writeGraph(graph)

  console.log(`Dependency graph created (${graph.tasks.length} tasks)`)

  return graph

}
