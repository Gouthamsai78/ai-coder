import React, { useRef, useEffect, useState } from 'react';
import './animated-shader-hero.css';

const defaultShaderSource = `#version 300 es
/*********
* made by Matthias Hurrle (@atzedent)
*
*	To explore strange new worlds, to seek out new life
*	and new civilizations, to boldly go where no man has
*	gone before.
*/
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x,R.y)
// Returns a pseudo random number for a given point (white noise)
float rnd(vec2 p) {
  p=fract(p*vec2(12.9898,78.233));
  p+=dot(p,p+34.56);
  return fract(p.x*p.y);
}
// Returns a pseudo random number for a given point (value noise)
float noise(in vec2 p) {
  vec2 i=floor(p), f=fract(p), u=f*f*(3.-2.*f);
  float
  a=rnd(i),
  b=rnd(i+vec2(1,0)),
  c=rnd(i+vec2(0,1)),
  d=rnd(i+1.);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}
// Returns a pseudo random number for a given point (fractal noise)
float fbm(vec2 p) {
  float t=.0, a=1.; mat2 m=mat2(1.,-.5,.2,1.2);
  for (int i=0; i<5; i++) {
    t+=a*noise(p);
    p*=2.*m;
    a*=.5;
  }
  return t;
}
float clouds(vec2 p) {
	float d=1., t=.0;
	for (float i=.0; i<3.; i++) {
		float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p);
		t=mix(t,d,a);
		d=a;
		p*=2./(i+1.);
	}
	return t;
}
void main(void) {
	vec2 uv=(FC-.5*R)/MN,st=uv*vec2(2,1);
	vec3 col=vec3(0);
	float bg=clouds(vec2(st.x+T*.5,-st.y));
	uv*=1.-.3*(sin(T*.2)*.5+.5);
	for (float i=1.; i<12.; i++) {
		uv+=.1*cos(i*vec2(.1+.01*i, .8)+i*i+T*.5+.1*uv.x);
		vec2 p=uv;
		float d=length(p);
		col+=.00125/d*(cos(sin(i)*vec3(1,2,3))+1.);
		float b=noise(i+p+bg*1.731);
		col+=.002*b/length(max(p,vec2(b*p.x*.02,p.y)));
		col=mix(col,vec3(bg*.25,bg*.137,bg*.05),d);
	}
	O=vec4(col,1);
}`;

// Types for component props
interface HeroProps {
    trustBadge?: {
        text: string;
        icons?: React.ReactNode[];
    };
    headline: {
        line1: string;
        line2: string;
    };
    subtitle: string;
    buttons?: {
        primary?: {
            text: string;
            onClick?: () => void;
        };
        secondary?: {
            text: string;
            onClick?: () => void;
        };
    };
    className?: string;
}

// WebGL Renderer class
class WebGLRenderer {
    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;
    program: WebGLProgram | null = null;
    vs: WebGLShader | null = null;
    fs: WebGLShader | null = null;
    buffer: WebGLBuffer | null = null;
    scale: number;
    shaderSource: string;
    mouseMove = [0, 0];
    mouseCoords = [0, 0];
    pointerCoords = [0, 0];
    nbrOfPointers = 0;

    vertexSrc = `#version 300 es
                  precision highp float;
                  in vec4 position;
                  void main(){gl_Position=position;}`;

    vertices = [-1, 1, -1, -1, 1, 1, 1, -1];

    constructor(canvas: HTMLCanvasElement, scale: number) {
        this.canvas = canvas;
        this.scale = scale;
        this.gl = canvas.getContext('webgl2')!;
        this.gl.viewport(0, 0, canvas.width * scale, canvas.height * scale);
        // Ensure defaultShaderSource is available in this scope or imported
        this.shaderSource = defaultShaderSource;
    }

    updateShader(source: string) {
        this.reset();
        this.shaderSource = source;
        this.setup();
        this.init();
    }

    updateMove(deltas: number[]) {
        this.mouseMove = deltas;
    }

    updateMouse(coords: number[]) {
        this.mouseCoords = coords;
    }

    updatePointerCoords(coords: number[]) {
        this.pointerCoords = coords;
    }

    updatePointerCount(nbr: number) {
        this.nbrOfPointers = nbr;
    }

    updateScale(scale: number) {
        this.scale = scale;
        this.gl.viewport(0, 0, this.canvas.width * scale, this.canvas.height * scale);
    }

