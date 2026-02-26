import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSavedStrategySchema } from "../shared/schema";
import { z } from "zod";
import OpenAI from "openai";

// Initialize OpenAI client with Replit AI Integration
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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

  app.put("/api/strategies/:id", async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string') {
        res.status(400).json({ error: "Invalid name" });
        return;
      }
      const updated = await storage.updateStrategyName(req.params.id, name);
      if (!updated) {
        res.status(404).json({ error: "Strategy not found" });
      } else {
        res.json(updated);
      }
    } catch (error) {
      console.error("Error updating strategy:", error);
      res.status(500).json({ error: "Failed to update strategy" });
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

  // Natural Language Query API endpoint
  app.post("/api/natural-query", async (req, res) => {
    try {
      const { query, currentParameters } = req.body;
      
      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: "Query is required" });
        return;
      }

      // Create a system prompt that helps the AI understand the context
      const systemPrompt = `You are an assistant for a CNG (Compressed Natural Gas) fleet conversion calculator. Your job is to parse natural language queries and return JSON instructions for updating calculator parameters.

Current calculator state:
${JSON.stringify(currentParameters, null, 2)}

Available parameters to modify:
- Vehicle counts: lightDutyCount, mediumDutyCount, heavyDutyCount (0-100 each)
- Vehicle costs: lightDutyCost ($15,000), mediumDutyCost ($25,000), heavyDutyCost ($50,000)
- Vehicle lifespans: lightDutyLifespan (7), mediumDutyLifespan (7), heavyDutyLifespan (7) in years
- Vehicle MPG: lightDutyMPG (20), mediumDutyMPG (10), heavyDutyMPG (6)
- Annual miles: lightDutyAnnualMiles (15,000), mediumDutyAnnualMiles (25,000), heavyDutyAnnualMiles (50,000)
- Fuel types: lightDutyFuelType, mediumDutyFuelType, heavyDutyFuelType (values: "gasoline" or "diesel")
- CNG efficiency loss: lightDutyCngEfficiencyLoss (50 = 5%), mediumDutyCngEfficiencyLoss (75 = 7.5%), heavyDutyCngEfficiencyLoss (100 = 10%)
- Fuel prices: gasolinePrice ($3.00), dieselPrice ($3.50), cngPrice ($2.00), cngTaxCredit ($0.50)
- Price annual increase: annualIncrease (3%)
- Station config: stationType ("fast" or "time"), businessType ("aglc", "cgc", "vng"), turnkey (true/false), stationMarkup (0-100)
- Deployment strategy: deploymentStrategy ("immediate", "phased", "aggressive", "deferred", "manual")
- Time horizon: timeHorizon (1-15 years)
- Conversion factors: gasolineToCngConversionFactor (1.0), dieselToCngConversionFactor (1.136)

For optimization queries:
- If asked to optimize for a budget, adjust vehicle counts and deployment strategy
- If asked about break-even, suggest viewing the existing break-even chart
- If asked about ROI, suggest viewing the ROI metrics

Respond ONLY with a valid JSON object in this format:
{
  "parameterUpdates": {
    // Include only the parameters that need to be changed
  },
  "insights": "Brief explanation of what was changed and why",
  "suggestedView": "dashboard|sensitivity|comparison" // Optional: suggest which view to look at
}

Examples:
Query: "What happens if diesel prices increase by 20%?"
Response: {"parameterUpdates": {"dieselPrice": 4.20}, "insights": "Increased diesel price from $3.50 to $4.20 (20% increase)", "suggestedView": "dashboard"}

Query: "Change to 10 light duty vehicles"
Response: {"parameterUpdates": {"lightDutyCount": 10}, "insights": "Set light duty vehicle count to 10", "suggestedView": "dashboard"}

Query: "Use immediate deployment strategy"
Response: {"parameterUpdates": {"deploymentStrategy": "immediate"}, "insights": "Changed deployment strategy to immediate (all vehicles in year 1)", "suggestedView": "dashboard"}`;

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        temperature: 0.1,
        max_tokens: 500,
      });

      const responseText = completion.choices[0]?.message?.content;
      
      if (!responseText) {
        res.status(500).json({ error: "Failed to process query" });
        return;
      }

      try {
        // Try to extract JSON from the response (handle markdown code blocks)
        let jsonString = responseText;
        
        // Remove markdown code blocks if present
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                         responseText.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonString = jsonMatch[1];
        }
        
        // Parse the JSON response from OpenAI
        const parsedResponse = JSON.parse(jsonString);
        
        // Validate and sanitize parameter updates
        if (parsedResponse.parameterUpdates) {
          const sanitized: any = {};
          const updates = parsedResponse.parameterUpdates;
          
          // Vehicle counts validation (0-100)
          ['lightDutyCount', 'mediumDutyCount', 'heavyDutyCount'].forEach(field => {
            if (field in updates) {
              const val = Number(updates[field]);
              if (!isNaN(val)) {
                sanitized[field] = Math.max(0, Math.min(100, Math.round(val)));
              }
            }
          });
          
          // Vehicle costs validation (positive numbers)
          ['lightDutyCost', 'mediumDutyCost', 'heavyDutyCost'].forEach(field => {
            if (field in updates) {
              const val = Number(updates[field]);
              if (!isNaN(val) && val > 0) {
                sanitized[field] = val;
              }
            }
          });
          
          // Lifespans validation (1-20 years)
          ['lightDutyLifespan', 'mediumDutyLifespan', 'heavyDutyLifespan'].forEach(field => {
            if (field in updates) {
              const val = Number(updates[field]);
              if (!isNaN(val)) {
                sanitized[field] = Math.max(1, Math.min(20, Math.round(val)));
              }
            }
          });
          
          // MPG validation (positive numbers)
          ['lightDutyMPG', 'mediumDutyMPG', 'heavyDutyMPG'].forEach(field => {
            if (field in updates) {
              const val = Number(updates[field]);
              if (!isNaN(val) && val > 0) {
                sanitized[field] = val;
              }
            }
          });
          
          // Annual miles validation (positive numbers)
          ['lightDutyAnnualMiles', 'mediumDutyAnnualMiles', 'heavyDutyAnnualMiles'].forEach(field => {
            if (field in updates) {
              const val = Number(updates[field]);
              if (!isNaN(val) && val > 0) {
                sanitized[field] = Math.round(val);
              }
            }
          });
          
          // Fuel type validation
          ['lightDutyFuelType', 'mediumDutyFuelType', 'heavyDutyFuelType'].forEach(field => {
            if (field in updates) {
              if (updates[field] === 'gasoline' || updates[field] === 'diesel') {
                sanitized[field] = updates[field];
              }
            }
          });
          
          // CNG efficiency loss validation (0-1000 = 0-100%)
          ['lightDutyCngEfficiencyLoss', 'mediumDutyCngEfficiencyLoss', 'heavyDutyCngEfficiencyLoss'].forEach(field => {
            if (field in updates) {
              const val = Number(updates[field]);
              if (!isNaN(val)) {
                sanitized[field] = Math.max(0, Math.min(1000, Math.round(val)));
              }
            }
          });
          
          // Fuel prices validation (positive numbers)
          ['gasolinePrice', 'dieselPrice', 'cngPrice', 'cngTaxCredit'].forEach(field => {
            if (field in updates) {
              const val = Number(updates[field]);
              if (!isNaN(val) && val >= 0) {
                sanitized[field] = val;
              }
            }
          });
          
          // Annual increase validation (0-100%)
          if ('annualIncrease' in updates) {
            const val = Number(updates.annualIncrease);
            if (!isNaN(val)) {
              sanitized.annualIncrease = Math.max(0, Math.min(100, val));
            }
          }
          
          // Conversion factors validation (positive numbers)
          ['gasolineToCngConversionFactor', 'dieselToCngConversionFactor'].forEach(field => {
            if (field in updates) {
              const val = Number(updates[field]);
              if (!isNaN(val) && val > 0) {
                sanitized[field] = val;
              }
            }
          });
          
          // Station config validation
          if ('stationType' in updates) {
            if (updates.stationType === 'fast' || updates.stationType === 'time') {
              sanitized.stationType = updates.stationType;
            }
          }
          
          if ('businessType' in updates) {
            if (['aglc', 'cgc', 'vng'].includes(updates.businessType)) {
              sanitized.businessType = updates.businessType;
            }
          }
          
          if ('turnkey' in updates) {
            sanitized.turnkey = Boolean(updates.turnkey);
          }
          
          if ('stationMarkup' in updates) {
            const val = Number(updates.stationMarkup);
            if (!isNaN(val)) {
              sanitized.stationMarkup = Math.max(0, Math.min(100, Math.round(val / 5) * 5));
            }
          }
          
          // Deployment strategy validation
          if ('deploymentStrategy' in updates) {
            if (['immediate', 'phased', 'aggressive', 'deferred', 'manual'].includes(updates.deploymentStrategy)) {
              sanitized.deploymentStrategy = updates.deploymentStrategy;
            }
          }
          
          // Time horizon validation (1-15 years)
          if ('timeHorizon' in updates) {
            const val = Number(updates.timeHorizon);
            if (!isNaN(val)) {
              sanitized.timeHorizon = Math.max(1, Math.min(15, Math.round(val)));
            }
          }
          
          parsedResponse.parameterUpdates = sanitized;
        }
        
        res.json(parsedResponse);
      } catch (parseError) {
        console.error("Error parsing OpenAI response:", responseText);
        // Try to provide a helpful fallback response
        res.json({
          parameterUpdates: {},
          insights: "I understood your request but couldn't process the specific changes. Please try rephrasing your question or use more specific parameter names.",
          suggestedView: "dashboard"
        });
      }
    } catch (error) {
      console.error("Error processing natural language query:", error);
      res.status(500).json({ error: "Failed to process query" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
