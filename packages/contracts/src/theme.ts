import { z } from "zod";

export const WORKSPACE_THEME_VERSION = "workspace-theme/1" as const;

export const WorkspaceThemeModeSchema = z.enum(["system", "light", "dark"]);
export const ResolvedThemeModeSchema = z.enum(["light", "dark"]);

export const TerminalColorPaletteSchema = z.object({
  background: z.string(),
  foreground: z.string(),
  cursor: z.string(),
  cursorAccent: z.string().optional(),
  selectionBackground: z.string().optional(),
  black: z.string(),
  red: z.string(),
  green: z.string(),
  yellow: z.string(),
  blue: z.string(),
  magenta: z.string(),
  cyan: z.string(),
  white: z.string(),
  brightBlack: z.string(),
  brightRed: z.string(),
  brightGreen: z.string(),
  brightYellow: z.string(),
  brightBlue: z.string(),
  brightMagenta: z.string(),
  brightCyan: z.string(),
  brightWhite: z.string(),
}).strict();

export const MonacoThemeConfigSchema = z.object({
  base: z.enum(["vs", "vs-dark", "hc-black", "hc-light"]),
  inherit: z.boolean(),
  rules: z.array(z.object({
    token: z.string(),
    foreground: z.string().optional(),
    background: z.string().optional(),
    fontStyle: z.string().optional(),
  })),
  colors: z.record(z.string(), z.string()),
}).strict();

export const UserThemePreferenceSchema = z.object({
  mode: WorkspaceThemeModeSchema.default("system"),
  editorTheme: z.string().default("jobly-default"),
  fontSize: z.number().int().min(10).max(24).default(14),
  updatedAt: z.string().datetime().optional(),
}).strict();

export type WorkspaceThemeMode = z.infer<typeof WorkspaceThemeModeSchema>;
export type ResolvedThemeMode = z.infer<typeof ResolvedThemeModeSchema>;
export type TerminalColorPalette = z.infer<typeof TerminalColorPaletteSchema>;
export type MonacoThemeConfig = z.infer<typeof MonacoThemeConfigSchema>;
export type UserThemePreference = z.infer<typeof UserThemePreferenceSchema>;
