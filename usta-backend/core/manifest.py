import os

from django.http import JsonResponse


def manifest_view(request):
    """Serves manifest.json dynamically instead of as a static file, so an
    admin-uploaded logo (site_settings.logotype_path) shows up as the PWA
    icon without a frontend redeploy."""
    from site_settings.models import SiteSettings

    settings_obj = SiteSettings.objects.first()
    logotype_path = settings_obj.logotype_path if settings_obj else None

    # Field defaults mirror the values this view used to hardcode, so an
    # empty/missing SiteSettings row renders the same manifest as before.
    manifest_name = (settings_obj.manifest_name if settings_obj else '') or 'Master Group - Professional Ustalar'
    manifest_short_name = (settings_obj.manifest_short_name if settings_obj else '') or 'Master Group'
    manifest_description = (settings_obj.manifest_description if settings_obj else '') or \
        "O'zbekistondagi eng yaxshi usta va mutaxassislarni topish platformasi"
    theme_color = (settings_obj.manifest_theme_color if settings_obj else '') or '#1D4ED8'
    background_color = (settings_obj.manifest_background_color if settings_obj else '') or '#0F172A'

    icon_src = '/icon-192x192.png'
    icon_src_large = '/icon-512x512.png'
    icons = None
    if logotype_path:
        icon_src = icon_src_large = (
            logotype_path if logotype_path.startswith('http')
            else request.build_absolute_uri(logotype_path)
        )
        # Admin-uploaded logo is an arbitrary image with no pre-rendered
        # safe-zone padding, so it can only be declared "any" - not "maskable".
        icons = [
            {"src": icon_src, "sizes": "192x192", "type": "image/png", "purpose": "any"},
            {"src": icon_src_large, "sizes": "512x512", "type": "image/png", "purpose": "any"},
        ]
    else:
        icons = [
            {"src": icon_src, "sizes": "192x192", "type": "image/png", "purpose": "any"},
            {"src": icon_src_large, "sizes": "512x512", "type": "image/png", "purpose": "any"},
            {"src": "/icon-192x192-maskable.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable"},
            {"src": "/icon-512x512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ]

    manifest = {
        "name": manifest_name,
        "short_name": manifest_short_name,
        "description": manifest_description,
        "id": "/",
        "start_url": "/",
        "display": "standalone",
        "display_override": ["window-controls-overlay", "tabbed", "standalone", "fullscreen"],
        "background_color": background_color,
        "theme_color": theme_color,
        "orientation": "portrait",
        "scope": "/",
        # Only needed when the API answers from a different origin than the
        # PWA, as it did on PythonAnywhere. Behind nginx the two share an
        # origin, so this stays empty unless PWA_SCOPE_EXTENSIONS names one.
        "scope_extensions": [
            {"origin": o.strip()}
            for o in os.getenv('PWA_SCOPE_EXTENSIONS', '').split(',') if o.strip()
        ],
        "tab_strip": {
            "home_tab": {"scope_patterns": [{"pathname": "/app/*"}]},
            "new_tab_button": {"url": "/app"},
        },
        "lang": "uz",
        "dir": "ltr",
        "categories": ["business", "lifestyle"],
        "prefer_related_applications": False,
        "related_applications": [
            {
                "platform": "play",
                "id": "app.vercel.ustalar_sand.twa",
                "url": "https://play.google.com/store/apps/details?id=app.vercel.ustalar_sand.twa",
            },
        ],
        "protocol_handlers": [
            {"protocol": "web+usta", "url": "https://mastergroup.uz/?handler=%s"},
        ],
        "iarc_rating_id": "e59e0c31-4994-465e-91f6-b0f016e1d231",
        "icons": icons,
        "screenshots": [
            {
                "src": "/screenshot-mobile.png", "sizes": "1230x1729", "type": "image/png",
                "platform": "mobile", "form_factor": "narrow",
                "label": "Master Group ilovasi — mobil qurilmada",
            },
            {
                "src": "/screenshot-desktop.png", "sizes": "1920x1080", "type": "image/png",
                "platform": "desktop", "form_factor": "wide",
                "label": "Master Group ilovasi — ish stolida",
            },
        ],
        "shortcuts": [
            {
                "name": "Ustalar ro'yxati", "short_name": "Ustalar", "url": "/app",
                "description": "Barcha professional ustalarni ko'rish",
                "icons": [{"src": "/icon-192x192.png", "sizes": "192x192", "type": "image/png"}],
            },
            {
                "name": "Buyurtmalarim", "short_name": "Buyurtmalar", "url": "/app/orders",
                "description": "Joriy va tarixiy buyurtmalar",
                "icons": [{"src": "/icon-192x192.png", "sizes": "192x192", "type": "image/png"}],
            },
            {
                "name": "Profilim", "short_name": "Profil", "url": "/app/profile",
                "description": "Shaxsiy profil va sozlamalar",
                "icons": [{"src": "/icon-192x192.png", "sizes": "192x192", "type": "image/png"}],
            },
        ],
        "launch_handler": {"client_mode": "navigate-existing"},
        "share_target": {
            "action": "/", "method": "GET",
            "params": {"title": "name", "text": "description", "url": "link"},
        },
        "file_handlers": [
            {"action": "/", "accept": {"image/*": [".png", ".jpg", ".jpeg", ".webp"]}},
        ],
        "widgets": [
            {
                "name": "Master Group", "description": "Tezkor ustalarni topish", "tag": "usta-widget",
                "ms_ac_template": "", "data": "",
                "links": [{"href": "/app"}],
            },
        ],
        "edge_side_panel": {"preferred_width": 400},
        "note_taking": {"new_note_url": "/app"},
    }
    return JsonResponse(manifest, content_type='application/manifest+json')
