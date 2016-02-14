// https://gist.github.com/banksean/300494
var MersenneTwister=function(t){void 0==t&&(t=(new Date).getTime()),this.N=624,this.M=397,this.MATRIX_A=2567483615,this.UPPER_MASK=2147483648,this.LOWER_MASK=2147483647,this.mt=new Array(this.N),this.mti=this.N+1,this.init_genrand(t)};MersenneTwister.prototype.init_genrand=function(t){for(this.mt[0]=t>>>0,this.mti=1;this.mti<this.N;this.mti++){var t=this.mt[this.mti-1]^this.mt[this.mti-1]>>>30;this.mt[this.mti]=(1812433253*((4294901760&t)>>>16)<<16)+1812433253*(65535&t)+this.mti,this.mt[this.mti]>>>=0}},MersenneTwister.prototype.init_by_array=function(t,i){var s,h,n;for(this.init_genrand(19650218),s=1,h=0,n=this.N>i?this.N:i;n;n--){var r=this.mt[s-1]^this.mt[s-1]>>>30;this.mt[s]=(this.mt[s]^(1664525*((4294901760&r)>>>16)<<16)+1664525*(65535&r))+t[h]+h,this.mt[s]>>>=0,s++,h++,s>=this.N&&(this.mt[0]=this.mt[this.N-1],s=1),h>=i&&(h=0)}for(n=this.N-1;n;n--){var r=this.mt[s-1]^this.mt[s-1]>>>30;this.mt[s]=(this.mt[s]^(1566083941*((4294901760&r)>>>16)<<16)+1566083941*(65535&r))-s,this.mt[s]>>>=0,s++,s>=this.N&&(this.mt[0]=this.mt[this.N-1],s=1)}this.mt[0]=2147483648},MersenneTwister.prototype.genrand_int32=function(){var t,i=new Array(0,this.MATRIX_A);if(this.mti>=this.N){var s;for(this.mti==this.N+1&&this.init_genrand(5489),s=0;s<this.N-this.M;s++)t=this.mt[s]&this.UPPER_MASK|this.mt[s+1]&this.LOWER_MASK,this.mt[s]=this.mt[s+this.M]^t>>>1^i[1&t];for(;s<this.N-1;s++)t=this.mt[s]&this.UPPER_MASK|this.mt[s+1]&this.LOWER_MASK,this.mt[s]=this.mt[s+(this.M-this.N)]^t>>>1^i[1&t];t=this.mt[this.N-1]&this.UPPER_MASK|this.mt[0]&this.LOWER_MASK,this.mt[this.N-1]=this.mt[this.M-1]^t>>>1^i[1&t],this.mti=0}return t=this.mt[this.mti++],t^=t>>>11,t^=t<<7&2636928640,t^=t<<15&4022730752,t^=t>>>18,t>>>0},MersenneTwister.prototype.genrand_int31=function(){return this.genrand_int32()>>>1},MersenneTwister.prototype.genrand_real1=function(){return this.genrand_int32()*(1/4294967295)},MersenneTwister.prototype.random=function(){return this.genrand_int32()*(1/4294967296)},MersenneTwister.prototype.genrand_real3=function(){return(this.genrand_int32()+.5)*(1/4294967296)},MersenneTwister.prototype.genrand_res53=function(){var t=this.genrand_int32()>>>5,i=this.genrand_int32()>>>6;return(67108864*t+i)*(1/9007199254740992)};

// Thanks Scott
// https://github.com/ScottSWu/Minsweeper

var Minsweeper = function(width, height, mines, params, seed) {
    params = (params === undefined) ? {} : params;
    
    this.width = width;
    this.height = height;
    this.mines = mines;
    if (params.firstSafe) {
        this.firstSafe = params.firstSafe;
    }
    
    this.reset(seed);
}

Minsweeper.prototype.constructor = Minsweeper;

Minsweeper.NOTSTARTED = 0;
Minsweeper.STARTED = 1;
Minsweeper.DIED = 2;
Minsweeper.COMPLETED = 3;

