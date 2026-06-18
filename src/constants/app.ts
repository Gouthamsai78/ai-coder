/**
 * Application-wide defaults and configuration
 */
export const APP_CONFIG = {
    NAME: 'AI Coder',
    AUTHOR: 'Goutham Sai',
    CODE_HISTORY_LIMIT: 5,
    TOAST_DURATION_MS: 3000,
    COPY_FEEDBACK_DURATION_MS: 2000,
} as const;

export const DEFAULT_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Coder Preview</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 1rem;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        }
        h1 { font-size: 2.5rem; margin-bottom: 1rem; }
        p { font-size: 1.2rem; opacity: 0.9; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to AI Coder</h1>
        <p>Describe what you want to build in the chat!</p>
    </div>
</body>
</html>`;

export const DEMO_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NexusAI - AI-Powered Productivity</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #e5e5e5;
            min-height: 100vh;
        }
        nav {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 2rem;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            backdrop-filter: blur(12px);
            position: sticky;
            top: 0;
            z-index: 10;
            background: rgba(10,10,10,0.8);
        }
        .logo { font-size: 1.25rem; font-weight: 700; color: #fff; }
        .logo span { color: #6366f1; }
        nav a { color: #a3a3a3; text-decoration: none; font-size: 0.875rem; transition: color 0.2s; }
        nav a:hover { color: #fff; }
        .nav-links { display: flex; gap: 2rem; align-items: center; }
        .btn-primary {
            background: #6366f1;
            color: #fff;
            border: none;
            padding: 0.5rem 1.25rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn-primary:hover { background: #4f46e5; transform: translateY(-1px); }
        .hero {
            text-align: center;
            padding: 5rem 2rem 4rem;
            max-width: 800px;
            margin: 0 auto;
        }
        .badge {
            display: inline-block;
            background: rgba(99,102,241,0.1);
            border: 1px solid rgba(99,102,241,0.3);
            color: #818cf8;
            padding: 0.375rem 1rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
            margin-bottom: 1.5rem;
        }
        h1 { font-size: 3.5rem; font-weight: 800; line-height: 1.1; margin-bottom: 1.5rem; color: #fff; }
        h1 .gradient {
            background: linear-gradient(135deg, #6366f1, #a855f7, #ec4899);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .hero p { font-size: 1.125rem; color: #a3a3a3; max-width: 560px; margin: 0 auto 2rem; line-height: 1.7; }
        .hero-buttons { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
        .btn-secondary {
            background: rgba(255,255,255,0.05);
            color: #e5e5e5;
            border: 1px solid rgba(255,255,255,0.1);
            padding: 0.625rem 1.5rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn-secondary:hover { background: rgba(255,255,255,0.1); }
        .pricing { padding: 4rem 2rem; max-width: 1000px; margin: 0 auto; }
        .pricing h2 { text-align: center; font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; color: #fff; }
        .pricing .subtitle { text-align: center; color: #737373; margin-bottom: 3rem; }
        .plans { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
        .plan {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 1rem;
            padding: 2rem;
            transition: all 0.3s;
            position: relative;
        }
        .plan:hover { border-color: rgba(99,102,241,0.3); transform: translateY(-4px); }
        .plan.popular {
            border-color: #6366f1;
            background: rgba(99,102,241,0.05);
        }
        .popular-badge {
            position: absolute;
            top: -0.75rem;
            left: 50%;
            transform: translateX(-50%);
            background: #6366f1;
            color: #fff;
            padding: 0.25rem 1rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        .plan h3 { font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; color: #fff; }
        .plan .price { font-size: 2.5rem; font-weight: 800; color: #fff; margin-bottom: 0.25rem; }
        .plan .price span { font-size: 0.875rem; font-weight: 400; color: #737373; }
        .plan .desc { color: #737373; font-size: 0.875rem; margin-bottom: 1.5rem; }
        .plan ul { list-style: none; margin-bottom: 2rem; }
        .plan li { padding: 0.5rem 0; font-size: 0.875rem; color: #a3a3a3; display: flex; align-items: center; gap: 0.5rem; }
        .plan li::before { content: "\\2713"; color: #22c55e; font-weight: 700; }
        .plan .btn-primary { width: 100%; padding: 0.75rem; font-size: 0.875rem; }
        footer {
            text-align: center;
            padding: 3rem 2rem;
            border-top: 1px solid rgba(255,255,255,0.06);
            color: #525252;
            font-size: 0.875rem;
        }
    </style>
</head>
<body>
    <nav>
        <div class="logo">Nexus<span>AI</span></div>
        <div class="nav-links">
            <a href="#">Features</a>
            <a href="#">Pricing</a>
            <a href="#">Docs</a>
            <button class="btn-primary">Get Started</button>
        </div>
    </nav>

    <section class="hero">
        <div class="badge">New: GPT-4o integration is here</div>
        <h1>Build faster with<br><span class="gradient">AI-Powered</span> workflows</h1>
        <p>Automate repetitive tasks, generate code in seconds, and ship products 10x faster. Trusted by 2,000+ developers worldwide.</p>
        <div class="hero-buttons">
            <button class="btn-primary" style="padding: 0.75rem 2rem; font-size: 1rem;">Start Free Trial</button>
            <button class="btn-secondary">Watch Demo &rarr;</button>
        </div>
    </section>

    <section class="pricing">
        <h2>Simple, transparent pricing</h2>
        <p class="subtitle">No hidden fees. Cancel anytime.</p>
        <div class="plans">
            <div class="plan">
                <h3>Starter</h3>
                <div class="price">$0<span>/month</span></div>
                <p class="desc">Perfect for individuals and side projects</p>
                <ul>
                    <li>50 AI generations / month</li>
                    <li>3 projects</li>
                    <li>Community support</li>
                    <li>Basic models</li>
                </ul>
                <button class="btn-primary" style="background: rgba(255,255,255,0.1);">Get Started</button>
            </div>
            <div class="plan popular">
                <div class="popular-badge">Most Popular</div>
                <h3>Pro</h3>
                <div class="price">$19<span>/month</span></div>
                <p class="desc">For professional developers and small teams</p>
                <ul>
                    <li>Unlimited AI generations</li>
                    <li>Unlimited projects</li>
                    <li>Priority support</li>
                    <li>All models including GPT-4o</li>
                    <li>Custom fine-tuning</li>
                </ul>
                <button class="btn-primary">Start Free Trial</button>
            </div>
            <div class="plan">
                <h3>Enterprise</h3>
                <div class="price">Custom</div>
                <p class="desc">For organizations that need scale and security</p>
                <ul>
                    <li>Everything in Pro</li>
                    <li>SSO & SAML</li>
                    <li>Dedicated support</li>
                    <li>On-premise deployment</li>
                    <li>SLA guarantee</li>
                </ul>
                <button class="btn-primary" style="background: rgba(255,255,255,0.1);">Contact Sales</button>
            </div>
        </div>
    </section>

    <footer>Built with AI Coder &mdash; Describe it, ship it.</footer>
</body>
</html>`;
