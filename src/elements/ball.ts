import ModelElement from "../core/elements/modelelement"

export default class Ball extends ModelElement {
    constructor(name: string) {
        super(name, require("/assets/golfball/golfball.obj"))
    }
}