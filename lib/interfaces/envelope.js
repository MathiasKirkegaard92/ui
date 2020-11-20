'use strict';

let math = require('../util/math');
let svg = require('../util/svg');
let Interface = require('../core/interface');
import * as Interaction from '../util/interaction';


let Point = function(point, envelope) {

    this.x = point.x;
    this.y = point.y;
    this.p = point.p | 1;


    // this.xMin = point.xMin || 0;
    // this.xMax = point.xMax || 1;
    // this.yMin = point.yMin || 0;
    // this.yMax = point.yMax || 1;

    this.xMin = 0;
    this.xMax = 1;
    this.yMin = 0;
    this.yMax = 1;
    this.pMin = point.pMin | 0.001;
    // this.pMax = point.pMax | 10;
    this.pMax = 10;

    this.envelope = envelope;

    this.element = svg.create('circle');
    this.element.setAttribute('fill', this.envelope.colors.accent);
    this.element.interaction = new Interaction.Handle('relative', 'vertical', [0, this.envelope.width], [this.envelope.height, 0]);
    this.element.interaction.sensitivity = 0.3;

    this.envelope.element.appendChild(this.element);

    this.resize = function() {
        let r = ~~(Math.min(this.envelope.width, this.envelope.height) / 50) + 2;
        this.element.setAttribute('r', r);
    };

    this.move = function(x, y) {

        this.x = (x || x === 0) ? x : this.x;
        this.y = (y || y === 0) ? y : this.y;

        if (this.envelope.nodes.indexOf(this) >= 0) {

            let prevIndex = this.envelope.nodes.indexOf(this) - 1;
            let nextIndex = this.envelope.nodes.indexOf(this) + 1;

            let prevNode = this.envelope.nodes[prevIndex];
            let nextNode = this.envelope.nodes[nextIndex];

            let lowX = prevIndex >= 0 ? prevNode.x : 0;
            lowX = lowX < this.xMin ? this.xMin : lowX;

            let highX = nextIndex < this.envelope.nodes.length ? nextNode.x : 1;
            highX = highX > this.xMax ? this.xMax : highX;

            if (this.x < lowX) {
                this.x = lowX;
            }
            if (this.x > highX) {
                this.x = highX;
            }

            if (this.y < this.yMin) {
                this.y = this.yMin;
            }
            if (this.y > this.yMax) {
                this.y = this.yMax;
            }

        }

        this.location = this.getCoordinates();
        this.element.setAttribute('cx', this.location.x);
        this.element.setAttribute('cy', this.location.y);
    };

    this.setCurve = function(p) {
        if (this.envelope.nodes.indexOf(this) > 0 && this.envelope.nodes.indexOf(this) <= this.envelope.nodes.length) {
            this.p = p;
        }
    };

    this.adjustCurve = function(pOffset) {
        if (this.envelope.nodes.indexOf(this) > 0 && this.envelope.nodes.indexOf(this) <= this.envelope.nodes.length) {
            this.p += pOffset;
        }
    };

    this.getCoordinates = function() {
        return {
            x: this.x * this.envelope.width,
            y: (1 - this.y) * this.envelope.height
        };
    };


    this.move(this.x, this.y, true);
    this.resize();

    this.destroy = function() {
        this.envelope.element.removeChild(this.element);
        this.envelope.nodes.splice(this.envelope.nodes.indexOf(this), 1);
    };


};

let DisplayPoint = function(point, envelope) {
    this.envelope = envelope;
    this.x = point.x;
    this.y = point.y;

    this.element = svg.create('circle');
    this.element.setAttribute('stroke-width', 5);
    this.element.setAttribute('fill', 'black');
    this.element.setAttribute('stroke', this.envelope.colors.axis);
    this.envelope.element.appendChild(this.element);

    this.resize = function() {
        let r = ~~(Math.min(this.envelope.width, this.envelope.height) / 50) + 2;
        this.element.setAttribute('r', r);
    };

    this.set = function(x, y) {
        this.x = x;
        this.y = y;
        this.location = this.getCoordinates();
        this.element.setAttribute('stroke-width', 5);
        this.element.setAttribute('cx', this.location.x);
        this.element.setAttribute('cy', this.location.y);
    };

    this.getCoordinates = function() {
        return {
            x: this.x * this.envelope.width,
            y: (1 - this.y) * this.envelope.height
        };
    };
    this.set(0, 0);
    this.resize();
};

