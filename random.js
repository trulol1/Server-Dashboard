const rngMinInput = document.getElementById('rngMin');
const rngMaxInput = document.getElementById('rngMax');
const rngCountInput = document.getElementById('rngCount');
const rngUniqueInput = document.getElementById('rngUnique');
const generateRngBtn = document.getElementById('generateRngBtn');
const copyRngBtn = document.getElementById('copyRngBtn');
const rngResult = document.getElementById('rngResult');
const rngInfo = document.getElementById('rngInfo');

const diceCountInput = document.getElementById('diceCount');
const diceSidesInput = document.getElementById('diceSides');
const diceModifierInput = document.getElementById('diceModifier');
const rollDiceBtn = document.getElementById('rollDiceBtn');
const copyDiceBtn = document.getElementById('copyDiceBtn');
const diceResult = document.getElementById('diceResult');
const diceDetails = document.getElementById('diceDetails');
const dicePresetButtons = document.querySelectorAll('.dice-preset');

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomNumbers() {
  const min = Number(rngMinInput.value);
  const max = Number(rngMaxInput.value);
  const count = Number(rngCountInput.value);
  const unique = rngUniqueInput.checked;

  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    rngResult.textContent = 'Please enter whole numbers for min and max.';
    rngInfo.textContent = '';
    return;
  }

  if (max < min) {
    rngResult.textContent = 'Maximum must be greater than or equal to minimum.';
    rngInfo.textContent = '';
    return;
  }

  if (!Number.isInteger(count) || count < 1 || count > 100) {
    rngResult.textContent = 'How Many must be between 1 and 100.';
    rngInfo.textContent = '';
    return;
  }

  const rangeSize = max - min + 1;
  if (unique && count > rangeSize) {
    rngResult.textContent = `Cannot generate ${count} unique values in range size ${rangeSize}.`;
    rngInfo.textContent = '';
    return;
  }

  const results = [];

  if (unique) {
    const pool = [];
    for (let value = min; value <= max; value++) {
      pool.push(value);
    }

    for (let i = 0; i < count; i++) {
      const index = randomInt(0, pool.length - 1);
      results.push(pool[index]);
      pool.splice(index, 1);
    }
  } else {
    for (let i = 0; i < count; i++) {
      results.push(randomInt(min, max));
    }
  }

  rngResult.textContent = results.join(', ');
  rngInfo.textContent = `Range: ${min} to ${max} • Generated: ${count} • Unique: ${unique ? 'Yes' : 'No'}`;
}

function rollDice() {
  const diceCount = Number(diceCountInput.value);
  const sides = Number(diceSidesInput.value);
  const modifier = Number(diceModifierInput.value || 0);

  if (!Number.isInteger(diceCount) || diceCount < 1 || diceCount > 100) {
    diceResult.textContent = 'Number of dice must be between 1 and 100.';
    diceDetails.textContent = '';
    return;
  }

  if (!Number.isInteger(sides) || sides < 2 || sides > 1000) {
    diceResult.textContent = 'Sides per die must be between 2 and 1000.';
    diceDetails.textContent = '';
    return;
  }

  if (!Number.isFinite(modifier)) {
    diceResult.textContent = 'Modifier must be a valid number.';
    diceDetails.textContent = '';
    return;
  }

  const rolls = [];
  for (let i = 0; i < diceCount; i++) {
    rolls.push(randomInt(1, sides));
  }

  const subtotal = rolls.reduce((sum, value) => sum + value, 0);
  const total = subtotal + modifier;
  const modifierText = modifier === 0 ? '' : modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`;

  diceResult.textContent = `Total: ${total}`;
  diceDetails.textContent = `Rolls: [${rolls.join(', ')}] • Formula: ${diceCount}d${sides}${modifierText}`;
}

async function copyText(text) {
  if (!text || text === '—') return;

  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('Clipboard copy failed:', error);
  }
}

generateRngBtn.addEventListener('click', generateRandomNumbers);
rollDiceBtn.addEventListener('click', rollDice);

copyRngBtn.addEventListener('click', () => {
  const text = rngInfo.textContent ? `${rngResult.textContent}\n${rngInfo.textContent}` : rngResult.textContent;
  copyText(text);
});

copyDiceBtn.addEventListener('click', () => {
  const text = diceDetails.textContent ? `${diceResult.textContent}\n${diceDetails.textContent}` : diceResult.textContent;
  copyText(text);
});

dicePresetButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const sides = button.getAttribute('data-sides');
    diceSidesInput.value = sides;
  });
});

generateRandomNumbers();
rollDice();
