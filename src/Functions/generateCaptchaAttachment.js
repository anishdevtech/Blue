const { AttachmentBuilder } = require('discord.js');
const fetch = require('node-fetch');

/**
 * Returns an attachment containing a CAPTCHA image generated from given text.
 */
async function generateCaptchaAttachment(text, options = {}) {
  const payload = {
    text: text,
    difficulty: options.difficulty ?? 1,
    width: options.width ?? 400,
    height: options.height ?? 100
  };

  const response = await fetch('https://api.opencaptcha.io/captcha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`CAPTCHA API error: ${response.status}`);
  }

  const buffer = await response.buffer();
  return new AttachmentBuilder(buffer, { name: 'captcha.jpg' });
}