import validateArchitecture from "./modules/validateArchitecture.js"
import dependencyGraph from "./modules/dependencyGraph.js"
import taskScheduler from "./modules/taskScheduler.js"

import scaffoldProject from "./modules/scaffoldProject.js"
import buildDatabase from "./modules/buildDatabase.js"
import buildBackendCore from "./modules/buildBackendCore.js"
import buildFrontendCore from "./modules/buildFrontendCore.js"
import featureBuilder from "./modules/featureBuilder.js"

export default async function runImplementApp() {

  console.log("Starting implement-app skill")

  // STEP 1
  await validateArchitecture()

  // STEP 2
  await dependencyGraph()

  // STEP 3
  const taskRegistry = {
    database: buildDatabase,
    "backend-core": buildBackendCore,
    "frontend-core": buildFrontendCore,
    features: featureBuilder
  }

  const scheduler = taskScheduler(taskRegistry)

  // STEP 4
  await scaffoldProject()

  // STEP 5–8
  await scheduler.run()

  console.log("Implementation pipeline complete")

}
