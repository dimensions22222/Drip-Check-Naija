import { useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Phaser from "phaser";
import AvatarRenderer from "../avatar/AvatarRenderer";
import type { Character, Look } from "../avatar/catalog";

export type RemoteCityPlayer = {
  publicId: string;
  username: string;
  character: Character;
  look: Look;
  x: number;
  y: number;
};

type PhaserWorldProps = {
  character: Character;
  look: Look;
  multiplayerEnabled?: boolean;
  remotePlayers?: readonly RemoteCityPlayer[];
  onPositionChange?: (position: { x: number; y: number }) => void;
};

type Direction = "up" | "down" | "left" | "right";

class PlazaScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private readonly remotePlayers = new Map<string, Phaser.GameObjects.Container>();
  private readonly remoteTargets = new Map<string, { x: number; y: number }>();
  private readonly remoteAvatarKeys = new Set<string>();
  private lastSentPosition = 0;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private readonly touchDirections = new Set<Direction>();
  private readonly obstacles = [
    new Phaser.Geom.Rectangle(150, 145, 300, 170),
    new Phaser.Geom.Rectangle(660, 110, 340, 210),
    new Phaser.Geom.Rectangle(1230, 130, 360, 190),
    new Phaser.Geom.Rectangle(185, 720, 340, 220),
    new Phaser.Geom.Rectangle(740, 790, 360, 190),
    new Phaser.Geom.Rectangle(1290, 710, 330, 240),
  ];

  constructor(
    private readonly avatarTexture: string,
    private readonly multiplayerEnabled: boolean,
    private readonly onPositionChange?: (position: { x: number; y: number }) => void,
  ) {
    super("PlazaScene");
  }

  setTouchDirection(direction: Direction, active: boolean) {
    if (active) this.touchDirections.add(direction);
    else this.touchDirections.delete(direction);
  }

  create() {
    const worldWidth = 1800;
    const worldHeight = 1200;
    const graphics = this.add.graphics();
    graphics.fillStyle(0x302a3d, 1).fillRect(0, 0, worldWidth, worldHeight);
    for (let y = 0; y < worldHeight; y += 48) {
      for (let x = 0; x < worldWidth; x += 48) {
        graphics.fillStyle(((x + y) / 48) % 2 ? 0x38334a : 0x332e43, 1);
        graphics.fillRect(x + 2, y + 2, 44, 44);
      }
    }

    graphics.fillStyle(0x504363, 1).fillRect(0, 475, worldWidth, 190);
    graphics.fillStyle(0x504363, 1).fillRect(520, 0, 165, worldHeight);
    graphics.fillStyle(0xffd18a, 0.75);
    for (let x = 24; x < worldWidth; x += 76) graphics.fillRect(x, 567, 36, 5);
    for (let y = 22; y < worldHeight; y += 76) graphics.fillRect(596, y, 5, 36);

    this.add.text(900, 593, "LAGOS FASHION DISTRICT", {
      fontFamily: "Arial", fontSize: "16px", color: "#FFF4E6", fontStyle: "bold",
      backgroundColor: "#24172F", padding: { x: 10, y: 7 },
    }).setOrigin(0.5).setDepth(2);

    const destinations = [
      { x: 300, y: 230, width: 300, height: 170, color: 0x644a79, title: "THE STYLE MALL", sub: "FASHION DESTINATION" },
      { x: 830, y: 215, width: 340, height: 210, color: 0x8c4c49, title: "ROOFTOP LOUNGE", sub: "HANGOUT SPOT" },
      { x: 1410, y: 225, width: 360, height: 190, color: 0x456b65, title: "NAIJA MARKET", sub: "MARKET STREET" },
      { x: 355, y: 830, width: 340, height: 220, color: 0x4e5e82, title: "CAMPUS PLAZA", sub: "CAMPUS CORNER" },
      { x: 920, y: 885, width: 360, height: 190, color: 0x715945, title: "THE MAINLAND", sub: "COMMUNITY SQUARE" },
      { x: 1455, y: 830, width: 330, height: 240, color: 0x75526b, title: "ISLAND STYLE", sub: "STYLE AVENUE" },
    ];
    destinations.forEach((place) => {
      graphics.fillStyle(0x191521, 0.42).fillRoundedRect(place.x - place.width / 2 + 8, place.y - place.height / 2 + 11, place.width, place.height, 18);
      graphics.fillStyle(place.color, 1).fillRoundedRect(place.x - place.width / 2, place.y - place.height / 2, place.width, place.height, 18);
      graphics.lineStyle(3, 0xdcd0ff, 0.8).strokeRoundedRect(place.x - place.width / 2, place.y - place.height / 2, place.width, place.height, 18);
      this.add.rectangle(place.x, place.y - 17, place.width - 44, 5, 0xffd18a).setDepth(1);
      this.add.text(place.x, place.y, place.title, {
        fontFamily: "Arial", fontSize: "17px", color: "#FFF4E6", fontStyle: "bold",
        align: "center", wordWrap: { width: place.width - 26 },
      }).setOrigin(0.5).setDepth(1);
      this.add.text(place.x, place.y + 32, place.sub, {
        fontFamily: "Arial", fontSize: "10px", color: "#DCD0FF", letterSpacing: 2,
      }).setOrigin(0.5).setDepth(1);
    });

    // Streetlights and planters are decorative, static geometry.
    for (const [x, y] of [[85, 390], [1130, 455], [1710, 620], [640, 755], [1120, 740], [70, 685], [1740, 475]]) {
      graphics.fillStyle(0x72e0c1, 0.9).fillCircle(x, y, 8);
      graphics.fillStyle(0x252334, 1).fillRect(x - 2, y + 8, 4, 24);
    }
    this.add.text(900, 72, "WALK THE CITY  ·  SINGLE-PLAYER DEMO", {
      fontFamily: "Arial", fontSize: "13px", color: "#FFF4E6",
      backgroundColor: "#24172F", padding: { x: 10, y: 7 },
    }).setOrigin(0.5).setDepth(2);

    this.player = this.add.container(590, 590).setDepth(5);
    this.player.add([
      this.add.ellipse(0, 25, 38, 12, 0x17121e, 0.45),
      this.add.circle(0, -13, 11, 0x9d6044).setStrokeStyle(2, 0x24172f),
      this.add.ellipse(0, 5, 31, 34, 0xa78bfa).setStrokeStyle(3, 0x24172f),
      this.add.text(0, 43, "YOU", {
        fontFamily: "Arial", fontSize: "11px", color: "#FFF4E6", fontStyle: "bold",
        backgroundColor: "#24172F", padding: { x: 6, y: 3 },
      }).setOrigin(0.5),
    ]);
    const replacePlaceholder = (key: string) => {
      if (key !== "city-avatar") return;
      this.textures.off(Phaser.Textures.Events.ADD_KEY, replacePlaceholder);
      if (!this.player?.active) return;
      this.player.removeAll(true);
      this.player.add([
        this.add.ellipse(0, 25, 38, 12, 0x17121e, 0.45),
        this.add.image(0, -4, "city-avatar").setDisplaySize(76, 122),
        this.add.text(0, 67, "YOU", {
          fontFamily: "Arial", fontSize: "11px", color: "#FFF4E6", fontStyle: "bold",
          backgroundColor: "#24172F", padding: { x: 6, y: 3 },
        }).setOrigin(0.5),
      ]);
    };
    this.textures.on(Phaser.Textures.Events.ADD_KEY, replacePlaceholder);
    this.textures.addBase64("city-avatar", this.avatarTexture);

    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys("W,A,S,D") as Record<string, Phaser.Input.Keyboard.Key>;
    }
  }

  update(_time: number, delta: number) {
    if (!this.player || !this.cursors || !this.keys) return;
    const left = this.cursors.left.isDown || this.keys.A.isDown || this.touchDirections.has("left");
    const right = this.cursors.right.isDown || this.keys.D.isDown || this.touchDirections.has("right");
    const up = this.cursors.up.isDown || this.keys.W.isDown || this.touchDirections.has("up");
    const down = this.cursors.down.isDown || this.keys.S.isDown || this.touchDirections.has("down");
    const horizontal = Number(right) - Number(left);
    const vertical = Number(down) - Number(up);
    if (!horizontal && !vertical) {
      this.interpolateRemotePlayers(delta);
      return;
    }
    const speed = 230 * Math.min(delta, 40) / 1000 / Math.hypot(horizontal, vertical);
    this.movePlayer(horizontal * speed, 0);
    this.movePlayer(0, vertical * speed);
    this.interpolateRemotePlayers(delta);
    if (this.multiplayerEnabled && this.onPositionChange && _time - this.lastSentPosition >= 50) {
      this.lastSentPosition = _time;
      this.onPositionChange({ x: Math.round(this.player.x), y: Math.round(this.player.y) });
    }
  }

  private movePlayer(dx: number, dy: number) {
    const x = Phaser.Math.Clamp(this.player.x + dx, 24, 1776);
    const y = Phaser.Math.Clamp(this.player.y + dy, 24, 1176);
    const padding = 22;
    const blocked = this.obstacles.some((rect) =>
      x > rect.left - padding && x < rect.right + padding &&
      y > rect.top - padding && y < rect.bottom + padding,
    );
    if (!blocked) this.player.setPosition(x, y);
  }

  setRemotePlayers(players: readonly RemoteCityPlayer[]) {
    const liveIds = new Set(players.map((player) => player.publicId));
    for (const [id, container] of this.remotePlayers) {
      if (!liveIds.has(id)) {
        container.destroy(true);
        this.remotePlayers.delete(id);
        this.remoteTargets.delete(id);
      }
    }

    players.forEach((remote) => {
      let container = this.remotePlayers.get(remote.publicId);
      if (!container) {
        container = this.add.container(remote.x, remote.y).setDepth(4);
        container.add([
          this.add.ellipse(0, 25, 38, 12, 0x17121e, 0.45),
          this.add.circle(0, -13, 11, 0x9d6044).setStrokeStyle(2, 0x24172f),
          this.add.ellipse(0, 5, 31, 34, 0x72e0c1).setStrokeStyle(3, 0x24172f),
          this.add.text(0, 43, remote.username.slice(0, 18), {
            fontFamily: "Arial", fontSize: "10px", color: "#FFF4E6", fontStyle: "bold",
            backgroundColor: "#24172F", padding: { x: 6, y: 3 },
          }).setOrigin(0.5),
        ]);
        this.remotePlayers.set(remote.publicId, container);
        const key = `remote-${remote.publicId}`;
        if (!this.remoteAvatarKeys.has(key)) {
          this.remoteAvatarKeys.add(key);
          const markup = renderToStaticMarkup(<AvatarRenderer character={remote.character} look={remote.look}/>)
            .replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="420" ');
          this.textures.addBase64(key, `data:image/svg+xml;base64,${btoa(markup)}`);
          this.textures.once(Phaser.Textures.Events.ADD_KEY, (addedKey: string) => {
            if (addedKey !== key) return;
            const active = this.remotePlayers.get(remote.publicId);
            if (!active) return;
            active.removeAll(true);
            active.add([
              this.add.ellipse(0, 25, 38, 12, 0x17121e, 0.45),
              this.add.image(0, -4, key).setDisplaySize(76, 122),
              this.add.text(0, 67, remote.username.slice(0, 18), {
                fontFamily: "Arial", fontSize: "10px", color: "#FFF4E6", fontStyle: "bold",
                backgroundColor: "#24172F", padding: { x: 6, y: 3 },
              }).setOrigin(0.5),
            ]);
          });
        }
      }
      this.remoteTargets.set(remote.publicId, { x: remote.x, y: remote.y });
    });
  }

  private interpolateRemotePlayers(delta: number) {
    const blend = Math.min(delta / 90, 1);
    for (const [id, target] of this.remoteTargets) {
      const container = this.remotePlayers.get(id);
      if (!container) continue;
      container.x = Phaser.Math.Linear(container.x, target.x, blend);
      container.y = Phaser.Math.Linear(container.y, target.y, blend);
    }
  }
}

