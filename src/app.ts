import "@babylonjs/core/Debug/debugLayer"
import "@babylonjs/inspector"
import { Engine, Scene, ArcRotateCamera, Vector3, Color3, DirectionalLight, KeyboardEventTypes, Scalar, MeshBuilder, Mesh } from "@babylonjs/core"
import State from "./core/state"
import { CannonJSPlugin } from "@babylonjs/core"
import LevelGenerator from "./core/tileSystem/levelGenerator"
import * as CANNON from "cannon"
import Tree from "./elements/tree"
import { Color4 } from "@babylonjs/core/Maths/math.color"
import ThrowIndicator from "./elements/throwIndicator"

const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement
const messageHeading = document.getElementById("message") as HTMLHeadElement
const menu = document.getElementById("menu") as HTMLDivElement

function startGame(tilesNumber: number, wigglines: number, tileSize: number) {
    State.scene.meshes.forEach(mesh => mesh.dispose())

    State.scene.onKeyboardObservable.add((kbInfo) => {
        switch (kbInfo.type) {
            case KeyboardEventTypes.KEYDOWN:
                State.keys[kbInfo.event.key] = true
                break
            case KeyboardEventTypes.KEYUP:
                State.keys[kbInfo.event.key] = false
                break
        }
    })

    // Camera movement
    let cameraSpeedY: number = 0.0
    let cameraSpeedX: number = 0.0
    State.scene.registerBeforeRender(() => {
        if (State.keys["ArrowDown"])
            cameraSpeedY = Math.min(1, cameraSpeedY + 0.05)
        else if (State.keys["ArrowUp"])
            cameraSpeedY = Math.max(-1, cameraSpeedY - 0.05)
        else cameraSpeedY = 0

        if (State.keys["ArrowRight"])
            cameraSpeedX = Math.min(1, cameraSpeedX + 0.05)
        else if (State.keys["ArrowLeft"])
            cameraSpeedX = Math.max(-1, cameraSpeedX - 0.05)
        else cameraSpeedX = 0

        State.camera.beta += cameraSpeedY * State.deltaTime
        State.camera.beta = Scalar.Clamp(State.camera.beta, Math.PI / 8, Math.PI / 2.42)

        State.camera.alpha += cameraSpeedX * 2 * State.deltaTime
    })

    const gravityVector = new Vector3(0, -9.81, 0).scale(3)
    State.scene.enablePhysics(gravityVector, new CannonJSPlugin(true, 10, CANNON))

    const levelGenerator = new LevelGenerator(tilesNumber, wigglines, tileSize)

    const { ball, endPos, holeDiameter } = levelGenerator.createLevel()

    let checkpoint = ball.mesh.position
    let ballCenter: Vector3 = checkpoint
    const velocityMargin = 0.1
    const holeRange = (holeDiameter / 2) + 1
    let throwIndicator: ThrowIndicator = null
    let throwMeshSpawned = false

    function ballLogic() {
        ballCenter = ball.mesh.physicsImpostor.getObjectCenter()
        State.camera.lockedTarget = ballCenter

        if (ballCenter.y <= -3) {
            if (ballCenter.x < endPos.x + holeRange &&
                ballCenter.x > endPos.x - holeRange &&
                ballCenter.z < endPos.z + holeRange &&
                ballCenter.z > endPos.z - holeRange) {
                ball.mesh.unregisterBeforeRender(ballLogic)
                ball.mesh.dispose()
                messageHeading.style.visibility = "visible"
                messageHeading.classList.add("pulse")
                return
            }
            else {
                ball.mesh.position = checkpoint
                ball.mesh.physicsImpostor.setLinearVelocity(Vector3.Zero())
                ball.mesh.physicsImpostor.setAngularVelocity(Vector3.Zero())
            }
        }
        let linearVelocity = Vector3.Distance(
            ball.mesh.physicsImpostor.getLinearVelocity(),
            Vector3.Zero()
        )
        let angularVelocity = Vector3.Distance(
            ball.mesh.physicsImpostor.getAngularVelocity(),
            Vector3.Zero()
        )

        if (
            linearVelocity <= velocityMargin &&
            angularVelocity <= velocityMargin
        ) {
            if (throwIndicator == null) {
                checkpoint = ball.mesh.position
                throwIndicator = new ThrowIndicator("direction", ball.mesh, () => throwMeshSpawned = true, (direction) => {
                    ball.mesh.physicsImpostor.applyImpulse(direction, ballCenter)
                }, 8)
            }
        }
        else if (throwMeshSpawned && throwIndicator != null) {
            throwIndicator.destroy()
            throwIndicator = null
            throwMeshSpawned = false
        }

    }

    ball.mesh.registerBeforeRender(ballLogic)

    /*
    ⣿⣿⣿⣿⣿⣿⣿⣿⠿⠛⠋⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠛⠿⣿⣿⣿⣿
    ⣿⣿⣿⣿⣿⣿⠏⠀⢠⣦⡀⣤⣠⡄⢠⠦⡄⣠⠤⠀⣤⠀⡆⣤⣶⡀⠀⠈⠻⣿
    ⣿⣿⣿⣿⣿⣿⠀⠀⠟⠻⠃⠏⠉⠇⠸⠶⠋⠻⠾⠇⠙⠒⠃⠘⠾⠃⠀⠀⢀⣿
    ⣿⣿⣿⣿⣿⣿⣷⣤⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣠⣴⣿⣿⣿⣿
    ⣿⣿⣿⣿⣿⣿⣿⠿⠿⠿⠿⠷⣶⣶⣶⣶⣶⡆⢀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
    ⣿⣿⣿⣿⠟⠉⠀⠀⠒⠀⠀⠀⠀⠉⢻⣿⣿⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
    ⣿⣿⣿⣿⠀⠀⠀⠦⣀⣶⡶⠀⢤⣠⣤⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
    ⣿⣿⣿⣿⣷⣤⣀⡲⠶⣶⣤⣔⣀⣤⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
    ⣿⣿⣿⣿⣿⠿⠿⠃⠈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
    ⣿⣿⣿⠏⢀⠤⠄⠀⠀⢀⡈⢹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
    ⣿⣿⡟⠀⠸⠦⣠⠘⠁⢨⠃⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
    ⣿⣿⠃⠀⠑⠤⠤⠔⠚⢥⣤⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
    ⣿⡿⠀⠀⠀⣀⣀⡀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
    ⣿⡇⠀⠀⣰⣿⣿⣿⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
    ⣿⣧⣀⡀⠉⣻⣿⣧⣤⣤⣤⣤⣽⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
    */
    State.scene.createDefaultEnvironment({
        skyboxColor: new Color3(State.scene.clearColor.r, State.scene.clearColor.g, State.scene.clearColor.b)
    })
    canvas.focus()
}

