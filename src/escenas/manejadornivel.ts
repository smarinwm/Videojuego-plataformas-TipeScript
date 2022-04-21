import Constantes from '../constantes';
import Jugador from '../gameobjects/jugador';
import Enemigos from '../gameobjects/enemigos';
import PlataformasMoviles from '../gameobjects/plataformasmoviles';
import Recolectables from '../gameobjects/recolectables';
import GestorBD from '../basedatos/gestorbd';


export default class ManejadorNivel extends Phaser.Scene {
    protected nombreNivel: string;
    protected nombreFondoNivel: string;
    public vidas: number;
    public puntuacion: number;
    public numObjetosRecolectar: number;
    public objetofinal: any;
    public objetofinalColision: Phaser.Physics.Arcade.Collider;
    public mapaNivel: Phaser.Tilemaps.Tilemap;
    protected conjuntoPatrones: Phaser.Tilemaps.Tileset;
    protected capaPlataformasMapaNivel: Phaser.Tilemaps.TilemapLayer;
    protected imagenFondo: Phaser.GameObjects.TileSprite;
    public jugador: Jugador;
    protected segundos: number;
    protected tiempoRestante: number;
    protected tiempoAgotado: boolean;
    protected grupoEnemigos: Enemigos[];
    protected plataformasMovilesH: PlataformasMoviles;
    protected plataformasMovilesV: PlataformasMoviles;
    protected bandasonoraNivel: Phaser.Sound.BaseSound;
    protected platanosGroup: Recolectables;
    protected pinasGroup: Recolectables;
    protected cerezasGroup: Recolectables;

    constructor(nivel: string) {
        super(nivel);
        this.nombreNivel = nivel;
    }

    init(): void {
        this.vidas = 3;
        this.puntuacion = 0;
        this.numObjetosRecolectar = 0;

        this.segundos = 1;
        this.tiempoRestante = 300;
        this.tiempoAgotado = false;

        this.registry.set(Constantes.REGISTRO.VIDAS, this.vidas);
        this.registry.set(Constantes.REGISTRO.PUNTUACION, this.puntuacion);

        this.grupoEnemigos = [];

    }

    creaEscenarioNivel(jsonMapa: string, imagenScrolable: string, plataformaMovilID: string, velocidadPlataformaMovil: number): void {

        this.creaBandasonora();
        this.creaMapaNivel(jsonMapa)
        this.crearFondoScrolable(imagenScrolable);
        this.creaAnimaciones();
        this.creaJugador();
        this.creaObjetoFinal();
        this.creaPlataformasMoviles(plataformaMovilID, velocidadPlataformaMovil);

    }

    creaBandasonora(): void {
        let mibd: GestorBD = new GestorBD();

        if (mibd.datos.musica) {

            this.bandasonoraNivel = this.sound.add(Constantes.SONIDOS.BANDASONORA + 1, { loop: true, volume: 0 });
            this.bandasonoraNivel.play();

            this.tweens.add({
                targets: this.bandasonoraNivel,
                volume: 1,
                duration: 2000

            });
        }
    }

    creaMapaNivel(jsonMapa: string, imagenMapa: string = Constantes.MAPAS.TILESET): void {

        this.mapaNivel = this.make.tilemap({ key: jsonMapa });
        this.physics.world.bounds.setTo(0, 0, this.mapaNivel.widthInPixels, this.mapaNivel.heightInPixels);
        this.conjuntoPatrones = this.mapaNivel.addTilesetImage(imagenMapa);
        this.capaPlataformasMapaNivel = this.mapaNivel.createLayer(Constantes.MAPAS.CAPAPLATAFORMAS, this.conjuntoPatrones);
        this.capaPlataformasMapaNivel.setCollisionByExclusion([-1]);
    }

    crearFondoScrolable(imagenScrolable: string): void {

        this.imagenFondo = this.add.tileSprite(0, 0, this.mapaNivel.widthInPixels, this.mapaNivel.heightInPixels, imagenScrolable).setOrigin(0, 0).setDepth(-1);
        this.nombreFondoNivel = imagenScrolable;
    }

    creaAnimaciones() {
        this.anims.create({
            key: Constantes.JUGADOR.ANIMACION.ESPERA,
            frames: this.anims.generateFrameNames(Constantes.JUGADOR.ID, {
                prefix: Constantes.JUGADOR.ANIMACION.ESPERA + '-',
                end: 10
            }),
            frameRate: 20,
            repeat: -1
        });
        this.anims.create({
            key: Constantes.JUGADOR.ANIMACION.CORRER,
            frames: this.anims.generateFrameNames(Constantes.JUGADOR.ID, {
                prefix: Constantes.JUGADOR.ANIMACION.CORRER + '-',
                end: 11
            }),
            frameRate: 20,
            repeat: -1
        });

        this.anims.create({
            key: Constantes.ENEMIGOS.EXPLOSION.ANIM,
            frames: Constantes.ENEMIGOS.EXPLOSION.ID,
            frameRate: 15,
            repeat: 0
        });

    }

