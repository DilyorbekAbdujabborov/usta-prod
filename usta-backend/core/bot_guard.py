"""User-agent based bot/scraper guard for the API.

The Vercel edge WAF only sees traffic that goes through
ustalar-sand.vercel.app. This backend is directly reachable at
ustaback.pythonanywhere.com, so anything relying purely on the edge is
one hostname away from being bypassed - this is the layer that actually
holds, and it runs before any view code.

Deliberately a blocklist, not an allowlist: an allowlist would break the
first user on a browser or webview we did not think of, while a blocklist
only ever costs us the bots we forgot to name. Search engines and social
unfurlers are never on it, so SEO, link previews and sitemap crawling keep
working exactly as before.
"""
import re

from django.http import JsonResponse

# AI training/answer scrapers and commercial SEO-tool crawlers. Blocked on
# every method: they only ever read, and reading is what we don't want them
# doing. Search engines (Googlebot, Bingbot, YandexBot, Applebot, DuckDuckBot,
# PetalBot) and unfurlers (Telegram, WhatsApp, Facebook, Twitter, Slack,
# LinkedIn, Discord) are intentionally absent.
SCRAPER_UA_RE = re.compile(
    r'(?:'
    r'GPTBot|ChatGPT-User|OAI-SearchBot|ClaudeBot|Claude-Web|anthropic-ai|'
    r'PerplexityBot|Perplexity-User|CCBot|Bytespider|Amazonbot|'
    r'meta-externalagent|meta-externalfetcher|FacebookBot|Applebot-Extended|'
    r'Google-Extended|cohere-ai|Diffbot|ImagesiftBot|Omgili|Timpibot|YouBot|'
    r'AI2Bot|Kangaroo\s?Bot|Webzio|ISSCyberRiskCrawler|'
    r'AhrefsBot|SemrushBot|MJ12bot|DotBot|BLEXBot|DataForSeoBot|serpstatbot|'
    r'ZoominfoBot|magpie-crawler|SeekportBot|MegaIndex|LinkpadBot|'
    r'sitecheckerbotcrawler|Barkrowler|SiteAuditBot|SEOkicks|Screaming\s?Frog'
    r')',
    re.I,
)

# Automation frameworks and raw HTTP clients. Blocked on writes only - a
# read from one of these is usually a monitor or someone's curl, but a
# *write* from one is an automated account/order/message being created,
# which is exactly what we're stopping. okhttp is left out on purpose: it
# is the stock Android HTTP stack, and the Play Store build is a TWA.
AUTOMATION_UA_RE = re.compile(
    r'(?:'
    r'HeadlessChrome|PhantomJS|SlimerJS|Puppeteer|Playwright|Selenium|'
    r'WebDriver|CypressIO|python-requests|python-urllib|aiohttp|httpx|'
    r'Scrapy|Go-http-client|Java/|libwww-perl|Apache-HttpClient|'
    r'curl/|Wget/|PostmanRuntime|insomnia|node-fetch|axios/|got \(|'
    r'HTTPie|RestSharp|okhttp-bot|Guzzle|Faraday|Typhoeus'
    r')',
    re.I,
)

WRITE_METHODS = frozenset({'POST', 'PUT', 'PATCH', 'DELETE'})

# Paths the guard never touches. /admin/ is staff-only behind a login and
# locking ourselves out of it over a UA string is a worse failure than the
# one we're preventing; the error sink has to keep accepting reports from
# whatever context crashed.
EXEMPT_PREFIXES = ('/admin/', '/api/error-log', '/.well-known/')


def _deny(reason):
    return JsonResponse(
        {'error': 'So\'rov rad etildi.', 'reason': reason},
        status=403,
    )


class BotGuardMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path

        if path.startswith(EXEMPT_PREFIXES):
            return self.get_response(request)

        ua = request.META.get('HTTP_USER_AGENT', '')

        if SCRAPER_UA_RE.search(ua):
            return _deny('scraper')

        if request.method in WRITE_METHODS and path.startswith('/api/'):
            # Every real browser and webview sends a User-Agent. A write
            # with none is a script that didn't bother to set one.
            if not ua.strip():
                return _deny('no-user-agent')
            if AUTOMATION_UA_RE.search(ua):
                return _deny('automation')

        return self.get_response(request)
