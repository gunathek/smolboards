"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import * as THREE from "three"

type Uniforms = {
  [key: string]: {
    value: number[] | number[][] | number
    type: string
  }
}

interface ShaderProps {
  source: string
  uniforms: {
    [key: string]: {
      value: number[] | number[][] | number
      type: string
    }
  }
  maxFps?: number
}

interface SignInPageProps {
  className?: string
}

export const CanvasRevealEffect = ({
  animationSpeed = 10,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[0, 255, 255]],
  containerClassName,
  dotSize,
  showGradient = true,
  reverse = false,
}: {
  animationSpeed?: number
  opacities?: number[]
  colors?: number[][]
  containerClassName?: string
  dotSize?: number
  showGradient?: boolean
  reverse?: boolean
}) => {
  return (
    <div className={cn("h-full relative w-full", containerClassName)}>
      <div className="h-full w-full">
        <DotMatrix
          colors={colors ?? [[0, 255, 255]]}
          dotSize={dotSize ?? 3}
          opacities={opacities ?? [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1]}
          shader={`
            ${reverse ? "u_reverse_active" : "false"}_;
            animation_speed_factor_${animationSpeed.toFixed(1)}_;
          `}
          center={["x", "y"]}
        />
      </div>
      {showGradient && <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />}
    </div>
  )
}

interface DotMatrixProps {
  colors?: number[][]
  opacities?: number[]
  totalSize?: number
  dotSize?: number
  shader?: string
  center?: ("x" | "y")[]
}

const DotMatrix: React.FC<DotMatrixProps> = ({
  colors = [[0, 0, 0]],
  opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14],
  totalSize = 20,
  dotSize = 2,
  shader = "",
  center = ["x", "y"],
}) => {
  const uniforms = React.useMemo(() => {
    let colorsArray = [colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]]
    if (colors.length === 2) {
      colorsArray = [colors[0], colors[0], colors[0], colors[1], colors[1], colors[1]]
    } else if (colors.length === 3) {
      colorsArray = [colors[0], colors[0], colors[1], colors[1], colors[2], colors[2]]
    }
    return {
      u_colors: {
        value: colorsArray.map((color) => [color[0] / 255, color[1] / 255, color[2] / 255]),
        type: "uniform3fv",
      },
      u_opacities: {
        value: opacities,
        type: "uniform1fv",
      },
      u_total_size: {
        value: totalSize,
        type: "uniform1f",
      },
      u_dot_size: {
        value: dotSize,
        type: "uniform1f",
      },
      u_reverse: {
        value: shader.includes("u_reverse_active") ? 1 : 0,
        type: "uniform1i",
      },
    }
  }, [colors, opacities, totalSize, dotSize, shader])

  return (
    <Shader
      source={`
        precision mediump float;
        in vec2 fragCoord;

        uniform float u_time;
        uniform float u_opacities[10];
        uniform vec3 u_colors[6];
        uniform float u_total_size;
        uniform float u_dot_size;
        uniform vec2 u_resolution;
        uniform int u_reverse;

        out vec4 fragColor;

        float PHI = 1.61803398874989484820459;
        float random(vec2 xy) {
            return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
        }
        float map(float value, float min1, float max1, float min2, float max2) {
            return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
        }

        void main() {
            vec2 st = fragCoord.xy;
            ${center.includes("x") ? "st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));" : ""}
            ${center.includes("y") ? "st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));" : ""}

            float opacity = step(0.0, st.x);
            opacity *= step(0.0, st.y);

            vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

            float frequency = 5.0;
            float show_offset = random(st2);
            float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
            opacity *= u_opacities[int(rand * 10.0)];
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

            vec3 color = u_colors[int(show_offset * 6.0)];

            float animation_speed_factor = 0.5;
            vec2 center_grid = u_resolution / 2.0 / u_total_size;
            float dist_from_center = distance(center_grid, st2);

            float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);
            float max_grid_dist = distance(center_grid, vec2(0.0, 0.0));
            float timing_offset_outro = (max_grid_dist - dist_from_center) * 0.02 + (random(st2 + 42.0) * 0.2);

            float current_timing_offset;
            if (u_reverse == 1) {
                current_timing_offset = timing_offset_outro;
                opacity *= 1.0 - step(current_timing_offset, u_time * animation_speed_factor);
                opacity *= clamp((step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
            } else {
                current_timing_offset = timing_offset_intro;
                opacity *= step(current_timing_offset, u_time * animation_speed_factor);
                opacity *= clamp((1.0 - step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
            }

            fragColor = vec4(color, opacity);
            fragColor.rgb *= fragColor.a;
        }`}
      uniforms={uniforms}
      maxFps={60}
    />
  )
}

