import os

from django.http import JsonResponse


def manifest_view(request):
    """Serves manifest.json dynamically instead of as a static file, so an
    admin-uploaded logo (site_settings.logotype_path) shows up as the PWA
    icon without a frontend redeploy."""
    from site_settings.models import SiteSettings

    settings_obj = SiteSettings.objects.first()
    logotype_path = settings_obj.logotype_path if settings_obj else None

    def field(name, fallback):
        value = getattr(settings_obj, name, None) if settings_obj else None
        return value if value not in (None, '') else fallback

    # Field defaults mirror the values this view used to hardcode, so an
    # empty/missing SiteSettings row renders the same manifest as before.
    manifest_name = field('manifest_name', 'Master Group - Professional Ustalar')
    manifest_short_name = field('manifest_short_name', 'Master Group')
    manifest_description = field(
        'manifest_description',
        "O'zbekistondagi eng yaxshi usta va mutaxassislarni topish platformasi",
    )
    theme_color = field('manifest_theme_color', '#1D4ED8')
    background_color = field('manifest_background_color', '#0F172A')

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

    from site_settings.models import (
        default_manifest_categories, default_manifest_display_override,
        default_manifest_edge_side_panel, default_manifest_file_handlers,
        default_manifest_launch_handler, default_manifest_note_taking,
        default_manifest_protocol_handlers, default_manifest_related_applications,
        default_manifest_screenshots, default_manifest_share_target,
        default_manifest_shortcuts, default_manifest_tab_strip, default_manifest_widgets,
    )

    manifest = {
        "name": manifest_name,
        "short_name": manifest_short_name,
        "description": manifest_description,
        "id": field('manifest_id', '/'),
        "start_url": field('manifest_start_url', '/'),
        "display": field('manifest_display', 'standalone'),
        "display_override": field('manifest_display_override', None) or default_manifest_display_override(),
        "background_color": background_color,
        "theme_color": theme_color,
        "orientation": field('manifest_orientation', 'portrait'),
        "scope": field('manifest_scope', '/'),
        # Only needed when the API answers from a different origin than the
        # PWA, as it did on PythonAnywhere. Behind nginx the two share an
        # origin, so this stays empty unless PWA_SCOPE_EXTENSIONS names one.
        "scope_extensions": [
            {"origin": o.strip()}
            for o in os.getenv('PWA_SCOPE_EXTENSIONS', '').split(',') if o.strip()
        ],
        "tab_strip": field('manifest_tab_strip', None) or default_manifest_tab_strip(),
        "lang": field('manifest_lang', 'uz'),
        "dir": field('manifest_dir', 'ltr'),
        "categories": field('manifest_categories', None) or default_manifest_categories(),
        "prefer_related_applications": bool(getattr(settings_obj, 'manifest_prefer_related_applications', False)),
        "related_applications": field('manifest_related_applications', None) or default_manifest_related_applications(),
        "protocol_handlers": field('manifest_protocol_handlers', None) or default_manifest_protocol_handlers(),
        "iarc_rating_id": field('manifest_iarc_rating_id', 'e59e0c31-4994-465e-91f6-b0f016e1d231'),
        "icons": icons,
        "screenshots": field('manifest_screenshots', None) or default_manifest_screenshots(),
        "shortcuts": field('manifest_shortcuts', None) or default_manifest_shortcuts(),
        "launch_handler": field('manifest_launch_handler', None) or default_manifest_launch_handler(),
        "share_target": field('manifest_share_target', None) or default_manifest_share_target(),
        "file_handlers": field('manifest_file_handlers', None) or default_manifest_file_handlers(),
        "widgets": field('manifest_widgets', None) or default_manifest_widgets(),
        "edge_side_panel": field('manifest_edge_side_panel', None) or default_manifest_edge_side_panel(),
        "note_taking": field('manifest_note_taking', None) or default_manifest_note_taking(),
    }
    return JsonResponse(manifest, content_type='application/manifest+json')
