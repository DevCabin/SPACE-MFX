// Future Vercel API endpoint for leaderboard
// This file shows how the API could be structured for Vercel deployment

import { VercelRequest, VercelResponse } from '@vercel/node';

interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  rank: string;
  mission: string;
  shipRole: string;
  playTime: number;
  stats: {
    materialsCollected: number;
    asteroidsDestroyed: number;
    enemiesDestroyed: number;
    planetsConquered: number;
    basesBuilt: number;
    spaceMonsterKills: number;
  };
  timestamp: number;
}

// For now, this is just a template - the game uses localStorage
// When ready for production, this can be connected to a database like:
// - Vercel KV (Redis)
// - PlanetScale (MySQL)
// - Supabase (PostgreSQL)
// - Or even a simple JSON file in Vercel's file system

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    // GET /api/leaderboard - Return top scores
    try {
      // TODO: Fetch from database
      const leaderboard: LeaderboardEntry[] = [];
      
      res.status(200).json({
        success: true,
        data: leaderboard
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch leaderboard'
      });
    }
  } else if (req.method === 'POST') {
    // POST /api/leaderboard - Save new score
    try {
      const entry: Omit<LeaderboardEntry, 'id' | 'timestamp'> = req.body;
      
      // TODO: Validate entry data
      // TODO: Save to database
      // TODO: Return success response
      
      res.status(201).json({
        success: true,
        message: 'Score saved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to save score'
      });
    }
  } else {
    res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
}