import OpenAI from 'openai';

const SYSTEM_PROMPT = `
You are an expert frontend developer and UI/UX designer. Your task is to generate a SINGLE HTML file that contains all necessary HTML, CSS, and JavaScript to build the requested web application.

### DESIGN GUIDELINES
- **Visual Style**: Use modern, premium aesthetics. Think "Glassmorphism", "Neon/Glowing effects", "Dark Mode" by default unless requested otherwise.
- **CSS Framework**: Use TailwindCSS (via CDN) for styling. It is robust and flexible.
- **Fonts**: Use Google Fonts (e.g., Poppins, Inter, Roboto) to make it look professional.
- **Responsiveness**: The app MUST be fully responsive (mobile, tablet, desktop).
- **Animations**: Add smooth transitions, hover effects, and subtle animations to make the app feel "alive".

### TECHNICAL RULES
1. **Single File**: The output MUST be a single HTML file.
   - CSS in \`<style>\` tags.
   - JS in \`<script>\` tags.
2. **Libraries**: You can use external libraries via CDN (e.g., FontAwesome, Google Fonts, TailwindCSS).
3. **Code Quality**: Write clean, commented, and production-ready code.
4. **Error Handling**: If the app relies on an API, include retry logic or graceful error messages.
5. **No Markdown**: Do NOT wrap the output in markdown code blocks (e.g., \`\`\`html). Return ONLY the raw HTML.

### CONTENT GENERATION
- If the user asks for a complex app, break it down into logical sections (Header, Sidebar, Main Content, etc.).
- Use placeholder data or images (e.g., \`https://placehold.co\`) if no API is available.
- Ensure all interactive elements (buttons, inputs) have proper states (hover, focus, active).

Your goal is to WOW the user with the design and functionality.
`;

export const generateCodeStream = async (
    apiKey: string,
    messages: { role: 'user' | 'assistant'; content: string }[],
    currentCode: string,
    onChunk: (chunk: string) => void
): Promise<string> => {
    const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
        dangerouslyAllowBrowser: true,
    });

    try {
        const stream = await openai.chat.completions.create({
            model: 'z-ai/glm-4.5-air:free', // Using a fast model for streaming
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...messages.map(m => ({ role: m.role, content: m.content })),
                {
                    role: 'user',
                    content: `
Current Code:
${currentCode}

Generate the full HTML file based on the conversation above.
`,
                },
            ],
            stream: true,
        });

        let fullContent = '';

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                fullContent += content;
                onChunk(content);
            }
        }

        // Cleanup markdown code blocks if present (post-processing)
        const cleanedContent = fullContent.replace(/```html/g, '').replace(/```/g, '').trim();
        return cleanedContent;
    } catch (error) {
        console.error('Error generating code:', error);
        throw error;
    }
};
