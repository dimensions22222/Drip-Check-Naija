import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Character, Look } from "../avatar/catalog";
import { defaultLooks, normalizeLook } from "../avatar/catalog";
import AvatarRenderer from "../avatar/AvatarRenderer";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../supabase/client";
import type { RemoteCityPlayer } from "./PhaserWorld";
import type {
  CityChatMessage,
  FashionCatalogueItem,
  OutfitPreset,
  PublicPlayer,
  PublicShowcase,
  PlayerConnection,
} from "../supabase/repository";
import {
  getPlayerConnections,
  listPublicPlayers,
  listPublicShowcases,
  listCityChatMessages,
  loadPublicProfile,
  publishShowcase,
  publicAvatarFromProfile,
  removeShowcase,
  reportPlayer,
  sendCityChatMessage,
  setPlayerBlock,
  setPlayerMute,
  setPlayerFollow,
  setShowcaseLike,
} from "../supabase/repository";

const PhaserWorld = lazy(() => import("./PhaserWorld"));

type Section = "hub" | "explore" | "players" | "fits" | "profile" | "chat";
type RemoteState = "idle" | "loading" | "ready" | "error";
type DemoPlayer = {
  publicId: string;
  username: string;
  bio: string;
  character: Character;
  look: Look;
  sampleAchievement: string;
  sampleFit: string;
  demo: true;
};
type DemoShowcase = PublicShowcase & { demo: true };
type CityPlayer = PublicPlayer | DemoPlayer;

const locations = [
  { id: "lagos-fashion-district", name: "Lagos Fashion District", tag: "THE STYLE CAPITAL", icon: "✦", note: "Runway energy, street-level confidence." },
  { id: "mainland-hangout", name: "The Mainland Hangout", tag: "COMMUNITY SQUARE", icon: "◉", note: "Catch a breather between fresh fits." },
  { id: "island-style-avenue", name: "Island Style Avenue", tag: "THE LOOKOUT", icon: "↗", note: "Big-city silhouettes and bright lights." },
  { id: "campus-plaza", name: "Campus Plaza", tag: "CAMPUS CORNER", icon: "▤", note: "Young creatives set the next trend." },
  { id: "naija-market", name: "The Naija Market", tag: "MARKET STREET", icon: "◇", note: "Colour, craft, and market-day finds." },
  { id: "rooftop-lounge", name: "The Rooftop Lounge", tag: "AFTER HOURS", icon: "☾", note: "A laid-back spot above the city." },
];

const demoPlayers: DemoPlayer[] = [
  { publicId: "demo-lola", username: "Lola Luxe", bio: "Lagos colour, always.", character: "femme", look: defaultLooks.femme, sampleAchievement: "Sample badge: Night Owl", sampleFit: "After-hours lavender", demo: true },
  { publicId: "demo-timi", username: "Timi Threads", bio: "Mainland-made, style-led.", character: "masc", look: defaultLooks.masc, sampleAchievement: "Sample badge: Fresh Pair", sampleFit: "Mainland tangerine", demo: true },
  { publicId: "demo-zara", username: "Zara Zest", bio: "A little print, a lot of joy.", character: "femme", look: { ...defaultLooks.femme, top: "top-orange", bottom: "bottom-skirt", expression: "happy" }, sampleAchievement: "Sample badge: Colour Pop", sampleFit: "Market-day colour", demo: true },
  { publicId: "demo-kunle", username: "Kunle Kicks", bio: "Clean lines and crisp sneakers.", character: "masc", look: { ...defaultLooks.masc, top: "top-mint", shoes: "shoe-runner" }, sampleAchievement: "Sample badge: Street Ready", sampleFit: "Mint on the move", demo: true },
];

const demoShowcases: DemoShowcase[] = demoPlayers.slice(0, 3).map((player, index) => ({
  id: `demo-fit-${index}`,
  playerPublicId: player.publicId,
  username: player.username,
  title: player.sampleFit,
  character: player.character,
  look: player.look,
  publishedAt: "",
  likeCount: 0,
  viewerLiked: false,
  demo: true,
}));

const isDemoPlayer = (player: CityPlayer): player is DemoPlayer => "demo" in player;
const fitDate = (date: string) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(date));

type Props = {
  configured: boolean;
  signedIn: boolean;
  displayName: string;
  displayNameIsReal: boolean;
  character: Character;
  look: Look;
  savedOutfits: OutfitPreset[];
  myPublicId: string | null;
  avatarSaved: boolean;
  avatarPublic: boolean;
  catalog: readonly FashionCatalogueItem[];
  openAccount: () => void;
  openStudio: () => void;
  setNotice: (message: string) => void;
  onAvatarPublicChange: (value: boolean) => Promise<void>;
};

