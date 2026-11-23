import { useEffect, useState } from 'react';
import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Workout = { title: string; focus?: string; minutes?: number; difficulty?: string; reason?: string };

export default function Workouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const email = encodeURIComponent('mona@example.com');
    getJson<{ suggestions: Workout[] }>(`/api/workouts/suggestions/${email}`)
      .then((data) => setWorkouts(data.suggestions))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load workout suggestions'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loading={loading}
      error={error}
      isEmpty={workouts.length === 0}
      emptyText="No workout suggestions available."
    >
      <ul className="list-group">
        {workouts.map((workout, index) => (
          <li className="list-group-item" key={index}>
            <strong>{workout.title}</strong>
            {workout.reason ? ` - ${workout.reason}` : ''}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
