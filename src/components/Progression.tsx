import { useEffect, useState } from "react";
import { claimMissionReward, getProgressionDashboard, type ProgressionDashboard } from "../supabase/repository";

export default function Progression({ configured, signedIn, openAccount }: { configured: boolean; signedIn: boolean; openAccount: () => void }) {
  const [dashboard, setDashboard] = useState<ProgressionDashboard | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState("");
  const [busyMission, setBusyMission] = useState("");

  const load = () => {
    if (!configured || !signedIn) return;
    setState("loading");
    void getProgressionDashboard().then((data) => {
      setDashboard(data);
      setState("ready");
      setError("");
    }).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : "Could not load progression.");
      setState("error");
    });
  };

  useEffect(load, [configured, signedIn]);

  const claim = (missionId: string) => {
    setBusyMission(missionId);
    void claimMissionReward(missionId).then((data) => {
      setDashboard(data);
      setError("");
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "The mission reward could not be claimed."))
      .finally(() => setBusyMission(""));
  };

  if (!configured || !signedIn) {
    return <><div className="page-title"><div><span className="eyebrow">DRIP CHECK NAIJA / PROGRESSION</span><h1>Build your crown.</h1><p>Live progression is available only with an authenticated Supabase account.</p></div></div>
      <section className="empty"><b>DEMO MODE</b><h2>No permanent XP or rewards</h2><p>Sign in and apply the progression migration to use server-authoritative levels, missions, streaks and leaderboards.</p><button className="button" onClick={openAccount}>{configured ? "OPEN ACCOUNT" : "VIEW SETUP"}</button></section></>;
  }

  if (state === "loading" || state === "idle") return <><div className="page-title"><div><span className="eyebrow">DRIP CHECK NAIJA / PROGRESSION</span><h1>Build your crown.</h1></div></div><section className="empty"><b>…</b><h2>Loading progression</h2></section></>;
  if (state === "error") return <><div className="page-title"><div><span className="eyebrow">DRIP CHECK NAIJA / PROGRESSION</span><h1>Build your crown.</h1></div></div><section className="empty"><b>!</b><h2>Could not load progression</h2><p>{error}</p><button className="button quiet" onClick={load}>RETRY</button></section></>;
  if (!dashboard) return null;

  const xpPercent = Math.min(100, Math.round((dashboard.profile.levelXp / dashboard.profile.nextLevelXp) * 100));
  const daily = dashboard.missions.filter((mission) => mission.scope === "daily");
  const weekly = dashboard.missions.filter((mission) => mission.scope === "weekly");
  return <>
    <div className="page-title"><div><span className="eyebrow">DRIP CHECK NAIJA / PROGRESSION</span><h1>Build your crown.</h1><p>Server-authoritative XP, missions, streaks and achievements.</p></div></div>
    {error && <div className="mall-banner">{error}</div>}
    <section className="progression-grid">
      <article className="progress-card level-card">
        <span className="eyebrow">CURRENT LEVEL</span><h2>Level {dashboard.profile.level}</h2>
        <div className="xp-line"><span>{dashboard.profile.levelXp} XP</span><span>{dashboard.profile.nextLevelXp} XP</span></div>
        <div className="progress-track"><i style={{ width: `${xpPercent}%` }} /></div>
        <p>{dashboard.profile.nextLevelXp - dashboard.profile.levelXp} XP to the next level</p>
      </article>
      <article className="progress-card">
        <span className="eyebrow">LOGIN STREAK</span><h2>{dashboard.streak.current_streak} days</h2>
        <p>Longest streak: {dashboard.streak.longest_streak} days</p>
        <p>Next milestone: {dashboard.streak.current_streak < 7 ? "7 days" : "14 days"}</p>
      </article>
    </section>
    <section className="section-heading"><div><span className="eyebrow">DAILY MISSIONS</span><h2>Reset at 12:00 AM Lagos</h2></div></section>
    <div className="mission-grid">{daily.map((mission) => <MissionCard key={mission.id} mission={mission} busy={busyMission === mission.id} claim={claim}/>)}</div>
    <section className="section-heading"><div><span className="eyebrow">WEEKLY MISSIONS</span><h2>Reset Monday at 12:00 AM Lagos</h2></div></section>
    <div className="mission-grid">{weekly.map((mission) => <MissionCard key={mission.id} mission={mission} busy={busyMission === mission.id} claim={claim}/>)}</div>
    <section className="progression-grid lower-grid">
      <article className="progress-card"><span className="eyebrow">ACHIEVEMENTS</span><div className="achievement-list">{dashboard.achievements.map((item) => <div className={item.unlockedAt ? "achievement unlocked" : "achievement"} key={item.code}><b>{item.icon}</b><div><strong>{item.name}</strong><p>{item.description}</p></div><small>{item.unlockedAt ? item.rarity || "Unlocked" : "Locked"}</small></div>)}</div></article>
      <article className="progress-card"><span className="eyebrow">RECENT XP</span>{dashboard.events.length ? <div className="event-list">{dashboard.events.slice(0, 8).map((event, index) => <p key={`${event.eventType}-${index}`}><span>{event.eventType.replaceAll("_", " ")}</span><b>+{event.xp} XP</b></p>)}</div> : <p>No XP activity yet.</p>}</article>
    </section>
    <section className="progression-grid lower-grid">
      <article className="progress-card"><span className="eyebrow">LIVE LEADERBOARD</span><div className="leaderboard">{dashboard.leaderboard.map((player, index) => <p key={player.publicId}><span><b>#{index + 1}</b> {player.username}</span><strong>Lv. {player.level}</strong></p>)}</div></article>
      <article className="progress-card"><span className="eyebrow">REWARD VAULT</span><div className="empty small-empty"><b>—</b><h2>No claims configured</h2><p>Mission XP rewards are active. Inventory, cosmetic and title rewards remain disabled until a secure grant table and RPC exist.</p></div></article>
    </section>
  </>;
}

function MissionCard({ mission, busy, claim }: { mission: ProgressionDashboard["missions"][number]; busy: boolean; claim: (id: string) => void }) {
  const percent = Math.min(100, Math.round((mission.progress / mission.target) * 100));
  return <article className="mission-card"><div className="mission-heading"><span className="eyebrow">{mission.scope}</span><b>+{mission.xpReward} XP</b></div><h3>{mission.title}</h3><p>{mission.description}</p><div className="xp-line"><span>{mission.progress} / {mission.target}</span><span>{mission.completed ? "Complete" : "In progress"}</span></div><div className="progress-track"><i style={{ width: `${percent}%` }} /></div>{mission.completed && <button className="button" disabled={busy || Boolean(mission.claimedAt)} onClick={() => claim(mission.id)}>{mission.claimedAt ? "CLAIMED" : busy ? "CLAIMING…" : "CLAIM REWARD"}</button>}</article>;
}
