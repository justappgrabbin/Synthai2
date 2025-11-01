/**
 * World Orchestrator - Main pipeline for Ideogenesis
 * 
 * Coordinates the full flow:
 * Text → Symbolic Parsing → LLM Observer → GANs → World Manifestation
 */

import { storage } from '../storage';
import { parseSymbolicStructure, extractSemanticHints } from './symbolic-parser';
import { observeIdeon, evaluateWorld } from './llm-observer';
import { generateWorldVisuals } from './gan-integrations';
import type { IdeonSeed, WorldManifestation } from '@shared/schema';

export interface OrchestrationResult {
  ideonSeed: IdeonSeed;
  worldManifestation: WorldManifestation;
  processingTime: number;
}

/**
 * Main orchestration function - transforms text into playable world
 */
export async function orchestrateWorldGeneration(
  userId: string,
  rawText: string
): Promise<OrchestrationResult> {
  const startTime = Date.now();
  console.log('[Orchestrator] Starting world generation for user:', userId);
  
  // Step 1: Parse symbolic structure
  console.log('[Orchestrator] Step 1: Parsing symbolic structure...');
  const symbolicStructure = parseSymbolicStructure(rawText);
  const semanticHints = extractSemanticHints(symbolicStructure);
  console.log('[Orchestrator] Symbolic parsing complete. Operators found:', symbolicStructure.operators.length);
  
  // Step 2: Create ideon seed record
  const ideonSeed = await storage.createIdeonSeed({
    userId,
    rawText,
    symbolicStructure,
    status: 'processing',
  });
  
  try {
    // Step 3: LLM Observer interprets through 7-layer framework
    console.log('[Orchestrator] Step 3: Calling LLM Observer...');
    const parsedSemantics = await observeIdeon(rawText, {
      symbolicStructure,
      semanticHints,
    });
    console.log('[Orchestrator] LLM Observer complete');
    
    // Step 4: Update ideon seed with semantic layers
    const updatedIdeon = await storage.updateIdeonSeed(ideonSeed.id, {
      movement: parsedSemantics.movement,
      evolution: parsedSemantics.evolution,
      being: parsedSemantics.being,
      design: parsedSemantics.design,
      space: parsedSemantics.space,
      transpersonal: parsedSemantics.transpersonal,
      void: parsedSemantics.void,
      status: 'processing',
    });
    
    // Step 5: Generate visuals through GAN pipeline
    const { semantic, video } = await generateWorldVisuals({
      movement: parsedSemantics.movement,
      evolution: parsedSemantics.evolution,
      being: parsedSemantics.being,
      design: parsedSemantics.design,
      space: parsedSemantics.space,
      transpersonal: parsedSemantics.transpersonal,
      void: parsedSemantics.void,
    });
    
    // Step 6: Evaluate world quality (discriminator scores)
    const scores = await evaluateWorld(
      parsedSemantics.narrative,
      parsedSemantics.worldAttributes
    );
    
    // Step 7: Create world manifestation
    const worldManifestation = await storage.createWorldManifestation({
      ideonSeedId: ideonSeed.id,
      narrative: parsedSemantics.narrative,
      worldAttributes: parsedSemantics.worldAttributes,
      semanticGanResult: semantic,
      videoGanResult: video,
      coherenceScore: scores.coherenceScore,
      resonanceScore: scores.resonanceScore,
      beautyScore: scores.beautyScore,
      reflectionNotes: parsedSemantics.reflectionNotes,
    });
    
    // Step 8: Mark ideon as completed
    await storage.updateIdeonSeed(ideonSeed.id, {
      status: 'completed',
      completedAt: new Date(),
    });
    
    const processingTime = Date.now() - startTime;
    
    return {
      ideonSeed: updatedIdeon || ideonSeed,
      worldManifestation,
      processingTime,
    };
  } catch (error) {
    // Mark as failed
    await storage.updateIdeonSeed(ideonSeed.id, {
      status: 'failed',
    });
    
    throw new Error(`World generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if user has available tokens for this month
 */
export async function checkTokenAvailability(userId: string): Promise<{
  available: boolean;
  tokensRemaining: number;
  month: string;
}> {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const ledger = await storage.getTokenLedger(userId, month);
  
  if (!ledger) {
    // No ledger for this month yet - will be created on first use
    return {
      available: true,
      tokensRemaining: 5,
      month,
    };
  }
  
  return {
    available: ledger.tokensRemaining > 0,
    tokensRemaining: ledger.tokensRemaining,
    month,
  };
}

/**
 * Use a token for world generation
 */
export async function consumeToken(userId: string): Promise<boolean> {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  return await storage.decrementToken(userId, month);
}