// const tilesNumberInput = document.getElementById("tilesNumber") as HTMLInputElement
// const wigglinessInput = document.getElementById("wiggliness") as HTMLInputElement
// const tileSizeInput = document.getElementById("tileSize") as HTMLInputElement
const startButton = (document.getElementById("start") as HTMLButtonElement)

document.querySelectorAll("#menu input").forEach((value) => {
    const element = value as HTMLInputElement
    let nextVal = window.localStorage.getItem(element.name)
    if (nextVal != undefined && nextVal != "" && nextVal != null) {
        element.value = nextVal
    }
    element.addEventListener("input", () => {
        window.localStorage.setItem(element.name, element.value)
    })
    document.querySelectorAll(`label[for=${element.name}]`).forEach(label => {
        const lbl = label as HTMLLabelElement
        const startText = lbl.innerHTML
        element.addEventListener("input", () => {
            lbl.innerText = startText + element.value
        })
        element.dispatchEvent(new Event("input"))
    })
})

// Initialize babylon scene, engine and camera
State.engine = new Engine(canvas, true)
State.scene = new Scene(State.engine)

State.camera = new ArcRotateCamera(
    'cam',
    -Math.PI / 2, // Alpha
    Math.PI / 2.5, // Beta
    100,
    Vector3.Zero(),
    State.scene, true
)

State.camera.upperRadiusLimit = State.camera.radius
State.camera.lowerRadiusLimit = State.camera.radius / 2

const light = new DirectionalLight("light", new Vector3(0, 0, 1), State.scene)
light.parent = State.camera
light.intensity = 3
window.addEventListener("resize", _ => {
    State.engine.resize(true)
})

window.addEventListener("keydown", (ev) => {
    if (ev.key === 'i') {
        if (State.scene.debugLayer.isVisible()) {
            State.scene.debugLayer.hide()
        } else {
            State.scene.debugLayer.show()
        }
    }
})

// Get delta time and time
let lastTime = 0
State.scene.registerBeforeRender(() => {
    State.time = performance.now() * 0.001
    State.deltaTime = State.time - lastTime
    lastTime = State.time
})

let followFunc: () => void

const mousePos: { x: number, y: number } = {
    x: 0,
    y: 0
}

window.addEventListener("mousemove", (e) => {
    mousePos.x = e.clientX
    mousePos.y = e.clientY
})

const pickPlane = MeshBuilder.CreatePlane("pickPlane", { height: canvas.height, width: canvas.width })
pickPlane.position.z = -10
pickPlane.isVisible = false
pickPlane.isPickable = true

function followMouse(mesh: Mesh) {
    const mousePosScene = State.scene.pick(mousePos.x, mousePos.y, (mesh) => mesh === pickPlane).pickedPoint
    mesh.lookAt(mousePosScene)
}

try {
    new Tree("wisetree", (element) => {
        element.mesh.position.y = 5
        element.mesh.scaling.scaleInPlace(3)
        followFunc = () => {
            followMouse(element.mesh)
        }
        State.scene.registerBeforeRender(followFunc)
        startButton.disabled = false
    })
} catch (error) {
    startButton.disabled = false
}

State.scene.clearColor = new Color4(2 / 255, 204 / 255, 254 / 255)


startButton.onclick = () => {
    messageHeading.classList.remove("title")
    messageHeading.classList.add("victory")
    messageHeading.innerText = "VITTORIA"
    menu.remove()
    State.camera.beta = Math.PI / 4
    State.camera.alpha = -Math.PI / 4
    State.scene.unregisterBeforeRender(followFunc)
    light.intensity = 1.3

    const tilesNumber = parseInt(window.localStorage.getItem("tilesNumber"))
    const wigglines = tilesNumber / 100 * parseInt(window.localStorage.getItem("wiggliness"))
    const tileSize = parseInt(window.localStorage.getItem("tileSize"))

    startGame(tilesNumber, wigglines, tileSize)
}

startButton.click()

State.engine.runRenderLoop(() => {
    State.scene.render()
})