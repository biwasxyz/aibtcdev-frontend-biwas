/**
 * @deprecated This file has been deprecated in favor of src/queries/tools-queries.ts
 * 
 * The manual cache pattern used here has been replaced with React Query
 * for better performance and consistency with the rest of the application.
 * 
 * Please import from @/queries/tools-queries instead.
 */

// Re-export types and main fetch function for backward compatibility
export type { Tool } from "@/queries/tools-queries";
export { fetchTools } from "@/queries/tools-queries";

// Legacy wrapper functions for backward compatibility
export const getToolsByCategory = async (category: string) => {
  const { filterToolsByCategory, fetchTools } = await import("@/queries/tools-queries");
  const tools = await fetchTools();
  return filterToolsByCategory(tools, category);
};

export const getToolsByIds = async (ids: string[]) => {
  const { filterToolsByIds, fetchTools } = await import("@/queries/tools-queries");
  const tools = await fetchTools();
  return filterToolsByIds(tools, ids);
};

export const getTool = async (id: string) => {
  const { findToolById, fetchTools } = await import("@/queries/tools-queries");
  const tools = await fetchTools();
  const tool = findToolById(tools, id);
  if (!tool) {
    throw new Error(`Tool with id "${id}" not found`);
  }
  return tool;
};

export const getAvailableTools = async () => {
  const { getToolIds, fetchTools } = await import("@/queries/tools-queries");
  const tools = await fetchTools();
  return getToolIds(tools);
};
