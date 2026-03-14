import fs from "fs"

const GRAPH_PATH = "docs/reference/dependency-graph.json"

function loadGraph() {

  if (!fs.existsSync(GRAPH_PATH)) {
    throw new Error("Dependency graph not found")
  }

  return JSON.parse(
    fs.readFileSync(GRAPH_PATH, "utf8")
  )

}

function getRunnableTasks(tasks, completed) {

  return tasks.filter(task => {

    if (completed.has(task.id)) return false

    return task.depends.every(dep => completed.has(dep))

  })

}

export default function taskScheduler(taskRegistry) {

  const graph = loadGraph()

  const completed = new Set()

  async function runTask(taskId) {

    if (!taskRegistry[taskId]) {
      throw new Error(`Task handler missing: ${taskId}`)
    }

    console.log(`Running task: ${taskId}`)

    await taskRegistry[taskId]()

    completed.add(taskId)

    console.log(`Completed: ${taskId}`)

  }

  async function run() {

    const tasks = graph.tasks

    while (completed.size < tasks.length) {

      const runnable = getRunnableTasks(tasks, completed)

      if (runnable.length === 0) {
        throw new Error("Deadlock detected in dependency graph")
      }

      await Promise.all(
        runnable.map(task => runTask(task.id))
      )

    }

    console.log("All tasks completed")

  }

  return { run }

}