export default function DripCity(props: Props) {
  const [section, setSection] = useState<Section>("hub");
  const [featuredPlayers, setFeaturedPlayers] = useState<CityPlayer[]>([]);
  const [featuredFits, setFeaturedFits] = useState<Array<PublicShowcase | DemoShowcase>>([]);
  const [featuredError, setFeaturedError] = useState("");
  const [search, setSearch] = useState("");
  const [playerOffset, setPlayerOffset] = useState(0);
  const [players, setPlayers] = useState<CityPlayer[]>([]);
  const [hasMorePlayers, setHasMorePlayers] = useState(false);
  const [playersState, setPlayersState] = useState<RemoteState>("idle");
  const [playersError, setPlayersError] = useState("");
  const [selectedPublicId, setSelectedPublicId] = useState<string | null>(null);
  const [selectedDemo, setSelectedDemo] = useState<DemoPlayer | null>(null);
  const [viewedProfile, setViewedProfile] = useState<PublicPlayer | null>(null);
  const [profileState, setProfileState] = useState<RemoteState>("idle");
  const [profileError, setProfileError] = useState("");
  const [profileFits, setProfileFits] = useState<Array<PublicShowcase | DemoShowcase>>([]);
  const [profileFitsState, setProfileFitsState] = useState<RemoteState>("idle");
  const [profileFitsError, setProfileFitsError] = useState("");
  const [connectionType, setConnectionType] = useState<"followers" | "following" | null>(null);
  const [connections, setConnections] = useState<PlayerConnection[]>([]);
  const [connectionsState, setConnectionsState] = useState<RemoteState>("idle");
  const [connectionsError, setConnectionsError] = useState("");
  const [showcases, setShowcases] = useState<Array<PublicShowcase | DemoShowcase>>([]);
  const [showcasesState, setShowcasesState] = useState<RemoteState>("idle");
  const [showcasesError, setShowcasesError] = useState("");
  const [showcaseOffset, setShowcaseOffset] = useState(0);
  const [hasMoreShowcases, setHasMoreShowcases] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [busyIds, setBusyIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [roomId, setRoomId] = useState(locations[0].id);
  const [realtimeStatus, setRealtimeStatus] = useState<"offline" | "connecting" | "connected" | "error">("offline");
  const [remotePlayers, setRemotePlayers] = useState<RemoteCityPlayer[]>([]);
  const [chatMessages, setChatMessages] = useState<CityChatMessage[]>([]);
  const [chatText, setChatText] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState("");
  const [moderationBusy, setModerationBusy] = useState(false);
  const realtimeChannel = useRef<RealtimeChannel | null>(null);

  const ownFits = useMemo(
    () => props.savedOutfits.filter((outfit) => outfit.source === "cloud"),
    [props.savedOutfits],
  );

  const sendPosition = useCallback((position: { x: number; y: number }) => {
    void realtimeChannel.current?.send({
      type: "broadcast",
      event: "position",
      payload: {
        publicId: props.myPublicId,
        username: props.displayName,
        character: props.character,
        look: props.look,
        x: position.x,
        y: position.y,
      },
    });
  }, [props.character, props.displayName, props.look, props.myPublicId]);

  useEffect(() => {
    let active = true;
    setChatMessages([]);
    setChatError("");
    if (!props.configured || !props.signedIn || !props.myPublicId) {
      setRemotePlayers([]);
      setRealtimeStatus("offline");
      return () => { active = false; };
    }
    if (!supabase) {
      setRealtimeStatus("error");
      return () => { active = false; };
    }

    setRealtimeStatus("connecting");
    void listCityChatMessages(roomId).then((messages) => {
      if (active) setChatMessages(messages);
    }).catch((error: unknown) => {
      if (active) setChatError(error instanceof Error ? error.message : "Could not load room chat.");
    });

    const channel = supabase.channel(`drip-city:${roomId}`, {
      config: { broadcast: { ack: false, self: false }, presence: { key: props.myPublicId } },
    });
    realtimeChannel.current = channel;

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const next: RemoteCityPlayer[] = [];
      Object.values(state).forEach((entries) => {
        entries.forEach((entry) => {
          const payload = entry as unknown as Record<string, unknown>;
          const publicId = payload.publicId;
          const username = payload.username;
          const character = payload.character;
          const look = payload.look;
          const x = payload.x;
          const y = payload.y;
          if (typeof publicId !== "string" || publicId === props.myPublicId) return;
          if (typeof username !== "string") return;
          if (character !== "femme" && character !== "masc") return;
          if (!look || typeof look !== "object" || typeof x !== "number" || typeof y !== "number") return;
          next.push({
            publicId,
            username,
            character,
            look: normalizeLook(look as Partial<Look>, character),
            x,
            y,
          });
        });
      });
      setRemotePlayers(next);
    });

    channel.on("broadcast", { event: "position" }, ({ payload }) => {
      if (!payload || typeof payload !== "object") return;
      const record = payload as unknown as Record<string, unknown>;
      const publicId = record.publicId;
      const username = record.username;
      const character = record.character;
      const look = record.look;
      const x = record.x;
      const y = record.y;
      if (typeof publicId !== "string" || publicId === props.myPublicId) return;
      if (typeof username !== "string") return;
      if (character !== "femme" && character !== "masc") return;
      if (!look || typeof look !== "object" || typeof x !== "number" || typeof y !== "number") return;
      setRemotePlayers((current) => {
        const existing = current.find((player) => player.publicId === publicId);
        const nextPlayer: RemoteCityPlayer = {
          publicId,
          username,
          character,
          look: normalizeLook(look as Partial<Look>, character),
          x,
          y,
        };
        return existing
          ? current.map((player) => player.publicId === publicId ? nextPlayer : player)
          : [...current, nextPlayer];
      });
    });

    channel.on("broadcast", { event: "chat" }, ({ payload }) => {
      if (!payload || typeof payload !== "object") return;
      const record = payload as unknown as Record<string, unknown>;
      const id = record.id;
      const senderPublicId = record.senderPublicId;
      const username = record.username;
      const body = record.body;
      const createdAt = record.createdAt;
      if (typeof id !== "string" || typeof senderPublicId !== "string") return;
      if (typeof username !== "string" || typeof body !== "string" || typeof createdAt !== "string") return;
      setChatMessages((current) => current.some((message) => message.id === id)
        ? current
        : [...current, { id, room: roomId, senderPublicId, username, body, createdAt }].slice(-40));
    });

    channel.subscribe((status) => {
      if (!active) return;
      if (status === "SUBSCRIBED") {
        setRealtimeStatus("connected");
        void channel.track({
          publicId: props.myPublicId,
          username: props.displayName,
          character: props.character,
          look: props.look,
          x: 590,
          y: 590,
        });
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        setRealtimeStatus("error");
      } else if (status === "CLOSED") {
        setRealtimeStatus("offline");
      }
    });

    return () => {
      active = false;
      if (realtimeChannel.current === channel) realtimeChannel.current = null;
      void supabase?.removeChannel(channel);
    };
  }, [props.configured, props.signedIn, props.myPublicId, props.displayName, props.character, props.look, roomId]);
  const ownProfileSelected = Boolean(props.myPublicId && selectedPublicId === props.myPublicId);
  const publicPageProfile = selectedDemo ? null : viewedProfile;
  const activeProfileId = selectedDemo?.publicId ?? publicPageProfile?.public_id ?? selectedPublicId;

  useEffect(() => {
    let active = true;
    if (!props.configured) {
      setFeaturedPlayers(demoPlayers.slice(0, 3));
      setFeaturedFits(demoShowcases.slice(0, 3));
      setFeaturedError("");
      return () => { active = false; };
    }
    void Promise.allSettled([listPublicPlayers("", 0, 4), listPublicShowcases(undefined, 0, 4)]).then(([playerResult, fitResult]) => {
      if (!active) return;
      const failures: string[] = [];
      if (playerResult.status === "fulfilled") setFeaturedPlayers(playerResult.value);
      else { setFeaturedPlayers([]); failures.push(playerResult.reason instanceof Error ? playerResult.reason.message : "Could not load featured players."); }
      if (fitResult.status === "fulfilled") setFeaturedFits(fitResult.value);
      else { setFeaturedFits([]); failures.push(fitResult.reason instanceof Error ? fitResult.reason.message : "Could not load trending outfits."); }
      setFeaturedError(failures.join(" "));
    });
    return () => { active = false; };
  }, [props.configured, reloadToken]);

  useEffect(() => {
    if (section !== "players") return;
    let active = true;
    const timer = window.setTimeout(() => {
      if (!props.configured) {
        const matches = demoPlayers.filter((player) => player.username.toLowerCase().includes(search.trim().toLowerCase()));
        setPlayers(matches);
        setHasMorePlayers(false);
        setPlayersState("ready");
        setPlayersError("");
        return;
      }
      setPlayersState("loading");
      void listPublicPlayers(search, playerOffset, 24).then((rows) => {
        if (!active) return;
        setPlayers((current) => playerOffset === 0 ? rows : [...current, ...rows]);
        setHasMorePlayers(rows.length === 24);
        setPlayersState("ready");
        setPlayersError("");
      }).catch((error: unknown) => {
        if (!active) return;
        setPlayersError(error instanceof Error ? error.message : "Could not load player profiles.");
        setPlayersState("error");
      });
    }, search ? 180 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [section, props.configured, search, playerOffset, reloadToken]);

  useEffect(() => {
    if (section !== "profile") return;
    if (selectedDemo) {
      setProfileState("ready");
      setViewedProfile(null);
      setProfileError("");
      setProfileFits(demoShowcases.filter((fit) => fit.playerPublicId === selectedDemo.publicId));
      setProfileFitsState("ready");
      setProfileFitsError("");
      return;
    }
    const publicId = selectedPublicId;
    if (!publicId) {
      setProfileState("ready");
      setViewedProfile(null);
      setProfileFits([]);
      setProfileFitsState("idle");
      return;
    }
    let active = true;
    setProfileState("loading");
    void loadPublicProfile(publicId).then((profile) => {
      if (!active) return;
      if (!profile) {
        setProfileState("error");
        setProfileError("This public player profile could not be found.");
        return;
      }
      setViewedProfile(profile);
      setProfileState("ready");
      setProfileError("");
    }).catch((error: unknown) => {
      if (!active) return;
      setProfileState("error");
      setProfileError(error instanceof Error ? error.message : "Could not load the public player profile.");
    });
    return () => { active = false; };
  }, [section, selectedPublicId, selectedDemo, props.myPublicId]);

  useEffect(() => {
    if (section === "profile" && !selectedPublicId && !selectedDemo && props.myPublicId) {
      setSelectedPublicId(props.myPublicId);
    }
  }, [section, selectedPublicId, selectedDemo, props.myPublicId]);

  useEffect(() => {
    if (section !== "profile" || !activeProfileId) return;
    let active = true;
    if (selectedDemo) {
      setProfileFits(demoShowcases.filter((fit) => fit.playerPublicId === selectedDemo.publicId));
      setProfileFitsState("ready");
      setProfileFitsError("");
      return () => { active = false; };
    }
    setProfileFitsState("loading");
    setProfileFitsError("");
    void listPublicShowcases(activeProfileId, 0, 12).then((rows) => {
      if (active) {
        setProfileFits(rows);
        setProfileFitsState("ready");
      }
    }).catch((error: unknown) => {
      if (active) {
        setProfileFitsError(error instanceof Error ? error.message : "Could not load this player's public outfits.");
        setProfileFitsState("error");
      }
    });
    return () => { active = false; };
  }, [section, activeProfileId, selectedDemo, reloadToken]);

  useEffect(() => {
    if (section !== "fits") return;
    let active = true;
    if (!props.configured) {
      setShowcases(demoShowcases);
      setShowcasesState("ready");
      setShowcasesError("");
      setHasMoreShowcases(false);
      return () => { active = false; };
    }
    setShowcasesState("loading");
    void listPublicShowcases(undefined, showcaseOffset, 12).then((rows) => {
      if (!active) return;
      setShowcases((current) => showcaseOffset === 0 ? rows : [...current, ...rows]);
      setHasMoreShowcases(rows.length === 12);
      setShowcasesState("ready");
      setShowcasesError("");
    }).catch((error: unknown) => {
      if (!active) return;
      setShowcasesError(error instanceof Error ? error.message : "Could not load public outfits.");
      setShowcasesState("error");
    });
    return () => { active = false; };
  }, [section, props.configured, showcaseOffset, reloadToken]);

  const openPlayer = (player: CityPlayer) => {
    setSelectedDemo(isDemoPlayer(player) ? player : null);
    setSelectedPublicId(isDemoPlayer(player) ? player.publicId : player.public_id);
    setViewedProfile(isDemoPlayer(player) ? null : player);
    setProfileFits([]);
    setConnections([]);
    setConnectionType(null);
    setSection("profile");
  };
  const openMyProfile = () => {
    setSelectedDemo(null);
    setSelectedPublicId(props.myPublicId);
    setViewedProfile(null);
    setProfileFits([]);
    setSection("profile");
  };
  const reloadPublicData = () => {
    setPlayerOffset(0);
    setShowcaseOffset(0);
    setReloadToken((token) => token + 1);
  };
  const setBusy = (id: string, busy: boolean) => setBusyIds((ids) => busy ? (ids.includes(id) ? ids : [...ids, id]) : ids.filter((value) => value !== id));

  const followPlayer = async (player: PublicPlayer) => {
    if (!props.signedIn) { props.openAccount(); return; }
    setBusy(player.public_id, true);
    try {
      await setPlayerFollow(player.public_id, !player.viewer_follows);
      const updated = await loadPublicProfile(player.public_id);
      if (updated && selectedPublicId === player.public_id) setViewedProfile(updated);
      reloadPublicData();
    } catch (error) {
      props.setNotice(error instanceof Error ? error.message : "Could not update this follow.");
    } finally { setBusy(player.public_id, false); }
  };

  const toggleLike = async (fit: PublicShowcase | DemoShowcase) => {
    if ("demo" in fit) return;
    if (!props.signedIn) { props.openAccount(); return; }
    setBusy(fit.id, true);
    try {
      await setShowcaseLike(fit.id, !fit.viewerLiked);
      reloadPublicData();
    } catch (error) {
      props.setNotice(error instanceof Error ? error.message : "Could not update this outfit like.");
    } finally { setBusy(fit.id, false); }
  };

  const loadConnections = async (type: "followers" | "following") => {
    if (!props.signedIn || !activeProfileId) { props.openAccount(); return; }
    setConnectionType(type);
    setConnectionsState("loading");
    setConnectionsError("");
    try {
      setConnections(await getPlayerConnections(activeProfileId, type));
      setConnectionsState("ready");
    } catch (error) {
      setConnectionsError(error instanceof Error ? error.message : "Could not load player connections.");
      setConnectionsState("error");
    }
  };

  const publish = async (outfit: OutfitPreset) => {
    if (!props.signedIn) { props.openAccount(); return; }
    const cleanTitle = title.trim() || outfit.name;
    setBusy(outfit.id, true);
    try {
      await publishShowcase(outfit.id, cleanTitle);
      setTitle("");
      props.setNotice("Outfit published to your public showcase.");
      reloadPublicData();
    } catch (error) {
      props.setNotice(error instanceof Error ? error.message : "Could not publish this outfit.");
    } finally { setBusy(outfit.id, false); }
  };

  const unpublish = async (fit: PublicShowcase | DemoShowcase) => {
    if ("demo" in fit || !props.signedIn) return;
    setBusy(fit.id, true);
    try {
      await removeShowcase(fit.id);
      props.setNotice("Outfit removed from your public showcase.");
      reloadPublicData();
    } catch (error) {
      props.setNotice(error instanceof Error ? error.message : "Could not remove this outfit.");
    } finally { setBusy(fit.id, false); }
  };

  const toggleAvatarPublic = async () => {
    if (!props.signedIn || !props.myPublicId) { props.openAccount(); return; }
    if (!props.avatarSaved) { props.setNotice("Save your Studio avatar to your account before sharing it."); return; }
    setAvatarBusy(true);
    try {
      await props.onAvatarPublicChange(!props.avatarPublic);
      reloadPublicData();
      props.setNotice(props.avatarPublic ? "Your avatar is private again." : "Your avatar is now public on your profile.");
    } catch (error) {
      props.setNotice(error instanceof Error ? error.message : "Could not update avatar privacy.");
    } finally { setAvatarBusy(false); }
  };

  const sendChat = async (event: FormEvent) => {
    event.preventDefault();
    if (!props.signedIn) { props.openAccount(); return; }
    const cleanBody = chatText.trim();
    if (!cleanBody) return;
    setChatBusy(true);
    setChatError("");
    try {
      const id = await sendCityChatMessage(roomId, cleanBody);
      const sentMessage: CityChatMessage = {
        id,
        room: roomId,
        senderPublicId: props.myPublicId ?? "",
        username: props.displayName,
        body: cleanBody,
        createdAt: new Date().toISOString(),
      };
      setChatMessages((current) => [...current, sentMessage].slice(-40));
      await realtimeChannel.current?.send({
        type: "broadcast",
        event: "chat",
        payload: {
          id,
          room: roomId,
          senderPublicId: props.myPublicId,
          username: props.displayName,
          body: cleanBody,
          createdAt: new Date().toISOString(),
        },
      });
      setChatText("");
    } catch (error) {
      setChatError(error instanceof Error ? error.message : "Could not send this message.");
    } finally {
      setChatBusy(false);
    }
  };

  const moderatePlayer = async (publicId: string, action: "block" | "mute" | "report") => {
    if (!props.signedIn) { props.openAccount(); return; }
    setModerationBusy(true);
    try {
      if (action === "block") await setPlayerBlock(publicId, true);
      if (action === "mute") await setPlayerMute(publicId, true);
      if (action === "report") await reportPlayer(publicId, "Reported from Drip City", roomId);
      props.setNotice(action === "report" ? "Player report submitted." : `Player ${action}ed.`);
    } catch (error) {
      props.setNotice(error instanceof Error ? error.message : "Moderation action failed.");
    } finally {
      setModerationBusy(false);
    }
  };

  const tabs: [Section, string][] = [["hub", "City hub"], ["explore", "Explore"], ["players", "Players"], ["fits", "Outfit showcase"], ["profile", "My profile"], ["chat", "Chat"]];
  const openShowcasePlayer = (id: string) => {
    const sample = demoPlayers.find((player) => player.publicId === id);
    if (sample) openPlayer(sample);
    else {
      setSelectedDemo(null);
      setSelectedPublicId(id);
      setViewedProfile(null);
      setProfileFits([]);
      setSection("profile");
    }
  };

  return <section className="drip-city">
    <div className="page-title"><div><span className="eyebrow">DRIP CHECK NAIJA / DRIP CITY</span><h1>Your city. Your style.</h1><p>Find your people, show your fit, and explore the neighbourhood.</p></div><span className="city-demo-chip">{props.configured ? "SUPABASE CONFIGURED" : "DEMO CITY · SAMPLE CONTENT"}</span></div>
    <nav className="city-tabs" aria-label="Drip City sections">{tabs.map(([id, label]) => <button key={id} className={section === id ? "selected" : ""} aria-current={section === id ? "page" : undefined} onClick={() => id === "profile" ? openMyProfile() : setSection(id)}>{label}</button>)}</nav>

    {section === "hub" && <div className="city-hub">
      <section className="city-welcome">
        <div className="city-welcome-copy"><span className="eyebrow">YOUR LOOK. YOUR BLOCK.</span><h2>{props.displayNameIsReal ? `Welcome to Drip City, ${props.displayName}.` : "Welcome to Drip City."}</h2><p>{props.configured && props.signedIn ? "Walk a live neighbourhood room, meet authenticated players, and share your look." : "Explore the demo neighbourhood and community looks, or sign in for live multiplayer."}</p><div className="city-welcome-actions"><button className="button" onClick={() => setSection("explore")}>WALK THE CITY →</button><button className="button quiet" onClick={props.openStudio}>EDIT YOUR FIT</button></div><small>{props.configured && props.signedIn ? `LIVE ROOM · ${realtimeStatus.toUpperCase()} · ${locations.find((place) => place.id === roomId)?.name}` : "SINGLE-PLAYER DEMO · NO FABRICATED ONLINE STATUS"}</small></div>
        <div className="city-welcome-avatar"><AvatarRenderer character={props.character} look={props.look}/><span>YOUR AVATAR</span></div>
      </section>
      <div className="city-section-heading"><div><span className="eyebrow">NEIGHBOURHOOD SPOTS</span><h2>Pick your next stop.</h2></div><button className="text-btn" onClick={() => setSection("explore")}>EXPLORE THE MAP →</button></div>
      <section className="city-location-grid">{locations.map((place, index) => <button className={`city-location city-location-${index + 1}`} key={place.name} onClick={() => { setRoomId(place.id); setSection("explore"); }}><span>{place.icon}</span><small>{place.tag} · {props.configured && props.signedIn ? "LIVE ROOM" : "DEMO"}</small><b>{place.name}</b><p>{place.note}</p><i>OPEN DISTRICT →</i></button>)}</section>
      <div className="city-section-heading"><div><span className="eyebrow">{props.configured ? "PUBLIC PLAYER PROFILES" : "DEMO PLAYERS"}</span><h2>People with their own drip.</h2></div><button className="text-btn" onClick={() => setSection("players")}>DISCOVER PLAYERS →</button></div>
      {featuredError && <p className="city-inline-error" role="alert">{featuredError}</p>}
      {featuredPlayers.length ? <section className="city-player-grid">{featuredPlayers.map((player) => <PlayerCard key={isDemoPlayer(player) ? player.publicId : player.public_id} player={player} catalog={props.catalog} signedIn={props.signedIn} myPublicId={props.myPublicId} busy={busyIds.includes(isDemoPlayer(player) ? player.publicId : player.public_id)} onOpen={() => openPlayer(player)} onFollow={() => !isDemoPlayer(player) && void followPlayer(player)} openAccount={props.openAccount}/>)}</section> : props.configured && !featuredError ? <p className="city-muted">No public profiles to feature yet.</p> : null}
      <div className="city-section-heading"><div><span className="eyebrow">{props.configured ? "TRENDING · PUBLIC LIKES" : "DEMO OUTFITS"}</span><h2>Fits making the rounds.</h2></div><button className="text-btn" onClick={() => setSection("fits")}>BROWSE THE SHOWCASE →</button></div>
      {featuredFits.length ? <section className="city-fit-grid">{featuredFits.map((fit) => <FitCard key={fit.id} fit={fit} catalog={props.catalog} busy={busyIds.includes(fit.id)} signedIn={props.signedIn} onLike={() => void toggleLike(fit)} onPlayer={() => openShowcasePlayer(fit.playerPublicId)} openAccount={props.openAccount}/>)}</section> : props.configured && !featuredError ? <p className="city-muted">No outfits have been published yet.</p> : null}
      <section className="city-chat-teaser"><div><span className="eyebrow">COMMUNITY CHAT</span><h2>{props.configured && props.signedIn ? "Talk in your current city room." : "Sign in to join community chat."}</h2><p>{props.configured && props.signedIn ? `${locations.find((place) => place.id === roomId)?.name} · ${realtimeStatus.toUpperCase()}` : "Messages are unavailable until authentication is configured. Demo content never appears as real chat."}</p></div><button className="button quiet" onClick={() => setSection("chat")}>{props.configured && props.signedIn ? "OPEN CHAT" : "CHAT STATUS"}</button></section>
      <div className="city-demo-battle">Fashion Battles are currently a separate demo experience. There are no connected active battles or live placements to show here.</div>
    </div>}

    {section === "explore" && <section className="city-explore">
      <div className="city-explore-heading"><div><span className="eyebrow">{locations.find((place) => place.id === roomId)?.name.toUpperCase()} · {props.configured && props.signedIn ? realtimeStatus.toUpperCase() : "DEMO"}</span><h2>Take a walk through the neighbourhood.</h2><p>{props.configured && props.signedIn ? "Authenticated players in this room appear as real presence; movement is broadcast live." : "Move around the single-player map. No fabricated players or online status are shown."}</p></div><span className="city-control-hint">WASD / ARROWS</span></div>
      <Suspense fallback={<div className="phaser-loading" role="status">Preparing the city map…</div>}><PhaserWorld character={props.character} look={props.look} multiplayerEnabled={props.configured && props.signedIn} remotePlayers={remotePlayers} onPositionChange={sendPosition}/></Suspense>
      <div className="city-map-note"><b>MAP KEY</b><span><i className="map-key-building"/>Fashion destinations</span><span><i className="map-key-path"/>Walkable streets</span><span><i className="map-key-player"/>Your avatar marker</span></div>
      <div className="city-destination-list">{locations.map((place) => <button key={place.name} className={roomId === place.id ? "selected" : ""} onClick={() => setRoomId(place.id)}><b>{place.name}</b><span>{roomId === place.id ? "CURRENT ROOM" : props.configured && props.signedIn ? "OPEN LIVE ROOM" : "DEMO LOCATION"}</span></button>)}</div>
    </section>}

    {section === "players" && <section className="city-page-panel">
      <div className="city-page-heading"><div><span className="eyebrow">{props.configured ? "PUBLIC PROFILES" : "SAMPLE PROFILES"}</span><h2>Find your fashion people.</h2><p>{props.configured ? "Only public profile fields are shown. Email and auth account IDs are never returned." : "Sample characters are demo content; follows, likes, and activity are not simulated."}</p></div><label className="city-search"><span aria-hidden="true">⌕</span><input aria-label="Search players by display name" type="search" maxLength={40} placeholder="Search display name" value={search} onChange={(event) => { setSearch(event.target.value); setPlayerOffset(0); }}/></label></div>
      {playersState === "loading" && <p className="city-muted" role="status">Finding public players…</p>}
      {playersState === "error" && <p className="city-inline-error" role="alert">{playersError} <button className="text-btn" onClick={reloadPublicData}>RETRY</button></p>}
      {playersState === "ready" && players.length === 0 && <div className="city-empty"><h3>No matching players.</h3><p>Try another display name.</p></div>}
      <section className="city-player-grid">{players.map((player) => <PlayerCard key={isDemoPlayer(player) ? player.publicId : player.public_id} player={player} catalog={props.catalog} signedIn={props.signedIn} myPublicId={props.myPublicId} busy={busyIds.includes(isDemoPlayer(player) ? player.publicId : player.public_id)} onOpen={() => openPlayer(player)} onFollow={() => !isDemoPlayer(player) && void followPlayer(player)} openAccount={props.openAccount}/>)}</section>
      {playersState === "ready" && hasMorePlayers && <button className="button quiet city-load-more" onClick={() => setPlayerOffset(players.length)}>LOAD MORE PLAYERS</button>}
    </section>}

    {section === "fits" && <section className="city-page-panel">
      <div className="city-page-heading"><div><span className="eyebrow">{props.configured ? "PUBLIC OUTFIT SHOWCASE" : "DEMO OUTFIT SHOWCASE"}</span><h2>Looks players choose to share.</h2><p>{props.configured ? "Like counts are read from the database. Only explicitly published saved outfits appear here." : "Sample looks are clearly marked demo; likes are disabled and no activity is recorded."}</p></div></div>
      {props.configured && <section className="city-publish-panel"><div><span className="eyebrow">YOUR SHOWCASE</span><h3>Publish one of your cloud outfits.</h3><p>Local-only drafts stay private on this device. The server verifies ownership and item access before publishing.</p></div>{!props.signedIn ? <button className="button" onClick={props.openAccount}>SIGN IN TO PUBLISH</button> : ownFits.length ? <div className="city-publish-tools"><input aria-label="Public showcase title" maxLength={40} placeholder="Optional public title" value={title} onChange={(event) => setTitle(event.target.value)}/><div className="city-publish-list">{ownFits.map((outfit) => <article key={outfit.id}><div><b>{outfit.name}</b><span>{outfit.character === "femme" ? "Femme" : "Masc"} · cloud outfit</span></div><button className="button" disabled={busyIds.includes(outfit.id)} onClick={() => void publish(outfit)}>{busyIds.includes(outfit.id) ? "PUBLISHING…" : "PUBLISH"}</button></article>)}</div></div> : <p className="city-muted">Save or sync an outfit to your cloud wardrobe before publishing.</p>}</section>}
      {showcasesState === "loading" && <p className="city-muted" role="status">Loading public outfits…</p>}
      {showcasesState === "error" && <p className="city-inline-error" role="alert">{showcasesError} <button className="text-btn" onClick={reloadPublicData}>RETRY</button></p>}
      {showcasesState === "ready" && showcases.length === 0 && <div className="city-empty"><h3>No public fits yet.</h3><p>Players can publish cloud outfits above. Private wardrobe saves are not listed.</p></div>}
      <section className="city-fit-grid">{showcases.map((fit) => <FitCard key={fit.id} fit={fit} catalog={props.catalog} busy={busyIds.includes(fit.id)} signedIn={props.signedIn} onLike={() => void toggleLike(fit)} onPlayer={() => openShowcasePlayer(fit.playerPublicId)} openAccount={props.openAccount} onRemove={fit.playerPublicId === props.myPublicId ? () => void unpublish(fit) : undefined}/>)}</section>
      {showcasesState === "ready" && hasMoreShowcases && <button className="button quiet city-load-more" onClick={() => setShowcaseOffset(showcases.length)}>LOAD MORE OUTFITS</button>}
    </section>}

    {section === "profile" && <section className="city-page-panel">
      <div className="city-page-heading"><div><span className="eyebrow">{selectedDemo ? "DEMO PLAYER PROFILE" : "PUBLIC PLAYER PROFILE"}</span><h2>{selectedDemo?.username ?? publicPageProfile?.username ?? (ownProfileSelected ? props.displayName : "Player profile")}</h2><p>{selectedDemo ? "Sample character · demo profile" : "Public fields only. Private account IDs, email, and unsaved wardrobe drafts are never displayed."}</p></div><button className="button quiet" onClick={() => setSection("players")}>← PLAYERS</button></div>
      {profileState === "loading" && <p className="city-muted" role="status">Loading public profile…</p>}
      {profileState === "error" && <p className="city-inline-error" role="alert">{profileError}</p>}
      {!selectedPublicId && !selectedDemo && <div className="city-empty"><h3>{props.signedIn ? "Your profile is not ready." : "Sign in to view your public profile."}</h3><p>{props.signedIn ? "Open Account to retry loading your cloud profile." : "A public profile is available after you create an account."}</p><button className="button quiet" onClick={props.openAccount}>OPEN ACCOUNT</button></div>}
      {profileState === "ready" && (selectedDemo || publicPageProfile) && <ProfilePanel player={selectedDemo ?? publicPageProfile!} own={ownProfileSelected} ownCharacter={props.character} ownLook={props.look} signedIn={props.signedIn} busy={Boolean(publicPageProfile && busyIds.includes(publicPageProfile.public_id))} moderationBusy={moderationBusy} onFollow={() => publicPageProfile && void followPlayer(publicPageProfile)} onModerate={(publicId, action) => void moderatePlayer(publicId, action)} onConnections={loadConnections} openAccount={props.openAccount} avatarSaved={props.avatarSaved} avatarPublic={props.avatarPublic} avatarBusy={avatarBusy} onAvatarPublic={() => void toggleAvatarPublic()} catalog={props.catalog}/>}
      {connectionType && <section className="city-connections"><div className="city-section-heading"><h3>{connectionType === "followers" ? "Followers" : "Following"}</h3><button className="text-btn" onClick={() => setConnectionType(null)}>CLOSE</button></div>{connectionsState === "loading" && <p className="city-muted" role="status">Loading connections…</p>}{connectionsState === "error" && <p className="city-inline-error" role="alert">{connectionsError}</p>}{connectionsState === "ready" && (connections.length ? connections.map((connection) => <button key={connection.public_id} onClick={() => { setSelectedDemo(null); setSelectedPublicId(connection.public_id); setViewedProfile(null); setSection("profile"); setConnectionType(null); }}><span>{connection.username}</span><small>VIEW PROFILE →</small></button>) : <p className="city-muted">No {connectionType} yet.</p>)}</section>}
      {profileState === "ready" && (selectedDemo || publicPageProfile) && <><div className="city-section-heading"><div><span className="eyebrow">PUBLIC OUTFIT SHOWCASE</span><h3>Shared looks</h3></div></div>{profileFitsState === "loading" && <p className="city-muted" role="status">Loading shared outfits…</p>}{profileFitsState === "error" && <p className="city-inline-error" role="alert">{profileFitsError}</p>}{profileFitsState === "ready" && (profileFits.length ? <section className="city-fit-grid">{profileFits.map((fit) => <FitCard key={fit.id} fit={fit} catalog={props.catalog} busy={busyIds.includes(fit.id)} signedIn={props.signedIn} onLike={() => void toggleLike(fit)} onPlayer={() => undefined} openAccount={props.openAccount} onRemove={fit.playerPublicId === props.myPublicId ? () => void unpublish(fit) : undefined}/>)}</section> : <p className="city-muted">No outfits have been shared publicly.</p>)}</>}
    </section>}

    {section === "chat" && <section className="city-chat-room">
      <div className="city-chat-heading"><div><span className="eyebrow">ROOM CHAT</span><h2>{locations.find((place) => place.id === roomId)?.name}</h2></div><span className={`city-live-status ${realtimeStatus}`}>{realtimeStatus.toUpperCase()}</span></div>
      <label className="city-room-picker">LOCATION<select value={roomId} onChange={(event) => setRoomId(event.target.value)}>{locations.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}</select></label>
      {!props.configured || !props.signedIn ? <div className="city-chat-auth"><h3>Sign in to join room chat.</h3><p>Demo mode does not invent messages or people.</p><button className="button" onClick={props.openAccount}>OPEN ACCOUNT</button></div> : <>
        <div className="city-chat-messages" aria-live="polite">
          {chatError && <p className="city-inline-error" role="alert">{chatError}</p>}
          {!chatError && chatMessages.length === 0 && <p className="city-muted">No verified messages in this room yet.</p>}
          {chatMessages.map((message) => <article key={message.id} className={message.senderPublicId === props.myPublicId ? "own" : ""}><div><b>{message.username}</b><time>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div><p>{message.body}</p></article>)}
        </div>
        <form className="city-chat-form" onSubmit={sendChat}><input aria-label="Room chat message" maxLength={240} value={chatText} onChange={(event) => setChatText(event.target.value)} placeholder={`Message ${locations.find((place) => place.id === roomId)?.name}`}/><button className="button" disabled={chatBusy || !chatText.trim()}>{chatBusy ? "SENDING…" : "SEND"}</button></form>
      </>}
    </section>}
  </section>;
}

function PlayerCard({ player, catalog, signedIn, myPublicId, busy, onOpen, onFollow, openAccount }: {
  player: CityPlayer;
  catalog: readonly FashionCatalogueItem[];
  signedIn: boolean;
  myPublicId: string | null;
  busy: boolean;
  onOpen: () => void;
  onFollow: () => void;
  openAccount: () => void;
}) {
  const demo = isDemoPlayer(player);
  const username = player.username;
  const isSelf = !demo && player.public_id === myPublicId;
  const avatar = demo ? { character: player.character, look: player.look } : publicAvatarFromProfile(player);
  return <article className="city-player-card">
    <button className="city-player-open" onClick={onOpen} aria-label={`View ${username}'s profile`}>
      <div className="city-player-avatar">{avatar ? <AvatarRenderer character={avatar.character} look={avatar.look} catalogItems={catalog} compact/> : <span>{username.slice(0, 1).toUpperCase()}</span>}</div>
      <div className="city-player-info"><b>{username}</b><span>{demo ? "DEMO PLAYER" : "PUBLIC PLAYER"}</span>{demo ? <small>{player.sampleAchievement}</small> : <small>Level {player.level} · {player.xp} XP</small>}</div>
    </button>
    <button className="city-follow-button" disabled={busy || demo || isSelf} onClick={() => demo || isSelf ? undefined : signedIn ? onFollow() : openAccount()}>{demo ? "DEMO" : isSelf ? "YOUR PROFILE" : !signedIn ? "SIGN IN TO FOLLOW" : player.viewer_follows ? "FOLLOWING · UNFOLLOW" : "FOLLOW"}</button>
  </article>;
}

function FitCard({ fit, catalog, busy, signedIn, onLike, onPlayer, openAccount, onRemove }: {
  fit: PublicShowcase | DemoShowcase;
  catalog: readonly FashionCatalogueItem[];
  busy: boolean;
  signedIn: boolean;
  onLike: () => void;
  onPlayer: () => void;
  openAccount: () => void;
  onRemove?: () => void;
}) {
  const demo = "demo" in fit;
  return <article className="city-fit-card">
    <div className="city-fit-art"><AvatarRenderer character={fit.character} look={fit.look} catalogItems={catalog} compact/><span>{demo ? "DEMO FIT" : "PUBLIC FIT"}</span></div>
    <div className="city-fit-info"><button className="city-fit-title" onClick={onPlayer}><b>{fit.title}</b><small>by {fit.username}</small></button><span className="city-fit-date">{demo ? "Sample content" : fitDate(fit.publishedAt)}</span></div>
    <div className="city-fit-actions">{demo ? <span className="city-demo-label">Demo likes are disabled</span> : <button disabled={busy} onClick={() => signedIn ? onLike() : openAccount()} aria-label={fit.viewerLiked ? "Unlike outfit" : "Like outfit"}>{fit.viewerLiked ? "♥ LIKED" : "♡ LIKE"} <b>{fit.likeCount}</b></button>}{onRemove && <button className="city-remove-fit" disabled={busy} onClick={onRemove}>{busy ? "SAVING…" : "REMOVE"}</button>}</div>
  </article>;
}

function ProfilePanel({ player, own, ownCharacter, ownLook, signedIn, busy, moderationBusy, onFollow, onModerate, onConnections, openAccount, avatarSaved, avatarPublic, avatarBusy, onAvatarPublic, catalog }: {
  player: PublicPlayer | DemoPlayer;
  own: boolean;
  ownCharacter: Character;
  ownLook: Look;
  signedIn: boolean;
  busy: boolean;
  moderationBusy: boolean;
  onFollow: () => void;
  onModerate: (publicId: string, action: "block" | "mute" | "report") => void;
  onConnections: (type: "followers" | "following") => void;
  openAccount: () => void;
  avatarSaved: boolean;
  avatarPublic: boolean;
  avatarBusy: boolean;
  onAvatarPublic: () => void;
  catalog: readonly FashionCatalogueItem[];
}) {
  const demo = isDemoPlayer(player);
  const publicAvatar = demo ? { character: player.character, look: player.look } : publicAvatarFromProfile(player);
  const privateOwnAvatar = !publicAvatar && own ? { character: ownCharacter, look: ownLook } : null;
  return <section className="city-profile-card">
    <div className="city-profile-avatar">{publicAvatar ? <><AvatarRenderer character={publicAvatar.character} look={publicAvatar.look} catalogItems={catalog}/><span>PUBLIC AVATAR</span></> : privateOwnAvatar ? <><AvatarRenderer character={privateOwnAvatar.character} look={privateOwnAvatar.look} catalogItems={catalog}/><span>PRIVATE VIEW · NOT PUBLICLY SHARED</span></> : <div className="city-avatar-private"><b>◎</b><span>This player has not shared an avatar.</span></div>}</div>
    <div className="city-profile-details"><span className="eyebrow">{demo ? "SAMPLE PLAYER" : "PUBLIC PROFILE"}</span><h3>{player.username}</h3><p>{demo ? player.bio : player.bio || "No bio added yet."}</p>
      {demo ? <p className="city-achievement">{player.sampleAchievement} <small>DEMO</small></p> : <p className="city-achievement">Level {player.level} · {player.xp} XP <small>PROFILE DATA</small></p>}
      <div className="city-profile-stats">{demo ? <><b>DEMO<small>FOLLOWERS</small></b><b>DEMO<small>FOLLOWING</small></b></> : <><button onClick={() => onConnections("followers")}><b>{player.follower_count}</b><small>FOLLOWERS</small></button><button onClick={() => onConnections("following")}><b>{player.following_count}</b><small>FOLLOWING</small></button></>}</div>
      {!demo && <div className="city-profile-actions">{own ? <><button className="button quiet" onClick={openAccount}>EDIT MY PROFILE</button><button className="button" disabled={avatarBusy || !avatarSaved} onClick={onAvatarPublic}>{avatarBusy ? "SAVING…" : avatarPublic ? "MAKE AVATAR PRIVATE" : "SHARE AVATAR PUBLICLY"}</button>{!avatarSaved && <small>Save a cloud avatar in Account before sharing it.</small>}</> : <><button className="button" disabled={busy} onClick={() => signedIn ? onFollow() : openAccount()}>{!signedIn ? "SIGN IN TO FOLLOW" : player.viewer_follows ? "UNFOLLOW PLAYER" : "FOLLOW PLAYER"}</button><button className="button quiet" disabled={moderationBusy} onClick={() => onModerate(player.public_id, "mute")}>MUTE</button><button className="button quiet" disabled={moderationBusy} onClick={() => onModerate(player.public_id, "block")}>BLOCK</button><button className="button quiet" disabled={moderationBusy} onClick={() => onModerate(player.public_id, "report")}>REPORT</button></>}</div>}
      {demo && <p className="city-demo-note">Demo characters and achievements are illustrations, not live player records.</p>}
      <div className="city-profile-record"><b>Battle placements</b><span>{demo ? "Sample only — no live results." : "No verified battle placements are available yet."}</span></div>
    </div>
  </section>;
}
