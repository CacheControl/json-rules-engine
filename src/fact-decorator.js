import Fact from "./fact";

class FactDecorator {

    /**
     * 
     * @param {string} id 
     * @param {function} cb Function that computes the new fact value by invoking a 3rd argument
     * that is a function to produce the next value
     * @param {object} options options to override the defaults from the decorated fact
     */
    constructor(id, cb, options) {
        this.id = id
        this.cb = cb
        if (options) {
            this.options = options
        } else {
            this.options = {}
        }
    }

    /**
     * 
     * @param {Fact} fact to decorate
     * @returns {Fact} the decorated fact
     */
    decorate(fact) {
        const next = fact.calculate.bind(fact);
        return new Fact(
            `${this.id}:${fact.id}`,
            (params, almanac) => this.cb(params, almanac, next),
            Object.assign({}, this.options, fact.options)
        )
    }

}


export default FactDecorator