const BLOCKS = {
    EMPTY: 0,
    GRASS: 1,
    DIRT: 2,
    STONE: 3,
    SAND: 4,
    WOOD: 5
};

const BLOCK_TEXTURES = {
    [BLOCKS.GRASS]: { color: 0x2d8f2d },
    [BLOCKS.DIRT]: { color: 0x8b6f47 },
    [BLOCKS.STONE]: { color: 0x7f7f7f },
    [BLOCKS.SAND]: { color: 0xc2a76f },
    [BLOCKS.WOOD]: { color: 0x6b4423 }
};

const BLOCK_NAMES = {
    [BLOCKS.GRASS]: 'Pasto',
    [BLOCKS.DIRT]: 'Tierra',
    [BLOCKS.STONE]: 'Piedra',
    [BLOCKS.SAND]: 'Arena',
    [BLOCKS.WOOD]: 'Madera'
};

function getBlockName(blockId) {
    return BLOCK_NAMES[blockId] || 'Desconocido';
}

function getBlockColor(blockId) {
    const tex = BLOCK_TEXTURES[blockId];
    return tex ? tex.color : 0xffffff;
}
