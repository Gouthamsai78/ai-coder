/**
 * Tavily Web Search Service
 *
 * Provides real-time web search context for AI code generation.
 * Only triggers when the prompt genuinely needs current web data.
 */

const TAVILY_API_KEY = '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';
const TAVILY_ENDPOINT = 'https://api.tavily.com/search';

export interface SearchResult {
    title: string;
    url: string;
    content: string;
    score: number;
}

/**
 * Strict detection: only search when the prompt genuinely needs web data.
 * Simple UI/styling/layout changes should NEVER trigger a search.
 */
export function shouldSearch(prompt: string): boolean {
    const lower = prompt.toLowerCase().trim();

    // Skip very short prompts — these are always simple tweaks
    if (lower.length < 20) return false;

    // Skip ONLY if the prompt is purely about simple CSS/styling adjustments
    // These are the ONLY things we skip — everything else gets searched
    const pureCssChange = /^(make|change|set|move|adjust|increase|decrease|reduce)\s+(the\s+)?(font|text|background|bg|border|margin|padding|color|size|width|height|gap|spacing|opacity|shadow|radius|weight)/i.test(lower);
    if (pureCssChange) return false;

    const trivialTweaks = /^(bigger|smaller|wider|taller|shorter|thinner|bolder|lighter|darker|brighter|center it|align it|hide it|show it)/i.test(lower);
    if (trivialTweaks) return false;

    // Everything else → search the web for context
    return true;
}

export interface SearchWebResult {
    context: string;           // Formatted text for AI prompt injection
    query: string;             // What was searched
    results: {                 // Structured results for UI display
        title: string;
        url: string;
        snippet: string;
    }[];
}

/**
 * Run a Tavily web search. Returns structured results + context, or null on failure.
 */
export async function searchWeb(query: string): Promise<SearchWebResult | null> {
    try {
        const response = await fetch(TAVILY_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: TAVILY_API_KEY,
                query: `${query} (code examples, documentation)`,
                search_depth: 'basic',
                max_results: 5,
                include_answer: true,
                include_raw_content: false,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.warn('[WebSearch] Failed:', response.status, errorText);
            return null;
        }

        const data = await response.json();
        const rawResults: SearchResult[] = data.results || [];
        const answer: string = data.answer || '';

        if (!rawResults.length && !answer) {
            console.log('[WebSearch] No results found');
            return null;
        }

        // Build context for AI injection
        let context = '\n\n--- WEB SEARCH RESULTS ---\n';
        if (answer) {
            context += `\nSummary: ${answer}\n`;
        }
        rawResults.forEach((r, i) => {
            const snippet = r.content.length > 500 ? r.content.slice(0, 500) + '...' : r.content;
            context += `\n[${i + 1}] ${r.title}\nSource: ${r.url}\n${snippet}\n`;
        });
        context += '\n--- END WEB SEARCH RESULTS ---\n';

        // Build structured results for UI
        const uiResults = rawResults.map(r => ({
            title: r.title,
            url: r.url,
            snippet: r.content.length > 150 ? r.content.slice(0, 150) + '...' : r.content,
        }));

        console.log(`[WebSearch] ✅ ${rawResults.length} results for: "${query.slice(0, 60)}"`);

        return { context, query, results: uiResults };

    } catch (err) {
        console.warn('[WebSearch] Error:', err);
        return null;
    }
}
