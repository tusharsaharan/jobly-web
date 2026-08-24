import { o as __toESM } from "../_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "../_libs/@react-three/drei+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { E as ArrowDown, T as ArrowRight } from "../_libs/lucide-react.mjs";
import { n as PublicNav } from "./Nav-C9P1gbyI.mjs";
import { a as useScroll, o as useMotionValueEvent, r as useTransform, s as motion, t as useReducedMotion } from "../_libs/framer-motion.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-C1EWJbTV.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var step1_default = "/assets/step1-COw2amjm.jpg";
var hero_default = "/assets/hero-BKMYnoC_.jpg";
var step2_default = "/assets/step2-XkCX1i1T.jpg";
var step3_default = "/assets/step3-D-K6JntX.jpg";
var step4_default = "/assets/step4-BTCM2QEc.jpg";
var WorkflowCanvas = (0, import_react.lazy)(() => import("./WorkflowCanvas-zGG3tPCo.mjs").then(({ WorkflowCanvas: Component }) => ({ default: Component })));
var STEPS = [
	{
		accent: "#b8ddd2",
		eyebrow: "Your starting point",
		image: step1_default,
		number: "01",
		title: "Bring your story.",
		description: "Add your resume once, then take a look at the skills and experience already doing the talking for you."
	},
	{
		accent: "#a3cfc2",
		eyebrow: "Good-fit signals",
		image: step2_default,
		number: "02",
		title: "Spot the good matches.",
		description: "See how a role lines up with your profile before you spend time applying. No mystery numbers, just helpful context."
	},
	{
		accent: "#86b4a6",
		eyebrow: "A clearer look",
		image: step3_default,
		number: "03",
		title: "Choose with confidence.",
		description: "Keep the requirements, match details, and next steps together, so every decision feels easier to make."
	},
	{
		accent: "#628c80",
		eyebrow: "Stay connected",
		image: step4_default,
		number: "04",
		title: "Keep the conversation going.",
		description: "Apply, follow your progress, and keep recruiter conversations close to the role that started them."
	}
];
var WORKSPACE_TILES = [
	"Role brief",
	"Hiring plan",
	"Candidate notes",
	"Shortlist",
	"Work samples",
	"Interview team"
];
var INTRO_STAGES = ["Welcome", "A clearer way forward"];
var OPPORTUNITY_STAGES = [
	"Message",
	"Shape",
	"Application",
	"Folder",
	"Next"
];
function Landing() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "bg-cream text-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PublicNav, { dark: true }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IntroSequence, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatementPanel, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JourneySection, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpportunitySequence, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClosingCall, {})
		]
	});
}
function IntroSequence() {
	const sectionRef = (0, import_react.useRef)(null);
	const [activeIndex, setActiveIndex] = (0, import_react.useState)(0);
	const shouldReduceMotion = useReducedMotion();
	const { scrollYProgress } = useScroll({
		target: sectionRef,
		offset: ["start start", "end end"]
	});
	const backdropOpacity = useTransform(scrollYProgress, [
		0,
		.3,
		.7,
		.95
	], [
		1,
		.8,
		.5,
		0
	]);
	const backdropScale = useTransform(scrollYProgress, [
		0,
		.7,
		.95
	], [
		1,
		1.03,
		1.06
	]);
	const veilOpacity = useTransform(scrollYProgress, [
		0,
		.3,
		.7,
		.95
	], [
		.45,
		.35,
		.2,
		0
	]);
	const heroOpacity = useTransform(scrollYProgress, [
		0,
		.2,
		.35
	], [
		1,
		1,
		0
	]);
	const heroY = useTransform(scrollYProgress, [0, .35], [0, -38]);
	const stageOpacity = useTransform(scrollYProgress, [
		.2,
		.4,
		.75,
		.95
	], [
		0,
		1,
		1,
		0
	]);
	const stageScale = useTransform(scrollYProgress, [
		.2,
		.45,
		.75,
		.95
	], [
		1.2,
		1,
		1,
		.94
	]);
	const stageY = useTransform(scrollYProgress, [
		.2,
		.45,
		.75,
		.95
	], [
		84,
		0,
		0,
		-72
	]);
	const mainRotateY = useTransform(scrollYProgress, [.2, .6], [-14, 0]);
	const mainRotateX = useTransform(scrollYProgress, [.2, .6], [10, 0]);
	const leftX = useTransform(scrollYProgress, [.2, .65], [-180, 0]);
	const leftRotateY = useTransform(scrollYProgress, [.2, .65], [30, -8]);
	const leftOpacity = useTransform(scrollYProgress, [
		.2,
		.35,
		.75,
		.95
	], [
		0,
		1,
		1,
		0
	]);
	const rightX = useTransform(scrollYProgress, [.2, .65], [180, 0]);
	const rightRotateY = useTransform(scrollYProgress, [.2, .65], [-30, 8]);
	const rightOpacity = useTransform(scrollYProgress, [
		.2,
		.35,
		.75,
		.95
	], [
		0,
		1,
		1,
		0
	]);
	const reduce = Boolean(shouldReduceMotion);
	useMotionValueEvent(scrollYProgress, "change", (latest) => {
		const nextIndex = Math.min(INTRO_STAGES.length - 1, Math.floor(latest * INTRO_STAGES.length));
		setActiveIndex((current) => current === nextIndex ? current : nextIndex);
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "hero",
		ref: sectionRef,
		className: "relative bg-[#302f2c]",
		children: [reduce ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "hidden md:block",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IntroFallback, {})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "relative hidden h-[220vh] md:block",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sticky top-0 h-screen overflow-hidden",
				style: { perspective: "1500px" },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.img, {
						src: hero_default,
						alt: "Two people working together at a table",
						className: "absolute inset-0 h-full w-full object-cover object-center",
						style: {
							opacity: backdropOpacity,
							scale: backdropScale
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
						className: "absolute inset-0 bg-[#1f2724]",
						"aria-hidden": "true",
						style: { opacity: veilOpacity }
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
						className: "absolute inset-0 z-10 flex items-center justify-center",
						style: {
							opacity: heroOpacity,
							y: heroY
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeroMessage, {})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
						className: "absolute left-1/2 top-1/2 z-20 h-[74vh] w-[min(66vw,780px)] -translate-x-1/2 -translate-y-1/2",
						style: {
							opacity: stageOpacity,
							scale: stageScale,
							y: stageY,
							transformStyle: "preserve-3d"
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.figure, {
								className: "absolute left-[-24%] top-[31%] z-20 h-[31%] w-[36%] overflow-hidden bg-white shadow-[0_28px_60px_-26px_rgb(47_48_45_/_0.42)]",
								style: {
									opacity: leftOpacity,
									x: leftX,
									rotateY: leftRotateY,
									transformStyle: "preserve-3d"
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: step2_default,
									alt: "",
									className: "h-full w-full object-cover"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-[#1f2724]/45" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.figure, {
								className: "absolute inset-0 z-30 overflow-hidden bg-[#2f302d] shadow-[0_40px_80px_-34px_rgb(47_48_45_/_0.55)]",
								style: {
									rotateX: reduce ? 0 : mainRotateX,
									rotateY: reduce ? 0 : mainRotateY,
									transformStyle: "preserve-3d"
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: hero_default,
										alt: "",
										className: "h-full w-full object-cover object-center"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-[#1f2724]/45" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "absolute inset-x-8 top-1/2 -translate-y-1/2 text-center text-white sm:inset-x-16",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "marker-num text-mint-light",
												children: "Meet Jobly"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "font-display mt-5 text-[clamp(2.5rem,5.5vw,5.8rem)] font-extrabold text-white [text-shadow:0_4px_28px_rgb(20_30_27_/_0.45)]",
												children: "Find your next good fit."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-5 max-w-2xl mx-auto text-sm leading-relaxed text-white/88 sm:text-base",
												children: "A more thoughtful place to turn experience into opportunity, whether you are looking for a role or building a team."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-9 flex items-center justify-center gap-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
													to: "/auth",
													className: "pill-mint text-sm gap-2",
													children: ["Get started", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
														className: "h-4 w-4",
														"aria-hidden": "true"
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
													href: "#statement",
													"aria-label": "Explore Jobly",
													className: "inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/80 text-white transition-transform duration-200 hover:translate-y-1 hover:bg-white/10",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDown, {
														className: "h-4 w-4",
														"aria-hidden": "true"
													})
												})]
											})
										]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.figure, {
								className: "absolute right-[-25%] top-[14%] z-40 h-[54%] w-[35%] overflow-hidden bg-white shadow-[0_28px_60px_-26px_rgb(47_48_45_/_0.42)]",
								style: {
									opacity: rightOpacity,
									x: rightX,
									rotateY: rightRotateY,
									transformStyle: "preserve-3d"
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: step3_default,
									alt: "",
									className: "h-full w-full object-cover"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-[#1f2724]/45" })]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollProgressDots, {
						stages: INTRO_STAGES,
						activeIndex,
						tone: "light"
					})
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "md:hidden",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IntroFallback, {})
		})]
	});
}
function HeroMessage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-20 pt-28 text-center sm:px-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.p, {
				initial: {
					opacity: 0,
					y: 14
				},
				animate: {
					opacity: 1,
					y: 0
				},
				transition: { duration: .55 },
				className: "marker-num text-mint-light",
				children: "Meet Jobly"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.h1, {
				initial: {
					opacity: 0,
					y: 22
				},
				animate: {
					opacity: 1,
					y: 0
				},
				transition: {
					duration: .7,
					delay: .08
				},
				className: "font-display mt-5 max-w-5xl text-[clamp(3.3rem,7vw,7.6rem)] font-extrabold text-white [text-shadow:0_4px_28px_rgb(20_30_27_/_0.45)]",
				children: "Find your next good fit."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.p, {
				initial: {
					opacity: 0,
					y: 16
				},
				animate: {
					opacity: 1,
					y: 0
				},
				transition: {
					duration: .6,
					delay: .18
				},
				className: "mt-5 max-w-2xl text-lg leading-relaxed text-white/88 sm:text-xl",
				children: "A more thoughtful place to turn experience into opportunity, whether you are looking for a role or building a team."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
				initial: {
					opacity: 0,
					y: 14
				},
				animate: {
					opacity: 1,
					y: 0
				},
				transition: {
					duration: .55,
					delay: .28
				},
				className: "mt-9 flex flex-wrap items-center justify-center gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/auth",
					className: "pill-mint-lg gap-2",
					children: ["Get started", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
						className: "h-4 w-4",
						"aria-hidden": "true"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "#statement",
					"aria-label": "Explore Jobly",
					className: "inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/80 text-white transition-transform duration-200 hover:translate-y-1 hover:bg-white/10",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDown, {
						className: "h-5 w-5",
						"aria-hidden": "true"
					})
				})]
			})
		]
	});
}
function IntroFallback() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex min-h-[720px] items-center justify-center overflow-hidden bg-[#1f2724]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: hero_default,
				alt: "Two people working together at a table",
				className: "absolute inset-0 h-full w-full object-cover object-[center_48%]"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 bg-[#1f2724]/45",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeroMessage, {})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative overflow-hidden bg-[#eef0ee] px-6 py-20",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: hero_default,
			alt: "",
			className: "absolute inset-0 h-full w-full object-cover opacity-35"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative mx-auto max-w-sm",
			style: { perspective: "900px" },
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
					className: "relative z-20 overflow-hidden bg-[#2f302d] shadow-[0_26px_52px_-26px_rgb(47_48_45_/_0.52)]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: hero_default,
							alt: "People considering their next steps together",
							className: "aspect-[4/5] w-full object-cover opacity-80"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-[#1f2724]/45" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figcaption", {
							className: "absolute inset-x-6 top-1/2 -translate-y-1/2 text-center text-white flex flex-col items-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "marker-num text-mint-light",
									children: "Meet Jobly"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-display mt-3 text-4xl font-extrabold",
									children: "Find your next good fit."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-sm leading-relaxed text-white/88 max-w-md",
									children: "A more thoughtful place to turn experience into opportunity."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/auth",
									className: "pill-mint text-sm gap-2 mt-5",
									children: ["Get started", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
										className: "h-4 w-4",
										"aria-hidden": "true"
									})]
								})
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
					className: "absolute -left-10 top-[30%] z-10 h-40 w-32 overflow-hidden shadow-soft",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: step2_default,
						alt: "",
						className: "h-full w-full object-cover"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-[#1f2724]/45" })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
					className: "absolute -right-10 top-[12%] z-30 h-52 w-32 overflow-hidden shadow-soft",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: step3_default,
						alt: "",
						className: "h-full w-full object-cover"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-[#1f2724]/45" })]
				})
			]
		})]
	})] });
}
function StatementPanel() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "statement",
		className: "relative overflow-hidden bg-[#302f2c] px-6 py-24 text-white sm:px-10 sm:py-32",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": "true",
				className: "absolute left-[8%] top-[19%] h-24 w-24 rotate-[20deg] border-[9px] border-black/15"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": "true",
				className: "absolute right-[13%] top-[16%] h-24 w-24 rotate-[38deg] border-[9px] border-black/15"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": "true",
				className: "absolute bottom-[13%] left-[15%] h-14 w-14 rotate-[17deg] border-[8px] border-black/15"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": "true",
				className: "absolute bottom-[12%] right-[11%] h-20 w-20 rounded-full border-[10px] border-black/15"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "relative mx-auto flex min-h-[540px] max-w-5xl items-center justify-center border border-white/5 bg-[#353431] px-6 py-16 text-center shadow-[0_34px_80px_-38px_rgb(0_0_0_/_0.65)] sm:px-16",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-4xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-serif text-2xl text-white/84 sm:text-3xl",
							children: "Because the next move matters"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display mt-8 text-[clamp(3rem,8vw,7.5rem)] font-extrabold leading-[0.93]",
							children: "Good work"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-serif mt-6 text-2xl text-white/84 sm:text-3xl",
							children: "starts with"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display mt-6 text-[clamp(3rem,8vw,7.5rem)] font-extrabold leading-[0.93]",
							children: "a clear picture."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-12 text-lg text-white/60",
							children: "Your experience, the role, and the people behind it."
						})
					]
				})
			})
		]
	});
}
function JourneySection() {
	const sectionRef = (0, import_react.useRef)(null);
	const [activeIndex, setActiveIndex] = (0, import_react.useState)(0);
	const [canvasReady, setCanvasReady] = (0, import_react.useState)(false);
	const isDesktop = useDesktopCanvas();
	const shouldReduceMotion = useReducedMotion();
	const { scrollYProgress } = useScroll({
		target: sectionRef,
		offset: ["start start", "end end"]
	});
	useMotionValueEvent(scrollYProgress, "change", (latest) => {
		const nextIndex = Math.min(STEPS.length - 1, Math.floor(latest * STEPS.length));
		setActiveIndex((current) => current === nextIndex ? current : nextIndex);
	});
	const activeStep = STEPS[activeIndex];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "journey",
		ref: sectionRef,
		className: "relative bg-cream",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "relative hidden h-[400vh] md:block",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sticky top-0 h-screen overflow-hidden",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkflowFallback, { visible: !isDesktop || !canvasReady }),
					isDesktop ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "pointer-events-none absolute inset-y-0 left-[42%] right-0",
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
							fallback: null,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkflowCanvas, {
								onReady: () => setCanvasReady(true),
								reducedMotion: shouldReduceMotion ?? false,
								scrollProgress: scrollYProgress,
								steps: STEPS
							})
						})
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-between px-6 pb-10 pt-28 sm:px-10",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "max-w-md",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "marker-num text-ink/60",
								children: "Your four-step flow"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
								initial: {
									opacity: 0,
									y: 16
								},
								animate: {
									opacity: 1,
									y: 0
								},
								transition: { duration: .35 },
								className: "mt-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "marker-num text-warm",
										children: [
											"Step ",
											activeStep.number,
											" | ",
											activeStep.eyebrow
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-display mt-4 text-[clamp(2.5rem,4.5vw,4.8rem)] text-ink",
										children: activeStep.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-5 max-w-sm text-lg leading-relaxed text-ink/72",
										children: activeStep.description
									})
								]
							}, activeStep.number)]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-end justify-between gap-10",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
								className: "grid max-w-3xl grid-cols-4 gap-x-5 border-t border-ink/20 pt-4",
								children: STEPS.map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: index === activeIndex ? "text-ink" : "text-ink/45",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "marker-num block",
										children: step.number
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "mt-1 block text-sm font-semibold leading-snug",
										children: step.eyebrow
									})]
								}, step.number))
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "hidden text-right lg:block",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "marker-num text-ink/55",
									children: "Scroll to follow the story"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-3 h-px w-32 bg-ink/20",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
										className: "h-px origin-left bg-ink",
										style: { scaleX: scrollYProgress }
									})
								})]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollProgressDots, {
						stages: STEPS.map((step) => `Step ${step.number}`),
						activeIndex,
						tone: "dark"
					})
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "px-6 py-20 sm:px-10 md:hidden",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "marker-num text-ink/60",
					children: "Your four-step flow"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display mt-5 max-w-lg text-[clamp(2.4rem,11vw,4rem)] text-ink",
					children: "A job search that feels more like you."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "mt-12 border-t border-ink/15",
					children: STEPS.map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "border-b border-ink/15 py-8",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "marker-num text-warm",
									children: ["Step ", step.number]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-display mt-3 text-3xl text-ink",
									children: step.title
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "marker-num pt-1 text-right text-ink/55",
									children: step.eyebrow
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 text-base leading-relaxed text-ink/72",
								children: step.description
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-6 overflow-hidden border border-border bg-white p-2 shadow-soft",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: step.image,
									alt: "",
									loading: "lazy",
									className: "aspect-[4/3] w-full object-cover"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-2 h-1",
									style: { backgroundColor: step.accent }
								})]
							})
						]
					}, step.number))
				})
			]
		})]
	});
}
function WorkflowFallback({ visible }) {
	const positions = [
		"left-[52%] top-[23%] z-20 -rotate-[4deg]",
		"right-[9%] top-[15%] z-10 rotate-[8deg] scale-90",
		"right-[17%] bottom-[9%] z-0 rotate-[14deg] scale-75",
		"left-[43%] bottom-[14%] z-10 -rotate-[11deg] scale-90"
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"aria-hidden": "true",
		className: `pointer-events-none absolute inset-0 transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`,
		children: STEPS.map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figure", {
			className: `absolute h-[360px] w-[270px] border border-border bg-white p-3 shadow-soft lg:h-[420px] lg:w-[315px] ${positions[index]}`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: step.image,
				alt: "",
				className: "h-[calc(100%-26px)] w-full object-cover"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("figcaption", {
				className: "mt-3 flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "h-2 w-2 rounded-full",
					style: { backgroundColor: step.accent }
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "marker-num text-ink/50",
					children: ["Step ", step.number]
				})]
			})]
		}, step.number))
	});
}
function OpportunitySequence() {
	const sectionRef = (0, import_react.useRef)(null);
	const [activeIndex, setActiveIndex] = (0, import_react.useState)(0);
	const [sceneFrame, setSceneFrame] = (0, import_react.useState)(0);
	const shouldReduceMotion = useReducedMotion();
	const { scrollYProgress } = useScroll({
		target: sectionRef,
		offset: ["start start", "end end"]
	});
	const gridTopY = useTransform(scrollYProgress, [
		0,
		.14,
		.2,
		.28
	], [
		0,
		0,
		-66,
		-280
	]);
	const gridBottomY = useTransform(scrollYProgress, [
		0,
		.14,
		.2,
		.28
	], [
		0,
		0,
		48,
		268
	]);
	const gridTopX = useTransform(scrollYProgress, [
		0,
		.14,
		.2,
		.28
	], [
		0,
		0,
		-26,
		-150
	]);
	const gridBottomX = useTransform(scrollYProgress, [
		0,
		.14,
		.2,
		.28
	], [
		0,
		0,
		32,
		158
	]);
	const openingCopyY = useTransform(scrollYProgress, [.09, .16], [0, -28]);
	const hiringTileOpacity = useTransform(scrollYProgress, [
		0,
		.06,
		.1
	], [
		1,
		1,
		0
	]);
	const cardOpacity = useTransform(scrollYProgress, [
		0,
		.06,
		.12
	], [
		0,
		0,
		1
	]);
	const cardX = useTransform(scrollYProgress, [
		0,
		.16,
		.26,
		.36,
		.46,
		.65,
		.73,
		.86,
		1
	], [
		0,
		0,
		0,
		-305,
		-305,
		-305,
		-305,
		-290,
		-290
	]);
	const cardY = useTransform(scrollYProgress, [
		0,
		.16,
		.26,
		.36,
		.46,
		.65,
		.72,
		.8,
		.88,
		1
	], [
		0,
		0,
		0,
		-10,
		-56,
		-52,
		0,
		44,
		68,
		80
	]);
	const cardScaleX = useTransform(scrollYProgress, [
		0,
		.06,
		.12,
		.24,
		.36,
		.46,
		.65,
		.8,
		1
	], [
		.62,
		.62,
		.78,
		.96,
		1,
		1,
		1,
		.72,
		.56
	]);
	const cardScaleY = useTransform(scrollYProgress, [
		0,
		.06,
		.12,
		.24,
		.36,
		.46,
		.65,
		.8,
		1
	], [
		.3,
		.3,
		.52,
		.72,
		.98,
		1,
		1,
		.68,
		.52
	]);
	const cardRotateY = useTransform(scrollYProgress, [
		0,
		.24,
		.46,
		.72,
		1
	], [
		0,
		-3,
		0,
		-2,
		-8
	]);
	const cardRotateX = useTransform(scrollYProgress, [
		0,
		.26,
		.52,
		.78,
		1
	], [
		2,
		0,
		0,
		5,
		9
	]);
	const messageContentY = useTransform(scrollYProgress, [.14, .18], [0, -18]);
	const applicationContentY = useTransform(scrollYProgress, [.26, .32], [24, 0]);
	const rightCopyY = useTransform(scrollYProgress, [.39, .43], [32, 0]);
	const folderX = useTransform(scrollYProgress, [
		.57,
		.63,
		.71,
		.8,
		1
	], [
		-80,
		-154,
		-258,
		-292,
		-292
	]);
	const folderY = useTransform(scrollYProgress, [
		.57,
		.63,
		.71,
		.8,
		1
	], [
		270,
		185,
		80,
		20,
		20
	]);
	const folderScale = useTransform(scrollYProgress, [
		.57,
		.63,
		.71,
		.8,
		1
	], [
		.4,
		.58,
		.83,
		1,
		1
	]);
	const folderRotateY = useTransform(scrollYProgress, [
		.57,
		.63,
		.71,
		.8,
		1
	], [
		16,
		11,
		4,
		0,
		0
	]);
	const folderRotateX = useTransform(scrollYProgress, [
		.57,
		.63,
		.71,
		.8,
		1
	], [
		10,
		6,
		2,
		0,
		0
	]);
	const cardIntoFolderY = useTransform(scrollYProgress, [
		.78,
		.86,
		.94
	], [
		0,
		-60,
		-120
	]);
	const cardIntoFolderScale = useTransform(scrollYProgress, [
		.78,
		.86,
		.94
	], [
		1,
		.68,
		.52
	]);
	const cardIntoFolderOpacity = useTransform(scrollYProgress, [.9, .97], [1, 0]);
	const folderCopyY = useTransform(scrollYProgress, [.9, .94], [28, 0]);
	const reduce = Boolean(shouldReduceMotion);
	const showWorkspace = sceneFrame < 3;
	const showGrid = sceneFrame < 4;
	const showMessage = sceneFrame >= 2 && sceneFrame < 4;
	const showApplication = sceneFrame >= 4 && sceneFrame < 12;
	const showApplicationCopy = sceneFrame >= 5 && sceneFrame < 10;
	const showFolder = sceneFrame >= 7;
	const showFolderCopy = sceneFrame >= 12;
	const showCardInFolder = sceneFrame >= 10;
	useMotionValueEvent(scrollYProgress, "change", (latest) => {
		const nextIndex = Math.min(OPPORTUNITY_STAGES.length - 1, Math.floor(latest * OPPORTUNITY_STAGES.length));
		const nextFrame = Math.min(13, Math.floor(latest * 14));
		setActiveIndex((current) => current === nextIndex ? current : nextIndex);
		setSceneFrame((current) => current === nextFrame ? current : nextFrame);
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "opportunity-sequence",
		ref: sectionRef,
		className: "relative bg-[#f6f6f4]",
		children: [reduce ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "hidden md:block",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollaborationScene, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ApplicationScene, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderScene, {})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "relative hidden h-[660vh] md:block",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sticky top-0 h-screen overflow-hidden",
				style: { perspective: "1600px" },
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-[#f6f6f4]" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.img, {
						src: step4_default,
						alt: "",
						className: "absolute inset-0 h-full w-full object-cover object-center",
						style: { opacity: showWorkspace ? 1 : 0 }
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
						className: "absolute inset-0 bg-[#17201e]/80",
						style: { opacity: showWorkspace ? 1 : 0 }
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
						className: "absolute inset-x-0 top-0 z-10 mx-auto max-w-7xl px-10 pt-28",
						style: {
							opacity: showWorkspace ? 1 : 0,
							y: openingCopyY
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "marker-num text-mint-light",
							children: "A shared hiring space"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display mt-4 max-w-xl text-[clamp(2.45rem,4.4vw,4.75rem)] leading-[0.98] text-white",
							children: "One message can start a good application."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
						className: "absolute inset-x-0 bottom-0 top-[52%] z-10 mx-auto grid max-w-7xl grid-cols-3 gap-4 px-10",
						style: { opacity: showGrid ? 1 : 0 },
						children: WORKSPACE_TILES.map((title, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.article, {
							className: "min-h-32 border border-white/15 bg-[#f7f8f6]/95 p-5 text-[#2f302d] shadow-[0_20px_40px_-26px_rgb(0_0_0_/_0.5)]",
							style: {
								x: index < 3 ? gridTopX : gridBottomX,
								y: index < 3 ? gridTopY : gridBottomY,
								opacity: index === 1 ? hiringTileOpacity : 1
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold",
								children: title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-6 space-y-2.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2 w-4/5 bg-[#2f302d]/15" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2 w-full bg-[#2f302d]/10" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2 w-3/5 bg-[#2f302d]/10" })
								]
							})]
						}, title))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
						className: "absolute left-1/2 top-[58%] z-30 h-[400px] w-[500px] -translate-x-1/2 -translate-y-1/2 overflow-hidden border border-[#d9ddd9] bg-[#fffefd] text-[#2f302d] shadow-[0_36px_70px_-32px_rgb(47_48_45_/_0.55)]",
						style: {
							opacity: showCardInFolder ? cardIntoFolderOpacity : cardOpacity,
							x: cardX,
							y: showCardInFolder ? cardIntoFolderY : cardY,
							scaleX: cardScaleX,
							scaleY: showCardInFolder ? cardIntoFolderScale : cardScaleY,
							rotateY: cardRotateY,
							rotateX: cardRotateX,
							transformOrigin: "center center",
							transformStyle: "preserve-3d"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
							className: "absolute inset-0 flex flex-col justify-center p-9",
							style: {
								opacity: showMessage ? 1 : 0,
								y: messageContentY
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "marker-num text-[#628c80]",
									children: "Candidate message"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-2xl font-semibold",
									children: "Ari Patel"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-4 max-w-md text-xl leading-relaxed text-[#2f302d]/72",
									children: "The fit looks strong. I would love to hear more about the product work."
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
							className: "absolute inset-0 p-9",
							style: {
								opacity: showApplication || showCardInFolder ? 1 : 0,
								y: applicationContentY
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "marker-num text-[#628c80]",
										children: "Jobly application"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-display mt-2 text-4xl",
										children: "Ari Patel"
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "rounded-full bg-[#d7ebe4] px-3 py-1 text-xs font-bold text-[#40685e]",
										children: "Submitted"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-3 text-base text-[#2f302d]/64",
									children: "Senior React Developer"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-7 space-y-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2 w-full bg-[#2f302d]/15" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2 w-4/5 bg-[#2f302d]/11" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2 w-3/5 bg-[#2f302d]/11" })
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-7 grid grid-cols-2 gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "border border-[#d9ddd9] p-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-[#2f302d]/48",
											children: "Match"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-xl font-bold",
											children: "Strong"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "border border-[#d9ddd9] p-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-[#2f302d]/48",
											children: "Status"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-xl font-bold",
											children: "Applied"
										})]
									})]
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
						className: "absolute left-[62%] top-[25%] z-20 w-[min(28vw,390px)]",
						style: {
							opacity: showApplicationCopy ? 1 : 0,
							y: rightCopyY
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "marker-num text-[#628c80]",
								children: "A message becomes a move"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display mt-5 text-[clamp(2.65rem,4vw,4.7rem)] leading-[0.98]",
								children: "Turn a good signal into a complete application."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-6 text-lg leading-relaxed text-ink/68",
								children: "The role, the reason it fits, and the work behind the candidate stay together from the first note to the submitted application."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
						className: "absolute left-1/2 top-1/2 z-20 h-[500px] w-[590px] -translate-x-1/2 -translate-y-1/2",
						style: {
							opacity: showFolder ? 1 : 0,
							x: folderX,
							y: folderY,
							scale: folderScale,
							rotateY: folderRotateY,
							rotateX: folderRotateX,
							transformStyle: "preserve-3d"
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "absolute bottom-0 left-[7%] right-[4%] h-[55%] border border-[#86b4a6] bg-[#a3cfc2] shadow-[0_28px_60px_-30px_rgb(47_48_45_/_0.42)]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -top-10 left-8 h-10 w-[42%] rounded-t-sm border border-b-0 border-[#86b4a6] bg-[#a3cfc2]" })
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
						className: "pointer-events-none absolute left-1/2 top-1/2 z-40 h-[500px] w-[590px] -translate-x-1/2 -translate-y-1/2",
						style: {
							opacity: showFolder ? 1 : 0,
							x: folderX,
							y: folderY,
							scale: folderScale,
							rotateY: folderRotateY,
							rotateX: folderRotateX,
							transformStyle: "preserve-3d"
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "absolute bottom-0 left-[7%] right-[4%] h-[49%] border border-[#86b4a6] bg-[#b8ddd2]",
							style: { clipPath: "polygon(0 13%, 100% 0, 100% 100%, 0 100%)" }
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.div, {
						className: "absolute left-[62%] top-[25%] z-50 w-[min(28vw,390px)]",
						style: {
							opacity: showFolderCopy ? 1 : 0,
							y: folderCopyY
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "marker-num text-[#628c80]",
								children: "Keep the momentum"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display mt-5 text-[clamp(2.65rem,4vw,4.7rem)] leading-[0.98]",
								children: "File the application without losing the story."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-6 text-lg leading-relaxed text-ink/68",
								children: "Every application stays linked to the role, the conversation, and the evidence that made it relevant in the first place."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollProgressDots, {
						stages: OPPORTUNITY_STAGES,
						activeIndex,
						tone: activeIndex === 0 ? "light" : "dark"
					})
				]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "md:hidden",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollaborationScene, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ApplicationScene, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderScene, {})
			]
		})]
	});
}
function CollaborationScene() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative isolate flex h-full min-h-[720px] items-center overflow-hidden bg-[#202826] px-6 py-16 text-white sm:px-10 sm:py-20",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: step4_default,
				alt: "",
				className: "absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-35"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 -z-10 bg-[#17201e]/72",
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto w-full max-w-7xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-2xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "marker-num text-mint-light",
							children: "A shared hiring space"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display mt-4 text-[clamp(2.6rem,5vw,5.3rem)]",
							children: "One message can start a good application."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-5 max-w-xl text-lg leading-relaxed text-white/75",
							children: "Keep the role, candidate notes, and the next conversation close enough that a clear signal can become a clear next step."
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative mt-9 grid gap-4 md:grid-cols-3 lg:mt-12",
					children: [WORKSPACE_TILES.map((title, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "min-h-36 border border-white/15 bg-[#f7f8f6]/90 p-5 text-[#2f302d] shadow-[0_20px_40px_-26px_rgb(0_0_0_/_0.5)] lg:min-h-40 lg:p-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold",
								children: title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-5 space-y-2.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2 w-4/5 bg-[#2f302d]/15" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2 w-full bg-[#2f302d]/10" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2 w-3/5 bg-[#2f302d]/10" })
								]
							}),
							index === 3 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-6 grid grid-cols-3 gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-8 bg-[#b8ddd2]" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-8 bg-[#d7ebe4]" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-8 bg-[#86b4a6]" })
								]
							}) : null,
							index === 5 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-6 flex gap-2",
								children: Array.from({ length: 4 }).map((_, avatarIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-8 w-8 rounded-full bg-[#b8ddd2]" }, avatarIndex))
							}) : null
						]
					}, title)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
						className: "relative z-10 mx-auto -mt-4 w-full max-w-xl border-t-8 border-[#86b4a6] bg-white p-6 text-[#2f302d] shadow-[0_28px_60px_-26px_rgb(0_0_0_/_0.55)] md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:p-7",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "marker-num text-[#628c80]",
								children: "Candidate message"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold",
								children: "Ari Patel"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-lg text-[#2f302d]/72",
								children: "The fit looks strong. I would love to hear more about the product work."
							})
						]
					})]
				})]
			})
		]
	});
}
function ApplicationScene() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex h-full min-h-[720px] items-center overflow-hidden bg-[#f6f6f4] px-6 py-16 sm:px-10 sm:py-20",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			"aria-hidden": "true",
			className: "absolute bottom-0 left-0 h-[46%] w-[42%] bg-[#353430]",
			style: { clipPath: "polygon(0 36%, 100% 0, 100% 100%, 0 100%)" }
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative mx-auto grid max-w-7xl gap-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.75fr)] lg:items-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mx-auto h-[470px] w-full max-w-[500px] sm:h-[540px]",
				style: { perspective: "1400px" },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					"aria-hidden": "true",
					className: "absolute left-[6%] top-6 h-[82%] w-[80%] rotate-[-8deg] border border-[#d9ddd9] bg-white/50 shadow-[0_30px_60px_-34px_rgb(47_48_45_/_0.42)]"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					className: "absolute left-[16%] top-12 z-10 h-[84%] w-[80%] overflow-hidden border border-[#d9ddd9] bg-[#fffefd] p-7 text-[#2f302d] shadow-[0_36px_70px_-32px_rgb(47_48_45_/_0.55)] sm:p-9",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "marker-num text-[#628c80]",
								children: "Jobly application"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-display mt-2 text-[clamp(2rem,3vw,3rem)]",
								children: "Ari Patel"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full bg-[#d7ebe4] px-3 py-1 text-xs font-bold text-[#40685e]",
								children: "Submitted"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-base text-[#2f302d]/64",
							children: "Senior React Developer"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-8 space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2 w-full bg-[#2f302d]/15" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2 w-4/5 bg-[#2f302d]/11" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2 w-3/5 bg-[#2f302d]/11" })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-8 grid grid-cols-2 gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border border-[#d9ddd9] p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-[#2f302d]/48",
									children: "Match"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-xl font-bold",
									children: "Strong"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border border-[#d9ddd9] p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-[#2f302d]/48",
									children: "Status"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-xl font-bold",
									children: "Applied"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: step1_default,
							alt: "",
							className: "absolute bottom-0 left-0 h-[27%] w-full object-cover opacity-45"
						})
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-xl lg:pl-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "marker-num",
						children: "A message becomes a move"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display mt-5 text-[clamp(2.8rem,5vw,5.4rem)]",
						children: "Turn a good signal into a complete application."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 text-lg leading-relaxed text-ink/68",
						children: "The role, the reason it fits, and the work behind the candidate stay together from the first note to the submitted application."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/auth",
						className: "pill-mint mt-8 gap-2",
						children: ["Start your profile", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
							className: "h-4 w-4",
							"aria-hidden": "true"
						})]
					})
				]
			})]
		})]
	});
}
function FolderScene({ applicationX, applicationY, applicationScale, applicationOpacity, folderLift }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex h-full min-h-[720px] items-center overflow-hidden bg-[#edf1ef] px-6 py-16 sm:px-10 sm:py-20",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			"aria-hidden": "true",
			className: "absolute right-[-8%] top-[-10%] h-80 w-80 rounded-full border-[34px] border-[#b8ddd2]/35"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative mx-auto grid max-w-7xl gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.75fr)] lg:items-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mx-auto h-[460px] w-full max-w-[540px] sm:h-[530px]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
						className: "absolute bottom-[9%] left-[8%] right-[5%] z-10 h-[48%] border border-[#86b4a6] bg-[#a3cfc2] shadow-[0_28px_60px_-30px_rgb(47_48_45_/_0.42)]",
						style: { y: folderLift ?? 0 },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -top-9 left-8 h-9 w-[42%] rounded-t-sm border border-b-0 border-[#86b4a6] bg-[#a3cfc2]" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.article, {
						className: "absolute left-[12%] top-[10%] z-20 h-[58%] w-[62%] border border-[#d9ddd9] bg-[#fffefd] p-6 text-[#2f302d] shadow-[0_30px_60px_-30px_rgb(47_48_45_/_0.5)]",
						style: {
							x: applicationX ?? 0,
							y: applicationY ?? 0,
							scale: applicationScale ?? 1,
							opacity: applicationOpacity ?? 1
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "marker-num text-[#628c80]",
								children: "Application"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display mt-3 text-3xl",
								children: "Ari Patel"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-[#2f302d]/62",
								children: "Senior React Developer"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-7 space-y-2.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2 w-full bg-[#2f302d]/15" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2 w-4/5 bg-[#2f302d]/10" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2 w-3/5 bg-[#2f302d]/10" })
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"aria-hidden": "true",
						className: "absolute bottom-[9%] left-[8%] right-[5%] z-30 h-[27%] border border-[#86b4a6] bg-[#b8ddd2]",
						style: { clipPath: "polygon(0 18%, 100% 0, 100% 100%, 0 100%)" }
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-xl lg:pl-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "marker-num",
						children: "Keep the momentum"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display mt-5 text-[clamp(2.8rem,5vw,5.4rem)]",
						children: "File the application without losing the story."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 text-lg leading-relaxed text-ink/68",
						children: "As work moves forward, every application stays connected to the role, the conversation, and the evidence that made it relevant."
					})
				]
			})]
		})]
	});
}
function ScrollProgressDots({ stages, activeIndex, tone }) {
	const isLight = tone === "light";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
		"aria-label": "Scroll progress",
		className: "absolute right-8 top-1/2 z-50 hidden -translate-y-1/2 gap-3 lg:grid",
		children: stages.map((stage, index) => {
			const isActive = index === activeIndex;
			const labelClass = isLight ? "text-white/0 group-hover:text-white/70" : "text-ink/0 group-hover:text-ink/60";
			const dotClass = isActive ? isLight ? "scale-125 border-white bg-white shadow-[0_0_0_5px_rgb(255_255_255_/_0.18)]" : "scale-125 border-ink bg-ink shadow-[0_0_0_5px_rgb(47_48_45_/_0.12)]" : isLight ? "border-white/50 bg-white/25" : "border-ink/30 bg-ink/30";
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				"aria-current": isActive ? "step" : void 0,
				className: "group relative flex justify-end",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs font-semibold transition-colors duration-200 ${labelClass}`,
					children: stage
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-2.5 w-2.5 rounded-full border transition-all duration-300 ${dotClass}` })]
			}, stage);
		})
	});
}
function ClosingCall() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "cta",
		className: "relative overflow-hidden bg-[#302f2c] px-6 py-20 text-white sm:px-10 sm:py-28",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(280px,0.7fr)_minmax(0,1fr)] lg:items-end",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mx-auto h-[520px] w-full max-w-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaperMockup, {
					className: "absolute left-0 top-8 h-[450px] w-[88%] rotate-[-6deg] opacity-35",
					label: "Jobly",
					title: "Your profile"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaperMockup, {
					className: "absolute right-0 top-0 z-10 h-[470px] w-[88%] shadow-[0_28px_64px_-28px_rgb(0_0_0_/_0.75)]",
					label: "Jobly",
					title: "A good next move",
					image: step4_default
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-2xl lg:pb-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "marker-num text-mint-light",
						children: "Start where you are"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display mt-5 text-[clamp(3rem,6vw,6rem)]",
						children: "Make the next move a good one."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 text-lg leading-relaxed text-white/70",
						children: "Build a profile that does you justice, find roles with real context, or bring a hiring team into one shared view."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-9 flex flex-wrap gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/auth",
							search: { mode: "signup" },
							className: "pill-mint-lg gap-2",
							children: ["Create your Jobly account", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
								className: "h-4 w-4",
								"aria-hidden": "true"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/auth",
							className: "inline-flex min-h-12 items-center px-3 text-sm font-semibold text-white/85 transition-colors hover:text-mint",
							children: "Log in"
						})]
					})
				]
			})]
		})
	});
}
function PaperMockup({ className = "", image, label, title }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `overflow-hidden border border-[#d9ddd9] bg-[#fffefd] p-7 text-[#2f302d] ${className}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-[#2f302d]/45",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display mt-2 text-[clamp(1.7rem,3vw,2.7rem)]",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-9 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2 w-full bg-[#2f302d]/15" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2 w-4/5 bg-[#2f302d]/11" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2 w-3/5 bg-[#2f302d]/11" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-8 text-sm font-semibold",
				children: "What matters most"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 space-y-2.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2 w-full bg-[#2f302d]/12" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2 w-[92%] bg-[#2f302d]/10" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2 w-2/3 bg-[#2f302d]/10" })
				]
			}),
			image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: image,
				alt: "",
				className: "absolute bottom-0 left-0 h-[34%] w-full object-cover opacity-65"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute bottom-8 left-7 right-7 h-20 bg-[#b8ddd2]" })
		]
	});
}
function useDesktopCanvas() {
	const [isDesktop, setIsDesktop] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const media = window.matchMedia("(min-width: 768px)");
		const update = () => setIsDesktop(media.matches);
		update();
		media.addEventListener("change", update);
		return () => media.removeEventListener("change", update);
	}, []);
	return isDesktop;
}
//#endregion
export { Landing as component };
