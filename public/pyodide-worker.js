// Pyodide Web Worker — runs Python in isolation; main thread can terminate on timeout
importScripts('https://cdn.jsdelivr.net/pyodide/v0.27.5/full/pyodide.js')

let pyodide = null

async function init() {
  pyodide = await loadPyodide()
  postMessage({ type: 'ready' })
}

self.onmessage = async (e) => {
  const { type, code, id } = e.data

  if (type === 'init') {
    await init()
    return
  }

  if (type === 'run') {
    let stdout = ''
    let stderr = ''
    try {
      pyodide.setStdout({ batched: (text) => { stdout += text + '\n' } })
      pyodide.setStderr({ batched: (text) => { stderr += text + '\n' } })
      await pyodide.runPythonAsync(code)
      postMessage({ type: 'result', id, stdout, stderr, error: null })
    } catch (err) {
      postMessage({ type: 'result', id, stdout, stderr, error: err.message })
    }
  }
}