/**
 * Envelope
 *
 * @description Interactive linear ramp visualization.
 *
 * @demo <span nexus-ui="envelope"></span>
 *
 * @example
 * var envelope = new Nexus.Envelope('#target')
 *
 * @example
 * var envelope = new Nexus.Envelope('#target',{
 *   'size': [300,150],
 *   'noNewPoints': false,
 *   'points': [
 *     {
 *       x: 0.1,
 *       y: 0.4
 *     },
 *     {
 *       x: 0.35,
 *       y: 0.6
 *     },
 *     {
 *       x: 0.65,
 *       y: 0.2
 *     },
 *     {
 *       x: 0.9,
 *       y: 0.4
 *     },
 *   ]
 * })
 *
 * @output
 * change
 * Fires any time a node is moved. <br>
 * The event data is an array of point locations. Each item in the array is an object containing <i>x</i> and <i>y</i> properties describing the location of a point on the envelope.
 *
 * @outputexample
 * envelope.on('change',function(v) {
 *   console.log(v);
 * })
 *
 */

export default class Envelope extends Interface {

    constructor() {

        let options = ['value'];

        let defaults = {
            'size': [300, 150],
            'maxPoints': 20,
            'noNewPoints': false,
            'points': [{
                x: 0.1,
                y: 0.4
            }, {
                x: 0.35,
                y: 0.6
            }, {
                x: 0.65,
                y: 0.2
            }, {
                x: 0.9,
                y: 0.4
            }]
        };

        super(arguments, options, defaults);

        this.points = this.settings.points;

        this.maxPoints = this.settings.maxPoints;

        this.showAxis = this.setting.showAxis;
        console.log("show axis = " + this.showAxis);

        this.nodes = [];

        this.selected = false;

        this.interaction = new Interaction.Handle('relative', 'vertical', [0, 300], [150, 0]);

        this.init();


    }

    buildInterface() {


        this.points.forEach((point) => {
            let node = new Point(point, this);
            this.nodes.push(node);
        });

        this.sortPoints();

        // Input display
        this.display = new DisplayPoint({
            x: 0,
            y: 0
        }, this);

        // Envelope curve
        this.line = svg.create('polyline');
        this.line.setAttribute('stroke-width', 2);
        this.line.setAttribute('fill', 'none');
        this.element.appendChild(this.line);

        this.fill = svg.create('polyline');
        this.fill.setAttribute('fill-opacity', '0.2');
        this.element.appendChild(this.fill);

        // X axis
        this.xAxis = svg.create('polyline');
        this.xAxis.setAttribute('stroke-width', 1);
        this.xAxis.setAttribute('stroke-dasharray', 2);
        this.xAxis.setAttribute('fill', 'none');
        this.element.appendChild(this.xAxis);

    }