export default function PhaserWorld({ character, look, multiplayerEnabled = false, remotePlayers = [], onPositionChange }: PhaserWorldProps) {
  const host = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<PlazaScene | null>(null);
  useEffect(() => {
    if (!host.current) return;
    const markup = renderToStaticMarkup(<AvatarRenderer character={character} look={look}/>)
      .replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="420" ');
    const avatarTexture = `data:image/svg+xml;base64,${btoa(markup)}`;
    const scene = new PlazaScene(avatarTexture, multiplayerEnabled, onPositionChange);
    sceneRef.current = scene;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host.current,
      width: Math.max(host.current.clientWidth, 320),
      height: 440,
      backgroundColor: "#302a3d",
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: true, pixelArt: false },
      scene: [scene],
    });
    return () => {
      sceneRef.current = null;
      game.destroy(true);
    };
  }, [character, look, multiplayerEnabled, onPositionChange]);

  useEffect(() => {
    sceneRef.current?.setRemotePlayers(remotePlayers);
  }, [remotePlayers]);

  const control = (direction: Direction, active: boolean) => sceneRef.current?.setTouchDirection(direction, active);
  return <div className="phaser-frame">
    <div ref={host} className="phaser-host" aria-label="Drip City single-player game world"/>
    <div className="city-controls" aria-label="Movement controls">
      <button aria-label="Move up" onPointerDown={(event) => { event.preventDefault(); control("up", true); }} onPointerUp={() => control("up", false)} onPointerLeave={() => control("up", false)} onPointerCancel={() => control("up", false)}>↑</button>
      <button aria-label="Move left" onPointerDown={(event) => { event.preventDefault(); control("left", true); }} onPointerUp={() => control("left", false)} onPointerLeave={() => control("left", false)} onPointerCancel={() => control("left", false)}>←</button>
      <button aria-label="Move down" onPointerDown={(event) => { event.preventDefault(); control("down", true); }} onPointerUp={() => control("down", false)} onPointerLeave={() => control("down", false)} onPointerCancel={() => control("down", false)}>↓</button>
      <button aria-label="Move right" onPointerDown={(event) => { event.preventDefault(); control("right", true); }} onPointerUp={() => control("right", false)} onPointerLeave={() => control("right", false)} onPointerCancel={() => control("right", false)}>→</button>
    </div>
  </div>;
}
