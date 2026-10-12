import { z } from "zod";

export const owner = z.string().describe("Repository owner (user or org login)");
export const repo = z.string().describe("Repository name");
export const perPage = z.number().optional().describe("Results per page (max 100)");
