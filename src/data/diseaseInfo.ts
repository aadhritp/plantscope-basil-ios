/**
 * Basil disease knowledge base, ported 1:1 from plantscope_app/data/diagnostics.json.
 * Plain data, looked up client-side after on-device inference - no network call.
 */

export type DiagnosisEntry = {
  label: string;
  tagline: string;
  whatItIs: string;
  whyItHappened: string;
  keywords: string[];
  whatToDo: string[];
  nextStep: string;
};

export const CLASS_NAMES = [
  'bacterial_spot',
  'bug_spot',
  'downy_mildew',
  'healthy',
  'magnesium_deficiency',
  'nitrogen_deficiency',
  'powdery_mildew',
] as const;

export const DIAGNOSTICS: Record<string, DiagnosisEntry> = {
  healthy: {
    label: 'Healthy',
    tagline: 'Your basil looks good.',
    whatItIs:
      'No signs of disease, pests, or feeding problems. The leaves are an even green, firm, and free of spots or holes.',
    whyItHappened:
      'This is what happens when a basil plant is getting what it needs: enough light, steady watering, and decent soil. Nothing went wrong here.',
    keywords: ['healthy', 'no disease detected'],
    whatToDo: [
      "Keep doing whatever you're doing: same watering routine, same spot.",
      "Basil wants 6+ hours of sun a day. If it's getting less, growth will slow even without disease.",
      'Water at the soil, not over the leaves. Wet leaves are how most basil problems start.',
      'Pinch off the top leaves regularly (harvesting). It keeps the plant bushy and producing instead of flowering early.',
    ],
    nextStep:
      'Nothing urgent. Check back in on it in a week, especially the older lower leaves, since problems usually show up there first.',
  },
  bacterial_spot: {
    label: 'Bacterial Leaf Spot',
    tagline: 'Dark, water-soaked spots caused by bacteria, not a fungus.',
    whatItIs:
      "Small, dark brown to black spots on the leaves, often with a slightly see-through or 'water-soaked' look around the edges. Sometimes the spots are angular, like they're following the lines of the leaf. This is bacterial leaf spot, usually from bacteria in the Pseudomonas or Xanthomonas family.",
    whyItHappened:
      'Bacteria need water to spread. They get splashed from leaf to leaf by rain, overhead watering, or even just brushing against wet leaves while working in the garden. Crowded plants with poor airflow make it worse because leaves stay wet longer.',
    keywords: ['bacterial leaf spot', 'Pseudomonas cichorii', 'Xanthomonas', 'water-soaked lesions'],
    whatToDo: [
      "Pick off and throw away the spotted leaves. Don't compost them, the bacteria can survive in plant debris.",
      'Stop watering from above. Water the soil directly so the leaves stay dry.',
      'Give plants more breathing room. More space between them means leaves dry faster.',
      "Don't touch wet plants if you can help it (especially after rain), since your hands and tools can spread the bacteria to healthy plants.",
      "Wipe down pruning scissors or tools with rubbing alcohol between plants if you've been cutting infected leaves.",
      "If it keeps spreading, a copper-based spray can help slow it down, but it won't cure leaves that are already spotted.",
    ],
    nextStep:
      "Remove the worst leaves now and watch the plant for 3-5 days. If new leaves are coming in clean, you've got it under control. If spots show up on new growth too, the plant may not recover and might be worth replacing.",
  },
  bug_spot: {
    label: 'Insect Feeding Damage',
    tagline: "Holes and ragged edges: something's been eating your basil.",
    whatItIs:
      "Irregular holes, chewed edges, or ragged patches in the leaves. This isn't a disease at all, it's physical damage from insects (or sometimes slugs/snails) feeding on the plant.",
    whyItHappened:
      'Common culprits are caterpillars, beetles (like Japanese beetles), grasshoppers, and slugs. Slugs tend to feed at night and leave smooth, rounded holes; beetles and caterpillars leave more ragged, irregular chewing. Damp gardens, nearby weeds, and dense plantings give pests more places to hide.',
    keywords: ['insect feeding damage', 'leaf herbivory', 'caterpillars', 'slugs', 'beetles'],
    whatToDo: [
      "Check the undersides of leaves and the soil around the base of the plant, since that's where most pests hide during the day.",
      'If you find caterpillars or beetles, pick them off by hand and relocate or dispose of them.',
      "For slugs, check at night with a flashlight, since they're most active after dark. A ring of crushed eggshells or coffee grounds around the plant can help keep them off.",
      'Neem oil or insecticidal soap, sprayed in the evening, is safe for basil and handles most soft-bodied pests.',
      'A floating row cover (a light fabric mesh) keeps flying pests off without chemicals.',
    ],
    nextStep:
      'Inspect the plant (and its neighbors) tonight and tomorrow morning to catch the pest in the act. That tells you exactly what you\'re dealing with and which fix to use.',
  },
  downy_mildew: {
    label: 'Downy Mildew',
    tagline: "Yellow patches on top, fuzzy gray growth underneath, and it spreads fast.",
    whatItIs:
      'Yellow or pale patches on the upper side of the leaf, often blocky or following the leaf veins. Flip the leaf over and you may see a gray-to-purple fuzzy coating, which is the fungus itself. This is basil downy mildew (caused by the pathogen Peronospora belbahrii), one of the most common and serious basil diseases.',
    whyItHappened:
      "Downy mildew spreads through the air as spores and needs humid, damp conditions to take hold. Overcrowded plants, poor airflow, and wet leaves (from watering, rain, or morning dew that doesn't dry off) are the perfect setup for it.",
    keywords: ['downy mildew', 'Peronospora belbahrii', 'sporulation', 'interveinal chlorosis'],
    whatToDo: [
      "Remove infected leaves immediately, and if more than half the plant is affected, remove the whole plant. Throw it in the trash, not the compost, since the spores can survive and spread.",
      'Space plants further apart and prune nearby growth to get more air moving through the leaves.',
      'Water the soil only, in the morning, so any moisture on the plant dries off during the day.',
      "If you're replanting, look for downy-mildew-resistant basil varieties (e.g. 'Prospera', 'Amazel'), since regular sweet basil is very prone to this.",
      "In bad cases, a copper-based or biological fungicide applied early can slow the spread, but it won't undo damage that's already there.",
    ],
    nextStep:
      'Act today, not this week. Downy mildew spreads through a garden fast once conditions are right. Isolate or remove affected plants and improve airflow before checking nearby basil plants for the same yellow patches.',
  },
  magnesium_deficiency: {
    label: 'Magnesium Deficiency',
    tagline: 'Yellowing between the veins, while the veins themselves stay green.',
    whatItIs:
      'The leaf turns yellow in the spaces between the veins, but the veins stay green, almost like a green net over a yellow background. This usually starts on the older, lower leaves first. In more advanced cases the yellow patches can turn reddish-purple. This pattern is called interveinal chlorosis, and on basil it\'s a classic sign of low magnesium.',
    whyItHappened:
      "Magnesium is a mobile nutrient the plant pulls from older leaves to feed new growth when it's running low. This usually happens in sandy or frequently-watered soil where magnesium washes out easily, in acidic soil, or in pots that haven't been fed in a while.",
    keywords: ['magnesium deficiency', 'interveinal chlorosis', 'nutrient deficiency'],
    whatToDo: [
      'Mix 1-2 tablespoons of Epsom salt (magnesium sulfate) into a gallon of water and water it into the soil. This is the fastest, most common fix.',
      'You can also spray a more dilute Epsom salt solution directly on the leaves for a quicker response.',
      'Switch to a balanced fertilizer that includes micronutrients, not just nitrogen-phosphorus-potassium, since many basic fertilizers leave magnesium out.',
      'Check your soil pH if you can. Basil prefers 6.0 to 7.0, and very acidic soil makes it harder for the plant to take up magnesium even if it\'s present.',
    ],
    nextStep:
      'Feed with the Epsom salt mix now, then check the new leaves in 7-10 days. They should grow in a richer, even green, which confirms it was magnesium and not something else.',
  },
  nitrogen_deficiency: {
    label: 'Nitrogen Deficiency',
    tagline: 'Overall pale, yellowing leaves and slow, thin growth.',
    whatItIs:
      'The whole leaf turns pale green to yellow (not just patches between the veins), usually starting with the older, lower leaves. Growth slows down and stems can look thin and weak. Basil is a heavy feeder, and nitrogen is the nutrient it burns through fastest.',
    whyItHappened:
      "Most often this is just a basil plant that hasn't been fed in a while, especially if it's in a pot, since container soil runs out of nutrients much faster than garden soil. Frequent watering also flushes nitrogen out of the soil over time.",
    keywords: ['nitrogen deficiency', 'chlorosis', 'heavy feeder'],
    whatToDo: [
      'Feed with a balanced or nitrogen-leaning fertilizer, such as fish emulsion, compost tea, or a balanced 10-10-10, all of which work well for basil.',
      "If it's in a pot, basil usually needs feeding every 2-3 weeks during the growing season, since soil nutrients run out fast in containers.",
      'Top-dress with compost if you have it; it feeds the plant slowly and improves the soil at the same time.',
      'Make sure the pot or bed drains well. Basil sitting in waterlogged soil struggles to take up nutrients even if they\'re there.',
    ],
    nextStep:
      "Feed it and water consistently. New leaves should come in a deeper green within 1-2 weeks, which is your sign it's responding.",
  },
  powdery_mildew: {
    label: 'Powdery Mildew',
    tagline: "A white, powdery coating on the leaves. Looks like dust, isn't.",
    whatItIs:
      'A white-to-gray, flour-like dusting on the surface of the leaves, usually starting on older growth. Leaves can curl or look slightly distorted as it spreads. This is powdery mildew, a different fungus from downy mildew, and unlike downy mildew it doesn\'t need wet leaves to spread.',
    whyItHappened:
      'Powdery mildew thrives in warm days and cool nights with high humidity in the air, even if the leaves themselves are dry. Crowded plants with poor airflow and not enough sun are the main risk factors.',
    keywords: ['powdery mildew', 'Erysiphe', 'Golovinomyces', 'foliar fungus'],
    whatToDo: [
      'Remove the worst-affected leaves to slow the spread.',
      'Increase spacing between plants and prune back anything crowding the basil. More airflow makes a big difference.',
      'Move the plant to a spot with more direct sun if possible; powdery mildew struggles in bright, sunny conditions.',
      'A neem oil spray, a potassium bicarbonate spray, or even a diluted milk spray (1 part milk to 9 parts water) applied weekly can control mild cases.',
      "Avoid wetting the leaves when watering. It won't stop powdery mildew, but excess moisture invites other problems on top of it.",
    ],
    nextStep:
      "Trim off the dustiest leaves and start a weekly neem oil or milk spray. Check back in a week, and if the new leaves stay clean, you're ahead of it.",
  },
};

export function lookupDiagnosis(classId: string): DiagnosisEntry {
  return (
    DIAGNOSTICS[classId] ?? {
      label: classId,
      tagline: '',
      whatItIs: 'No information is available for this finding.',
      whyItHappened: '',
      keywords: [],
      whatToDo: [],
      nextStep: '',
    }
  );
}
