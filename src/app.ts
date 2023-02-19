import "@babylonjs/core/Debug/debugLayer"
import "@babylonjs/inspector"
import { Engine, Scene, ArcRotateCamera, Vector3, Color3, DirectionalLight, KeyboardEventTypes, Scalar } from "@babylonjs/core"
import State from "./core/state"
import Ball from "./elements/ball"
import createGrid from "./core/debug"
import Tile from "./core/tileSystem/tile"
import Tree from "./elements/tree"
import LevelGenerator from "./core/tileSystem/levelGenerator"

class App {
    constructor() {
        // create the canvas html element and attach it to the webpage
        const canvas = document.createElement("canvas")
        canvas.style.width = "100%"
        canvas.style.height = "100%"
        canvas.id = "gameCanvas"
        document.body.appendChild(canvas)

        // initialize babylon scene, engine and camera
        State.engine = new Engine(canvas, true)
        State.scene = new Scene(State.engine)

        State.camera = new ArcRotateCamera(
            'cam',
            -Math.PI / 4, // Alpha
            0.75, // Beta
            50,
            Vector3.Zero(),
            State.scene, true
        )

        State.camera.upperRadiusLimit = State.camera.radius
        State.camera.lowerRadiusLimit = State.camera.radius / 2

        let lastKey: string
        State.scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case KeyboardEventTypes.KEYDOWN:
                    State.keys[kbInfo.event.key] = true
                    break
                case KeyboardEventTypes.KEYUP:
                    State.keys[kbInfo.event.key] = false
                    break
            }

            lastKey = kbInfo.event.key
        })

        // State.camera.attachControl(canvas, true)
        let light = new DirectionalLight("light", new Vector3(0, 0, 1), State.scene)
        let light2 = new DirectionalLight("light2", new Vector3(0, 0, -1), State.scene)
        light.parent = State.camera
        light2.parent = State.camera

        // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {
            if (ev.key === 'i') {
                if (State.scene.debugLayer.isVisible()) {
                    State.scene.debugLayer.hide()
                } else {
                    State.scene.debugLayer.show()
                }
            }
        })

        window.addEventListener("resize", _ => {
            State.engine.resize(true)
        })

        // run the main render loop
        State.scene.registerBeforeRender(() => {
            State.time = performance.now() * 0.001
        })

        // Movimenti camera
        let cameraSpeedY: number = 0.0
        let cameraSpeedX: number = 0.0
        State.scene.registerBeforeRender(() => {
            if (State.keys["ArrowDown"])
                cameraSpeedY = Math.min(0.01, cameraSpeedY + 0.001)
            else if (State.keys["ArrowUp"])
                cameraSpeedY = Math.max(-0.01, cameraSpeedY - 0.001)
            else cameraSpeedY = 0

            if (State.keys["ArrowRight"])
                cameraSpeedX = Math.min(0.01, cameraSpeedX + 0.001)
            else if (State.keys["ArrowLeft"])
                cameraSpeedX = Math.max(-0.01, cameraSpeedX - 0.001)
            else cameraSpeedX = 0

            State.camera.beta += cameraSpeedY
            State.camera.beta = Scalar.Clamp(State.camera.beta, Math.PI / 8, Math.PI / 2.42)

            State.camera.alpha += cameraSpeedX * 2
        })

        let levelGenerator = new LevelGenerator(10)
        levelGenerator.createLevel()

        let ball = new Ball("golfball")
        ball.mesh.position.y = 1
        ball.render()


        createGrid(State.scene, 200)
        State.scene.createDefaultEnvironment({
            skyboxColor: Color3.Teal(),
        })
        canvas.focus()
        State.engine.runRenderLoop(() => {
            State.scene.render()
        })
    }
}

new App()