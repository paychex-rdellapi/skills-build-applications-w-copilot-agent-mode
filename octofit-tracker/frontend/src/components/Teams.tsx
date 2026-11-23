import { useEffect, useState } from 'react';
import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Team = { name: string; mascot?: string; members: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => setTeams(data.teams))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load teams'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      loading={loading}
      error={error}
      isEmpty={teams.length === 0}
      emptyText="No teams found."
    >
      <ul className="list-group">
        {teams.map((team, index) => (
          <li className="list-group-item" key={index}>
            <strong>{team.name}</strong>{team.mascot ? ` - ${team.mascot}` : ''}
            {team.members?.length ? ` (${team.members.join(', ')})` : ''}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