    creaJugador(): void {

        this.mapaNivel.findObject(Constantes.JUGADOR.ID, (d: any) => {
            this.jugador = new Jugador({
                escena: this,
                x: d.x,
                y: d.y,
                textura: Constantes.JUGADOR.ID
            });
        });


        this.cameras.main.setBounds(0, 0, this.mapaNivel.widthInPixels, this.mapaNivel.heightInPixels);
        this.cameras.main.startFollow(this.jugador);

        this.physics.add.collider(this.jugador, this.capaPlataformasMapaNivel);
    }

    creaObjetoFinal() {

        this.objetofinal = this.mapaNivel.createFromObjects(Constantes.MAPAS.POSICIONFINAL, { name: Constantes.MAPAS.POSICIONFINAL })[0];
        this.physics.world.enable(this.objetofinal);
        this.objetofinal.body.setAllowGravity(false);
        this.objetofinal.setTexture(Constantes.OBJETOS.FINAL);
        this.objetofinal.body.setImmovable(true);
        this.objetofinal.body.setSize(40, 50);
        this.objetofinal.body.setOffset(10, 15);
        this.objetofinal.setAlpha(0);
        this.objetofinalColision = this.physics.add.collider(this.jugador, this.objetofinal, () => this.finalizaNivel());
        this.objetofinalColision.active = false;
    }

    volverAMenu(): void {
        this.cameras.main.fade(700, 0, 0, 0);
        this.cameras.main.on('camerafadeoutcomplete', () => {
            this.sound.stopAll();
            this.scene.stop(this.nombreNivel);
            this.scene.stop(Constantes.ESCENAS.HUD);
            this.scene.start(Constantes.ESCENAS.MENU);
        });
    }

    finalizaNivel(esWin: boolean = true): void {

        this.sound.stopAll();
        this.scene.stop(this.nombreNivel);
        this.scene.stop(Constantes.ESCENAS.HUD);
        this.scene.start(Constantes.ESCENAS.FINNIVEL, {
            esWin: esWin,
            nombreNivel: this.nombreNivel,
            nombreFondoNivel: this.nombreFondoNivel,
            puntuacion: this.puntuacion + this.tiempoRestante
        });

    }

    creaEnemigos(enemigosConfig: any[]): void {
        enemigosConfig.forEach(enemigosConfig => {
            let enemigos: Enemigos = new Enemigos(this, Constantes.MAPAS.ENEMIGOS, enemigosConfig.ID, enemigosConfig.ANIM, enemigosConfig.VELOCIDAD);

            this.physics.add.collider(enemigos, this.capaPlataformasMapaNivel);
            this.physics.add.overlap(this.jugador, enemigos, this.jugador.enemigoToca, null, this);
            this.grupoEnemigos.push(enemigos);
        });
    }


    creaPlataformasMoviles(plataformaMovilID: string, velocidadPlataformaMovil: number): void {
        this.plataformasMovilesH = new PlataformasMoviles(this, Constantes.MAPAS.PLATAFORMASMOVILES, plataformaMovilID, velocidadPlataformaMovil, true);
        this.plataformasMovilesV = new PlataformasMoviles(this, Constantes.MAPAS.PLATAFORMASMOVILES, plataformaMovilID, velocidadPlataformaMovil, false);
        this.physics.add.collider(this.jugador, [this.plataformasMovilesH, this.plataformasMovilesV]);
        this.physics.add.collider(this.capaPlataformasMapaNivel, [this.plataformasMovilesH, this.plataformasMovilesV]);
    }

    creaRecolectables(recolectablesConfig: any[]): void {
        recolectablesConfig.forEach(enemigosConfig => {
            let recolectables = new Recolectables(this, Constantes.MAPAS.RECOLECTABLES, enemigosConfig.ID, enemigosConfig.ANIM);
            this.physics.add.overlap(this.jugador, recolectables, this.jugador.recolecta, null, this);

        });
        this.registry.set(Constantes.REGISTRO.OBJETOSRECOLECTAR, this.numObjetosRecolectar);

    }
    update(time: number, delta: number): void {

        this.imagenFondo.tilePositionY -= 0.4;
        this.jugador.update();
        this.grupoEnemigos.forEach(enemigos => {
            enemigos.update();
        });
        this.plataformasMovilesH.update();
        this.plataformasMovilesV.update();

        if ((this.segundos != Math.floor(Math.abs(time / 1000))) && !this.tiempoAgotado) {
            this.segundos = Math.floor(Math.abs(time / 1000));
            this.tiempoRestante--;

            let minutos: number = Math.floor(this.tiempoRestante / 60);
            let segundos: number = Math.floor(this.tiempoRestante - (minutos * 60));

            let textoReloj: string = Phaser.Utils.String.Pad(minutos, 2, '0', 1) + ":" + Phaser.Utils.String.Pad(segundos, 2, '0', 1);
            this.registry.set(Constantes.REGISTRO.RELOJ, textoReloj);
            this.events.emit(Constantes.EVENTOS.RELOJ);


            if (this.tiempoRestante == 0) {
                this.tiempoAgotado = true;
            }
        }

        if (this.vidas === 0 || this.tiempoAgotado) this.finalizaNivel(false);

    }

}