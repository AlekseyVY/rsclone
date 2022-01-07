import Phaser from 'phaser';
import ZombieHealthBar from '../ui-kit/health-bars/ZombieHealthBar';
import Enemy from './Enemy';

export default class Zombie extends Enemy {
  protected _speed: number;

  protected _damage: number;

  public hp: ZombieHealthBar;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    frame?: string | number
  ) {
    super(scene, x, y, texture, frame);
    this._speed = 50;
    this._damage = 10;
    this.hp = new ZombieHealthBar(scene, this.x, this.y, this);
  }
}

Phaser.GameObjects.GameObjectFactory.register(
  'zombie',
  function (
    this: Phaser.GameObjects.GameObjectFactory,
    x: number,
    y: number,
    texture: string,
    frame?: string | number
  ) {
    const sprite = new Zombie(this.scene, x, y, texture, frame);

    this.displayList.add(sprite);
    this.updateList.add(sprite);
    sprite.setInteractive({
      cursor: 'url(assets/game/cursors/aim.cur), pointer',
    });
    this.scene.physics.world.enableBody(
      sprite,
      Phaser.Physics.Arcade.DYNAMIC_BODY
    );

    sprite.setDisplaySize(80, 80);
    sprite.body.setSize(45, 45);

    return sprite;
  }
);
