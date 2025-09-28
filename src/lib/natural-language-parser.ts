export interface ParsedIngredient {
  name: string;
  percentage: number;
}

export interface ParseResult {
  ingredients: ParsedIngredient[];
  isValid: boolean;
  error?: string;
}

/**
 * Converts spoken numbers to numeric values
 * Handles: "ten" -> 10, "twenty" -> 20, "fifteen" -> 15, etc.
 */
function parseSpokenNumber(text: string): number | null {
  const numberMap: Record<string, number> = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
    'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
    'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
    'eighty': 80, 'ninety': 90, 'hundred': 100
  };

  const lowerText = text.toLowerCase().trim();
  
  // Direct match
  if (numberMap[lowerText] !== undefined) {
    return numberMap[lowerText];
  }

  // Handle compound numbers like "twenty five" -> 25
  const words = lowerText.split(/\s+/);
  if (words.length === 2) {
    const first = numberMap[words[0]];
    const second = numberMap[words[1]];
    if (first !== undefined && second !== undefined && first >= 20 && first % 10 === 0) {
      return first + second;
    }
  }

  return null;
}

/**
 * Parses natural language glaze ingredient entries
 * Supports formats like:
 * - "10 china clay 20 potash feldspar 10 Iron Oxide 15 Calcium Carbonate"
 * - "China clay 10 Potash Feldspar 20 Iron Oxide 10 Calcium Carbonate 15"
 * - "ten china clay twenty potash feldspar fifteen Iron Oxide"
 */
