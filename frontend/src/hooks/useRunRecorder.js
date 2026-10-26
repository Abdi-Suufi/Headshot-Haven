import { useCallback, useState } from 'react';
import { linkRunToServer, recordRun } from '../lib/stats';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { sound } from '../lib/audio';

/**
 * Saves a finished run locally (always) and to the global leaderboard (when signed in).
 * `remote.state` is one of: idle | saving | saved | error | guest | offline.
 */
export function useRunRecorder() {
  const { user, backend } = useAuth();
  const [local, setLocal] = useState(null);
  const [remote, setRemote] = useState({ state: 'idle' });

  const record = useCallback(
    async ({ game, variant, score, data }) => {
      const result = recordRun({ game, variant, score, data });
      setLocal(result);
      if (result.isPersonalBest && result.previousBest != null) sound.play('highscore', { gain: 0.6 });

      if (!backend.online) {
        setRemote({ state: 'offline' });
        return result;
      }
      if (!user) {
        setRemote({ state: 'guest' });
        return result;
      }
      setRemote({ state: 'saving' });
      try {
        const res = await api.submitScore(game, { score, variant, gameData: data });
        linkRunToServer(result.run.id, res.score.id);
        setRemote({ state: 'saved', rank: res.rank, best: res.userBest });
      } catch (err) {
        setRemote({ state: 'error', message: err.message });
      }
      return result;
    },
    [user, backend.online],
  );

  const reset = useCallback(() => {
    setLocal(null);
    setRemote({ state: 'idle' });
  }, []);

  return { record, reset, local, remote };
}
