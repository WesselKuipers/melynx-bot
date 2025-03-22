import { elementEmojis } from './elementEmojis';

type Monster = {
  name: string;
  iconName?: string;
  description: string;
  weakness: keyof typeof elementEmojis;
};

export const monsters: Monster[] = [
  {
    name: 'Ajarakan',
    description:
      'Characteristic by their highly developed carapaces, Ajarakan wrap themselves in molten metal that they rub together to heat up and create explosions. Presumably due to the friction of the metal, they can reach high enough temperatures to melt even the ground or bullets. They can also use their strong limbs to grip onto the ceiling and move around freely, so a hunter must watch out from every angle, including above.',
    weakness: 'water',
  },
  {
    name: 'Arkveld',
    description:
      'A flying wyvern that was considered extinct according to documents left behind by the Guild. Their wings have a unique, chain-like blade that can extend and retract freely to reap their prey. They feed on elemental energy absorbed through these chainblades, and are able to convert the energy to unleash dragon element attacks.',
    weakness: 'dragon',
  },
  {
    name: 'Balahara',
    description:
      'Desert-dwelling leviathans that build carapaces out of the fulgurite formed by lightning strikes. They use their flexible skeletons and serpentine bodies to create quicksand traps for unwary prey. Inside their mouths are multiple eye-like sensory organs. The mucus they secrete contains luminous bacteria and is believed to aid visibility while they are submerged and other low-light conditions like sandstorms.',
    weakness: 'thunder',
  },
  {
    name: 'Blagonga',
    description:
      'Large, white fanged beasts that rule over other Blango, attacking intruders as a pack. Its muscularity and mobility allows it to strike swiftly, even on fresh snow, and pounce from long distances—so hunters with long-range weapons still need to stay on guard. Large tusks are the mark of a powerful leader.',
    weakness: 'fire',
  },
  {
    name: 'Chatacabra',
    description:
      'Amphibians that use their long tongues to seize and devour prey such as Bulaqchi. Their evolved forelimbs store a sticky mucus-like substance. When agitated, Chatacabra rub their forelimbs against the ground to collect stone and ore, widening the range and destructiveness of their blows.',
    weakness: 'thunder',
  },
  {
    name: 'Congalala',
    description:
      "Large fanged beasts with pink fur and a distinct crest, which the males sculpt with plant oils and juices as a sign of virility. Congalala are common in temperate forests and are therefore well researched. They're big eaters and love mushrooms, which they absorb and then exhale as a variety of potent breaths that inflict poison, blast, paralysis, and more.",
    weakness: 'fire',
  },
  {
    name: 'Doshaguma',
    description:
      "Fanged beasts that are sometimes seen traveling in packs. Ruggedly built and extremely aggressive, Doshaguma won't hesitate to throw everything they've got at enemies—even other small monsters. They have been known to take prey back to their dens, which sometimes leads to violent disputes.",
    weakness: 'fire',
  },
  {
    name: 'Gore Magala',
    description:
      'Monsters that drape themselves in their great wings, like a black overcoat. They have no eye sensory organs, so instead they use a scattering of fine scales from their wings to locate prey. When their sensory capacity increases, antennae appear on their heads and they unfurl their wings, entering the aggressive Frenzy State. Their black scales can Frenzy other creatures as well, making them fearsome adversaries.',
    weakness: 'fire',
  },
  {
    name: 'Gravios',
    description:
      'Large wyverns found in Oilwell Basin. They have a developed physique, powerful heat rays, and a host of gases they can emit from their body. Their bony carapaces are famously tough but expose a surprisingly brittle interior once destroyed.',
    weakness: 'water',
  },
  {
    name: 'Guardian Doshaguma',
    description:
      "An artificial monster species created by an ancient civilization and imbued with Doshaguma's power. Guardian Doshaguma cannot reproduce and do not require food, relying instead on Wyvern Milk for energy. While anything but agile, they're tough enough to charge right through attacks without flinching, making them extremely dangerous.",
    weakness: 'fire',
  },
  {
    name: 'Guardian Ebony Odogaron',
    description:
      "An artificial monster species created by an ancient civilization and imbued with Ebony Odogaron's power. Guardian Ebony Odogaron cannot reproduce and do not require food, relying instead on Wyvern Milk for energy. They will attempt to corner targets with flurries of attacks from their well- developed claws and tails.",
    weakness: 'water',
  },
  {
    name: 'Guardian Fulgur Anjanath',
    description:
      "An artificial monster species created by an ancient civilization and imbued with Fulgur Anjanath's power. Guardian Fulgur Anjanath cannot reproduce and do not require food, relying instead on Wyvern Milk for energy. Not only can the lightning charged in their bodies be released as an attack, they can also use it to empower themselves and perform vicious biting attacks.",
    weakness: 'ice',
  },
  {
    name: 'Guardian Rathalos',
    description:
      "An artificial monster species created by an ancient civilization and imbued with Rathalos's power. Guardian Rathalos cannot reproduce and do not require food, relying instead on Wyvern Milk for energy. Just like the original Rathalos, they are superior fliers and will attack more violently with their claws while airborne.",
    weakness: 'dragon',
  },
  {
    name: 'Gypceros',
    description:
      'Wyverns that can stun enemies by striking their prominent crests to produce powerful flashes of light. Their stretchy, rubbery hide resists blunt impacts and reduces the effectiveness of shock traps. A smart hunter knows to maneuver carefully around the poisonous filth they spew, which drips from ceilings or down slopes.',
    weakness: 'fire',
  },
  {
    name: 'Hirabami',
    description:
      'Leviathans that inhabit the Iceshard Cliffs. They have sharp, pincer-like tails and peculiar membranes on their necks that catch the wind and keep them aloft. Hirabami can sometimes be sighted nesting in groups along the cliffs, using their scales or foreclaws to cling to walls or ceilings while they sleep.',
    weakness: 'fire',
  },
  {
    name: 'Jin Dahaad',
    description:
      "A leviathan that sits at the peak of the Iceshard Cliffs' ecosystem. It surrounds its massive form in cold temperatures via ridge-like cooling organs across its body; the frost its limbs produce doubles as a potent weapon and a way to travel along walls and floating rocks.",
    weakness: 'fire',
  },
  {
    name: 'Lala Barina',
    description:
      'Temnocerans native to the Scarlet Forest with distinctive, pirouette-like movements. Their fluids contain a neuroplegic agent which they mix with water to produce red, petal-like bristles on their abdomens. When agitated, Lala Barina open these bristles like a deadly, blossoming flower and release them as florets that paralyze whatever they come into contact with.',
    weakness: 'fire',
  },
  {
    name: 'Nerscylla',
    description:
      'Temnocerans that inhabit the Iceshard Cliffs. They weave vast, sticky webs across their territory, using them and various status ailments to corner prey before utilizing pincer-like jaws to finish it off. Sometimes dead Gypceros can be found in the webs, the hides of which Nerscylla are known to adorn themselves with after devouring the rest of the carcass.',
    weakness: 'fire',
  },
  {
    name: 'Nu Udra',
    description:
      "The cephalopod that reigns supreme over Oilwell Basin's ecosystem. Usually, when sighted, Nu Udra is covered in oilsilt, but when enraged it will ignite the coating, transfiguring itself into a horror of flame. The oculi that appear on its body and many arms are presumed to be sensory organs, but the truth is still being investigated.",
    weakness: 'water',
  },
  {
    name: 'Quematrice',
    description:
      'Brute wyverns with disproportionately long tails. They spread a flammable substance which vaporizes quickly, then ignite it by dragging their tails along the ground. By nature, Quematrice rarely hunt their own prey, and instead scavenge herbivore carrion left behind by other predators. This often leads to confrontations with other, smaller carnivores.',
    weakness: 'water',
  },
  {
    name: 'Rathalos',
    description:
      'Fearsome male wyverns known as the "Kings of the Skies." Alongside the Rathian, they stake out a wide territory around their nests, and it is the male\'s role to watch from above. Armed with powerful poisonous claws and fiery breath, Rathalos use their aerial prowess to descend on invaders.',
    weakness: 'dragon',
  },
  {
    name: 'Rathian',
    description:
      'Fire-breathing female wyverns known as the "Queens of the Land." Their powerful legs and venomous tails make them efficient ground hunters. At times, Rathian and Rathalos can be sighted hunting as a couple. After laying eggs, Rathian are extremely watchful of their nests. Proceed with extra caution, as a mother will move swiftly to protect her young.',
    weakness: 'dragon',
  },
  {
    name: 'Rey Dau',
    description:
      "The flying wyvern that reigns supreme over the Windward Plains' ecosystem. It has adapted to the Sandtide—when it most frequently appears—and is able to store, amplify, and discharge the storm's heavy lightning to lethal effect. Rey Dau is highly territorial and will attack any and all intruders on sight. The fulgurite against its carapace emits a sound that puts every monster in the region on guard.",
    weakness: 'ice',
  },
  {
    name: 'Rompopolo',
    description:
      'Dappled brute wyverns that prowl Oilwell Basin. They use their tails to inject gas into the ground and detonate it, then feed on the small creatures that are unearthed. The toxic gas they spray from their tongues serve to weaken prey, which they then finish off with the blasts. Rompopolo are extremely territorial and will readily engage their own kind.',
    weakness: 'water',
  },
  {
    name: 'Uth Duna',
    description:
      "The leviathan that reigns supreme over the Scarlet Forest's ecosystem. It has adapted to water-rich environments and is sighted most often during the Downpour. Uth Duna's secretions when combined with water form a protective veil that not only absorbs hostile blows but also adds weight, which it slams down with enough force to sweep away surrounding threats in the resulting wave.",
    weakness: 'thunder',
  },
  {
    name: 'Xu Wu',
    description:
      'Cephalopod predators whose prey include Guardian monsters. The mucus secreted from their tentacles hardens quickly into sharp edges that resemble blades or spears, which is why some call Xu Wu the "Piercing Assassin." The sizable mouth hidden on their underside allows them to devour even rather large prey.',
    weakness: 'ice',
  },
  {
    name: 'Yian Kut-Ku',
    description:
      'Bird wyverns with impressive beaks and large ears. They tend to be skittish but will sometimes initiate attacks on a perceived threat. Yian Kut-Ku arrive in large groups during the season of Plenty in the Scarlet Forest. The absence of eggs or young suggests that the purpose of this is not to breed, but rather to seek out mates and nourishment.',
    weakness: 'ice',
  },
];