export function parseGlazeIngredients(input: string): ParseResult {
  if (!input || input.trim().length === 0) {
    return {
      ingredients: [],
      isValid: false,
      error: 'Input cannot be empty'
    };
  }

  const cleanInput = input.trim();
  const ingredients: ParsedIngredient[] = [];
  
  try {
    // Split by common separators and clean up
    const tokens = cleanInput
      .split(/[\s,]+/)
      .filter(token => token.length > 0)
      .map(token => token.trim());

    if (tokens.length === 0) {
      return {
        ingredients: [],
        isValid: false,
        error: 'No valid tokens found'
      };
    }

    // Try to parse the input
    const parsed = parseTokens(tokens);
    
    if (parsed.length === 0) {
      return {
        ingredients: [],
        isValid: false,
        error: 'No valid ingredient pairs found. Use format like "10 china clay 20 potash feldspar" or "china clay 10 potash feldspar 20"'
      };
    }

    // Validate percentages sum to reasonable range (not required to be exactly 100%)
    const totalPercentage = parsed.reduce((sum, ing) => sum + ing.percentage, 0);
    
    if (totalPercentage > 200) {
      return {
        ingredients: parsed,
        isValid: false,
        error: `Total percentage (${totalPercentage.toFixed(1)}%) seems too high. Please check your values.`
      };
    }

    return {
      ingredients: parsed,
      isValid: true
    };

  } catch (error) {
    return {
      ingredients: [],
      isValid: false,
      error: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

function parseTokens(tokens: string[]): ParsedIngredient[] {
  const ingredients: ParsedIngredient[] = [];
  let i = 0;

  while (i < tokens.length) {
    const currentToken = tokens[i];
    const nextToken = tokens[i + 1];

    // Check if current token is a number (numeric or spoken)
    const currentNumber = parseFloat(currentToken);
    const currentSpokenNumber = parseSpokenNumber(currentToken);
    const nextNumber = nextToken ? parseFloat(nextToken) : NaN;
    const nextSpokenNumber = nextToken ? parseSpokenNumber(nextToken) : null;

    // Use numeric value if available, otherwise use spoken number
    const currentValue = !isNaN(currentNumber) ? currentNumber : currentSpokenNumber;
    const nextValue = !isNaN(nextNumber) ? nextNumber : nextSpokenNumber;

    if (currentValue !== null) {
      // Format: "10 china clay" or "ten china clay"
      const ingredientName = extractIngredientName(tokens, i + 1);
      if (ingredientName) {
        ingredients.push({
          name: ingredientName,
          percentage: currentValue
        });
        i += ingredientName.split(' ').length + 1;
      } else {
        i++;
      }
    } else if (nextValue !== null) {
      // Format: "china clay 10" or "china clay ten"
      const ingredientName = currentToken;
      ingredients.push({
        name: ingredientName,
        percentage: nextValue
      });
      i += 2;
    } else {
      // Try to find a number in the next few tokens
      let found = false;
      for (let j = i + 1; j < Math.min(i + 4, tokens.length); j++) {
        const num = parseFloat(tokens[j]);
        const spokenNum = parseSpokenNumber(tokens[j]);
        const value = !isNaN(num) ? num : spokenNum;
        
        if (value !== null) {
          const ingredientName = tokens.slice(i, j).join(' ');
          ingredients.push({
            name: ingredientName,
            percentage: value
          });
          i = j + 1;
          found = true;
          break;
        }
      }
      if (!found) {
        i++;
      }
    }
  }

  return ingredients;
}

function extractIngredientName(tokens: string[], startIndex: number): string | null {
  const words: string[] = [];
  let i = startIndex;

  // Collect words until we hit a number or end of tokens
  while (i < tokens.length) {
    const token = tokens[i];
    const num = parseFloat(token);
    
    if (!isNaN(num)) {
      break;
    }
    
    words.push(token);
    i++;
  }

  return words.length > 0 ? words.join(' ') : null;
}

/**
 * Normalizes ingredient names for better matching
 * Handles common variations and capitalization
 */
export function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b(oxide|oxides)\b/g, 'oxide')
    .replace(/\b(carbonate|carbonates)\b/g, 'carbonate')
    .replace(/\b(feldspar|feldspars)\b/g, 'feldspar')
    .replace(/\b(clay|clays)\b/g, 'clay');
}

/**
 * Suggests corrections for ingredient names based on common glaze materials
 */
export function suggestIngredientName(input: string): string {
  const normalized = normalizeIngredientName(input);
  
  // Common glaze material mappings
  const mappings: Record<string, string> = {
    'china clay': 'China Clay',
    'kaolin': 'China Clay',
    'ball clay': 'Ball Clay',
    'potash feldspar': 'Potash Feldspar',
    'k feldspar': 'Potash Feldspar',
    'soda feldspar': 'Soda Feldspar',
    'na feldspar': 'Soda Feldspar',
    'iron oxide': 'Iron Oxide',
    'red iron oxide': 'Iron Oxide',
    'fe2o3': 'Iron Oxide',
    'calcium carbonate': 'Calcium Carbonate',
    'whiting': 'Calcium Carbonate',
    'caco3': 'Calcium Carbonate',
    'silica': 'Silica',
    'quartz': 'Silica',
    'sio2': 'Silica',
    'alumina': 'Alumina',
    'al2o3': 'Alumina',
    'zinc oxide': 'Zinc Oxide',
    'zno': 'Zinc Oxide',
    'titanium dioxide': 'Titanium Dioxide',
    'tio2': 'Titanium Dioxide',
    'rutile': 'Titanium Dioxide',
    'tin oxide': 'Tin Oxide',
    'sno2': 'Tin Oxide',
    'copper carbonate': 'Copper Carbonate',
    'cobalt carbonate': 'Cobalt Carbonate',
    'chrome oxide': 'Chrome Oxide',
    'cr2o3': 'Chrome Oxide',
    'manganese dioxide': 'Manganese Dioxide',
    'mno2': 'Manganese Dioxide',
    'nickel oxide': 'Nickel Oxide',
    'nio': 'Nickel Oxide',
    'vanadium pentoxide': 'Vanadium Pentoxide',
    'v2o5': 'Vanadium Pentoxide',
  };

  return mappings[normalized] || input;
}
