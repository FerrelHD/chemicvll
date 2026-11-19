const BRAND_DOMAIN_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  // Entertainment & Streaming
  [/\bnetflix\b/i, 'netflix.com'],
  [/\bspotify\b/i, 'spotify.com'],
  [/\byoutube\b|\byt\s*premium\b|\byt\s*music\b/i, 'youtube.com'],
  [/\bdisney\b/i, 'disneyplus.com'],
  [/\bvidio\b/i, 'vidio.com'],
  [/\bwetv\b/i, 'wetv.vip'],
  [/\bviu\b/i, 'viu.com'],
  [/\bprime\s*video\b|\bamazon\s*prime\b/i, 'primevideo.com'],
  [/\bhbo\b|\bmax\b/i, 'max.com'],
  [/\bcrunchyroll\b/i, 'crunchyroll.com'],
  [/\btwitch\b/i, 'twitch.tv'],
  [/\biqiyi\b/i, 'iq.com'],
  [/\bbilibili\b/i, 'bilibili.tv'],

  // AI & Dev Tools
  [/\bchatgpt\b|\bopenai\b/i, 'chatgpt.com'],
  [/\bclaude\b|\banthropic\b/i, 'claude.ai'],
  [/\bcursor\b/i, 'cursor.com'],
  [/\bperplexity\b/i, 'perplexity.ai'],
  [/\bgemini\b/i, 'gemini.google.com'],
  [/\bmidjourney\b/i, 'midjourney.com'],
  [/\bgithub\b/i, 'github.com'],
  [/\bgitlab\b/i, 'gitlab.com'],
  [/\bvercel\b/i, 'vercel.com'],
  [/\bnetlify\b/i, 'netlify.com'],
  [/\bsupabase\b/i, 'supabase.com'],
  [/\bfirebase\b/i, 'firebase.google.com'],
  [/\bcloudflare\b/i, 'cloudflare.com'],
  [/\brailway\b/i, 'railway.app'],
  [/\bdigitalocean\b/i, 'digitalocean.com'],
  [/\baws\b|\bamazon\s*web\b/i, 'aws.amazon.com'],

  // Design & Productivity
  [/\bfigma\b/i, 'figma.com'],
  [/\bnotion\b/i, 'notion.so'],
  [/\blinear\b/i, 'linear.app'],
  [/\bcanva\b/i, 'canva.com'],
  [/\badobe\b|\bcreative\s*cloud\b|\bphotoshop\b|\blightroom\b/i, 'adobe.com'],
  [/\bslack\b/i, 'slack.com'],
  [/\bdiscord\b/i, 'discord.com'],
  [/\bzoom\b/i, 'zoom.us'],
  [/\bgrammarly\b/i, 'grammarly.com'],
  [/\bduolingo\b/i, 'duolingo.com'],
  [/\bmedium\b/i, 'medium.com'],
  [/\bsubstack\b/i, 'substack.com'],
  [/\b1password\b/i, '1password.com'],
  [/\bbitwarden\b/i, 'bitwarden.com'],
  [/\braycast\b/i, 'raycast.com'],
  [/\bobsidian\b/i, 'obsidian.md'],
  [/\btodoist\b/i, 'todoist.com'],
  [/\bdropbox\b/i, 'dropbox.com'],
  [/\bmicrosoft\b|\boffice\s*365\b|\bonedrive\b/i, 'microsoft.com'],

  // Cloud, Ecosystem & Gaming
  [/\bicloud\b|\bapple\b/i, 'apple.com'],
  [/\bgoogle\s*one\b/i, 'one.google.com'],
  [/\bgoogle\b/i, 'google.com'],
  [/\bplaystation\b|\bps\s*plus\b/i, 'playstation.com'],
  [/\bxbox\b/i, 'xbox.com'],
  [/\bnintendo\b/i, 'nintendo.com'],
  [/\bsteam\b/i, 'steampowered.com'],

  // Social & Comms
  [/\blinkedin\b/i, 'linkedin.com'],
  [/\btelegram\b/i, 'telegram.org'],
  [/\btwitter\b|\bx\s*premium\b/i, 'x.com'],
  [/\bwhatsapp\b/i, 'whatsapp.com'],

  // Indonesian ISP, Telco & Local Services
  [/\bbiznet\b/i, 'biznetnetworks.com'],
  [/\bindihome\b/i, 'indihome.co.id'],
  [/\bmyrepublic\b/i, 'myrepublic.co.id'],
  [/\bfirst\s*media\b/i, 'firstmedia.com'],
  [/\biconnet\b/i, 'iconnet.id'],
  [/\bstarlink\b/i, 'starlink.com'],
  [/\btelkomsel\b/i, 'telkomsel.com'],
  [/\bby\.?u\b/i, 'byu.id'],
  [/\bxl\b|\bxl\s*prioritas\b/i, 'xl.co.id'],
  [/\bindosat\b|\bim3\b/i, 'im3.id'],
  [/\bsmartfren\b/i, 'smartfren.com'],
  [/\bgrab\b/i, 'grab.com'],
  [/\bgojek\b|\bgoplus\b/i, 'gojek.com'],
  [/\bshopee\b/i, 'shopee.co.id'],
  [/\btokopedia\b/i, 'tokopedia.com'],
];

const EXPLICIT_DOMAIN_REGEX =
  /\b([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,})\b/i;

export function resolveSubscriptionBrandDomain(serviceName: string): string | null {
  const trimmed = serviceName.trim();
  if (!trimmed) return null;

  for (const [pattern, domain] of BRAND_DOMAIN_PATTERNS) {
    if (pattern.test(trimmed)) return domain;
  }

  const domainMatch = EXPLICIT_DOMAIN_REGEX.exec(trimmed);
  if (domainMatch) {
    return domainMatch[1].toLowerCase();
  }

  return null;
}

export function getSubscriptionIconUrl(serviceName: string, size: number = 64): string | null {
  const domain = resolveSubscriptionBrandDomain(serviceName);
  if (!domain) return null;
  const safeSize = Math.min(128, Math.max(16, Math.round(size)));
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${safeSize}`;
}
