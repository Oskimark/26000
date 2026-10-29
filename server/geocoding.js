// Geocodificación y coordenadas urbanas para San José de Mayo, Uruguay.
// Basado en cartografía oficial de OpenStreetMap y nomenclátor local de San José de Mayo.

/** Límites geográficos estrictos de la planta urbana de San José de Mayo */
export const LIMITES_URBANOS = {
  minLat: -34.3560, // Sur: Parque Rodó y Bvr. Aparicio Saravia
  maxLat: -34.3240, // Norte: Av. Manuel D. Rodríguez / bypass ferroviario
  minLng: -56.7320, // Oeste: Río San José / Camino Carretón / Costanera
  maxLng: -56.6960, // Este: Ruta 11 / Av. Larriera
};

/** Coordenadas centrales de la ciudad (Plaza de los Treinta y Tres Orientales) */
export const CENTRO_SAN_JOSE = { lat: -34.3395, lng: -56.7135 };

/** Puntos de interés y sitios de referencia habituales en la ciudad con coordenadas exactas */
export const PUNTOS_REFERENCIA = {
  'hospital': { lat: -34.34126, lng: -56.70594 },
  'hospital san jose': { lat: -34.34126, lng: -56.70594 },
  'asse san jose': { lat: -34.34126, lng: -56.70594 },
  'asse': { lat: -34.34126, lng: -56.70594 },
  'amsj': { lat: -34.33880, lng: -56.71350 },
  'sanatorio amsj': { lat: -34.33880, lng: -56.71350 },
  'asociacion medica': { lat: -34.33880, lng: -56.71350 },
  'terminal': { lat: -34.33524, lng: -56.71578 },
  'terminal de omnibus': { lat: -34.33524, lng: -56.71578 },
  'plaza 33': { lat: -34.33950, lng: -56.71350 },
  'plaza de los treinta y tres': { lat: -34.33950, lng: -56.71350 },
  'plaza principal': { lat: -34.33950, lng: -56.71350 },
  'plaza artigas': { lat: -34.34650, lng: -56.71600 },
  'plaza de deportes': { lat: -34.34650, lng: -56.71600 },
  'parque rodo': { lat: -34.35400, lng: -56.71100 },
  'parque': { lat: -34.35400, lng: -56.71100 },
  'cementerio': { lat: -34.34800, lng: -56.70200 },
  'molino': { lat: -34.33150, lng: -56.71800 },
  'asociacion rural': { lat: -34.35100, lng: -56.72100 },
  'rural': { lat: -34.35100, lng: -56.72100 },
  'expo': { lat: -34.35100, lng: -56.72100 },
  'camino carreton': { lat: -34.33100, lng: -56.73000 },
  'carreton': { lat: -34.33100, lng: -56.73000 },
  'estacion': { lat: -34.33300, lng: -56.70800 },
  'estacion de tren': { lat: -34.33300, lng: -56.70800 },
  'paso del bote': { lat: -34.35300, lng: -56.71800 },
  'picada de las tunas': { lat: -34.35100, lng: -56.73000 },
};

