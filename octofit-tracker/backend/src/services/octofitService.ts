import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function validObjectId(value: unknown): value is string {
  return typeof value === 'string' && mongoose.isValidObjectId(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') throw httpError(400, 'Invalid activity');
  const body = input as Record<string, unknown>;
  if (!validObjectId(body.userId) || !validObjectId(body.teamId)) throw httpError(400, 'Valid userId and teamId are required');
  if (typeof body.type !== 'string' || !body.type.trim()) throw httpError(400, 'Activity type is required');
  if (typeof body.minutes !== 'number' || !Number.isFinite(body.minutes) || body.minutes <= 0) throw httpError(400, 'Minutes must be a positive number');

  const [user, team] = await Promise.all([
    User.findById(body.userId).lean(),
    Team.findById(body.teamId).lean(),
  ]);
  if (!user || !team) throw httpError(400, 'User or team not found');

  return Activity.create({
    user: body.userId,
    team: body.teamId,
    type: body.type.trim(),
    minutes: body.minutes,
    points: body.minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') throw httpError(400, 'Invalid team');
  const body = input as Record<string, unknown>;
  if (typeof body.name !== 'string' || !body.name.trim()) throw httpError(400, 'Team name is required');

  const members = body.members;
  if (members !== undefined && (!Array.isArray(members) || members.some((member) => !validObjectId(member)))) {
    throw httpError(400, 'Team members must be valid user IDs');
  }
  if (Array.isArray(members) && members.length) {
    const count = await User.countDocuments({ _id: { $in: members } });
    if (count !== members.length) throw httpError(400, 'One or more team members do not exist');
  }

  try {
    return await Team.create({
      name: body.name.trim(),
      mascot: body.mascot,
      members: Array.isArray(members) ? members : [],
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) throw httpError(400, error.message);
    throw error;
  }
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
  ]);
  const teams = await Team.find({ _id: { $in: totals.map((entry) => entry._id) } }).lean();
  const teamNames = new Map(teams.map((team) => [team._id.toString(), team.name]));
  return totals
    .map((entry) => ({
      teamName: teamNames.get(entry._id.toString()) ?? 'Unknown team',
      totalPoints: entry.totalPoints,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.teamName.localeCompare(b.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const email = decodeURIComponent(userEmail);
  const user = await User.findOne({ email }).lean();
  if (!user) throw httpError(404, 'User not found');

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  let focus = user.fitnessGoal?.toLowerCase();
  if (recentActivity?.type) {
    const type = recentActivity.type.toLowerCase();
    if (type.includes('run') || type.includes('cycle') || type.includes('walk')) focus = 'endurance';
    else if (type.includes('strength') || type.includes('weight')) focus = 'strength';
  }

  const matching = focus
    ? await Workout.find({ focus: { $regex: `^${focus}$`, $options: 'i' } }).lean()
    : [];
  const fallbacks = matching.length ? matching : await Workout.find().lean();
  return fallbacks.map((workout) => ({
    ...workout,
    reason: recentActivity
      ? `Matches your recent ${recentActivity.type} activity and ${focus ?? 'fitness'} goal`
      : `Matches your ${focus ?? 'fitness'} goal`,
  }));
}

export { User };