    compile(shader: WebGLShader, source: string) {
        const gl = this.gl;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const error = gl.getShaderInfoLog(shader);
            console.error('Shader compilation error:', error);
        }
    }

    test(source: string) {
        let result = null;
        const gl = this.gl;
        const shader = gl.createShader(gl.FRAGMENT_SHADER)!;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            result = gl.getShaderInfoLog(shader);
        }
        gl.deleteShader(shader);
        return result;
    }

    reset() {
        const gl = this.gl;
        if (this.program && !gl.getProgramParameter(this.program, gl.DELETE_STATUS)) {
            if (this.vs) {
                gl.detachShader(this.program, this.vs);
                gl.deleteShader(this.vs);
            }
            if (this.fs) {
                gl.detachShader(this.program, this.fs);
                gl.deleteShader(this.fs);
            }
            gl.deleteProgram(this.program);
        }
    }

    setup() {
        const gl = this.gl;
        this.vs = gl.createShader(gl.VERTEX_SHADER)!;
        this.fs = gl.createShader(gl.FRAGMENT_SHADER)!;
        this.compile(this.vs, this.vertexSrc);
        this.compile(this.fs, this.shaderSource);
        this.program = gl.createProgram()!;
        gl.attachShader(this.program, this.vs);
        gl.attachShader(this.program, this.fs);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(this.program));
        }
    }

    init() {
        const gl = this.gl;
        const program = this.program!;

        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

        const position = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

        (program as any).resolution = gl.getUniformLocation(program, 'resolution');
        (program as any).time = gl.getUniformLocation(program, 'time');
        (program as any).move = gl.getUniformLocation(program, 'move');
        (program as any).touch = gl.getUniformLocation(program, 'touch');
        (program as any).pointerCount = gl.getUniformLocation(program, 'pointerCount');
        (program as any).pointers = gl.getUniformLocation(program, 'pointers');
    }

    render(now = 0) {
        const gl = this.gl;
        const program = this.program;

        if (!program || gl.getProgramParameter(program, gl.DELETE_STATUS)) return;

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);

        gl.uniform2f((program as any).resolution, this.canvas.width, this.canvas.height);
        gl.uniform1f((program as any).time, now * 1e-3);
        gl.uniform2f((program as any).move, ...(this.mouseMove as [number, number]));
        gl.uniform2f((program as any).touch, ...(this.mouseCoords as [number, number]));
        gl.uniform1i((program as any).pointerCount, this.nbrOfPointers);
        gl.uniform2fv((program as any).pointers, this.pointerCoords);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}

// Pointer Handler class
class PointerHandler {
    scale: number;
    active = false;
    pointers = new Map<number, number[]>();
    lastCoords = [0, 0];
    moves = [0, 0];

    constructor(element: HTMLCanvasElement, scale: number) {
        this.scale = scale;

        const map = (element: HTMLCanvasElement, scale: number, x: number, y: number) =>
            [x * scale, element.height - y * scale];

        element.addEventListener('pointerdown', (e: PointerEvent) => {
            this.active = true;
            this.pointers.set(e.pointerId, map(element, this.getScale(), e.clientX, e.clientY));
        });

        element.addEventListener('pointerup', (e: PointerEvent) => {
            if (this.count === 1) {
                this.lastCoords = this.first;
            }
            this.pointers.delete(e.pointerId);
            this.active = this.pointers.size > 0;
        });

        element.addEventListener('pointerleave', (e: PointerEvent) => {
            if (this.count === 1) {
                this.lastCoords = this.first;
            }
            this.pointers.delete(e.pointerId);
            this.active = this.pointers.size > 0;
        });

        element.addEventListener('pointermove', (e: PointerEvent) => {
            if (!this.active) return;
            this.lastCoords = [e.clientX, e.clientY];
            this.pointers.set(e.pointerId, map(element, this.getScale(), e.clientX, e.clientY));
            this.moves = [this.moves[0] + e.movementX, this.moves[1] + e.movementY];
        });
    }

    getScale() {
        return this.scale;
    }

    updateScale(scale: number) {
        this.scale = scale;
    }

    get count() {
        return this.pointers.size;
    }

    get move() {
        return this.moves;
    }

    get coords() {
        return this.pointers.size > 0
            ? Array.from(this.pointers.values()).flat()
            : [0, 0];
    }

    get first() {
        return this.pointers.values().next().value || this.lastCoords;
    }
}

const useShaderBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>(0);
    const rendererRef = useRef<WebGLRenderer | null>(null);
    const pointersRef = useRef<PointerHandler | null>(null);



    const resize = () => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const dpr = Math.max(1, 0.5 * window.devicePixelRatio);

        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;

        if (rendererRef.current) {
            rendererRef.current.updateScale(dpr);
        }
    };

    const loop = (now: number) => {
        if (!rendererRef.current || !pointersRef.current) return;

        rendererRef.current.updateMouse(pointersRef.current.first);
        rendererRef.current.updatePointerCount(pointersRef.current.count);
        rendererRef.current.updatePointerCoords(pointersRef.current.coords);
        rendererRef.current.updateMove(pointersRef.current.move);
        rendererRef.current.render(now);
        animationFrameRef.current = requestAnimationFrame(loop);
    };

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const dpr = Math.max(1, 0.5 * window.devicePixelRatio);

        rendererRef.current = new WebGLRenderer(canvas, dpr);
        pointersRef.current = new PointerHandler(canvas, dpr);

        rendererRef.current.setup();
        rendererRef.current.init();

        resize();

        if (rendererRef.current.test(defaultShaderSource) === null) {
            rendererRef.current.updateShader(defaultShaderSource);
        }

        loop(0);

        window.addEventListener('resize', resize);

        return () => {
            window.removeEventListener('resize', resize);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (rendererRef.current) {
                rendererRef.current.reset();
            }
        };
    }, []);

    return canvasRef;
};

// Enhanced Helper Components
const MagneticButton: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = "", onClick }) => {
    const btnRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!btnRef.current) return;
        const rect = btnRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        setPosition({ x: x * 0.2, y: y * 0.2 });
    };

    const handleMouseLeave = () => {
        setPosition({ x: 0, y: 0 });
    };

    return (
        <button
            ref={btnRef}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            className={`transition-transform duration-200 ease-out ${className}`}
        >
            {children}
        </button>
    );
};

const ScrambleText: React.FC<{ text: string; className?: string; delay?: number }> = ({ text, className = "", delay = 0 }) => {
    const [displayText, setDisplayText] = useState(text);
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";

    useEffect(() => {
        let iteration = 0;
        let interval: any = null;

        const startScramble = () => {
            interval = setInterval(() => {
                setDisplayText(
                    text.split("")
                        .map((_, index) => {
                            if (index < iteration) return text[index];
                            return chars[Math.floor(Math.random() * chars.length)];
                        })
                        .join("")
                );

                if (iteration >= text.length) {
                    clearInterval(interval);
                }

                iteration += 1 / 3;
            }, 30);
        };

        const timeout = setTimeout(startScramble, delay);

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, [text, delay]);

    return <span className={className}>{displayText}</span>;
};

// Reusable Hero Component
const Hero: React.FC<HeroProps> = ({
    trustBadge,
    headline,
    subtitle,
    buttons,
    className = ""
}) => {
    const canvasRef = useShaderBackground();

    return (
        <div className={`relative w-full h-screen overflow-hidden bg-black ${className}`}>


            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-contain touch-none opacity-80"
            />

            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white">
                {trustBadge && (
                    <div className="mb-4 sm:mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-[10px] sm:text-xs font-medium hover:bg-white/10 transition-colors">
                            {trustBadge.icons && (
                                <div className="flex -space-x-1">
                                    {trustBadge.icons.map((icon, index) => (
                                        <span key={index}>{icon}</span>
                                    ))}
                                </div>
                            )}
                            <span className="text-gray-300">{trustBadge.text}</span>
                        </div>
                    </div>
                )}

                <div className="text-center space-y-4 sm:space-y-8 max-w-5xl mx-auto px-4">
                    <div className="space-y-2 sm:space-y-4">
                        <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
                            <div className="inline-block bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 pb-1 sm:pb-2">
                                <ScrambleText text={headline.line1} delay={200} />
                            </div>
                            <br />
                            <div className="inline-block bg-clip-text text-transparent bg-gradient-to-br from-indigo-300 via-white/90 to-rose-300 pb-2 sm:pb-4">
                                <ScrambleText text={headline.line2} delay={1000} />
                            </div>
                        </h1>
                    </div>

                    <div className="max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '1.5s' }}>
                        <p className="text-sm sm:text-lg md:text-xl text-gray-400 font-light leading-relaxed px-2">
                            {subtitle}
                        </p>
                    </div>

                    {buttons && (
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mt-8 sm:mt-12 animate-fade-in-up px-4" style={{ animationDelay: '1.8s' }}>
                            {buttons.primary && (
                                <MagneticButton
                                    onClick={buttons.primary.onClick}
                                    className="group relative inline-flex h-12 sm:h-12 w-full sm:w-auto overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
                                >
                                    <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                                    <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-6 sm:px-8 py-1 text-sm font-medium text-white backdrop-blur-3xl transition-colors hover:bg-slate-950/80">
                                        {buttons.primary.text}
                                    </span>
                                </MagneticButton>
                            )}
                            {buttons.secondary && (
                                <MagneticButton
                                    onClick={buttons.secondary.onClick}
                                    className="px-6 sm:px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full font-medium text-sm transition-all duration-300 backdrop-blur-sm w-full sm:w-auto"
                                >
                                    {buttons.secondary.text}
                                </MagneticButton>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Hero;
