export const translateToPortuguese = (text: string): string => {
  const esDictionary: Record<string, string> = {
    "hola": "olá", "gracias": "obrigado", "por": "por", "favor": "favor",
    "lo": "o", "los": "os", "la": "a", "las": "as", "un": "um", "una": "uma",
    "yo": "eu", "tu": "você", "él": "ele", "ella": "ela", "nosotros": "nós",
    "ellos": "eles", "ellas": "elas", "usted": "você", "ustedes": "vocês",
    "soy": "sou", "eres": "é", "es": "é", "somos": "somos", "son": "são",
    "estoy": "estou", "estás": "está", "estamos": "estamos", "están": "estão",
    "tengo": "tenho", "tienes": "tem", "tiene": "tem", "tenemos": "temos", "tienen": "têm",
    "quiero": "quero", "puedo": "posso", "hacer": "fazer", "ir": "ir", "ver": "ver",
    "pero": "mas", "y": "e", "o": "ou", "si": "se", "cuando": "quando", "donde": "onde",
    "como": "como", "cómo": "como", "que": "que", "qué": "que",
    "porque": "porque", "muy": "muito", "mucho": "muito",
    "bueno": "bom", "malo": "mau", "grande": "grande", "pequeño": "pequeno",
    "ahora": "agora", "siempre": "sempre", "nunca": "nunca", "hoy": "hoje",
    "mañana": "amanhã", "ayer": "ontem", "bien": "bem", "mal": "mal",
    "a": "a", "de": "de", "con": "com", "en": "em", "para": "para",
    "juego": "jogo", "jugamos": "jugamos", "jugar": "jogar", "jugando": "jugando",
    "hablar": "falar", "hablo": "falo", "hablas": "fala", "habla": "fala",
    "comer": "comer", "comes": "come",
    "apellido": "sobrenome", "vaso": "copo", "copa": "taça", "taller": "oficina",
    "oficina": "escritório", "exquisito": "delicioso", "raro": "estranho",
    "embarazada": "grávida", "escritorio": "escrivaninha", "cena": "jantar"
  };

  const rules: Array<[RegExp, string]> = [
    [/ñ/g, "nh"], [/ll(?=[aeiou])/g, "lh"], [/ll/g, "ch"], [/ue(?=[a-z]{2,})/g, "o"],
    [/ie(?=[a-z]{2,})/g, "e"], [/ción\b/g, "ção"], [/ciones\b/g, "ções"],
    [/dad\b/g, "dade"], [/mente\b/g, "mente"], [/h(?=[aeiou])/g, ""]
  ];

  const words = (text || "").toLowerCase().split(/\s+/);
  const mappedWords = words.map(word => {
    const startPunct = word.match(/^[¿¡"']+/)?.[0] || "";
    const endPunct = word.match(/[.,!?;:"']+$/)?.[0] || "";
    const clean = word.replace(/^[¿¡"']+/, "").replace(/[.,!?;:"']+$/, "");
    let match = esDictionary[clean];
    if (!match) {
      for (const key in esDictionary) {
        if (clean.startsWith(key)) {
          const rest = clean.slice(key.length);
          const lastChar = key.slice(-1);
          if (rest.length > 0 && rest.split('').every(c => c === lastChar)) {
            const translation = esDictionary[key];
            const lastTransChar = translation.slice(-1);
            match = translation + lastTransChar.repeat(rest.length);
            break;
          }
        }
      }
    }
    if (!match) {
      let w = clean;
      rules.forEach(([regex, replacement]) => { w = w.replace(regex, replacement); });
      match = w;
    }
    return startPunct + match + endPunct;
  });

  return mappedWords.join(" ");
};
