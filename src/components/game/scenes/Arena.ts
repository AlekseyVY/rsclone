import Phaser, { Scene } from 'phaser';
import { createUserKeys } from '../../../utils/createUserKeys';
import { createCharacterAnims } from '../anims/PersonAnims';
import Bullet from '../entities/bullet';
import '../person/Person';
import Person from '../person/Person';
import PersonUI from '../ui-kit/PersonUi';
// import debugGraphicsDraw from '../../../utils/debug';
import { io, Socket } from 'socket.io-client';
import { PERSON_SPAWN_POINTS } from '../../../constants/personSpawnPoints';

export interface IPlayer {
  x: number;
  y: number;
  rotation: number;
  playerId: string;
  firing: boolean;
}

export interface IPlayers {
  [index: string]: IPlayer;
}

export default class Dungeon extends Phaser.Scene {
  protected personUi: PersonUI | null;

  protected person: Phaser.Physics.Arcade.Sprite | null;

  private bullets: Phaser.GameObjects.Group | null;

  private personWalkSound: Phaser.Sound.BaseSound | null;

  private personRifleSound: Phaser.Sound.BaseSound | null;

  private socket: Socket | undefined;

  private otherPlayers: Phaser.GameObjects.Group | undefined;

  private spawn: { x: number; y: number }[] | undefined;

  private assets: Phaser.Tilemaps.TilemapLayer | null;

  private walls: Phaser.Tilemaps.TilemapLayer | null;

  constructor() {
    super('dungeon');
    this.person = null;
    this.bullets = null;
    this.personUi = null;
    this.assets = this.walls = null;
    this.personWalkSound = this.personRifleSound = null;
  }

  preload() {
    this.load.image('floor', './assets/game/tiles/floor.png');
    this.load.image('walls', './assets/game/tiles/walls.png');
    this.load.image('other2', './assets/game/tiles/other2.png');
    this.load.image('furniture', './assets/game/tiles/furniture.png');
    this.load.image('tech', './assets/game/tiles/tech.png');
    this.load.tilemapTiledJSON('main', './assets/game/map/arena.json');
    this.load.atlas(
      'person',
      './assets/game/characters/man.png',
      './assets/game/characters/man.json'
    );
    this.load.atlas(
      'otherPerson',
      './assets/game/characters/man.png',
      './assets/game/characters/man.json'
    );
    this.load.image('bullet', './assets/game/bullet1.png');

    this.load.audio('person-walk', './assets/audio/person-walk.mp3');
    this.load.audio('rifle-shot', './assets/audio/rifle-shot.mp3');
  }

