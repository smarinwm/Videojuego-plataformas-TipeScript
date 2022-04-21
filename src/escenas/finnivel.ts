import Constantes from "../constantes";
import GestorBD from "../basedatos/gestorbd";

export default class FinNivel extends Phaser.Scene {
    private imagenFondo: Phaser.GameObjects.TileSprite;
    private nombreFondoNivel: string;
    private nombreNivel: string;
    private esWin: boolean;
    private puntuacion: number;

    constructor() {
        super(Constantes.ESCENAS.FINNIVEL);
    }

    init(data: any): void {
        this.esWin = data.esWin;
        this.nombreNivel = data.nombreNivel;
        this.nombreFondoNivel = data.nombreFondoNivel;
        this.puntuacion = data.puntuacion;
    }

    create(): void {

        this.imagenFondo = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, this.nombreFondoNivel).setOrigin(0, 0).setDepth(-1);

        let puntosPad: string = Phaser.Utils.String.Pad(this.puntuacion, 5, '0', 1);
        let textoPuntuacion: string = Constantes.FINNIVEL.PUNTOS + "\n\n" + puntosPad;

        if (this.esWin) {
            let mibd: GestorBD = new GestorBD();
            let nivel: string = this.nombreNivel.split(' ').join('').toLowerCase();
            let mejorResultado: string = "";

            if (this.puntuacion > parseInt(mibd.datos.puntuaciones[nivel])) {
                textoPuntuacion += "\n\n" + Constantes.FINNIVEL.BESTSCORE;
                mibd.datos.puntuaciones[nivel] = this.puntuacion;
                mibd.grabarBD();
            }

            const winTxt: Phaser.GameObjects.BitmapText = this.add.bitmapText(100, 100, Constantes.FUENTES.BITMAP, Constantes.FINNIVEL.WIN, 40).setTint(0x8338ec);

            const puntosTxt: Phaser.GameObjects.BitmapText = this.add.bitmapText(100, 200, Constantes.FUENTES.BITMAP, textoPuntuacion, 20).setTint(0x8338ec);
        } else {
            const gameOverTxt: Phaser.GameObjects.BitmapText = this.add.bitmapText(100, 100, Constantes.FUENTES.BITMAP, Constantes.FINNIVEL.GAMEOVER, 40).setTint(0xfb5607);
        }

        const volverTxt: Phaser.GameObjects.BitmapText = this.add.bitmapText(80, 400, Constantes.FUENTES.BITMAP, Constantes.CREDITOS.VOLVER, 20).setInteractive();

        volverTxt.on('pointerdown', () => {
            this.cameras.main.fade(700, 0, 0, 0);
            this.cameras.main.on('camerafadeoutcomplete', () => {
                this.scene.start(Constantes.ESCENAS.MENU);
            });
        });
    }

    update(): void {

        this.imagenFondo.tilePositionY -= 0.4;

    }

}