import dotenv from 'dotenv'
dotenv.config()

const AI_PROVIDER = process.env.AI_PROVIDER || 'ollama'
const AI_API_KEY = process.env.AI_API_KEY || ''
const AI_MODEL = process.env.AI_MODEL || (AI_PROVIDER === 'ollama' ? 'llama3.2' : 'llama-3.3-70b-versatile')
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

/**
 * AI Provider Abstraction
 * Supports 'ollama' (local) and 'groq' (cloud, OpenAI-compatible)
 */

class AIProvider {
    constructor() {
        this.provider = AI_PROVIDER.toLowerCase()
        this.apiKey = AI_API_KEY
        this.model = AI_MODEL
        
        console.log(`🤖 AI Provider initialized: ${this.provider.toUpperCase()} (Model: ${this.model})`)
    }

    async generate(prompt, options = {}) {
        const {
            temperature = 0.7,
            maxTokens = 1000,
            retries = 3,
            jsonMode = false,
            timeoutMs = 120000,
        } = options

        let lastError = null

        for (let attempt = 1; attempt <= retries; attempt++) {
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), timeoutMs)

            try {
                let textResponse = ''

                if (this.provider === 'groq') {
                    // Groq API (OpenAI compatible)
                    const body = {
                        model: this.model,
                        messages: [{ role: 'user', content: prompt }],
                        temperature,
                        max_completion_tokens: maxTokens,
                    }

                    if (jsonMode) {
                        body.response_format = { type: 'json_object' }
                    }

                    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.apiKey}`
                        },
                        body: JSON.stringify(body),
                        signal: controller.signal,
                    })

                    clearTimeout(timeout)

                    if (!response.ok) {
                        const errText = await response.text()
                        throw new Error(`Groq HTTP ${response.status}: ${errText}`)
                    }

                    const data = await response.json()
                    textResponse = data.choices[0].message.content

                } else {
                    // Default to Ollama
                    const body = {
                        model: this.model,
                        prompt,
                        stream: false,
                        options: {
                            temperature,
                            num_predict: maxTokens,
                        },
                    }

                    if (jsonMode) {
                        body.format = 'json'
                    }

                    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body),
                        signal: controller.signal,
                    })

                    clearTimeout(timeout)

                    if (!response.ok) {
                        throw new Error(`Ollama HTTP ${response.status}`)
                    }

                    const data = await response.json()
                    textResponse = data.response
                }

                return textResponse

            } catch (error) {
                clearTimeout(timeout)
                lastError = error

                const isTimeout = error.name === 'AbortError'
                const label = isTimeout ? 'TIMEOUT' : error.message

                if (attempt < retries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000)
                    console.warn(`⚠️  AI attempt ${attempt}/${retries} failed (${label}). Retrying in ${delay}ms...`)
                    await sleep(delay)
                } else {
                    console.error(`❌ AI failed after ${retries} attempts: ${label}`)
                }
            }
        }

        throw lastError
    }

    async checkHealth() {
        try {
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), 5000)
            
            if (this.provider === 'groq') {
                const response = await fetch('https://api.groq.com/openai/v1/models', {
                    headers: { 'Authorization': `Bearer ${this.apiKey}` },
                    signal: controller.signal
                })
                clearTimeout(timeout)
                return response.ok
            } else {
                const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { signal: controller.signal })
                clearTimeout(timeout)
                return response.ok
            }
        } catch {
            return false
        }
    }
}

export const ai = new AIProvider()
