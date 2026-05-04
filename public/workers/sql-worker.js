// public/workers/sql-worker.js
// SQL execution worker — runs sql.js in a Web Worker context.
// Each Run creates a fresh SQL.Database per test case (per spec §6.7).

importScripts('/sql.js/sql-wasm.js')

let SQL = null
let baseSetupScript = null   // cached after first hydration

self.onmessage = async ({ data }) => {
  if (!SQL) {
    SQL = await initSqlJs({ locateFile: f => `/sql.js/${f}` })
  }

  if (data.action === 'hydrate') {
    // Called once per workspace mount with the challenge's setup_script
    baseSetupScript = data.setupScript
    try {
      const db = new SQL.Database()
      db.run(baseSetupScript)
      db.close()  // we don't keep this DB; we recreate per Run for isolation
      self.postMessage({ action: 'hydrate_ok', requestId: data.requestId })
    } catch (err) {
      self.postMessage({
        action: 'hydrate_error',
        requestId: data.requestId,
        errorMessage: err.message
      })
    }
    return
  }

  if (data.action === 'run') {
    // Run user query against fresh DB (rebuilt from setup_script each time)
    const { userQuery, testCases, requestId } = data
    const results = []

    for (const tc of testCases) {
      const db = new SQL.Database()

      try {
        db.run(baseSetupScript)

        const sqlResults = db.exec(userQuery)

        const actualRows = sqlResults[0]
          ? sqlResults[0].values.map(row =>
              Object.fromEntries(
                sqlResults[0].columns.map((col, i) => [col, row[i]])
              )
            )
          : []

        const passed = compareRows(actualRows, tc.expected_rows, tc.match_mode)

        results.push({
          id: tc.id,
          label: tc.label,
          status: passed ? 'passed' : 'failed',
          hidden: tc.hidden,
          matchMode: tc.match_mode,
          // Visible SQL tests can show the user's rows and expected rows in the UI.
          // Hidden tests intentionally reveal only pass/fail.
          actual: !tc.hidden ? actualRows : undefined,
          expected: !tc.hidden ? tc.expected_rows : undefined,
        })
      } catch (err) {
        results.push({
          id: tc.id,
          label: tc.label,
          status: 'error',
          hidden: tc.hidden,
          matchMode: tc.match_mode,
          errorMessage: err.message,
        })
      } finally {
        db.close()
      }
    }

    self.postMessage({
      action: 'run_complete',
      requestId,
      results,
      testsPassed: results.filter(r => r.status === 'passed').length,
      testsTotal: results.length,
    })
  }
}

function compareRows(actual, expected, matchMode) {
  if (matchMode === 'exact') {
    return JSON.stringify(actual) === JSON.stringify(expected)
  }
  if (matchMode === 'exact_unordered') {
    if (actual.length !== expected.length) return false
    const sortKey = obj => JSON.stringify(
      Object.keys(obj).sort().reduce((acc, k) => ({ ...acc, [k]: obj[k] }), {})
    )
    const sortedActual = [...actual].map(sortKey).sort()
    const sortedExpected = [...expected].map(sortKey).sort()
    return JSON.stringify(sortedActual) === JSON.stringify(sortedExpected)
  }
  if (matchMode === 'contains') {
    const actualSet = new Set(actual.map(r => JSON.stringify(r)))
    return expected.every(e => actualSet.has(JSON.stringify(e)))
  }
  return false
}
