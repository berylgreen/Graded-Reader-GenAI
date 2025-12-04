import { WordGroup } from './types';

const RAW_DATA = `第1组（单词1-100）, a, about, all, am, an, and, are, as, at, be, been, but, by, called, can, come, could, day, did, do, down, each, find, first, for, from, get, go, had, has, have, he, her, him, his, how, I, if, in, into, is, it, its, like, long, look, made, make, many, may, more, my, no, not, now, number, of, on, one, or, other, out, part, people, said, see, she, so, some, than, that, the, their, them, then, there, these, they, this, time, to, two, up, use, was, water, way, we, were, what, when, which, who, will, with, words, would, write, you, your, 第2组（单词101-200）, after, again, air, also, America, animal, another, answer, any, around, ask, away, back, because, before, big, boy, came, change, different, does, end, even, follow, form, found, give, good, great, hand, help, here, home, house, just, kind, know, land, large, learn, letter, line, little, live, man, me, means, men, most, mother, move, much, must, name, need, new, off, old, only, our, over, page, picture, place, play, point, put, read, right, same, say, sentence, set, should, show, small, sound, spell, still, study, such, take, tell, things, think, three, through, too, try, turn, us, very, want, well, went, where, why, work, world, years, 第3组（单词201-300）, above, add, almost, along, always, began, begin, being, below, between, book, both, car, carry, children, city, close, country, cut, don't, earth, eat, enough, every, example, eyes, face, family, far, father, feet, few, food, four, girl, got, group, grow, hard, head, hear, high, idea, important, Indian, it's, keep, last, late, leave, left, let, life, light, list, might, mile, miss, mountains, near, never, next, night, often, once, open, own, paper, plant, real, river, run, saw, school, sea, second, seem, side, something, sometimes, song, soon, start, state, stop, story, talk, those, thought, together, took, tree, under, until, walk, watch, while, white, without, young, 第4组（单词301-400）, across, against, area, become, best, better, birds, black, body, certain, cold, color, complete, covered, cried, didn't, dog, door, draw, during, early, easy, ever, fall, farm, fast, field, figure, fire, fish, five, friends, ground, happened, heard, himself, hold, horse, hours, however, hundred, I'll, king, knew, listen, low, map, mark, measure, money, morning, music, north, notice, numeral, order, passed, pattern, piece, plan, problem, products, pulled, questions, reached, red, remember, rock, room, seen, several, ship, short, since, sing, slowly, south, space, stand, step, sun, sure, table, today, told, top, toward, town, travel, unit, upon, usually, voice, vowel, war, waves, whole, wind, wood, 第5组（单词401-500）, able, ago, among, ball, base, became, behind, boat, box, bread, bring, brought, building, built, cannot, carefully, check, circle, class, clear, common, contain, correct, course, dark, decided, deep, done, dry, English, equation, explain, fact, feel, filled, finally, fine, fly, force, front, full, game, gave, government, green, half, heat, heavy, hot, inches, include, inside, island, known, language, less, machine, material, minutes, note, nothing, noun, object, ocean, oh, pair, person, plane, power, produce, quickly, ran, rest, road, round, rule, scientists, shape, shown, six, size, special, stars, stay, stood, street, strong, surface, system, ten, though, thousands, understand, verb, wait, warm, week, wheels, yes, yet, 第6组（单词501-600）, anything, arms, beautiful, believe, beside, bill, blue, brother, can't, cause, cells, center, clothes, dance, describe, developed, difference, direction, discovered, distance, divided, drive, drop, edge, eggs, energy, Europe, exercise, farmers, felt, finished, flowers, forest, general, gone, grass, happy, heart, held, instruments, interest, job, kept, lay, legs, length, love, main, matter, meet, members, million, mind, months, moon, paint, paragraph, past, perhaps, picked, present, probably, race, rain, raised, ready, reason, record, region, represent, return, root, sat, shall, sign, simple, site, sky, soft, square, store, subject, suddenly, sum, summer, syllables, teacher, test, third, train, wall, weather, west, whether, wide, wild, window, winter, wish, written, 第7组（单词601-700）, act, Africa, age, already, although, amount, angle, appear, baby, bear, beat, bed, bottom, bright, broken, build, buy, care, case, cat, century, consonant, copy, couldn't, count, cross, dictionary, died, dress, either, everyone, everything, exactly, factors, fight, fingers, floor, fraction, free, French, gold, hair, hill, hole, hope, ice, instead, iron, jumped, killed, lake, laughed, lead, let's, lot, melody, metal, method, middle, milk, moment, nation, natural, outside, per, phrase, poor, possible, pounds, pushed, quiet, quite, remain, result, ride, rolled, sail, scale, section, sleep, smiled, snow, soil, solve, someone, son, speak, speed, spring, stone, surprise, tall, temperature, themselves, tiny, trip, type, village, within, wonder, 第8组（单词701-800）, alone, art, bad, bank, bit, break, brown, burning, business, captain, catch, caught, cents, child, choose, clean, climbed, cloud, coast, continued, control, cool, cost, decimal, desert, design, direct, drawing, ears, east, else, engine, England, equal, experiment, express, feeling, fell, flow, foot, garden, gas, glass, God, grew, history, human, hunting, increase, information, itself, joined, key, lady, law, least, lost, maybe, mouth, party, pay, period, plains, please, practice, president, received, report, ring, rise, row, save, seeds, sent, separate, serve, shouted, single, skin, statement, stick, straight, strange, students, suppose, symbols, team, touch, trouble, uncle, valley, visit, wear, whose, wire, woman, wrote, yard, you're, yourself, 第9组（单词801-900）, addition, army, bell, belong, block, blood, blow, board, bones, branches, cattle, chief, compare, compound, consider, cook, corner, crops, crowd, current, doctor, dollars, eight, electric, elements, enjoy, entered, except, exciting, expect, famous, fit, flat, fruit, fun, guess, hat, hit, indicate, industry, insects, interesting, Japanese, lie, lifted, loud, major, mall, meat, mine, modern, movement, necessary, observe, park, particular, planets, poem, pole, position, process, property, provide, rather, rhythm, rich, safe, sand, science, sell, send, sense, seven, sharp, shoulder, sight, silent, soldiers, spot, spread, stream, string, suggested, supply, swim, terms, thick, thin, thus, tied, tone, trade, tube, value, wash, wasn't, weight, wife, wings, won't, 第10组（单词901-1000）, action, actually, adjective, afraid, agreed, ahead, allow, apple, arrived, born, bought, British, capital, chance, chart, church, column, company, conditions, corn, cotton, cows, create, dead, deal, death, details, determine, difficult, division, doesn't, effect, entire, especially, evening, experience, factories, fair, fear, fig, forward, France, fresh, Greek, gun, hoe, huge, isn't, led, level, located, march, match, molecules, northern, nose, office, opposite, oxygen, plural, prepared, pretty, printed, radio, repeated, rope, rose, score, seat, settled, shoes, shop, similar, sir, sister, smell, solution, southern, steel, stretched, substances, suffix, sugar, tools, total, track, triangle, truck, underline, various, view, Washington, we'll, western, win, women, workers, wouldn't, wrong, yellow`;

