class RollingHash {
    constructor(){
        this.primeBase = 257;
        this.primeMod = 1000000007;
        this.lastPower = 0;
        this.lastString = '';
        this.lastHash = 0;
    }
    moduloExp = (base, power, modulo) => {
        let toReturn = 1, i;
        for (i = 0; i < power; i += 1) {
            toReturn = (base * toReturn) % modulo;
        }
        return toReturn;
    }
    hash = (toHash) => {
        let hash = 0, toHashArray = toHash.split(''), i, 
            len = toHashArray.length;
        for (i = 0; i < len; i += 1) {
            hash += (toHashArray[i].charCodeAt(0) * this.moduloExp(this.primeBase, len - 1 - i, this.primeMod)) % this.primeMod;
            hash %= this.primeMod;
        }
        this.lastPower = this.moduloExp(this.primeBase, len - 1, this.primeMod);
        this.lastString = toHash;
        this.lastHash = hash;
        return hash;
    }
    nextHash = (toAdd) => {
        let hash = this.lastHash, lsArray = this.lastString.split('');
        hash -= (lsArray[0].charCodeAt(0) * this.lastPower);
        hash = hash * this.primeBase + toAdd.charCodeAt(0);
        hash %= this.primeMod;
        if (hash < 0) {
            hash += this.primeMod;
        }
        lsArray.shift();
        lsArray.push(toAdd);
        this.lastString = lsArray.join('');
        this.lastHash = hash;
        return hash;
    }

}

class Block {
    constructor(text, offset) {
        this.text = text;
        this.offset = offset;
        this.nextBlock = null;
    };

    getText = () => {
        return this.text;
    }

    getOffset = () => {
        return this.offset;
    }


    setNextBlock = (nextBlock) => {
        this.nextBlock = nextBlock;
    }

    getNextBlock =() => {
        return this.nextBlock;
    }
}
class BlockText {
    constructor (originalText, blockSize) {
        this.originalText = originalText;
        this.blockSize = blockSize;
        this.blocks = [];
    
        let i, len = originalText.split('').length, endIndex;
        for (i = 0; i < len; i += blockSize) {
            endIndex = i + blockSize >= len ? len : i + blockSize;
            this.blocks.push(new Block(originalText.substring(i, endIndex), i));
        }
    };

    
        getBlocks = () => {
            return this.blocks;
        }

        getOriginalText = () => {
            return this.originalText;
        }

        getBlockSize = () => {
            return this.blockSize;
        }
}

class Dictionary {
    constructor() {
        this.dictionary = {};
        this.dictionaryText = null;
        };


        put = (key, block) => {
            if (!this.dictionary.hasOwnProperty(key)) {
                this.dictionary[key] = [];
            }
            this.dictionary[key].push(block);
        }
    

        populateDictionary =(dictText, hasher)=> {
            this.dictionary = {};
            this.dictionaryText = dictText;
            let blocks = dictText.getBlocks(), i, len;
            for (i = 0, len = blocks.length; i < len; i += 1) {
                this.put(hasher.hash(blocks[i].getText()), blocks[i]);
            }
        }
    

        getMatch =(hash, blockSize, target) => {
            let blocks, i, len, dictText, targetText, currentPointer;
            if (this.dictionary.hasOwnProperty(hash)) {
                blocks = this.dictionary[hash];
                for (i = 0, len = blocks.length; i < len; i += 1) {
                    if (blocks[i].getText() === target.substring(0, blockSize)) {
                        if (this.dictionaryText !== null && blocks[i].getNextBlock() === null) {
                            dictText = this.dictionaryText.getOriginalText().substring(blocks[i].getOffset() + blockSize);
                            targetText = target.substring(blockSize);
                            if (dictText.length === 0 || targetText.length === 0) {
                                return blocks[i];
                            }
                            currentPointer = 0;
                            while (currentPointer < dictText.length && currentPointer < targetText.length &&
                            dictText[currentPointer] === targetText[currentPointer]) {
                                currentPointer += 1;
                            }
                            return new diffable.Block(blocks[i].getText() + dictText.substring(0, currentPointer), blocks[i].getOffset());
                        } else if (blocks[i].getNextBlock() !== null) {
                            return blocks[i];
                        } else {
                            return blocks[i];
                        }
                    }
                }
                return null;
            }
            return null;
        }

};

class Vcdiff {
    constructor(hasher, dictText) {
        this.hash = hasher;
        this.dictText = new Dictionary();
        this.blockSize = 20;
        this.hash = new RollingHash();
    };


    encode =(dict, target) => {
            if (dict === target) {
                return [];
            }
            let diffString = [], targetLength, targetIndex, currentHash, 
                addBuffer = '', match;
            this.dictText.populateDictionary(new BlockText(dict, this.blockSize), this.hash);
            targetLength = target.length;
            targetIndex = 0;
            currentHash = -1;
            while (targetIndex < targetLength) {
                if (targetLength - targetIndex < this.blockSize) {
                    diffString.push(addBuffer + target.substring(targetIndex, targetLength));
                    break;
                } else {
                    if (currentHash === -1) {
                        currentHash = this.hash.hash(target.substring(targetIndex, targetIndex + this.blockSize));
                    } else {
                        currentHash = this.hash.nextHash(target[targetIndex + (this.blockSize - 1)]);
                        if (currentHash < 0) {
                            currentHash = this.hash.hash(target.substring(0, targetIndex + this.blockSize));
                        }
                    }
                    match = this.dictText.getMatch(currentHash, this.blockSize, target.substring(targetIndex));
                    if (match === null) {
                        addBuffer += target[targetIndex];
                        targetIndex += 1;
                    } else {
                        if (addBuffer.length > 0) {
                            diffString.push(addBuffer);
                            addBuffer = '';
                        }
                        diffString.push(match.getOffset());
                        diffString.push(match.getText().length);
                        targetIndex += match.getText().length;
                        currentHash = -1;
                    }
                }
            }
            return diffString;
        }
    
        
        decode = (dict, diff) => {
            let output = [], i;
            if (diff.length === 0) {
                return dict;
            }
            for (i = 0; i < diff.length; i += 1) {
                if (typeof diff[i] === 'number') {
                    output.push(dict.substring(diff[i], diff[i] + diff[i + 1]));
                    i += 1;
                } else if (typeof diff[i] === 'string') {
                    output.push(diff[i]);
                }
            }
            return output.join('');
        }
};


