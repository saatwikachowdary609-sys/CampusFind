import { GoogleGenAI } from '@google/genai';
import { Item } from './db.js';

interface AIMatchResult {
  match_score: number;
  match_reasons: string[];
  ai_model: string;
  recommended_action: string;
}

export async function matchItemsWithAI(lostItem: Item, foundItem: Item): Promise<AIMatchResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI();
      const prompt = `You are the AI Lost-and-Found verification engine for Siddhartha Academy of Higher Education (SAHE).
Analyze whether these two reports correspond to the SAME physical item.

[LOST ITEM REPORT]
Reference: ${lostItem.reference_code}
Title: ${lostItem.title}
Category: ${lostItem.category}
Brand/Model: ${lostItem.brand_model || 'Not specified'}
Color: ${lostItem.color}
Description: ${lostItem.description}
Location Last Seen: ${lostItem.location}
Date/Time Last Seen: ${lostItem.date_seen_or_found}

[FOUND ITEM REPORT]
Reference: ${foundItem.reference_code}
Title: ${foundItem.title}
Category: ${foundItem.category}
Brand/Model: ${foundItem.brand_model || 'Not specified'}
Color: ${foundItem.color}
Description: ${foundItem.description}
Location Found: ${foundItem.location}
Date/Time Found: ${foundItem.date_seen_or_found}

Evaluate:
1. Category and subcategory alignment.
2. Semantic similarity of descriptions and specific physical traits.
3. Brand, model, and color congruence.
4. Location proximity on the Siddhartha campus.
5. Chronological plausibility (Found date/time should be at or after Lost date/time).

Return ONLY valid JSON matching this schema:
{
  "match_score": number (0 to 100, where 80+ is highly likely, 50-79 is plausible, <50 is unlikely),
  "match_reasons": ["short bullet explanation 1", "short bullet explanation 2", "short bullet explanation 3"],
  "recommended_action": "suggest_claim" | "flag_for_review" | "dismiss"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text?.trim() || '';
      const parsed = JSON.parse(responseText);

      return {
        match_score: Math.min(100, Math.max(0, Number(parsed.match_score) || 0)),
        match_reasons: Array.isArray(parsed.match_reasons) ? parsed.match_reasons : ['Semantic similarity detected'],
        ai_model: 'gemini-3.8-flash',
        recommended_action: parsed.recommended_action || 'flag_for_review',
      };
    } catch (err) {
      console.warn('Gemini API call returned error, falling back to rule-based engine:', err);
    }
  }

  // Graceful rule-based semantic heuristic fallback
  return ruleBasedMatcher(lostItem, foundItem);
}

function ruleBasedMatcher(lost: Item, found: Item): AIMatchResult {
  let score = 0;
  const reasons: string[] = [];

  // 1. Category match (30 pts)
  if (lost.category.toLowerCase() === found.category.toLowerCase()) {
    score += 30;
    reasons.push(`Identical item category: ${lost.category}`);
  }

  // 2. Color similarity (15 pts)
  const lostColors = lost.color.toLowerCase().split(/[\s,/]+/);
  const foundColors = found.color.toLowerCase().split(/[\s,/]+/);
  const colorIntersect = lostColors.some(c => c.length > 2 && foundColors.includes(c));
  if (colorIntersect) {
    score += 15;
    reasons.push(`Matching color tones: ${lost.color} & ${found.color}`);
  }

  // 3. Brand or model match (25 pts)
  if (
    lost.brand_model &&
    found.brand_model &&
    (lost.brand_model.toLowerCase().includes(found.brand_model.toLowerCase()) ||
      found.brand_model.toLowerCase().includes(lost.brand_model.toLowerCase()))
  ) {
    score += 25;
    reasons.push(`Brand/Model correlation: ${lost.brand_model}`);
  }

  // 4. Location proximity (15 pts)
  const lostLoc = lost.location.toLowerCase();
  const foundLoc = found.location.toLowerCase();
  if (lostLoc === foundLoc) {
    score += 15;
    reasons.push(`Exact location match: ${lost.location}`);
  } else if (
    (lostLoc.includes('library') && foundLoc.includes('library')) ||
    (lostLoc.includes('cafeteria') && foundLoc.includes('cafeteria')) ||
    (lostLoc.includes('ramanujan') && foundLoc.includes('ramanujan')) ||
    (lostLoc.includes('aryabhata') && foundLoc.includes('aryabhata'))
  ) {
    score += 10;
    reasons.push(`Shared campus zone: ${lost.location.split('-')[0].trim()}`);
  }

  // 5. Date order check (15 pts)
  const lostDate = new Date(lost.date_seen_or_found).getTime();
  const foundDate = new Date(found.date_seen_or_found).getTime();
  if (!isNaN(lostDate) && !isNaN(foundDate)) {
    if (foundDate >= lostDate - 3600000 * 2) {
      // found after or within 2h of loss
      score += 15;
      reasons.push('Chronologically coherent (found subsequent to loss report)');
    }
  }

  // Cap score
  score = Math.min(100, Math.max(10, score));

  return {
    match_score: score,
    match_reasons: reasons.length > 0 ? reasons : ['General item description overlap'],
    ai_model: 'heuristic-semantic-engine-v2',
    recommended_action: score >= 75 ? 'suggest_claim' : score >= 40 ? 'flag_for_review' : 'dismiss',
  };
}