    sizeInterface() {

        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].resize();
            this.nodes[i].move();
        }
        this.display.resize();
        this.interaction.resize([0, this.width], [this.height, 0]);

        this.render();

    }

    colorInterface() {

        this.element.style.backgroundColor = this.colors.fill;
        this.element.style.borderRadius = 5 + 'px';
        this.line.setAttribute('stroke', this.colors.accent);
        this.xAxis.setAttribute('stroke', this.colors.axis);
        // this.display.setAttribute('fill', this.colors.background)
        this.fill.setAttribute('fill', this.colors.accent);
        this.nodes.forEach((node) => {
            node.element.setAttribute('fill', this.colors.accent);
        });

    }

    render() {
        //  this.nodes[this.selected].move( this.points )
        this.calculatePath();
    }

    calculatePoints() {
        this.points = [];
        this.nodes.forEach((node) => {
            this.points.push({
                x: node.x,
                y: node.y,
                p: node.p
            });
        });
    }

    calculatePath() { // TODO call only on 3 neighboaring notes at a time

        //stroke data
        let data = '0 ' + this.nodes[0].location.y + ', ';

        // loop through pixels along the width and call scan(x) on each
        let resolution = 5; // TODO: maybe it should be proportional with this.width
        let xMin = 0;
        let xMax = this.width;
        for (var x = xMin; x < xMax; x += resolution) {
            let xNorm = math.normalize(x, xMin, xMax);
            let yNorm = this.scan(xNorm);
            let xy = x + ' ' + ((1 - yNorm) * this.height) + ', ';
            data += xy;
        }

        //  data += point.x*this.width+' '+ point.y*this.height+', ';
        data += this.width + ' ' + this.nodes[this.nodes.length - 1].location.y;

        this.line.setAttribute('points', data);

        // fill data
        // add bottom corners

        data += ', ' + this.width + ' ' + this.height + ', ';
        data += '0 ' + this.height;

        this.fill.setAttribute('points', data);

        // fill xAxis
        //  TODO: move to buildInterface() so its only called onces
        if (this.showAxis) {
            this.drawAxis();
        }
    }


    click() {

        // find nearest node and set this.selected (index)
        this.hasMoved = false;
        let selected = this.findNearestElement();
        if (selected != null) {
            this.selected = selected.index;
            this.selectedType = selected.type;
            let node = this.nodes[this.selected];
            console.log(selected);

            if (this.selectedType === "node") {
                node.move(this.mouse.x / this.width, 1 - this.mouse.y / this.height);
            } else if (this.selectedType === "line") {
                this.interaction.anchor = this.mouse;
                this.interaction.value = math.normalize(1 / node.p, node.pMin, node.pMax);
            }

            this.scaleNode(this.selected);
            this.calculatePoints();
            this.emit('change', this.points);
            this.render();
        }
    }

    dblClick() {
        this.hasMoved = false;
        let selected = this.findNearestElement();
        if (selected != null) {
            this.selected = selected.index;
            this.selectedType = selected.type;
            switch (this.selectedType) {
                case 'node': // reset point
                    this.nodes[this.selected].move(null, 0.5);
                    this.nodes[this.selected].setCurve(1);
                    break;
                case 'line': // Create new node 
                    this.selectedType = 'node';
                    let index = this.addPoint(this.mouse.x / this.width, 1 - this.mouse.y / this.height);
                    this.hasMoved = true;
                    this.selected = index;
                    break;
            }
        } else { // Todo: insert loop-point 
            this.selectedType = 'node';
            let index = this.addPoint(this.mouse.x / this.width, 1 - this.mouse.y / this.height);
            this.hasMoved = true;
            this.selected = index;
        }
    }

    move() {
        if (this.clicked && this.selected != null) {
            let node = this.nodes[this.selected];
            this.mouse.x = math.clip(this.mouse.x, 0, this.width);
            this.hasMoved = true;


            if (this.selectedType === "node") {
                this.nodes[this.selected].move(this.mouse.x / this.width, 1 - this.mouse.y / this.height);
            } else if (this.selectedType === "line") {
                this.interaction.update(this.mouse);

                let p = this.interaction.value;
                p = math.scale(p, 0, 1, node.pMin, node.pMax);
                p = (1 / p);
                this.nodes[this.selected].setCurve(p);
            }

            this.scaleNode(this.selected);
            this.calculatePoints();
            this.emit('change', this.points);
            this.render();
        }
    }

    release() {
        if (this.selected != null) {
            if (!this.hasMoved) {
                switch (this.selectedType) {
                    case 'node': // Remove node from envelope
                        if (this.selected + 1 < this.nodes.length) {
                            this.nodes[this.selected + 1].setCurve(1);
                        }
                        this.nodes[this.selected].destroy();
                        console.log(this.selected);
                        break;
                    case 'line': // Reset curve
                        this.nodes[this.selected].setCurve(1);
                        break;
                }
            }

            this.calculatePoints();
            console.log(this.points);
            this.emit('change', this.points);
            this.render();

            // reset this.selected
            this.selected = null;
        }
    }


    drawAxis() {
        let yCenter = '0 ' + (0.5 * this.height) + ', '; // x: 0, y: 0
        yCenter += this.width + ' ' + (0.5 * this.height); // x: 1, y: 0
        this.xAxis.setAttribute('points', yCenter);
    }


    findNearestElement() {

        let x = this.mouse.x / this.width;
        let y = 1 - this.mouse.y / this.height;

        // Node
        let nearestNode = this.findNearestNode(x, y);
        if (nearestNode.dist < 0.05) {
            return {
                index: nearestNode.index,
                type: 'node'
            };
        }

        // Line segment
        let nearestLine = this.findNearestLine(x, y);
        if (nearestLine != null && nearestLine.dist < 0.1) {
            return {
                index: nearestLine.index,
                type: 'line'
            };
        }

        return null;

    }

    findNearestNode(x, y) {

        var nearestDist = 10000;
        var nearestIndex = null;
        var before = false;
        let nodes = this.nodes;

        for (let i = 0; i < nodes.length; i++) {
            // calculate the distance from mouse to this node using pythagorean theorem
            var distance = Math.sqrt(Math.pow((nodes[i].x - x), 2) + Math.pow((nodes[i].y - y), 2));

            // if this distance is less than the previous shortest distance, use this index
            if (distance < nearestDist) {
                nearestDist = distance;
                nearestIndex = i;
                before = x > nodes[i].x;
            }
        }
        return {
            index: nearestIndex,
            dist: nearestDist
        };
    }

    findNearestLine(x, y) {
        // Todo calculate actual point -> curve distance
        let nearestDist = (Math.abs(y - this.scan(x)));
        console.log("nearerst line: " + nearestDist);
        let nearestIndex = this.getIndexFromX(x);

        // return null if nearest line is the start or end segments. 
        if (this.findNeighbors(x).clipped) {
            return null;
        } else {
            return {
                index: nearestIndex,
                dist: nearestDist
            };
        }
    }

    getIndexFromX(x) {
        let index = 0;
        this.nodes.forEach((node, i) => {
            if (this.nodes[i].x <= x) {
                index = i + 1;
            }
        });
        return index;
    }

    findNeighbors(x) {
        // find surrounding points
        let nextIndex = this.getIndexFromX(x);
        let priorIndex = nextIndex - 1;
        let clipped = false;

        if (priorIndex < 0) {
            priorIndex = 0;
            clipped = true;
        }
        if (nextIndex >= this.nodes.length) {
            nextIndex = this.nodes.length - 1;
            clipped = true;
        }

        let priorPoint = this.nodes[priorIndex];
        let nextPoint = this.nodes[nextIndex];
        return {
            priorPoint: priorPoint,
            nextPoint: nextPoint,
            clipped: clipped
        };
    }

    scaleNode(i) {

        let clippedX = math.clip(this.nodes[i].x, this.nodes[i].xMin | 0, this.nodes[i].xMax | 1);
        let clippedY = math.clip(this.nodes[i].y, this.nodes[i].yMin | 0, this.nodes[i].yMax | 1);
        let clippedP = math.clip(this.nodes[i].p, this.nodes[i].pMin, this.nodes[i].pMax);

        this.nodes[i].move(clippedX, clippedY);
        this.nodes[i].setCurve(clippedP);

    }

    /**
    Sort the this.points array from left-most point to right-most point. You should not regularly need to use this, however it may be useful if the points get unordered.
    */
    sortPoints() {
        this.nodes.sort(function(a, b) {
            return a.x > b.x;
        });
    }


    /**
    Add a breakpoint on the envelope.
    @param x {number} x location of the point, normalized (0-1)
    @param y {number} y location of the point, normalized (0-1)
    */
    addPoint(x, y) {
        if (this.settings.noNewPoints || (this.nodes.length + 1) > this.maxPoints) {
            console.log("Can't add more points. \nNPoints: " + this.nodes.length + " maxPoints: " + this.maxPoints);
            return null;
        } else {
            let index = this.getIndexFromX(x);
            this.sortPoints();

            this.nodes.splice(index, 0, new Point({
                x: x,
                y: y,
                p: 1
            }, this));

            this.scaleNode(index);
            this.calculatePoints();
            this.emit('change', this.points);
            this.render();
            return index;
        }
    }

    /**
    Move a breakpoint on the envelope.
    @param index {number} The index of the breakpoint to move
    @param x {number} New x location, normalized 0-1
    @param y {number} New y location, normalized 0-1
    */
    movePoint(index, x, y) {
        this.nodes[index].move(x, y);
        this.scaleNode(index);
        this.calculatePoints();
        this.emit('change', this.points);
        this.render();
    }


    /**
    Move a breakpoint on the envelope by a certain amount.
    @param index {number} The index of the breakpoint to move
    @param xOffset {number} X displacement, normalized 0-1
    @param yOffset {number} Y displacement, normalized 0-1
    */
    adjustPoint(index, xOffset, yOffset) {
        this.nodes[index].move(this.nodes[index].x + xOffset, this.nodes[index].y + yOffset);
        this.scaleNode(index);
        this.calculatePoints();
        this.emit('change', this.points);
        this.render();
    }


    /**
    Remove a breakpoint from the envelope.
    @param index {number} Index of the breakpoint to remove
    */
    destroyPoint(index) {
        this.nodes[index].destroy();
        this.calculatePoints();
        this.emit('change', this.points);
        this.render();
    }

    /**
    Find the level at a certain x location on the envelope.
    @param x {number} The x location to find the level of, normalized 0-1
    */

    scan(x) {
        // find surrounding points
        let nextIndex = this.getIndexFromX(x);
        let priorIndex = nextIndex - 1;
        let clipped = false;

        if (priorIndex < 0) {
            priorIndex = 0;
            clipped = true;
        }
        if (nextIndex >= this.nodes.length) {
            nextIndex = this.nodes.length - 1;
            clipped = true;
        }

        let priorPoint = this.nodes[priorIndex];
        let nextPoint = this.nodes[nextIndex];

        var expScale = 0;
        if (clipped) {
            expScale = 1;
        } else {
            expScale = nextPoint.p;
        }

        // experiments
        // if(loc <0.5){
        //     expScale = math.scale(expScale,nextPoint.pMin,nextPoint.pMax,nextPoint.pMax,nextPoint.pMin);
        // }
        let value = this.applyExpCurve(x, priorPoint, nextPoint, expScale);
        this.emit('scan', value);
        return value;
    }

    applyExpCurve(x, priorPoint, nextPoint, exp) {
        let value;
        let loc = math.scale(x, priorPoint.x, nextPoint.x, 0, 1);
        if (nextPoint.y - priorPoint.y < 0) {
            value = math.interp(Math.pow(1 - loc, exp), nextPoint.y, priorPoint.y);
        } else {
            value = math.interp(Math.pow(loc, exp), priorPoint.y, nextPoint.y);
        }
        return value;
    }

    // applySigmoidCurve(){

    // }


    /**
    Remove all existing breakpoints and add an entirely new set of breakpoints.
    @param allPoints {array} An array of objects with x/y properties (normalized 0-1). Each object in the array specifices the x/y location of a new breakpoint to be added.
    */
    setPoints(allPoints) {
        while (this.nodes.length) {
            this.nodes[0].destroy();
        }
        allPoints.forEach((point) => {
            this.addPoint(point.x, point.y);
        });
        this.calculatePoints();
        this.emit('change', this.points);
        this.render();
    }

    setDisplay(x, y) {
        if (x == null) {
            x = this.display.x;
        }
        if (y == null) {
            y = this.display.y;
        }
        this.display.set(x, y);
    }

}