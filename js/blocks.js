const BLOCKS = {
    EMPTY: 0,
    GRASS: 1,
    DIRT: 2,
    STONE: 3,
    SAND: 4,
    WOOD: 5,
    ASPHALT: 6,
    SIDEWALK: 7,
    BUILDING_A: 8,
    BUILDING_B: 9,
    BUILDING_C: 10,
    WINDOW: 11,
    WATER: 12,
    LEAVES: 13,
    MARBLE: 14,
    PINK: 15,
    METAL: 16,
    AZUL_BOCA: 17,
    AMARILLO: 18
};

const BLOCK_TEXTURES = {
    [BLOCKS.GRASS]: { color: 0x2d8f2d },
    [BLOCKS.DIRT]: { color: 0x8b6f47 },
    [BLOCKS.STONE]: { color: 0x7f7f7f },
    [BLOCKS.SAND]: { color: 0xc2a76f },
    [BLOCKS.WOOD]: { color: 0x6b4423 },
    [BLOCKS.ASPHALT]: { color: 0x3a3a3e },
    [BLOCKS.SIDEWALK]: { color: 0xa8a8a2 },
    [BLOCKS.BUILDING_A]: { color: 0xb5b0a8 },
    [BLOCKS.BUILDING_B]: { color: 0xc9b8a0 },
    [BLOCKS.BUILDING_C]: { color: 0x8f9aa5 },
    [BLOCKS.WINDOW]: { color: 0x7ec8e3 },
    [BLOCKS.WATER]: { color: 0x4a7c9b },
    [BLOCKS.LEAVES]: { color: 0x246b24 },
    [BLOCKS.MARBLE]: { color: 0xefefe6 },
    [BLOCKS.PINK]: { color: 0xd98b98 },
    [BLOCKS.METAL]: { color: 0xb8bcc4 },
    [BLOCKS.AZUL_BOCA]: { color: 0x14508c },
    [BLOCKS.AMARILLO]: { color: 0xf5c518 }
};

const BLOCK_NAMES = {
    [BLOCKS.GRASS]: 'Pasto',
    [BLOCKS.DIRT]: 'Tierra',
    [BLOCKS.STONE]: 'Piedra',
    [BLOCKS.SAND]: 'Arena',
    [BLOCKS.WOOD]: 'Madera',
    [BLOCKS.ASPHALT]: 'Asfalto',
    [BLOCKS.SIDEWALK]: 'Vereda',
    [BLOCKS.BUILDING_A]: 'Edificio',
    [BLOCKS.BUILDING_B]: 'Edificio',
    [BLOCKS.BUILDING_C]: 'Edificio',
    [BLOCKS.WINDOW]: 'Ventana',
    [BLOCKS.WATER]: 'Agua',
    [BLOCKS.LEAVES]: 'Hojas',
    [BLOCKS.MARBLE]: 'Mármol',
    [BLOCKS.PINK]: 'Rosado',
    [BLOCKS.METAL]: 'Metal',
    [BLOCKS.AZUL_BOCA]: 'Azul',
    [BLOCKS.AMARILLO]: 'Amarillo'
};

function getBlockName(blockId) {
    return BLOCK_NAMES[blockId] || 'Desconocido';
}

function getBlockColor(blockId) {
    const tex = BLOCK_TEXTURES[blockId];
    return tex ? tex.color : 0xffffff;
}
