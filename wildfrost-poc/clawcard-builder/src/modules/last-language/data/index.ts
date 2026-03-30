import type { LLCard, LLWord } from '../types'

export const CARDS: LLCard[] = [
  {
    id: 'szept', name: 'Szept', cost: 1, type: 'action', keywords: [],
    baseEffect: { damage: 4, targetType: 'single', silentToHiveMind: true },
    exhaustOnPlay: false, flavorText: 'Pierwsze słowo jest zawsze najcichsze.', art: '', faction: 'niemowi',
  },
  {
    id: 'zlamane-zdanie', name: 'Złamane Zdanie', cost: 0, type: 'action', keywords: [],
    baseEffect: { damage: 2, targetType: 'single' },
    exhaustOnPlay: false, flavorText: 'Złamane zdanie mówi więcej niż całe.', art: '', faction: 'gawedziarze',
  },
  {
    id: 'krok-miedzy', name: 'Krok Między', cost: 1, type: 'action', keywords: [],
    baseEffect: { movePosition: 'back', drawWords: 1, targetType: 'self' },
    exhaustOnPlay: false, flavorText: 'Być między słowami to bezpieczniejsze niż być w środku zdania.', art: '', faction: 'niemowi',
  },
  {
    id: 'glos-otchlani', name: 'Głos Otchłani', cost: 2, type: 'action', keywords: [],
    baseEffect: { damage: 0, applyKeywords: [{ type: 'frost', stacks: 2 }, { type: 'poison', stacks: 2 }], targetType: 'all' },
    exhaustOnPlay: false, flavorText: 'Otchłań nie zabija. Ona czeka.', art: '', faction: 'echoludzie',
  },
  {
    id: 'rozdarcie-jezyka', name: 'Rozdarcie Języka', cost: 2, type: 'action', keywords: [],
    baseEffect: { damage: 7, targetType: 'single' },
    exhaustOnPlay: false, flavorText: 'Mówienie prawdy zawsze coś kosztuje.', art: '', faction: 'gawedziarze',
  },
  {
    id: 'przemilczenie', name: 'Przemilczenie', cost: 1, type: 'action', keywords: [],
    baseEffect: { targetType: 'single' },
    exhaustOnPlay: false, flavorText: 'Cisza między słowami to też język.', art: '', faction: 'niemowi',
  },
  {
    id: 'inwokacja', name: 'Inwokacja', cost: 3, type: 'action', keywords: [],
    baseEffect: { drawWords: 3, targetType: 'self' },
    exhaustOnPlay: false, flavorText: 'Można przywołać trzy słowa. Jedno zawsze ucieka.', art: '', faction: 'echoludzie',
  },
]

export const WORDS: LLWord[] = [
  { id: 'slowo-mrozu', name: 'Lodowe Słowo', keyword: { type: 'frost', stacks: 3 }, dialect: 'niemowi', flavorText: 'Mróz mówi wolniej niż ogień, ale mówi na zawsze.' },
  { id: 'slowo-trucizny', name: 'Zepsute Słowo', keyword: { type: 'poison', stacks: 3 }, dialect: 'gawedziarze', flavorText: 'Słowo raz wypowiedziane nigdy nie jest zdrowe.' },
  { id: 'slowo-tarczy', name: 'Tarcza Ciszy', keyword: { type: 'block', value: 6 }, dialect: 'niemowi', flavorText: 'Cisza jest najtrwalszym murem.' },
  { id: 'slowo-krwi', name: 'Słowo Krwiopicia', keyword: { type: 'lifesteal', value: 4 }, dialect: 'gawedziarze', flavorText: 'Język pobiera dług w krwi.' },
  { id: 'slowo-pustki', name: 'Słowo Pustki', keyword: { type: 'void' }, dialect: 'echoludzie', flavorText: 'Nie ma powrotu z Pustki.' },
  { id: 'slowo-odwrocenia', name: 'Słowo Odwrócenia', keyword: { type: 'invert' }, dialect: 'gawedziarze', flavorText: 'Wszystko co mówisz wraca odwrócone.' },
  { id: 'slowo-ciszy', name: 'Cisza Doskonała', keyword: { type: 'silence' }, dialect: 'niemowi', flavorText: 'Doskonała cisza nie zostawia śladów.' },
  { id: 'slowo-imienia', name: 'Słowo Imienia', keyword: { type: 'name' }, dialect: 'niemowi', flavorText: 'Poznać imię to zyskać władzę.' },
  { id: 'slowo-oslabia', name: 'Słowo Ciężaru', keyword: { type: 'weaken', value: 4 }, dialect: 'gawedziarze', flavorText: 'Każde słowo może być ciężarem.' },
  { id: 'slowo-echo', name: 'Echo Głosu', keyword: { type: 'echo' }, dialect: 'echoludzie', flavorText: 'Echo nie pyta o pozwolenie.' },
]
