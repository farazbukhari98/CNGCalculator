import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSavedStrategySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Saved strategies routes
  app.post("/api/strategies", async (req, res) => {
    try {
      // Validate request body
      const strategyData = insertSavedStrategySchema.parse(req.body);
      const savedStrategy = await storage.saveStrategy(strategyData);
      res.json(savedStrategy);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Error saving strategy:", error);
        res.status(500).json({ error: "Failed to save strategy" });
      }
    }
  });

  app.get("/api/strategies", async (req, res) => {
    try {
      const strategies = await storage.getAllStrategies();
      res.json(strategies);
    } catch (error) {
      console.error("Error fetching strategies:", error);
      res.status(500).json({ error: "Failed to fetch strategies" });
    }
  });

  app.get("/api/strategies/:id", async (req, res) => {
    try {
      const strategy = await storage.getStrategy(req.params.id);
      if (!strategy) {
        res.status(404).json({ error: "Strategy not found" });
      } else {
        res.json(strategy);
      }
    } catch (error) {
      console.error("Error fetching strategy:", error);
      res.status(500).json({ error: "Failed to fetch strategy" });
    }
  });

  app.delete("/api/strategies/:id", async (req, res) => {
    try {
      await storage.deleteStrategy(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting strategy:", error);
      res.status(500).json({ error: "Failed to delete strategy" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
