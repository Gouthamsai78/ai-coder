/**
 * Deployment service for publishing HTML to various platforms
 */

export interface DeployResult {
    success: boolean;
    url?: string;
    previewUrl?: string;
    error?: string;
}

/**
 * Create data for CodePen form POST
 * @param code - The HTML code to deploy
 * @returns Stringified JSON for CodePen's define API
 */
export function createCodePenData(code: string): string {
    const data = {
        title: 'AI Coder Project',
        description: 'Created with AI Coder by Goutham Sai',
        html: code,
        css: '',
        js: '',
        css_external: '',
        js_external: '',
    };
    return JSON.stringify(data);
}

/**
 * Deploy code to GitHub Gist
 * @param code - The HTML code to deploy
 * @param token - GitHub Personal Access Token
 * @param filename - Name of the file (default: index.html)
 * @returns DeployResult with gist URL and preview URL
 */
export async function deployToGitHubGist(
    code: string,
    token: string,
    filename: string = 'index.html'
): Promise<DeployResult> {
    try {
        const response = await fetch('https://api.github.com/gists', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json',
            },
            body: JSON.stringify({
                description: 'Created with AI Coder by Goutham Sai',
                public: true,
                files: {
                    [filename]: { content: code }
                }
            })
        });

        if (!response.ok) {
            if (response.status === 401) {
                return { success: false, error: 'Invalid GitHub token. Please check your token in Settings.' };
            }
            if (response.status === 403) {
                return { success: false, error: 'GitHub rate limit exceeded. Please try again later.' };
            }
            return { success: false, error: `GitHub API error: ${response.status}` };
        }

        const data = await response.json();
        const gistUrl = data.html_url;
        const gistId = data.id;
        const owner = data.owner?.login;

        // Get the raw URL for the HTML file
        const rawUrl = data.files[filename]?.raw_url;

        // Create preview URL using multiple options:
        // 1. gist.githack.com - Production CDN for gists (most reliable)
        // 2. htmlpreview.github.io - Fallback option
        let previewUrl: string | undefined;

        if (owner && gistId) {
            // githack.com production CDN - most reliable for serving gist HTML
            previewUrl = `https://gistcdn.githack.com/${owner}/${gistId}/raw/${filename}`;
        } else if (rawUrl) {
            // Fallback to htmlpreview if we can't construct githack URL
            previewUrl = `https://htmlpreview.github.io/?${rawUrl}`;
        }

        return {
            success: true,
            url: gistUrl,
            previewUrl: previewUrl,
        };
    } catch (error) {
        console.error('GitHub Gist deployment error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
}

/**
 * Create StackBlitz project URL
 * @param code - The HTML code to embed
 * @returns URL to open in StackBlitz
 */
export function createStackBlitzUrl(code: string): string {
    // StackBlitz supports opening projects via URL with base64 encoded files
    // For simplicity, we'll use their project creation endpoint
    const encodedCode = encodeURIComponent(code);

    // Using StackBlitz's URL-based project creation
    // This opens a new vanilla HTML project with the code
    const baseUrl = 'https://stackblitz.com/edit/web-platform';

    // StackBlitz doesn't support inline code in URL for HTML projects directly,
    // so we'll use their API through a form POST or SDK
    return baseUrl;
}

/**
 * Open code in StackBlitz using their SDK approach (form-based)
 * Returns form data that can be posted
 */
export function createStackBlitzFormData(code: string): { project: object } {
    return {
        project: {
            files: {
                'index.html': code,
            },
            title: 'AI Coder Project',
            description: 'Created with AI Coder by Goutham Sai',
            template: 'html',
        }
    };
}
