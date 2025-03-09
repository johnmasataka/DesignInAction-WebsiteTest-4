console.log(nlp);

const colorMapping = {
    "red": 0xff0000,
    "green": 0x00ff00,
    "blue": 0x0000ff,
    "yellow": 0xffff00,
    "white": 0xffffff,
    "black": 0x000000,
    "grey": 0xA8A8A8,
};

const adjectiveMapping = {
    "cozy": { "material": "wood" },
    "modern": { "style": "modern" },
    "spacious": { "size": "large" },
    "luxurious": { "style": "luxurious" },
    "endless": { "height": 100000, "width": 100000, "depth": 100000 },
    "gigantic": { "height": 100, "width": 100, "depth": 100 },
    "enormous": { "height": 50, "width": 50, "depth": 50 },
    "large": { "height": 15, "width": 15, "depth": 15 },
    "big": { "height": 10, "width": 10, "depth": 10 },
    "small": { "height": 0.5, "width": 0.5, "depth": 0.5 },
    "tiny": { "height": 0.1, "width": 0.1, "depth": 0.1 },
    "medium": { "height": 3, "width": 3, "depth": 3 },
    "short": { "height": 1, "width": 1, "depth": 1 },
    "tall": { "height": 15 },
};

const nounMapping = {
    "cube": { "shape": "cube" },
    "sphere": { "shape": "sphere" },
    "cylinder": { "shape": "cylinder" },
    "house": { "building_type": "house" },
    "garden": { "outdoor_space": "garden" },
};

function parseTextToParameters(text) {
    let parameters = {};

    const doc = nlp(text);
    const adjectives = [...new Set(doc.adjectives().out('array').map(normalizeWord))];
    const nouns = filterValidNouns(doc.nouns().out('array').map(normalizeWord));

    adjectives.forEach((adj) => {
        if (adjectiveMapping[adj]) {
            Object.assign(parameters, adjectiveMapping[adj]);
        } else if (colorMapping[adj]) {
            parameters.color = colorMapping[adj];
        }
    });

    nouns.forEach((noun) => {
        if (nounMapping[noun]) {
            Object.assign(parameters, nounMapping[noun]);
        }
    });

    // Match the size description, e.g. “10x10x10”
    const sizeMatch = text.match(/(\d+)\s*x\s*(\d+)\s*x\s*(\d+)/i);
    if (sizeMatch) {
        parameters.width = parseInt(sizeMatch[1]);
        parameters.height = parseInt(sizeMatch[2]);
        parameters.depth = parseInt(sizeMatch[3]);
    }

    return parameters;
}

function normalizeWord(word) {
    const synonyms = {
        "big": "large",
        "yard": "garden",
        "luxury": "luxurious",
        "bedrooms": "bedroom",
        "room": "bedroom",
    };
    return synonyms[word.toLowerCase()] || word.toLowerCase();
}

function filterValidNouns(nouns) {
    return nouns
        .map((noun) => noun.toLowerCase().replace(/[^a-z]/g, ''))
        .filter((noun) => noun.length > 1);
}

export { parseTextToParameters };