/*
    Reset the game.
*/
Minsweeper.prototype.reset = function(seed) {
    // 0 = beginning, 1 = running, 2 = died, 3 = completed
    this.startTime = -1;
    this.endTime = -1;
    
    this.state = Minsweeper.NOTSTARTED;
    this.started = false;
    
    this.board = new Minsweeper.Board(this.width, this.height, this.mines, seed);
}

/*
    Get the current game time.
*/
Minsweeper.prototype.getTime = function(time) {
    switch (this.state) {
        default:
        case Minsweeper.NOTSTARTED:
            return 0;
        case Minsweeper.STARTED:
            return Date.now() - this.startTime;
        case Minsweeper.DIED:
        case Minsweeper.COMPLETED:
            return this.endTime - this.startTime;
    }
}

/*
    Open a certain coordinate in the game.
*/
Minsweeper.prototype.open = function(r, c) {
    var result = this.board.open(r, c);
    switch (result) {
        case Minsweeper.Board.SAFE:
        case Minsweeper.Board.MINE:
            if (!this.started) {
                this.startTime = Date.now();
                this.started = true;
                this.state = Minsweeper.STARTED;
            }
            break;
        default:
            break;
    }
    switch (result) {
        case Minsweeper.Board.SAFE:
            if (this.board.isCompleted()) {
                this.endTime = Date.now();
                this.state = Minsweeper.COMPLETED;
            }
            break;
        case Minsweeper.Board.MINE:
            this.endTime = Date.now();
            this.state = Minsweeper.DIED;
            break;
        default:
            break;
    }
    return result;
}

/*
    Chord a coordinate in the game.
*/
Minsweeper.prototype.chord = function(r, c) {
    var result = this.board.chord(r, c);
    if (this.board.isCompleted()) {
        this.endTime = Date.now();
        this.state = Minsweeper.COMPLETED;
    }
    return result;
}

/*
    Flag a coordinate in the game.
*/
Minsweeper.prototype.flag = function(r, c) {
    var result = this.board.flag(r, c);
    return result;
}

/*
    Get a flattened array of the visible board.
*/
Minsweeper.prototype.getBoard = function() {
    return this.board.getVisible();
}

/*
    Get a 2-d array of the visible board.
*/
Minsweeper.prototype.getBoard2 = function() {
    var array1 = this.board.getVisible();
    var array2 = [];
    var offset = 0;
    for (var r = 0; r < this.height; r++) {
        array2.push([]);
        for (var c = 0; c < this.width; c++) {
            array2[r].push(array1[offset]);
            offset++;
        }
    }
    return array2;
}

/*
    log the board to the console.
*/
Minsweeper.prototype.logBoard = function() {
    var board = this.board.getVisible();
    var output = "";
    var offset = 0;
    for (var r = 0; r < this.height; r++) {
        for (var c = 0; c < this.width; c++) {
            switch (board[offset]) {
                case -2:
                    output += "P";
                    break;
                case -1:
                    output += "O";
                    break;
                default:
                    output += board[offset];
                    break;
            }
            output += " ";
            offset++;
        }
        output += "\n";
    }
    console.log(output);
}

/*
    Check if the game has started.
*/
Minsweeper.prototype.getState = function() {
    return this.state;
}