const ShaderMaterial = ({
  source,
  uniforms,
  maxFps = 60,
}: {
  source: string
  hovered?: boolean
  maxFps?: number
  uniforms: Uniforms
}) => {
  const { size } = useThree()
  const ref = useRef<THREE.Mesh>(null)
  let lastFrameTime = 0

  useFrame(({ clock }) => {
    if (!ref.current) return
    const timestamp = clock.getElapsedTime()

    lastFrameTime = timestamp

    const material: any = ref.current.material
    const timeLocation = material.uniforms.u_time
    timeLocation.value = timestamp
  })

  const getUniforms = () => {
    const preparedUniforms: any = {}

    for (const uniformName in uniforms) {
      const uniform: any = uniforms[uniformName]

      switch (uniform.type) {
        case "uniform1f":
          preparedUniforms[uniformName] = { value: uniform.value, type: "1f" }
          break
        case "uniform1i":
          preparedUniforms[uniformName] = { value: uniform.value, type: "1i" }
          break
        case "uniform3f":
          preparedUniforms[uniformName] = {
            value: new THREE.Vector3().fromArray(uniform.value),
            type: "3f",
          }
          break
        case "uniform1fv":
          preparedUniforms[uniformName] = { value: uniform.value, type: "1fv" }
          break
        case "uniform3fv":
          preparedUniforms[uniformName] = {
            value: uniform.value.map((v: number[]) => new THREE.Vector3().fromArray(v)),
            type: "3fv",
          }
          break
        case "uniform2f":
          preparedUniforms[uniformName] = {
            value: new THREE.Vector2().fromArray(uniform.value),
            type: "2f",
          }
          break
        default:
          console.error(`Invalid uniform type for '${uniformName}'.`)
          break
      }
    }

    preparedUniforms["u_time"] = { value: 0, type: "1f" }
    preparedUniforms["u_resolution"] = {
      value: new THREE.Vector2(size.width * 2, size.height * 2),
    }
    return preparedUniforms
  }

  const material = React.useMemo(() => {
    const materialObject = new THREE.ShaderMaterial({
      vertexShader: `
      precision mediump float;
      in vec2 coordinates;
      uniform vec2 u_resolution;
      out vec2 fragCoord;
      void main(){
        float x = position.x;
        float y = position.y;
        gl_Position = vec4(x, y, 0.0, 1.0);
        fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
        fragCoord.y = u_resolution.y - fragCoord.y;
      }
      `,
      fragmentShader: source,
      uniforms: getUniforms(),
      glslVersion: THREE.GLSL3,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneFactor,
    })

    return materialObject
  }, [size.width, size.height, source])

  return (
    <mesh ref={ref as any}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

const Shader: React.FC<ShaderProps> = ({ source, uniforms, maxFps = 60 }) => {
  return (
    <Canvas className="absolute inset-0 h-full w-full">
      <ShaderMaterial source={source} uniforms={uniforms} maxFps={maxFps} />
    </Canvas>
  )
}

export const SignInPage = ({ className }: SignInPageProps) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [step, setStep] = useState<"choice" | "signup" | "login" | "success">("choice")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [initialCanvasVisible, setInitialCanvasVisible] = useState(true)
  const [reverseCanvasVisible, setReverseCanvasVisible] = useState(false)
  const router = useRouter()

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) return

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        router.push("/dashboard")
      }
    }

    checkAuth()
  }, [router])

  const handleGoogleSignIn = async () => {
    if (!supabase) {
      setError("Authentication service not available")
      return
    }

    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const checkEmailExists = async (email: string) => {
    if (!supabase) return false

    try {
      // Try to sign in with a dummy password to check if email exists
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: "dummy-password-check",
      })

      // If error is "Invalid login credentials", email doesn't exist
      // If error is something else, email might exist
      return error?.message !== "Invalid login credentials"
    } catch {
      return false
    }
  }

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) {
      setError("Authentication service not available")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Check if email already exists
      const emailExists = await checkEmailExists(email)
      if (emailExists) {
        setError("An account with this email already exists. Please try logging in instead.")
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        setError(error.message)
      } else {
        // Start success animation
        setReverseCanvasVisible(true)
        setTimeout(() => {
          setInitialCanvasVisible(false)
        }, 50)

        setTimeout(() => {
          setStep("success")
        }, 2000)
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) {
      setError("Authentication service not available")
      return
    }

    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        // Start success animation
        setReverseCanvasVisible(true)
        setTimeout(() => {
          setInitialCanvasVisible(false)
        }, 50)

        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleBackClick = () => {
    setStep("choice")
    setError("")
    setEmail("")
    setPassword("")
    setFullName("")
    setReverseCanvasVisible(false)
    setInitialCanvasVisible(true)
  }

  return (
    <div className={cn("flex w-[100%] flex-col min-h-screen bg-black relative", className)}>
      <div className="absolute inset-0 z-0">
        {initialCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={3}
              containerClassName="bg-black"
              colors={[
                [255, 255, 255],
                [255, 255, 255],
              ]}
              dotSize={6}
              reverse={false}
            />
          </div>
        )}

        {reverseCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={4}
              containerClassName="bg-black"
              colors={[
                [255, 255, 255],
                [255, 255, 255],
              ]}
              dotSize={6}
              reverse={true}
            />
          </div>
        )}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,1)_0%,_transparent_100%)]" />
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-black to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        <div className="flex flex-1 flex-col lg:flex-row">
          <div className="flex-1 flex flex-col justify-center items-center px-4">
            <div className="w-full max-w-sm">
              <AnimatePresence mode="wait">
                {step === "choice" ? (
                  <motion.div
                    key="choice-step"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="space-y-6 text-center"
                  >
                    <div className="space-y-1">
                      <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">
                        Welcome to Smolboards
                      </h1>
                      <p className="text-[1.25rem] text-white/70 font-light">Get started with your account</p>
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <p className="text-red-400 text-sm">{error}</p>
                      </div>
                    )}

                    <div className="space-y-4">
                      <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="backdrop-blur-[2px] w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full py-3 px-4 transition-colors disabled:opacity-50"
                      >
                        <span className="text-lg">G</span>
                        <span>{loading ? "Signing in..." : "Continue with Google"}</span>
                      </button>

                      <div className="flex items-center gap-4">
                        <div className="h-px bg-white/10 flex-1" />
                        <span className="text-white/40 text-sm">or</span>
                        <div className="h-px bg-white/10 flex-1" />
                      </div>

                      <div className="space-y-3">
                        <button
                          onClick={() => setStep("signup")}
                          className="w-full backdrop-blur-[1px] text-white border border-white/10 rounded-full py-3 px-4 hover:border-white/30 transition-colors"
                        >
                          Create new account
                        </button>

                        <button
                          onClick={() => setStep("login")}
                          className="w-full backdrop-blur-[1px] text-white/70 border border-white/5 rounded-full py-3 px-4 hover:text-white hover:border-white/20 transition-colors"
                        >
                          Sign in to existing account
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-white/40 pt-10">
                      By continuing, you agree to our{" "}
                      <Link
                        href="/terms-and-conditions"
                        className="underline text-white/40 hover:text-white/60 transition-colors"
                      >
                        Terms
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy-policy"
                        className="underline text-white/40 hover:text-white/60 transition-colors"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </motion.div>
                ) : step === "signup" ? (
                  <motion.div
                    key="signup-step"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="space-y-6 text-center"
                  >
                    <div className="space-y-1">
                      <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">
                        Create Account
                      </h1>
                      <p className="text-[1.25rem] text-white/50 font-light">Join Smolboards today</p>
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <p className="text-red-400 text-sm">{error}</p>
                      </div>
                    )}

                    <form onSubmit={handleEmailSignup} className="space-y-4">
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full backdrop-blur-[1px] text-white border border-white/10 rounded-full py-3 px-4 focus:outline-none focus:border-white/30 text-center bg-transparent"
                        required
                      />

                      <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full backdrop-blur-[1px] text-white border border-white/10 rounded-full py-3 px-4 focus:outline-none focus:border-white/30 text-center bg-transparent"
                        required
                      />

                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full backdrop-blur-[1px] text-white border border-white/10 rounded-full py-3 px-4 focus:outline-none focus:border-white/30 text-center bg-transparent"
                        required
                        minLength={6}
                      />

                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={handleBackClick}
                          className="rounded-full bg-white/10 text-white font-medium px-8 py-3 hover:bg-white/20 transition-colors w-[30%]"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={loading || !fullName || !email || !password}
                          className={`flex-1 rounded-full font-medium py-3 border transition-all duration-300 ${
                            !loading && fullName && email && password
                              ? "bg-white text-black border-transparent hover:bg-white/90 cursor-pointer"
                              : "bg-[#111] text-white/50 border-white/10 cursor-not-allowed"
                          }`}
                        >
                          {loading ? "Creating Account..." : "Create Account"}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                ) : step === "login" ? (
                  <motion.div
                    key="login-step"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="space-y-6 text-center"
                  >
                    <div className="space-y-1">
                      <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">Welcome Back</h1>
                      <p className="text-[1.25rem] text-white/50 font-light">Sign in to your account</p>
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <p className="text-red-400 text-sm">{error}</p>
                      </div>
                    )}

                    <form onSubmit={handleEmailLogin} className="space-y-4">
                      <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full backdrop-blur-[1px] text-white border border-white/10 rounded-full py-3 px-4 focus:outline-none focus:border-white/30 text-center bg-transparent"
                        required
                      />

                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full backdrop-blur-[1px] text-white border border-white/10 rounded-full py-3 px-4 focus:outline-none focus:border-white/30 text-center bg-transparent"
                        required
                      />

                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={handleBackClick}
                          className="rounded-full bg-white/10 text-white font-medium px-8 py-3 hover:bg-white/20 transition-colors w-[30%]"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={loading || !email || !password}
                          className={`flex-1 rounded-full font-medium py-3 border transition-all duration-300 ${
                            !loading && email && password
                              ? "bg-white text-black border-transparent hover:bg-white/90 cursor-pointer"
                              : "bg-[#111] text-white/50 border-white/10 cursor-not-allowed"
                          }`}
                        >
                          {loading ? "Signing In..." : "Sign In"}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success-step"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
                    className="space-y-6 text-center"
                  >
                    <div className="space-y-1">
                      <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white">Welcome!</h1>
                      <p className="text-[1.25rem] text-white/50 font-light">Verify your email</p>
                    </div>

                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                      className="py-10"
                    >
                      <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-white to-white/70 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-black"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </motion.div>

                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      onClick={() => router.push("/dashboard")}
                      className="w-full rounded-full bg-white text-black font-medium py-3 hover:bg-white/90 transition-colors"
                    >
                      Continue to Login
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
