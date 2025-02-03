"use strict";
// Create interfaces for ENTITY and ENTITY_DESCRIPTIONS
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENTITY_DESCRIPTIONS = void 0;
exports.ENTITY_DESCRIPTIONS = {
    'An': {
        type: 'deity',
        description: 'The supreme sky deity and father of the gods, An ruled the heavens and granted kingship to mortals.',
        worshipedIn: ['Uruk'],
        otherNames: ['Anu']
    },
    'Enki': {
        type: 'deity',
        description: 'Enki, the god of freshwaters (Abzu), wisdom, magic, and creation, was a trickster deity known for his intellect and his role in shaping human civilization.',
        worshipedIn: ['Eridu'],
        otherNames: ['Ea', 'Nudimmud']
    },
    'Eridug': {
        type: 'location',
        description: 'A city associated with Enki and wisdom.',
        geoint: { lat: 30.963, lon: 46.101 },
        otherNames: ['Eridu']
    },
    'Isimud': {
        type: 'deity',
        description: 'The two-faced messenger of Enki.',
        otherNames: []
    },
    'Tigris': {
        type: 'location',
        description: 'One of the major rivers of Mesopotamia.',
        geoint: { lat: 34.0, lon: 44.0 }
    },
    'Euphrates': {
        type: 'location',
        description: 'Another major river of Mesopotamia.',
        geoint: { lat: 32.0, lon: 45.0 }
    },
    'E-engura': {
        type: 'location',
        description: 'The temple of Enki in Eridug.',
        geoint: { lat: 30.963, lon: 46.101 }
    },
    'Nibru': {
        type: 'location',
        description: 'Sumerian name for Nippur, an important religious center.',
        geoint: { lat: 32.123, lon: 45.233 }
    },
    'Enlil': {
        type: 'deity',
        description: 'The god of wind, storms, and earth, Enlil was a powerful force in Sumerian mythology, acting as both a creator and destroyer. He was the divine authority behind kingship and order.',
        worshipedIn: ['Nippur'],
        otherNames: ['Ellil']
    },
    'Nintur': {
        type: 'deity',
        description: 'A goddess of birth and creation.',
        otherNames: ['Ninmah', 'Nintu']
    },
    'Dilmun': {
        type: 'location',
        description: 'A mythical paradise land associated with purity and immortality.',
        geoint: { lat: 26.033, lon: 50.55 }
    },
    'Inana': {
        type: 'deity',
        description: 'Goddess of love, war, and divine justice, Inana was a bold and unpredictable deity, known for her passionate affairs, military conquests, and descent into the underworld.',
        worshipedIn: ['Uruk', 'Akkad'],
        otherNames: ['Ishtar']
    },
    'Ninmah': {
        type: 'deity',
        description: 'A mother goddess in Sumerian mythology, often associated with the creation of humans.',
        otherNames: ['Nintu']
    },
    'Ninsikila': {
        type: 'deity',
        description: 'A deity linked to Dilmun, sometimes associated with purity and fertility.',
        otherNames: []
    },
    'Ezina': {
        type: 'deity',
        description: 'Also known as Ashnan, the Sumerian goddess of grain and agricultural abundance.',
        otherNames: ['Ashnan']
    },
    'Martu': {
        type: 'deity',
        description: 'God of the nomadic Amorites.',
        otherNames: ['Amurru']
    },
    'E-kur': {
        type: 'location',
        description: 'The temple of Enlil in Nippur.',
        geoint: { lat: 32.123, lon: 45.233 }
    },
    'Abzu': {
        type: 'cosmic',
        description: 'The primeval sea beneath the earth, associated with Enki.'
    },
    'Anuna': {
        type: 'group',
        description: 'The collective name for the major deities of the Sumerian pantheon.'
    },
    'Uraš': {
        type: 'deity',
        description: 'An earth goddess or a personification of the land.'
    },
    'Magan': {
        type: 'location',
        description: 'An ancient land, often associated with Oman.',
        geoint: { lat: 22.5, lon: 58.5 }
    },
    'Sumer': {
        type: 'region',
        description: 'The region of southern Mesopotamia, home to the earliest cities.',
        geoint: { lat: 30.5, lon: 45.0 }
    },
    'Urim': {
        type: 'location',
        description: 'The Sumerian name for the city of Ur.',
        geoint: { lat: 30.964, lon: 46.103 }
    },
    'Elam': {
        type: 'region',
        description: 'An ancient civilization located in present-day Iran.'
    },
    'Nanše': {
        type: 'deity',
        description: 'A goddess associated with social justice, water, and divination.',
        otherNames: []
    },
    'Iškur': {
        type: 'deity',
        description: 'The storm god, later syncretized with Adad.',
        otherNames: ['Adad']
    },
    'Kulla': {
        type: 'deity',
        description: 'The patron deity of brickmakers and builders, Kulla was invoked in construction rites and temple-building ceremonies.',
        worshipedIn: ['Uruk']
    },
    'Šakkan': {
        type: 'deity',
        description: 'The god of shepherds and livestock.'
    },
    'Suen': {
        type: 'deity',
        description: 'The moon god associated with wisdom, timekeeping, and the passage of night.',
        worshipedIn: ['Ur'],
        otherNames: ['Nanna']
    },
    'Utu': {
        type: 'deity',
        description: 'The sun god and god of justice, Utu was worshiped as the divine judge who upheld truth and fairness.',
        worshipedIn: ['Sippar', 'Larsa'],
        otherNames: ['Shamash']
    },
    'Aruru': {
        type: 'deity',
        description: 'A goddess of creation and midwifery.'
    },
    'Nisaba': {
        type: 'deity',
        description: 'The goddess of writing, knowledge, and grain.'
    },
    'Nindara': {
        type: 'deity',
        description: 'A lesser-known Sumerian deity associated with judgment and protection.'
    },
    'Ninhursag': {
        type: 'deity',
        description: 'The great mother goddess and divine midwife, Ninhursag was revered for her role in creating and nurturing both gods and humans. Associated with mountains and fertility, she was often invoked in birth and healing rituals.',
        worshipedIn: ['Kesh', 'Lagash'],
        otherNames: ['Damgalnuna', 'Damkina']
    },
    'Ninmada': {
        type: 'deity',
        description: 'A deity associated with wisdom and knowledge.',
        otherNames: []
    },
    'Nudimmud': {
        type: 'deity',
        description: 'Another name for Enki, the god of freshwaters, wisdom, and creation.',
        otherNames: ['Enki', 'Ea']
    },
    'Nanna': {
        type: 'deity',
        description: 'The moon god, also known as Suen, associated with wisdom and timekeeping.',
        worshipedIn: ['Ur'],
        otherNames: ['Suen']
    },
    'Nirah': {
        type: 'deity',
        description: 'A serpent deity associated with the god Ninazu.',
        otherNames: []
    },
    'Imdudu': {
        type: 'deity',
        description: 'A storm god, sometimes associated with the god Iškur.',
        otherNames: ['Iškur', 'Adad']
    },
    'Ninkasi': {
        type: 'deity',
        description: 'The goddess of beer and brewing.',
        otherNames: []
    },
    'Ningiriutud': {
        type: 'deity',
        description: 'A deity associated with crafts and artisans.',
        otherNames: []
    },
    'Ninkura': {
        type: 'deity',
        description: 'A goddess associated with mountains and fertility.',
        otherNames: []
    },
    'Ninimma': {
        type: 'deity',
        description: 'A goddess associated with healing and medicine.',
        otherNames: []
    },
    'Uttu': {
        type: 'deity',
        description: 'A goddess associated with weaving and textiles.',
        otherNames: []
    },
    'Nazi': {
        type: 'deity',
        description: 'A deity associated with justice and fairness.',
        otherNames: []
    },
    'Azimua': {
        type: 'deity',
        description: 'A goddess associated with healing and medicine.',
        otherNames: []
    },
    'Ninti': {
        type: 'deity',
        description: 'A goddess associated with life and fertility.',
        otherNames: []
    },
    'Ensag': {
        type: 'deity',
        description: 'A deity associated with agriculture and fertility.',
        otherNames: []
    },
    'Ubšu-unkena': {
        type: 'location',
        description: 'A divine assembly hall for the gods.',
        geoint: { lat: 32.0, lon: 45.0 }
    },
    'Tukriš': {
        type: 'location',
        description: 'An ancient region known for its gold.',
        geoint: { lat: 35.0, lon: 45.0 }
    },
    'Ḫarali': {
        type: 'location',
        description: 'An ancient region known for its lapis lazuli.',
        geoint: { lat: 34.0, lon: 45.0 }
    },
    'Meluḫa': {
        type: 'location',
        description: 'An ancient region, often associated with the Indus Valley Civilization.',
        geoint: { lat: 24.0, lon: 67.0 }
    },
    'Marḫaši': {
        type: 'location',
        description: 'An ancient region known for its precious stones.',
        geoint: { lat: 30.0, lon: 55.0 }
    },
    'Sea-land': {
        type: 'location',
        description: 'A region associated with the southern marshes of Mesopotamia.',
        geoint: { lat: 30.0, lon: 48.0 }
    },
    'Tent-lands': {
        type: 'location',
        description: 'A region associated with nomadic tribes.',
        geoint: { lat: 32.0, lon: 45.0 }
    },
    'Ezen': {
        type: 'location',
        description: 'A sacred place associated with Nanna.',
        geoint: { lat: 30.963, lon: 46.101 }
    },
    'Ninazu': {
        type: 'deity',
        description: 'A god associated with the underworld and healing.',
        otherNames: []
    },
    'Ninĝišzida': {
        type: 'deity',
        description: 'A god associated with the underworld and vegetation.',
        otherNames: []
    }
};