export const WORD_GROUPS: WordGroup[] = (() => {
  // Split by the group header format
  const parts = RAW_DATA.split(/(第\d+组（单词\d+-\d+）)/).filter(p => p.trim().length > 0);
  
  const groups: WordGroup[] = [];
  
  for (let i = 0; i < parts.length; i += 2) {
    const header = parts[i];
    const content = parts[i+1];
    
    if (header && content) {
      // Extract level number from header
      const levelMatch = header.match(/第(\d+)组/);
      const level = levelMatch ? parseInt(levelMatch[1], 10) : i / 2 + 1;
      
      // Clean and split words
      const words = content
        .split(',')
        .map(w => w.trim())
        .filter(w => w.length > 0);
        
      groups.push({
        level,
        label: header.replace(/,$/, '').trim(), // Remove trailing comma from header if split weirdly
        words
      });
    }
  }
  
  return groups;
})();

const RAW_SCHOOL_DATA = `三年级上册, 单词, a / an, afternoon, all, and, apple, are, baby, bag, banana, black, blue, book, boy, brother, cat, color, come, crayon, dance, dog, duck, eight, egg, father, fine, fish, five, four, girl, give, go, good, goodbye, grandma, grandpa, great, green, happy, he, hello, hen, hi, how many, how old, How are you?, I'm (I am), ice cream, idea, is, it, jacket, kite, let's (let us), light, lion, look, May, me, meet, Miss, monkey, morning, mother, Mr., my, name, new, nice, nine, no, noodle, now, number, OK, one, orange, party, pen, pencil, pencil-box, phone, pig, pink, play, please, queen, rabbit, red, right, ruler, seven, she, sing, sister, six, star, stop, sure, teacher, ten, thank, the, they, this, three, too, two, umbrella, use, violin, what, white, who, window, X-ray, yellow, year, you, your, zoo, 三年级下册, 单词, arm, beautiful, big, bike, bird, birthday, boat, buy, cake, can, can't (cannot), card, child, Children's Day, clock, day, don't (do not), draw, early, ear, eleven, eye, face, fly, football, foot (复数 feet), for you, fun, grape, hamburger, hand, hat, head, here, home, honey, jump, kid, late, leg, like, London, many, mom, mouth, nose, o'clock, park, play football, present, pupil, put on, ready, rice, ride, run, shirt, shoe, skate, skirt, small, so, so many, sorry, sports, sports shoes, story, sweater, sweet, swim, T-shirt, then, time, too, touch, twelve, want, wear, what about, whose, yes, 四年级上册, 单词, after, again, age, at, basketball, bed, beef, begin, big, blackboard, bread, breakfast, bus, car, chair, Chinese, Christmas, class, classroom, clever, collect, computer, cow, cousin, daily, dance, dear, desk, dinner, do, dumpling, eighteen, email, fair, family, farm, festival, fifteen, fifty, forty, fourteen, friend, from, full, get, get into, get up, go to bed, go to school, grade, have, have a sleep, hobby, horse, how much, interesting, isn't, lantern, learn, library, look, look at, lunch, make, merry, Mid-Autumn Festival, milk, money, mooncake, music, new, nineteen, often, our, ping-pong, playground, potato, read, robot, room, say, school, see, sheep, sing, sleep, slow, some, sometimes, spend, spring, Spring Festival, stamp, student, talk, that, their, them, there, thirteen, thirty, tiger, to, tomato, tree, TV, twenty, vegetable, very, watch, watch TV, we, welcome, when, winner, 四年级下册, 单词, all right, art, aunt, autumn, basketball, Big Ben, bright, but, by car, chicken, Chinese, clean, close, cloudy, coat, cold, cool, door, eighty, English, every, fan, favorite, flag, Friday, fruit, help, homework, hot, hundred, interesting, juice, kitchen, long, math, meeting, Monday, Ms., music, national, national flag, need, ninety, often, on foot, PE, place, plane, rain, raise, Saturday, science, season, seventy, ship, shopping list, sixty, snow, stand, summer, Sunday, sunny, supermarket, take, tea, Teddy Bear, the Great Wall, the UK, these, Thursday, today, toy, train, Tuesday, turn off, vacation, visit, warm, weather, Wednesday, week, Well done!, will, windy, winter, with, wonderful, work, worry, 五年级上册, 单词, about, afraid, April, August, Australia, behind, beside, bus stop, call, chess, cinema, city, classmate, come on, cook, December, easy, Excuse me, far away, February, film, find, flower, get to, glasses, go straight, hair, holiday, hospital, Internet, January, July, June, kind, know, left, long, lovely, man, March, May, minute, mobile, month, museum, National Day, near, nearby, November, October, on my way, or, page, panda, paper, photo, picture, play chess, player, pupil, put on, remember, right, see, September, short, sit down, sitting room, smile, sorry, speak, station, tall, taxi, Teachers' Day, tell, the USA, there, thing, time, tomorrow, turn, turn on, understand, uncle, wait, way, welcome, where, won't, word, write, young, You're welcome, 五年级下册, 单词, also, angry, animal, any, before, bridge, brown, busy, calendar, camera, China, cheer up, climb, cloud, color, date, difficult, did, drink, Easter, Easter Bunny, elephant, fall down, fast, first, floor, fourth, garden, get on, got, grandfather, grandmother, grass, guess, hide, high jump, hill, hometown, hungry, ate, living room, long jump, look for, lucky, map, meter, mountain, Mrs., neighbor, next to, only, over there, parent, people, pick up, proud, program, race, ran, really, river, sad, saw, second, shout, sky, spring outing, Sports Day, swam, the, third, tired, top, tour, took, try, twelfth, fifteenth, under, was, water, well, were, went, would, building, thirsty, Sun Moon Lake, lake, walk, washing machine, water, Winter Olympics, woman (women), world, yourselves, 六年级上册, 单词, a piece of cake, always, American, answer, any, bad, ball, basket, began (begin的过去式), bedroom, better, between, body, boring, box, bring, cap, candy, catch, cheer, clothes, corn, cry, daughter, delicious, dirty, dream, dress, earth, evening, exercise, fan, floor, food, game, get to school, go around, go shopping, half, healthy, help yourselves, hold, hope, hour, housework, invite, its, join, keep, last, last night, little, luck, menu, Mid-Autumn Festival, moon, often, Olympic Games, pair, pass, past, plant, problem, real, ring, salad, seat, shine, shorts, slogan, sock, sometimes, son, something, soup, strong, Summer Olympics, sun, take place, team, teeth (单 tooth), their, think, those, Thanksgiving, together, toilet, trousers, try it on, usually, walk, washing machine, water, Winter Olympics, woman (复 women), world, yourselves, 六年级下册, 单词, a lot of, address, along, anywhere, bottle, break, carry, chemistry, cook, cross, dancer, dining room, doctor, driver, Edison, famous, farmer, feel, fever, gave, go back, grow, have a cold, headache, heavy, hear, history, hope, ill, information, inventor, job, kind, kiss, lab, learn, leave, light, love, made, medicine, middle school, miss, must, mustn't, nurse, open, physics, police officer, restaurant, scientist, show, singer, soon, street, study, subject, surprise, teacher's office, thin, toothache, travel, true, the Yangtze River, worker, wrong, fat, geography, information, gave, leave`;

export const SCHOOL_GROUPS: WordGroup[] = (() => {
  // Split by the grade format "X年级X册, 单词,"
  // We use a regex that matches the header
  const rawParts = RAW_SCHOOL_DATA.split(/([一二三四五六]年级[上下]册, 单词,)/).filter(p => p.trim().length > 0);
  
  const groups: WordGroup[] = [];
  let idCounter = 1;

  for (let i = 0; i < rawParts.length; i += 2) {
    const header = rawParts[i];
    const content = rawParts[i+1];
    
    if (header && content) {
      // Clean and split words
      const words = content
        .split(',')
        .map(w => {
          let clean = w.trim();
          // Remove comments like (let us) or (复数 feet)
          clean = clean.replace(/\s*\(.*?\)/g, '');
          // Handle "a / an" -> "a" (simplification for checking)
          if (clean.includes('/')) {
             return clean.split('/')[0].trim();
          }
          return clean;
        })
        .filter(w => w.length > 0);
      
      // Clean up header for label: "三年级上册, 单词," -> "三年级上册"
      const label = header.replace(/, 单词,$/, '').trim();

      groups.push({
        level: idCounter++,
        label: label,
        words
      });
    }
  }
  
  return groups;
})();