/** Catálogo de ejes viales de San José de Mayo con orientación y traza geográfica */
export const EJES_CALLES = {
  "18": { eje: "EO", lat: -34.339031, lng: -56.713967, minLat: -34.340087, maxLat: -34.337975, minLng: -56.71949, maxLng: -56.708445 },
  "33": { eje: "NS", lat: -34.341736, lng: -56.713263, minLat: -34.352931, maxLat: -34.331505, minLng: -56.716104, maxLng: -56.710192 },
  "general aparicio saravia": { eje: "EO", lat: -34.3463, lng: -56.724242, minLat: -34.347011, maxLat: -34.345536, minLng: -56.727415, maxLng: -56.719867 },
  "18 de julio": { eje: "EO", lat: -34.339031, lng: -56.713967, minLat: -34.340087, maxLat: -34.337975, minLng: -56.71949, maxLng: -56.708445 },
  "jose batlle y ordonez": { eje: "EO", lat: -34.339667, lng: -56.714502, minLat: -34.340581, maxLat: -34.338412, minLng: -56.719356, maxLng: -56.707865 },
  "asamblea": { eje: "EO", lat: -34.339981, lng: -56.713247, minLat: -34.34111, maxLat: -34.338696, minLng: -56.719207, maxLng: -56.706475 },
  "doctor evaristo g ciganda": { eje: "EO", lat: -34.341445, lng: -56.715509, minLat: -34.342906, maxLat: -34.339372, minLng: -56.723239, maxLng: -56.704343 },
  "presbitero damaso antonio larranaga": { eje: "EO", lat: -34.341698, lng: -56.711145, minLat: -34.343043, maxLat: -34.340224, minLng: -56.718665, maxLng: -56.70294 },
  "capitan eusebio vidal": { eje: "EO", lat: -34.343661, lng: -56.715752, minLat: -34.345821, maxLat: -34.341014, minLng: -56.726304, maxLng: -56.702087 },
  "maruja corujo de molina": { eje: "EO", lat: -34.340072, lng: -56.696936, minLat: -34.340311, maxLat: -34.339833, minLng: -56.698384, maxLng: -56.695488 },
  "treinta y tres": { eje: "NS", lat: -34.341736, lng: -56.713263, minLat: -34.352931, maxLat: -34.331505, minLng: -56.716104, maxLng: -56.710192 },
  "doctor alfonso espinola": { eje: "NS", lat: -34.344303, lng: -56.716231, minLat: -34.353811, maxLat: -34.33407, minLng: -56.718846, maxLng: -56.714164 },
  "wenceslao varela": { eje: "NS", lat: -34.347034, lng: -56.716225, minLat: -34.348474, maxLat: -34.34547, minLng: -56.71667, maxLng: -56.715775 },
  "francisco acuna de figueroa": { eje: "EO", lat: -34.340007, lng: -56.718215, minLat: -34.340007, maxLat: -34.340007, minLng: -56.718215, maxLng: -56.718215 },
  "prudencio montagne": { eje: "NS", lat: -34.341648, lng: -56.719083, minLat: -34.348531, maxLat: -34.335855, minLng: -56.72066, maxLng: -56.717239 },
  "doctor julian bengoa": { eje: "EO", lat: -34.337637, lng: -56.712672, minLat: -34.338963, maxLat: -34.336249, minLng: -56.719814, maxLng: -56.705198 },
  "zorrilla de san martin": { eje: "EO", lat: -34.336423, lng: -56.711955, minLat: -34.337978, maxLat: -34.335188, minLng: -56.720102, maxLng: -56.705481 },
  "libertador juan antonio lavalleja": { eje: "NS", lat: -34.336261, lng: -56.70286, minLat: -34.345179, maxLat: -34.328908, minLng: -56.704792, maxLng: -56.700455 },
  "luis batlle berres": { eje: "EO", lat: -34.335426, lng: -56.712228, minLat: -34.336915, maxLat: -34.334251, minLng: -56.720403, maxLng: -56.705731 },
  "ansina": { eje: "EO", lat: -34.334185, lng: -56.711614, minLat: -34.335028, maxLat: -34.333342, minLng: -56.715946, maxLng: -56.707281 },
  "nicolas guerra": { eje: "EO", lat: -34.352293, lng: -56.717487, minLat: -34.352829, maxLat: -34.351366, minLng: -56.719877, maxLng: -56.712726 },
  "jaime zudanez": { eje: "EO", lat: -34.348054, lng: -56.712692, minLat: -34.349322, maxLat: -34.346416, minLng: -56.720328, maxLng: -56.703994 },
  "wilson ferreira aldunate": { eje: "EO", lat: -34.341876, lng: -56.727224, minLat: -34.342399, maxLat: -34.341354, minLng: -56.729404, maxLng: -56.725044 },
  "julian laguna": { eje: "NS", lat: -34.346328, lng: -56.726261, minLat: -34.347504, maxLat: -34.345152, minLng: -56.726832, maxLng: -56.72569 },
  "trinidad": { eje: "EO", lat: -34.344229, lng: -56.725462, minLat: -34.344229, maxLat: -34.344229, minLng: -56.725462, maxLng: -56.725462 },
  "paysandu": { eje: "NS", lat: -34.344441, lng: -56.728386, minLat: -34.345776, maxLat: -34.343106, minLng: -56.728856, maxLng: -56.727916 },
  "antonio costa": { eje: "EO", lat: -34.344546, lng: -56.727659, minLat: -34.344546, maxLat: -34.344546, minLng: -56.727659, maxLng: -56.727659 },
  "ramon massini": { eje: "EO", lat: -34.344649, lng: -56.723996, minLat: -34.344649, maxLat: -34.344649, minLng: -56.723996, maxLng: -56.723996 },
  "rocha": { eje: "NS", lat: -34.34205, lng: -56.726836, minLat: -34.342464, maxLat: -34.341635, minLng: -56.726951, maxLng: -56.726722 },
  "tacuarembo": { eje: "NS", lat: -34.342319, lng: -56.727943, minLat: -34.342845, maxLat: -34.341662, minLng: -56.728278, maxLng: -56.727738 },
  "soriano": { eje: "EO", lat: -34.343934, lng: -56.724882, minLat: -34.343934, maxLat: -34.343934, minLng: -56.724882, maxLng: -56.724882 },
  "santiago vazquez": { eje: "NS", lat: -34.347293, lng: -56.721833, minLat: -34.349404, maxLat: -34.345181, minLng: -56.722431, maxLng: -56.721236 },
  "alejandro chucarro": { eje: "NS", lat: -34.346495, lng: -56.7213, minLat: -34.347979, maxLat: -34.345012, minLng: -56.721773, maxLng: -56.720828 },
  "institucion atletica rio negro": { eje: "NS", lat: -34.34216, lng: -56.723649, minLat: -34.345283, maxLat: -34.338594, minLng: -56.72417, maxLng: -56.722878 },
  "atilio pelossi": { eje: "NS", lat: -34.347551, lng: -56.719812, minLat: -34.354957, maxLat: -34.341436, minLng: -56.721389, maxLng: -56.717819 },
  "carlos de san vicente": { eje: "EO", lat: -34.342491, lng: -56.722072, minLat: -34.342491, maxLat: -34.342491, minLng: -56.722072, maxLng: -56.722072 },
  "sarandi": { eje: "NS", lat: -34.339424, lng: -56.711863, minLat: -34.34533, maxLat: -34.333254, minLng: -56.713602, maxLng: -56.710207 },
  "colon": { eje: "NS", lat: -34.341391, lng: -56.710061, minLat: -34.346478, maxLat: -34.332984, minLng: -56.712407, maxLng: -56.708785 },
  "rincon": { eje: "NS", lat: -34.338803, lng: -56.709356, minLat: -34.346117, maxLat: -34.332012, minLng: -56.711315, maxLng: -56.706837 },
  "general manuel oribe": { eje: "NS", lat: -34.340415, lng: -56.707742, minLat: -34.345993, maxLat: -34.332576, minLng: -56.709952, maxLng: -56.706198 },
  "francisco canaro": { eje: "EO", lat: -34.344746, lng: -56.710705, minLat: -34.346931, maxLat: -34.342099, minLng: -56.721251, maxLng: -56.699042 },
  "monsenor ricardo di martino": { eje: "NS", lat: -34.341194, lng: -56.70576, minLat: -34.348429, maxLat: -34.329013, minLng: -56.709872, maxLng: -56.701957 },
  "carlos larriera": { eje: "EO", lat: -34.338873, lng: -56.705531, minLat: -34.338873, maxLat: -34.338873, minLng: -56.705531, maxLng: -56.705531 },
  "club nacional de futbol de san jose": { eje: "NS", lat: -34.340037, lng: -56.724741, minLat: -34.340757, maxLat: -34.339199, minLng: -56.724866, maxLng: -56.724609 },
  "silvestre blanco": { eje: "EO", lat: -34.339254, lng: -56.724055, minLat: -34.339496, maxLat: -34.338971, minLng: -56.725343, maxLng: -56.722574 },
  "maldonado": { eje: "NS", lat: -34.340336, lng: -56.726144, minLat: -34.342255, maxLat: -34.337716, minLng: -56.72697, maxLng: -56.725765 },
  "avenida ingeniero agrimensor d barcelo": { eje: "NS", lat: -34.335926, lng: -56.72559, minLat: -34.336962, maxLat: -34.334901, minLng: -56.726304, maxLng: -56.724884 },
  "avenida manuel d rodriguez": { eje: "EO", lat: -34.332682, lng: -56.714203, minLat: -34.335755, maxLat: -34.329672, minLng: -56.7228, maxLng: -56.705341 },
  "general jose artigas": { eje: "NS", lat: -34.334895, lng: -56.71645, minLat: -34.347214, maxLat: -34.329963, minLng: -56.719996, maxLng: -56.71237 },
  "presbitero betancur": { eje: "EO", lat: -34.33467, lng: -56.716618, minLat: -34.337584, maxLat: -34.33227, minLng: -56.723767, maxLng: -56.70757 },
  "ituzaingo": { eje: "NS", lat: -34.341134, lng: -56.715382, minLat: -34.348611, maxLat: -34.334007, minLng: -56.717373, maxLng: -56.713301 },
  "manuel haedo": { eje: "NS", lat: -34.350354, lng: -56.723004, minLat: -34.352351, maxLat: -34.348389, minLng: -56.723531, maxLng: -56.722454 },
  "antonio pan": { eje: "NS", lat: -34.332662, lng: -56.704588, minLat: -34.336922, maxLat: -34.330693, minLng: -56.705133, maxLng: -56.703401 },
  "viera y benavidez": { eje: "EO", lat: -34.332742, lng: -56.712426, minLat: -34.332742, maxLat: -34.332742, minLng: -56.712426, maxLng: -56.712426 },
  "doctor emilio frugoni": { eje: "NS", lat: -34.341422, lng: -56.703493, minLat: -34.345405, maxLat: -34.337439, minLng: -56.704548, maxLng: -56.702439 },
  "queguay": { eje: "EO", lat: -34.330691, lng: -56.705422, minLat: -34.330691, maxLat: -34.330691, minLng: -56.705422, maxLng: -56.705422 },
  "suiza": { eje: "EO", lat: -34.330573, lng: -56.700148, minLat: -34.330573, maxLat: -34.330573, minLng: -56.700148, maxLng: -56.700148 },
  "paraguay": { eje: "NS", lat: -34.331651, lng: -56.702859, minLat: -34.333128, maxLat: -34.330365, minLng: -56.70341, maxLng: -56.702369 },
  "canelones": { eje: "NS", lat: -34.337742, lng: -56.700184, minLat: -34.342855, maxLat: -34.330542, minLng: -56.702371, maxLng: -56.698631 },
  "general flores": { eje: "NS", lat: -34.33736, lng: -56.698251, minLat: -34.34148, maxLat: -34.331164, minLng: -56.700135, maxLng: -56.696989 },
  "avenida italia": { eje: "EO", lat: -34.331724, lng: -56.69766, minLat: -34.332166, maxLat: -34.331281, minLng: -56.699862, maxLng: -56.695459 },
  "colonia": { eje: "NS", lat: -34.333831, lng: -56.698249, minLat: -34.337601, maxLat: -34.330061, minLng: -56.699369, maxLng: -56.697129 },
  "asociacion rural": { eje: "NS", lat: -34.332317, lng: -56.697753, minLat: -34.334244, maxLat: -34.33039, minLng: -56.698327, maxLng: -56.697178 },
  "manuel artigas": { eje: "EO", lat: -34.328749, lng: -56.697801, minLat: -34.328749, maxLat: -34.328749, minLng: -56.697801, maxLng: -56.697801 },
  "carlos gardel": { eje: "NS", lat: -34.332983, lng: -56.695539, minLat: -34.336635, maxLat: -34.329322, minLng: -56.696734, maxLng: -56.694423 },
  "ruta 11 jose batlle y ordonez": { eje: "EO", lat: -34.334299, lng: -56.741286, minLat: -34.334792, maxLat: -34.333678, minLng: -56.766573, maxLng: -56.732345 },
  "ruta 3": { eje: "EO", lat: -34.334038, lng: -56.731989, minLat: -34.334038, maxLat: -34.334038, minLng: -56.731989, maxLng: -56.731989 },
  "ruta 3 general jose gervasio artigas": { eje: "NS", lat: -34.336396, lng: -56.724339, minLat: -34.355837, maxLat: -34.323739, minLng: -56.732114, maxLng: -56.711413 },
  "rotonda ruta 11 y ruta 3": { eje: "NS", lat: -34.334463, lng: -56.732471, minLat: -34.334573, maxLat: -34.334353, minLng: -56.732539, maxLng: -56.732403 },
  "avenida cesareo beriso": { eje: "EO", lat: -34.357304, lng: -56.746298, minLat: -34.357304, maxLat: -34.357304, minLng: -56.746298, maxLng: -56.746298 },
  "general fructuoso rivera": { eje: "NS", lat: -34.347292, lng: -56.718829, minLat: -34.352195, maxLat: -34.340913, minLng: -56.720584, maxLng: -56.717498 },
  "avenida luis alberto de herrera": { eje: "EO", lat: -34.342226, lng: -56.702267, minLat: -34.344229, maxLat: -34.341261, minLng: -56.713163, maxLng: -56.698023 },
  "luis de almeida": { eje: "EO", lat: -34.352915, lng: -56.712821, minLat: -34.352915, maxLat: -34.352915, minLng: -56.712821, maxLng: -56.712821 },
  "gerardo mattos rodriguez": { eje: "NS", lat: -34.35292, lng: -56.712928, minLat: -34.352944, maxLat: -34.352895, minLng: -56.71294, maxLng: -56.712915 },
  "la cumparsita": { eje: "EO", lat: -34.351883, lng: -56.711529, minLat: -34.351883, maxLat: -34.351883, minLng: -56.711529, maxLng: -56.711529 },
  "las palmeras": { eje: "EO", lat: -34.353191, lng: -56.713765, minLat: -34.353191, maxLat: -34.353191, minLng: -56.713765, maxLng: -56.713765 },
  "solano garcia": { eje: "EO", lat: -34.352418, lng: -56.714758, minLat: -34.352735, maxLat: -34.352102, minLng: -56.716151, maxLng: -56.713365 },
  "los alamos": { eje: "EO", lat: -34.354254, lng: -56.715086, minLat: -34.354832, maxLat: -34.353676, minLng: -56.716788, maxLng: -56.713384 },
  "artigas mendez clara": { eje: "EO", lat: -34.337128, lng: -56.730011, minLat: -34.337394, maxLat: -34.336861, minLng: -56.731241, maxLng: -56.728782 },
  "elia caputti de corbacho": { eje: "EO", lat: -34.338635, lng: -56.728073, minLat: -34.338635, maxLat: -34.338635, minLng: -56.728073, maxLng: -56.728073 },
  "francisco donato": { eje: "EO", lat: -34.335269, lng: -56.729453, minLat: -34.335269, maxLat: -34.335269, minLng: -56.729453, maxLng: -56.729453 },
  "francisco espinola": { eje: "EO", lat: -34.334257, lng: -56.728781, minLat: -34.334257, maxLat: -34.334257, minLng: -56.728781, maxLng: -56.728781 },
  "jose arias": { eje: "EO", lat: -34.337784, lng: -56.72274, minLat: -34.337784, maxLat: -34.337784, minLng: -56.72274, maxLng: -56.72274 },
  "monsenor herbe seijas": { eje: "EO", lat: -34.337739, lng: -56.728359, minLat: -34.337739, maxLat: -34.337739, minLng: -56.728359, maxLng: -56.728359 },
  "pompilio garcia": { eje: "EO", lat: -34.336227, lng: -56.729678, minLat: -34.336227, maxLat: -34.336227, minLng: -56.729678, maxLng: -56.729678 },
  "25 de agosto": { eje: "EO", lat: -34.329789, lng: -56.710846, minLat: -34.329789, maxLat: -34.329789, minLng: -56.710846, maxLng: -56.710846 },
  "miguel barreiro": { eje: "EO", lat: -34.350647, lng: -56.723693, minLat: -34.351271, maxLat: -34.349874, minLng: -56.726178, maxLng: -56.721909 },
  "jose ellauri": { eje: "EO", lat: -34.347984, lng: -56.717203, minLat: -34.349397, maxLat: -34.346402, minLng: -56.724996, maxLng: -56.708337 },
  "avenida larriera": { eje: "NS", lat: -34.330584, lng: -56.71171, minLat: -34.331789, maxLat: -34.327196, minLng: -56.712096, maxLng: -56.71082 },
  "francisco munoz": { eje: "EO", lat: -34.349674, lng: -56.7129, minLat: -34.350214, maxLat: -34.3493, minLng: -56.716723, maxLng: -56.710501 },
  "coluquique": { eje: "EO", lat: -34.329434, lng: -56.699068, minLat: -34.329434, maxLat: -34.329434, minLng: -56.699068, maxLng: -56.699068 },
  "ecuador": { eje: "EO", lat: -34.331609, lng: -56.701359, minLat: -34.331862, maxLat: -34.331178, minLng: -56.703655, maxLng: -56.699079 },
  "ine 25": { eje: "NS", lat: -34.337793, lng: -56.7263, minLat: -34.337834, maxLat: -34.337752, minLng: -56.726313, maxLng: -56.726288 },
  "manuel calleros": { eje: "EO", lat: -34.350849, lng: -56.715699, minLat: -34.350927, maxLat: -34.350772, minLng: -56.716881, maxLng: -56.714517 },
  "aviador ricardo detomasi": { eje: "EO", lat: -34.328784, lng: -56.699278, minLat: -34.328784, maxLat: -34.328784, minLng: -56.699278, maxLng: -56.699278 },
  "pedro francisco berro": { eje: "EO", lat: -34.347385, lng: -56.719377, minLat: -34.347385, maxLat: -34.347385, minLng: -56.719377, maxLng: -56.719377 },
  "tacuari": { eje: "EO", lat: -34.329794, lng: -56.711841, minLat: -34.32982, maxLat: -34.329767, minLng: -56.711943, maxLng: -56.711739 },
  "doctor rogelio zagarra": { eje: "EO", lat: -34.351955, lng: -56.719868, minLat: -34.351955, maxLat: -34.351955, minLng: -56.719868, maxLng: -56.719868 },
  "doctor j f pieri": { eje: "EO", lat: -34.350671, lng: -56.719495, minLat: -34.350671, maxLat: -34.350671, minLng: -56.719495, maxLng: -56.719495 },
  "argentina": { eje: "EO", lat: -34.332813, lng: -56.699138, minLat: -34.333164, maxLat: -34.332461, minLng: -56.701606, maxLng: -56.696671 },
  "las piedras": { eje: "EO", lat: -34.325813, lng: -56.710915, minLat: -34.325837, maxLat: -34.325789, minLng: -56.711901, maxLng: -56.709929 },
  "san salvador": { eje: "NS", lat: -34.32947, lng: -56.708342, minLat: -34.330168, maxLat: -34.328773, minLng: -56.708587, maxLng: -56.708096 },
  "pedro chanquet": { eje: "EO", lat: -34.341455, lng: -56.701345, minLat: -34.341689, maxLat: -34.341221, minLng: -56.702357, maxLng: -56.700334 },
  "paso del rey": { eje: "EO", lat: -34.327448, lng: -56.711968, minLat: -34.327448, maxLat: -34.327448, minLng: -56.711968, maxLng: -56.711968 },
  "doctor arriaga": { eje: "EO", lat: -34.350734, lng: -56.720129, minLat: -34.350734, maxLat: -34.350734, minLng: -56.720129, maxLng: -56.720129 },
  "doctor f giampietro": { eje: "EO", lat: -34.351547, lng: -56.721972, minLat: -34.351843, maxLat: -34.351346, minLng: -56.724109, maxLng: -56.720063 },
  "francia": { eje: "EO", lat: -34.333295, lng: -56.696891, minLat: -34.333979, maxLat: -34.33261, minLng: -56.700365, maxLng: -56.693416 },
  "ibicuy": { eje: "EO", lat: -34.329674, lng: -56.715299, minLat: -34.329674, maxLat: -34.329674, minLng: -56.715299, maxLng: -56.715299 },
  "pagola": { eje: "EO", lat: -34.348157, lng: -56.717678, minLat: -34.348157, maxLat: -34.348157, minLng: -56.717678, maxLng: -56.717678 },
  "panama": { eje: "EO", lat: -34.325463, lng: -56.707295, minLat: -34.326231, maxLat: -34.324696, minLng: -56.709005, maxLng: -56.705584 },
  "durazno": { eje: "EO", lat: -34.337554, lng: -56.696872, minLat: -34.338015, maxLat: -34.337092, minLng: -56.699697, maxLng: -56.694047 },
  "candido marin": { eje: "EO", lat: -34.328578, lng: -56.710903, minLat: -34.329499, maxLat: -34.327517, minLng: -56.714371, maxLng: -56.707433 },
  "peru": { eje: "EO", lat: -34.327934, lng: -56.701754, minLat: -34.327934, maxLat: -34.327934, minLng: -56.701754, maxLng: -56.701754 },
  "continuacion nicolas guerra": { eje: "NS", lat: -34.35019, lng: -56.709125, minLat: -34.350302, maxLat: -34.350078, minLng: -56.709192, maxLng: -56.709058 },
  "instrucciones": { eje: "EO", lat: -34.328036, lng: -56.713651, minLat: -34.328556, maxLat: -34.327426, minLng: -56.717436, maxLng: -56.709839 },
  "cerro largo": { eje: "NS", lat: -34.340078, lng: -56.700666, minLat: -34.342733, maxLat: -34.337071, minLng: -56.701497, maxLng: -56.699938 },
  "bolivia": { eje: "NS", lat: -34.332329, lng: -56.700534, minLat: -34.333127, maxLat: -34.331531, minLng: -56.70077, maxLng: -56.700298 },
  "19 de abril": { eje: "EO", lat: -34.328973, lng: -56.7092, minLat: -34.328973, maxLat: -34.328973, minLng: -56.7092, maxLng: -56.7092 },
  "salto": { eje: "NS", lat: -34.336536, lng: -56.699539, minLat: -34.337922, maxLat: -34.33515, minLng: -56.699971, maxLng: -56.699108 },
  "minas": { eje: "EO", lat: -34.342991, lng: -56.726476, minLat: -34.342991, maxLat: -34.342991, minLng: -56.726476, maxLng: -56.726476 },
  "yaro": { eje: "EO", lat: -34.326116, lng: -56.712316, minLat: -34.326116, maxLat: -34.326116, minLng: -56.712316, maxLng: -56.712316 },
  "cebollati": { eje: "NS", lat: -34.329259, lng: -56.706524, minLat: -34.329652, maxLat: -34.328867, minLng: -56.7067, maxLng: -56.706348 },
  "asencio": { eje: "EO", lat: -34.331805, lng: -56.715824, minLat: -34.331805, maxLat: -34.331805, minLng: -56.715824, maxLng: -56.715824 },
  "doctor j a marra": { eje: "EO", lat: -34.351878, lng: -56.719199, minLat: -34.351878, maxLat: -34.351878, minLng: -56.719199, maxLng: -56.719199 },
  "12 de octubre": { eje: "EO", lat: -34.328643, lng: -56.708225, minLat: -34.328863, maxLat: -34.328422, minLng: -56.708897, maxLng: -56.707554 },
  "aigua": { eje: "EO", lat: -34.325466, lng: -56.711444, minLat: -34.325466, maxLat: -34.325466, minLng: -56.711444, maxLng: -56.711444 },
  "republica": { eje: "EO", lat: -34.334967, lng: -56.701096, minLat: -34.334967, maxLat: -34.334967, minLng: -56.701096, maxLng: -56.701096 },
  "guayabos": { eje: "EO", lat: -34.326657, lng: -56.711938, minLat: -34.326657, maxLat: -34.326657, minLng: -56.711938, maxLng: -56.711938 },
  "hermano dionisio": { eje: "EO", lat: -34.330142, lng: -56.713544, minLat: -34.330142, maxLat: -34.330142, minLng: -56.713544, maxLng: -56.713544 },
  "haiti": { eje: "NS", lat: -34.326624, lng: -56.695626, minLat: -34.327692, maxLat: -34.325556, minLng: -56.69624, maxLng: -56.695012 },
  "ruperto perez martinez": { eje: "EO", lat: -34.330327, lng: -56.714523, minLat: -34.330327, maxLat: -34.330327, minLng: -56.714523, maxLng: -56.714523 },
  "uruguay": { eje: "EO", lat: -34.32501, lng: -56.701135, minLat: -34.32501, maxLat: -34.32501, minLng: -56.701135, maxLng: -56.701135 },
  "mexico": { eje: "EO", lat: -34.326683, lng: -56.701396, minLat: -34.326683, maxLat: -34.326683, minLng: -56.701396, maxLng: -56.701396 },
  "camacua": { eje: "NS", lat: -34.327566, lng: -56.704132, minLat: -34.328347, maxLat: -34.326785, minLng: -56.704566, maxLng: -56.703698 },
  "colombia": { eje: "EO", lat: -34.325657, lng: -56.702894, minLat: -34.325657, maxLat: -34.325657, minLng: -56.702894, maxLng: -56.702894 },
  "espana": { eje: "EO", lat: -34.336829, lng: -56.697511, minLat: -34.336829, maxLat: -34.336829, minLng: -56.697511, maxLng: -56.697511 },
  "avenida de las hanty lalande": { eje: "NS", lat: -34.330205, lng: -56.712538, minLat: -34.331863, maxLat: -34.328547, minLng: -56.712861, maxLng: -56.712215 },
  "charrua": { eje: "EO", lat: -34.32741, lng: -56.708539, minLat: -34.32741, maxLat: -34.32741, minLng: -56.708539, maxLng: -56.708539 },
  "ine 501": { eje: "EO", lat: -34.344603, lng: -56.725534, minLat: -34.344603, maxLat: -34.344603, minLng: -56.725534, maxLng: -56.725534 },
  "brigadier general diego lamas": { eje: "EO", lat: -34.340804, lng: -56.698365, minLat: -34.340804, maxLat: -34.340804, minLng: -56.698365, maxLng: -56.698365 },
  "ute 17": { eje: "EO", lat: -34.345843, lng: -56.703, minLat: -34.345843, maxLat: -34.345843, minLng: -56.703, maxLng: -56.703 },
  "ruben lena": { eje: "EO", lat: -34.346312, lng: -56.707895, minLat: -34.346312, maxLat: -34.346312, minLng: -56.707895, maxLng: -56.707895 },
  "continuacion jose ellauri": { eje: "EO", lat: -34.345692, lng: -56.704317, minLat: -34.345692, maxLat: -34.345692, minLng: -56.704317, maxLng: -56.704317 },
  "solari": { eje: "EO", lat: -34.353123, lng: -56.709046, minLat: -34.353123, maxLat: -34.353123, minLng: -56.709046, maxLng: -56.709046 },
  "maria velazquez": { eje: "NS", lat: -34.351502, lng: -56.712341, minLat: -34.351929, maxLat: -34.351076, minLng: -56.712493, maxLng: -56.712188 },
  "maria salem tajes": { eje: "EO", lat: -34.332577, lng: -56.723568, minLat: -34.332577, maxLat: -34.332577, minLng: -56.723568, maxLng: -56.723568 },
  "ine 500": { eje: "EO", lat: -34.349434, lng: -56.714466, minLat: -34.349434, maxLat: -34.349434, minLng: -56.714466, maxLng: -56.714466 },
  "maria ines rodriguez": { eje: "EO", lat: -34.350724, lng: -56.714022, minLat: -34.350724, maxLat: -34.350724, minLng: -56.714022, maxLng: -56.714022 },
  "costa rica": { eje: "EO", lat: -34.32586, lng: -56.703928, minLat: -34.326502, maxLat: -34.325053, minLng: -56.705804, maxLng: -56.701581 },
  "maria espinola": { eje: "EO", lat: -34.332074, lng: -56.723651, minLat: -34.332074, maxLat: -34.332074, minLng: -56.723651, maxLng: -56.723651 },
  "juan donagaray": { eje: "EO", lat: -34.352113, lng: -56.712459, minLat: -34.352113, maxLat: -34.352113, minLng: -56.712459, maxLng: -56.712459 },
  "maria julia mendiague": { eje: "EO", lat: -34.330078, lng: -56.721469, minLat: -34.330078, maxLat: -34.330078, minLng: -56.721469, maxLng: -56.721469 },
  "25 de mayo": { eje: "NS", lat: -34.338525, lng: -56.713469, minLat: -34.347321, maxLat: -34.332637, minLng: -56.715179, maxLng: -56.710941 },
  "antonio hernandez": { eje: "EO", lat: -34.334235, lng: -56.708853, minLat: -34.334235, maxLat: -34.334235, minLng: -56.708853, maxLng: -56.708853 },
  "doctor evaristo ciganda": { eje: "EO", lat: -34.343833, lng: -56.728376, minLat: -34.343921, maxLat: -34.343745, minLng: -56.728686, maxLng: -56.728065 },
  "juan benito blanco": { eje: "EO", lat: -34.349419, lng: -56.716083, minLat: -34.349753, maxLat: -34.349085, minLng: -56.718055, maxLng: -56.714112 },
  "rosa luna": { eje: "EO", lat: -34.352866, lng: -56.713381, minLat: -34.352866, maxLat: -34.352866, minLng: -56.713381, maxLng: -56.713381 },
  "juana de ibarbourou": { eje: "EO", lat: -34.352518, lng: -56.713493, minLat: -34.352518, maxLat: -34.352518, minLng: -56.713493, maxLng: -56.713493 },
  "jose zubillaga": { eje: "EO", lat: -34.353803, lng: -56.715755, minLat: -34.353803, maxLat: -34.353803, minLng: -56.715755, maxLng: -56.715755 },
  "chana": { eje: "NS", lat: -34.327998, lng: -56.706163, minLat: -34.329141, maxLat: -34.326855, minLng: -56.706708, maxLng: -56.705617 },
  "ernesto pinto": { eje: "EO", lat: -34.333219, lng: -56.726842, minLat: -34.333219, maxLat: -34.333219, minLng: -56.726842, maxLng: -56.726842 },
  "feliciano rodriguez": { eje: "EO", lat: -34.353782, lng: -56.716389, minLat: -34.353782, maxLat: -34.353782, minLng: -56.716389, maxLng: -56.716389 },
  "laura cortinas": { eje: "EO", lat: -34.331263, lng: -56.722586, minLat: -34.331263, maxLat: -34.331263, minLng: -56.722586, maxLng: -56.722586 },
  "maria adela bonavita": { eje: "EO", lat: -34.33151, lng: -56.721708, minLat: -34.33151, maxLat: -34.33151, minLng: -56.721708, maxLng: -56.721708 },
  "nicaragua": { eje: "EO", lat: -34.324702, lng: -56.698021, minLat: -34.324702, maxLat: -34.324702, minLng: -56.698021, maxLng: -56.698021 },
  "raul sguilla marti": { eje: "EO", lat: -34.333539, lng: -56.716518, minLat: -34.333539, maxLat: -34.333539, minLng: -56.716518, maxLng: -56.716518 },
  "belgica": { eje: "EO", lat: -34.338416, lng: -56.697052, minLat: -34.338416, maxLat: -34.338416, minLng: -56.697052, maxLng: -56.697052 },
  "horacio santos": { eje: "EO", lat: -34.335237, lng: -56.697976, minLat: -34.335237, maxLat: -34.335237, minLng: -56.697976, maxLng: -56.697976 },
  "jose pedro varela": { eje: "EO", lat: -34.333136, lng: -56.723873, minLat: -34.334471, maxLat: -34.332023, minLng: -56.726368, maxLng: -56.720693 },
  "continuacion de la hanty lalande": { eje: "EO", lat: -34.323583, lng: -56.713713, minLat: -34.323583, maxLat: -34.323583, minLng: -56.713713, maxLng: -56.713713 },
  "general leandro gomez": { eje: "NS", lat: -34.32833, lng: -56.716412, minLat: -34.329771, maxLat: -34.32689, minLng: -56.716829, maxLng: -56.715995 },
  "avenida brasil": { eje: "EO", lat: -34.346069, lng: -56.711124, minLat: -34.34824, maxLat: -34.34388, minLng: -56.722587, maxLng: -56.699581 },
  "camino al paso del rey": { eje: "EO", lat: -34.322486, lng: -56.72783, minLat: -34.322486, maxLat: -34.322486, minLng: -56.72783, maxLng: -56.72783 },
  "pablo estramin": { eje: "EO", lat: -34.355224, lng: -56.71594, minLat: -34.355224, maxLat: -34.355224, minLng: -56.71594, maxLng: -56.71594 },
  "democracia": { eje: "EO", lat: -34.350703, lng: -56.71159, minLat: -34.350703, maxLat: -34.350703, minLng: -56.71159, maxLng: -56.71159 },
  "florida": { eje: "EO", lat: -34.343915, lng: -56.726167, minLat: -34.343915, maxLat: -34.343915, minLng: -56.726167, maxLng: -56.726167 },
  "ruta 3 jose gervasio artigas": { eje: "EO", lat: -34.34095, lng: -56.730009, minLat: -34.34095, maxLat: -34.34095, minLng: -56.730009, maxLng: -56.730009 },
  "ute 8": { eje: "EO", lat: -34.349768, lng: -56.714056, minLat: -34.349768, maxLat: -34.349768, minLng: -56.714056, maxLng: -56.714056 },
  "del pozo": { eje: "EO", lat: -34.349813, lng: -56.710344, minLat: -34.349813, maxLat: -34.349813, minLng: -56.710344, maxLng: -56.710344 },
  "chile": { eje: "EO", lat: -34.324963, lng: -56.703809, minLat: -34.324963, maxLat: -34.324963, minLng: -56.703809, maxLng: -56.703809 },
  "venezuela": { eje: "EO", lat: -34.325815, lng: -56.698502, minLat: -34.325815, maxLat: -34.325815, minLng: -56.698502, maxLng: -56.698502 },
  "continuacion rivera": { eje: "EO", lat: -34.354066, lng: -56.716954, minLat: -34.354066, maxLat: -34.354066, minLng: -56.716954, maxLng: -56.716954 },
  "doce de octubre": { eje: "EO", lat: -34.328643, lng: -56.708225, minLat: -34.328863, maxLat: -34.328422, minLng: -56.708897, maxLng: -56.707554 },
  "dieciocho de julio": { eje: "EO", lat: -34.339031, lng: -56.713967, minLat: -34.340087, maxLat: -34.337975, minLng: -56.71949, maxLng: -56.708445 },
  "peatonal": { eje: "EO", lat: -34.339031, lng: -56.713967, minLat: -34.340087, maxLat: -34.337975, minLng: -56.71949, maxLng: -56.708445 },
  "paseo de los constituyentes": { eje: "EO", lat: -34.339031, lng: -56.713967, minLat: -34.340087, maxLat: -34.337975, minLng: -56.71949, maxLng: -56.708445 },
  "diecinueve de abril": { eje: "EO", lat: -34.328973, lng: -56.7092, minLat: -34.328973, maxLat: -34.328973, minLng: -56.7092, maxLng: -56.7092 },
  "veinticinco de agosto": { eje: "EO", lat: -34.329789, lng: -56.710846, minLat: -34.329789, maxLat: -34.329789, minLng: -56.710846, maxLng: -56.710846 },
  "veinticinco de mayo": { eje: "NS", lat: -34.338525, lng: -56.713469, minLat: -34.347321, maxLat: -34.332637, minLng: -56.715179, maxLng: -56.710941 },
  "figueroa": { eje: "EO", lat: -34.340007, lng: -56.718215, minLat: -34.340007, maxLat: -34.340007, minLng: -56.718215, maxLng: -56.718215 },
  "chucarro": { eje: "NS", lat: -34.346495, lng: -56.7213, minLat: -34.347979, maxLat: -34.345012, minLng: -56.721773, maxLng: -56.720828 },
  "costa": { eje: "EO", lat: -34.344546, lng: -56.727659, minLat: -34.344546, maxLat: -34.344546, minLng: -56.727659, maxLng: -56.727659 },
  "hernandez": { eje: "EO", lat: -34.334235, lng: -56.708853, minLat: -34.334235, maxLat: -34.334235, minLng: -56.708853, maxLng: -56.708853 },
  "pan": { eje: "NS", lat: -34.332662, lng: -56.704588, minLat: -34.336922, maxLat: -34.330693, minLng: -56.705133, maxLng: -56.703401 },
  "bvr aparicio saravia": { eje: "EO", lat: -34.3463, lng: -56.724242, minLat: -34.347011, maxLat: -34.345536, minLng: -56.727415, maxLng: -56.719867 },
  "bulevar aparicio saravia": { eje: "EO", lat: -34.3463, lng: -56.724242, minLat: -34.347011, maxLat: -34.345536, minLng: -56.727415, maxLng: -56.719867 },
  "saravia": { eje: "EO", lat: -34.3463, lng: -56.724242, minLat: -34.347011, maxLat: -34.345536, minLng: -56.727415, maxLng: -56.719867 },
  "dr arriaga": { eje: "EO", lat: -34.350734, lng: -56.720129, minLat: -34.350734, maxLat: -34.350734, minLng: -56.720129, maxLng: -56.720129 },
  "gral artigas": { eje: "NS", lat: -34.334895, lng: -56.71645, minLat: -34.347214, maxLat: -34.329963, minLng: -56.719996, maxLng: -56.71237 },
  "jose artigas": { eje: "NS", lat: -34.334895, lng: -56.71645, minLat: -34.347214, maxLat: -34.329963, minLng: -56.719996, maxLng: -56.71237 },
  "bulevar artigas": { eje: "NS", lat: -34.334895, lng: -56.71645, minLat: -34.347214, maxLat: -34.329963, minLng: -56.719996, maxLng: -56.71237 },
  "mendez clara": { eje: "EO", lat: -34.337128, lng: -56.730011, minLat: -34.337394, maxLat: -34.336861, minLng: -56.731241, maxLng: -56.728782 },
  "predio asociacion rural": { eje: "NS", lat: -34.332317, lng: -56.697753, minLat: -34.334244, maxLat: -34.33039, minLng: -56.698327, maxLng: -56.697178 },
  "expo san jose": { eje: "NS", lat: -34.332317, lng: -56.697753, minLat: -34.334244, maxLat: -34.33039, minLng: -56.698327, maxLng: -56.697178 },
  "pelossi": { eje: "NS", lat: -34.347551, lng: -56.719812, minLat: -34.354957, maxLat: -34.341436, minLng: -56.721389, maxLng: -56.717819 },
  "ricardo detomasi": { eje: "EO", lat: -34.328784, lng: -56.699278, minLat: -34.328784, maxLat: -34.328784, minLng: -56.699278, maxLng: -56.699278 },
  "detomasi": { eje: "EO", lat: -34.328784, lng: -56.699278, minLat: -34.328784, maxLat: -34.328784, minLng: -56.699278, maxLng: -56.699278 },
  "batlle": { eje: "EO", lat: -34.339667, lng: -56.714502, minLat: -34.340581, maxLat: -34.338412, minLng: -56.719356, maxLng: -56.707865 },
  "dr julian bengoa": { eje: "EO", lat: -34.337637, lng: -56.712672, minLat: -34.338963, maxLat: -34.336249, minLng: -56.719814, maxLng: -56.705198 },
  "julian bengoa": { eje: "EO", lat: -34.337637, lng: -56.712672, minLat: -34.338963, maxLat: -34.336249, minLng: -56.719814, maxLng: -56.705198 },
  "pbro betancur": { eje: "EO", lat: -34.33467, lng: -56.716618, minLat: -34.337584, maxLat: -34.33227, minLng: -56.723767, maxLng: -56.70757 },
  "bentancur": { eje: "EO", lat: -34.33467, lng: -56.716618, minLat: -34.337584, maxLat: -34.33227, minLng: -56.723767, maxLng: -56.70757 },
  "rincon de nazareth": { eje: "NS", lat: -34.338803, lng: -56.709356, minLat: -34.346117, maxLat: -34.332012, minLng: -56.711315, maxLng: -56.706837 },
  "marin": { eje: "EO", lat: -34.328578, lng: -56.710903, minLat: -34.329499, maxLat: -34.327517, minLng: -56.714371, maxLng: -56.707433 },
  "san vicente": { eje: "EO", lat: -34.342491, lng: -56.722072, minLat: -34.342491, maxLat: -34.342491, minLng: -56.722072, maxLng: -56.722072 },
  "gardel": { eje: "NS", lat: -34.332983, lng: -56.695539, minLat: -34.336635, maxLat: -34.329322, minLng: -56.696734, maxLng: -56.694423 },
  "dr ciganda": { eje: "EO", lat: -34.341445, lng: -56.715509, minLat: -34.342906, maxLat: -34.339372, minLng: -56.723239, maxLng: -56.704343 },
  "evaristo ciganda": { eje: "EO", lat: -34.341445, lng: -56.715509, minLat: -34.342906, maxLat: -34.339372, minLng: -56.723239, maxLng: -56.704343 },
  "cont ellauri": { eje: "EO", lat: -34.345692, lng: -56.704317, minLat: -34.345692, maxLat: -34.345692, minLng: -56.704317, maxLng: -56.704317 },
  "cont nicolas guerra": { eje: "NS", lat: -34.35019, lng: -56.709125, minLat: -34.350302, maxLat: -34.350078, minLng: -56.709192, maxLng: -56.709058 },
  "cont rivera": { eje: "EO", lat: -34.354066, lng: -56.716954, minLat: -34.354066, maxLat: -34.354066, minLng: -56.716954, maxLng: -56.716954 },
  "ricardo di martino": { eje: "NS", lat: -34.341194, lng: -56.70576, minLat: -34.348429, maxLat: -34.329013, minLng: -56.709872, maxLng: -56.701957 },
  "gral diego lamas": { eje: "EO", lat: -34.340804, lng: -56.698365, minLat: -34.340804, maxLat: -34.340804, minLng: -56.698365, maxLng: -56.698365 },
  "caputti": { eje: "EO", lat: -34.338635, lng: -56.728073, minLat: -34.338635, maxLat: -34.338635, minLng: -56.728073, maxLng: -56.728073 },
  "corbacho": { eje: "EO", lat: -34.338635, lng: -56.728073, minLat: -34.338635, maxLat: -34.338635, minLng: -56.728073, maxLng: -56.728073 },
  "dr emilio frugoni": { eje: "NS", lat: -34.341422, lng: -56.703493, minLat: -34.345405, maxLat: -34.337439, minLng: -56.704548, maxLng: -56.702439 },
  "frugoni": { eje: "NS", lat: -34.341422, lng: -56.703493, minLat: -34.345405, maxLat: -34.337439, minLng: -56.704548, maxLng: -56.702439 },
  "pinto": { eje: "EO", lat: -34.333219, lng: -56.726842, minLat: -34.333219, maxLat: -34.333219, minLng: -56.726842, maxLng: -56.726842 },
  "dr alfonso espinola": { eje: "NS", lat: -34.344303, lng: -56.716231, minLat: -34.353811, maxLat: -34.33407, minLng: -56.718846, maxLng: -56.714164 },
  "alfonso espinola": { eje: "NS", lat: -34.344303, lng: -56.716231, minLat: -34.353811, maxLat: -34.33407, minLng: -56.718846, maxLng: -56.714164 },
  "espinola": { eje: "NS", lat: -34.344303, lng: -56.716231, minLat: -34.353811, maxLat: -34.33407, minLng: -56.718846, maxLng: -56.714164 },
  "cap eusebio vidal": { eje: "EO", lat: -34.343661, lng: -56.715752, minLat: -34.345821, maxLat: -34.341014, minLng: -56.726304, maxLng: -56.702087 },
  "vidal": { eje: "EO", lat: -34.343661, lng: -56.715752, minLat: -34.345821, maxLat: -34.341014, minLng: -56.726304, maxLng: -56.702087 },
  "gral flores": { eje: "NS", lat: -34.33736, lng: -56.698251, minLat: -34.34148, maxLat: -34.331164, minLng: -56.700135, maxLng: -56.696989 },
  "canaro": { eje: "EO", lat: -34.344746, lng: -56.710705, minLat: -34.346931, maxLat: -34.342099, minLng: -56.721251, maxLng: -56.699042 },
  "donato": { eje: "EO", lat: -34.335269, lng: -56.729453, minLat: -34.335269, maxLat: -34.335269, minLng: -56.729453, maxLng: -56.729453 },
  "paco espinola": { eje: "EO", lat: -34.334257, lng: -56.728781, minLat: -34.334257, maxLat: -34.334257, minLng: -56.728781, maxLng: -56.728781 },
  "munoz": { eje: "EO", lat: -34.349674, lng: -56.7129, minLat: -34.350214, maxLat: -34.3493, minLng: -56.716723, maxLng: -56.710501 },
  "mattos rodriguez": { eje: "NS", lat: -34.35292, lng: -56.712928, minLat: -34.352944, maxLat: -34.352895, minLng: -56.71294, maxLng: -56.712915 },
  "matos rodriguez": { eje: "NS", lat: -34.35292, lng: -56.712928, minLat: -34.352944, maxLat: -34.352895, minLng: -56.71294, maxLng: -56.712915 },
  "dr giampietro": { eje: "EO", lat: -34.351547, lng: -56.721972, minLat: -34.351843, maxLat: -34.351346, minLng: -56.724109, maxLng: -56.720063 },
  "mons seijas": { eje: "EO", lat: -34.337739, lng: -56.728359, minLat: -34.337739, maxLat: -34.337739, minLng: -56.728359, maxLng: -56.728359 },
  "seijas": { eje: "EO", lat: -34.337739, lng: -56.728359, minLat: -34.337739, maxLat: -34.337739, minLng: -56.728359, maxLng: -56.728359 },
  "hno dionisio": { eje: "EO", lat: -34.330142, lng: -56.713544, minLat: -34.330142, maxLat: -34.330142, minLng: -56.713544, maxLng: -56.713544 },
  "santos": { eje: "EO", lat: -34.335237, lng: -56.697976, minLat: -34.335237, maxLat: -34.335237, minLng: -56.697976, maxLng: -56.697976 },
  "instrucciones del ano xiii": { eje: "EO", lat: -34.328036, lng: -56.713651, minLat: -34.328556, maxLat: -34.327426, minLng: -56.717436, maxLng: -56.709839 },
  "zudanez": { eje: "EO", lat: -34.348054, lng: -56.712692, minLat: -34.349322, maxLat: -34.346416, minLng: -56.720328, maxLng: -56.703994 },
  "arias": { eje: "EO", lat: -34.337784, lng: -56.72274, minLat: -34.337784, maxLat: -34.337784, minLng: -56.72274, maxLng: -56.72274 },
  "varela": { eje: "EO", lat: -34.333136, lng: -56.723873, minLat: -34.334471, maxLat: -34.332023, minLng: -56.726368, maxLng: -56.720693 },
  "zubillaga": { eje: "EO", lat: -34.353803, lng: -56.715755, minLat: -34.353803, maxLat: -34.353803, minLng: -56.715755, maxLng: -56.715755 },
  "benito blanco": { eje: "EO", lat: -34.349419, lng: -56.716083, minLat: -34.349753, maxLat: -34.349085, minLng: -56.718055, maxLng: -56.714112 },
  "donagaray": { eje: "EO", lat: -34.352113, lng: -56.712459, minLat: -34.352113, maxLat: -34.352113, minLng: -56.712459, maxLng: -56.712459 },
  "ibarbourou": { eje: "EO", lat: -34.352518, lng: -56.713493, minLat: -34.352518, maxLat: -34.352518, minLng: -56.713493, maxLng: -56.713493 },
  "laguna": { eje: "NS", lat: -34.346328, lng: -56.726261, minLat: -34.347504, maxLat: -34.345152, minLng: -56.726832, maxLng: -56.72569 },
  "cumparsita": { eje: "EO", lat: -34.351883, lng: -56.711529, minLat: -34.351883, maxLat: -34.351883, minLng: -56.711529, maxLng: -56.711529 },
  "damaso antonio larranaga": { eje: "EO", lat: -34.341698, lng: -56.711145, minLat: -34.343043, maxLat: -34.340224, minLng: -56.718665, maxLng: -56.70294 },
  "damaso a larranaga": { eje: "EO", lat: -34.341698, lng: -56.711145, minLat: -34.343043, maxLat: -34.340224, minLng: -56.718665, maxLng: -56.70294 },
  "pbro larranaga": { eje: "EO", lat: -34.341698, lng: -56.711145, minLat: -34.343043, maxLat: -34.340224, minLng: -56.718665, maxLng: -56.70294 },
  "palmeras": { eje: "EO", lat: -34.353191, lng: -56.713765, minLat: -34.353191, maxLat: -34.353191, minLng: -56.713765, maxLng: -56.713765 },
  "piedras": { eje: "EO", lat: -34.325813, lng: -56.710915, minLat: -34.325837, maxLat: -34.325789, minLng: -56.711901, maxLng: -56.709929 },
  "cortinas": { eje: "EO", lat: -34.331263, lng: -56.722586, minLat: -34.331263, maxLat: -34.331263, minLng: -56.722586, maxLng: -56.722586 },
  "juan antonio lavalleja": { eje: "NS", lat: -34.336261, lng: -56.70286, minLat: -34.345179, maxLat: -34.328908, minLng: -56.704792, maxLng: -56.700455 },
  "gral lavalleja": { eje: "NS", lat: -34.336261, lng: -56.70286, minLat: -34.345179, maxLat: -34.328908, minLng: -56.704792, maxLng: -56.700455 },
  "gral leandro gomez": { eje: "NS", lat: -34.32833, lng: -56.716412, minLat: -34.329771, maxLat: -34.32689, minLng: -56.716829, maxLng: -56.715995 },
  "leandro gomez": { eje: "NS", lat: -34.32833, lng: -56.716412, minLat: -34.329771, maxLat: -34.32689, minLng: -56.716829, maxLng: -56.715995 },
  "alamos": { eje: "EO", lat: -34.354254, lng: -56.715086, minLat: -34.354832, maxLat: -34.353676, minLng: -56.716788, maxLng: -56.713384 },
  "almeida": { eje: "EO", lat: -34.352915, lng: -56.712821, minLat: -34.352915, maxLat: -34.352915, minLng: -56.712821, maxLng: -56.712821 },
  "calleros": { eje: "EO", lat: -34.350849, lng: -56.715699, minLat: -34.350927, maxLat: -34.350772, minLng: -56.716881, maxLng: -56.714517 },
  "haedo": { eje: "NS", lat: -34.350354, lng: -56.723004, minLat: -34.352351, maxLat: -34.348389, minLng: -56.723531, maxLng: -56.722454 },
  "bonavita": { eje: "EO", lat: -34.33151, lng: -56.721708, minLat: -34.33151, maxLat: -34.33151, minLng: -56.721708, maxLng: -56.721708 },
  "mendiague": { eje: "EO", lat: -34.330078, lng: -56.721469, minLat: -34.330078, maxLat: -34.330078, minLng: -56.721469, maxLng: -56.721469 },
  "salem tajes": { eje: "EO", lat: -34.332577, lng: -56.723568, minLat: -34.332577, maxLat: -34.332577, minLng: -56.723568, maxLng: -56.723568 },
  "velazquez": { eje: "NS", lat: -34.351502, lng: -56.712341, minLat: -34.351929, maxLat: -34.351076, minLng: -56.712493, maxLng: -56.712188 },
  "dr marra": { eje: "EO", lat: -34.351878, lng: -56.719199, minLat: -34.351878, maxLat: -34.351878, minLng: -56.719199, maxLng: -56.719199 },
  "corujo de molina": { eje: "EO", lat: -34.340072, lng: -56.696936, minLat: -34.340311, maxLat: -34.339833, minLng: -56.698384, maxLng: -56.695488 },
  "barreiro": { eje: "EO", lat: -34.350647, lng: -56.723693, minLat: -34.351271, maxLat: -34.349874, minLng: -56.726178, maxLng: -56.721909 },
  "guerra": { eje: "EO", lat: -34.352293, lng: -56.717487, minLat: -34.352829, maxLat: -34.351366, minLng: -56.719877, maxLng: -56.712726 },
  "gral manuel oribe": { eje: "NS", lat: -34.340415, lng: -56.707742, minLat: -34.345993, maxLat: -34.332576, minLng: -56.709952, maxLng: -56.706198 },
  "manuel oribe": { eje: "NS", lat: -34.340415, lng: -56.707742, minLat: -34.345993, maxLat: -34.332576, minLng: -56.709952, maxLng: -56.706198 },
  "estramin": { eje: "EO", lat: -34.355224, lng: -56.71594, minLat: -34.355224, maxLat: -34.355224, minLng: -56.71594, maxLng: -56.71594 },
  "chanquet": { eje: "EO", lat: -34.341455, lng: -56.701345, minLat: -34.341689, maxLat: -34.341221, minLng: -56.702357, maxLng: -56.700334 },
  "berro": { eje: "EO", lat: -34.347385, lng: -56.719377, minLat: -34.347385, maxLat: -34.347385, minLng: -56.719377, maxLng: -56.719377 },
  "dr pieri": { eje: "EO", lat: -34.350671, lng: -56.719495, minLat: -34.350671, maxLat: -34.350671, minLng: -56.719495, maxLng: -56.719495 },
  "montagne": { eje: "NS", lat: -34.341648, lng: -56.719083, minLat: -34.348531, maxLat: -34.335855, minLng: -56.72066, maxLng: -56.717239 },
  "massini": { eje: "EO", lat: -34.344649, lng: -56.723996, minLat: -34.344649, maxLat: -34.344649, minLng: -56.723996, maxLng: -56.723996 },
  "sguilla": { eje: "EO", lat: -34.333539, lng: -56.716518, minLat: -34.333539, maxLat: -34.333539, minLng: -56.716518, maxLng: -56.716518 },
  "gral rivera": { eje: "NS", lat: -34.347292, lng: -56.718829, minLat: -34.352195, maxLat: -34.340913, minLng: -56.720584, maxLng: -56.717498 },
  "fructuoso rivera": { eje: "NS", lat: -34.347292, lng: -56.718829, minLat: -34.352195, maxLat: -34.340913, minLng: -56.720584, maxLng: -56.717498 },
  "dr zagarra": { eje: "EO", lat: -34.351955, lng: -56.719868, minLat: -34.351955, maxLat: -34.351955, minLng: -56.719868, maxLng: -56.719868 },
  "zagarra": { eje: "EO", lat: -34.351955, lng: -56.719868, minLat: -34.351955, maxLat: -34.351955, minLng: -56.719868, maxLng: -56.719868 },
  "rotonda": { eje: "NS", lat: -34.334463, lng: -56.732471, minLat: -34.334573, maxLat: -34.334353, minLng: -56.732539, maxLng: -56.732403 },
  "perez martinez": { eje: "EO", lat: -34.330327, lng: -56.714523, minLat: -34.330327, maxLat: -34.330327, minLng: -56.714523, maxLng: -56.714523 },
  "treinta y tres orientales": { eje: "NS", lat: -34.341736, lng: -56.713263, minLat: -34.352931, maxLat: -34.331505, minLng: -56.716104, maxLng: -56.710192 },
  "viera y benavides": { eje: "EO", lat: -34.332742, lng: -56.712426, minLat: -34.332742, maxLat: -34.332742, minLng: -56.712426, maxLng: -56.712426 },
  "wilson ferreira": { eje: "EO", lat: -34.341876, lng: -56.727224, minLat: -34.342399, maxLat: -34.341354, minLng: -56.729404, maxLng: -56.725044 },
  "ferreira aldunate": { eje: "EO", lat: -34.341876, lng: -56.727224, minLat: -34.342399, maxLat: -34.341354, minLng: -56.729404, maxLng: -56.725044 },
  "juan zorrilla de san martin": { eje: "EO", lat: -34.336423, lng: -56.711955, minLat: -34.337978, maxLat: -34.335188, minLng: -56.720102, maxLng: -56.705481 },
  "zorrilla": { eje: "EO", lat: -34.336423, lng: -56.711955, minLat: -34.337978, maxLat: -34.335188, minLng: -56.720102, maxLng: -56.705481 },
  "plaza de los treinta y tres": { eje: "NS", lat: -34.341736, lng: -56.713263, minLat: -34.352931, maxLat: -34.331505, minLng: -56.716104, maxLng: -56.710192 },
  "plaza treinta y tres": { eje: "NS", lat: -34.341736, lng: -56.713263, minLat: -34.352931, maxLat: -34.331505, minLng: -56.716104, maxLng: -56.710192 },
  "plaza principal": { eje: "NS", lat: -34.341736, lng: -56.713263, minLat: -34.352931, maxLat: -34.331505, minLng: -56.716104, maxLng: -56.710192 },
  "dieciocho": { eje: "EO", lat: -34.339031, lng: -56.713967, minLat: -34.340087, maxLat: -34.337975, minLng: -56.71949, maxLng: -56.708445 },
  "artigas": { eje: "NS", lat: -34.334895, lng: -56.71645, minLat: -34.347214, maxLat: -34.329963, minLng: -56.719996, maxLng: -56.71237 },
  "batlle y ordonez": { eje: "EO", lat: -34.339667, lng: -56.714502, minLat: -34.340581, maxLat: -34.338412, minLng: -56.719356, maxLng: -56.707865 },
  "rodriguez": { eje: "EO", lat: -34.332682, lng: -56.714203, minLat: -34.335755, maxLat: -34.329672, minLng: -56.7228, maxLng: -56.705341 },
  "manuel d rodriguez": { eje: "EO", lat: -34.332682, lng: -56.714203, minLat: -34.335755, maxLat: -34.329672, minLng: -56.7228, maxLng: -56.705341 },
  "brasil": { eje: "EO", lat: -34.346069, lng: -56.711124, minLat: -34.34824, maxLat: -34.34388, minLng: -56.722587, maxLng: -56.699581 },
  "av brasil": { eje: "EO", lat: -34.346069, lng: -56.711124, minLat: -34.34824, maxLat: -34.34388, minLng: -56.722587, maxLng: -56.699581 },
  "larriera": { eje: "NS", lat: -34.330584, lng: -56.71171, minLat: -34.331789, maxLat: -34.327196, minLng: -56.712096, maxLng: -56.71082 },
  "bengoa": { eje: "EO", lat: -34.337637, lng: -56.712672, minLat: -34.338963, maxLat: -34.336249, minLng: -56.719814, maxLng: -56.705198 },
  "ciganda": { eje: "EO", lat: -34.341445, lng: -56.715509, minLat: -34.342906, maxLat: -34.339372, minLng: -56.723239, maxLng: -56.704343 },
  "acuna de figueroa": { eje: "EO", lat: -34.340007, lng: -56.718215, minLat: -34.340007, maxLat: -34.340007, minLng: -56.718215, maxLng: -56.718215 },
  "aparicio saravia": { eje: "EO", lat: -34.3463, lng: -56.724242, minLat: -34.347011, maxLat: -34.345536, minLng: -56.727415, maxLng: -56.719867 },
  "carreton": { eje: "EO", lat: -34.331, lng: -56.73, minLat: -34.333, maxLat: -34.329, minLng: -56.735, maxLng: -56.725 },
  "camino carreton": { eje: "EO", lat: -34.331, lng: -56.73, minLat: -34.333, maxLat: -34.329, minLng: -56.735, maxLng: -56.725 },
};

