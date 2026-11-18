import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Character, Look } from "../avatar/catalog";
import type { ActiveFashionItem, OwnedFashionItem } from "../supabase/repository";
import type { Database } from "../supabase/database.types";

type Profile = Database["public"]["Tables"]["player_profiles"]["Row"];
type State = "idle" | "loading" | "ready" | "error";
type Props = {
  configured: boolean;
  configurationMessage: string | null;
  session: Session | null;
  authLoading: boolean;
  authBusy: boolean;
  authMessage: string;
  authError: string;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  continueDemo: () => void;
  profile: Profile | null;
  profileState: State;
  profileError: string;
  retryProfile: () => void;
  saveProfile: (values: Pick<Profile, "username" | "bio" | "country">) => Promise<void>;
  avatar: Record<Character, Look> | null;
  avatarState: State;
  avatarError: string;
  retryAvatar: () => void;
  saveAvatar: () => Promise<void>;
  applyAvatar: () => void;
  catalog: ActiveFashionItem[];
  catalogState: State;
  catalogError: string;
  retryCatalog: () => void;
  inventory: OwnedFashionItem[];
  inventoryState: State;
  inventoryError: string;
  retryInventory: () => void;
  cloudOutfitCount: number;
};

export default function Account(props: Props) {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    setUsername(props.profile?.username ?? "");
    setBio(props.profile?.bio ?? "");
    setCountry(props.profile?.country ?? "");
  }, [props.profile]);

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === "signUp") await props.signUp(email.trim(), password);
    else await props.signIn(email.trim(), password);
  };

  const submitProfile = async (event: FormEvent) => {
    event.preventDefault();
    await props.saveProfile({ username: username.trim(), bio: bio.trim() || null, country: country.trim() || null });
  };

  return <><div className="page-title"><div><span className="eyebrow">DRIP CHECK NAIJA / ACCOUNT</span><h1>Your account.</h1><p>Sign in to sync your profile, avatar, and saved outfits.</p></div><span className={props.configured ? "connection-chip connected" : "connection-chip"}>{props.configured ? "SUPABASE READY" : "DEMO MODE"}</span></div>
    {!props.configured && <section className="account-panel setup-notice"><span className="eyebrow">CLOUD SETUP</span><h2>Keep playing locally.</h2><p>{props.configurationMessage}</p><p>Local Studio, wardrobe, and demo features remain available without a Supabase project.</p><button className="button" onClick={props.continueDemo}>CONTINUE IN DEMO MODE</button></section>}
    {props.configured && !props.session && <section className="account-panel auth-panel"><div className="auth-tabs"><button className={mode === "signIn" ? "selected" : ""} onClick={() => setMode("signIn")}>SIGN IN</button><button className={mode === "signUp" ? "selected" : ""} onClick={() => setMode("signUp")}>CREATE ACCOUNT</button></div><h2>{mode === "signIn" ? "Welcome back." : "Join the style circle."}</h2><p>Use your email and password to access your cloud wardrobe.</p>{props.authLoading && <p role="status">Restoring your saved session…</p>}<form onSubmit={submitAuth}><label htmlFor="auth-email">EMAIL</label><input id="auth-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com"/><label htmlFor="auth-password">PASSWORD</label><input id="auth-password" type="password" autoComplete={mode === "signUp" ? "new-password" : "current-password"} minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters"/><button className="button" disabled={props.authBusy || props.authLoading}>{props.authBusy ? "PLEASE WAIT…" : mode === "signUp" ? "CREATE ACCOUNT" : "SIGN IN"}</button></form>{props.authError && <p className="inline-error" role="alert">{props.authError}</p>}{props.authMessage && <p className="inline-success" role="status">{props.authMessage}</p>}<button className="text-btn" onClick={props.continueDemo}>CONTINUE IN DEMO MODE</button></section>}
    {props.session && <><section className="account-panel account-summary"><div><span className="eyebrow">SIGNED IN</span><h2>{props.session.user.email}</h2><p>Cloud data is scoped to this account. Local drafts remain on this device.</p></div><button className="button quiet" disabled={props.authBusy} onClick={() => void props.signOut()}>{props.authBusy ? "PLEASE WAIT…" : "SIGN OUT"}</button></section>
      <section className="account-grid">
        <article className="account-panel"><span className="eyebrow">PLAYER PROFILE</span><h2>Profile details</h2>{props.profileState === "loading" && <p>Loading your profile…</p>}{props.profileState === "error" && <><p className="inline-error" role="alert">{props.profileError}</p><button className="text-btn" onClick={props.retryProfile}>RETRY PROFILE</button></>}{props.profileState === "ready" && !props.profile && <><p className="inline-error">Profile is not available yet.</p><button className="text-btn" onClick={props.retryProfile}>RETRY PROFILE</button></>}{props.profileState === "ready" && props.profile && <form className="cloud-form" onSubmit={submitProfile}><label htmlFor="cloud-username">USERNAME</label><input id="cloud-username" minLength={3} maxLength={20} pattern="[A-Za-z0-9_]+" required value={username} onChange={(event) => setUsername(event.target.value)}/><label htmlFor="cloud-bio">BIO</label><textarea id="cloud-bio" maxLength={280} value={bio} onChange={(event) => setBio(event.target.value)}/><p className="account-note">Username and bio are visible on public Drip City profiles. Country stays private.</p><label htmlFor="cloud-country">COUNTRY</label><input id="cloud-country" maxLength={80} value={country} onChange={(event) => setCountry(event.target.value)}/><p className="account-note">Level {props.profile.level} · {props.profile.xp} XP</p><button className="button">SAVE PROFILE</button></form>}</article>
        <article className="account-panel"><span className="eyebrow">AVATAR SYNC</span><h2>Your Studio looks</h2>{props.avatarState === "loading" && <p>Checking for a saved cloud avatar…</p>}{props.avatarState === "error" && <><p className="inline-error" role="alert">{props.avatarError}</p><button className="text-btn" onClick={props.retryAvatar}>RETRY AVATAR</button></>}{props.avatarState === "ready" && <><p>{props.avatar ? "A cloud appearance is available. Apply it only when you are ready; it will replace both active local looks." : "No cloud avatar yet. Your local Studio looks are unchanged."}</p><div className="cloud-actions">{props.avatar && <button className="button quiet" onClick={props.applyAvatar}>APPLY CLOUD AVATAR</button>}<button className="button" onClick={() => void props.saveAvatar()}>SAVE CURRENT LOOKS TO CLOUD</button></div></>}</article>
        <article className="account-panel"><span className="eyebrow">PUBLIC CATALOGUE</span><h2>Fashion items</h2>{props.catalogState === "loading" && <p>Loading active catalogue…</p>}{props.catalogState === "error" && <><p className="inline-error" role="alert">{props.catalogError}</p><button className="text-btn" onClick={props.retryCatalog}>RETRY CATALOGUE</button></>}{props.catalogState === "ready" && <p>{props.catalog.length} active catalogue items available to the Studio. Catalogue writes are disabled from this app.</p>}</article>
        <article className="account-panel"><span className="eyebrow">YOUR INVENTORY</span><h2>{props.inventory.length} items</h2>{props.inventoryState === "loading" && <p>Loading your inventory…</p>}{props.inventoryState === "error" && <><p className="inline-error" role="alert">{props.inventoryError}</p><button className="text-btn" onClick={props.retryInventory}>RETRY INVENTORY</button></>}{props.inventoryState === "ready" && <>{props.inventory.length ? <ul className="inventory-list">{props.inventory.map((item) => <li key={item.id}><b>{item.name}</b><span>{item.category}</span></li>)}</ul> : <p>No granted items yet. The client cannot grant inventory items.</p>}</>}</article>
        <article className="account-panel"><span className="eyebrow">CLOUD WARDROBE</span><h2>{props.cloudOutfitCount} saved outfits</h2><p>Cloud outfits are listed alongside local drafts in Wardrobe. Local-only drafts are never uploaded automatically.</p></article>
      </section>
    </>}
  </>;
}