Minsweeper.Board = function(width, height, mines, seed) {
    this.width = width;
    this.height = height;
    this.maxoffset = width * height;
    this.mines = mines;
    this.opened = 0;
    this.flagged = 0;
    // -1 = mine, 0-8 = number
    this.grid = [];
    // 0 = hidden, 1 = revealed, 2 = flagged
    this.status = [];
    // 0-8 = number, -1 = unknown, -2 = flagged, 9 = mine
    this.visible = [];
    
    // Populate mines and squares
    for (var i = 0; i < width * height && i < mines; i++) {
        this.grid.push(-1);
        this.status.push(0);
        this.visible.push(-1);
    }
    for (var i = mines; i < width * height; i++) {
        this.grid.push(0);
        this.status.push(0);
        this.visible.push(-1);
    }
    
    var instance = this;
    
    // Fisher-Yates shuffle
    var m = new MersenneTwister(seed);
    for (var i = width * height - 1; i >= 1; i--) {
        var r = ~~(m.random() * (i + 1));
        var t = this.grid[i];
        this.grid[i] = this.grid[r];
        this.grid[r] = t;
    }
    
    // Compute numbers
    for (var r = 0; r < height; r++) {
        for (var c = 0; c < width; c++) {
            var offset = this.c2o(r, c);
            if (this.grid[offset] == 0) {
                // Count mines
                var count = 0;
                Minsweeper.Board.SURROUNDING.forEach(function(coord) {
                    var nr = r + coord[0];
                    var nc = c + coord[1];
                    var no = instance.c2o(nr, nc);
                    if (instance.inBounds(nr, nc) && instance.grid[no] < 0) {
                        count++;
                    }
                });
                
                this.grid[offset] = count;
            }
        }
    }
}

Minsweeper.Board.prototype.constructor = Minsweeper.Board;

Minsweeper.Board.SURROUNDING = [
    [ -1, -1 ], [ -1, 0 ], [ -1, 1 ],
    [ 0, -1 ], [ 0, 1 ],
    [ 1, -1 ], [ 1, 0 ], [ 1, 1 ]
];
Minsweeper.Board.SURROUNDING_CARDINAL = [
    [ -1, 0 ], [ 0, -1 ], [ 0, 1 ],
    [ 1, 0 ]
];
Minsweeper.Board.ALREADYOPENED = 10;
Minsweeper.Board.FLAGGED = 11;
Minsweeper.Board.UNFLAGGED = 12;
Minsweeper.Board.OUTOFBOUNDS = 13;
Minsweeper.Board.INVALID = 14;
Minsweeper.Board.SAFE = 20;
Minsweeper.Board.MINE = 21;

/*
    Check if a coordinate is in bounds.
*/
Minsweeper.Board.prototype.inBounds = function(r, c) {
    return r >= 0 && r < this.height && c >= 0 && c < this.width;
}

/*
    Convert coordinate to array offset.
*/
Minsweeper.Board.prototype.c2o = function(r, c) {
    return r * this.width + c;
}

/*
    Convert array offset to coordinate.
*/
Minsweeper.Board.prototype.o2c = function(x) {
    return { r: ~~(x / this.width), c: x % this.width };
}

/*
    Open a coordinate.
*/
Minsweeper.Board.prototype.open = function(r, c) {
    var instance = this;
    
    if (this.inBounds(r, c)) {
        var offset = this.c2o(r, c);
        if (this.status[offset] == 1) {
            return Minsweeper.Board.ALREADYOPENED;
        }
        if (this.status[offset] == 2) {
            return Minsweeper.Board.FLAGGED;
        }
        if (this.grid[offset] == -1) {
            if (this.opened > 0) {
                return Minsweeper.Board.MINE;
            } else {
                var ALL = Minsweeper.Board.SURROUNDING;
                ALL.push([0, 0]);
                ALL.forEach(function(coord) {
                    var found = false, q = ~~(Math.random() * (instance.width * instance.height));
                    while (!found) {
                        if (q == offset) continue;
                        if (instance.grid[q] != -1) {
                            found = true;
                        } else {
                            q = ~~(Math.random() * (instance.width * instance.height));
                        }
                    }
                    instance.grid[offset] = 0;
                    instance.grid[q] = -1;
                });
                for (var r = 0; r < instance.height; r++) {
                    for (var c = 0; c < instance.width; c++) {
                        var offset = instance.c2o(r, c);
                        if (instance.grid[offset] == 0) {
                            // Count mines
                            var count = 0;
                            Minsweeper.Board.SURROUNDING.forEach(function(coord) {
                                var nr = r + coord[0];
                                var nc = c + coord[1];
                                var no = instance.c2o(nr, nc);
                                if (instance.inBounds(nr, nc) && instance.grid[no] < 0) {
                                    count++;
                                }
                            });
                            
                            instance.grid[offset] = count;
                        }
                    }
                }
            }
        }
        
        if (this.grid[offset] == 0) {
            var openstack = [ [ r, c ] ];
            while (openstack.length > 0) {
                var coords = openstack.pop();
                var offset = this.c2o(coords[0], coords[1]);
                if (this.status[offset] == 1) {
                    continue;
                }
                this.status[offset] = 1;
                this.visible[offset] = this.grid[offset];
                this.opened++;
                
                var select;
                if (this.grid[offset] == 0) {
                    select = Minsweeper.Board.SURROUNDING;
                } else if (this.grid[offset] > 0 && this.grid[offset] <= 8) {
                    select = []; // Minsweeper.Board.SURROUNDING_CARDINAL;
                }
                select.forEach(function(coord) {
                    var nr = coords[0] + coord[0];
                    var nc = coords[1] + coord[1];
                    var no = instance.c2o(nr, nc);
                    console.log(instance.grid[no]);
                    if (instance.inBounds(nr, nc) && instance.grid[no] >= 0 && instance.grid[no] <= 8) {
                        openstack.push([ nr, nc ]);
                    }
                });
            }
        }
        else {
            this.status[offset] = 1;
            this.visible[offset] = this.grid[offset];
            this.opened++;
        }
        
        return Minsweeper.Board.SAFE;
    }
    else {
        return Minsweeper.Board.OUTOFBOUNDS;
    }
}