  create() {
    // this.socket = io('ws://localhost:5000');
    this.socket = io('https://rscloneback.herokuapp.com/');
    this.otherPlayers = this.physics.add.group();
    this.socket.on('currentPlayers', (players: IPlayers) => {
      Object.keys(players).forEach(id => {
        if (this.socket && players[id].playerId === this.socket.id) {
          (this.person as Person).playerId = this.socket.id
        } else {
          let otherPerson;
          if (PERSON_SPAWN_POINTS) {
            const spawnPoint = Math.floor(
              Math.random() * PERSON_SPAWN_POINTS.length
            );
            otherPerson = this.add.person(
              PERSON_SPAWN_POINTS[spawnPoint].x,
              PERSON_SPAWN_POINTS[spawnPoint].y,
              'person'
            );
          }
          if (otherPerson) {
            otherPerson.playerId = players[id].playerId;
            (otherPerson as Person).anims.play('idle_rifle');
            if (this.otherPlayers) this.otherPlayers.add(otherPerson);
          }
        }
      });
    });

    this.socket.on('newPlayer', (playerInfo: IPlayer) => {
      const otherPerson: Person = this.add.person(
        playerInfo.x,
        playerInfo.y,
        'person'
      );
      otherPerson.playerId = playerInfo.playerId;
      otherPerson.anims.play('idle_rifle');
      if (this.otherPlayers) this.otherPlayers.add(otherPerson);
    });

    this.socket.on('discon', (playerId: string) => {
      if (this.otherPlayers)
        this.otherPlayers.getChildren().forEach(otherPlayer => {
          if (playerId === (otherPlayer as Person).playerId) {
            otherPlayer.destroy();
          }
        });
    });

    this.input.setDefaultCursor('url(assets/game/cursors/cursor.cur), pointer');
    createCharacterAnims(this.anims);
    // create map

    const map = this.make.tilemap({
      key: 'main',
    });

    // added tilesets

    const tileset = map.addTilesetImage('floor');
    const tilesetWalls = map.addTilesetImage('walls');
    const tilesetFurniture = map.addTilesetImage('furniture');
    const tilesetTech = map.addTilesetImage('tech');

    // create layer

    const ground = map.createLayer('ground', [tileset, tilesetWalls], 0, 0);
    this.walls = map.createLayer('walls', [tilesetWalls, tileset], 0, 0);
    map.createLayer('shadow', [tilesetTech], 0, 0);
    this.assets = map.createLayer(
      'assets',
      [tilesetFurniture, tilesetTech],
      0,
      0
    );
    // create collision

    ground.setCollisionByProperty({ collides: true });
    this.walls.setCollisionByProperty({ collides: true });
    this.assets.setCollisionByProperty({ collides: true });
    // debugGraphicsDraw(walls, this);
    // debugGraphicsDraw(assets, this);

    // creating the sounds

    this.personWalkSound = this.sound.add('person-walk', {
      volume: 0.5,
    });

    this.personRifleSound = this.sound.add('rifle-shot', {
      volume: 0.8,
      loop: true,
    });

    this.bullets = this.physics.add.group({
      classType: Bullet,
      maxSize: 10,
      runChildUpdate: true,
    });

    this.createPerson();

    this.physics.add.collider(
      this.bullets,
      this.walls,
      Bullet.handleBulletAndWallsCollision.bind(this)
    );

    this.physics.add.collider(this.bullets, this.otherPlayers, (arg1, arg2) => {
      const resolvedHp = Person.handleBulletDamage(
        arg1,
        arg2,
        this,
        this.personUi
      );
      arg1.destroy(true);
      const data = arg2 as Person;
      if (this.socket) {
        this.socket.emit('playerMovement', {
          x: data.x,
          y: data.y,
          rotation: data.rotation,
        });
        this.socket.emit('damaged', {
          hp: resolvedHp,
          id: data.playerId
        });
      }
    });

    // appending scene PersonUI

    this.personUi = new PersonUI(this, this.person as Person);
    this.scene.add('person-ui', this.personUi as unknown as Scene);

    this.socket.on('playerMoved', (playerInfo: IPlayer) => {
      if (this.otherPlayers)
        this.otherPlayers.getChildren().forEach(otherPlayer => {
          if (playerInfo.playerId === (otherPlayer as Person).playerId) {
            (otherPlayer as Person).setRotation(playerInfo.rotation);
            (otherPlayer as Person).setPosition(playerInfo.x, playerInfo.y);
          }
        });
    });

    this.socket.on('damaged', (hpData: {id: string, hp: number, playerId: string}) => {
      console.log(hpData)
      if((this.person as Person).playerId === hpData.id){
        (this.person as Person).hp = hpData.hp;
        if((this.person as Person).hp <= 0) {
          this.person?.destroy(true);
          this.createPerson();
          if(this.socket) (this.person as Person).playerId = this.socket.id;
          this.socket && this.socket.emit('damaged', {
            hp: 100,
            id: (this.person as Person).playerId
          });
          if (this.person && this.socket) {
              this.socket.emit('playerMovement', {
                x: this.person.x,
                y: this.person.y,
                rotation: this.person.rotation,
              });
          }
        }
      }
    });
    

    this.socket.on('firing', (playerInfo: IPlayer) => {
      if (this.otherPlayers)
        this.otherPlayers.getChildren().forEach(otherPlayer => {
          if (playerInfo.playerId === (otherPlayer as Person).playerId) {
            if (playerInfo.firing) {
              (otherPlayer as Person).anims.play('rifle');
            }
            if (!playerInfo.firing) {
              (otherPlayer as Person).anims.play('idle_rifle');
            }
          }
        });
    });

    this.input.on('pointerdown', () => {
      if (this.socket) this.socket.emit('firing', { status: true });
    });

    this.input.on('pointerup', () => {
      if (this.socket) this.socket.emit('firing', { status: false });
    });

    this.scene.run('person-ui');
  }

  createPerson() {
    const spawnPoint = Math.floor(Math.random() * PERSON_SPAWN_POINTS.length);
    this.person = this.add.person(
      PERSON_SPAWN_POINTS[spawnPoint].x,
      PERSON_SPAWN_POINTS[spawnPoint].y,
      'person'
    );

    this.cameras.main.startFollow(this.person, true);

    this.physics.add.collider(
      this.person,
      this.walls as Phaser.Tilemaps.TilemapLayer
    );

    this.physics.add.collider(
      this.person,
      this.assets as Phaser.Tilemaps.TilemapLayer
    );

    (this.person as Person).createRotationAndAttacking(
      this,
      this.personRifleSound
    );
  }

  update(time?: number): void {
    if (this.person) {
      this.person.update(
        createUserKeys(this.input),
        time,
        this.bullets,
        this.personWalkSound,
        this.personUi
      );
    }
  
    if (this.otherPlayers)
      this.otherPlayers.getChildren().forEach(otherPlayer => {
        console.log((otherPlayer as Person));
        if((otherPlayer as Person).hp <= 0) {
          (otherPlayer as Person).hp = 100;
        }
      });
    
    if (this.person) {
      if (this.socket)
        this.socket.emit('playerMovement', {
          x: this.person.x,
          y: this.person.y,
          rotation: this.person.rotation,
        });
    }
  }
}
