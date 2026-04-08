export type ToolArgs = Record<string, unknown>;

export function asObject(args: unknown): ToolArgs {
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    return {};
  }
  return args as ToolArgs;
}

export function getRequiredString(args: ToolArgs, key: string): string {
  const value = args[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`"${key}" must be a non-empty string.`);
  }
  return value;
}

export function getOptionalString(args: ToolArgs, key: string): string | undefined {
  const value = args[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new Error(`"${key}" must be a string when provided.`);
  }
  return value;
}

export function getOptionalNumber(args: ToolArgs, key: string): number | undefined {
  const value = args[key];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`"${key}" must be a number when provided.`);
  }
  return value;
}

export function getOptionalBoolean(args: ToolArgs, key: string): boolean | undefined {
  const value = args[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "boolean") {
    throw new Error(`"${key}" must be a boolean when provided.`);
  }
  return value;
}
