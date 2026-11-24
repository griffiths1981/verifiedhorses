export type Guide = { slug: string; title: string; summary: string; paragraphs: string[] };

export const GUIDES: Guide[] = [
  {
    slug: "buying-safely",
    title: "How to buy a horse safely",
    summary: "A short list before you send any money.",
    paragraphs: [
      "Start with the video, then go and see the horse. Ask to see it walked, trotted and, if it is ridden, ridden. Take someone with you if you can.",
      "Use a vet you choose, not only the paperwork already on the advert. A five-stage vetting is the fuller check. A two-stage vetting is a more limited look. Ask the vet which one fits the price and the job you want the horse to do.",
      "The contract is between you and the seller. VerifiedHorses does not hold the money and does not inspect the horse.",
      "If the seller pushes you to pay a deposit before a viewing, or to leave this site for the first conversation, stop and report the advert.",
    ],
  },
  {
    slug: "vetting",
    title: "What a vetting is",
    summary: "Two-stage and five-stage, in plain English.",
    paragraphs: [
      "A vetting is an examination by a veterinary surgeon. It is not a guarantee that a horse will stay sound, and it is not something this website carries out.",
      "A two-stage vetting is usually a look at the horse stood still and then trotted up. A five-stage vetting adds a more thorough examination, often including flexion tests and watching the horse work. Your vet will explain what they are and are not checking.",
      "Prices vary by practice and by the horse. Ask for a quote. On an advert, a date next to “vetting report” only means the seller says a report exists from that day.",
    ],
  },
  {
    slug: "scams",
    title: "Horse-sale scams",
    summary: "The patterns we flag, and what you should do.",
    paragraphs: [
      "Common patterns are a horse that seems cheap, a seller who will not let you visit, a request for a deposit by bank transfer, and a story about a shipping agent or a relative who will deliver the horse.",
      "Keep the first messages on VerifiedHorses. We hide phone numbers and email addresses in a buyer's first message, and we flag phrases such as “send a deposit” and “WhatsApp”.",
      "A verified badge means an identity check was completed with our provider. It does not mean the horse is honest, sound, or even real. Go and see it.",
    ],
  },
  {
    slug: "passports",
    title: "Passports and microchips",
    summary: "What sellers in the UK are expected to have.",
    paragraphs: [
      "Horses, ponies and donkeys in Great Britain are generally required to have a passport and to be microchipped. The rules sit with the government and the passport issuing organisations, and they change, so check the current guidance before you buy or sell.",
      "A seller on VerifiedHorses can add the passport and microchip as documents, with a date. You should still match the microchip to the horse yourself.",
      "Do not type a full passport number into a message if you can avoid it. The advert can say that the passport is on file.",
    ],
  },
  {
    slug: "keeping-a-horse",
    title: "The cost of keeping a horse",
    summary: "Why the advert price is the small part.",
    paragraphs: [
      "The price on an advert is not the cost of having a horse. Livery, feed, forage, the farrier, the dentist, insurance and the vet all carry on after the sale.",
      "Those costs vary hugely between a field and a full livery yard, and between parts of the country. Get local figures rather than a national average from a website.",
      "If you are buying your first horse, talk to a yard and a vet before you fall for a video.",
    ],
  },
];
