import { useEffect, useState } from 'react';
import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((data) => setEntries(data.leaderboard))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load leaderboard'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      loading={loading}
      error={error}
      isEmpty={entries.length === 0}
      emptyText="No leaderboard scores yet."
    >
      <ol className="list-group list-group-numbered">
        {entries.map((entry) => (
          <li className="list-group-item d-flex justify-content-between" key={entry.teamName}>
            <span>{entry.teamName}</span>
            <span>{entry.totalPoints} points</span>
          </li>
        ))}
      </ol>
    </CapabilityCard>
  );
}
