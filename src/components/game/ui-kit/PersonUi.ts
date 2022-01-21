import Phaser from 'phaser';
import Person from '../person/Person';
import PersonHealthBar from './health-bars/PersonHealthBar';
import IconUi from './IconUi';
import SettingsMenu from './SettingsMenu';

export default class PersonUI extends Phaser.Scene {
  parentScene: Phaser.Scene;

  public hpBar: PersonHealthBar | null;

  public items: number;

  public knife: Phaser.GameObjects.Image | null;

  public bat: Phaser.GameObjects.Image | null;

  public gun: Phaser.GameObjects.Image | null;

  public fire: Phaser.GameObjects.Image | null;

  public rifle: Phaser.GameObjects.Image | null;

  public active: Phaser.GameObjects.Image | null;

  public itemKeys: {
    [key: string]: number;
  };

  private person: Person;

  private settingsButton: Phaser.GameObjects.Image | null;

  private settingsMenu: SettingsMenu | null;

  private menuIsOpened = false;

  constructor(scene: Phaser.Scene, person: Person) {
    super({ key: 'person-ui' });
    this.parentScene = scene;
    this.person = person;
    this.items = 0;
    this.knife = null;
    this.hpBar = null;
    this.rifle = null;
    this.bat = null;
    this.fire = null;
    this.gun = null;
    this.active = null;
    this.itemKeys = {
      rifle: 482,
      knife: 302,
      bat: 362,
      gun: 422,
      fire: 542,
    };
    this.settingsButton = this.settingsMenu = null;
  }

  create() {
    const xCoord = this.parentScene.scale.width / 2 - 100;
    const yCoords = this.parentScene.scale.height - 50;
    const emptyItems = this.add.group({
      classType: Phaser.GameObjects.Image,
    });
    emptyItems.createMultiple({
      setScale: { x: 0.25, y: 0.25 },
      key: 'empty-item',
      setXY: {
        x: xCoord,
        y: yCoords,
        stepX: 60,
      },
      quantity: 5,
    });
    this.knife = this.add.image(xCoord, yCoords - 5, 'knife');
    this.knife.setScale(0.3, 0.3);
    this.bat = this.add.image(xCoord + 60, yCoords - 5, 'bat');
    this.bat.setRotation(0.55);
    this.bat.setScale(0.15, 0.15);
    this.gun = this.add.image(xCoord + 120, yCoords - 5, 'gun');
    this.gun.setRotation(0.45);
    this.gun.setScale(0.3, 0.3);
    this.rifle = this.add.image(xCoord + 180, yCoords - 5, 'rifle');
    this.rifle.setRotation(0.45);
    this.rifle.setScale(0.15, 0.15);
    this.fire = this.add.image(xCoord + 240, yCoords - 5, 'firethrower');
    this.fire.setRotation(0.45);
    this.fire.setScale(0.15, 0.15);
    this.changeWeapon('knife');
    new IconUi(this);
    this.hpBar = new PersonHealthBar(this, 0, 0, this.person);
    this.settingsButton = this.createSettingsButton();
  }

  changeWeapon(type: string) {
    if (this.active) this.active.destroy();

    this.active = this.add.image(
      this.itemKeys[type],
      this.parentScene.scale.height - 55,
      'active-item'
    );
    this.active.setScale(0.13, 0.13);
  }

  createSettingsButton() {
    const settingsButton = this.add.image(0, 0, 'btn-settings');

    Phaser.Display.Align.In.BottomLeft(
      settingsButton,
      this.add.zone(
        this.scale.width / 2,
        this.scale.height / 2,
        this.scale.width,
        this.scale.height
      )
    );

    settingsButton.setOrigin(1).setScale(0.35).setScrollFactor(0).setAlpha(0.6);

    const setVisibility = (method = 'out') => {
      this.tweens.add({
        targets: settingsButton,
        alpha: method === 'over' ? 1 : 0.6,
        duration: 250,
      });
    };

    settingsButton
      .setInteractive()
      .on('pointerover', setVisibility.bind(this, 'over'))
      .on('pointerout', setVisibility.bind(this))
      .on('pointerdown', () => {
        if (!this.menuIsOpened) {
          this.menuIsOpened = true;
          this.settingsMenu = new SettingsMenu(this);
        } else {
          this.menuIsOpened = false;
          this.settingsMenu?.destroy();
        }
      });

    return settingsButton;
  }
}