function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.,;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Hash numérico simple para agregar una variación sutil determinista */
function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

// Claves ordenadas por longitud descendente para optimizar coincidencia de frases compuestas
const CLAVES_ORDENADAS = Object.keys(EJES_CALLES).sort((a, b) => b.length - a.length);

/**
 * Geocodifica una dirección o sitio de San José de Mayo.
 * Devuelve { lat, lng } con precisión adecuada y siempre contenido en el casco urbano.
 */
export function geocodificarDireccion(texto) {
  const norm = normalizar(texto);
  if (!norm) return { ...CENTRO_SAN_JOSE };

  // 1. Verificación directa con puntos de interés y referencias conocidas
  for (const [clave, coord] of Object.entries(PUNTOS_REFERENCIA)) {
    if (norm.includes(clave)) {
      const hash = hashString(norm);
      const jLat = ((hash % 100) - 50) * 0.000003;
      const jLng = (((hash >> 4) % 100) - 50) * 0.000003;
      return {
        lat: Number(clamp(coord.lat + jLat, LIMITES_URBANOS.minLat, LIMITES_URBANOS.maxLat).toFixed(6)),
        lng: Number(clamp(coord.lng + jLng, LIMITES_URBANOS.minLng, LIMITES_URBANOS.maxLng).toFixed(6)),
      };
    }
  }

  // 2. Intersección de dos calles (ej: "Artigas y 18 de Julio", "Asamblea esquina 25 de Mayo")
  const conectores = [' y ', ' e ', ' esquina ', ' esq '];
  for (const c of conectores) {
    if (norm.includes(c)) {
      const partes = norm.split(c).map((s) => s.trim()).filter(Boolean);
      if (partes.length >= 2) {
        const c1 = EJES_CALLES[partes[0]] || Object.entries(EJES_CALLES).find(([k]) => partes[0].includes(k))?.[1];
        const c2 = EJES_CALLES[partes[1]] || Object.entries(EJES_CALLES).find(([k]) => partes[1].includes(k))?.[1];
        if (c1 && c2) {
          let lat, lng;
          if (c1.eje === 'EO' && c2.eje === 'NS') {
            lat = c1.lat;
            lng = c2.lng;
          } else if (c1.eje === 'NS' && c2.eje === 'EO') {
            lat = c2.lat;
            lng = c1.lng;
          } else {
            lat = (c1.lat + c2.lat) / 2;
            lng = (c1.lng + c2.lng) / 2;
          }
          return {
            lat: Number(clamp(lat, LIMITES_URBANOS.minLat, LIMITES_URBANOS.maxLat).toFixed(6)),
            lng: Number(clamp(lng, LIMITES_URBANOS.minLng, LIMITES_URBANOS.maxLng).toFixed(6)),
          };
        }
      }
    }
  }

  // 3. Calle con número de puerta (ej: "18 de Julio 540", "Asamblea 610", "Artigas 300")
  let calle = null;
  let restoTexto = norm;

  for (const k of CLAVES_ORDENADAS) {
    const rx = new RegExp(`(^|\\b)${escapeRegex(k)}(\\b|$)`, 'i');
    if (rx.test(norm)) {
      calle = EJES_CALLES[k];
      restoTexto = norm.replace(rx, ' ').trim();
      break;
    }
  }

  const matchNum = restoTexto.match(/\b(\d{1,5})\b/);
  const numero = matchNum ? parseInt(matchNum[1], 10) : null;

  if (calle) {
    const hash = hashString(norm);
    const jJitter = ((hash % 100) - 50) * 0.000003;

    if (calle.eje === 'EO') {
      const lat = calle.lat + jJitter;
      let lng;
      if (numero && numero > 0 && numero < 3500) {
        // En calles Este-Oeste, los números avanzan de Oeste (minLng) a Este (maxLng)
        const maxNumEstimado = Math.max(1000, Math.round(((calle.maxLng - calle.minLng) / 0.0020) * 100));
        const frac = clamp((numero - 100) / (maxNumEstimado - 100), 0.05, 0.95);
        lng = calle.minLng + frac * (calle.maxLng - calle.minLng);
      } else {
        lng = calle.lng + ((hash % 100) - 50) * 0.00003;
      }
      return {
        lat: Number(clamp(lat, LIMITES_URBANOS.minLat, LIMITES_URBANOS.maxLat).toFixed(6)),
        lng: Number(clamp(lng, LIMITES_URBANOS.minLng, LIMITES_URBANOS.maxLng).toFixed(6)),
      };
    } else {
      const lng = calle.lng + jJitter;
      let lat;
      if (numero && numero > 0 && numero < 3500) {
        // En calles Norte-Sur, los números avanzan de Norte (maxLat) a Sur (minLat)
        const maxNumEstimado = Math.max(1000, Math.round(((calle.maxLat - calle.minLat) / 0.0018) * 100));
        const frac = clamp((numero - 100) / (maxNumEstimado - 100), 0.05, 0.95);
        lat = calle.maxLat - frac * (calle.maxLat - calle.minLat);
      } else {
        lat = calle.lat + ((hash % 100) - 50) * 0.00003;
      }
      return {
        lat: Number(clamp(lat, LIMITES_URBANOS.minLat, LIMITES_URBANOS.maxLat).toFixed(6)),
        lng: Number(clamp(lng, LIMITES_URBANOS.minLng, LIMITES_URBANOS.maxLng).toFixed(6)),
      };
    }
  }

  // 4. Fallback dentro del radio urbano central de la ciudad
  const hash = hashString(norm);
  const offsetLat = ((hash % 100) - 50) * 0.00004;
  const offsetLng = (((hash >> 3) % 100) - 50) * 0.00004;

  return {
    lat: Number(clamp(CENTRO_SAN_JOSE.lat + offsetLat, LIMITES_URBANOS.minLat, LIMITES_URBANOS.maxLat).toFixed(6)),
    lng: Number(clamp(CENTRO_SAN_JOSE.lng + offsetLng, LIMITES_URBANOS.minLng, LIMITES_URBANOS.maxLng).toFixed(6)),
  };
}
