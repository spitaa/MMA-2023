import { Color3, Mesh, Sound, StandardMaterial, Vector3 } from "@babylonjs/core"
import { MeshBuilder } from "@babylonjs/core"
import { TransformNode } from "@babylonjs/core/Meshes/transformNode"
import BaseElement from "../core/elements/base"
import State from "../core/state"
import Utils from "../core/utils"
import GolfClub from "./golfclub"

export default class ThrowIndicator extends BaseElement {
    private static golfhit: Sound
    private currentFunction: () => void
    pivot: Vector3
    golfclubPivot: TransformNode
    direction: Vector3
    force: number
    maxForce: number
    onThrow: (direction: Vector3) => void

    constructor(name: string, mesh: Mesh, onMeshesLoaded: () => void, onThrow: (direction: Vector3) => void, maxForce = 10) {
        super()
        this.pivot = mesh.getAbsolutePosition()
        this.maxForce = maxForce
        this.currentFunction = this.spin.bind(this)
        this.onThrow = onThrow

        // Create the triangle mesh
        this.mesh = MeshBuilder.CreatePolyhedron(name, {
            sizeX: 5,
            sizeY: 2,
            sizeZ: 3,
            custom: {
                "vertex": [
                    [-0.5, 0, -0.5], [0, 0, 1], [0.5, 0, -0.5],
                    [-0.5, 1, -0.5], [0, 1, 1], [0.5, 1, -0.5]
                ],
                "face": [
                    [0, 1, 2], [3, 4, 5],
                    [0, 1, 4, 3], [1, 2, 5, 4],
                    [2, 0, 3, 5]
                ]
            }
        })
        this.mesh.material = Utils.createMaterial(ThrowIndicator.material, () => {
            ThrowIndicator.material = new StandardMaterial("arrowMat")
            ThrowIndicator.material.diffuseColor = Color3.Yellow()
            ThrowIndicator.golfhit = new Sound("golfhit", "assets/audio/golfhit.mp3", State.scene)
            return ThrowIndicator.material
        })

        // Create golf club
        new GolfClub("golfClub", (element) => {
            element.mesh.scaling.scaleInPlace(2)
            const meshBoxInfo = mesh.getBoundingInfo()
            const size = meshBoxInfo.maximum.z - meshBoxInfo.minimum.z
            this.golfclubPivot = new TransformNode(element.mesh.name + "pivot")
            this.golfclubPivot.position = new Vector3(
                this.pivot.x,
                this.pivot.y + 16,
                this.pivot.z - (size * 1.1)
            )
            element.mesh.parent = this.golfclubPivot
            element.mesh.position.y -= 16
            this.mesh.position = new Vector3(
                this.pivot.x,
                this.pivot.y - 1.25,
                this.pivot.z + 5
            )
            onMeshesLoaded()

            // Start animation
            State.scene.registerBeforeRender(this.currentFunction)
        })
    }

    spin() {
        // Rotation - First launch phase
        this.mesh.rotateAround(this.pivot, Vector3.Up(), State.deltaTime * 1.5)
        this.golfclubPivot.rotateAround(this.pivot, Vector3.Up(), State.deltaTime * 1.5)

        this.direction = this.mesh.position.subtract(this.pivot)
        if (State.keys[" "]) {
            State.scene.unregisterBeforeRender(this.currentFunction)
            this.currentFunction = this.swing.bind(this)
            State.keys[" "] = false
            State.scene.registerBeforeRender(this.currentFunction)
        }
    }

    private lastValue: number = 0
    private throwConfirmed: boolean = false
    swing() {
        // Swing - Second launch phase
        if (!this.throwConfirmed) {
            this.force = 20 * Math.abs((State.time / 2) - Math.floor((State.time / 2) + 1 / 2)) // triangular pulse
            this.mesh.translate(Vector3.Forward(), this.force - this.lastValue)
            this.golfclubPivot.rotate(Vector3.Right(), (this.force - this.lastValue) / 4)

            this.lastValue = this.force
        }

        if (State.keys[" "]) {
            this.throwConfirmed = true
        }
        if (this.throwConfirmed) {
            // Finish golf club movement
            this.golfclubPivot.rotate(Vector3.Right(), -5 * State.deltaTime)
            if (this.golfclubPivot.absoluteRotationQuaternion.toEulerAngles().x <= 0) {
                ThrowIndicator.golfhit.play()
                // Throw
                this.onThrow(this.direction.scale(this.force * this.maxForce))
            }
        }
    }

    destroy() {
        // Delete all meshes and animations
        State.scene.unregisterBeforeRender(this.currentFunction)
        this.mesh.dispose()
        this.golfclubPivot.dispose()
        this.throwConfirmed = false
    }
}