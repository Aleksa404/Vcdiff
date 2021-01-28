test('VCDiff encode', function () {
    let vcd = new Vcdiff();
    vcd.blockSize = 3;

    deepEqual(vcd.encode('abc', 'd'), ['d']);

    deepEqual(vcd.encode('abc', 'defghijk'), ['defghijk']);


    deepEqual(vcd.encode('abcdef', 'abcdef'), []);

    deepEqual(vcd.encode('abc', 'defabc'), ['def', 0, 3]);

    deepEqual(vcd.encode('abcdef', 'defghiabc'), [3, 3, 'ghi', 0, 3]);
});

test('VCDiff decode', function () {
    let vcd = new Vcdiff(), diff, dict, target;

    dict = 'abc';
    target = 'd';
    diff = vcd.encode(dict, target);
    equals(vcd.decode(dict, diff), 'd');

    dict = 'abc';
    target = 'defghijk';
    diff = vcd.encode(dict, target);
    equals(vcd.decode(dict, diff), 'defghijk');

    vcd.blockSize = 3;
    
    dict = 'abcdef';
    target = 'abcdef';
    diff = vcd.encode(dict, target);
    equals(vcd.decode(dict, diff), 'abcdef');

    dict = 'abc';
    target = 'defabc';
    diff = vcd.encode(dict, target);
    equals(vcd.decode(dict, diff), 'defabc');

    dict = 'abcdef';
    target = 'defghiabc';
    diff = vcd.encode(dict, target);
    equals(vcd.decode(dict, diff), 'defghiabc');
});


