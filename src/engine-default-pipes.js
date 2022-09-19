"use strict";

import Pipe from "./pipe";

const Pipes = [];

//numbers pipes
Pipes.push(new Pipe("scale", (v, factor) => v * factor));
Pipes.push(new Pipe("add", (v, r) => v + r));
Pipes.push(new Pipe("sub", (v, r) => v - r));

//strings pipes
Pipes.push(new Pipe("trim", (v) => v.trim()));
Pipes.push(new Pipe("upper", (v) => v.toUpperCase()));
Pipes.push(new Pipe("lower", (v) => v.toLowerCase()));

export default Pipes;