/*
    Chord a coordinate.
*/
Minsweeper.Board.prototype.chord = function(r, c) {
    var instance = this;
    
    if (this.inBounds(r, c)) {
        var offset = this.c2o(r, c);
        switch (this.status[offset]) {
            case 1:
                var needed = this.grid[offset];
                var flags = 0;
                Minsweeper.Board.SURROUNDING.forEach(function(coord) {
                    var nr = r + coord[0];
                    var nc = c + coord[1];
                    var no = instance.c2o(nr, nc);
                    if (instance.inBounds(nr, nc) && instance.status[no] == 2) {
                        flags++;
                    }
                });
                
                if (flags == needed) {
                    var result = Minsweeper.Board.SAFE;
                    Minsweeper.Board.SURROUNDING.forEach(function(coord) {
                        var nr = r + coord[0];
                        var nc = c + coord[1];
                        var no = instance.c2o(nr, nc);
                        if (instance.inBounds(nr, nc) && instance.status[no] == 0) {
                            if (instance.open(nr, nc) == Minsweeper.Board.MINE) {
                                result = Minsweeper.Board.MINE;
                            }
                        }
                    });
                    return result;
                }
                else {
                    return Minsweeper.Board.INVALID;
                }
            default:
                return Minsweeper.Board.INVALID;
        }
    }
    else {
        return Minsweeper.Board.OUTOFBOUNDS;
    }
}

/*
    Flag a coordinate.
*/
Minsweeper.Board.prototype.flag = function(r, c) {
    if (this.inBounds(r, c)) {
        var offset = this.c2o(r, c);
        switch (this.status[offset]) {
            case 0:
                this.flagged++;
                this.status[offset] = 2;
                this.visible[offset] = -2;
                return Minsweeper.Board.FLAGGED;
            case 2:
                this.flagged--;
                this.status[offset] = 0;
                this.visible[offset] = -1;
                return Minsweeper.Board.UNFLAGGED;
            default:
            case 1:
                return Minsweeper.Board.ALREADYOPENED;
        }
    }
    else {
        return Minsweeper.Board.OUTOFBOUNDS;
    }
}

/*
    Generate the visible board.
*/
Minsweeper.Board.prototype.getVisible = function() {
    return this.visible;
}

/*
    Return whether or not the board has been completed.
*/
Minsweeper.Board.prototype.isCompleted = function () {
    return this.opened == this.maxoffset - this.mines;
}


/**
	If required, add to exports
*/
try {
	module.exports = Minsweeper;
}
catch (e) {
	
}