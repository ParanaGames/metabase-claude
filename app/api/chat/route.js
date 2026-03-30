import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const METABASE_URL = process.env.METABASE_URL
const METABASE_API_KEY = process.env.METABASE_API_KEY

async function metabaseRequest(path, method = 'GET', body = null) {
  const res = await fetch(`${METABASE_URL}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': METABASE_API_KEY
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  })
  if (!res.ok) throw new Error(`Metabase error: ${res.status} ${await res.text()}`)
  return res.json()
}

async function getDatabaseSchema(databaseId) {
  try {
    const metadata = await metabaseRequest(`/database/${databaseId}/metadata`)
    const tables = metadata.tables || []
    let schema = ''
    for (const table of tables.slice(0, 40)) {
      const cols = (table.fields || []).map(f => `  ${f.name} (${f.base_type})`).join('\n')
      schema += `Table: ${table.name}\n${cols}\n\n`
    }
    return schema
  } catch (e) {
    return 'Schema unavailable'
  }
}

async function runQuery(databaseId, sql) {
  const result = await metabaseRequest('/dataset', 'POST', {
    database: parseInt(databaseId),
    native: { query: sql },
    type: 'native'
  })
  const cols = result.data?.cols?.map(c => c.display_name || c.name) || []
  const rows = result.data?.rows || []
  return { columns: cols, rows }
}

export async function POST(request) {
  try {
    const { question, databaseId } = await request.json()

    const schema = await getDatabaseSchema(databaseId)

    const sqlResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You are a data analyst. Given this database schema, write a SQL query to answer the question.

DATABASE SCHEMA:
${schema}

QUESTION: ${question}

Rules:
- Return ONLY the SQL query, no explanation, no markdown, no backticks
- Make the query efficient and correct
- Use appropriate aggregations, filters, and sorting
- Limit results to 100 rows maximum unless the user asks for more`
      }]
    })

    const sql = sqlResponse.content[0].text.trim()
    const results = await runQuery(databaseId, sql)

    const summaryResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `The user asked: "${question}"

The query returned ${results.rows.length} rows with columns: ${results.columns.join(', ')}

Here are the first 10 rows:
${results.rows.slice(0, 10).map(r => r.join(' | ')).join('\n')}

Write a brief, clear 2-3 sentence summary of what the data shows. Be specific with numbers. No technical jargon.`
      }]
    })

    const answer = summaryResponse.content[0].text.trim()
    return Response.json({ answer, sql, results })

  } catch (error) {
    console.error(error)
    return Response.json({
      answer: `I ran into an issue: ${error.message}. Please check that your question is clear and try again.`,
      error: true
    }, { status: 200 })
  }
}
