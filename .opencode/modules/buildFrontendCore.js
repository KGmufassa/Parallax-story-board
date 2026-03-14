import fs from "fs"

const FRONTEND_ARCH_PATH = "docs/reference/frontend-architecture.md"

function loadArchitecture() {

  if (!fs.existsSync(FRONTEND_ARCH_PATH)) {
    throw new Error("frontend-architecture.md missing")
  }

  return fs.readFileSync(FRONTEND_ARCH_PATH, "utf8")

}

function extractRoutes(text) {

  const routes = []
  const lines = text.split("\n")

  for (const line of lines) {

    if (line.startsWith("Route:")) {

      const route = line.replace("Route:", "").trim()

      routes.push(route)

    }

  }

  return routes

}

function routeToFile(route) {

  if (route === "/") return "index"

  return route.replace("/", "")

}

function createPage(route) {

  const name = routeToFile(route)

  const code = `
export default function ${name}Page() {

  return (
    <div>
      <h1>${name} page</h1>
    </div>
  )

}
`

  fs.writeFileSync(
    `frontend/pages/${name}.jsx`,
    code
  )

}

function createLayout() {

  const code = `
export default function MainLayout({ children }) {

  return (
    <div>

      <header>
        <h2>App</h2>
      </header>

      <main>
        {children}
      </main>

    </div>
  )

}
`

  fs.writeFileSync(
    "frontend/layouts/MainLayout.jsx",
    code
  )

}

function createComponent() {

  const code = `
export default function Button({ label, onClick }) {

  return (
    <button onClick={onClick}>
      {label}
    </button>
  )

}
`

  fs.writeFileSync(
    "frontend/components/Button.jsx",
    code
  )

}

function createHook() {

  const code = `
import { useState } from "react"

export default function useFetch(url) {

  const [data, setData] = useState(null)

  async function fetchData() {

    const res = await fetch(url)

    const json = await res.json()

    setData(json)

  }

  return { data, fetchData }

}
`

  fs.writeFileSync(
    "frontend/hooks/useFetch.js",
    code
  )

}

function createApp(routes) {

  let imports = ""
  let routeMap = ""

  routes.forEach(route => {

    const name = routeToFile(route)

    imports += `import ${name}Page from "./pages/${name}.jsx"\n`

    routeMap += `
if (path === "${route}") return <${name}Page />
`

  })

  const code = `
import React from "react"
${imports}

export default function App() {

  const path = window.location.pathname

  ${routeMap}

  return <div>404</div>

}
`

  fs.writeFileSync(
    "frontend/app.js",
    code
  )

}

export default async function buildFrontendCore() {

  console.log("Building frontend core")

  const architecture = loadArchitecture()

  const routes = extractRoutes(architecture)

  if (routes.length === 0) {
    throw new Error("No routes found in frontend architecture")
  }

  for (const route of routes) {

    createPage(route)

  }

  createLayout()

  createComponent()

  createHook()

  createApp(routes)

  console.log(`Frontend core created (${routes.length} pages)`)

}
