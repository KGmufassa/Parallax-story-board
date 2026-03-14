import fs from "fs"

const ARCH_PATH = "docs/reference/backend-architecture.md"

function loadArchitecture() {

  if (!fs.existsSync(ARCH_PATH)) {
    throw new Error("backend-architecture.md missing")
  }

  return fs.readFileSync(ARCH_PATH, "utf8")

}

function extractServices(text) {

  const services = []

  const lines = text.split("\n")

  for (const line of lines) {

    if (line.startsWith("Service:")) {

      const name = line.replace("Service:", "").trim()

      services.push(name)

    }

  }

  return services

}

function createController(service) {

  const code = `
import ${service}Service from "../services/${service}Service.js"

export async function ${service}Controller(req, res) {

  const result = await ${service}Service(req.body)

  res.json(result)

}
`

  fs.writeFileSync(
    `backend/controllers/${service}Controller.js`,
    code
  )

}

function createService(service) {

  const code = `
import ${service}Repository from "../repositories/${service}Repository.js"

export default async function ${service}Service(data) {

  return await ${service}Repository(data)

}
`

  fs.writeFileSync(
    `backend/services/${service}Service.js`,
    code
  )

}

function createRepository(service) {

  const code = `
export default async function ${service}Repository(data) {

  // database logic placeholder

  return { status: "ok", service: "${service}" }

}
`

  fs.writeFileSync(
    `backend/repositories/${service}Repository.js`,
    code
  )

}

function createRoute(service) {

  const code = `
import express from "express"
import { ${service}Controller } from "../controllers/${service}Controller.js"

const router = express.Router()

router.post("/", ${service}Controller)

export default router
`

  fs.writeFileSync(
    `backend/routes/${service}.js`,
    code
  )

}

function createServer(services) {

  let imports = ""
  let routes = ""

  services.forEach(service => {

    imports += `import ${service}Route from "./routes/${service}.js"\n`
    routes += `app.use("/${service}", ${service}Route)\n`

  })

  const code = `
import express from "express"

${imports}

const app = express()

app.use(express.json())

${routes}

app.listen(3000, () => {
  console.log("API running on port 3000")
})
`

  fs.writeFileSync("backend/server.js", code)

}

export default async function buildBackendCore() {

  console.log("Building backend core")

  const architecture = loadArchitecture()

  const services = extractServices(architecture)

  if (services.length === 0) {
    throw new Error("No services found in backend architecture")
  }

  for (const service of services) {

    createController(service)
    createService(service)
    createRepository(service)
    createRoute(service)

  }

  createServer(services)

  console.log(`Backend core created (${services.length} services)`)

}
