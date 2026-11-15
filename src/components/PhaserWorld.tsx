import { useEffect, useRef } from "react";
import Phaser from "phaser";

class PlazaScene extends Phaser.Scene {
  player!: Phaser.GameObjects.Arc;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;

  constructor() { super("PlazaScene"); }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#17231f");
    const g = this.add.graphics();
    g.fillStyle(0x263d32, 1); g.fillRect(0, 0, width, height);
    // Plaza paving
    for (let y = 0; y < height; y += 42) for (let x = 0; x < width; x += 42) {
      g.fillStyle(((x + y) / 42) % 2 ? 0x304b3d : 0x385544, 1);
      g.fillRoundedRect(x + 2, y + 2, 38, 38, 4);
    }
    // Central runway
    g.fillStyle(0xb18a55, 1); g.fillRoundedRect(width * .34, height * .18, width * .32, height * .64, 14);
    g.lineStyle(3, 0xe9b84b, .8); g.strokeRoundedRect(width * .34, height * .18, width * .32, height * .64, 14);
    this.add.text(width * .5, height * .25, "DRIP CITY", { fontFamily: "Arial", fontSize: "20px", color: "#171313", fontStyle: "bold" }).setOrigin(.5);
    this.add.text(width * .5, height * .73, "FASHION PLAZA", { fontFamily: "Arial", fontSize: "12px", color: "#171313" }).setOrigin(.5);
    this.add.rectangle(width * .15, height * .35, 105, 65, 0x202633).setStrokeStyle(2, 0xe9b84b);
    this.add.text(width * .15, height * .35, "MALL", { fontSize: "14px", color: "#ffffff" }).setOrigin(.5);
    this.add.rectangle(width * .84, height * .35, 105, 65, 0x202633).setStrokeStyle(2, 0xe95d76);
    this.add.text(width * .84, height * .35, "BATTLE\nARENA", { fontSize: "13px", color: "#ffffff", align: "center" }).setOrigin(.5);
    this.player = this.add.circle(width * .5, height * .5, 13, 0xe95d76).setStrokeStyle(3, 0xffffff);
    this.add.circle(width * .5, height * .5 - 17, 8, 0x9b6041);
    this.add.text(width * .5, height * .5 + 28, "YOU", { fontSize: "10px", color: "#ffffff", fontStyle: "bold" }).setOrigin(.5);
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys("W,A,S,D") as Record<string, Phaser.Input.Keyboard.Key>;
    }
  }

  update() {
    if (!this.player || !this.cursors || !this.keys) return;
    const speed = 3;
    if (this.cursors.left.isDown || this.keys.A.isDown) this.player.x -= speed;
    if (this.cursors.right.isDown || this.keys.D.isDown) this.player.x += speed;
    if (this.cursors.up.isDown || this.keys.W.isDown) this.player.y -= speed;
    if (this.cursors.down.isDown || this.keys.S.isDown) this.player.y += speed;
    this.player.x = Phaser.Math.Clamp(this.player.x, 15, this.scale.width - 15);
    this.player.y = Phaser.Math.Clamp(this.player.y, 15, this.scale.height - 15);
  }
}

export default function PhaserWorld() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!host.current) return;
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host.current,
      width: 900,
      height: 480,
      backgroundColor: "#17231f",
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: true },
      scene: [PlazaScene]
    });
    return () => game.destroy(true);
  }, []);
  return <div className="phaser-frame"><div ref={host} className="phaser-host"/></div>;
}
