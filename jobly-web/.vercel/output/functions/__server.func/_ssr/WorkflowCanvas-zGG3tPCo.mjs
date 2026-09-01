import { o as __toESM } from "../_runtime.mjs";
import { c as SRGBColorSpace, d as require_jsx_runtime, f as require_react, i as useFrame, l as TubeGeometry, n as useTexture, o as CatmullRomCurve3, r as Canvas, s as MathUtils, t as RoundedBox, u as Vector3 } from "../_libs/@react-three/drei+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/WorkflowCanvas-zGG3tPCo.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SceneRibbon({ color, offset, rotation }) {
	const ribbon = (0, import_react.useRef)(null);
	const geometry = (0, import_react.useMemo)(() => {
		return new TubeGeometry(new CatmullRomCurve3([
			new Vector3(-4.8, -1.3 + offset, -2.8),
			new Vector3(-2.1, 1.15 + offset, -2.4),
			new Vector3(.2, -.55 + offset, -2.9),
			new Vector3(2.5, 1.28 + offset, -2.5),
			new Vector3(5.2, -.1 + offset, -2.8)
		]), 96, .08, 12, false);
	}, [offset]);
	useFrame(({ clock }) => {
		if (!ribbon.current) return;
		ribbon.current.rotation.z = rotation + Math.sin(clock.getElapsedTime() * .24 + offset) * .08;
		ribbon.current.position.y = Math.sin(clock.getElapsedTime() * .42 + offset) * .12;
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("mesh", {
		ref: ribbon,
		geometry,
		rotation: [
			.22,
			-.18,
			rotation
		],
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
			color,
			roughness: .38,
			metalness: .03,
			transparent: true,
			opacity: .52
		})
	});
}
function WorkflowCard({ index, reducedMotion = false, scrollProgress, step }) {
	const group = (0, import_react.useRef)(null);
	const accentMaterial = (0, import_react.useRef)(null);
	const frameMaterial = (0, import_react.useRef)(null);
	const imageMaterial = (0, import_react.useRef)(null);
	const markerMaterial = (0, import_react.useRef)(null);
	const texture = useTexture(step.image);
	const targetPosition = (0, import_react.useMemo)(() => new Vector3(), []);
	(0, import_react.useEffect)(() => {
		texture.colorSpace = SRGBColorSpace;
		texture.anisotropy = 4;
		texture.needsUpdate = true;
	}, [texture]);
	useFrame((_state, delta) => {
		if (!group.current) return;
		const progress = reducedMotion ? 0 : scrollProgress.get();
		const angle = index * (Math.PI / 2) - progress * Math.PI * 2 + Math.PI / 4;
		const depth = Math.cos(angle);
		const focus = (depth + 1) / 2;
		const targetScale = .56 + focus * .46;
		const cardOpacity = .06 + focus * focus * focus * focus * .94;
		targetPosition.set(Math.sin(angle) * 3.25, Math.sin(angle * 2) * .28 + Math.cos(angle) * .12 + (depth < -.25 ? .82 : 0), depth * 2.55);
		group.current.position.lerp(targetPosition, 1 - Math.exp(-delta * 8));
		group.current.rotation.x = MathUtils.damp(group.current.rotation.x, -.05 + depth * .04, 8, delta);
		group.current.rotation.y = MathUtils.damp(group.current.rotation.y, -Math.sin(angle) * .36, 8, delta);
		group.current.rotation.z = MathUtils.damp(group.current.rotation.z, -Math.sin(angle) * .1, 8, delta);
		const nextScale = MathUtils.damp(group.current.scale.x, targetScale, 8, delta);
		group.current.scale.setScalar(nextScale);
		if (frameMaterial.current) frameMaterial.current.opacity = MathUtils.damp(frameMaterial.current.opacity, cardOpacity, 9, delta);
		if (imageMaterial.current) imageMaterial.current.opacity = MathUtils.damp(imageMaterial.current.opacity, cardOpacity, 9, delta);
		if (accentMaterial.current) accentMaterial.current.opacity = MathUtils.damp(accentMaterial.current.opacity, cardOpacity, 9, delta);
		if (markerMaterial.current) markerMaterial.current.opacity = MathUtils.damp(markerMaterial.current.opacity, cardOpacity, 9, delta);
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("group", {
		ref: group,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoundedBox, {
				args: [
					3.2,
					4.2,
					.18
				],
				radius: .1,
				smoothness: 4,
				castShadow: true,
				receiveShadow: true,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshStandardMaterial", {
					ref: frameMaterial,
					color: "#fffefd",
					metalness: .02,
					opacity: .3,
					roughness: .56,
					transparent: true
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
				position: [
					0,
					.14,
					.105
				],
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("planeGeometry", { args: [2.84, 3.36] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshBasicMaterial", {
					ref: imageMaterial,
					map: texture,
					opacity: .3,
					toneMapped: false,
					transparent: true
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
				position: [
					0,
					-1.74,
					.112
				],
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("planeGeometry", { args: [2.84, .34] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshBasicMaterial", {
					ref: accentMaterial,
					color: step.accent,
					opacity: .3,
					transparent: true
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("mesh", {
				position: [
					-1.08,
					-1.74,
					.118
				],
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circleGeometry", { args: [.07, 24] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meshBasicMaterial", {
					ref: markerMaterial,
					color: "#e8f6c8",
					opacity: .3,
					transparent: true
				})]
			})
		]
	});
}
function WorkflowScene({ reducedMotion, scrollProgress, steps }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("color", {
			attach: "background",
			args: ["#f7fffb"]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ambientLight", { intensity: 1.7 }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("directionalLight", {
			castShadow: true,
			color: "#effcf6",
			intensity: 2.1,
			position: [
				-4,
				6,
				8
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pointLight", {
			color: "#a9ebd1",
			intensity: 7,
			position: [
				5,
				1,
				4
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pointLight", {
			color: "#b7d7f1",
			intensity: 4.5,
			position: [
				-4,
				-2,
				2
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SceneRibbon, {
			color: "#d6f6e7",
			offset: .7,
			rotation: -.14
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SceneRibbon, {
			color: "#74cbaa",
			offset: -1.65,
			rotation: .18
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("group", {
			position: [
				-1.35,
				-.35,
				0
			],
			children: steps.map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkflowCard, {
				index,
				reducedMotion,
				scrollProgress,
				step
			}, step.image))
		})
	] });
}
function WorkflowCanvas({ onReady, reducedMotion, scrollProgress, steps }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Canvas, {
		camera: {
			fov: 37,
			position: [
				0,
				0,
				11.5
			]
		},
		className: "h-full w-full",
		dpr: [1, 1.5],
		gl: {
			antialias: true,
			powerPreference: "high-performance"
		},
		onCreated: () => onReady?.(),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
			fallback: null,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WorkflowScene, {
				reducedMotion,
				scrollProgress,
				steps
			})
		})
	});
}
//#endregion
export { WorkflowCanvas };
