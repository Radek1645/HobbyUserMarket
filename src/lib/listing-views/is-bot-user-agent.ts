const BOT_UA_PATTERN =
  /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|headless|phantom|selenium|wget|curl|python-requests|scrapy|httpclient|monitoring|uptime|pingdom|statuscake/i;

/** Základní filtr crawlerů / preview botů — jejich hit se do statistik nepočítá. */
export function isBotUserAgent(userAgent: string | null): boolean {
  if (!userAgent || userAgent.trim().length === 0) {
    return true;
  }
  return BOT_UA_PATTERN.test(userAgent);
}
