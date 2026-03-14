import fs from "fs"
import path from "path"

const ARCH_PATH = "docs/reference/backend-architecture.md"

function loadArchitecture() {

  if (!fs.existsSync(ARCH_PATH)) {
    throw new Error("backend-architecture.md missing")
  }

  return fs.readFileSync(ARCH_PATH, "utf8")

}

function parseEntities(text) {

  const entities = []
  const lines = text.split("\n")

  let current = null

  for (const line of lines) {

    if (line.startsWith("Entity:")) {

      if (current) entities.push(current)

      current = {
        name: line.replace("Entity:", "").trim(),
        fields: []
      }

    }

    if (line.trim().startsWith("-")) {

      const field = line.replace("-", "").trim()
      const parts = field.split(" ")

      current.fields.push({
        name: parts[0],
        type: parts[1] || "TEXT"
      })

    }

  }

  if (current) entities.push(current)

  return entities

}

function generateSQL(entities) {

  let sql = ""

  for (const entity of entities) {

    sql += `CREATE TABLE ${entity.name} (\n`
    sql += `  id SERIAL PRIMARY KEY,\n`

    const fields = entity.fields.map(
      f => `  ${f.name} ${f.type}`
    )

    sql += fields.join(",\n")

    sql += `,\n  created_at TIMESTAMP\n`

    sql += ");\n\n"

  }

  return sql

}

function writeSchema(sql) {

  fs.writeFileSync("database/schema.sql", sql)

}

function writeMigration(sql) {

  const file = "database/migrations/001_initial_schema.sql"

  fs.writeFileSync(file, sql)

}

function generateModels(entities) {

  fs.mkdirSync("backend/models", { recursive: true })

  for (const entity of entities) {

    const model = `
class ${entity.name} {

  constructor(data) {
    Object.assign(this, data)
  }

}

export default ${entity.name}
`

    fs.writeFileSync(
      `backend/models/${entity.name}.js`,
      model
    )

  }

}

function writeBuildLog(count) {

  const log = `
# Database Build Log

Tables Generated: ${count}

Build Time:
${new Date().toISOString()}
`

  fs.writeFileSync(
    "docs/reference/database-build-log.md",
    log
  )

}

export default async function buildDatabase() {

  console.log("Building database layer")

  const architecture = loadArchitecture()

  const entities = parseEntities(architecture)

  if (entities.length === 0) {
    throw new Error("No entities detected in backend architecture")
  }

  const sql = generateSQL(entities)

  writeSchema(sql)

  writeMigration(sql)

  generateModels(entities)

  writeBuildLog(entities.length)

  console.log(`Database build complete (${entities.length} tables)`)

}
